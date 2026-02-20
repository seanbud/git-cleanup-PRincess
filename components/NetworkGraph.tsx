import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { ThemeMode } from '../types';
import { CommitNode } from '../services/gitService';

interface NetworkGraphProps {
    mode: ThemeMode;
    commits?: CommitNode[];
    onCommitSelect?: (hash: string) => void;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    currentBranch?: string;
    comparisonBranch?: string;
}

interface ProcessedNode extends CommitNode {
    x: number;
    y: number;
    colorIndex: number;
}

interface ProcessedPath {
    source: string;
    target: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    colorIndex: number;
}

const BRANCH_COLORS = [
    '#ec4899', '#3b82f6', '#10b981', '#f59e0b',
    '#8b5cf6', '#ef4444', '#14b8a6', '#f97316',
];

const ROW_HEIGHT = 42;
const COL_WIDTH = 28;
const DOT_RADIUS = 7;
const MERGE_RADIUS = 10;
const CORNER_RADIUS = 12;

const NetworkGraph: React.FC<NetworkGraphProps> = ({
    mode,
    commits = [],
    onCommitSelect,
    isExpanded = false,
    onToggleExpand,
    currentBranch,
    comparisonBranch
}) => {
    const isPrincess = mode === ThemeMode.PRINCESS;
    const bgClass = isPrincess ? 'bg-[#fff5f9]' : 'bg-[#f4faff]';
    const textColorClass = isPrincess ? 'text-pink-900' : 'text-blue-900';
    const mutedTextClass = isPrincess ? 'text-pink-600/70' : 'text-blue-600/70';
    const borderClass = isPrincess ? 'border-pink-200/50' : 'border-blue-200/50';

    const dotColor = isPrincess ? '#f472b6' : '#60a5fa';
    const lineColor = isPrincess ? '#db2777' : '#2563eb';
    const color1 = isPrincess ? '#be185d' : '#1d4ed8';

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showReturnToLatest, setShowReturnToLatest] = useState(false);

    // Vertical logic
    const verticalLayout = useMemo(() => {
        if (!commits || commits.length === 0) return { nodes: [], paths: [], maxColumns: 1 };

        const nodesList: ProcessedNode[] = [];
        const nodesMap = new Map<string, ProcessedNode>();
        const pathsList: ProcessedPath[] = [];

        let tracks: (string | null)[] = [];
        let trackColors: number[] = [];
        let nextColorIndex = 0;

        commits.forEach((commit, rowIndex) => {
            let colIndex = tracks.indexOf(commit.hash);

            if (colIndex === -1) {
                colIndex = tracks.indexOf(null);
                if (colIndex === -1) {
                    colIndex = tracks.length;
                    tracks.push(commit.hash);
                    trackColors.push(nextColorIndex % BRANCH_COLORS.length);
                    nextColorIndex++;
                } else {
                    tracks[colIndex] = commit.hash;
                    trackColors[colIndex] = nextColorIndex % BRANCH_COLORS.length;
                    nextColorIndex++;
                }
            }

            const colorIndex = trackColors[colIndex];
            const x = colIndex * COL_WIDTH + COL_WIDTH * 2.5;
            const y = rowIndex * ROW_HEIGHT + ROW_HEIGHT;

            const node: ProcessedNode = { ...commit, x, y, colorIndex };
            nodesMap.set(commit.hash, node);
            nodesList.push(node);

            // Reserve next slots
            const parents = commit.parents;
            if (parents.length > 0) {
                tracks[colIndex] = parents[0];
                for (let i = 1; i < parents.length; i++) {
                    const parentHash = parents[i];
                    let empty = tracks.indexOf(null);
                    if (empty === -1) {
                        empty = tracks.length;
                        tracks.push(parentHash);
                        trackColors.push(nextColorIndex % BRANCH_COLORS.length);
                        nextColorIndex++;
                    } else {
                        tracks[empty] = parentHash;
                        trackColors[empty] = nextColorIndex % BRANCH_COLORS.length;
                        nextColorIndex++;
                    }
                }
            } else {
                tracks[colIndex] = null;
            }
        });

        nodesList.forEach((node) => {
            node.parents.forEach((parentHash, i) => {
                const parentNode = nodesMap.get(parentHash);
                const colorIdx = i === 0 ? node.colorIndex : (parentNode?.colorIndex ?? (node.colorIndex + 1) % BRANCH_COLORS.length);

                if (parentNode) {
                    pathsList.push({
                        source: node.hash, target: parentHash,
                        sourceX: node.x, sourceY: node.y,
                        targetX: parentNode.x, targetY: parentNode.y,
                        colorIndex: colorIdx
                    });
                } else {
                    pathsList.push({
                        source: node.hash, target: parentHash,
                        sourceX: node.x, sourceY: node.y,
                        targetX: node.x, targetY: node.y + ROW_HEIGHT,
                        colorIndex: colorIdx
                    });
                }
            });
        });

        const maxColumns = Math.max(1, ...nodesList.map(n => (n.x / COL_WIDTH)));
        return { nodes: nodesList, paths: pathsList, maxColumns };
    }, [commits]);

    // Horizontal filtered logic
    const filteredCommits = useMemo(() => {
        if (!currentBranch || commits.length === 0) return commits.slice(0, 15).reverse();
        const commitMap = new Map<string, CommitNode>();
        commits.forEach(c => commitMap.set(c.hash, c));
        const headCommit = commits.find(c =>
            c.branch?.includes('HEAD -> ' + currentBranch) || c.branch?.includes(currentBranch)
        ) || commits[0];

        const result: CommitNode[] = [];
        const visited = new Set<string>();
        const stopBranches = ['main', 'master', 'develop', 'development'];
        if (comparisonBranch) stopBranches.push(comparisonBranch);
        const isBaseBranch = stopBranches.includes(currentBranch);
        const hasOtherBranch = (c: CommitNode) => {
            if (!c.branch) return false;
            const refs = c.branch.split(',').map(r => r.trim().replace('HEAD -> ', ''));
            return refs.some(r => r !== currentBranch && stopBranches.includes(r));
        };

        let queue = [headCommit.hash];
        while (queue.length > 0 && result.length < 25) {
            const hash = queue.shift()!;
            if (visited.has(hash)) continue;
            visited.add(hash);
            const node = commitMap.get(hash);
            if (!node) continue;
            result.push(node);
            if (!isBaseBranch && hasOtherBranch(node)) break;
            if (node.parents.length > 0) queue.push(node.parents[0]);
        }
        return result.reverse();
    }, [commits, currentBranch, comparisonBranch]);

    useEffect(() => {
        if (!isExpanded && scrollRef.current && filteredCommits.length > 0) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [isExpanded, filteredCommits]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!isExpanded && scrollRef.current) {
            scrollRef.current.scrollLeft += e.deltaY;
        }
    }, [isExpanded]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtEnd = target.scrollLeft + target.clientWidth >= target.scrollWidth - 20;
        setShowReturnToLatest(!isAtEnd);
    };

    const scrollToLatest = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
        }
    };

    const generatePath = (p: ProcessedPath) => {
        const { sourceX, sourceY, targetX, targetY } = p;
        if (sourceX === targetX) {
            return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
        }
        const midY = (sourceY + targetY) / 2;
        const r = Math.min(CORNER_RADIUS, Math.abs(midY - sourceY) - 2, Math.abs(targetX - sourceX) / 2);
        const isRight = targetX > sourceX;
        return [
            `M ${sourceX} ${sourceY}`,
            `L ${sourceX} ${midY - r}`,
            `Q ${sourceX} ${midY} ${sourceX + (isRight ? r : -r)} ${midY}`,
            `L ${targetX + (isRight ? -r : r)} ${midY}`,
            `Q ${targetX} ${midY} ${targetX} ${midY + r}`,
            `L ${targetX} ${targetY}`
        ].join(' ');
    };

    const SvgFilters = () => (
        <defs>
            <filter id="lineShadow" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="4" result="offsetblur" />
                <feComponentTransfer><feFuncA type="linear" slope="0.4" /></feComponentTransfer>
                <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
        </defs>
    );

    if (commits.length === 0) return <div className={`p-4 h-full flex items-center justify-center ${bgClass} text-xs text-gray-400`}>No commits found.</div>;

    // ─── Horizontal (Collapsed) ───
    if (!isExpanded) {
        const nodeSpacing = 110;
        const leftPadding = 160;
        const horizontalSvgWidth = Math.max(leftPadding + 200, (filteredCommits.length - 1) * nodeSpacing + leftPadding + 200);
        const y = 35;
        return (
            <div className="relative h-24 flex-shrink-0">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    onWheel={handleWheel}
                    onClick={() => onToggleExpand?.()}
                    className={`p-0 border-t ${borderClass} flex flex-col justify-center ${bgClass} overflow-x-auto overflow-y-hidden h-full scrollbar-hide relative transition-colors cursor-pointer`}
                >
                    <svg width={horizontalSvgWidth} height="70" className="pointer-events-none overflow-visible">
                        <SvgFilters />
                        <path d={`M0,${y} L${horizontalSvgWidth},${y}`} stroke={lineColor} strokeWidth="5" className="opacity-20" strokeLinecap="round" />
                        {filteredCommits.length > 1 && (
                            <path d={`M${leftPadding},${y} L${(filteredCommits.length - 1) * nodeSpacing + leftPadding},${y}`} stroke={lineColor} strokeWidth="6" filter="url(#lineShadow)" strokeLinecap="round" />
                        )}
                        {filteredCommits.map((commit, i) => {
                            const x = leftPadding + i * nodeSpacing;
                            const isHead = commit.branch?.includes('HEAD ->') || (i === filteredCommits.length - 1 && currentBranch);
                            const allRefs = commit.branch?.split(',').map(r => r.trim()) || [];
                            const rawRef = allRefs.find(r => r.startsWith('tag: ') || /v\d+\.\d+/.test(r)) || '';
                            const tagName = rawRef.replace('tag: ', '');
                            const labelWidth = Math.max(64, tagName.length * 8.5 + 24);
                            return (
                                <g key={commit.hash}>
                                    <circle cx={x} cy={y} r={isHead ? 12 : 9} fill={isHead ? color1 : dotColor} stroke="#fff" strokeWidth={4} filter="url(#lineShadow)" />
                                    {tagName && (
                                        <g transform={`translate(${x}, ${y - 25})`}>
                                            <rect x={-(labelWidth / 2)} y={-11} width={labelWidth} height={22} rx={6} fill={isHead ? color1 : (isPrincess ? '#fce7f3' : '#dbeafe')} filter="url(#lineShadow)" />
                                            <text x="0" y="5" textAnchor="middle" className={`text-[11px] font-black uppercase tracking-widest ${isHead ? 'fill-white' : (isPrincess ? 'fill-pink-800' : 'fill-blue-800')}`}>{tagName}</text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
                {showReturnToLatest && (
                    <button onClick={scrollToLatest} className={`absolute right-6 top-1/2 -translate-y-1/2 z-30 px-4 py-2 rounded-full shadow-2xl ${color1} text-white hover:scale-105 transition-all flex items-center gap-2 border-2 border-white/50`}>
                        <span className="text-[10px] font-black tracking-widest uppercase">Latest</span>
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                )}
            </div>
        );
    }

    // ─── Vertical (Expanded) ───
    const { nodes, paths, maxColumns } = verticalLayout;
    const totalHeight = nodes.length * ROW_HEIGHT + 150;
    const totalWidth = (maxColumns + 1) * COL_WIDTH + 140;

    return (
        <div className={`flex flex-col h-full border-t ${borderClass} ${bgClass} relative`}>
            <div
                className={`px-4 py-2 flex justify-between items-center text-[10px] uppercase font-black tracking-[0.3em] border-b ${borderClass} opacity-60 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                onClick={onToggleExpand}
            >
                <span>Network Topology</span>
                <span className="text-xl">⇣</span>
            </div>

            <div className="flex-1 overflow-auto scrollbar-thin">
                <div className="relative" style={{ height: `${totalHeight}px`, minWidth: '100%' }}>
                    {/* Paths Layer */}
                    <svg className="absolute top-0 left-0 pointer-events-none overflow-visible w-full h-full" style={{ width: totalWidth, height: totalHeight }}>
                        <SvgFilters />
                        {paths.map((p, i) => (
                            <path key={`${p.source}-${p.target}-${i}`} d={generatePath(p)} fill="none" stroke={BRANCH_COLORS[p.colorIndex % BRANCH_COLORS.length]} strokeWidth="5" filter="url(#lineShadow)" strokeLinecap="round" />
                        ))}
                    </svg>

                    {/* Content Layer (Rows) */}
                    <div className="absolute top-0 left-0 w-full h-full">
                        {nodes.map((node) => {
                            const nodeColor = BRANCH_COLORS[node.colorIndex % BRANCH_COLORS.length];
                            return (
                                <div
                                    key={node.hash}
                                    className={`absolute w-full flex items-center group cursor-pointer transition-all px-2`}
                                    style={{ top: node.y - ROW_HEIGHT / 2, height: ROW_HEIGHT }}
                                    onClick={() => onCommitSelect?.(node.hash)}
                                >
                                    {/* Subtle Background Highlight */}
                                    <div
                                        className="absolute inset-x-0 inset-y-[1px] opacity-[0.05] group-hover:opacity-[0.12] transition-opacity duration-300 pointer-events-none"
                                        style={{ backgroundColor: nodeColor }}
                                    />

                                    {/* Node Dot */}
                                    <div className="absolute flex items-center justify-center pointer-events-none" style={{ left: node.x - (node.isMerge ? MERGE_RADIUS : DOT_RADIUS), top: ROW_HEIGHT / 2 - (node.isMerge ? MERGE_RADIUS : DOT_RADIUS) }}>
                                        <div className="rounded-full border-4 shadow-xl transition-transform group-hover:scale-110" style={{ width: (node.isMerge ? MERGE_RADIUS : DOT_RADIUS) * 2, height: (node.isMerge ? MERGE_RADIUS : DOT_RADIUS) * 2, backgroundColor: nodeColor, borderColor: '#fff' }} />
                                    </div>

                                    {/* Commit Details */}
                                    <div className="flex text-[13px] items-center whitespace-nowrap overflow-hidden pr-20 pointer-events-none" style={{ marginLeft: totalWidth - 40 }}>
                                        <span className={`font-mono text-[11px] ${mutedTextClass} w-20 shrink-0 opacity-40`}>{node.hash.substring(0, 7)}</span>
                                        {node.branch && (
                                            <div className="flex shrink-0 gap-1 mr-4">
                                                {node.branch.split(',').map(ref => (
                                                    <span key={ref} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight shadow-md border-2 ${ref.includes('HEAD ->') ? (isPrincess ? 'bg-pink-600 text-white border-pink-400' : 'bg-blue-700 text-white border-blue-500') : (isPrincess ? 'bg-white text-pink-700 border-pink-100' : 'bg-white text-blue-700 border-blue-100')}`}>
                                                        {ref.trim().replace('HEAD -> ', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <span className={`font-bold ${textColorClass} truncate mr-6 italic`}>{node.message}</span>
                                        <span className={`text-[11px] font-black ${mutedTextClass} uppercase px-3 py-1 bg-white/60 rounded-full shadow-sm`}>{node.author}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkGraph;
