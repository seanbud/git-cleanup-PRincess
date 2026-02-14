import { GitFile, FileStatus, ChangeType, GitConfig } from '../types';

export class GitService {
    static async getRepoName(): Promise<string> {
        try {
            // @ts-ignore
            const res = await window.electronAPI.gitCmd('git remote get-url origin');
            if (!res.success) return 'git-cleanup-PRincess';
            const parts = res.stdout.trim().split('/');
            return parts[parts.length - 1].replace('.git', '');
        } catch {
            return 'git-cleanup-PRincess';
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

    static async getStatusFiles(): Promise<GitFile[]> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd('git status --porcelain');
        if (!res.success) return [];

        const lines = res.stdout.split('\n').filter(Boolean);
        return lines.map((line, index) => {
            const code = line.substring(0, 2);
            const path = line.substring(3);

            let status = FileStatus.MODIFIED;
            if (code.includes('A')) status = FileStatus.ADDED;
            if (code.includes('D')) status = FileStatus.DELETED;
            if (code.includes('R')) status = FileStatus.RENAMED;

            return {
                id: `file-${index}`,
                path,
                status,
                changeType: ChangeType.UNCOMMITTED,
                linesAdded: 0, // In a real app we'd fetch this via diff --numstat
                linesRemoved: 0
            };
        });
    }

    static async getDiff(filePath: string): Promise<string> {
        // @ts-ignore
        const res = await window.electronAPI.gitCmd(`git diff ${filePath}`);
        return res.success ? res.stdout : 'No diff available';
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
}
