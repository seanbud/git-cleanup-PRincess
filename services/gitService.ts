import { GitFile, FileStatus, ChangeType, GitConfig } from '../types';

const git = (...args: string[]) => (window.electronAPI as any).gitCmd(args);

export interface CommitNode {
    hash: string;
    parents: string[];
    author: string;
    message: string;
    branch?: string;
    isMerge: boolean;
}

const BINARY_EXTENSIONS = new Set([
    '.fbx', '.obj', '.glb', '.gltf', '.blend', '.stl', '.3ds', '.dae',
    '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma',
    '.ttf', '.otf', '.woff', '.woff2', '.eot',
    '.mp4', '.webm', '.avi', '.mov', '.mkv',
    '.zip', '.tar', '.gz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.psd', '.ai',
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'
]);

function isTextFile(filePath: string): boolean {
    const ext = '.' + filePath.split('.').pop()?.toLowerCase();
    return !BINARY_EXTENSIONS.has(ext);
}

export class GitService {
    static async getRepoName(): Promise<string> {
        try {
            const res = await git('remote', 'get-url', 'origin');
            if (!res.success) {
                // Fallback: use directory name
                const dirRes = await git('rev-parse', '--show-toplevel');
                if (dirRes.success) {
                    const parts = dirRes.stdout.trim().replace(/\\/g, '/').split('/');
                    return parts[parts.length - 1];
                }
                return 'unknown-repo';
            }
            const parts = res.stdout.trim().split('/');
            return parts[parts.length - 1].replace('.git', '');
        } catch {
            return 'unknown-repo';
        }
    }

    static async getCurrentBranch(): Promise<string> {
        const res = await git('rev-parse', '--abbrev-ref', 'HEAD');
        return res.success ? res.stdout.trim() : 'main';
    }

