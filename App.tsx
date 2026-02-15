import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GitState, ThemeMode, CharacterState, GitFile } from './types';
import { generateMockFiles, mockGitOperation } from './services/mockGitService';
import TopMenuBar from './components/TopMenuBar';
import ProductTitleBar from './components/ProductTitleBar';
import RepoHeader from './components/RepoHeader';
import BranchGraph from './components/BranchGraph';
import FileList from './components/FileList';
import DiffView from './components/DiffView';
import Character from './components/Character';
import ActionPanel from './components/ActionPanel';
import ContextMenu, { ContextMenuItem } from './components/ContextMenu';
import DustSpore from './components/DustSpore';
import { Icons } from './constants';
import LoginScreen from './components/LoginScreen';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.PRINCESS);
  const [characterState, setCharacterState] = useState<CharacterState>(CharacterState.IDLE);
  const [gitState, setGitState] = useState<GitState>({
    currentBranch: 'feature/shiny-new-buttons',
    upstreamBranch: 'origin/develop',
    repoName: 'git-cleanup-princess',
    files: [],
    selectedFileIds: new Set(),
    lastFetched: '2 mins ago'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionHover, setActionHover] = useState<'REMOVE' | 'RESTORE' | null>(null);

  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
  }>({ visible: false, x: 0, y: 0, items: [] });

  useEffect(() => {
    setGitState(prev => ({ ...prev, files: generateMockFiles() }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isProcessing) return;
    if (actionHover === 'REMOVE') setCharacterState(CharacterState.ACTION_BAD);
    else if (actionHover === 'RESTORE') setCharacterState(CharacterState.ACTION_GOOD);
    else setCharacterState(gitState.selectedFileIds.size > 0 ? CharacterState.SELECTED : CharacterState.IDLE);
  }, [gitState.selectedFileIds, isProcessing, actionHover]);

  // Resizing Logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);


  // Filtering Logic
  const filteredFiles = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return gitState.files;

    const terms = rawQuery.split(/\s+/).filter(Boolean);

    // Pre-compile regex patterns for performance
    const processedTerms = terms.map(term => {
      // Handle Glob patterns (e.g. *.md, src/*)
      if (term.includes('*')) {
        const escapeRegex = (str: string) => str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
        // Convert glob * to .* and ensure start/end anchoring
        const pattern = term.split('*').map(escapeRegex).join('.*');
        return new RegExp(`^${pattern}$`, 'i');
      }
      return term.toLowerCase();
    });

    return gitState.files.filter(f => {
      const filePath = f.path;
      
      // File must match ALL terms
      return processedTerms.every(term => {
        if (term instanceof RegExp) {
          return term.test(filePath);
        }
        
        // Standard fuzzy search (case insensitive)
        return filePath.toLowerCase().includes(term);
      });
    });
  }, [gitState.files, searchQuery]);

  const allFilteredSelected = filteredFiles.length > 0 && filteredFiles.every(f => gitState.selectedFileIds.has(f.id));

  const handleFetch = async () => {
     setIsProcessing(true);
     await mockGitOperation(1500); 
     setGitState(prev => ({...prev, lastFetched: 'just now'}));
     setIsProcessing(false);
  };

  const handleSelectionChange = (newSet: Set<string>) => {
    setGitState(prev => ({ ...prev, selectedFileIds: newSet }));
  };

  const toggleSelectAll = () => {
    const newSet = new Set(gitState.selectedFileIds);
    if (allFilteredSelected) {
       // Deselect filtered
       filteredFiles.forEach(f => newSet.delete(f.id));
    } else {
       // Select filtered
       filteredFiles.forEach(f => newSet.add(f.id));
    }
    setGitState(prev => ({ ...prev, selectedFileIds: newSet }));
  };

  const handleAction = async (actionType: 'RESTORE' | 'REMOVE') => {
    setIsProcessing(true);
    setCharacterState(actionType === 'RESTORE' ? CharacterState.ACTION_GOOD : CharacterState.ACTION_BAD);
    await mockGitOperation(1500);
    setGitState(prev => {
      const remainingFiles = prev.files.filter(f => !prev.selectedFileIds.has(f.id));
      return {
        ...prev,
        files: remainingFiles,
        selectedFileIds: new Set()
      };
    });
    setIsProcessing(false);
    setCharacterState(CharacterState.IDLE);
  };

  const toggleTheme = () => {
    setThemeMode(prev => prev === ThemeMode.PRINCESS ? ThemeMode.PRINCE : ThemeMode.PRINCESS);
  };

  const handleBranchChange = (newBranch: string) => {
    // Determine upstream automatically based on common conventions
    let upstream = 'origin/main';
    if (newBranch === 'main') {
      upstream = 'upstream/main';
    } else if (newBranch === 'develop' || newBranch.startsWith('feature/')) {
      upstream = 'origin/develop';
    } else if (newBranch.startsWith('hotfix/') || newBranch.startsWith('release/')) {
      upstream = 'origin/main';
    }

    setGitState(prev => ({ 
      ...prev, 
      currentBranch: newBranch,
      upstreamBranch: upstream,
      files: generateMockFiles() // Refresh files to simulate branch switch
    }));
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'FILE' | 'REPO' | 'BRANCH', payload?: GitFile) => {
    e.preventDefault();
    const items: ContextMenuItem[] = [];

    if (type === 'FILE' && payload) {
      items.push({
        label: 'Open with External Editor',
        action: () => alert(`Opening ${payload.path} in external editor (VS Code)...`)
      });
      items.push({
        label: 'Reveal in Finder / Explorer',
        action: () => alert(`Opening file location for: ${payload.path}`)
      });
      items.push({
        label: 'Copy Relative Path',
        action: () => {
           navigator.clipboard.writeText(payload.path);
        }
      });
      items.push({
        label: 'Copy Absolute Path',
        action: () => {
           const absPath = `/Users/developer/projects/${gitState.repoName}/${payload.path}`;
           navigator.clipboard.writeText(absPath);
        }
      });
    } else if (type === 'REPO') {
      items.push({
        label: 'Open on GitHub',
        action: () => {
           alert(`Opening https://github.com/my-org/${gitState.repoName}`);
        }
      });
      items.push({
        label: 'Reveal in Finder / Explorer',
        action: () => alert(`Opening repository: ${gitState.repoName}`)
      });
      items.push({
        label: 'Open in Terminal',
        action: () => alert('Opening terminal at repository root')
      });
    } else if (type === 'BRANCH') {
      items.push({
        label: 'Copy Branch Name',
        action: () => {
           navigator.clipboard.writeText(gitState.currentBranch);
        }
      });
      items.push({
        label: 'Copy Branch SHA',
        action: () => {
           // Mock SHA generation
           const mockSha = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
           navigator.clipboard.writeText(mockSha);
           alert(`Copied SHA: ${mockSha}`);
        }
      });
    }

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      items
    });
  };

  const selectedFileId = Array.from(gitState.selectedFileIds)[0];
  const selectedFile = gitState.files.find(f => f.id === selectedFileId) || null;
  const isMultipleSelected = gitState.selectedFileIds.size > 1;
  
  const isPrincess = themeMode === ThemeMode.PRINCESS;
  const appBgClass = isPrincess ? 'bg-[#fff5f9]' : 'bg-[#f4faff]';
  const sidebarHeaderBg = isPrincess ? 'bg-[#fff0f6]' : 'bg-[#e0efff]/50';

  if (!isAuthenticated) {
    return <LoginScreen mode={themeMode} onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden text-sm ${appBgClass} font-sans transition-colors duration-300`}>
      {/* 1. Top Menu Bar (System Menu) */}
      <TopMenuBar mode={themeMode} onToggleTheme={toggleTheme} />

      {/* 2. Product Title & Toggle Bar */}
      <ProductTitleBar mode={themeMode} onToggleTheme={toggleTheme} />

      {/* 3. Repository Header */}
      <RepoHeader 
        mode={themeMode} 
        state={gitState} 
        onFetch={handleFetch} 
        isFetching={isProcessing}
        onContextMenu={handleContextMenu}
        sidebarWidth={sidebarWidth}
        onChangeRepo={(name) => setGitState(prev => ({ ...prev, repoName: name }))}
        onChangeBranch={handleBranchChange}
        fileCount={gitState.files.length}
      />

      {/* 4. Main Workspace */}
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
                 aria-label="Filter files"
                 placeholder="Filter files (e.g. *.md) - / to focus"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-2 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
               />
               {searchQuery && (
                 <button 
                    type="button"
                    aria-label="Clear filter"
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
                     type="checkbox"
                     aria-label="Select all filtered files"
                     checked={allFilteredSelected}
                     onChange={toggleSelectAll}
                     className={`h-3.5 w-3.5 border-gray-300 rounded focus:ring-blue-500 cursor-pointer ${isPrincess ? 'accent-pink-500' : 'accent-blue-600'} ${!allFilteredSelected ? 'appearance-none border border-gray-400/60 bg-white/40 hover:border-blue-400' : ''}`}
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
            selectedIds={gitState.selectedFileIds}
            onSelectionChange={handleSelectionChange}
            onHoverStateChange={(state) => !isProcessing && gitState.selectedFileIds.size === 0 && setCharacterState(state)}
            onContextMenu={handleContextMenu}
            mode={themeMode}
          />

          <ActionPanel 
            selectedCount={gitState.selectedFileIds.size} 
            mode={themeMode}
            onRemove={() => handleAction('REMOVE')}
            onRestore={() => handleAction('RESTORE')}
            isProcessing={isProcessing}
            onHoverAction={setActionHover}
          />
        </div>

        {/* Right Panel: Content */}
        <div className={`flex-1 flex flex-col min-w-0 ${isPrincess ? 'bg-[#fffbfc]' : 'bg-[#f8fbff]'} ${isResizing ? 'pointer-events-none select-none' : ''}`}>
           
           {/* Diff Viewer Area */}
           <div className="flex-1 relative overflow-hidden flex flex-col">
              <div className="flex-1 h-full overflow-hidden relative">
                 
                 {isMultipleSelected ? (
                    /* Multi-Select "Dust Spores" View */
                    <div className="h-full w-full overflow-y-auto overflow-x-hidden p-10 flex flex-wrap content-start items-start justify-center gap-4 bg-opacity-50">
                       {Array.from(gitState.selectedFileIds).map((id, index) => {
                          const file = gitState.files.find(f => f.id === id);
                          if (!file) return null;
                          
                          // Stagger Logic to avoid clear grid
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
                    <DiffView file={selectedFile} mode={themeMode} />
                 )}
                 
                 {/* Floating Character - Always Visible on Top */}
                 <div className="absolute bottom-4 right-4 w-40 h-48 pointer-events-none z-[60]">
                      <div className="relative w-full h-full">
                          <Character mode={themeMode} state={characterState} showBackdrop={isMultipleSelected} />
                          {isProcessing && (
                            <div className="absolute -top-4 left-0 w-full text-center bg-black/80 text-white text-[10px] py-1 px-2 rounded-lg animate-bounce">
                              Processing...
                            </div>
                          )}
                      </div>
                  </div>

              </div>
           </div>

           {/* Branch Tree Visualization (Bottom) */}
           <div className="h-24 shrink-0 bg-white border-t border-gray-200">
               <BranchGraph mode={themeMode} />
           </div>

        </div>
      </div>

      {/* Global Context Menu */}
      {contextMenu.visible && (
        <ContextMenu 
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
          mode={themeMode}
        />
      )}
    </div>
  );
};

export default App;