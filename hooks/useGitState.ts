import React, { useState, useCallback, useEffect } from 'react';
import { GitState, GitFile, GitHubUser, GitConfig } from '../types';
import { GitService, CommitNode } from '../services/gitService';
import { audioService } from '../services/audioService';
import { CharacterState } from '../types';

export interface UseGitStateReturn {
    gitState: GitState;
    setGitState: React.Dispatch<React.SetStateAction<GitState>>;
    isProcessing: boolean;
    branches: string[];
    recentRepos: string[];
    commitGraph: CommitNode[];
    selectedDiff: string;
    setSelectedDiff: React.Dispatch<React.SetStateAction<string>>;
    gitConfig: GitConfig;
    setGitConfig: React.Dispatch<React.SetStateAction<GitConfig>>;
    githubUser: GitHubUser | null;
    setGithubUser: React.Dispatch<React.SetStateAction<GitHubUser | null>>;
    refreshGitState: () => Promise<void>;
    loadRecentRepos: () => Promise<void>;
    handleFetch: () => Promise<void>;
    handlePull: () => Promise<void>;
    handlePush: () => Promise<void>;
    handleChangeBranch: (branchName: string) => Promise<void>;
    handleChangeRepo: (repoPath: string) => Promise<void>;
    handleOpenRepo: () => Promise<void>;
    handleOpenGithub: () => Promise<void>;
    handleNewBranch: () => Promise<void>;
    handleAction: (actionType: 'RESTORE' | 'REMOVE', setCharacterState: (state: CharacterState) => void) => Promise<void>;
    handleFileSelect: (file: GitFile) => Promise<void>;
    handleSelectionChange: (newSet: Set<string>) => void;
}

