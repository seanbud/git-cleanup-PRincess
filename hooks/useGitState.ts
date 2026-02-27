import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GitState, GitFile, GitHubUser, GitConfig, AppSettings } from '../types';
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
    comparisonBranch: string;
    handleSetComparisonBranch: (branch: string) => Promise<void>;
    gitConfig: GitConfig;
    setGitConfig: React.Dispatch<React.SetStateAction<GitConfig>>;
    githubUser: GitHubUser | null;
    setGithubUser: React.Dispatch<React.SetStateAction<GitHubUser | null>>;
    appSettings: AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
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
    handleSelectionChange: (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
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
    const [comparisonBranch, setComparisonBranch] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [branches, setBranches] = useState<string[]>([]);
    const [recentRepos, setRecentRepos] = useState<string[]>([]);
    const [commitGraph, setCommitGraph] = useState<CommitNode[]>([]);
    const [selectedDiff, setSelectedDiff] = useState<string>('');
    const [gitConfig, setGitConfig] = useState<GitConfig>({ name: '', email: '', defaultBranch: 'main' });
    const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
    const [appSettings, setAppSettings] = useState<AppSettings>({
        externalEditor: 'code',
        shell: 'powershell'
    });

    // Ref to always have access to latest files (avoids stale closures)
    const filesRef = useRef<GitFile[]>([]);

    const refreshGitState = useCallback(async () => {
        try {
            // Optimization: Fetch core metadata in parallel.
            const [repoName, currentBranch, upstreamBranch, config, branchList, commits, settings] = await Promise.all([
                GitService.getRepoName(),
                GitService.getCurrentBranch(),
                GitService.getUpstreamBranch(),
                GitService.getGitConfig(),
                GitService.getBranches(),
                GitService.getCommitGraph(),
                GitService.getAppSettings(),
            ]);

            // Optimization: Pass currentBranch and branchList to avoid redundant lookups.
            const bestComp = await GitService.getBestComparisonBranch(currentBranch, branchList);

            // If we don't have a comparison branch set yet, use the best guess
            let activeComp = comparisonBranch;
            if (!activeComp) {
                activeComp = bestComp;
                setComparisonBranch(bestComp);
            }

            // Optimization: Pass currentBranch to avoid redundant lookup inside getStatusFiles.
            const files = await GitService.getStatusFiles(activeComp, currentBranch);

            setGitState(prev => ({
                ...prev,
                repoName,
                currentBranch,
                upstreamBranch,
                files
            }));
            filesRef.current = files;
            setGitConfig(config);
            setBranches(branchList);
            setCommitGraph(commits);
            if (settings) {
                setAppSettings(settings);
            }
        } catch (err) {
            console.error('Failed to refresh git state:', err);
        }
    }, [comparisonBranch]);

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
        setComparisonBranch(''); // Reset so it re-detects for the new branch
        await refreshGitState();
        setIsProcessing(false);
    }, [refreshGitState]);

    const handleSetComparisonBranch = useCallback(async (branch: string) => {
        setComparisonBranch(branch);
        // Explicitly refresh with the new comparison
        setIsProcessing(true);
        try {
            const files = await GitService.getStatusFiles(branch);
            setGitState(prev => ({ ...prev, files }));
            filesRef.current = files;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const handleChangeRepo = useCallback(async (repoPath: string) => {
        // @ts-ignore
        const result = await window.electronAPI.switchRepo(repoPath);
        if (result.success) {
            setComparisonBranch(''); // Reset for new repo
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
        const paths = selectedFiles.map(f => f.path);

        try {
            // Optimization: Use bulk operations instead of O(N) sequential loop.
            if (actionType === 'RESTORE') {
                await GitService.restoreFiles(paths);
            } else {
                await GitService.removeFiles(paths);
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

    const handleFileSelect = useCallback((file: GitFile) => {
        setGitState(prev => {
            const newSet = new Set<string>();
            newSet.add(file.id);
            return { ...prev, selectedFileIds: newSet };
        });
    }, []);

    const handleSelectionChange = useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
        setGitState(prev => ({
            ...prev,
            selectedFileIds: typeof updater === 'function' ? updater(prev.selectedFileIds) : updater
        }));
    }, []);

    // Optimization: Identify the selected file for diff fetching.
    // We use the file object from the state as a dependency to ensure we re-fetch
    // if the state is refreshed (e.g. via auto-refresh).
    const selectedFile = React.useMemo(() => {
        if (gitState.selectedFileIds.size !== 1) return null;
        const id = Array.from(gitState.selectedFileIds)[0];
        return gitState.files.find(f => f.id === id) || null;
    }, [gitState.selectedFileIds, gitState.files]);

    // Automatically fetch diff when selection changes to exactly one file
    useEffect(() => {
        let isMounted = true;
        const fetchDiff = async () => {
            if (selectedFile) {
                const diff = await GitService.getDiff(selectedFile.path, comparisonBranch);
                if (isMounted) setSelectedDiff(diff);
            } else {
                setSelectedDiff('');
            }
        };
        fetchDiff();
        return () => { isMounted = false; };
    }, [selectedFile, comparisonBranch]);

    return {
        gitState,
        setGitState,
        isProcessing,
        branches,
        recentRepos,
        commitGraph,
        selectedDiff,
        setSelectedDiff,
        comparisonBranch,
        handleSetComparisonBranch,
        gitConfig,
        setGitConfig,
        githubUser,
        setGithubUser,
        appSettings,
        setAppSettings,
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
