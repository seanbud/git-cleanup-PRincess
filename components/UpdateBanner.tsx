import React, { useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface UpdateInfo {
    version: string;
    releaseNotes?: string;
}

interface DownloadProgress {
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
}

interface UpdateBannerProps {
    mode: ThemeMode;
}

type UpdateState = 'idle' | 'available' | 'downloading' | 'downloaded';

const UpdateBanner: React.FC<UpdateBannerProps> = ({ mode }) => {
    const [state, setState] = useState<UpdateState>('idle');
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [progress, setProgress] = useState<DownloadProgress | null>(null);
    const [dismissed, setDismissed] = useState(false);

    const isPrincess = mode === ThemeMode.PRINCESS;

    useEffect(() => {
        // @ts-ignore
        if (!window.electronAPI?.on) return;

        // @ts-ignore
        window.electronAPI.on('update-available', (info: UpdateInfo) => {
            setUpdateInfo(info);
            setState('available');
        });

        // @ts-ignore
        window.electronAPI.on('update-download-progress', (prog: DownloadProgress) => {
            setProgress(prog);
            setState('downloading');
        });

        // @ts-ignore
        window.electronAPI.on('update-downloaded', () => {
            setState('downloaded');
        });
    }, []);

    if (state === 'idle' || dismissed) return null;

    const handleDownload = async () => {
        // @ts-ignore
        await window.electronAPI.downloadUpdate();
        setState('downloading');
    };

    const handleInstall = () => {
        // @ts-ignore
        window.electronAPI.installUpdate();
    };

    const bgColor = isPrincess
        ? 'bg-gradient-to-r from-pink-500 to-rose-400'
        : 'bg-gradient-to-r from-blue-600 to-indigo-500';

    // @ts-ignore
    const isWindows = window.electronAPI?.platform === 'win32';
    const paddingRight = isWindows ? 'pr-[140px]' : 'px-4';

    return (
        <div className={`${bgColor} text-white ${isWindows ? 'pl-4' : ''} ${paddingRight} py-2 flex items-center justify-between text-xs shadow-lg z-[200] relative`}>
            <div className="flex items-center gap-2">
                <span className="text-sm">✨</span>
                {state === 'available' && (
                    <span>
                        <strong>Version {updateInfo?.version}</strong> is available!
                    </span>
                )}
                {state === 'downloading' && (
                    <span className="flex items-center gap-2">
                        Downloading update...
                        {progress && (
                            <span className="bg-white/20 rounded-full px-2 py-0.5">
                                {Math.round(progress.percent)}%
                            </span>
                        )}
                    </span>
                )}
                {state === 'downloaded' && (
                    <span>Update ready! Restart to apply.</span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {state === 'available' && (
                    <button
                        onClick={handleDownload}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md font-bold transition-colors"
                    >
                        Download
                    </button>
                )}
                {state === 'downloaded' && (
                    <button
                        onClick={handleInstall}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md font-bold transition-colors"
                    >
                        Restart Now
                    </button>
                )}
                {state !== 'downloading' && (
                    <button
                        onClick={() => setDismissed(true)}
                        className="opacity-60 hover:opacity-100 transition-opacity p-1"
                        title="Dismiss"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Progress bar */}
            {state === 'downloading' && progress && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                    <div
                        className="h-full bg-white/60 transition-all duration-300"
                        style={{ width: `${progress.percent}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default UpdateBanner;