export function useGitState(): UseGitStateReturn {
    const [gitState, setGitState] = useState<GitState>({
        currentBranch: 'main',
        upstreamBranch: 'origin/main',
        repoName: 'loading...',
        files: [],
        selectedFileIds: new Set(),
        lastFetched: 'never'
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [branches, setBranches] = useState<string[]>([]);
    const [recentRepos, setRecentRepos] = useState<string[]>([]);
    const [commitGraph, setCommitGraph] = useState<CommitNode[]>([]);
    const [selectedDiff, setSelectedDiff] = useState<string>('');
    const [gitConfig, setGitConfig] = useState<GitConfig>({ name: '', email: '', defaultBranch: 'main' });
    const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);

    const refreshGitState = useCallback(async () => {
        try {
            const [repoName, currentBranch, upstreamBranch, files, config, branchList, commits] = await Promise.all([
                GitService.getRepoName(),
                GitService.getCurrentBranch(),
                GitService.getUpstreamBranch(),
                GitService.getStatusFiles(),
                GitService.getGitConfig(),
                GitService.getBranches(),
                GitService.getCommitGraph()
            ]);

            setGitState(prev => ({
                ...prev,
                repoName,
                currentBranch,
                upstreamBranch,
                files
            }));
            setGitConfig(config);
            setBranches(branchList);
            setCommitGraph(commits);
        } catch (err) {
            console.error('Failed to refresh git state:', err);
        }
    }, []);

    const loadRecentRepos = useCallback(async () => {
        try {
            // @ts-ignore
            const repos = await window.electronAPI.getRecentRepos();
            setRecentRepos(repos || []);
        } catch { }
    }, []);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        refreshGitState();
        loadRecentRepos();

        const interval = setInterval(refreshGitState, 10000);
        return () => clearInterval(interval);
    }, [refreshGitState, loadRecentRepos]);

    const handleFetch = useCallback(async () => {
        setIsProcessing(true);
        await GitService.fetch();
        await refreshGitState();
        setGitState(prev => ({ ...prev, lastFetched: 'just now' }));
        setIsProcessing(false);
    }, [refreshGitState]);

    const handlePull = useCallback(async () => {
        setIsProcessing(true);
        await GitService.pull();
        await refreshGitState();
        setIsProcessing(false);
    }, [refreshGitState]);

    const handlePush = useCallback(async () => {
        setIsProcessing(true);
        await GitService.push();
        await refreshGitState();
        setIsProcessing(false);
    }, [refreshGitState]);

    const handleChangeBranch = useCallback(async (branchName: string) => {
        setIsProcessing(true);
        await GitService.checkoutBranch(branchName);
        await refreshGitState();
        setIsProcessing(false);
    }, [refreshGitState]);

    const handleChangeRepo = useCallback(async (repoPath: string) => {
        // @ts-ignore
        const result = await window.electronAPI.switchRepo(repoPath);
        if (result.success) {
            await refreshGitState();
            await loadRecentRepos();
        }
    }, [refreshGitState, loadRecentRepos]);

    const handleOpenRepo = useCallback(async () => {
        // @ts-ignore
        const result = await window.electronAPI.openDirectory();
        if (result && !result.error) {
            await refreshGitState();
            await loadRecentRepos();
        }
    }, [refreshGitState, loadRecentRepos]);

    const handleOpenGithub = useCallback(async () => {
        const url = await GitService.getRemoteUrl();
        if (url) {
            // @ts-ignore
            window.electronAPI.openExternal(url);
        }
    }, []);

    const handleNewBranch = useCallback(async () => {
        const name = window.prompt('Enter new branch name:');
        if (name && name.trim()) {
            await GitService.createBranch(name.trim());
            await refreshGitState();
        }
    }, [refreshGitState]);

    const handleAction = useCallback(async (
        actionType: 'RESTORE' | 'REMOVE',
        setCharacterState: (state: CharacterState) => void
    ) => {
        setIsProcessing(true);
        setCharacterState(actionType === 'RESTORE' ? CharacterState.ACTION_GOOD : CharacterState.ACTION_BAD);

        const selectedFiles = gitState.files.filter(f => gitState.selectedFileIds.has(f.id));

        try {
            for (const file of selectedFiles) {
                if (actionType === 'RESTORE') {
                    await GitService.restoreFile(file.path);
                } else {
                    await GitService.removeFile(file.path);
                }
            }

            await refreshGitState();
            setGitState(prev => ({ ...prev, selectedFileIds: new Set() }));
            setIsProcessing(false);

            // Celebration state for 2 seconds
            setCharacterState(CharacterState.CELEBRATING);
            audioService.play('sparkle');
            setTimeout(() => {
                setCharacterState(CharacterState.IDLE);
            }, 2000);

            setSelectedDiff('');
        } catch (err) {
            console.error(err);
            setCharacterState(CharacterState.WORRIED);
            audioService.play('error');
            setTimeout(() => setCharacterState(CharacterState.IDLE), 3000);
            setIsProcessing(false);
        }
    }, [gitState.files, gitState.selectedFileIds, refreshGitState]);

    const handleFileSelect = useCallback(async (file: GitFile) => {
        const newSet = new Set<string>();
        newSet.add(file.id);
        setGitState(prev => ({ ...prev, selectedFileIds: newSet }));

        const diff = await GitService.getDiff(file.path);
        setSelectedDiff(diff);
    }, []);

    const handleSelectionChange = useCallback((newSet: Set<string>) => {
        setGitState(prev => ({ ...prev, selectedFileIds: newSet }));
    }, []);

    return {
        gitState,
        setGitState,
        isProcessing,
        branches,
        recentRepos,
        commitGraph,
        selectedDiff,
        setSelectedDiff,
        gitConfig,
        setGitConfig,
        githubUser,
        setGithubUser,
        refreshGitState,
        loadRecentRepos,
        handleFetch,
        handlePull,
        handlePush,
        handleChangeBranch,
        handleChangeRepo,
        handleOpenRepo,
        handleOpenGithub,
        handleNewBranch,
        handleAction,
        handleFileSelect,
        handleSelectionChange,
    };
}
