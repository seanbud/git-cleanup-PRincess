import React from 'react';
import { ThemeMode } from '../types';

interface CommitNode {
  hash: string;
  message: string;
  branch?: string;
  isMerge: boolean;
}

interface BranchGraphProps {
  mode: ThemeMode;
  commits?: CommitNode[];
}

const BranchGraph: React.FC<BranchGraphProps> = ({ mode, commits = [] }) => {
  const isPrincess = mode === ThemeMode.PRINCESS;
  const color1 = isPrincess ? '#ec4899' : '#3b82f6';
  const bgClass = isPrincess ? 'bg-[#fff5f9]' : 'bg-[#f4faff]';
  const dotColor = isPrincess ? '#f472b6' : '#60a5fa';
  const lineColor = isPrincess ? '#fbcfe8' : '#bfdbfe';
  const textColor = isPrincess ? 'text-pink-800' : 'text-blue-800';

  // If no commits, show placeholder
  if (commits.length === 0) {
    return (
      <div className={`p-4 border-b border-gray-100 flex items-center justify-center ${bgClass} overflow-hidden h-24 relative transition-colors duration-300`}>
        <div className="absolute top-1 left-2 text-[10px] uppercase font-bold text-gray-400">Network</div>
        <svg width="200" height="60" viewBox="0 0 200 60">
          <path d="M0,30 L200,30" stroke="#e2e8f0" strokeWidth="2" />
          <circle cx="100" cy="30" r="4" fill="#94a3b8" />
        </svg>
      </div>
    );
  }

  const nodeSpacing = 40;
  const svgWidth = Math.max(200, commits.length * nodeSpacing + 40);
  const y = 30;

  return (
    <div className={`p-4 border-b border-gray-100 flex items-center ${bgClass} overflow-x-auto overflow-y-hidden h-24 relative transition-colors duration-300`}>
      <div className="absolute top-1 left-2 text-[10px] uppercase font-bold text-gray-400">Network</div>
      <svg width={svgWidth} height="60" viewBox={`0 0 ${svgWidth} 60`}>
        {/* Main line */}
        <path d={`M0,${y} L${svgWidth},${y}`} stroke={lineColor} strokeWidth="2" />

        {/* Commit dots */}
        {commits.map((commit, i) => {
          const x = 20 + i * nodeSpacing;
          return (
            <g key={commit.hash}>
              <circle
                cx={x}
                cy={y}
                r={commit.isMerge ? 5 : 4}
                fill={commit.isMerge ? color1 : dotColor}
                stroke={commit.isMerge ? dotColor : 'none'}
                strokeWidth={commit.isMerge ? 2 : 0}
              />
              {/* Hash label */}
              <text
                x={x}
                y={y + 18}
                textAnchor="middle"
                className={`text-[8px] ${textColor} fill-current opacity-60`}
              >
                {commit.hash}
              </text>
              {/* Branch ref if present */}
              {commit.branch && (
                <text
                  x={x}
                  y={y - 14}
                  textAnchor="middle"
                  className={`text-[7px] ${textColor} fill-current font-bold`}
                >
                  {commit.branch.split(',')[0].trim().replace('HEAD -> ', '')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BranchGraph;