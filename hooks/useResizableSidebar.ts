import React, { useState, useCallback, useEffect, useRef } from 'react';

export interface UseResizableSidebarReturn {
    sidebarWidth: number;
    isResizing: boolean;
    sidebarRef: React.RefObject<HTMLDivElement | null>;
    startResizing: (e: React.MouseEvent) => void;
}

export function useResizableSidebar(initialWidth = 320): UseResizableSidebarReturn {
    const [sidebarWidth, setSidebarWidth] = useState(initialWidth);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement | null>(null);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX;
            if (newWidth > 200 && newWidth < 600) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    return { sidebarWidth, isResizing, sidebarRef, startResizing };
}
