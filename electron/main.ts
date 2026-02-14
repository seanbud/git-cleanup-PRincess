import { app, BrowserWindow, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

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

app.whenReady().then(createWindow);
