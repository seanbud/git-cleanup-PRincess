import React, { useEffect, useState } from 'react';
import { ThemeMode, FileStatus } from '../types';

interface ImagePreviewProps {
    filePath: string;
    fileStatus: FileStatus;
    mode: ThemeMode;
}

interface ImageData {
    dataUri: string;
    size: number;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ filePath, fileStatus, mode }) => {
    const [oldImage, setOldImage] = useState<ImageData | null>(null);
    const [newImage, setNewImage] = useState<ImageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'side-by-side' | 'swipe'>('side-by-side');
    const [swipePosition, setSwipePosition] = useState(50);

    const isPrincess = mode === ThemeMode.PRINCESS;
    const accentColor = isPrincess ? 'pink' : 'blue';

    useEffect(() => {
        const loadImages = async () => {
            setLoading(true);
            try {
                // Load current (working tree) version
                // @ts-ignore
                const currentResult = await window.electronAPI.readFileBase64(filePath);
                if (currentResult.success) {
                    setNewImage({ dataUri: currentResult.dataUri, size: currentResult.size });
                }

                // Load old (HEAD) version
                if (fileStatus !== FileStatus.ADDED) {
                    // @ts-ignore
                    const headResult = await window.electronAPI.getGitFileBase64(filePath);
                    if (headResult.success) {
                        setOldImage({ dataUri: headResult.dataUri, size: headResult.size });
                    }
                }
            } catch (err) {
                console.error('Failed to load image preview:', err);
            }
            setLoading(false);
        };
        loadImages();
    }, [filePath, fileStatus]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                <div className="flex flex-col items-center gap-3">
                    <div className={`w-8 h-8 border-2 border-${accentColor}-300 border-t-transparent rounded-full animate-spin`} />
                    <span className="text-sm">Loading preview...</span>
                </div>
            </div>
        );
    }

    const isNewFile = fileStatus === FileStatus.ADDED || !oldImage;
    const isDeleted = fileStatus === FileStatus.DELETED || !newImage;

    // Single image display (new or deleted file)
    if (isNewFile || isDeleted) {
        const image = isNewFile ? newImage : oldImage;
        const badge = isNewFile ? 'New File' : 'Deleted';
        const badgeColor = isNewFile ? 'green' : 'red';

        return (
            <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${badgeColor}-100 text-${badgeColor}-700 border border-${badgeColor}-200`}>
                    {badge}
                </span>
                {image && (
                    <>
                        <div className={`relative rounded-xl border-2 border-dashed ${isPrincess ? 'border-pink-200' : 'border-blue-200'} p-2 bg-white shadow-lg max-w-[80%] max-h-[60vh]`}>
                            <img
                                src={image.dataUri}
                                alt={filePath}
                                className="max-w-full max-h-[55vh] object-contain rounded-lg"
                                style={{ imageRendering: 'auto' }}
                            />
                        </div>
                        <span className="text-xs text-gray-400">{formatBytes(image.size)}</span>
                    </>
                )}
            </div>
        );
    }

    // Side-by-side comparison (modified file)
    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className={`flex items-center justify-center gap-2 p-2 border-b ${isPrincess ? 'border-pink-100 bg-pink-50/50' : 'border-blue-100 bg-blue-50/50'}`}>
                <button
                    onClick={() => setViewMode('side-by-side')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'side-by-side'
                        ? `bg-${accentColor}-500 text-white shadow-sm`
                        : `text-gray-500 hover:bg-gray-100`
                        }`}
                >
                    Side by Side
                </button>
                <button
                    onClick={() => setViewMode('swipe')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'swipe'
                        ? `bg-${accentColor}-500 text-white shadow-sm`
                        : `text-gray-500 hover:bg-gray-100`
                        }`}
                >
                    Swipe
                </button>
            </div>

            {viewMode === 'side-by-side' ? (
                /* Side-by-Side View */
                <div className="flex-1 flex overflow-hidden">
                    {/* Old Version */}
                    <div className="flex-1 flex flex-col items-center justify-center p-4 border-r border-gray-200 bg-red-50/20">
                        <span className="text-xs font-bold text-red-400 mb-3 uppercase tracking-wider">Before (HEAD)</span>
                        {oldImage && (
                            <>
                                <div className="rounded-lg border border-red-200/50 p-1 bg-white shadow-sm max-w-full max-h-[50vh] overflow-hidden">
                                    <img src={oldImage.dataUri} alt="Old version" className="max-w-full max-h-[45vh] object-contain" />
                                </div>
                                <span className="text-[10px] text-gray-400 mt-2">{formatBytes(oldImage.size)}</span>
                            </>
                        )}
                    </div>

                    {/* New Version */}
                    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-green-50/20">
                        <span className="text-xs font-bold text-green-500 mb-3 uppercase tracking-wider">After (Working Tree)</span>
                        {newImage && (
                            <>
                                <div className="rounded-lg border border-green-200/50 p-1 bg-white shadow-sm max-w-full max-h-[50vh] overflow-hidden">
                                    <img src={newImage.dataUri} alt="New version" className="max-w-full max-h-[45vh] object-contain" />
                                </div>
                                <span className="text-[10px] text-gray-400 mt-2">{formatBytes(newImage.size)}</span>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                /* Swipe View */
                <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
                    <div className="relative max-w-[80%] max-h-[60vh]">
                        {/* Old image (full) */}
                        {oldImage && (
                            <img src={oldImage.dataUri} alt="Old version" className="max-w-full max-h-[55vh] object-contain" />
                        )}
                        {/* New image (clipped) */}
                        {newImage && (
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ clipPath: `inset(0 ${100 - swipePosition}% 0 0)` }}
                            >
                                <img src={newImage.dataUri} alt="New version" className="max-w-full max-h-[55vh] object-contain" />
                            </div>
                        )}
                        {/* Swipe handle */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize z-10"
                            style={{ left: `${swipePosition}%` }}
                        >
                            <div className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-${accentColor}-400 shadow-md flex items-center justify-center`}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </div>
                        </div>
                    </div>
                    {/* Swipe slider */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={swipePosition}
                        onChange={(e) => setSwipePosition(Number(e.target.value))}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 accent-pink-500"
                    />
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-8 text-[10px] text-gray-400">
                        <span>← Before</span>
                        <span>After →</span>
                    </div>
                </div>
            )}

            {/* Size comparison footer */}
            {oldImage && newImage && (
                <div className={`flex justify-center gap-6 py-2 border-t text-[10px] ${isPrincess ? 'border-pink-100 bg-pink-50/30' : 'border-blue-100 bg-blue-50/30'}`}>
                    <span className="text-gray-500">
                        Size change: {formatBytes(oldImage.size)} → {formatBytes(newImage.size)}
                        {' '}
                        <span className={newImage.size > oldImage.size ? 'text-red-500' : 'text-green-500'}>
                            ({newImage.size > oldImage.size ? '+' : ''}{formatBytes(Math.abs(newImage.size - oldImage.size))})
                        </span>
                    </span>
                </div>
            )}
        </div>
    );
};

export default ImagePreview;
