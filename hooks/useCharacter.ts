import React, { useState, useEffect } from 'react';
import { CharacterState } from '../types';
import { audioService } from '../services/audioService';

interface UseCharacterOptions {
    selectedCount: number;
    isProcessing: boolean;
    actionHover: 'REMOVE' | 'RESTORE' | null;
}

export interface UseCharacterReturn {
    characterState: CharacterState;
    setCharacterState: React.Dispatch<React.SetStateAction<CharacterState>>;
}

export function useCharacter({ selectedCount, isProcessing, actionHover }: UseCharacterOptions): UseCharacterReturn {
    const [characterState, setCharacterState] = useState<CharacterState>(CharacterState.IDLE);

    // Initial greeting on mount
    useEffect(() => {
        setCharacterState(CharacterState.WAVING);
        audioService.play('sparkle');
        setTimeout(() => {
            setCharacterState(CharacterState.IDLE);
        }, 3000);
    }, []);

    // Derive character state from app state
    useEffect(() => {
        if (isProcessing) {
            setCharacterState(CharacterState.SWEEPING);
            return;
        }
        if (actionHover === 'REMOVE') setCharacterState(CharacterState.ACTION_BAD);
        else if (actionHover === 'RESTORE') setCharacterState(CharacterState.ACTION_GOOD);
        else setCharacterState(selectedCount > 0 ? CharacterState.SELECTED : CharacterState.IDLE);
    }, [selectedCount, isProcessing, actionHover]);

    return { characterState, setCharacterState };
}
