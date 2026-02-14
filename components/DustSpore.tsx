import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ThemeMode } from '../types';

interface DustSporeProps {
  fileName: string;
  linesAdded: number;
  linesRemoved: number;
  isScared: boolean;
  mode: ThemeMode;
  delay: number;
}

// Four distinct body paths and their corresponding eye positions
const VARIANTS = [
  {
    // The "Fuzzy" (Original)
    id: 0,
    path: "M50,15 Q55,10 60,15 Q65,12 70,18 Q75,15 78,22 Q85,20 85,28 Q92,30 90,38 Q95,42 92,50 Q98,55 92,62 Q95,68 88,72 Q90,80 82,82 Q80,88 72,85 Q68,92 60,88 Q55,95 50,88 Q45,95 40,88 Q32,92 28,85 Q20,88 18,82 Q10,80 12,72 Q5,68 8,62 Q2,55 8,50 Q5,42 10,38 Q8,30 15,28 Q15,20 22,22 Q25,15 30,18 Q35,12 40,15 Q45,10 50,15 Z",
    leftEye: { cx: 35, cy: 45 },
    rightEye: { cx: 65, cy: 45 },
    color: "#1a1a1a"
  },
  {
    // The "Blobby" (Smoother, bottom heavy)
    id: 1,
    path: "M50,20 C70,15 85,30 88,50 C90,70 80,90 50,92 C20,90 10,70 12,50 C15,30 30,15 50,20 Z",
    leftEye: { cx: 38, cy: 48 },
    rightEye: { cx: 62, cy: 48 },
    color: "#262626"
  },
  {
    // The "Spiky" (Sharp edges)
    id: 2,
    path: "M50,10 L60,25 L75,20 L70,35 L85,40 L75,55 L90,70 L70,75 L65,90 L50,80 L35,90 L30,75 L10,70 L25,55 L15,40 L30,35 L25,20 L40,25 Z",
    leftEye: { cx: 40, cy: 50 },
    rightEye: { cx: 60, cy: 50 },
    color: "#1e1e1e"
  },
  {
    // The "Squashed" (Wide and short)
    id: 3,
    path: "M20,40 Q50,20 80,40 Q95,50 90,70 Q80,85 50,85 Q20,85 10,70 Q5,50 20,40 Z",
    leftEye: { cx: 35, cy: 55 },
    rightEye: { cx: 65, cy: 55 },
    color: "#0f0f0f"
  }
];

