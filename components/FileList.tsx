import React, { useCallback, useMemo, useState } from 'react';
import { GitFile, CharacterState, ChangeType, ThemeMode } from '../types';
import { getStatusIcon } from '../constants';

const renderPath = (path: string) => {
  const parts = path.split('/');
  const fileName = parts.pop() || path;
  const isLong = path.length > 45;

  if (!isLong) {
    return <div className="truncate font-mono text-xs md:text-sm leading-tight">{path}</div>;
  }

  const root = parts.shift();

  return (
    <div className="flex items-center min-w-0 font-mono text-xs md:text-sm leading-tight" title={path}>
      {root && <span className="opacity-50 shrink-0 mr-0.5">{root}/.../</span>}
      <span className="truncate">{fileName}</span>
    </div>
  );
};

interface FileListItemProps {
  file: GitFile;
  isSelected: boolean;
  isPrincess: boolean;
  hoverBg: string;
  onSelect: (e: React.MouseEvent, file: GitFile) => void;
  onSelectionChange: (ids: Set<string>) => void;
  onContextMenu: (e: React.MouseEvent, type: 'FILE', payload?: GitFile) => void;
}

const FileListItem: React.FC<FileListItemProps> = React.memo(({
  file,
  isSelected,
  isPrincess,
  hoverBg,
  onSelect,
  onSelectionChange,
  onContextMenu
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    onSelect(e, file);
  }, [onSelect, file]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSelected) {
      onSelectionChange(new Set([file.id]));
    }
    onContextMenu(e, 'FILE', file);
  }, [isSelected, file, onSelectionChange, onContextMenu]);

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`
        flex items-center px-3 py-2 text-sm border-b border-gray-100/50 cursor-pointer select-none transition-colors group relative
        ${isSelected ? (isPrincess ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white') : `${hoverBg} text-gray-700`}
      `}
    >
      {/* Selection Highlight Bar */}
      {isSelected && <div className={`absolute left-0 top-0 bottom-0 w-1 ${isPrincess ? 'bg-pink-300' : 'bg-blue-400'}`} />}

      {/* Checkbox */}
      <div className="mr-3 flex items-center justify-center">
        {isSelected ? (
          <input
            type="checkbox"
            checked={true}
            readOnly
            className="pointer-events-none accent-white h-3.5 w-3.5 opacity-80"
          />
        ) : (
          <div className="w-3.5 h-3.5 rounded-[3px] border border-gray-400/60 bg-white/40 group-hover:bg-white transition-colors" />
        )}
      </div>

      <div className="flex-1 min-w-0 mr-2">
        {renderPath(file.path)}
        {file.commitMessage && (
          <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
            {file.commitMessage}
          </div>
        )}
      </div>

      <div className={`${isSelected ? 'text-white' : ''}`}>
        {getStatusIcon(file.status)}
      </div>
    </div>
  );
});

