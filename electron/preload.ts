import { contextBridge, ipcRenderer } from 'electron';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
    on: (channel: string, callback: Function) => {
        ipcRenderer.on(channel, (_, data) => callback(data));
    },
    githubStartAuth: (clientId: string) => ipcRenderer.invoke('github:start-auth', clientId),
    githubPollToken: (clientId: string, deviceCode: string) => ipcRenderer.invoke('github:poll-token', clientId, deviceCode),
    githubGetUser: (token?: string) => ipcRenderer.invoke('github:get-user', token),
    githubIsAuthenticated: () => ipcRenderer.invoke('github:is-authenticated'),
    githubSignOut: () => ipcRenderer.invoke('github:sign-out'),
    gitCmd: (cmd: string) => ipcRenderer.invoke('git:cmd', cmd),
    gitConfigGet: (key: string) => ipcRenderer.invoke('git:config-get', key),
});
