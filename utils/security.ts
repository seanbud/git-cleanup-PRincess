import path from 'node:path';

/**
 * Validates if the given shell or editor binary is in the allowlist.
 * Prevents execution of arbitrary binaries.
 */
export function isValidShell(binary: string): boolean {
    const allowlist = [
        'bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd', 'wsl',
        'code', 'subl', 'atom', 'idea', 'charm', 'notepad',
        'vim', 'nvim', 'emacs', 'nano', 'vi', 'gedit'
    ];
    const normalizedPath = binary.replace(/\\/g, '/');
    const baseName = normalizedPath.split('/').pop() || '';
    const normalized = baseName.replace(/\.exe$/i, '').toLowerCase();
    return allowlist.includes(normalized);
}

/**
 * Validates if a path is safe to access relative to a base directory.
 * Prevents path traversal vulnerabilities.
 */
export function isSafePath(base: string, unsafePath: string): boolean {
    if (/^[a-zA-Z]:[\\/]/.test(unsafePath)) return false;
    const fullPath = path.resolve(base, unsafePath);
    const relative = path.relative(base, fullPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}
