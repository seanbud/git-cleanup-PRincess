import path from 'node:path';

/**
 * Validates that a path is safely contained within a base directory.
 * Prevents path traversal attacks (e.g., ../../../etc/passwd).
 */
export function isSafePath(base: string, unsafePath: string): boolean {
    if (!unsafePath) return false;

    const fullPath = path.resolve(base, unsafePath);
    const relative = path.relative(base, fullPath);

    // In some environments, path.relative might return an empty string if paths are identical
    // or the path itself if it's already absolute and outside.
    // The key check is that it doesn't start with '..' and isn't absolute.
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

const ALLOWED_SHELLS = new Set([
    'bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd', 'cmd.exe', 'powershell.exe', 'pwsh.exe',
    'code', 'code.exe', 'cursor', 'cursor.exe', 'vim', 'vi', 'nano', 'emacs', 'subl', 'subl.exe', 'notepad.exe'
]);

/**
 * Validates a shell or editor command against an allowlist of known safe binaries.
 * Prevents command injection by restricting execution to approved tools.
 */
export function isValidShell(shellPath: string): boolean {
    if (!shellPath) return false;

    // Extract the binary name (e.g., /usr/bin/bash -> bash)
    // Normalize path separators for cross-platform matching
    const normalizedPath = shellPath.replace(/\\/g, '/');
    const binaryName = normalizedPath.split('/').pop()?.toLowerCase() || '';

    return ALLOWED_SHELLS.has(binaryName);
}
