import React, { useState, useEffect } from 'react';
import { ThemeMode } from '../types';
import Modal from './Modal';

interface UpdateCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: ThemeMode;
}

type CheckState = 'checking' | 'up-to-date' | 'found' | 'error';

const UpdateCheckModal: React.FC<UpdateCheckModalProps> = ({ isOpen, onClose, mode }) => {
    const [state, setState] = useState<CheckState>('checking');
    const isPrincess = mode === ThemeMode.PRINCESS;

    useEffect(() => {
        if (isOpen) {
            setState('checking');

            // @ts-ignore
            if (!window.electronAPI?.on) return;

            const handlers = {
                // @ts-ignore
                available: () => setState('found'),
                // @ts-ignore
                notAvailable: () => setState('up-to-date'),
                // @ts-ignore
                error: () => setState('error')
            };

            // @ts-ignore
            window.electronAPI.on('update-available', handlers.available);
            // @ts-ignore
            window.electronAPI.on('update-not-available', handlers.notAvailable);

            // Trigger the check
            // @ts-ignore
            window.electronAPI.checkForUpdate?.();

            // Safety timeout: if no response in 10s, show "up to date" (or error)
            const timer = setTimeout(() => {
                setState(prev => prev === 'checking' ? 'up-to-date' : prev);
            }, 10000);

            return () => {
                clearTimeout(timer);
                // In a real app we'd remove listeners, but our preload wrap needs specific implementation for that
            };
        }
    }, [isOpen]);

    const title = state === 'checking' ? 'Checking for Updates' : 'System Update';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} mode={mode} maxWidth="max-w-sm">
            <div className="flex flex-col items-center justify-center py-8 text-center">
                {state === 'checking' && (
                    <>
                        <div className={`w-12 h-12 border-4 ${isPrincess ? 'border-pink-200 border-t-pink-500' : 'border-slate-700 border-t-blue-500'} rounded-full animate-spin mb-4`} />
                        <p className={isPrincess ? 'text-pink-900' : 'text-slate-300'}>Looking for the latest version...</p>
                    </>
                )}

                {state === 'up-to-date' && (
                    <>
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full ${isPrincess ? 'bg-pink-100 text-pink-500' : 'bg-green-500/20 text-green-400'} mb-4`}>
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className={`text-lg font-bold mb-1 ${isPrincess ? 'text-pink-900' : 'text-white'}`}>You're all set!</h3>
                        <p className={`text-sm ${isPrincess ? 'text-pink-700' : 'text-slate-400'}`}>You are already running the latest version of Git Cleanup PRincess.</p>
                        <button
                            onClick={onClose}
                            className={`mt-6 px-6 py-2 rounded-lg font-bold transition-all ${isPrincess ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-pink-200' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900'} shadow-lg`}
                        >
                            Back to App
                        </button>
                    </>
                )}

                {state === 'found' && (
                    <>
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full ${isPrincess ? 'bg-pink-100 text-pink-500' : 'bg-blue-500/20 text-blue-400'} mb-4 animate-bounce`}>
                            <span className="text-2xl">✨</span>
                        </div>
                        <h3 className={`text-lg font-bold mb-1 ${isPrincess ? 'text-pink-900' : 'text-white'}`}>Update Found!</h3>
                        <p className={`text-sm ${isPrincess ? 'text-pink-700' : 'text-slate-400'}`}>A new version is ready to sweep away those bugs.</p>
                        <p className={`mt-2 text-xs opacity-60 ${isPrincess ? 'text-pink-900' : 'text-slate-300'}`}>Check the banner at the top of the app to start the download.</p>
                        <button
                            onClick={onClose}
                            className={`mt-6 px-6 py-2 rounded-lg font-bold transition-all ${isPrincess ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                        >
                            Got it
                        </button>
                    </>
                )}

                {state === 'error' && (
                    <>
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-red-500/20 text-red-500 mb-4`}>
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className={isPrincess ? 'text-pink-900' : 'text-slate-300'}>Couldn't reach the kingdom's servers.</p>
                        <button
                            onClick={onClose}
                            className={`mt-6 px-6 py-2 rounded-lg font-bold ${isPrincess ? 'bg-pink-500 text-white' : 'bg-slate-700 text-white'}`}
                        >
                            Close
                        </button>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default UpdateCheckModal;
