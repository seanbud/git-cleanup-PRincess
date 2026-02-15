import React, { useState } from 'react';
import Modal from './Modal';
import { ThemeMode, GitHubUser, GitConfig } from '../types';

interface OptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: ThemeMode;
    user: GitHubUser | null;
    gitConfig: GitConfig;
    onSave: (config: GitConfig) => void;
    onSignOut: () => void;
}

const OptionsModal: React.FC<OptionsModalProps> = ({
    isOpen,
    onClose,
    mode,
    user,
    gitConfig,
    onSave,
    onSignOut
}) => {
    const [activeTab, setActiveTab] = useState<'accounts' | 'git'>('accounts');
    const [localConfig, setLocalConfig] = useState(gitConfig);
    const [showSaved, setShowSaved] = useState(false);

    const isPrincess = mode === ThemeMode.PRINCESS;
    const tabClass = (tab: string) => `
    flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer transition-all
    ${activeTab === tab
            ? (isPrincess ? 'bg-pink-100 text-pink-700 font-bold' : 'bg-blue-600/20 text-blue-400 font-bold')
            : (isPrincess ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400')}
  `;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Options" mode={mode}>
            <div className="flex h-96 -m-6">
                {/* Sidebar */}
                <div className={`w-48 border-r p-4 space-y-1 ${isPrincess ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div onClick={() => setActiveTab('accounts')} className={tabClass('accounts')}>
                        <span>👤</span>
                        <span className="text-sm">Accounts</span>
                    </div>
                    <div onClick={() => setActiveTab('git')} className={tabClass('git')}>
                        <span>🛠️</span>
                        <span className="text-sm">Git</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className={`flex-1 p-8 overflow-y-auto ${isPrincess ? 'bg-white' : 'bg-slate-900'}`}>
                    {activeTab === 'accounts' ? (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold">GitHub.com</h3>
                            {user ? (
                                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center space-x-4">
                                        <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-600" />
                                        <div>
                                            <div className="font-bold">{user.name || user.login}</div>
                                            <div className="text-xs opacity-50">@{user.login}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onSignOut}
                                        className="text-xs px-3 py-1.5 rounded-md border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-8 opacity-50">
                                    Not signed in.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase opacity-50 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={localConfig.name}
                                    onChange={e => setLocalConfig({ ...localConfig, name: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 ${isPrincess ? 'border-pink-200 focus:ring-pink-500' : 'border-slate-700 bg-slate-800 focus:ring-blue-500'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase opacity-50 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={localConfig.email}
                                    onChange={e => setLocalConfig({ ...localConfig, email: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 ${isPrincess ? 'border-pink-200 focus:ring-pink-500' : 'border-slate-700 bg-slate-800 focus:ring-blue-500'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase opacity-50 mb-1">Default branch</label>
                                <input
                                    type="text"
                                    value={localConfig.defaultBranch}
                                    onChange={e => setLocalConfig({ ...localConfig, defaultBranch: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 ${isPrincess ? 'border-pink-200 focus:ring-pink-500' : 'border-slate-700 bg-slate-800 focus:ring-blue-500'
                                        }`}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className={`flex justify-end items-center space-x-3 px-6 py-4 border-t ${isPrincess ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                {showSaved && (
                    <span className={`text-xs font-bold animate-pulse ${isPrincess ? 'text-pink-500' : 'text-blue-400'}`}>
                        Saved ✓
                    </span>
                )}
                <button onClick={onClose} className="px-4 py-2 text-sm opacity-60 hover:opacity-100 transition-opacity">Cancel</button>
                <button
                    onClick={async () => {
                        // Persist to git config
                        if (localConfig.name !== gitConfig.name) {
                            // @ts-ignore
                            await window.electronAPI.gitCmd(`git config user.name "${localConfig.name}"`);
                        }
                        if (localConfig.email !== gitConfig.email) {
                            // @ts-ignore
                            await window.electronAPI.gitCmd(`git config user.email "${localConfig.email}"`);
                        }
                        if (localConfig.defaultBranch !== gitConfig.defaultBranch) {
                            // @ts-ignore
                            await window.electronAPI.gitCmd(`git config init.defaultBranch "${localConfig.defaultBranch}"`);
                        }
                        onSave(localConfig);
                        setShowSaved(true);
                        setTimeout(() => {
                            setShowSaved(false);
                            onClose();
                        }, 1200);
                    }}
                    className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98] ${isPrincess ? 'bg-pink-500 hover:bg-pink-600 shadow-pink-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                        }`}
                >
                    Save
                </button>
            </div>
        </Modal>
    );
};

export default OptionsModal;
