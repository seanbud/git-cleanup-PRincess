import React from 'react';
import { ThemeMode, FileStatus } from '../types';

interface BinaryPreviewProps {
    filePath: string;
    fileStatus: FileStatus;
    mode: ThemeMode;
}

type FileCategory = 'model' | 'audio' | 'font' | 'video' | 'archive' | 'binary';

function getFileCategory(ext: string): FileCategory {
    const categories: Record<FileCategory, string[]> = {
        model: ['.fbx', '.obj', '.glb', '.gltf', '.blend', '.stl', '.3ds', '.dae'],
        audio: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'],
        font: ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
        video: ['.mp4', '.webm', '.avi', '.mov', '.mkv'],
        archive: ['.zip', '.tar', '.gz', '.rar', '.7z'],
        binary: [],
    };
    for (const [cat, exts] of Object.entries(categories)) {
        if (exts.includes(ext)) return cat as FileCategory;
    }
    return 'binary';
}

function getCategoryIcon(category: FileCategory): string {
    switch (category) {
        case 'model': return '🧊';
        case 'audio': return '🎵';
        case 'font': return '🔤';
        case 'video': return '🎬';
        case 'archive': return '📦';
        default: return '📄';
    }
}

function getCategoryLabel(category: FileCategory): string {
    switch (category) {
        case 'model': return '3D Model';
        case 'audio': return 'Audio File';
        case 'font': return 'Font File';
        case 'video': return 'Video File';
        case 'archive': return 'Archive';
        default: return 'Binary File';
    }
}

const BinaryPreview: React.FC<BinaryPreviewProps> = ({ filePath, fileStatus, mode }) => {
    const isPrincess = mode === ThemeMode.PRINCESS;
    const ext = '.' + filePath.split('.').pop()?.toLowerCase();
    const fileName = filePath.split('/').pop() || filePath;
    const category = getFileCategory(ext);
    const icon = getCategoryIcon(category);
    const label = getCategoryLabel(category);

    const statusBadge = () => {
        if (fileStatus === FileStatus.ADDED) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">New</span>;
        if (fileStatus === FileStatus.DELETED) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">Deleted</span>;
        if (fileStatus === FileStatus.MODIFIED) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Modified</span>;
        return null;
    };

    const cardBg = isPrincess ? 'bg-gradient-to-br from-pink-50 to-white' : 'bg-gradient-to-br from-blue-50 to-white';
    const cardBorder = isPrincess ? 'border-pink-200' : 'border-blue-200';
    const shadowColor = isPrincess ? 'shadow-pink-100/50' : 'shadow-blue-100/50';

    return (
        <div className="flex items-center justify-center h-full p-8">
            <div className={`${cardBg} border ${cardBorder} rounded-2xl p-8 shadow-xl ${shadowColor} max-w-sm w-full text-center`}>
                {/* Large Icon */}
                <div className="text-6xl mb-4">{icon}</div>

                {/* File Info */}
                <h3 className="font-bold text-gray-800 text-sm truncate mb-1" title={fileName}>
                    {fileName}
                </h3>
                <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">
                    {label}{' '}
                    <span className="text-gray-300">•</span>{' '}
                    <span className="font-mono text-gray-500">{ext}</span>
                </p>

                {/* Status Badge */}
                <div className="mt-2">
                    {statusBadge()}
                </div>

                {/* Decorative line */}
                <div className={`mt-6 h-px w-20 mx-auto ${isPrincess ? 'bg-pink-200' : 'bg-blue-200'}`} />
                <p className="mt-3 text-[10px] text-gray-300">
                    Binary files cannot be diffed
                </p>
            </div>
        </div>
    );
};

export default BinaryPreview;
