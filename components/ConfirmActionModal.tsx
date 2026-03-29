import React, { useState } from 'react';
import Modal from './Modal';
import { ThemeMode, GitFile, FileStatus } from '../types';

interface ConfirmActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    actionType: 'REMOVE' | 'RESTORE';
    fileCount: number;
    files: GitFile[];
    mode: ThemeMode;
    comparisonBranch?: string;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    actionType,
    fileCount,
    files,
    mode,
    comparisonBranch
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const isPrincess = mode === ThemeMode.PRINCESS;
    const isRemove = actionType === 'REMOVE';

    const title = isRemove ? '🗑️ Move to Trash' : '✨ Restore to Upstream';

    const description = isRemove
        ? 'This will delete the selected files from your disk (a backup copy is sent to the Recycle Bin where you can restore it if needed). If a file was already tracked in the upstream branch, this simply deletes it so you can commit and push the deletion.'
        : 'This will revert the selected files to exactly match the upstream branch. Any local modifications or changes committed on this branch will be overwritten by checking out the upstream version. A backup copy of your current local file will be sent to the Recycle Bin so you can restore it if needed.';

    const getGitCommands = () => {
        if (isRemove) {
            const quotedPaths = files.map(f => `"${f.path}"`).join(' ');
            return [
                `# 1. Backup to OS Recycle Bin`,
                `trash-item ${quotedPaths}`,
                ``,
                `# 2. Untrack from Git (--ignore-unmatch)`,
                `git rm --cached -f ${quotedPaths}`
            ];
        } else {
            const added = files.filter(f => f.status === FileStatus.ADDED).map(f => `"${f.path}"`).join(' ');
            const modified = files.filter(f => f.status === FileStatus.MODIFIED || f.status === FileStatus.RENAMED).map(f => `"${f.path}"`).join(' ');
            const deleted = files.filter(f => f.status === FileStatus.DELETED).map(f => `"${f.path}"`).join(' ');
            
            const branch = comparisonBranch || 'HEAD'; 
            const cmds: string[] = [];

            if (added) {
                cmds.push(`# Untrack Newly Added Files`);
                cmds.push(`trash-item ${added} && git rm --cached -f ${added}`);
                cmds.push('');
            }

            if (modified) {
                cmds.push(`# Backup & Restore Modified Files`);
                cmds.push(`trash-item ${modified}`);
                cmds.push(`git reset HEAD -- ${modified}`);
                cmds.push(`git checkout ${branch} -- ${modified}`);
                cmds.push('');
            }

            if (deleted) {
                cmds.push(`# Restore Deleted Files`);
                cmds.push(`git reset HEAD -- ${deleted}`);
                cmds.push(`git checkout ${branch} -- ${deleted}`);
            }

            return cmds;
        }
    };

    const confirmButtonClass = isRemove
        ? (isPrincess ? 'bg-pink-500 hover:bg-pink-600 shadow-pink-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20')
        : (isPrincess ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/20' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} mode={mode} maxWidth="max-w-md">
            <div className="space-y-4">
                {/* Description */}
                <p className={`text-sm leading-relaxed ${isPrincess ? 'text-slate-600' : 'text-slate-300'}`}>
                    {description}
                </p>

                {/* File count badge */}
                <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${isPrincess ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                    }`}>
                    📄 {fileCount} file{fileCount !== 1 ? 's' : ''} selected
                </div>

                {/* Expandable git commands */}
                <div>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className={`text-xs flex items-center space-x-1 transition-colors ${isPrincess ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <svg
                            className={`w-3 h-3 transition-transform duration-200 ${showDetails ? 'rotate-90' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span>{showDetails ? 'Hide' : 'See'} git commands</span>
                    </button>

                    {showDetails && (
                        <div className={`mt-2 rounded-lg border overflow-hidden ${isPrincess ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-800'
                            }`}>
                            <div className="p-3 overflow-x-auto max-h-40 overflow-y-auto">
                                <pre className={`text-[11px] leading-relaxed font-mono whitespace-pre ${isPrincess ? 'text-slate-600' : 'text-slate-300'
                                    }`}>
                                    {getGitCommands().join('\n')}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex justify-end items-center space-x-3 pt-2">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 text-sm rounded-md transition-colors ${isPrincess ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all active:scale-[0.97] ${confirmButtonClass}`}
                    >
                        {isRemove ? '🗑️ Trash' : '✨ Restore'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmActionModal;
