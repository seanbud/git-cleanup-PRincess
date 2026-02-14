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
        return res.success ? res.stdout.trim() : 'origin/main';
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

    static async getStatusFiles(): Promise<GitFile[]> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd('git status --porcelain');
        if (!res.success || !res.stdout.trim()) return [];

        const lines = res.stdout.split('\n').filter(Boolean);
        const files: GitFile[] = lines.map((line: string, index: number) => {
            const code = line.substring(0, 2);
            const filePath = line.substring(3).trim();

            let status = FileStatus.MODIFIED;
            if (code.includes('A') || code.includes('?')) status = FileStatus.ADDED;
            if (code.includes('D')) status = FileStatus.DELETED;
            if (code.includes('R')) status = FileStatus.RENAMED;

            return {
                id: `file-${index}`,
                path: filePath,
                status,
                changeType: ChangeType.UNCOMMITTED,
                linesAdded: 0,
                linesRemoved: 0
            };
        });

        // Fetch line stats in bulk
        // @ts-ignore
        const numstatRes = await window.electronAPI.gitCmd('git diff --numstat');
        if (numstatRes.success && numstatRes.stdout.trim()) {
            const statLines = numstatRes.stdout.split('\n').filter(Boolean);
            const statMap = new Map<string, { added: number; removed: number }>();
            for (const sl of statLines) {
                const parts = sl.split('\t');
                if (parts.length >= 3) {
                    const added = parseInt(parts[0]) || 0;
                    const removed = parseInt(parts[1]) || 0;
                    statMap.set(parts[2], { added, removed });
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

        // Also check for staged numstat
        // @ts-ignore
        const stagedRes = await window.electronAPI.gitCmd('git diff --cached --numstat');
        if (stagedRes.success && stagedRes.stdout.trim()) {
            const statLines = stagedRes.stdout.split('\n').filter(Boolean);
            for (const sl of statLines) {
                const parts = sl.split('\t');
                if (parts.length >= 3) {
                    const added = parseInt(parts[0]) || 0;
                    const removed = parseInt(parts[1]) || 0;
                    const path = parts[2];
                    const file = files.find(f => f.path === path);
                    if (file && file.linesAdded === 0 && file.linesRemoved === 0) {
                        file.linesAdded = added;
                        file.linesRemoved = removed;
                    }
                }
            }
        }

        return files;
    }

    static async getDiff(filePath: string): Promise<string> {
        // Try unstaged diff first
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

    static async restoreFile(filePath: string): Promise<boolean> {
        // For staged files, unstage first
        // @ts-ignore
        await window.electronAPI.gitCmd(`git reset HEAD -- "${filePath}"`);
        // Then restore working tree
        // @ts-ignore
        const res = await window.electronAPI.gitCmd(`git checkout -- "${filePath}"`);
        return res.success;
    }

    static async removeFile(filePath: string): Promise<boolean> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd(`git rm -f "${filePath}"`);
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
}
