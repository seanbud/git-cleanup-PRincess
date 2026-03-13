import path from 'node:path';

/**
 * Prevents path traversal by ensuring the target path is within the base directory.
 */
export function isSafePath(basePath: string, targetPath: string): boolean {
    const resolvedPath = path.resolve(basePath, targetPath);
    const relative = path.relative(basePath, resolvedPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Validates a shell command against a strict allowlist.
 */
const ALLOWED_SHELLS = ['bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd'];
export function isValidShell(shell: string): boolean {
    if (!shell) return false;
    // Handle cases like 'cmd.exe' or full paths by checking the basename.
    // We normalize slashes to handle both Windows and POSIX paths.
    const normalized = shell.replace(/\\/g, '/');
    const shellName = path.basename(normalized).toLowerCase().replace('.exe', '');
    return ALLOWED_SHELLS.includes(shellName);
}

/**
 * Validates a setting value to prevent command injection or excessive memory usage.
 */
export function isValidSettingValue(value: string, maxLength: number = 255): boolean {
    if (typeof value !== 'string') return false;
    if (value.length > maxLength) return false;

    // Allow alphanumeric, spaces, and common path/config characters.
    // Specifically avoid shell metacharacters like ; & | ` $ > <
    const safeRegex = /^[a-zA-Z0-9._\-\/\\ :~()@+'"]*$/;
    return safeRegex.test(value);
}
