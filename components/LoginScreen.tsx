import React, { useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface LoginScreenProps {
  mode: ThemeMode;
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ mode, onLogin }) => {
  const [copied, setCopied] = useState(false);
  const code = "1A24-7A9C"; // Static for now as per screenshot

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-login simulation placeholder
  // In a real app, this would poll the backend for authorization status
  useEffect(() => {
    // const timer = setInterval(checkAuthStatus, 2000);
    // return () => clearInterval(timer);
  }, [onLogin]);

  const isPrincess = mode === ThemeMode.PRINCESS;
  const textClass = isPrincess ? 'text-pink-900' : 'text-slate-900';
  const accentColor = isPrincess ? 'text-pink-600' : 'text-blue-600';
  const buttonBg = isPrincess ? 'bg-pink-100 hover:bg-pink-200 text-pink-700' : 'bg-blue-100 hover:bg-blue-200 text-blue-700';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50">
      <div className="w-[400px] rounded-xl shadow-xl overflow-hidden bg-white border border-gray-100">
        {/* Header Banner */}
        <div className={`py-4 px-6 ${isPrincess ? 'bg-pink-50' : 'bg-blue-50'} border-b ${isPrincess ? 'border-pink-100' : 'border-blue-100'}`}>
          <h1 className={`text-lg font-bold ${textClass}`}>Welcome to PRincess</h1>
        </div>

        <div className="p-8 flex flex-col items-center text-center space-y-6">
          {/* Icon - Crown */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isPrincess ? 'bg-pink-100' : 'bg-blue-100'}`}>
             <span className="text-5xl">👑</span>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className={`text-xl font-bold ${accentColor}`}>Ready to Clean Up?</h2>
            <p className="text-sm text-gray-500 max-w-[280px] mx-auto leading-relaxed">
              Sign in with GitHub to access your repositories and start the cleanup process.
            </p>
          </div>

          {/* Activation Code Box */}
          <div className={`w-full py-6 px-4 border-2 border-dashed rounded-xl relative group ${isPrincess ? 'border-pink-200 bg-pink-50/30' : 'border-blue-200 bg-blue-50/30'}`}>
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
               Your Activation Code
             </div>

             <div className="flex items-center justify-center gap-3">
               <span className={`text-2xl font-mono font-bold tracking-wider select-text ${textClass}`}>
                 {code}
               </span>

               {/* Copy Button */}
               <button
                 onClick={handleCopy}
                 className={`p-1.5 rounded-md transition-all ${buttonBg} active:scale-95 shadow-sm`}
                 title="Copy to clipboard"
               >
                 {copied ? (
                   <span className="text-green-600 text-xs font-bold px-1">✓</span>
                 ) : (
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                     <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                   </svg>
                 )}
               </button>
             </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-sm text-gray-600">
             <div className="flex items-center justify-center gap-2">
               <span>1. Copy the code above</span>
             </div>
             <div className="flex items-center justify-center gap-2">
               <span>2. Open <a href="#" onClick={() => window.open('https://github.com/login/device', '_blank')} className="text-blue-500 hover:underline font-medium">github.com/login/device</a></span>
             </div>
             <div className="flex items-center justify-center gap-2">
               <span>3. Paste the code and authorize</span>
             </div>
          </div>

          {/* Footer Status */}
          <div
             className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4 cursor-pointer hover:text-gray-600 transition-colors"
             onClick={() => {
               // Security: Only allow bypass in development
               if (import.meta.env.DEV) {
                 onLogin();
               }
             }}
             title={import.meta.env.DEV ? "Click to simulate authorization (DEV ONLY)" : "Waiting for authorization..."}
          >
             <div className={`w-2 h-2 rounded-full ${isPrincess ? 'bg-pink-400' : 'bg-blue-400'} animate-pulse`} />
             <span>Waiting for authorization...</span>
             {import.meta.env.DEV && <span className="text-[10px] text-red-400 font-mono border border-red-200 px-1 rounded">DEV</span>}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
