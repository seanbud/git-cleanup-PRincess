import path from 'node:path';

/**
 * Validates that a given path is safely contained within a base directory,
 * preventing path traversal attacks.
 */
export function isSafePath(base: string, unsafePath: string): boolean {
    if (!unsafePath) return false;

    // On Windows, paths starting with / or \ are treated as root-relative or absolute-ish
    if (process.platform === 'win32') {
        if (path.isAbsolute(unsafePath) || unsafePath.startsWith('/') || unsafePath.startsWith('\\')) {
            return false;
        }
    } else {
        if (path.isAbsolute(unsafePath)) return false;
    }

    const fullPath = path.resolve(base, unsafePath);
    const relative = path.relative(base, fullPath);

    // If it starts with '..' it's trying to escape the base directory
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

const ALLOWED_BINARIES = new Set([
    // Shells
    'bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd', 'wsl',
    'bash.exe', 'zsh.exe', 'sh.exe', 'fish.exe', 'powershell.exe', 'pwsh.exe', 'cmd.exe', 'wsl.exe',
    // Editors
    'code', 'subl', 'atom', 'idea', 'charm', 'notepad', 'vim', 'nvim', 'emacs', 'nano', 'vi', 'gedit',
    'vscodium', 'cursor', 'zed',
    'code.exe', 'subl.exe', 'notepad.exe', 'vim.exe', 'nvim.exe'
]);

/**
 * Validates if a given shell or editor binary is in the allowlist.
 * This prevents execution of arbitrary malicious binaries.
 */
export function isValidShell(shellPath: string): boolean {
    if (!shellPath) return false;

    // Normalize path separators and extract binary name
    const normalized = shellPath.replace(/\\/g, '/');
    const binaryName = path.basename(normalized).toLowerCase();

    return ALLOWED_BINARIES.has(binaryName);
}
