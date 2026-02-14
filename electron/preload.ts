import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    on: (channel: string, callback: Function) => {
        ipcRenderer.on(channel, (_, data) => callback(data));
    },
    // GitHub Auth
    githubStartAuth: (clientId: string) => ipcRenderer.invoke('github:start-auth', clientId),
    githubPollToken: (clientId: string, deviceCode: string) => ipcRenderer.invoke('github:poll-token', clientId, deviceCode),
    githubGetUser: (token?: string) => ipcRenderer.invoke('github:get-user', token),
    githubIsAuthenticated: () => ipcRenderer.invoke('github:is-authenticated'),
    githubSignOut: () => ipcRenderer.invoke('github:sign-out'),
    // Git CLI
    gitCmd: (cmd: string) => ipcRenderer.invoke('git:cmd', cmd),
    gitConfigGet: (key: string) => ipcRenderer.invoke('git:config-get', key),
    // Repository Management
    openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
    getRecentRepos: () => ipcRenderer.invoke('repos:get-recent'),
    addRecentRepo: (path: string) => ipcRenderer.invoke('repos:add-recent', path),
    switchRepo: (path: string) => ipcRenderer.invoke('repos:switch', path),
    // Shell
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
    showItemInFolder: (path: string) => ipcRenderer.invoke('shell:open-path', path),
    getCwd: () => ipcRenderer.invoke('app:get-cwd'),
});
