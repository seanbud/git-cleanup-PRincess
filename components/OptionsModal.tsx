import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ThemeMode, GitHubUser, GitConfig, AppSettings } from '../types';

interface OptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: ThemeMode;
    user: GitHubUser | null;
    gitConfig: GitConfig;
    appSettings: AppSettings;
    onSave: (gitConfig: GitConfig, appSettings: AppSettings) => void;
    onSignOut: () => void;
}

const OptionsModal: React.FC<OptionsModalProps> = ({
    isOpen,
    onClose,
    mode,
    user,
    gitConfig,
    appSettings,
    onSave,
    onSignOut
}) => {
    const [activeTab, setActiveTab] = useState<'accounts' | 'git' | 'integrations'>('accounts');
    const [localGitConfig, setLocalGitConfig] = useState(gitConfig);
    const [localAppSettings, setLocalAppSettings] = useState(appSettings);
    const [showSaved, setShowSaved] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    const isPrincess = mode === ThemeMode.PRINCESS;

    // Pre-populate Git config from GitHub user when fields are empty
    useEffect(() => {
        if (isOpen) {
            setLocalGitConfig(prev => ({
                name: prev.name || (user?.name ?? '') || (user?.login ?? ''),
                email: prev.email || (user?.email ?? ''),
                defaultBranch: prev.defaultBranch || 'main'
            }));
            setLocalAppSettings(appSettings);
            setAvatarError(false);
        }
    }, [isOpen, user, appSettings]);

    // Sync with external config changes
    useEffect(() => {
        setLocalGitConfig(prev => ({
            name: gitConfig.name || prev.name,
            email: gitConfig.email || prev.email,
            defaultBranch: gitConfig.defaultBranch || prev.defaultBranch
        }));
    }, [gitConfig]);

    const tabClass = (tab: string) => `
        flex items-center space-x-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all text-sm
        ${activeTab === tab
            ? (isPrincess ? 'bg-pink-100 text-pink-700 font-bold' : 'bg-blue-600/20 text-blue-400 font-bold')
            : (isPrincess ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400')}
    `;

    const inputClass = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${isPrincess
        ? 'border-pink-200 bg-white focus:ring-pink-300 focus:border-pink-400'
        : 'border-slate-700 bg-slate-800 focus:ring-blue-500 focus:border-blue-500 text-slate-100'
        }`;

    const labelClass = 'block text-xs font-bold uppercase tracking-wider opacity-50 mb-1.5';

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Options" mode={mode}>
            <div className="flex min-h-[340px] -m-6">
                {/* Sidebar */}
                <div className={`w-44 shrink-0 border-r p-3 space-y-1 ${isPrincess ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                    <div onClick={() => setActiveTab('accounts')} className={tabClass('accounts')}>
                        <span>👤</span>
                        <span>Accounts</span>
                    </div>
                    <div onClick={() => setActiveTab('git')} className={tabClass('git')}>
                        <span>🛠️</span>
                        <span>Git</span>
                    </div>
                    <div onClick={() => setActiveTab('integrations')} className={tabClass('integrations')}>
                        <span>🔌</span>
                        <span>Integrations</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className={`flex-1 flex flex-col min-w-0 ${isPrincess ? 'bg-white' : 'bg-slate-900'}`}>
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'accounts' && (
                            <div className="space-y-5">
                                <h3 className={`text-base font-bold ${isPrincess ? 'text-slate-800' : 'text-slate-100'}`}>GitHub.com</h3>
                                {user ? (
                                    <div className={`flex items-center justify-between p-4 rounded-xl border ${isPrincess ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-800/50'
                                        }`}>
                                        <div className="flex items-center space-x-3">
                                            {!avatarError && user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt={user.name || user.login}
                                                    className="w-10 h-10 rounded-full border border-slate-200"
                                                    referrerPolicy="no-referrer"
                                                    crossOrigin="anonymous"
                                                    onError={() => setAvatarError(true)}
                                                />
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isPrincess ? 'bg-pink-100 text-pink-700 border border-pink-200' : 'bg-blue-900 text-blue-300 border border-blue-700'
                                                    }`}>
                                                    {getInitials(user.name || user.login)}
                                                </div>
                                            )}
                                            <div>
                                                <div className={`font-semibold text-sm ${isPrincess ? 'text-slate-800' : 'text-slate-100'}`}>
                                                    {user.name || user.login}
                                                </div>
                                                <div className={`text-xs ${isPrincess ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    @{user.login}
                                                </div>
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
                                    <div className={`text-center py-8 text-sm ${isPrincess ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Not signed in.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'git' && (
                            <div className="space-y-5">
                                <div>
                                    <label className={labelClass}>Name</label>
                                    <input
                                        type="text"
                                        value={localGitConfig.name}
                                        onChange={e => setLocalGitConfig({ ...localGitConfig, name: e.target.value })}
                                        placeholder={user?.name || user?.login || 'Your Name'}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input
                                        type="email"
                                        value={localGitConfig.email}
                                        onChange={e => setLocalGitConfig({ ...localGitConfig, email: e.target.value })}
                                        placeholder={user?.email || 'your@email.com'}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Default branch</label>
                                    <input
                                        type="text"
                                        value={localGitConfig.defaultBranch}
                                        onChange={e => setLocalGitConfig({ ...localGitConfig, defaultBranch: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'integrations' && (
                            <div className="space-y-5">
                                <div>
                                    <label className={labelClass}>External Editor Command</label>
                                    <div className={`text-[10px] mb-2 ${isPrincess ? 'text-pink-400' : 'text-slate-500'}`}>
                                        Common: code (VS Code), subl, atom, charm (WebStorm)
                                    </div>
                                    <input
                                        type="text"
                                        value={localAppSettings.externalEditor}
                                        onChange={e => setLocalAppSettings({ ...localAppSettings, externalEditor: e.target.value })}
                                        className={inputClass}
                                        placeholder="e.g. code"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Shell / Terminal</label>
                                    <div className={`text-[10px] mb-2 ${isPrincess ? 'text-pink-400' : 'text-slate-500'}`}>
                                        Command used to open terminal in repo folder
                                    </div>
                                    <input
                                        type="text"
                                        value={localAppSettings.shell}
                                        onChange={e => setLocalAppSettings({ ...localAppSettings, shell: e.target.value })}
                                        className={inputClass}
                                        placeholder="e.g. powershell or bash"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`flex justify-end items-center space-x-3 px-6 py-3 border-t ${isPrincess ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-800/50 border-slate-700'
                        }`}>
                        {showSaved && (
                            <span className={`text-xs font-bold animate-pulse ${isPrincess ? 'text-pink-500' : 'text-blue-400'}`}>
                                Saved ✓
                            </span>
                        )}
                        <button onClick={onClose} className={`px-4 py-2 text-sm rounded-md transition-colors ${isPrincess ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                            }`}>Cancel</button>
                        <button
                            onClick={async () => {
                                // Persist to git config
                                if (localGitConfig.name !== gitConfig.name) {
                                    // @ts-ignore
                                    await window.electronAPI.gitCmd(`git config user.name "${localGitConfig.name}"`);
                                }
                                if (localGitConfig.email !== gitConfig.email) {
                                    // @ts-ignore
                                    await window.electronAPI.gitCmd(`git config user.email "${localGitConfig.email}"`);
                                }
                                if (localGitConfig.defaultBranch !== gitConfig.defaultBranch) {
                                    // @ts-ignore
                                    await window.electronAPI.gitCmd(`git config init.defaultBranch "${localGitConfig.defaultBranch}"`);
                                }
                                onSave(localGitConfig, localAppSettings);
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
                </div>
            </div>
        </Modal>
    );
};

export default OptionsModal;