    static async getUpstreamBranch(): Promise<string> {
        const res = await git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}');
        return res.success ? res.stdout.trim() : '';
    }

    static async getBestComparisonBranch(): Promise<string> {
        // 1. Try upstream
        const upstream = await this.getUpstreamBranch();
        if (upstream) return upstream;

        // 2. Try common branches
        const common = ['develop', 'development', 'main', 'master'];
        const branches = await this.getBranches();

        for (const target of common) {
            if (branches.includes(target)) {
                // Verify it's not the same branch
                const current = await this.getCurrentBranch();
                if (current !== target) return target;
            }
        }

        // 3. Check for remote versions of common branches
        const remoteRes = await git('branch', '-r');
        if (remoteRes.success) {
            const remoteBranches = remoteRes.stdout.split('\n').map((b: string) => b.trim());
            for (const target of common) {
                const rTarget = `origin/${target}`;
                if (remoteBranches.some((rb: string) => rb.includes(rTarget))) {
                    const current = await this.getCurrentBranch();
                    if (current !== rTarget) return rTarget;
                }
            }
        }

        // 4. Fallback to self
        return await this.getCurrentBranch();
    }

    static async getBranches(): Promise<string[]> {
        const res = await git('branch', '--list', '--no-color');
        if (!res.success) return ['main'];
        return res.stdout
            .split('\n')
            .filter(Boolean)
            .map((b: string) => b.replace('*', '').trim());
    }

    static async getStatusFiles(comparisonBranch?: string): Promise<GitFile[]> {
        const files: GitFile[] = [];
        const seenPaths = new Set<string>();

        // Optimization: Parallelize initial state gathering (status + current branch)
        const [statusRes, currentBranch] = await Promise.all([
            git('status', '--porcelain'),
            this.getCurrentBranch()
        ]);

        if (statusRes.success && statusRes.stdout.trim()) {
            const lines = statusRes.stdout.split('\n').filter(Boolean);
            lines.forEach((line: string) => {
                const code = line.substring(0, 2);
                let filePath = line.substring(3).trim();
                if (filePath.startsWith('"') && filePath.endsWith('"')) {
                    filePath = filePath.substring(1, filePath.length - 1);
                }

                let status = FileStatus.MODIFIED;
                if (code.includes('A') || code.includes('?')) status = FileStatus.ADDED;
                if (code.includes('D')) status = FileStatus.DELETED;
                if (code.includes('R')) status = FileStatus.RENAMED;

                files.push({
                    id: `status:${filePath}`,
                    path: filePath,
                    status,
                    changeType: ChangeType.UNCOMMITTED,
                    linesAdded: 0,
                    linesRemoved: 0
                });
                seenPaths.add(filePath);
            });
        }

        // Optimization: Parallelize all remaining independent git diff calls
        const isComparing = comparisonBranch && comparisonBranch !== currentBranch;
        const [diffRes, localStats, stagedStats, branchStats] = await Promise.all([
            isComparing ? git('diff', '--name-status', `${comparisonBranch}...HEAD`) : Promise.resolve({ success: false, stdout: '' }),
            git('diff', '--numstat', '--text'),
            git('diff', '--numstat', '--text', '--cached'),
            isComparing ? git('diff', '--numstat', '--text', `${comparisonBranch}...HEAD`) : Promise.resolve({ success: false, stdout: '' })
        ]);

        if (diffRes.success && diffRes.stdout.trim()) {
            const lines = diffRes.stdout.split('\n').filter(Boolean);
            lines.forEach((line: string) => {
                const parts = line.split(/\s+/);
                const code = parts[0];
                const filePath = parts[parts.length - 1];

                // Skip if already seen in status (local changes take priority)
                if (seenPaths.has(filePath)) return;

                let status = FileStatus.MODIFIED;
                if (code.startsWith('A')) status = FileStatus.ADDED;
                if (code.startsWith('D')) status = FileStatus.DELETED;
                if (code.startsWith('R')) status = FileStatus.RENAMED;

                files.push({
                    id: `diff:${filePath}`,
                    path: filePath,
                    status,
                    changeType: ChangeType.COMMITTED,
                    linesAdded: 0,
                    linesRemoved: 0
                });
            });
        }

        // Fetch line stats
        const statMap = new Map<string, { added: number; removed: number }>();
        const addStats = (stdout: string) => {
            const lines = stdout.split('\n').filter(Boolean);
            for (const line of lines) {
                const parts = line.split('\t');
                if (parts.length >= 3) {
                    const added = parseInt(parts[0]) || 0;
                    const removed = parseInt(parts[1]) || 0;
                    let p = parts[2];
                    if (p.startsWith('"') && p.endsWith('"')) {
                        p = p.substring(1, p.length - 1);
                    }
                    const existing = statMap.get(p) || { added: 0, removed: 0 };
                    statMap.set(p, { added: existing.added + added, removed: existing.removed + removed });
                }
            }
        };

        if (localStats.success) addStats(localStats.stdout);
        if (stagedStats.success) addStats(stagedStats.stdout);
        if (branchStats.success) addStats(branchStats.stdout);

        // Apply stats to files
        for (const file of files) {
            const stats = statMap.get(file.path);
            if (stats) {
                file.linesAdded = stats.added;
                file.linesRemoved = stats.removed;
            }
        }

        return files;
    }

    static async getDiff(filePath: string, comparisonBranch?: string): Promise<string> {
        const currentBranch = await this.getCurrentBranch();
        const args = isTextFile(filePath) ? ['--text'] : [];

        // If comparing to another branch, we want the total diff (committed + uncommitted)
        // relative to the merge-base, to match the summed statistics shown in the sidebar.
        if (comparisonBranch && comparisonBranch !== currentBranch) {
            const mbRes = await git('merge-base', comparisonBranch, 'HEAD');
            if (mbRes.success && mbRes.stdout.trim()) {
                const mergeBase = mbRes.stdout.trim();
                const res = await git('diff', ...args, mergeBase, '--', filePath);
                if (res.success && res.stdout.trim()) return res.stdout;
            }
        }

        // Fallback or normal local diff (unstaged + staged)
        const res = await git('diff', ...args, 'HEAD', '--', filePath);
        if (res.success && res.stdout.trim()) return res.stdout;

        // Try staged diff separately if HEAD didn't work (e.g. initial commit)
        const stagedRes = await git('diff', ...args, '--cached', '--', filePath);
        if (stagedRes.success && stagedRes.stdout.trim()) return stagedRes.stdout;

        // Final fallback: try to show the file content itself if it's untracked
        const untrackedRes = await git('diff', '--no-index', ...args, '--', '/dev/null', filePath);
        if (untrackedRes.stdout.trim()) return untrackedRes.stdout;

        return 'No diff available';
    }

    static async getGitConfig(): Promise<GitConfig> {
        // Optimization: Parallelize git config lookups to reduce total latency
        const [name, email, defaultBranch] = await Promise.all([
            (window.electronAPI as any).gitConfigGet('user.name'),
            (window.electronAPI as any).gitConfigGet('user.email'),
            (window.electronAPI as any).gitConfigGet('init.defaultBranch')
        ]);

        return {
            name: name || '',
            email: email || '',
            defaultBranch: defaultBranch || 'main'
        };
    }

    static async setGitConfig(key: string, value: string): Promise<boolean> {
        const res = await git('config', key, value);
        return res.success;
    }

    static async restoreFile(filePath: string, comparisonBranch?: string): Promise<boolean> {
        return this.restoreFiles([filePath], comparisonBranch);
    }

    static async restoreFiles(filePaths: string[], comparisonBranch?: string): Promise<boolean> {
        if (filePaths.length === 0) return true;
        const currentBranch = await this.getCurrentBranch();

        // If restoring FROM a base branch (making it match the base)
        if (comparisonBranch && comparisonBranch !== currentBranch) {
            const res = await git('checkout', comparisonBranch, '--', ...filePaths);
            return res.success;
        }

        // Normal batch unstage + restore
        await git('reset', 'HEAD', '--', ...filePaths);
        const res = await git('checkout', '--', ...filePaths);
        return res.success;
    }

    static async discardChanges(filePaths: string[]): Promise<boolean> {
        if (filePaths.length === 0) return true;

        // 1. Unstage everything in the list
        await git('reset', 'HEAD', '--', ...filePaths);

        // 2. Restore working tree for tracked files (Modified/Deleted)
        const restoreRes = await git('checkout', '--', ...filePaths);

        // 3. Optional: Remove untracked files (Added/Untracked)
        // Only if they are actually untracked (not just staged).
        // For simplicity and safety in a "Princess" tool, we might just stick to tracked files 
        // or specifically handle untracked if they exist.

        return restoreRes.success;
    }

    static async removeFile(filePath: string): Promise<boolean> {
        return this.removeFiles([filePath]);
    }

    static async removeFiles(filePaths: string[]): Promise<boolean> {
        if (filePaths.length === 0) return true;
        // Optimization: Use a single git rm command for all files to avoid overhead
        await git('rm', '--cached', '-f', '--ignore-unmatch', ...filePaths);

        // Optimization: Parallelize file trashing via IPC
        const results = await Promise.all(filePaths.map(path => (window.electronAPI as any).trashFile(path)));
        return results.every(res => res && res.success);
    }

    static async getCommitGraph(): Promise<CommitNode[]> {
        // Fetch more commits to build a better graph and include parent hashes (%p) and author (%an)
        const res = await git('log', '--all', '--date-order', '--format=%h|%p|%s|%D|%an', '-n', '50');
        if (!res.success) return [];

        return res.stdout
            .split('\n')
            .filter(Boolean)
            .map((line: string) => {
                const parts = line.split('|');
                const hash = parts[0]?.trim() || '';
                const parentsStr = parts[1]?.trim() || '';
                const message = parts[2]?.trim() || '';
                const refs = parts[3]?.trim() || '';
                const author = parts[4]?.trim() || '';

                return {
                    hash,
                    parents: parentsStr ? parentsStr.split(' ') : [],
                    author,
                    message,
                    branch: refs || undefined,
                    isMerge: parentsStr.split(' ').length > 1 || message.toLowerCase().startsWith('merge')
                };
            });
    }

    static async fetch(): Promise<boolean> {
        const res = await git('fetch', '--all');
        return res.success;
    }

    static async pull(): Promise<{ success: boolean; message: string }> {
        const res = await git('pull');
        return { success: res.success, message: res.success ? res.stdout : res.stderr };
    }

    static async push(): Promise<{ success: boolean; message: string }> {
        const res = await git('push');
        return { success: res.success, message: res.success ? res.stdout : res.stderr };
    }

    static async checkoutBranch(branchName: string): Promise<boolean> {
        const res = await git('checkout', branchName);
        return res.success;
    }

    static async createBranch(branchName: string): Promise<boolean> {
        const res = await git('checkout', '-b', branchName);
        return res.success;
    }

    static async deleteBranch(branchName: string): Promise<boolean> {
        const res = await git('branch', '-d', branchName);
        return res.success;
    }

    static async getRemoteUrl(): Promise<string> {
        const res = await git('remote', 'get-url', 'origin');
        if (!res.success) return '';
        return res.stdout.trim().replace('git@github.com:', 'https://github.com/').replace('.git', '');
    }

    static async getAppSettings(): Promise<any> {
        // @ts-ignore
        return await window.electronAPI.getAppSettings();
    }

    static async saveAppSettings(settings: any): Promise<void> {
        // @ts-ignore
        await window.electronAPI.saveAppSettings(settings);
    }
}
