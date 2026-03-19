import path from 'node:path';

/**
 * Validates that a path is within a specified root directory to prevent path traversal.
 */
export function isSafePath(root: string, unsafePath: string): boolean {
    const fullPath = path.resolve(root, unsafePath);
    const relative = path.relative(root, fullPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Validates that a shell path or name is within an allowlist of known shells.
 */
export function isValidShell(shellPath: string): boolean {
    if (!shellPath) return false;

    // Extract basename for comparison (e.g., 'C:\\Windows\\System32\\bash.exe' -> 'bash.exe')
    // We normalize backslashes to forward slashes first to handle Windows paths on Linux hosts during tests
    const normalizedPath = shellPath.replace(/\\/g, '/');
    const name = normalizedPath.split('/').pop()?.toLowerCase() || '';
    const baseName = name.replace(/\.exe$/, '');

    const allowedShells = new Set([
        'bash',
        'zsh',
        'sh',
        'fish',
        'powershell',
        'pwsh',
        'cmd'
    ]);

    return allowedShells.has(baseName);
}

/**
 * Validates a setting value to prevent command injection or other malicious input.
 * Allows alphanumeric characters, dots, underscores, dashes, slashes, backslashes,
 * spaces, and some common path-related characters.
 */
export function isValidSettingValue(value: string): boolean {
    if (typeof value !== 'string') return false;
    if (value.length > 255) return false;

    // Allow paths with spaces, parentheses, and common symbols used in paths
    const safeRegex = /^[a-zA-Z0-9._\-\/\\ :~()@+'"]*$/;
    return safeRegex.test(value);
}
