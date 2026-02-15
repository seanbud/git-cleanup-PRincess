import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { GitFile } from '../types';

interface UseFileFilterOptions {
    files: GitFile[];
    selectedFileIds: Set<string>;
    onSelectionChange: (newSet: Set<string>) => void;
}

export interface UseFileFilterReturn {
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    filteredFiles: GitFile[];
    allFilteredSelected: boolean;
    someFilteredSelected: boolean;
    selectAllRef: React.RefObject<HTMLInputElement | null>;
    toggleSelectAll: () => void;
}

export function useFileFilter({ files, selectedFileIds, onSelectionChange }: UseFileFilterOptions): UseFileFilterReturn {
    const [searchQuery, setSearchQuery] = useState('');
    const selectAllRef = useRef<HTMLInputElement | null>(null);

    const filteredFiles = useMemo(() => {
        const rawQuery = searchQuery.trim();
        if (!rawQuery) return files;

        const terms = rawQuery.split(/\s+/).filter(Boolean);

        const processedTerms = terms.map(term => {
            // Handle Glob patterns (e.g. *.md, src/*)
            if (term.includes('*')) {
                const escapeRegex = (str: string) => str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
                const pattern = term.split('*').map(escapeRegex).join('.*');
                return new RegExp(`^${pattern}$`, 'i');
            }
            return term.toLowerCase();
        });

        return files.filter(f => {
            const filePath = f.path;
            return processedTerms.every(term => {
                if (term instanceof RegExp) {
                    return term.test(filePath);
                }
                return filePath.toLowerCase().includes(term);
            });
        });
    }, [files, searchQuery]);

    const allFilteredSelected = filteredFiles.length > 0 && filteredFiles.every(f => selectedFileIds.has(f.id));
    const someFilteredSelected = filteredFiles.length > 0 && filteredFiles.some(f => selectedFileIds.has(f.id)) && !allFilteredSelected;

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = someFilteredSelected;
        }
    }, [someFilteredSelected]);

    const toggleSelectAll = useCallback(() => {
        const newSet = new Set(selectedFileIds);
        if (allFilteredSelected) {
            filteredFiles.forEach(f => newSet.delete(f.id));
        } else {
            filteredFiles.forEach(f => newSet.add(f.id));
        }
        onSelectionChange(newSet);
    }, [selectedFileIds, allFilteredSelected, filteredFiles, onSelectionChange]);

    return {
        searchQuery,
        setSearchQuery,
        filteredFiles,
        allFilteredSelected,
        someFilteredSelected,
        selectAllRef,
        toggleSelectAll,
    };
}
