import React, { useEffect, useRef } from 'react';
import { ThemeMode } from '../types';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  mode: ThemeMode;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose, mode }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    // Use mousedown to catch clicks before they trigger other things
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const isPrincess = mode === ThemeMode.PRINCESS;
  const bgClass = isPrincess ? 'bg-[#fff0f6]' : 'bg-white';
  const borderClass = isPrincess ? 'border-pink-200' : 'border-gray-200';
  const hoverClass = isPrincess ? 'hover:bg-pink-100 text-pink-900' : 'hover:bg-blue-50 text-gray-700';

  return (
    <div 
      ref={ref}
      className={`fixed z-50 rounded-md shadow-xl border ${bgClass} ${borderClass} py-1 min-w-[200px] flex flex-col`}
      style={{ top: y, left: x }}
      onContextMenu={(e) => e.preventDefault()} // Prevent native context menu on custom menu
    >
      {items.map((item, idx) => (
        <div 
          key={idx}
          className={`px-4 py-2 text-xs font-medium cursor-pointer transition-colors flex items-center ${item.disabled ? 'opacity-50 cursor-default' : hoverClass}`}
          onClick={() => {
            if (!item.disabled) {
              item.action();
              onClose();
            }
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;