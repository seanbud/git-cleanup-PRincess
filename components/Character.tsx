import React, { useEffect, useState } from 'react';
import { CharacterState, ThemeMode } from '../types';

interface CharacterProps {
    mode: ThemeMode;
    state: CharacterState;
    showBackdrop?: boolean;
}

const Character: React.FC<CharacterProps> = ({ mode, state, showBackdrop }) => {
    const [bounce, setBounce] = useState(0);

    // Simple idle animation
    useEffect(() => {
        const interval = setInterval(() => {
            setBounce(prev => (prev === 0 ? -2 : 0));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    const isPrincess = mode === ThemeMode.PRINCESS;
    const characterPrefix = isPrincess ? 'princess' : 'prince';

    // Map state to sprite filename (Base follows Prince pattern)
    const spriteMap: Record<CharacterState, string> = {
        [CharacterState.IDLE]: 'idle.png',
        [CharacterState.SELECTED]: 'selected.png',
        [CharacterState.ACTION_GOOD]: 'action.png',
        [CharacterState.ACTION_BAD]: 'worried.png',
        [CharacterState.CELEBRATING]: 'action-complete.png',
        [CharacterState.SWEEPING]: 'sweeping.png',
        [CharacterState.WORRIED]: 'worried.png',
        [CharacterState.WAVING]: 'idle.png', // Fallback
    };

    // Normalization scales to make character heights and "mass" visually consistent
    // Reverted 15% increase as per user request (BASE_SCALE = 1.0)
    const BASE_SCALE = 1.0;
    const scales: Record<string, number> = {
        // Princess Scaling (relative to idle)
        'princess-idle.png': 1.0,
        'princess-selected.png': 0.95, // 5% bigger -> scale down
        'princess-selected2.png': 0.95,
        'princess-action.png': 1.08,   // 8% smaller -> scale up
        'princess-restore-action.png': 1.15, // 15% smaller -> scale up
        'princess-action-complete.png': 1.0,
        'princess-worried.png': 1.0,

        // Prince Scaling (relative to idle)
        'prince-idle.png': 1.10,        // Another 5% bump (total 10% from base)
        'prince-selected.png': 1.0,     // Another 10% bump (total 22% from original 0.82)
        'prince-selected2.png': 1.0,
        'prince-action.png': 1.05,    // 5% smaller -> scale up
        'prince-restore-action.png': 1.15, // 15% smaller -> scale up
        'prince-action-complete.png': 1.0,
        'prince-worried.png': 1.0,
    };

    // Specific vertical offsets to fix "grounding" issues
    const yOffsets: Record<string, number> = {
        'princess-restore-action.png': -6, // Move up slightly
        'prince-restore-action.png': -4,   // Move up slightly
    };

    let spriteName = spriteMap[state];

    // Character-specific overrides for unique filenames
    if (isPrincess) {
        switch (state) {
            case CharacterState.ACTION_GOOD: // Restore
                spriteName = 'restore-action.png';
                break;
            case CharacterState.ACTION_BAD: // Remove
                spriteName = 'action.png';
                break;
            case CharacterState.CELEBRATING:
                spriteName = 'action-complete.png';
                break;
        }
    } else {
        // Prince-specific overrides
        switch (state) {
            case CharacterState.ACTION_GOOD: // Restore
                spriteName = 'restore-action.png';
                break;
        }
    }

    // Ensure we have a valid spriteName
    if (!spriteName) spriteName = spriteMap[state] || 'idle.png';

    const spritePath = `./sprites/${characterPrefix}-${spriteName}`;
    const normalizationScale = scales[`${characterPrefix}-${spriteName}`] || 1.0;
    const finalScale = BASE_SCALE * normalizationScale;
    const yOffset = yOffsets[`${characterPrefix}-${spriteName}`] || 0;

    // Backdrop path
    const renderBackdrop = () => {
        if (!showBackdrop) return null;
        const strokeColor = isPrincess ? "rgba(249, 168, 212, 0.05)" : "rgba(125, 211, 252, 0.05)";
        const wobblyPath = "M35,25 Q25,25 20,35 Q15,40 18,50 Q12,60 15,70 Q10,80 18,90 Q20,100 30,105 Q40,115 55,110 Q65,115 75,110 Q85,108 90,95 Q98,85 92,75 Q96,65 90,55 Q92,45 85,35 Q80,25 70,28 Q60,18 50,22 Q40,15 35,25 Z";

        return (
            <path
                d={wobblyPath}
                fill={isPrincess ? "#FFF0F5" : "#F0F9FF"}
                stroke={strokeColor}
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        );
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none overflow-visible">
            {/* Optimized container size for 1.0 base scale */}
            <div
                className="w-64 h-80 transition-transform duration-300 relative flex items-end justify-center"
                style={{ transform: `translateY(${bounce}px)` }}
            >
                {/* Backdrop */}
                <svg viewBox="0 0 100 120" className="absolute top-0 left-0 w-full h-full overflow-visible z-0 opacity-50">
                    {renderBackdrop()}
                </svg>

                {/* Character Sprite with Sticker effect & Transition wrapper */}
                <div key={`${mode}-${state}`} className="relative z-10 w-full h-full flex items-end justify-center animate-character-swap">
                    <img
                        src={spritePath}
                        alt={`${characterPrefix} ${state}`}
                        className="max-w-full max-h-full object-contain object-bottom filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.1)]"
                        style={{
                            transform: `scale(${finalScale}) translateY(${yOffset}px)`,
                            transformOrigin: 'bottom center',
                        }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.opacity = '0';
                        }}
                    />

                    <style>{`
                        @keyframes character-swap {
                            0% {
                                opacity: 0;
                                transform: translateY(10px) scale(0.95);
                            }
                            100% {
                                opacity: 1;
                                transform: translateY(0) scale(1);
                            }
                        }
                        .animate-character-swap {
                            animation: character-swap 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );


};

export default Character;