import React from 'react';
import { ThemeMode } from '../types';

interface TopMenuBarProps {
  mode: ThemeMode;
  onToggleTheme: () => void;
  onOpenOptions: () => void;
}

const TopMenuBar: React.FC<TopMenuBarProps> = ({ mode, onOpenOptions }) => {
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
    absolute top-7 left-0 min-w-[180px] py-1 rounded-md shadow-xl border z-[500]
    ${isPrincess ? 'bg-white border-pink-100' : 'bg-slate-800 border-slate-700'}
  `;

  const dropdownItemClass = `
    px-4 py-1.5 text-xs cursor-pointer flex justify-between items-center
    ${isPrincess ? 'hover:bg-pink-50 text-slate-700' : 'hover:bg-slate-700 text-slate-200'}
  `;

  const renderDropdown = (name: string, items: { label: string, shortcut?: string, action?: () => void }[]) => (
    activeMenu === name && (
      <div className={dropdownClass}>
        {items.map((item, i) => (
          <div key={i} className={dropdownItemClass} onClick={() => { item.action?.(); setActiveMenu(null); }}>
            <span>{item.label}</span>
            {item.shortcut && <span className="opacity-40 ml-4">{item.shortcut}</span>}
          </div>
        ))}
      </div>
    )
  );

  return (
    <div className={`flex items-center w-full h-8 px-2 ${bgClass} border-b border-black/5 select-none transition-colors duration-300 relative`}>
      <div className="flex items-center space-x-1" ref={menuRef}>
        <div className="relative">
          <div className={topItemClass('File')} onClick={() => setActiveMenu(activeMenu === 'File' ? null : 'File')}>File</div>
          {renderDropdown('File', [
            { label: 'New Window', shortcut: 'Ctrl+N' },
            { label: 'Open Local Repository...', shortcut: 'Ctrl+O' },
            { label: 'Options...', shortcut: 'Ctrl+,', action: onOpenOptions },
            { label: 'Exit', action: () => window.close() }
          ])}
        </div>
        <div className="relative">
          <div className={topItemClass('Edit')} onClick={() => setActiveMenu(activeMenu === 'Edit' ? null : 'Edit')}>Edit</div>
          {renderDropdown('Edit', [
            { label: 'Undo', shortcut: 'Ctrl+Z' },
            { label: 'Redo', shortcut: 'Ctrl+Y' },
            { label: 'Cut', shortcut: 'Ctrl+X' },
            { label: 'Copy', shortcut: 'Ctrl+C' },
            { label: 'Paste', shortcut: 'Ctrl+V' }
          ])}
        </div>
        <div className="relative">
          <div className={topItemClass('View')} onClick={() => setActiveMenu(activeMenu === 'View' ? null : 'View')}>View</div>
          {renderDropdown('View', [
            { label: 'Reload', shortcut: 'Ctrl+R' },
            { label: 'Toggle Full Screen', shortcut: 'F11' },
            { label: 'Toggle Developer Tools', shortcut: 'Ctrl+Shift+I' }
          ])}
        </div>
        <div className={topItemClass('Repository')}>Repository</div>
        <div className={topItemClass('Branch')}>Branch</div>
        <div className={topItemClass('Help')}>Help</div>
      </div>
    </div>
  );
};

export default TopMenuBar;