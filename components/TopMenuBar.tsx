import React from 'react';
import { ThemeMode } from '../types';
import { audioService } from '../services/audioService';

interface TopMenuBarProps {
  mode: ThemeMode;
  onToggleTheme: () => void;
  onOpenOptions: () => void;
  onOpenRepo?: () => void;
  onFetch?: () => void;
  onPull?: () => void;
  onPush?: () => void;
  onOpenGithub?: () => void;
  onRefresh?: () => void;
  onOpenAbout?: () => void;
}

const TopMenuBar: React.FC<TopMenuBarProps> = ({
  mode, onToggleTheme, onOpenOptions, onOpenRepo, onFetch, onPull, onPush, onOpenGithub, onRefresh, onOpenAbout
}) => {
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const isPrincess = mode === ThemeMode.PRINCESS;
  const bgClass = isPrincess ? 'bg-[#fff0f6]' : 'bg-[#eef5ff]';
  const textClass = isPrincess ? 'text-pink-900' : 'text-slate-700';

  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const topItemClass = (name: string) => `
    px-3 py-1 cursor-pointer hover:bg-black/5 text-xs ${textClass} rounded-md transition-colors
    ${activeMenu === name ? 'bg-black/10' : ''}
  `;

  const dropdownClass = `
    absolute top-7 left-0 min-w-[200px] py-1 rounded-md shadow-xl border z-[500]
    ${isPrincess ? 'bg-white border-pink-100' : 'bg-slate-800 border-slate-700'}
  `;

  const dropdownItemClass = `
    px-4 py-1.5 text-xs cursor-pointer flex justify-between items-center
    ${isPrincess ? 'hover:bg-pink-50 text-slate-700' : 'hover:bg-slate-700 text-slate-200'}
  `;

  const disabledItemClass = `
    px-4 py-1.5 text-xs flex justify-between items-center opacity-40 cursor-default
  `;

  const separatorClass = `
    my-1 border-t ${isPrincess ? 'border-pink-100' : 'border-slate-700'}
  `;

  const renderDropdown = (name: string, items: { label: string, shortcut?: string, action?: () => void, separator?: boolean, disabled?: boolean }[]) => (
    activeMenu === name && (
      <div className={dropdownClass}>
        {items.map((item, i) => (
          item.separator
            ? <div key={i} className={separatorClass} />
            : <div
              key={i}
              className={item.disabled ? disabledItemClass : dropdownItemClass}
              onClick={() => {
                if (!item.disabled) {
                  item.action?.();
                  setActiveMenu(null);
                }
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && <span className="opacity-40 ml-4">{item.shortcut}</span>}
            </div>
        ))}
      </div>
    )
  );

  return (
    <div className={`flex items-center w-full h-8 px-2 pr-[140px] ${bgClass} border-b border-black/5 select-none transition-colors duration-300 relative`} style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center space-x-1" ref={menuRef} style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="relative">
          <div className={topItemClass('File')} onClick={() => { setActiveMenu(activeMenu === 'File' ? null : 'File'); audioService.play('pop'); }}>File</div>
          {renderDropdown('File', [
            {
              label: 'New Window', shortcut: 'Ctrl+N', action: () => {
                // @ts-ignore
                window.electronAPI.newWindow();
              }
            },
            { label: 'Open Local Repository...', shortcut: 'Ctrl+O', action: onOpenRepo },
            { label: 'separator', separator: true },
            { label: 'Options...', shortcut: 'Ctrl+,', action: onOpenOptions },
            { label: 'separator', separator: true },
            { label: 'Exit', action: () => window.close() }
          ])}
        </div>
        <div className="relative">
          <div className={topItemClass('Edit')} onClick={() => { setActiveMenu(activeMenu === 'Edit' ? null : 'Edit'); audioService.play('pop'); }}>Edit</div>
          {renderDropdown('Edit', [
            { label: 'Undo', shortcut: 'Ctrl+Z', disabled: true },
            { label: 'Redo', shortcut: 'Ctrl+Y', disabled: true },
            { label: 'separator', separator: true },
            { label: 'Find', shortcut: 'Ctrl+F', disabled: true },
          ])}
        </div>
        <div className="relative">
          <div className={topItemClass('View')} onClick={() => setActiveMenu(activeMenu === 'View' ? null : 'View')}>View</div>
          {renderDropdown('View', [
            { label: 'Reload', shortcut: 'Ctrl+R', action: onRefresh },
            { label: 'separator', separator: true },
            { label: isPrincess ? 'Switch to Prince Mode ⚔️' : 'Switch to Princess Mode 👑', action: onToggleTheme },
            { label: 'separator', separator: true },
            {
              label: 'Toggle Developer Tools', shortcut: 'Ctrl+Shift+I', action: () => {
                // @ts-ignore
                window.electronAPI.toggleDevTools();
              }
            },
          ])}
        </div>
        <div className="relative">
          <div className={topItemClass('Repository')} onClick={() => setActiveMenu(activeMenu === 'Repository' ? null : 'Repository')}>Repository</div>
          {renderDropdown('Repository', [
            { label: 'Fetch', shortcut: 'Ctrl+Shift+F', action: onFetch },
            { label: 'Pull', shortcut: 'Ctrl+Shift+P', action: onPull },
            { label: 'Push', shortcut: 'Ctrl+P', action: onPush },
            { label: 'separator', separator: true },
            { label: 'Open on GitHub', action: onOpenGithub },
            {
              label: 'Open in Explorer', action: async () => {
                // @ts-ignore
                const cwd = await window.electronAPI.getCwd();
                // @ts-ignore
                window.electronAPI.showItemInFolder(cwd);
              }
            },
          ])}
        </div>

        <div className="relative">
          <div className={topItemClass('Help')} onClick={() => setActiveMenu(activeMenu === 'Help' ? null : 'Help')}>Help</div>
          {renderDropdown('Help', [
            {
              label: 'About Git Cleanup PRincess', action: () => {
                onOpenAbout?.();
              }
            },
            { label: 'separator', separator: true },
            {
              label: 'Check for Updates...', action: () => {
                // @ts-ignore
                window.electronAPI.checkForUpdate?.();
              }
            },
            {
              label: 'Report an Issue...', action: () => {
                // @ts-ignore
                window.electronAPI.openExternal('https://github.com/seanbud/git-cleanup-PRincess/issues');
              }
            },
          ])}
        </div>
      </div>

    </div>
  );
};

export default TopMenuBar;