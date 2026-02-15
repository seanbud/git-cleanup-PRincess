import { app, BrowserWindow, shell, ipcMain, safeStorage, dialog } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execSync } from 'child_process';
import fs from 'fs';
import { autoUpdater } from 'electron-updater';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

const TOKEN_PATH = path.join(app.getPath('userData'), 'github-token.bin');
const RECENT_REPOS_PATH = path.join(app.getPath('userData'), 'recent-repos.json');

// Track the current working directory for git commands
// Auto-detect git root if launched from within a repo
let currentCwd = process.cwd();
try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
        encoding: 'utf-8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    if (gitRoot) currentCwd = gitRoot;
} catch {
    // Not a git repo — will be set when user opens one
}

function storeToken(token: string) {
    const encrypted = safeStorage.encryptString(token);
    fs.writeFileSync(TOKEN_PATH, encrypted);
}

function getToken(): string | null {
    if (!fs.existsSync(TOKEN_PATH)) return null;
    const encrypted = fs.readFileSync(TOKEN_PATH);
    return safeStorage.decryptString(encrypted);
}

function getRecentRepos(): string[] {
    try {
        if (fs.existsSync(RECENT_REPOS_PATH)) {
            return JSON.parse(fs.readFileSync(RECENT_REPOS_PATH, 'utf-8'));
        }
    } catch { }
    return [];
}

function addRecentRepo(repoPath: string) {
    const repos = getRecentRepos().filter(r => r !== repoPath);
    repos.unshift(repoPath); // Most recent first
    if (repos.length > 10) repos.length = 10;
    fs.writeFileSync(RECENT_REPOS_PATH, JSON.stringify(repos));
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

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {
        win.loadFile(path.join(process.env.DIST, 'index.html'));
    }

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

    // ─── Auto-Update ─────────────────────────────────────────────
    if (app.isPackaged) {
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = true;

        autoUpdater.on('update-available', (info) => {
            win?.webContents.send('update-available', {
                version: info.version,
                releaseNotes: info.releaseNotes,
            });
        });

        autoUpdater.on('update-not-available', () => {
            win?.webContents.send('update-not-available');
        });

        autoUpdater.on('download-progress', (progress) => {
            win?.webContents.send('update-download-progress', {
                percent: progress.percent,
                bytesPerSecond: progress.bytesPerSecond,
                transferred: progress.transferred,
                total: progress.total,
            });
        });

        autoUpdater.on('update-downloaded', () => {
            win?.webContents.send('update-downloaded');
        });

        autoUpdater.on('error', (err) => {
            console.error('Auto-update error:', err);
        });

        // Check for updates after a short delay to not block startup
        setTimeout(() => autoUpdater.checkForUpdates(), 3000);

        // IPC handlers for update actions
        ipcMain.handle('update:download', () => autoUpdater.downloadUpdate());
        ipcMain.handle('update:install', () => autoUpdater.quitAndInstall());
        ipcMain.handle('update:check', () => autoUpdater.checkForUpdates());
    }

    // ─── GitHub Auth IPC ──────────────────────────────────────────
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

    // ─── Git CLI IPC ──────────────────────────────────────────────
    ipcMain.handle('git:cmd', async (_, cmd) => {
        try {
            const output = execSync(cmd, {
                encoding: 'utf-8',
                cwd: currentCwd,
                timeout: 15000,
                stdio: ['pipe', 'pipe', 'pipe'] // Suppress stderr from leaking to console
            });
            return { stdout: output, success: true };
        } catch (error: any) {
            return { stderr: error.stderr || error.message, stdout: error.stdout || '', success: false };
        }
    });

    ipcMain.handle('git:config-get', async (_, key) => {
        try {
            return execSync(`git config --get ${key}`, {
                encoding: 'utf-8',
                cwd: currentCwd,
                stdio: ['pipe', 'pipe', 'pipe']
            }).trim();
        } catch {
            return '';
        }
    });

    // ─── Repository Management IPC ────────────────────────────────
    ipcMain.handle('dialog:open-directory', async () => {
        if (!win) return null;
        const result = await dialog.showOpenDialog(win, {
            properties: ['openDirectory'],
            title: 'Open Local Repository'
        });
        if (result.canceled || result.filePaths.length === 0) return null;

        const selectedDir = result.filePaths[0];

        // Verify it's a git repo
        try {
            execSync('git rev-parse --is-inside-work-tree', {
                cwd: selectedDir,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
            });
        } catch {
            return { error: 'Not a Git repository' };
        }

        currentCwd = selectedDir;
        addRecentRepo(selectedDir);
        return { path: selectedDir };
    });

    ipcMain.handle('repos:get-recent', () => {
        return getRecentRepos();
    });

    ipcMain.handle('repos:add-recent', (_, repoPath: string) => {
        addRecentRepo(repoPath);
    });

    ipcMain.handle('repos:switch', (_, repoPath: string) => {
        try {
            execSync('git rev-parse --is-inside-work-tree', {
                cwd: repoPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
            });
            currentCwd = repoPath;
            addRecentRepo(repoPath);
            return { success: true };
        } catch {
            return { success: false, error: 'Not a Git repository' };
        }
    });

    ipcMain.handle('shell:open-external', (_, url: string) => {
        shell.openExternal(url);
    });

    ipcMain.handle('shell:open-path', (_, filePath: string) => {
        shell.showItemInFolder(filePath);
    });

    ipcMain.handle('shell:trash-item', async (_, filePath: string) => {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(currentCwd, filePath);
        try {
            await shell.trashItem(fullPath);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // File Preview: read file from disk as base64 data URI
    ipcMain.handle('file:read-base64', (_, relativePath: string) => {
        try {
            const fullPath = path.isAbsolute(relativePath) ? relativePath : path.join(currentCwd, relativePath);
            if (!fs.existsSync(fullPath)) return { success: false, error: 'File not found' };
            const buffer = fs.readFileSync(fullPath);
            const ext = path.extname(fullPath).toLowerCase();
            const mimeMap: Record<string, string> = {
                '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp', '.ico': 'image/x-icon',
            };
            const mime = mimeMap[ext] || 'application/octet-stream';
            const base64 = buffer.toString('base64');
            const size = buffer.length;
            return { success: true, dataUri: `data:${mime};base64,${base64}`, size };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // File Preview: read file from git HEAD as base64 data URI
    ipcMain.handle('git:show-file-base64', (_, relativePath: string) => {
        try {
            const result = execSync(`git show HEAD:"${relativePath}"`, {
                cwd: currentCwd,
                encoding: 'buffer',
                maxBuffer: 10 * 1024 * 1024,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            const ext = path.extname(relativePath).toLowerCase();
            const mimeMap: Record<string, string> = {
                '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp', '.ico': 'image/x-icon',
            };
            const mime = mimeMap[ext] || 'application/octet-stream';
            const base64 = result.toString('base64');
            const size = result.length;
            return { success: true, dataUri: `data:${mime};base64,${base64}`, size };
        } catch {
            // File doesn't exist in HEAD (new file)
            return { success: false, error: 'Not in HEAD' };
        }
    });

    ipcMain.handle('app:get-cwd', () => {
        return currentCwd;
    });
});
