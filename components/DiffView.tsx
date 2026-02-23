import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { GitFile, ThemeMode } from '../types';
import ImagePreview from './ImagePreview';
import BinaryPreview from './BinaryPreview';
import { highlightCode } from '../utils/syntaxHighlighter';

interface DiffViewProps {
  file: GitFile | null;
  mode: ThemeMode;
}

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico']);
const BINARY_EXTENSIONS = new Set([
  '.fbx', '.obj', '.glb', '.gltf', '.blend', '.stl', '.3ds', '.dae',
  '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.mp4', '.webm', '.avi', '.mov', '.mkv',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.exe', '.dll', '.so', '.dylib',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.psd', '.ai',
]);

const FOLD_THRESHOLD = 15;
const CONTEXT_LINES = 5;

function getFileExtension(filePath: string): string {
  const dot = filePath.lastIndexOf('.');
  return dot >= 0 ? filePath.substring(dot).toLowerCase() : '';
}

function isImageFile(filePath: string): boolean {
  return IMAGE_EXTENSIONS.has(getFileExtension(filePath));
}

function isBinaryFile(filePath: string, diffContent?: string): boolean {
  if (BINARY_EXTENSIONS.has(getFileExtension(filePath))) return true;
  if (diffContent && (diffContent.includes('Binary files') || diffContent.includes('GIT binary patch'))) return true;
  return false;
}

type DiffLine = {
  text: string;
  type: 'added' | 'removed' | 'context';
  oldLineNumber?: number;
  newLineNumber?: number;
};

type DiffSection =
  | { type: 'chunk-header'; text: string; id: string }
  | { type: 'lines'; lines: DiffLine[]; chunkId: string }
  | { type: 'folded'; lineCount: number; id: string; lines: DiffLine[]; chunkId: string };

interface DiffLineItemProps {
  line: DiffLine;
  isPrincess: boolean;
  filePath: string;
  mode: ThemeMode;
}

const DiffLineItem = React.memo<DiffLineItemProps>(({ line, isPrincess, filePath, mode }) => {
  let lineBgClass = 'bg-white';
  let textClass = 'text-gray-700';
  let indicatorColor = 'text-gray-400';

  if (line.type === 'added') {
    lineBgClass = isPrincess ? 'bg-emerald-50/70' : 'bg-emerald-50/50';
    textClass = 'text-emerald-900 font-medium';
    indicatorColor = 'text-emerald-500';
  } else if (line.type === 'removed') {
    lineBgClass = isPrincess ? 'bg-rose-50/70' : 'bg-rose-50/50';
    textClass = 'text-rose-900 font-medium';
    indicatorColor = 'text-rose-500';
  }

  const oldNum = line.oldLineNumber?.toString() || '';
  const newNum = line.newLineNumber?.toString() || '';

  return (
    <div className={`${lineBgClass} flex hover:brightness-[0.98] transition-all group border-l-2 ${line.type === 'added' ? 'border-emerald-400' : line.type === 'removed' ? 'border-rose-400' : 'border-transparent'}`}>
      {/* Line Numbers */}
      <div className="flex shrink-0 select-none bg-gray-50/80 border-r border-gray-200/50 font-mono text-[10px]">
        <div className="w-10 text-right pr-2 py-[2px] text-gray-400 opacity-70 group-hover:opacity-100">{oldNum}</div>
        <div className="w-10 text-right pr-2 py-[2px] text-gray-400 opacity-70 group-hover:opacity-100 border-l border-gray-200/30">{newNum}</div>
      </div>

      {/* Code Content */}
      <div className={`px-4 py-[2px] whitespace-pre-wrap break-all ${textClass} font-mono leading-relaxed w-full min-w-0 flex items-start`}>
        <span className={`w-4 shrink-0 select-none font-bold ${indicatorColor}`}>
          {line.text.charAt(0) === '+' ? '+' : line.text.charAt(0) === '-' ? '-' : ' '}
        </span>
        <span className="flex-1">
          {highlightCode(line.text.slice(1), filePath, mode)}
        </span>
      </div>
    </div>
  );
});

DiffLineItem.displayName = 'DiffLineItem';

