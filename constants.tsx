import React from 'react';
import { FileStatus } from './types';

// Simple Icons using SVG directly to avoid dependencies if possible, but lucide is standard. 
// We will use inline SVGs for maximum portability in this prompt format.

export const Icons = {
  DiffAdded: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2V14M2 8H14" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  DiffRemoved: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8H14" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  DiffModified: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="8" height="8" rx="1" fill="#F59E0B"/>
    </svg>
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  ArrowRight: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  CrossedSwords: ({ className }: { className?: string }) => (
    <svg className={className} width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Long Shadow Layer - Projecting Down and Right */}
      <defs>
        <clipPath id="clip-circle">
           {/* Optional: Clip to a circle if desired, but user asked for "clips at the bottom of the bar". 
               Here we just let it fill the SVG viewbox. */}
           <rect width="100" height="100" />
        </clipPath>
      </defs>

      <g opacity="0.2">
         {/* Shadow projection geometry approximately 45 degrees down-right */}
         <path d="M20,20 L80,80 L100,100 L100,100 L40,100 L20,20 Z" fill="black" />
         <path d="M80,20 L20,80 L40,100 L100,100 L100,40 L80,20 Z" fill="black" />
         <path d="M50,50 L100,100 L100,100 Z" fill="black" />
         {/* Central mass shadow */}
         <circle cx="50" cy="50" r="30" fill="black" />
      </g>

      {/* Sword 1: Top-Right to Bottom-Left (Background) */}
      <g transform="translate(50,50) rotate(45)">
         {/* Handle */}
         <rect x="-4" y="15" width="8" height="20" rx="1" fill="#1e293b" />
         {/* Pommel */}
         <circle cx="0" cy="38" r="4" fill="#f59e0b" stroke="#b45309" strokeWidth="1"/>
         {/* Guard */}
         <path d="M-12,15 L12,15 L12,20 L-12,20 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1" rx="2" />
         {/* Blade */}
         <path d="M-5,15 L-5,-35 L0,-45 L5,-35 L5,15 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
         <path d="M0,15 L0,-45" stroke="#cbd5e1" strokeWidth="1" />
      </g>

      {/* Sword 2: Top-Left to Bottom-Right (Foreground) */}
      <g transform="translate(50,50) rotate(-45)">
         {/* Handle */}
         <rect x="-4" y="15" width="8" height="20" rx="1" fill="#1e293b" />
         {/* Pommel */}
         <circle cx="0" cy="38" r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1"/>
         {/* Guard */}
         <path d="M-12,15 L12,15 L12,20 L-12,20 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" rx="2" />
         {/* Blade */}
         <path d="M-5,15 L-5,-35 L0,-45 L5,-35 L5,15 Z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
         <path d="M0,15 L0,-45" stroke="#cbd5e1" strokeWidth="1" />
      </g>
    </svg>
  ),
  GitCommit: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"></circle>
      <line x1="1.05" y1="12" x2="7" y2="12"></line>
      <line x1="17.01" y1="12" x2="22.96" y2="12"></line>
    </svg>
  ),
  GitBranch: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15"></line>
      <circle cx="18" cy="6" r="3"></circle>
      <circle cx="6" cy="18" r="3"></circle>
      <path d="M18 9a9 9 0 0 1-9 9"></path>
    </svg>
  ),
  Refresh: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
    </svg>
  ),
  Search: ({ className }: { className?: string }) => (
     <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Check: (props: { className?: string }) => (
    <svg className={props.className} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 6 4.5 9 10 3"></polyline>
    </svg>
  )
};

export const getStatusIcon = (status: FileStatus) => {
  switch (status) {
    case FileStatus.ADDED: return <Icons.DiffAdded />;
    case FileStatus.DELETED: return <Icons.DiffRemoved />;
    case FileStatus.MODIFIED: return <Icons.DiffModified />;
    default: return <Icons.DiffModified />;
  }
};