const DustSpore: React.FC<DustSporeProps> = ({ fileName, linesAdded, linesRemoved, isScared, mode, delay }) => {
  const isPrincess = mode === ThemeMode.PRINCESS;
  
  // Randomly assign a variant based on filename hash or similar to keep it consistent per file
  const variantIndex = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < fileName.length; i++) hash += fileName.charCodeAt(i);
    return hash % VARIANTS.length;
  }, [fileName]);
  
  const variant = VARIANTS[variantIndex];

  // State
  const [floatOffset, setFloatOffset] = useState({ x: 0, y: 0 });
  const [hopOffset, setHopOffset] = useState(0);
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [isLooking, setIsLooking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Refs for tracking animation frames and intervals
  const eyesRef = useRef<SVGGElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 1. Floating Animation
  useEffect(() => {
    // Random offset for phase
    const phase = delay * 1000; 
    const interval = setInterval(() => {
      const time = Date.now() + phase;
      setFloatOffset({
        x: Math.sin(time / 1500) * 1.5,
        y: Math.cos(time / 1200) * 2.5
      });
    }, 50);
    return () => clearInterval(interval);
  }, [delay]);

  // 2. Random Hopping (Desynchronized)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const hop = () => {
      // Hop up
      setHopOffset(-8); // Jump 8px up
      
      // Come down quickly
      setTimeout(() => setHopOffset(0), 150);

      // Schedule next hop (random time between 2s and 8s)
      const nextHop = 2000 + Math.random() * 6000;
      timeoutId = setTimeout(hop, nextHop);
    };

    // Initial random delay
    timeoutId = setTimeout(hop, Math.random() * 5000);
    return () => clearTimeout(timeoutId);
  }, []);

  // 3. Eye Movement (Desynchronized & Random Attention)
  useEffect(() => {
    // Decide if this mite wants to look at the mouse
    const toggleAttention = () => {
       const payingAttention = Math.random() > 0.4; // 60% chance to look at mouse
       setIsLooking(payingAttention);
    };
    
    const attentionInterval = setInterval(toggleAttention, 2000 + Math.random() * 3000);

    const handleMouseMove = (e: MouseEvent) => {
      if (!eyesRef.current) return;
      
      // If idle (not looking at mouse AND not hovered), drift slowly
      if (!isLooking && !isScared && !isHovered) {
         const time = Date.now() / 2000 + delay;
         setEyePos({
           x: Math.sin(time) * 2,
           y: Math.cos(time) * 1
         });
         return;
      }

      // If looking at mouse (or scared or hovered), track strictly
      const rect = eyesRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      
      // Normalize and limit movement radius (pupils inside eyes)
      const angle = Math.atan2(dy, dx);
      const distance = Math.min(3, Math.sqrt(dx * dx + dy * dy) / 20); // Limit pupil movement
      
      setEyePos({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(attentionInterval);
    };
  }, [delay, isLooking, isScared, isHovered]);

  // Clean up debounce timeout
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setIsHovered(true), 80);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setIsHovered(false), 80);
  };

  const shortName = fileName.split('/').pop() || fileName;
  const blushColor = isPrincess ? '#ff69b4' : '#ef4444'; 

  // Shadow styles
  const miteShadow = `drop-shadow(-14px 8px 0px rgba(0,0,0,0.15))`;
  const nametagShadow = `-4px 4px 0px rgba(0,0,0,0.1)`;

  return (
    // Fixed Size Anchor to prevent Layout Shift
    <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
      <style>{`
        @keyframes vibration {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        .animate-vibrate {
          animation: vibration 0.15s linear infinite;
        }
      `}</style>
      
      <div 
        className={`absolute left-1/2 top-1/2 flex flex-col items-center justify-center p-4 transition-all duration-300 ease-out ${isHovered ? 'z-50' : 'z-10'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          // Combined transform: Center in anchor (-50%) + Float/Hop + Scale
          transform: `translate(calc(-50% + ${floatOffset.x}px), calc(-50% + ${floatOffset.y + hopOffset}px)) scale(${isScared ? 0.95 : (isHovered ? 1.15 : 1)})`
        }}
      >
        {/* Nameplate */}
        <div 
          className={`
            mb-2 px-2 py-1 bg-white border border-gray-400 rounded-sm text-[10px] font-mono font-bold text-gray-800
            flex items-center gap-2
            ${isScared ? 'rotate-12 translate-y-2' : (isHovered ? 'scale-110 -rotate-1' : '-rotate-3')} 
            transition-all duration-300 origin-bottom
            whitespace-nowrap
          `}
          style={{ boxShadow: nametagShadow }}
        >
          <span className={`transition-all duration-300 ${isHovered ? '' : 'truncate max-w-[80px]'}`}>
            {shortName}
          </span>
          <div className="flex space-x-1 text-[9px] border-l border-gray-200 pl-1 shrink-0">
            <span className="text-green-600">+{linesAdded}</span>
            <span className="text-red-500">-{linesRemoved}</span>
          </div>
        </div>

        {/* The Spore Body */}
        <div 
          className={`relative w-16 h-16 ${isScared ? 'animate-vibrate' : ''}`}
          style={{ filter: miteShadow }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            {/* Variant Body Path */}
            <path 
              d={variant.path} 
              fill={variant.color} 
            />
            
            {/* Eyes Container */}
            <g ref={eyesRef} transform={isScared ? "scale(1.1) translate(-4, -2)" : ""}>
              {/* Left Eye */}
              <circle cx={variant.leftEye.cx} cy={variant.leftEye.cy} r="10" fill="white" />
              <circle 
                  cx={variant.leftEye.cx + eyePos.x} 
                  cy={variant.leftEye.cy + eyePos.y} 
                  r={isScared ? "1.5" : "3"} 
                  fill="black" 
                  className="transition-all duration-100 ease-linear"
              />
              
              {/* Right Eye */}
              <circle cx={variant.rightEye.cx} cy={variant.rightEye.cy} r="10" fill="white" />
              <circle 
                  cx={variant.rightEye.cx + eyePos.x} 
                  cy={variant.rightEye.cy + eyePos.y} 
                  r={isScared ? "1.5" : "3"} 
                  fill="black"
                  className="transition-all duration-100 ease-linear" 
              />
            </g>

            {/* Blush */}
            <g opacity="0.6">
                <ellipse cx={variant.leftEye.cx - 10} cy={variant.leftEye.cy + 12} rx="4" ry="2" fill={blushColor} />
                <ellipse cx={variant.rightEye.cx + 10} cy={variant.rightEye.cy + 12} rx="4" ry="2" fill={blushColor} />
            </g>

            {/* Sweat Drop if Scared */}
            {isScared && (
              <path 
                  d="M85,30 Q85,25 82,25 Q79,25 79,30 Q79,38 85,38 Q85,38 85,30" 
                  fill="#3b82f6" 
                  className="animate-bounce"
                  style={{ animationDuration: '0.8s' }}
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DustSpore;