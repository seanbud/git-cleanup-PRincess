import React from 'react';
import { ThemeMode } from '../types';

interface BranchGraphProps {
  mode: ThemeMode;
}

const BranchGraph: React.FC<BranchGraphProps> = ({ mode }) => {
  const isPrincess = mode === ThemeMode.PRINCESS;
  const color1 = isPrincess ? '#ec4899' : '#3b82f6';
  const color2 = isPrincess ? '#a855f7' : '#10b981';
  const nodeColor = isPrincess ? '#fce7f3' : '#e0f2fe';
  const bgClass = isPrincess ? 'bg-[#fff5f9]' : 'bg-[#f4faff]';

  return (
    <div className={`p-4 border-b border-gray-100 flex items-center justify-center ${bgClass} overflow-hidden h-24 relative transition-colors duration-300`}>
       <div className="absolute top-1 left-2 text-[10px] uppercase font-bold text-gray-400">Network</div>
       <svg width="200" height="60" viewBox="0 0 200 60">
          {/* Main Line */}
          <path d="M0,30 L200,30" stroke="#e2e8f0" strokeWidth="2" />
          
          {/* Branch Line */}
          <path d="M40,30 C60,30 60,10 80,10 L140,10 C160,10 160,30 180,30" stroke={color1} strokeWidth="2" fill="none" />
          
          {/* Commits */}
          <circle cx="20" cy="30" r="4" fill="#94a3b8" />
          <circle cx="40" cy="30" r="4" fill="#94a3b8" />
          
          {/* Branched Commits */}
          <circle cx="80" cy="10" r="4" fill={color1} stroke={nodeColor} strokeWidth="2" />
          <circle cx="110" cy="10" r="4" fill={color1} stroke={nodeColor} strokeWidth="2" />
          <circle cx="140" cy="10" r="4" fill={color1} stroke={nodeColor} strokeWidth="2" />

          {/* Merge Target */}
          <circle cx="180" cy="30" r="5" fill="none" stroke={color2} strokeWidth="2" strokeDasharray="2 2" className="animate-pulse" />
       </svg>
    </div>
  );
};

export default BranchGraph;