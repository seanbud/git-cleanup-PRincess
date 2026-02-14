import React, { useEffect, useState } from 'react';
import { ThemeMode } from '../types';

interface ProductTitleBarProps {
  mode: ThemeMode;
}

const ProductTitleBar: React.FC<ProductTitleBarProps> = ({ mode }) => {
  const isPrincess = mode === ThemeMode.PRINCESS;
  const [shake, setShake] = useState(false);

  // Trigger shake animation when mode changes
  useEffect(() => {
    setShake(true);
    const timer = setTimeout(() => setShake(false), 200);
    return () => clearTimeout(timer);
  }, [mode]);

  const bgClass = isPrincess ? 'bg-white border-pink-100' : 'bg-white border-blue-100';
  const titleColor = isPrincess ? 'text-pink-600' : 'text-blue-700';

  return (
    <div className={`w-full h-12 border-b flex items-center px-6 z-30 transition-colors duration-500 ${bgClass}`}>
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

      {/* Product Title */}
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
    </div>
  );
};

export default ProductTitleBar;