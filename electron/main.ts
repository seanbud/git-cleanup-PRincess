import * as electron from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execSync } from 'child_process';
import fs from 'fs';

const { app, BrowserWindow, shell, ipcMain, safeStorage } = electron;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js
// │ ├─┬ preload
// │ │ └── index.js
// │ ├─┬ renderer
// │ │ └── index.html
//

let win: electron.BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

const TOKEN_PATH = path.join(app.getPath('userData'), 'github-token.bin');

function storeToken(token: string) {
    const encrypted = safeStorage.encryptString(token);
    fs.writeFileSync(TOKEN_PATH, encrypted);
}

function getToken(): string | null {
    if (!fs.existsSync(TOKEN_PATH)) return null;
    const encrypted = fs.readFileSync(TOKEN_PATH);
    return safeStorage.decryptString(encrypted);
}

function createWindow() {
    process.env.DIST_ELECTRON = path.join(__dirname, '../dist-electron');
    process.env.DIST = path.join(__dirname, '../dist');
    process.env.PUBLIC = app.isPackaged
        ? process.env.DIST
        : path.join(process.env.DIST, '../public');

    win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(process.env.PUBLIC, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
        frame: true,
        autoHideMenuBar: true,
    });

    // Test active push message to Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {
        win.loadFile(path.join(process.env.DIST, 'index.html'));
    }

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });
}

app.on('window-all-closed', () => {
    win = null;
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.whenReady().then(() => {
    createWindow();

    // GitHub Auth IPC
    ipcMain.handle('github:start-auth', async (_, clientId) => {
        const response = await fetch('https://github.com/login/device/code', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: clientId, scope: 'repo,user' })
        });
        return response.json();
    });

    ipcMain.handle('github:poll-token', async (_, clientId, deviceCode) => {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                device_code: deviceCode,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
            })
        });
        const data: any = await response.json();
        if (data.access_token) {
            storeToken(data.access_token);
            return data.access_token;
        }
        return null;
    });

    ipcMain.handle('github:get-user', async (_, token) => {
        const t = token || getToken();
        if (!t) return null;
        const response = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${t}`, 'Accept': 'application/json' }
        });
        return response.json();
    });

    ipcMain.handle('github:is-authenticated', () => {
        return getToken() !== null;
    });

    ipcMain.handle('github:sign-out', () => {
        if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
    });

    // Git CLI IPC
    ipcMain.handle('git:cmd', async (_, cmd) => {
        try {
            const output = execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() });
            return { stdout: output, success: true };
        } catch (error: any) {
            return { stderr: error.message, success: false };
        }
    });

    ipcMain.handle('git:config-get', async (_, key) => {
        try {
            return execSync(`git config --get ${key}`, { encoding: 'utf-8' }).trim();
        } catch {
            return '';
        }
    });
});
