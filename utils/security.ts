import path from 'node:path';

/**
 * Validates that a path is safe to use and within the base directory.
 * Prevents path traversal attacks.
 */
export function isSafePath(base: string, unsafePath: string): boolean {
    // 1. Block Windows absolute paths (e.g., C:\... or C:/...)
    if (/^[a-zA-Z]:[\\/]/.test(unsafePath)) {
        return false;
    }

    // 2. Resolve the path
    const fullPath = path.resolve(base, unsafePath);

    // 3. Ensure the resolved path is within the base directory
    const relative = path.relative(base, fullPath);

    // If it starts with '..' or is absolute (on non-Windows systems), it's outside base
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return false;
    }

    return true;
}

/**
 * Validates that a shell or editor binary is in the allowlist.
 * Prevents command injection via malicious configurations.
 */
export function isValidShell(shellPath: string): boolean {
    if (!shellPath) return false;

    // Normalize for cross-platform comparison
    const normalized = shellPath.replace(/\\/g, '/');
    const binary = path.basename(normalized).toLowerCase();

    const allowlist = [
        'bash', 'zsh', 'sh', 'fish', 'dash',
        'powershell', 'pwsh', 'cmd',
        'code', 'cursor', 'subl', 'vim', 'nvim', 'nano', 'emacs',
        'bash.exe', 'zsh.exe', 'sh.exe', 'fish.exe', 'dash.exe',
        'powershell.exe', 'pwsh.exe', 'cmd.exe',
        'code.exe', 'cursor.exe', 'subl.exe'
    ];

    return allowlist.includes(binary);
}
