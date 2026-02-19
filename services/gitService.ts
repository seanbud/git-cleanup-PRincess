import { GitFile, FileStatus, ChangeType, GitConfig } from '../types';

export interface CommitNode {
    hash: string;
    message: string;
    branch?: string;
    isMerge: boolean;
}

export class GitService {
    static async getRepoName(): Promise<string> {
        try {
            // @ts-ignore
            const res = await window.electronAPI.gitCmd('git remote get-url origin');
            if (!res.success) {
                // Fallback: use directory name
                // @ts-ignore
                const dirRes = await window.electronAPI.gitCmd('git rev-parse --show-toplevel');
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
        // @ts-ignore
        const res = await window.electronAPI.gitCmd('git rev-parse --abbrev-ref HEAD');
        return res.success ? res.stdout.trim() : 'main';
    }

    static async getUpstreamBranch(): Promise<string> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd('git rev-parse --abbrev-ref --symbolic-full-name @{u}');
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
        // @ts-ignore
        const remoteRes = await window.electronAPI.gitCmd('git branch -r');
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
        // @ts-ignore
        const res = await window.electronAPI.gitCmd('git branch --list --no-color');
        if (!res.success) return ['main'];
        return res.stdout
            .split('\n')
            .filter(Boolean)
            .map((b: string) => b.replace('*', '').trim());
    }

    static async getStatusFiles(comparisonBranch?: string): Promise<GitFile[]> {
        const files: GitFile[] = [];
        const seenPaths = new Set<string>();

        // 1. Get uncommitted files (Status)
        // @ts-ignore
        const res = await window.electronAPI.gitCmd('git status --porcelain');
        if (res.success && res.stdout.trim()) {
            const lines = res.stdout.split('\n').filter(Boolean);
            lines.forEach((line: string, index: number) => {
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
                    id: `status-${index}`,
                    path: filePath,
                    status,
                    changeType: ChangeType.UNCOMMITTED,
                    linesAdded: 0,
                    linesRemoved: 0
                });
                seenPaths.add(filePath);
            });
        }

