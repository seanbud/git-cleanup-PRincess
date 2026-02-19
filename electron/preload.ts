import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    on: (channel: string, callback: Function) => {
        ipcRenderer.on(channel, (_, data) => callback(data));
    },
    // GitHub Auth
    githubStartAuth: () => ipcRenderer.invoke('github:start-auth'),
    githubPollToken: (deviceCode: string) => ipcRenderer.invoke('github:poll-token', deviceCode),
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
    openDirectoryPath: (path: string) => ipcRenderer.invoke('shell:open-directory', path),
    trashFile: (path: string) => ipcRenderer.invoke('shell:trash-item', path),
    getCwd: () => ipcRenderer.invoke('app:get-cwd'),
    // File Preview
    readFileBase64: (path: string) => ipcRenderer.invoke('file:read-base64', path),
    getGitFileBase64: (path: string) => ipcRenderer.invoke('git:show-file-base64', path),
    // Auto-Update
    checkForUpdate: () => ipcRenderer.invoke('update:check'),
    downloadUpdate: () => ipcRenderer.invoke('update:download'),
    installUpdate: () => ipcRenderer.invoke('update:install'),
    // Window Controls
    toggleFullScreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
    toggleDevTools: () => ipcRenderer.invoke('window:toggle-devtools'),
    newWindow: () => ipcRenderer.invoke('window:new'),
    getAppVersion: () => ipcRenderer.invoke('app:get-version'),
    getAppSettings: () => ipcRenderer.invoke('app:get-settings'),
    saveAppSettings: (settings: any) => ipcRenderer.invoke('app:save-settings', settings),
    platform: process.platform
});
