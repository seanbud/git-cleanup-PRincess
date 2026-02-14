import React, { useState, useRef, useEffect } from 'react';
import { ThemeMode, GitState } from '../types';
import { Icons } from '../constants';
import { MOCK_REPOS, MOCK_BRANCHES } from '../services/mockGitService';

interface RepoHeaderProps {
  mode: ThemeMode;
  state: GitState;
  onFetch: () => void;
  isFetching: boolean;
  onContextMenu: (e: React.MouseEvent, type: 'REPO' | 'BRANCH') => void;
  sidebarWidth: number;
  onChangeRepo?: (name: string) => void;
  onChangeBranch?: (name: string) => void;
  fileCount: number;
}

type DropdownType = 'REPO' | 'BRANCH' | null;

const RepoHeader: React.FC<RepoHeaderProps> = ({ 
  mode, 
  state, 
  onContextMenu, 
  onChangeRepo,
  onChangeBranch,
  fileCount
}) => {
  const isPrincess = mode === ThemeMode.PRINCESS;
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Theme Variables
  const bgClass = isPrincess ? 'bg-[#fff0f6]' : 'bg-[#f0f9ff]';
  const borderClass = isPrincess ? 'border-pink-200' : 'border-blue-200';
  // Made repo button more distinct with shadow and border
  const repoButtonBg = isPrincess ? 'bg-pink-100 hover:bg-pink-200 text-pink-900 border-pink-200' : 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-200';
  const branchText = isPrincess ? 'text-pink-900' : 'text-slate-900';
  const compareText = isPrincess ? 'text-pink-900/40' : 'text-slate-400';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownClick = (e: React.MouseEvent, type: DropdownType) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === type ? null : type);
  };

  const renderDropdownList = (items: string[], onSelect: (item: string) => void, selectedItem: string) => (
    <div className="absolute top-full mt-2 left-0 w-[280px] bg-white rounded-lg shadow-xl border border-gray-200 ring-1 ring-black/5 z-[100] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-100">
      <div className="max-h-[300px] overflow-y-auto py-1">
        {items.map((item) => {
          const isSelected = item === selectedItem;
          return (
            <div 
              key={item}
              className={`px-4 py-2.5 text-xs font-medium cursor-pointer flex items-center justify-between ${isSelected ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-600'}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item);
                setActiveDropdown(null);
              }}
            >
              <span className="truncate">{item}</span>
              {isSelected && <Icons.Check />}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div 
      className={`h-[72px] flex items-center shrink-0 ${bgClass} border-b ${borderClass} px-6 transition-colors duration-300 gap-6`} 
      // Default to REPO context menu for empty space, but specific elements override it
      onContextMenu={(e) => onContextMenu(e, 'REPO')}
      ref={dropdownRef}
    >
      {/* 1. Repository Selection (Left) */}
      <div 
        className="relative shrink-0 z-50"
        onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, 'REPO'); }}
      >
        <button 
          onClick={(e) => handleDropdownClick(e, 'REPO')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm active:scale-95 ${repoButtonBg}`}
        >
          <Icons.GitCommit className="w-3.5 h-3.5 opacity-70" />
          <span className="max-w-[140px] truncate">{state.repoName}</span>
          <span className="opacity-50 text-[10px]">▼</span>
        </button>
        {activeDropdown === 'REPO' && renderDropdownList(MOCK_REPOS, (name) => onChangeRepo?.(name), state.repoName)}
      </div>

      {/* 2. Branch & Upstream (Center/Main) */}
      <div className="flex-1 flex items-center min-w-0 z-40">
        <div 
          className="relative group flex items-center"
          onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, 'BRANCH'); }}
        >
            {/* Branch Name Dropdown Trigger */}
            <div 
              onClick={(e) => handleDropdownClick(e, 'BRANCH')}
              className={`text-lg md:text-xl font-bold cursor-pointer hover:underline decoration-2 decoration-dotted underline-offset-4 flex items-center ${branchText}`}
            >
              <Icons.GitBranch className="w-5 h-5 mr-2 opacity-80" />
              <span className="truncate">{state.currentBranch}</span>
            </div>
            
            {/* Dropdown */}
            {activeDropdown === 'BRANCH' && (
                <div className="absolute top-full left-0 z-50">
                    {renderDropdownList(MOCK_BRANCHES, (name) => onChangeBranch?.(name), state.currentBranch)}
                </div>
            )}
        </div>

        {/* Separator */}
        <span className={`mx-3 text-xs font-medium ${compareText}`}>compare</span>

        {/* Upstream Pill (Simplified) */}
        <div className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-sm font-mono flex items-center">
           {state.upstreamBranch}
        </div>
      </div>
    </div>
  );
};

export default RepoHeader;