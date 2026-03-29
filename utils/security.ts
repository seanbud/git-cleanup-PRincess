import path from 'node:path';

/**
 * Prevents path traversal by ensuring the resolved path is within the base directory.
 * @param base The base directory (e.g., repository root).
 * @param unsafePath The potentially unsafe path to check.
 * @returns boolean indicating if the path is safe.
 */
export function isSafePath(base: string, unsafePath: string): boolean {
    const resolvedPath = path.resolve(base, unsafePath);
    const relative = path.relative(base, resolvedPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

const SHELL_ALLOWLIST = new Set([
    'bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd', 'wsl',
    'powershell.exe', 'pwsh.exe', 'cmd.exe', 'bash.exe'
]);

const EDITOR_ALLOWLIST = new Set([
    'code', 'subl', 'atom', 'idea', 'charm', 'notepad', 'vim', 'nvim', 'emacs', 'nano', 'vi', 'gedit',
    'vscodium', 'cursor', 'zed',
    'code.exe', 'notepad.exe', 'subl.exe', 'vim.exe', 'nvim.exe'
]);

/**
 * Validates a shell command against an allowlist.
 */
export function isValidShell(cmd: string): boolean {
    if (!cmd) return false;
    // Normalize path separators for cross-platform matching
    const normalized = cmd.replace(/\\/g, '/');
    const baseCmd = path.basename(normalized).toLowerCase();
    return SHELL_ALLOWLIST.has(baseCmd);
}

/**
 * Validates an editor command against an allowlist.
 */
export function isValidEditor(cmd: string): boolean {
    if (!cmd) return false;
    // Normalize path separators for cross-platform matching
    const normalized = cmd.replace(/\\/g, '/');
    const baseCmd = path.basename(normalized).toLowerCase();
    return EDITOR_ALLOWLIST.has(baseCmd);
}
