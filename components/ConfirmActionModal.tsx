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
    const [copied, setCopied] = useState(false);
    const isPrincess = mode === ThemeMode.PRINCESS;
    const isRemove = actionType === 'REMOVE';

    const title = isRemove ? '🗑️ Move to Trash' : '✨ Restore to Upstream';

    const description = isRemove
        ? 'This will delete the selected files from your disk (a backup copy is sent to the Recycle Bin where you can restore it if needed). If a file was already tracked in the upstream branch, this simply deletes it so you can commit and push the deletion.'
        : 'This will revert the selected files to exactly match the upstream branch. Any local modifications or changes committed on this branch will be overwritten by checking out the upstream version. A backup copy of your current local file will be sent to the Recycle Bin so you can restore it if needed.';

    const formatCommand = (base: string, paths: string[]) => {
        if (paths.length === 0) return null;
        const quoted = paths.map(p => `"${p}"`);
        return {
            display: `${base} \\\n  ${quoted.join(' \\\n  ')}`,
            raw: `${base} ${quoted.join(' ')}`
        };
    };

    const getGitCommands = () => {
        const quotedPaths = files.map(f => `"${f.path}"`);
        const results: { display: string; raw: string; isComment?: boolean }[] = [];

        if (isRemove) {
            results.push({ display: `# 1. Backup to OS Recycle Bin`, raw: `# 1. Backup to OS Recycle Bin`, isComment: true });
            results.push({ display: `trash-item \\\n  ${quotedPaths.join(' \\\n  ')}`, raw: `trash-item ${quotedPaths.join(' ')}` });
            results.push({ display: '', raw: '' });
            results.push({ display: `# 2. Untrack from Git (--ignore-unmatch)`, raw: `# 2. Untrack from Git (--ignore-unmatch)`, isComment: true });
            results.push({ display: `git rm --cached -f \\\n  ${quotedPaths.join(' \\\n  ')}`, raw: `git rm --cached -f ${quotedPaths.join(' ')}` });
        } else {
            const added = files.filter(f => f.status === FileStatus.ADDED).map(f => f.path);
            const modified = files.filter(f => f.status === FileStatus.MODIFIED || f.status === FileStatus.RENAMED).map(f => f.path);
            const deleted = files.filter(f => f.status === FileStatus.DELETED).map(f => f.path);

            const branch = comparisonBranch || 'HEAD';

            if (added.length > 0) {
                const addedQuoted = added.map(p => `"${p}"`).join(' ');
                results.push({ display: `# Untrack Newly Added Files`, raw: `# Untrack Newly Added Files`, isComment: true });
                results.push({ 
                    display: `trash-item \\\n  ${added.map(p => `"${p}"`).join(' \\\n  ')} && \\\ngit rm --cached -f \\\n  ${added.map(p => `"${p}"`).join(' \\\n  ')}`, 
                    raw: `trash-item ${addedQuoted} && git rm --cached -f ${addedQuoted}` 
                });
                results.push({ display: '', raw: '' });
            }

            if (modified.length > 0) {
                const modQuoted = modified.map(p => `"${p}"`).join(' ');
                results.push({ display: `# Backup & Restore Modified Files`, raw: `# Backup & Restore Modified Files`, isComment: true });
                results.push({ display: `trash-item \\\n  ${modified.map(p => `"${p}"`).join(' \\\n  ')}`, raw: `trash-item ${modQuoted}` });
                results.push({ display: `git reset HEAD -- \\\n  ${modified.map(p => `"${p}"`).join(' \\\n  ')}`, raw: `git reset HEAD -- ${modQuoted}` });
                results.push({ display: `git checkout ${branch} -- \\\n  ${modified.map(p => `"${p}"`).join(' \\\n  ')}`, raw: `git checkout ${branch} -- ${modQuoted}` });
                results.push({ display: '', raw: '' });
            }

            if (deleted.length > 0) {
                const delQuoted = deleted.map(p => `"${p}"`).join(' ');
                results.push({ display: `# Restore Deleted Files`, raw: `# Restore Deleted Files`, isComment: true });
                results.push({ display: `git reset HEAD -- \\\n  ${deleted.map(p => `"${p}"`).join(' \\\n  ')}`, raw: `git reset HEAD -- ${delQuoted}` });
                results.push({ display: `git checkout ${branch} -- \\\n  ${deleted.map(p => `"${p}"`).join(' \\\n  ')}`, raw: `git checkout ${branch} -- ${delQuoted}` });
            }
        }
        return results;
    };

    const handleCopy = () => {
        const raw = getGitCommands()
            .filter(c => c.raw && !c.isComment)
            .map(c => c.raw)
            .join(' && ');
        navigator.clipboard.writeText(raw);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const confirmButtonClass = isRemove
        ? (isPrincess ? 'bg-pink-500 hover:bg-pink-600 shadow-pink-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20')
        : (isPrincess ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/20' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} mode={mode} maxWidth="max-w-3xl">
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
                <div className="relative">
                    <div className="flex items-center justify-between">
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
                            <button
                                onClick={handleCopy}
                                className={`text-[10px] flex items-center space-x-1 px-2 py-1 rounded transition-colors ${copied
                                        ? (isPrincess ? 'text-green-600 bg-green-50' : 'text-green-400 bg-green-900/20')
                                        : (isPrincess ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50')
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        <span>Copy Command</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {showDetails && (
                        <div className={`mt-2 rounded-lg border overflow-hidden ${isPrincess ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-800'
                            }`}>
                            <div className="p-3 overflow-x-auto max-h-60 overflow-y-auto">
                                <pre className={`text-[11px] font-mono whitespace-pre select-text ${isPrincess ? 'text-slate-600' : 'text-slate-300'
                                    }`}>
                                    {getGitCommands().map(c => c.display).join('\n')}
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
