import React, { useState } from 'react';
import { ThemeMode } from '../types';
import ConfirmActionModal from './ConfirmActionModal';

interface ActionPanelProps {
  selectedCount: number;
  selectedPaths: string[];
  mode: ThemeMode;
  onRemove: () => void;
  onRestore: () => void;
  isProcessing: boolean;
  onHoverAction?: (action: 'REMOVE' | 'RESTORE' | null) => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({
  selectedCount,
  selectedPaths,
  mode,
  onRemove,
  onRestore,
  isProcessing,
  onHoverAction
}) => {
  const [confirmAction, setConfirmAction] = useState<'REMOVE' | 'RESTORE' | null>(null);

  const isPrincess = mode === ThemeMode.PRINCESS;
  const primaryColorClass = isPrincess ? 'bg-pink-500 hover:bg-pink-600' : 'bg-blue-600 hover:bg-blue-700';
  const secondaryColorClass = isPrincess ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200';
  const bgClass = isPrincess ? 'bg-[#fff0f6]' : 'bg-[#f0f7ff]';
  const emptyBgClass = isPrincess ? 'bg-[#fff5f9]' : 'bg-[#f4faff]';

  if (selectedCount === 0) {
    return (
      <div className={`p-4 border-t border-gray-200 ${emptyBgClass} text-center text-sm text-gray-500 italic transition-colors duration-300`}>
        Select files to clean up or restore...
      </div>
    );
  }

  return (
    <>
      <div className={`p-4 border-t border-gray-200 ${bgClass} space-y-3 shadow-lg z-10 transition-colors duration-300`}>
        <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-gray-400/80 mb-2">
          <span>{selectedCount} File{selectedCount !== 1 ? 's' : ''} Selected</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setConfirmAction('RESTORE')}
            onMouseEnter={() => onHoverAction?.('RESTORE')}
            onMouseLeave={() => onHoverAction?.(null)}
            disabled={isProcessing}
            className={`
              ${secondaryColorClass} 
              px-4 py-3 rounded-md text-sm font-medium transition-all transform active:scale-95 shadow-md hover:shadow-lg
              flex items-center justify-center space-x-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            `}
          >
            <span>✨ Restore to Upstream</span>
          </button>

          <button
            onClick={() => setConfirmAction('REMOVE')}
            onMouseEnter={() => onHoverAction?.('REMOVE')}
            onMouseLeave={() => onHoverAction?.(null)}
            disabled={isProcessing}
            className={`
              ${primaryColorClass} 
              text-white 
              px-4 py-3 rounded-md text-sm font-medium transition-all transform active:scale-95 shadow-md hover:shadow-lg
              flex items-center justify-center space-x-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            `}
          >
            <span>🗑️ Remove from PR</span>
          </button>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-gray-400">
            {isPrincess ? "Make the kingdom tidy!" : "Defend the clean code!"}
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmActionModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === 'REMOVE') onRemove();
          else if (confirmAction === 'RESTORE') onRestore();
        }}
        actionType={confirmAction || 'REMOVE'}
        fileCount={selectedCount}
        filePaths={selectedPaths}
        mode={mode}
      />
    </>
  );
};

export default ActionPanel;