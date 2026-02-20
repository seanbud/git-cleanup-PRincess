import React, { useState, useEffect, useRef } from 'react';
import { GitFile, CharacterState, ThemeMode } from './types';
import { GitService } from './services/gitService';
import TopMenuBar from './components/TopMenuBar';
import ProductTitleBar from './components/ProductTitleBar';
import RepoHeader from './components/RepoHeader';
import NetworkGraph from './components/NetworkGraph';
import FileList from './components/FileList';
import DiffView from './components/DiffView';
import Character from './components/Character';
import ActionPanel from './components/ActionPanel';
import ContextMenu from './components/ContextMenu';
import DustSpore from './components/DustSpore';
import OptionsModal from './components/OptionsModal';
import SignInModal from './components/SignInModal';
import UpdateBanner from './components/UpdateBanner';
import AboutModal from './components/AboutModal';
import UpdateCheckModal from './components/UpdateCheckModal';

import { useGitState } from './hooks/useGitState';
import { useCharacter } from './hooks/useCharacter';
import { useResizableSidebar } from './hooks/useResizableSidebar';
import { useContextMenu } from './hooks/useContextMenu';
import { useFileFilter } from './hooks/useFileFilter';

const App: React.FC = () => {
  // ─── Theme ─────────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.PRINCESS);
  const [actionHover, setActionHover] = useState<'REMOVE' | 'RESTORE' | null>(null);
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);

  // ─── Modal State ───────────────────────────────────────────────
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isUpdateCheckOpen, setIsUpdateCheckOpen] = useState(false);

  // ─── Custom Hooks ──────────────────────────────────────────────
  const git = useGitState();

  const { characterState, setCharacterState } = useCharacter({
    selectedCount: git.gitState.selectedFileIds.size,
    isProcessing: git.isProcessing,
    actionHover,
  });

  const { sidebarWidth, isResizing, sidebarRef, startResizing } = useResizableSidebar(320);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleDiscardChanges = React.useCallback(async (files: GitFile[]) => {
    if (files.length === 0) return;

    const confirmMessage = files.length === 1
      ? `Are you sure you want to discard changes in ${files[0].path}?`
      : `Are you sure you want to discard changes in ${files.length} files?`;

    if (!confirm(confirmMessage)) return;

    // Trigger character reaction
    setCharacterState(CharacterState.ACTION_GOOD);

    const paths = files.map(f => f.path);
    const success = await GitService.discardChanges(paths);

    if (success) {
      git.refreshGitState();
      // Keep state for a bit for the animation
      setTimeout(() => setCharacterState(CharacterState.IDLE), 2000);
    } else {
      alert('Failed to discard changes.');
      setCharacterState(CharacterState.IDLE);
    }
  }, [git.refreshGitState, setCharacterState]);

  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu({
    currentBranch: git.gitState.currentBranch,
    onOpenGithub: git.handleOpenGithub,
    onDiscardChanges: handleDiscardChanges,
    appSettings: git.appSettings
  });

  const {
    searchQuery,
    setSearchQuery,
    filteredFiles,
    allFilteredSelected,
    selectAllRef,
    toggleSelectAll,
  } = useFileFilter({
    files: git.gitState.files,
    selectedFileIds: git.gitState.selectedFileIds,
    onSelectionChange: git.handleSelectionChange,
  });

  // ─── Keyboard Shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // '/' to focus search, if not already in an input
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Auth Init ─────────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      // @ts-ignore
      const isAuthenticated = await window.electronAPI.githubIsAuthenticated();
      if (isAuthenticated) {
        // @ts-ignore
        const user = await window.electronAPI.githubGetUser();
        git.setGithubUser(user);
      } else {
        setIsSignInOpen(true);
      }
    };
    initAuth();
  }, []);

  // ─── Derived Values ────────────────────────────────────────────
  const toggleTheme = () => {
    const newMode = themeMode === ThemeMode.PRINCESS ? ThemeMode.PRINCE : ThemeMode.PRINCESS;
    setThemeMode(newMode);

    // Update Electron title bar overlay color
    const overlayOptions = newMode === ThemeMode.PRINCESS
      ? { color: '#fff0f6', symbolColor: '#742a2a' }
      : { color: '#eef5ff', symbolColor: '#1e293b' };

    // @ts-ignore
    window.electronAPI.setTitleBarOverlay?.(overlayOptions);
  };

  const handleAction = async (actionType: 'RESTORE' | 'REMOVE') => {
    await git.handleAction(actionType, setCharacterState);
  };

  const selectedFileId = Array.from(git.gitState.selectedFileIds)[0];
  const selectedFile = git.gitState.files.find(f => f.id === selectedFileId) || null;
  const isMultipleSelected = git.gitState.selectedFileIds.size > 1;

  const isPrincess = themeMode === ThemeMode.PRINCESS;
  const appBgClass = isPrincess ? 'bg-[#fff5f9]' : 'bg-[#f4faff]';
  const sidebarHeaderBg = isPrincess ? 'bg-[#fff0f6]' : 'bg-[#e0efff]/50';

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden text-sm ${appBgClass} font-sans transition-colors duration-300 rounded-[2px] border border-black/10 shadow-inner`}>
      <UpdateBanner mode={themeMode} />
      <div className="z-[100]">
        <TopMenuBar
          mode={themeMode}
          onToggleTheme={toggleTheme}
          onOpenOptions={() => setIsOptionsOpen(true)}
          onOpenRepo={git.handleOpenRepo}
          onFetch={git.handleFetch}
          onPull={git.handlePull}
          onPush={git.handlePush}
          onOpenGithub={git.handleOpenGithub}
          onRefresh={git.refreshGitState}
          onOpenAbout={() => setIsAboutOpen(true)}
          onCheckUpdate={() => setIsUpdateCheckOpen(true)}
        />
      </div>
      <ProductTitleBar mode={themeMode} onToggleTheme={toggleTheme} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Repository Header */}
        <RepoHeader
          mode={themeMode}
          state={git.gitState}
          onFetch={git.handleFetch}
          isFetching={git.isProcessing}
          onContextMenu={handleContextMenu}
          sidebarWidth={sidebarWidth}
          onChangeRepo={git.handleChangeRepo}
          onChangeBranch={git.handleChangeBranch}
          onSetComparison={git.handleSetComparisonBranch}
          onOpenRepo={git.handleOpenRepo}
          fileCount={git.gitState.files.length}
          repos={git.recentRepos}
          branches={git.branches}
          comparisonBranch={git.comparisonBranch}
        />

        {/* Main Workspace */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Left Sidebar: Changes (Resizable) */}
          <div
            ref={sidebarRef}
            style={{ width: sidebarWidth }}
            className={`flex flex-col border-r border-gray-200 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.1)] z-20 transition-colors duration-300 ${isPrincess ? 'bg-[#fff5f9]' : 'bg-[#f4faff]'} relative shrink-0`}
          >
            {/* Resize Handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400/30 z-50 active:bg-blue-500/50 transition-colors"
              onMouseDown={startResizing}
            />

            {/* Changes Header with Search & Select All */}
            <div className={`p-3 border-b border-gray-200/60 ${sidebarHeaderBg} backdrop-blur-sm flex flex-col gap-3 transition-colors duration-300 shadow-sm z-10`}>
              <div className="relative group">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Filter files... [/]"
                  aria-label="Filter files"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-2 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded-full p-0.5 hover:bg-gray-100 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-center select-none">
                <div className="mr-2 flex items-center justify-center">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all filtered files"
                    className={`h-3.5 w-3.5 border-gray-300 rounded focus:ring-blue-500 cursor-pointer ${isPrincess ? 'accent-pink-500' : 'accent-blue-600'}`}
                  />
                </div>

                <div onClick={toggleSelectAll} className="cursor-pointer flex items-baseline truncate">
                  <span className="text-xs font-semibold text-gray-700 mr-1.5">
                    {filteredFiles.length} diff files
                  </span>
                </div>
              </div>
            </div>

            <FileList
              files={filteredFiles}
              selectedIds={git.gitState.selectedFileIds}
              onSelectionChange={git.handleSelectionChange}
              onHoverStateChange={(state) => !git.isProcessing && git.gitState.selectedFileIds.size === 0 && setCharacterState(state)}
              onContextMenu={handleContextMenu}
              mode={themeMode}
            />

            <ActionPanel
              selectedCount={git.gitState.selectedFileIds.size}
              selectedPaths={git.gitState.files.filter(f => git.gitState.selectedFileIds.has(f.id)).map(f => f.path)}
              mode={themeMode}
              onRemove={() => handleAction('REMOVE')}
              onRestore={() => handleAction('RESTORE')}
              isProcessing={git.isProcessing}
              onHoverAction={setActionHover}
            />
          </div>

          <div className={`flex-1 flex flex-col min-w-0 ${isPrincess ? 'bg-[#fffbfc]' : 'bg-[#f8fbff]'} ${isResizing ? 'pointer-events-none select-none' : ''}`}>

            {/* Diff Viewer Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
              <div className="flex-1 h-full overflow-hidden relative">

                {isMultipleSelected ? (
                  /* Multi-Select "Dust Spores" View */
                  <div className="h-full w-full overflow-y-auto overflow-x-hidden p-10 flex flex-wrap content-start items-start justify-center gap-4 bg-opacity-50">
                    {Array.from(git.gitState.selectedFileIds).map((id, index) => {
                      const file = git.gitState.files.find(f => f.id === id);
                      if (!file) return null;

                      const verticalOffset = (index % 3) * 20;
                      const horizontalOffset = ((index * 7) % 3) * 15;

                      return (
                        <div
                          key={id}
                          style={{
                            marginTop: `${verticalOffset}px`,
                            marginLeft: `${horizontalOffset}px`,
                          }}
                        >
                          <DustSpore
                            fileName={file.path}
                            linesAdded={file.linesAdded}
                            linesRemoved={file.linesRemoved}
                            isScared={actionHover === 'REMOVE'}
                            mode={themeMode}
                            delay={index * 0.2}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Single File Diff View */
                  <DiffView file={selectedFile ? { ...selectedFile, diffContent: git.selectedDiff } : null} mode={themeMode} />
                )}

              </div>
            </div>

            <div className={`shrink-0 bg-white ${isGraphExpanded ? 'h-[32rem]' : 'h-24'} transition-all duration-300 ease-in-out`}>
              <NetworkGraph
                mode={themeMode}
                commits={git.commitGraph}
                isExpanded={isGraphExpanded}
                onToggleExpand={() => setIsGraphExpanded(prev => !prev)}
                currentBranch={git.gitState.currentBranch}
                comparisonBranch={git.comparisonBranch}
              />
            </div>

            {/* Floating Character — positioned over all right panel content, sitting above the bottom edge */}
            <div className="absolute bottom-6 right-4 w-64 h-80 pointer-events-none z-40">
              <div className="relative w-full h-full">
                <Character mode={themeMode} state={characterState} showBackdrop={isMultipleSelected} />
                {git.isProcessing && (
                  <div className="absolute -top-4 left-0 w-full text-center bg-black/80 text-white text-[10px] py-1 px-2 rounded-lg animate-bounce">
                    Processing...
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Global Context Menu */}
        {contextMenu.visible && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
            onClose={closeContextMenu}
            mode={themeMode}
          />
        )}
      </main>

      {/* Modals */}
      <SignInModal
        isOpen={isSignInOpen}
        mode={themeMode}
        onSuccess={(user) => {
          git.setGithubUser(user);
          setIsSignInOpen(false);
        }}
      />

      <OptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        mode={themeMode}
        user={git.githubUser}
        gitConfig={git.gitConfig}
        appSettings={git.appSettings}
        onSave={async (newGitConfig, newAppSettings) => {
          git.setGitConfig(newGitConfig);
          if (newAppSettings) {
            git.setAppSettings(newAppSettings);
            await GitService.saveAppSettings(newAppSettings);
          }
        }}
        onSignOut={async () => {
          // @ts-ignore
          await window.electronAPI.githubSignOut();
          git.setGithubUser(null);
          setIsSignInOpen(true);
        }}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        mode={themeMode}
      />

      <UpdateCheckModal
        isOpen={isUpdateCheckOpen}
        onClose={() => setIsUpdateCheckOpen(false)}
        mode={themeMode}
      />
    </div>
  );
};

export default App;