        // 2. Get committed differences if comparing to another branch
        const currentBranch = await this.getCurrentBranch();
        if (comparisonBranch && comparisonBranch !== currentBranch) {
            // @ts-ignore
            const diffRes = await window.electronAPI.gitCmd(`git diff --name-status ${comparisonBranch}...HEAD`);
            if (diffRes.success && diffRes.stdout.trim()) {
                const lines = diffRes.stdout.split('\n').filter(Boolean);
                lines.forEach((line: string, index: number) => {
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
                        id: `diff-${index}`,
                        path: filePath,
                        status,
                        changeType: ChangeType.COMMITTED,
                        linesAdded: 0,
                        linesRemoved: 0
                    });
                });
            }
        }

        // Fetch line stats
        const diffCmd = comparisonBranch && comparisonBranch !== currentBranch
            ? `git diff --numstat ${comparisonBranch}...HEAD`
            : 'git diff --numstat';

        // @ts-ignore
        const numstatRes = await window.electronAPI.gitCmd(diffCmd);
        if (numstatRes.success && numstatRes.stdout.trim()) {
            const statLines = numstatRes.stdout.split('\n').filter(Boolean);
            const statMap = new Map<string, { added: number; removed: number }>();
            for (const sl of statLines) {
                const parts = sl.split('\t');
                if (parts.length >= 3) {
                    const added = parseInt(parts[0]) || 0;
                    const removed = parseInt(parts[1]) || 0;
                    let p = parts[2];
                    if (p.startsWith('"') && p.endsWith('"')) {
                        p = p.substring(1, p.length - 1);
                    }
                    statMap.set(p, { added, removed });
                }
            }

            for (const file of files) {
                const stats = statMap.get(file.path);
                if (stats) {
                    file.linesAdded = stats.added;
                    file.linesRemoved = stats.removed;
                }
            }
        }

        return files;
    }

    static async getDiff(filePath: string, comparisonBranch?: string): Promise<string> {
        const currentBranch = await this.getCurrentBranch();

        // If comparing branch to branch
        if (comparisonBranch && comparisonBranch !== currentBranch) {
            // @ts-ignore
            const res = await window.electronAPI.gitCmd(`git diff ${comparisonBranch}...HEAD -- "${filePath}"`);
            if (res.success) return res.stdout;
        }

        // Normal local diff (unstaged)
        // @ts-ignore
        const res = await window.electronAPI.gitCmd(`git diff -- "${filePath}"`);
        if (res.success && res.stdout.trim()) return res.stdout;

        // Try staged diff
        // @ts-ignore
        const stagedRes = await window.electronAPI.gitCmd(`git diff --cached -- "${filePath}"`);
        if (stagedRes.success && stagedRes.stdout.trim()) return stagedRes.stdout;

        // For untracked files, show the full file as "added"
        // @ts-ignore
        const catRes = await window.electronAPI.gitCmd(`git show :"${filePath}"`);
        if (catRes.success) return catRes.stdout;

        return 'No diff available';
    }

    static async getGitConfig(): Promise<GitConfig> {
        // @ts-ignore
        const name = await window.electronAPI.gitConfigGet('user.name');
        // @ts-ignore
        const email = await window.electronAPI.gitConfigGet('user.email');
        // @ts-ignore
        const defaultBranch = await window.electronAPI.gitConfigGet('init.defaultBranch') || 'main';

        return { name, email, defaultBranch };
    }

    static async setGitConfig(key: string, value: string): Promise<boolean> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd(`git config "${key}" "${value}"`);
        return res.success;
    }

    static async restoreFile(filePath: string, comparisonBranch?: string): Promise<boolean> {
        const currentBranch = await this.getCurrentBranch();

        // If restoring FROM a base branch (making it match the base)
        if (comparisonBranch && comparisonBranch !== currentBranch) {
            // @ts-ignore
            const res = await window.electronAPI.gitCmd(`git checkout ${comparisonBranch} -- "${filePath}"`);
            return res.success;
        }

        // Normal unstage + restore
        // @ts-ignore
        await window.electronAPI.gitCmd(`git reset HEAD -- "${filePath}"`);
        // @ts-ignore
        const res = await window.electronAPI.gitCmd(`git checkout -- "${filePath}"`);
        return res.success;
    }

    static async discardChanges(filePaths: string[]): Promise<boolean> {
        if (filePaths.length === 0) return true;

        // Wrap in quotes for safety
        const quotedPaths = filePaths.map(p => `"${p}"`).join(' ');

        // 1. Unstage everything in the list
        // @ts-ignore
        await window.electronAPI.gitCmd(`git reset HEAD -- ${quotedPaths}`);

        // 2. Restore working tree for tracked files (Modified/Deleted)
        // @ts-ignore
        const restoreRes = await window.electronAPI.gitCmd(`git checkout -- ${quotedPaths}`);

        // 3. Optional: Remove untracked files (Added/Untracked)
        // Only if they are actually untracked (not just staged).
        // For simplicity and safety in a "Princess" tool, we might just stick to tracked files 
        // or specifically handle untracked if they exist.

        return restoreRes.success;
    }

    static async removeFile(filePath: string): Promise<boolean> {
        // 1. Remove from git index first (keep on disk)
        // Use --ignore-unmatch so it doesn't fail if the file is untracked
        // @ts-ignore
        await window.electronAPI.gitCmd(`git rm --cached -f --ignore-unmatch "${filePath}"`);

        // 2. Move the local file to trash/recycle bin
        // @ts-ignore
        const res = await window.electronAPI.trashFile(filePath);
        return res.success;
    }

    static async getCommitGraph(): Promise<CommitNode[]> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd('git log --oneline --all -n 20 --format="%h|%s|%D"');
        if (!res.success) return [];

        return res.stdout
            .split('\n')
            .filter(Boolean)
            .map((line: string) => {
                const [hash, message, refs] = line.split('|');
                return {
                    hash: hash.trim(),
                    message: message?.trim() || '',
                    branch: refs?.trim() || undefined,
                    isMerge: (message || '').toLowerCase().startsWith('merge')
                };
            });
    }

    static async fetch(): Promise<boolean> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd('git fetch --all');
        return res.success;
    }

    static async pull(): Promise<{ success: boolean; message: string }> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd('git pull');
        return { success: res.success, message: res.success ? res.stdout : res.stderr };
    }

    static async push(): Promise<{ success: boolean; message: string }> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd('git push');
        return { success: res.success, message: res.success ? res.stdout : res.stderr };
    }

    static async checkoutBranch(branchName: string): Promise<boolean> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd(`git checkout "${branchName}"`);
        return res.success;
    }

    static async createBranch(branchName: string): Promise<boolean> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd(`git checkout -b "${branchName}"`);
        return res.success;
    }

    static async deleteBranch(branchName: string): Promise<boolean> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd(`git branch -d "${branchName}"`);
        return res.success;
    }

    static async getRemoteUrl(): Promise<string> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd('git remote get-url origin');
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
