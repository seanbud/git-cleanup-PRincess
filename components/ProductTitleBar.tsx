import React, { useEffect, useState } from 'react';
import { ThemeMode } from '../types';

interface ProductTitleBarProps {
  mode: ThemeMode;
  onToggleTheme: () => void;
}

const ProductTitleBar: React.FC<ProductTitleBarProps> = ({ mode, onToggleTheme }) => {
  const isPrincess = mode === ThemeMode.PRINCESS;
  const [shake, setShake] = useState(false);

  // Trigger shake animation when mode changes
  useEffect(() => {
    setShake(true);
    const timer = setTimeout(() => setShake(false), 200); // 200ms match animation
    return () => clearTimeout(timer);
  }, [mode]);

  // Clean flat styling
  const bgClass = isPrincess ? 'bg-white border-pink-100' : 'bg-white border-blue-100';
  const titleColor = isPrincess ? 'text-pink-600' : 'text-blue-700';
  const toggleTrackColor = isPrincess ? 'bg-pink-300' : 'bg-blue-300';
  const toggleKnobColor = 'bg-white';
  
  // Toggle Label Colors
  const activeLabelColor = isPrincess ? 'text-pink-600' : 'text-blue-600';
  const inactiveLabelColor = 'text-gray-300';

  return (
    <div className={`w-full h-12 border-b flex items-center justify-between px-6 z-30 transition-colors duration-500 ${bgClass}`}>
      <style>
        {`
          .font-chewy {
            font-family: 'Chewy', cursive;
          }
          @keyframes title-shake {
             0% { transform: translate(0, 0) rotate(0deg); }
             20% { transform: translate(-4px, 1px) rotate(-3deg); }
             40% { transform: translate(4px, -1px) rotate(3deg); }
             60% { transform: translate(-3px, 0px) rotate(-2deg); }
             80% { transform: translate(3px, 0px) rotate(2deg); }
             100% { transform: translate(0, 0) rotate(0deg); }
          }
          .animate-title-shake {
            animation: title-shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
          }
        `}
      </style>

      {/* Product Title - Clean with Animation */}
      <div 
        className={`text-2xl tracking-wide ${titleColor} flex items-center font-chewy ${shake ? 'animate-title-shake' : ''}`}
      >
        <span className="mr-1.5">Git Cleanup </span>
        <span className="relative inline-flex items-baseline">
          <span>PR</span>
          <span>ince</span>
          <span className={`transition-all duration-300 overflow-hidden ${isPrincess ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>ss</span>
        </span>
      </div>

      {/* Theme Toggle - Simplified */}
      <div 
        className="flex items-center space-x-3 cursor-pointer select-none group" 
        onClick={onToggleTheme}
      >
        <span className={`text-xs font-bold uppercase tracking-widest ${isPrincess ? activeLabelColor : inactiveLabelColor}`}>
          Princess
        </span>
        
        <div className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 relative ${toggleTrackColor} shadow-inner`}>
            <div 
              className={`w-3 h-3 ${toggleKnobColor} rounded-full shadow-sm transform transition-transform duration-300 ${isPrincess ? 'translate-x-5' : 'translate-x-0'}`} 
            />
        </div>

        <span className={`text-xs font-bold uppercase tracking-widest ${!isPrincess ? 'text-blue-600' : inactiveLabelColor}`}>
          Prince
        </span>
      </div>
    </div>
  );
};

export default ProductTitleBar;