const DiffView: React.FC<DiffViewProps> = ({ file, mode }) => {
  const isPrincess = mode === ThemeMode.PRINCESS;
  const bgClass = isPrincess ? 'bg-[#fffbfc]' : 'bg-[#f8fbff]';
  const headerBgClass = isPrincess ? 'bg-[#fff0f6]' : 'bg-[#f0f7ff]';

  const [collapsedChunks, setCollapsedChunks] = useState<Set<string>>(new Set());
  const [expandedAutoFolds, setExpandedAutoFolds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCollapsedChunks(new Set());
    setExpandedAutoFolds(new Set());
  }, [file?.id]);

  const toggleChunk = useCallback((id: string) => {
    setCollapsedChunks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAutoFold = useCallback((id: string) => {
    setExpandedAutoFolds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const sections = useMemo(() => {
    if (!file || !file.diffContent) return [];

    const rawLines = file.diffContent.split('\n');
    const result: DiffSection[] = [];

    let currentOldLine = 0;
    let currentNewLine = 0;
    let currentChunkId = '';

    let lineBuffer: DiffLine[] = [];

    const flushBuffer = () => {
      if (lineBuffer.length === 0 || !currentChunkId) return;

      let subBuffer: DiffLine[] = [];
      let unchangedCount = 0;

      for (let i = 0; i < lineBuffer.length; i++) {
        const line = lineBuffer[i];
        if (line.type === 'context') {
          unchangedCount++;
          subBuffer.push(line);
        } else {
          if (unchangedCount > FOLD_THRESHOLD) {
            result.push({ type: 'lines', lines: subBuffer.slice(0, CONTEXT_LINES), chunkId: currentChunkId });
            const folded = subBuffer.slice(CONTEXT_LINES, -CONTEXT_LINES);
            const id = `fold-${currentChunkId}-${i}`;
            result.push({ type: 'folded', lineCount: folded.length, id, lines: folded, chunkId: currentChunkId });
            result.push({ type: 'lines', lines: subBuffer.slice(-CONTEXT_LINES), chunkId: currentChunkId });
          } else if (subBuffer.length > 0) {
            result.push({ type: 'lines', lines: subBuffer, chunkId: currentChunkId });
          }

          result.push({ type: 'lines', lines: [line], chunkId: currentChunkId });
          subBuffer = [];
          unchangedCount = 0;
        }
      }

      if (subBuffer.length > 0) {
        if (unchangedCount > FOLD_THRESHOLD) {
          result.push({ type: 'lines', lines: subBuffer.slice(0, CONTEXT_LINES), chunkId: currentChunkId });
          const folded = subBuffer.slice(CONTEXT_LINES);
          const id = `fold-${currentChunkId}-final`;
          result.push({ type: 'folded', lineCount: folded.length, id, lines: folded, chunkId: currentChunkId });
        } else {
          result.push({ type: 'lines', lines: subBuffer, chunkId: currentChunkId });
        }
      }

      lineBuffer = [];
    };

    rawLines.forEach((line, idx) => {
      if (line.startsWith('@@')) {
        flushBuffer();
        const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          currentOldLine = parseInt(match[1], 10);
          currentNewLine = parseInt(match[2], 10);
          currentChunkId = `chunk-${idx}`;
          result.push({ type: 'chunk-header', text: line, id: currentChunkId });
        }
        return;
      }

      if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff') || line.startsWith('index')) {
        return;
      }

      let type: DiffLine['type'] = 'context';
      let oldNum: number | undefined;
      let newNum: number | undefined;

      if (line.startsWith('+')) {
        type = 'added';
        newNum = currentNewLine++;
      } else if (line.startsWith('-')) {
        type = 'removed';
        oldNum = currentOldLine++;
      } else {
        type = 'context';
        oldNum = currentOldLine++;
        newNum = currentNewLine++;
      }

      lineBuffer.push({ text: line, type, oldLineNumber: oldNum, newLineNumber: newNum });
    });

    flushBuffer();
    return result;
  }, [file]);

  if (!file) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-gray-400 ${bgClass} select-none`}>
        <div className={`w-20 h-20 mb-4 rounded-full ${headerBgClass} flex items-center justify-center shadow-inner`}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <circle cx="12" cy="14" r="3"></circle>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <p className="font-chewy text-lg tracking-wide opacity-60 text-center px-10">Select a file to witness the magical transformations</p>
      </div>
    );
  }

  if (isImageFile(file.path)) {
    return <ImagePreview filePath={file.path} fileStatus={file.status} mode={mode} />;
  }

  if (isBinaryFile(file.path, file.diffContent)) {
    return <BinaryPreview filePath={file.path} fileStatus={file.status} mode={mode} />;
  }

  return (
    <div className={`flex flex-col h-full ${bgClass} font-mono text-xs transition-colors duration-300 relative overflow-hidden`}>
      {/* Top Header */}
      <div className={`px-4 py-3 border-b border-black/10 ${headerBgClass} flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-opacity-90 shadow-md`}>
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className={`p-1.5 rounded-lg ${isPrincess ? 'bg-pink-200 text-pink-700' : 'bg-blue-200 text-blue-700'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <span className="font-bold text-gray-900 tracking-tight truncate">{file.path}</span>
        </div>
        <div className="flex space-x-2 shrink-0">
          <div className="flex items-center px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-[10px] font-bold text-emerald-800 shadow-sm">
            <span className="mr-1 opacity-70">+</span>{file.linesAdded}
          </div>
          <div className="flex items-center px-2 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-[10px] font-bold text-rose-800 shadow-sm">
            <span className="mr-1 opacity-70">-</span>{file.linesRemoved}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white/40 custom-scrollbar">
        <div className="flex flex-col min-w-max min-h-full pb-32">
          {sections.map((section, index) => {
            switch (section.type) {
              case 'chunk-header': {
                const isCollapsed = collapsedChunks.has(section.id);
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => toggleChunk(section.id)}
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} chunk: ${section.text.replace('@@ ', '').replace(' @@', '')}`}
                    className={`
                      w-full flex items-center px-4 py-2 cursor-pointer select-none transition-all
                      ${isPrincess ? 'bg-pink-50/80 hover:bg-pink-100 text-pink-800' : 'bg-blue-50/80 hover:bg-blue-100 text-blue-800'}
                      border-y border-black/10 font-mono text-[10px] font-bold
                      focus:outline-none focus:ring-2 focus:ring-inset ${isPrincess ? 'focus:ring-pink-300' : 'focus:ring-blue-400'}
                    `}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`mr-3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    <span className="opacity-80 font-mono mr-2">@@</span>
                    <span className="truncate">{section.text.replace('@@ ', '').replace(' @@', '')}</span>
                    {isCollapsed && <span className="ml-auto bg-white/40 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest text-gray-500">Collapsed</span>}
                  </button>
                );
              }
              case 'lines': {
                if (collapsedChunks.has(section.chunkId)) return null;
                return section.lines.map((line, lidx) => (
                  <DiffLineItem key={`L-${index}-${lidx}`} line={line} isPrincess={isPrincess} filePath={file.path} mode={mode} />
                ));
              }
              case 'folded': {
                const isExpanded = expandedAutoFolds.has(section.id);
                if (collapsedChunks.has(section.chunkId)) return null;
                if (isExpanded) {
                  return (
                    <div key={section.id} className="relative">
                      <button
                        type="button"
                        onClick={() => toggleAutoFold(section.id)}
                        aria-label="Hide context"
                        className="w-full bg-gray-100/80 hover:bg-gray-200 flex items-center justify-center py-2 text-[10px] text-gray-500 cursor-pointer border-y border-gray-200 transition-colors uppercase tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-300"
                      >
                        Hide context
                      </button>
                      {section.lines.map((line, lidx) => (
                        <DiffLineItem key={`F-${section.id}-${lidx}`} line={line} isPrincess={isPrincess} filePath={file.path} mode={mode} />
                      ))}
                    </div>
                  );
                }
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => toggleAutoFold(section.id)}
                    aria-label={`Expand ${section.lineCount} hidden lines`}
                    className={`w-full py-3 flex items-center justify-center cursor-pointer group transition-all ${isPrincess ? 'bg-pink-50/40 hover:bg-pink-100/60' : 'bg-blue-50/40 hover:bg-blue-100/60'} border-y border-black/5 focus:outline-none focus:ring-2 focus:ring-inset ${isPrincess ? 'focus:ring-pink-300' : 'focus:ring-blue-400'}`}
                  >
                    <div className="flex items-center space-x-3 text-[10px] text-gray-500 group-hover:text-gray-800 transition-colors font-bold uppercase tracking-wider">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m3 16 4 4 4-4" /><path d="m7 20V4" /><path d="m21 8-4-4-4 4" /><path d="m17 4v16" />
                      </svg>
                      <span>Expand {section.lineCount} hidden lines</span>
                    </div>
                  </button>
                );
              }
              default: return null;
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default DiffView;