import React, { useMemo, useState } from 'react';
import { GitFile, ThemeMode } from '../types';

interface DiffViewProps {
  file: GitFile | null;
  mode: ThemeMode;
}

type DiffLine = {
  text: string;
  type: 'added' | 'removed' | 'context' | 'header';
  originalIndex: number;
};

type DiffSection = 
  | { type: 'lines'; lines: DiffLine[] }
  | { type: 'folded'; lineCount: number; startLineIndex: number };

const DiffView: React.FC<DiffViewProps> = ({ file, mode }) => {
  const isPrincess = mode === ThemeMode.PRINCESS;
  const bgClass = isPrincess ? 'bg-[#fffbfc]' : 'bg-[#f8fbff]'; 
  const headerBgClass = isPrincess ? 'bg-[#fff0f6]' : 'bg-[#f0f7ff]';
  
  // State to track which folded sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  // Parse diff into fold-able structure
  const sections: DiffSection[] = useMemo(() => {
    if (!file || !file.diffContent) return [];

    const rawLines = file.diffContent.split('\n');
    const result: DiffSection[] = [];
    let currentBuffer: DiffLine[] = [];
    let unchangedCount = 0;
    const FOLD_THRESHOLD = 12; // If more than 12 lines unchanged, fold them

    rawLines.forEach((line, idx) => {
      let type: DiffLine['type'] = 'context';
      if (line.startsWith('+')) type = 'added';
      else if (line.startsWith('-')) type = 'removed';
      else if (line.startsWith('@@')) type = 'header';

      // Always keep headers visible, flush buffer
      if (type === 'header') {
        if (currentBuffer.length > 0) {
           result.push({ type: 'lines', lines: [...currentBuffer] });
           currentBuffer = [];
        }
        unchangedCount = 0;
        result.push({ type: 'lines', lines: [{ text: line, type: 'header', originalIndex: idx }] });
        return;
      }

      if (type === 'context') {
        unchangedCount++;
        currentBuffer.push({ text: line, type, originalIndex: idx });
      } else {
        // We hit a change. 
        // If we have a massive buffer of unchanged code, split it.
        // We want to keep ~3 lines of context before the change.
        if (unchangedCount > FOLD_THRESHOLD) {
           // We have [Context... (Big Gap) ... Context]
           // However, since we iterate linearly, `currentBuffer` currently holds 
           // [Line 1 ... Line N]. 
           // We want to keep first 3 lines (after previous change) and last 3 lines (before current change).
           // BUT logic is simpler: If buffer > threshold, fold the MIDDLE.
           
           const keepStart = 4;
           const keepEnd = 4;
           
           if (currentBuffer.length > (keepStart + keepEnd)) {
              // Push the start context
              result.push({ type: 'lines', lines: currentBuffer.slice(0, keepStart) });
              
              // Push the fold
              const foldedCount = currentBuffer.length - keepStart - keepEnd;
              // Use the index of the first folded line as the key
              const foldKey = currentBuffer[keepStart].originalIndex; 
              result.push({ type: 'folded', lineCount: foldedCount, startLineIndex: foldKey });

              // Push the end context
              result.push({ type: 'lines', lines: currentBuffer.slice(currentBuffer.length - keepEnd) });
           } else {
              result.push({ type: 'lines', lines: [...currentBuffer] });
           }
        } else {
           if (currentBuffer.length > 0) {
              result.push({ type: 'lines', lines: [...currentBuffer] });
           }
        }
        currentBuffer = [];
        unchangedCount = 0;
        
        // Push the changed line immediately
        result.push({ type: 'lines', lines: [{ text: line, type, originalIndex: idx }] });
      }
    });

    // Flush remaining
    if (currentBuffer.length > 0) {
       // If trailing context is huge
       if (currentBuffer.length > FOLD_THRESHOLD) {
          const keepStart = 4;
          result.push({ type: 'lines', lines: currentBuffer.slice(0, keepStart) });
          const foldKey = currentBuffer[keepStart].originalIndex;
          result.push({ type: 'folded', lineCount: currentBuffer.length - keepStart, startLineIndex: foldKey });
       } else {
          result.push({ type: 'lines', lines: currentBuffer });
       }
    }

    return result;
  }, [file]);

  const toggleFold = (key: number) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setExpandedSections(newSet);
  };

  if (!file) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-gray-400 ${bgClass} select-none`}>
        <div className={`w-20 h-20 mb-4 rounded-full ${headerBgClass} flex items-center justify-center shadow-inner`}>
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
             <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
             <polyline points="14 2 14 8 20 8"></polyline>
             <line x1="16" y1="13" x2="8" y2="13"></line>
             <line x1="16" y1="17" x2="8" y2="17"></line>
             <polyline points="10 9 9 9 8 9"></polyline>
           </svg>
        </div>
        <p className="font-chewy text-lg tracking-wide opacity-60">Select a file to inspect</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${bgClass} font-mono text-xs md:text-sm transition-colors duration-300 relative`}>
      <div className={`p-3 border-b border-gray-200/80 ${headerBgClass} flex items-center justify-between sticky top-0 z-10 shadow-sm backdrop-blur-sm bg-opacity-90`}>
        <div className="flex items-center space-x-2 overflow-hidden">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
           </svg>
           <span className="font-semibold text-gray-700 truncate">{file.path}</span>
        </div>
        <div className="flex space-x-3 text-xs font-medium shrink-0">
           <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">+{file.linesAdded} lines</span>
           <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">-{file.linesRemoved} lines</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-0 pb-10">
        <div className="min-h-full">
           {sections.map((section, idx) => {
             if (section.type === 'folded') {
               const isExpanded = expandedSections.has(section.startLineIndex);
               
               if (isExpanded) {
                  return (
                     <div key={`fold-${idx}`} className="bg-gray-100/50 py-2 px-4 border-y border-gray-200 text-center text-gray-400 italic text-xs">
                        Expanded context placeholder...
                        <button 
                          onClick={() => toggleFold(section.startLineIndex)} 
                          className="ml-2 text-blue-500 hover:underline"
                        >
                           Collapse
                        </button>
                     </div>
                  );
               }

               return (
                 <div key={`fold-${idx}`} className={`group relative h-8 ${isPrincess ? 'bg-pink-50/50' : 'bg-blue-50/50'} border-y ${isPrincess ? 'border-pink-100' : 'border-blue-100'} flex items-center justify-center cursor-pointer hover:bg-opacity-100 transition-colors`} onClick={() => toggleFold(section.startLineIndex)}>
                    <div className={`absolute left-0 w-1 h-full ${isPrincess ? 'bg-pink-300' : 'bg-blue-300'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className="flex items-center space-x-2 text-xs opacity-60 group-hover:opacity-100 transition-opacity select-none">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="17 11 12 6 7 11"></polyline>
                          <polyline points="17 18 12 13 7 18"></polyline>
                       </svg>
                       <span>Expand {section.lineCount} lines of context</span>
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="7 13 12 18 17 13"></polyline>
                          <polyline points="7 6 12 11 17 6"></polyline>
                       </svg>
                    </div>
                 </div>
               );
             }

             return section.lines.map((line, lineIdx) => {
                const uniqueKey = `${idx}-${lineIdx}-${line.originalIndex}`;
                let lineBgClass = '';
                let textClass = 'text-gray-600';
                
                if (line.type === 'added') {
                  lineBgClass = isPrincess ? 'bg-pink-100/40' : 'bg-green-100/30';
                  textClass = isPrincess ? 'text-pink-900' : 'text-green-900';
                } else if (line.type === 'removed') {
                  lineBgClass = isPrincess ? 'bg-purple-100/40' : 'bg-red-100/30';
                  textClass = isPrincess ? 'text-purple-900' : 'text-red-900';
                } else if (line.type === 'header') {
                  lineBgClass = isPrincess ? 'bg-pink-50 text-pink-400' : 'bg-blue-50 text-blue-400';
                  textClass = 'font-bold opacity-80';
                }

                return (
                  <div key={uniqueKey} className={`${lineBgClass} flex hover:opacity-100 transition-opacity`}>
                    {/* Line Number */}
                    <div className="w-10 shrink-0 select-none text-right pr-3 py-[1px] text-[10px] text-gray-300 border-r border-gray-100 bg-white/30 font-mono">
                      {line.originalIndex + 1}
                    </div>
                    {/* Code Content */}
                    <div className={`px-3 py-[1px] whitespace-pre-wrap break-all ${textClass} font-mono leading-relaxed w-full`}>
                      {line.text}
                    </div>
                  </div>
                );
             });
           })}
        </div>
      </div>
    </div>
  );
};

export default DiffView;