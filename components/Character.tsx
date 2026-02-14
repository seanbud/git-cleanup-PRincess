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
  
  // Colors
  const skinColor = "#FFDFAC";
  const princePrimary = "#3B82F6"; 
  const princessPink = "#F472B6";
  const princessDarkPink = "#DB2777";
  const hairBlonde = "#FDE047";
  
  // Scribble path for background (Wobbly & 5% opacity)
  const renderBackdrop = () => {
    if (!showBackdrop) return null;
    
    // Very light border (5% opacity)
    const strokeColor = isPrincess ? "rgba(249, 168, 212, 0.05)" : "rgba(125, 211, 252, 0.05)";
    
    // Wobbly path
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

  const renderPrincessSvg = () => {
    const isAction = state === CharacterState.ACTION_GOOD || state === CharacterState.ACTION_BAD;
    const isRestoring = state === CharacterState.ACTION_GOOD;
    const isDeleting = state === CharacterState.ACTION_BAD;
    const isThinking = state === CharacterState.SELECTED;

    // Expressions
    const faceExpression = () => {
        if (isDeleting) return (
             // Angry
            <g transform="translate(0, 2)">
                <path d="M38,38 L48,42" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M62,38 L52,42" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="42" cy="46" r="2" fill="black" />
                <circle cx="58" cy="46" r="2" fill="black" />
                <path d="M46,55 Q50,52 54,55" stroke="black" strokeWidth="1.5" fill="none" />
            </g>
        );
        if (isRestoring) return (
            // Happy / Awe
            <g>
                <path d="M38,40 Q42,38 46,40" stroke="black" strokeWidth="1.5" fill="none" />
                <path d="M54,40 Q58,38 62,40" stroke="black" strokeWidth="1.5" fill="none" />
                <circle cx="42" cy="46" r="2.5" fill="black" />
                <circle cx="58" cy="46" r="2.5" fill="black" />
                <path d="M46,54 Q50,60 54,54" stroke="black" strokeWidth="1.5" fill="none" />
            </g>
        );
        if (isThinking) return (
             // Thinking / Looking up
            <g>
                <circle cx="42" cy="44" r="2.5" fill="black" />
                <circle cx="58" cy="44" r="2.5" fill="black" />
                <path d="M48,54 L52,54" stroke="black" strokeWidth="1.5" fill="none" />
            </g>
        );
        // Idle
        return (
            <g>
                <circle cx="42" cy="45" r="2" fill="black" />
                <circle cx="58" cy="45" r="2" fill="black" />
                <path d="M48,54 Q50,56 52,54" stroke="black" strokeWidth="1.5" fill="none" />
            </g>
        );
    };

    return (
        <svg viewBox="0 0 100 120" className="w-full h-full overflow-visible relative z-10">
            {/* Back Hair (Behind body) */}
            <path d="M30,30 Q10,60 20,90 Q25,100 40,95 L60,95 Q75,100 80,90 Q90,60 70,30" fill={hairBlonde} stroke="black" strokeWidth="2" />

            {/* Legs/Boots */}
            <path d="M42,90 L40,115 L48,115 L48,90" fill="#5D4037" stroke="black" strokeWidth="2" />
            <path d="M58,90 L58,115 L66,115 L64,90" fill="#5D4037" stroke="black" strokeWidth="2" />

            {/* Skirt */}
            <path d="M30,80 Q20,90 25,95 Q50,100 75,95 Q80,90 70,80 L65,60 L35,60 Z" fill={princessPink} stroke="black" strokeWidth="2" />
            {/* Skirt Ruffle */}
            <path d="M25,95 Q30,100 35,95 Q40,100 45,95 Q50,100 55,95 Q60,100 65,95 Q70,100 75,95" fill="none" stroke={princessDarkPink} strokeWidth="2" strokeLinecap="round" />

            {/* Torso */}
            <path d="M35,60 L35,40 Q50,38 65,40 L65,60 Z" fill={princessPink} stroke="black" strokeWidth="2" />
            <path d="M35,60 Q50,65 65,60" stroke={princessDarkPink} strokeWidth="2" fill="none" />

            {/* Arms (Behind props) */}
             {/* Left Arm */}
             {!isThinking ? (
                 <path d="M35,45 Q25,55 30,65" stroke={skinColor} strokeWidth="5" fill="none" strokeLinecap="round" /> 
             ) : (
                 // Thinking arm (Hand on chin)
                 <path d="M35,45 Q20,60 40,55" stroke={skinColor} strokeWidth="5" fill="none" strokeLinecap="round" />
             )}
             
             {/* Right Arm */}
             {isDeleting ? (
                 // Pointing
                 <path d="M65,45 Q85,45 95,45" stroke={skinColor} strokeWidth="5" fill="none" strokeLinecap="round" />
             ) : (
                 <path d="M65,45 Q75,55 70,65" stroke={skinColor} strokeWidth="5" fill="none" strokeLinecap="round" />
             )}

            {/* Head */}
            <circle cx="50" cy="40" r="18" fill={skinColor} stroke="black" strokeWidth="2" />

            {/* Front Hair */}
            <path d="M32,30 Q50,15 68,30 Q75,40 75,55 Q75,65 65,50 Q50,50 35,50 Q25,65 25,55 Q25,40 32,30" fill={hairBlonde} stroke="black" strokeWidth="1.5" />

            {/* Crown */}
            <path d="M40,24 L40,14 L45,19 L50,10 L55,19 L60,14 L60,24 Q50,26 40,24 Z" fill="gold" stroke="black" strokeWidth="1.5" />
            <circle cx="50" cy="18" r="2" fill="#3B82F6" stroke="none" />

            {/* Face */}
            {faceExpression()}

            {/* Broom Prop */}
            {/* If Deleting: Holding like a spear */}
            {isDeleting && (
               <g transform="translate(10, 10) rotate(-10 50 50)">
                  <rect x="60" y="40" width="40" height="4" fill="#B45309" stroke="black" strokeWidth="1" rx="2" />
                  <path d="M100,32 Q115,35 120,42 Q115,49 100,52 L98,42 Z" fill="#FCD34D" stroke="black" strokeWidth="1" />
                  <path d="M100,42 L100,32" stroke="black" strokeWidth="1" />
               </g>
            )}

            {/* If Restoring: Holding up high */}
            {isRestoring && (
                <g transform="translate(30, -20) rotate(-45 50 50)">
                   <rect x="70" y="20" width="4" height="60" fill="#B45309" stroke="black" strokeWidth="1" rx="2" />
                   <path d="M62,10 Q72,0 82,10 L78,20 L66,20 Z" fill="#FCD34D" stroke="black" strokeWidth="1" />
                   {/* Magic particles */}
                   <circle cx="72" cy="0" r="2" fill="#3B82F6" className="animate-ping" />
                   <circle cx="60" cy="5" r="1" fill="#60A5FA" className="animate-pulse" />
                   <circle cx="85" cy="5" r="1" fill="#60A5FA" className="animate-pulse" />
                </g>
            )}

            {/* If Idle: On back */}
            {!isAction && !isThinking && (
                 <g transform="translate(-10, 0) rotate(20 50 50)">
                    <rect x="30" y="30" width="80" height="4" fill="#B45309" stroke="black" strokeWidth="1" rx="2" />
                    <path d="M110,22 Q125,25 130,32 Q125,39 110,42 L108,32 Z" fill="#FCD34D" stroke="black" strokeWidth="1" />
                 </g>
            )}

        </svg>
    );
  };

  const renderPrinceSvg = () => {
    const isAction = state === CharacterState.ACTION_GOOD || state === CharacterState.ACTION_BAD;
    const armRotation = isAction ? -45 : state === CharacterState.SELECTED ? -20 : 0;
    
    const faceExpression = () => {
        if (state === CharacterState.ACTION_BAD) return (
            <g transform="translate(0, 2)">
                <path d="M35,35 L45,38" stroke="black" strokeWidth="2" strokeLinecap="round" />
                <path d="M65,35 L55,38" stroke="black" strokeWidth="2" strokeLinecap="round" />
                <circle cx="40" cy="45" r="2" fill="black" />
                <circle cx="60" cy="45" r="2" fill="black" />
                <path d="M45,55 Q50,50 55,55" stroke="black" strokeWidth="2" fill="none" />
            </g>
        );
        if (state === CharacterState.ACTION_GOOD) return (
            <g>
                <circle cx="40" cy="40" r="3" fill="black" />
                <circle cx="60" cy="40" r="3" fill="black" />
                <path d="M45,50 Q50,58 55,50" stroke="black" strokeWidth="2" fill="none" />
                <path d="M35,35 Q40,30 45,35" stroke="black" strokeWidth="1" fill="none" />
                <path d="M55,35 Q60,30 65,35" stroke="black" strokeWidth="1" fill="none" />
            </g>
        );
        if (state === CharacterState.SELECTED) return (
            <g>
                <circle cx="40" cy="40" r="3" fill="black" />
                <circle cx="60" cy="40" r="3" fill="black" />
                <path d="M48,52 L52,52" stroke="black" strokeWidth="2" fill="none" />
            </g>
        );
        return (
            <g>
                <circle cx="40" cy="40" r="2" fill="black" />
                <circle cx="60" cy="40" r="2" fill="black" />
                <path d="M48,50 Q50,52 52,50" stroke="black" strokeWidth="2" fill="none" />
            </g>
        );
    };

    return (
        <svg viewBox="0 0 100 120" className="w-full h-full overflow-visible relative z-10">
            {/* Noodle Arms Back */}
            <path d="M30,70 C20,80 10,60 20,50" stroke={skinColor} strokeWidth="6" fill="none" strokeLinecap="round" />
            
            {/* Legs */}
            <path d="M40,90 L40,110" stroke="#1F2937" strokeWidth="6" strokeLinecap="round" />
            <path d="M60,90 L60,110" stroke="#1F2937" strokeWidth="6" strokeLinecap="round" />
            
            {/* Body */}
            <rect x="35" y="60" width="30" height="35" fill={princePrimary} stroke="black" strokeWidth="2" rx="2" />

            {/* Head */}
            <circle cx="50" cy="40" r="20" fill={skinColor} stroke="black" strokeWidth="2" />
            
            {/* Hair */}
            <path d="M30,35 Q50,20 70,35 Q70,45 65,35 Q50,28 35,35 Z" fill="brown" stroke="black" strokeWidth="1" />

            {/* Crown */}
            <path d="M40,25 L40,15 L45,20 L50,12 L55,20 L60,15 L60,25 Z" fill="gold" stroke="black" strokeWidth="1" />

            {/* Face */}
            {faceExpression()}

            {/* Noodle Arms Front & Sword */}
            <g>
                <path 
                    d={`M70,65 C80,${65 + armRotation/2} 90,${60 + armRotation} 80,${60 + armRotation}`} 
                    stroke={skinColor} 
                    strokeWidth="6" 
                    fill="none" 
                    strokeLinecap="round" 
                />
                {(isAction || state === CharacterState.SELECTED) && (
                    <g transform={`rotate(${armRotation * 2} 80 60)`}>
                        <rect x="80" y="55" width="4" height="15" fill="#525252" />
                        <rect x="75" y="55" width="14" height="4" fill="#B45309" rx="1" />
                        <path d="M82,55 L82,20 L80,15 L84,15 L82,20 Z" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1" />
                        {state === CharacterState.ACTION_BAD && (
                            <path d="M70,10 L90,30" stroke="white" strokeWidth="2" className="animate-pulse" />
                        )}
                    </g>
                )}
            </g>
        </svg>
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none overflow-visible">
      <div 
        className={`w-40 h-48 transition-transform duration-300 relative`}
        style={{ transform: `translateY(${bounce}px)` }}
      >
        {/* Backdrop (rendered first so it's behind) - Explicit Z-Index 0 */}
        <svg viewBox="0 0 100 120" className="absolute top-0 left-0 w-full h-full overflow-visible z-0">
            {renderBackdrop()}
        </svg>

        {/* Character Content - Explicit Z-Index 10 */}
        {isPrincess ? renderPrincessSvg() : renderPrinceSvg()}
      </div>
    </div>
  );
};

export default Character;