interface FileListProps {
  files: GitFile[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onHoverStateChange: (state: CharacterState) => void;
  onContextMenu: (e: React.MouseEvent, type: 'FILE', payload?: GitFile) => void;
  mode: ThemeMode;
}

const FileList: React.FC<FileListProps> = ({
  files,
  selectedIds,
  onSelectionChange,
  onHoverStateChange,
  onContextMenu,
  mode
}) => {
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const isPrincess = mode === ThemeMode.PRINCESS;

  // Colors
  const mainBg = isPrincess ? 'bg-[#fff5f9]' : 'bg-[#f4faff]';
  // Updated: Darker grey for headers to stand out (gray-300)
  const groupHeaderBg = 'bg-gray-300 text-gray-800 border-gray-400/30';
  const hoverBg = isPrincess ? 'hover:bg-pink-50' : 'hover:bg-blue-50';

  // Helper to order files logically for display
  const { orderedFiles, uncommitted, stashed, unpushed } = useMemo(() => {
    const uncommitted: GitFile[] = [];
    const stashed: GitFile[] = [];
    const unpushed: GitFile[] = [];

    files.forEach((f) => {
      switch (f.changeType) {
        case ChangeType.UNCOMMITTED:
          uncommitted.push(f);
          break;
        case ChangeType.STASHED:
          stashed.push(f);
          break;
        case ChangeType.UNPUSHED:
          unpushed.push(f);
          break;
      }
    });

    return {
      orderedFiles: [...uncommitted, ...stashed, ...unpushed],
      uncommitted,
      stashed,
      unpushed,
    };
  }, [files]);

  const handleSelect = useCallback((e: React.MouseEvent, file: GitFile) => {
    const newSelected = new Set(selectedIds);
    const currentId = file.id;

    if (e.metaKey || e.ctrlKey) {
      if (newSelected.has(currentId)) {
        newSelected.delete(currentId);
      } else {
        newSelected.add(currentId);
      }
      setLastSelectedId(currentId);
    }
    else if (e.shiftKey && lastSelectedId) {
      const currentIndex = orderedFiles.findIndex(f => f.id === currentId);
      const lastIndex = orderedFiles.findIndex(f => f.id === lastSelectedId);

      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);

        for (let i = start; i <= end; i++) {
          newSelected.add(orderedFiles[i].id);
        }
      }
    }
    else {
      newSelected.clear();
      newSelected.add(currentId);
      setLastSelectedId(currentId);
    }

    onSelectionChange(newSelected);
  }, [orderedFiles, selectedIds, lastSelectedId, onSelectionChange]);

  const renderPath = (path: string) => {
    const parts = path.split('/');
    const fileName = parts.pop() || path;
    const isLong = path.length > 45;

    if (!isLong) {
      return <div className="truncate font-mono text-xs md:text-sm leading-tight">{path}</div>;
    }

    const root = parts.shift();

    return (
      <div className="flex items-center min-w-0 font-mono text-xs md:text-sm leading-tight" title={path}>
         {root && <span className="opacity-50 shrink-0 mr-0.5">{root}/.../</span>}
         <span className="truncate">{fileName}</span>
      </div>
    );
  };

  const renderGroup = (title: string, groupFiles: GitFile[]) => {
    if (groupFiles.length === 0) return null;
    return (
      <div className="mb-4">
        {/* Darker header background */}
        <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${groupHeaderBg} border-y shadow-sm sticky top-0 z-10 flex justify-between items-center`}>
          <span>{title}</span>
          <span className="bg-white/50 text-gray-800 rounded-md px-1.5 py-0.5 text-[10px] border border-black/5">{groupFiles.length}</span>
        </div>
        {groupFiles.map((file) => {
          const isSelected = selectedIds.has(file.id);
          return (
            <div
              key={file.id}
              onClick={(e) => handleSelect(e, file)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!isSelected) {
                  onSelectionChange(new Set([file.id]));
                }
                onContextMenu(e, 'FILE', file);
              }}
              className={`
                  flex items-center px-3 py-2 text-sm border-b border-gray-100/50 cursor-pointer select-none transition-colors group relative
                  ${isSelected ? (isPrincess ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white') : `${hoverBg} text-gray-700`}
                `}
            >
              {/* Selection Highlight Bar */}
              {isSelected && <div className={`absolute left-0 top-0 bottom-0 w-1 ${isPrincess ? 'bg-pink-300' : 'bg-blue-400'}`} />}

              {/* Checkbox */}
              <div className="mr-3 flex items-center justify-center">
                {isSelected ? (
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="pointer-events-none accent-white h-3.5 w-3.5 opacity-80"
                  />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-[3px] border border-gray-400/60 bg-white/40 group-hover:bg-white transition-colors" />
                )}
              </div>

              <div className="flex-1 min-w-0 mr-2">
                {renderPath(file.path)}
                {file.commitMessage && (
                  <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                    {file.commitMessage}
                  </div>
                )}
              </div>

              <div className={`${isSelected ? 'text-white' : ''}`}>
                {getStatusIcon(file.status)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`flex-1 overflow-y-auto ${mainBg} transition-colors duration-300`}
    >
      <div className="flex flex-col min-h-full pb-20 pt-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-10 text-gray-400 text-center">
            <div className="mb-4 opacity-30 text-4xl">✨</div>
            <p className="font-medium">No changes found</p>
            <p className="text-xs mt-1">Your branch is up to date.</p>
          </div>
        ) : (
          <>
            {renderGroup("Staged Changes", uncommitted)}
            {renderGroup("Committed On This Branch", unpushed)}
            {renderGroup("Stashed Changes", stashed)}
          </>
        )}
      </div>
    </div>
  );
};

export default FileList;