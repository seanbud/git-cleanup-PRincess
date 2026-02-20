import React, { useState, useCallback } from 'react';
import { GitFile, AppSettings } from '../types';
import { ContextMenuItem } from '../components/ContextMenu';

export interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
}

interface UseContextMenuOptions {
    currentBranch: string;
    onOpenGithub: () => void;
    onDiscardChanges?: (files: GitFile[]) => void;
    appSettings: AppSettings;
}

export interface UseContextMenuReturn {
    contextMenu: ContextMenuState;
    handleContextMenu: (e: React.MouseEvent, type: 'FILE' | 'REPO' | 'BRANCH', payload?: any) => void;
    closeContextMenu: () => void;
}

export function useContextMenu({ currentBranch, onOpenGithub, onDiscardChanges, appSettings }: UseContextMenuOptions): UseContextMenuReturn {
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        items: []
    });

    const handleContextMenu = useCallback((e: React.MouseEvent, type: 'FILE' | 'REPO' | 'BRANCH', payload?: any) => {
        e.preventDefault();
        const items: ContextMenuItem[] = [];

        if (type === 'FILE' && payload) {
            items.push({
                label: 'Discard Local Changes...',
                action: () => {
                    if (onDiscardChanges) {
                        onDiscardChanges([payload]);
                    }
                }
            });
            items.push({ label: 'separator', separator: true });
            items.push({
                label: 'Open with External Editor',
                action: () => {
                    window.electronAPI.openEditor(payload.path, appSettings.externalEditor || 'code');
                }
            });
            items.push({
                label: 'Open in File Explorer',
                action: async () => {
                    const cwd = await window.electronAPI.getCwd();
                    window.electronAPI.showItemInFolder(`${cwd}/${payload.path}`);
                }
            });
            items.push({
                label: 'Copy Relative Path',
                action: () => {
                    navigator.clipboard.writeText(payload.path);
                }
            });
            items.push({
                label: 'Copy Absolute Path',
                action: async () => {
                    const cwd = await window.electronAPI.getCwd();
                    navigator.clipboard.writeText(`${cwd}/${payload.path}`);
                }
            });
        } else if (type === 'REPO') {
            items.push({
                label: 'Open in File Explorer',
                action: async () => {
                    const cwd = await window.electronAPI.getCwd();
                    window.electronAPI.openDirectoryPath(cwd);
                }
            });
            items.push({ label: 'separator', separator: true });
            items.push({
                label: 'Open on GitHub',
                action: () => onOpenGithub()
            });
            items.push({
                label: 'Open in Terminal',
                action: () => {
                    const shellCmd = appSettings.shell || 'powershell';
                    window.electronAPI.openTerminal(shellCmd);
                }
            });
        } else if (type === 'BRANCH') {
            items.push({
                label: 'Copy Branch Name',
                action: () => {
                    navigator.clipboard.writeText(currentBranch);
                }
            });
        }

        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            items
        });
    }, [currentBranch, onOpenGithub, onDiscardChanges]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    }, []);

    return { contextMenu, handleContextMenu, closeContextMenu };
}
