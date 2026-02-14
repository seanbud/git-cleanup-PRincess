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

    // Map state to sprite filename
    const spriteMap: Record<CharacterState, string> = {
        [CharacterState.IDLE]: 'idle.png',
        [CharacterState.SELECTED]: 'selected.png',
        [CharacterState.ACTION_GOOD]: 'restore.png',
        [CharacterState.ACTION_BAD]: 'remove.png',
        [CharacterState.CELEBRATING]: 'celebrating.png',
        [CharacterState.SWEEPING]: 'sweeping.png',
        [CharacterState.WORRIED]: 'worried.png',
        [CharacterState.WAVING]: 'waving.png',
    };

    const spriteName = spriteMap[state] || 'idle.png';
    const spritePath = `./sprites/${characterPrefix}-${spriteName}`;

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
            <div
                className="w-48 h-60 transition-transform duration-300 relative flex items-center justify-center"
                style={{ transform: `translateY(${bounce}px)` }}
            >
                {/* Backdrop */}
                <svg viewBox="0 0 100 120" className="absolute top-0 left-0 w-full h-full overflow-visible z-0 opacity-50">
                    {renderBackdrop()}
                </svg>

                {/* Character Sprite with Sticker effect */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <img
                        src={spritePath}
                        alt={`${characterPrefix} ${state}`}
                        className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.1)] transition-opacity duration-200"
                        style={{
                            // Simulate sticker border if image doesn't have it baked in
                            // We'll bake it in for best results, but this helps visibility
                            filter: `drop-shadow(2px 0 0 white) drop-shadow(-2px 0 0 white) drop-shadow(0 2px 0 white) drop-shadow(0 -2px 0 white)`
                        }}
                        onError={(e) => {
                            // Hide if missing during generation phase
                            (e.target as HTMLImageElement).style.opacity = '0';
                        }}
                        onLoad={(e) => {
                            (e.target as HTMLImageElement).style.opacity = '1';
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Character;