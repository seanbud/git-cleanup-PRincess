import React, { useEffect } from 'react';
import { ThemeMode } from '../types';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    mode: ThemeMode;
    maxWidth?: string;
    preventClose?: boolean;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    mode,
    maxWidth = 'max-w-2xl',
    preventClose = false
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !preventClose) onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, preventClose]);

    if (!isOpen) return null;

    const isPrincess = mode === ThemeMode.PRINCESS;
    const bgClass = isPrincess ? 'bg-white' : 'bg-slate-900';
    const textClass = isPrincess ? 'text-slate-800' : 'text-slate-100';
    const titleBarClass = isPrincess ? 'bg-pink-50 border-pink-100' : 'bg-slate-800 border-slate-700';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => !preventClose && onClose()}
            />

            {/* Modal Container */}
            <div className={`relative w-full ${maxWidth} ${bgClass} rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 border ${isPrincess ? 'border-pink-100' : 'border-slate-700'}`}>

                {/* Title Bar */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${titleBarClass}`}>
                    <h2 className={`text-lg font-bold ${textClass}`}>{title}</h2>
                    {!preventClose && (
                        <button
                            onClick={onClose}
                            className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${textClass}`}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
