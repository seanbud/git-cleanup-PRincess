import React from 'react';
import { ThemeMode } from '../types';

interface TopMenuBarProps {
  mode: ThemeMode;
  onToggleTheme: () => void;
}

const TopMenuBar: React.FC<TopMenuBarProps> = ({ mode }) => {
  const isPrincess = mode === ThemeMode.PRINCESS;
  const bgClass = isPrincess ? 'bg-[#fff0f6]' : 'bg-[#eef5ff]';
  const textClass = isPrincess ? 'text-pink-900' : 'text-slate-700';
  const itemClass = `px-3 py-1.5 cursor-pointer hover:bg-black/5 text-xs ${textClass} rounded-md transition-colors`;

  return (
    <div className={`flex items-center w-full h-8 px-2 ${bgClass} border-b border-black/5 select-none transition-colors duration-300`}>
      {/* Menu Items */}
      <div className="flex items-center space-x-1">
        <div className={itemClass}>File</div>
        <div className={itemClass}>Edit</div>
        <div className={itemClass}>View</div>
        <div className={itemClass}>Repository</div>
        <div className={itemClass}>Branch</div>
        <div className={itemClass}>Help</div>
      </div>
    </div>
  );
};

export default TopMenuBar;