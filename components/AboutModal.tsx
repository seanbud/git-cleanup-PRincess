import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { ThemeMode } from '../types';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: ThemeMode;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, mode }) => {
    const isPrincess = mode === ThemeMode.PRINCESS;
    const [version, setVersion] = useState('...');
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'upToDate'>('idle');

    useEffect(() => {
        if (isOpen) {
            // @ts-ignore
            window.electronAPI.getAppVersion?.().then((v: string) => setVersion(v || '1.0.0'));
            setUpdateStatus('idle');
        }
    }, [isOpen]);

    const handleCheckUpdate = () => {
        setUpdateStatus('checking');
        // @ts-ignore
        window.electronAPI.checkForUpdate?.();

        // @ts-ignore
        window.electronAPI.on('update-available', () => setUpdateStatus('available'));
        // @ts-ignore
        window.electronAPI.on('update-not-available', () => setUpdateStatus('upToDate'));

        // Timeout after 8s
        setTimeout(() => {
            setUpdateStatus(prev => prev === 'checking' ? 'upToDate' : prev);
        }, 8000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" mode={mode}>
            <div className="flex flex-col items-center text-center py-2 -mt-4">
                {/* App Icon */}
                <div className={`w-24 h-24 rounded-2xl overflow-hidden shadow-lg mb-4 ring-4 ${isPrincess ? 'ring-pink-200' : 'ring-blue-200'}`}>
                    <img src="/sprites/app-icon.png" alt="Git Cleanup PRincess" className="w-full h-full object-cover" />
                </div>

                {/* App Name */}
                <h2 className={`text-xl font-chewy tracking-wide mb-1 ${isPrincess ? 'text-pink-700' : 'text-blue-600'}`}>
                    Git Cleanup PRincess
                </h2>

                {/* Version */}
                <div className={`text-xs font-mono px-3 py-1 rounded-full mb-4 ${isPrincess ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-500'}`}>
                    v{version}
                </div>

                {/* Description */}
                <p className={`text-sm mb-4 max-w-[280px] leading-relaxed ${isPrincess ? 'text-pink-800/70' : 'text-slate-500'}`}>
                    A gamified Git cleanup tool fit for royalty. Stage, review, and clean your changes with style.
                </p>

                {/* Links */}
                <div className="flex items-center gap-4 mb-5">
                    <button
                        onClick={() => {
                            // @ts-ignore
                            window.electronAPI.openExternal('https://github.com/seanbud/git-cleanup-PRincess');
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${isPrincess ? 'border-pink-200 hover:bg-pink-50 text-pink-600' : 'border-blue-200 hover:bg-blue-50 text-blue-500'}`}
                    >
                        ⭐ GitHub
                    </button>
                    <button
                        onClick={() => {
                            // @ts-ignore
                            window.electronAPI.openExternal('https://github.com/seanbud/git-cleanup-PRincess/issues');
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${isPrincess ? 'border-pink-200 hover:bg-pink-50 text-pink-600' : 'border-blue-200 hover:bg-blue-50 text-blue-500'}`}
                    >
                        🐛 Report Issue
                    </button>
                </div>

                {/* Update Check */}
                <div className={`w-full pt-4 border-t ${isPrincess ? 'border-pink-100' : 'border-slate-200'}`}>
                    {updateStatus === 'idle' && (
                        <button
                            onClick={handleCheckUpdate}
                            className={`text-xs px-4 py-2 rounded-lg font-bold transition-all active:scale-95 ${isPrincess ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-sm shadow-pink-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20'}`}
                        >
                            Check for Updates
                        </button>
                    )}
                    {updateStatus === 'checking' && (
                        <div className={`text-xs flex items-center justify-center gap-2 ${isPrincess ? 'text-pink-500' : 'text-blue-500'}`}>
                            <span className="animate-spin">⏳</span> Checking for updates...
                        </div>
                    )}
                    {updateStatus === 'upToDate' && (
                        <div className="text-xs text-green-600 flex items-center justify-center gap-1">
                            ✓ You're up to date!
                        </div>
                    )}
                    {updateStatus === 'available' && (
                        <div className={`text-xs flex items-center justify-center gap-1 ${isPrincess ? 'text-pink-600' : 'text-blue-500'}`}>
                            🎉 Update available! Check the banner above.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-4 text-[10px] opacity-30">
                    Made with 💖 by seanbud
                </div>
            </div>
        </Modal>
    );
};

export default AboutModal;
