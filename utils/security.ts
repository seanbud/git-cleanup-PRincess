import path from 'node:path';

/**
 * Prevents path traversal by ensuring the resolved path is within the base directory.
 */
export function isSafePath(base: string, unsafePath: string): boolean {
    const absoluteBase = path.resolve(base);
    const absolutePath = path.resolve(base, unsafePath);
    const relative = path.relative(absoluteBase, absolutePath);

    // Path is safe if it doesn't start with '..' and is not absolute
    // Note: path.isAbsolute(relative) checks if the resulting relative path is absolute,
    // which happens on Windows if paths are on different drives.
    const isWindowsAbsolute = /^[a-zA-Z]:\\/.test(unsafePath);
    return !relative.startsWith('..') && !path.isAbsolute(relative) && !path.isAbsolute(unsafePath) && !isWindowsAbsolute;
}

/**
 * Validates if a shell or editor binary is in the allowlist to prevent command injection.
 */
export function isValidShell(shellPath: string): boolean {
    if (!shellPath) return false;

    const allowlist = [
        'bash', 'zsh', 'sh', 'fish',
        'powershell', 'pwsh', 'cmd', 'cmd.exe', 'powershell.exe', 'pwsh.exe',
        'code', 'code.cmd', 'code.exe',
        'vim', 'vi', 'nano', 'emacs', 'subl', 'atom'
    ];

    // Normalize path (cross-platform) and get the binary name
    const normalized = shellPath.replace(/\\/g, '/');
    const binary = path.basename(normalized).toLowerCase();

    return allowlist.includes(binary);
}
