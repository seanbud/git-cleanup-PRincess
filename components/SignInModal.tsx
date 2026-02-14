import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ThemeMode, GitHubUser } from '../types';
import { GitHubAuthClient, DeviceCodeResponse } from '../services/githubAuth';

interface SignInModalProps {
    isOpen: boolean;
    mode: ThemeMode;
    onSuccess: (user: GitHubUser) => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, mode, onSuccess }) => {
    const [authData, setAuthData] = useState<DeviceCodeResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    const startSignIn = async () => {
        try {
            setError(null);
            const data = await GitHubAuthClient.requestDeviceCode();
            setAuthData(data);
            setIsPolling(true);

            const token = await GitHubAuthClient.pollForToken(data.device_code, data.interval);
            if (token) {
                // Now fetch user info
                // @ts-ignore
                const user = await window.electronAPI.githubGetUser(token);
                onSuccess(user);
            }
        } catch (err: any) {
            setError('Failed to start authentication. Please check your internet connection.');
            console.error(err);
        }
    };

    const isPrincess = mode === ThemeMode.PRINCESS;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { }}
            title="Welcome to PRincess"
            mode={mode}
            maxWidth="max-w-md"
            preventClose={true}
        >
            <div className="text-center space-y-6">
                <div className="flex justify-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-inner ${isPrincess ? 'bg-pink-100' : 'bg-slate-800'}`}>
                        👑
                    </div>
                </div>

                <div>
                    <h3 className={`text-xl font-bold ${isPrincess ? 'text-pink-600' : 'text-blue-400'}`}>
                        Ready to Clean Up?
                    </h3>
                    <p className="text-sm opacity-70 mt-2">
                        Sign in with GitHub to access your repositories and start the cleanup process.
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-md">
                        {error}
                    </div>
                )}

                {!authData ? (
                    <button
                        onClick={startSignIn}
                        className={`w-full py-3 px-4 rounded-lg font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${isPrincess
                                ? 'bg-pink-500 text-white hover:bg-pink-600 shadow-pink-500/25 shadow-lg'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/25 shadow-lg'
                            }`}
                    >
                        Sign in with GitHub
                    </button>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className={`p-4 rounded-xl border-2 border-dashed ${isPrincess ? 'border-pink-200 bg-pink-50/50' : 'border-slate-700 bg-slate-800/50'}`}>
                            <p className="text-xs uppercase font-bold opacity-50 mb-2">Your Activation Code</p>
                            <div className="text-3xl font-mono tracking-widest font-bold">
                                {authData.user_code}
                            </div>
                        </div>

                        <div className="text-sm space-y-3">
                            <p>1. Copy the code above</p>
                            <p>2. Open <a href={authData.verification_uri} target="_blank" rel="noreferrer" className="underline font-bold text-blue-500">github.com/login/device</a></p>
                            <p>3. Paste the code and authorize</p>
                        </div>

                        <div className="flex items-center justify-center space-x-2 text-xs opacity-50 pt-4">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span>Waiting for authorization...</span>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default SignInModal;
