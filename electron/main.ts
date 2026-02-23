import { app, BrowserWindow, shell, ipcMain, safeStorage, dialog, Menu } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execSync, execFileSync, execFile } from 'child_process';
import fs from 'fs';
import { autoUpdater } from 'electron-updater';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

const GITHUB_CLIENT_ID = 'Ov23lil6obiLhsHkt1R2';

const TOKEN_PATH = path.join(app.getPath('userData'), 'github-token.bin');
const RECENT_REPOS_PATH = path.join(app.getPath('userData'), 'recent-repos.json');
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

function isValidGitKey(key: any): boolean {
    return typeof key === 'string' && /^[a-z0-9.-]+$/i.test(key);
}

function isValidSettingValue(value: any): boolean {
    // Block common shell injection characters, allow space and () for paths
    return typeof value === 'string' && !/[&|;<>$]/.test(value);
}

// Track the current working directory for git commands
let currentCwd = process.cwd();

function initializeCwd() {
    try {
        // 1. Try launch directory
        const gitRoot = execSync('git rev-parse --show-toplevel', {
            encoding: 'utf-8',
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
        if (gitRoot) {
            currentCwd = gitRoot;
            return;
        }
    } catch { }

    try {
        // 2. Fall back to most recent repo from history
        const recent = getRecentRepos();
        if (recent.length > 0) {
            const lastRepo = recent[0];
            // Verify it still exists and is a repo
            execSync('git rev-parse --is-inside-work-tree', {
                cwd: lastRepo,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
            });
            currentCwd = lastRepo;
        }
    } catch {
        // Fallback to process.cwd() or let the user open one
    }
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

function getSettings() {
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
        }
    } catch { }
    // Defaults
    return {
        externalEditor: 'code',
        shell: process.platform === 'win32' ? 'powershell' : 'bash'
    };
}

function saveSettings(settings: any) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
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
            zoomFactor: 1.0,
        },
        frame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#fff0f6', // Matches Princess mode default background
            symbolColor: '#742a2a',
            height: 32
        },
        autoHideMenuBar: true,
    });

    win.webContents.setZoomFactor(1.0);
    win.webContents.setZoomLevel(0);

    win.webContents.on('did-finish-load', () => {
        win?.webContents.setZoomFactor(1.0);
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
    initializeCwd();
    createWindow();

    // ─── Application Menu (Shortcuts) ──────────────────────────────
    const template: any[] = [
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn', accelerator: 'CommandOrControl+Plus' },
                { role: 'zoomIn', accelerator: 'CommandOrControl+=' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            role: 'window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        }
    ];

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

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
        ipcMain.handle('update:install', () => autoUpdater.quitAndInstall(false, true));
        ipcMain.handle('update:check', () => autoUpdater.checkForUpdates());
    }

    // ─── GitHub Auth IPC ──────────────────────────────────────────
    ipcMain.handle('github:start-auth', async () => {
        const response = await fetch('https://github.com/login/device/code', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: 'repo,user' })
        });
        return response.json();
    });

    ipcMain.handle('github:poll-token', async (_, deviceCode) => {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
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
    ipcMain.handle('git:cmd', async (_, args: string[]) => {
        if (!Array.isArray(args) || !args.every(arg => typeof arg === 'string')) {
            return { success: false, error: 'Invalid arguments: args must be an array of strings' };
        }
        try {
            // Security: Use execFileSync with argument array to prevent command injection
            // and restrict execution to the 'git' binary only.
            const output = execFileSync('git', args, {
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
        if (!isValidGitKey(key)) return '';
        try {
            return execFileSync('git', ['config', '--get', key], {
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
        // Security: Validate protocol to prevent opening local files or other dangerous schemes
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url);
        }
    });

    ipcMain.handle('shell:open-editor', async (_, filePath: string) => {
        const settings = getSettings();
        const editor = settings.externalEditor || 'code';
        if (!isValidSettingValue(editor)) {
            return { success: false, error: 'Invalid editor command' };
        }
        try {
            // Security: Use execFile with argument array
            execFile(editor, [filePath], { cwd: currentCwd });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('shell:open-terminal', async () => {
        const settings = getSettings();
        const shellCmd = settings.shell || (process.platform === 'win32' ? 'powershell' : 'bash');
        if (!isValidSettingValue(shellCmd)) {
            return { success: false, error: 'Invalid shell command' };
        }
        try {
            if (process.platform === 'win32') {
                execFile('cmd.exe', ['/c', 'start', shellCmd], { cwd: currentCwd });
            } else {
                execFile(shellCmd, [], { cwd: currentCwd });
            }
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('shell:open-path', (_, filePath: string) => {
        shell.showItemInFolder(filePath);
    });

    ipcMain.handle('shell:open-directory', (_, dirPath: string) => {
        shell.openPath(dirPath);
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
            const fullPath = path.resolve(currentCwd, relativePath);
            // Security: Prevent path traversal by ensuring the file is within the repository
            const relative = path.relative(currentCwd, fullPath);
            if (relative.startsWith('..') || path.isAbsolute(relative)) {
                return { success: false, error: 'Access denied: Path outside of repository' };
            }
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
            // Security: Use execFileSync with argument array to prevent command injection
            const result = execFileSync('git', ['show', `HEAD:${relativePath}`], {
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

    // ─── Window Controls ─────────────────────────────────────────
    ipcMain.handle('window:toggle-fullscreen', () => {
        if (win) {
            win.setFullScreen(!win.isFullScreen());
        }
    });

    ipcMain.handle('window:toggle-devtools', () => {
        if (win) {
            win.webContents.toggleDevTools();
        }
    });

    ipcMain.handle('window:new', () => {
        createWindow();
    });

    ipcMain.handle('app:get-version', () => {
        return app.getVersion();
    });

    ipcMain.handle('app:get-settings', () => {
        return getSettings();
    });

    ipcMain.handle('app:save-settings', (_, settings) => {
        if (settings) {
            if (settings.externalEditor && !isValidSettingValue(settings.externalEditor)) {
                return { success: false, error: 'Invalid external editor' };
            }
            if (settings.shell && !isValidSettingValue(settings.shell)) {
                return { success: false, error: 'Invalid shell' };
            }
        }
        saveSettings(settings);
    });
});
