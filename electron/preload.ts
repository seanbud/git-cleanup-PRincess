import { contextBridge, ipcRenderer } from 'electron';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
    on: (channel: string, callback: Function) => {
        ipcRenderer.on(channel, (_, data) => callback(data));
    },
    // Add more IPC wrappers here as needed safely
});
