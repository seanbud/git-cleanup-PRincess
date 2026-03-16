import path from 'node:path';

/**
 * Validates that a path is safe and within the expected base directory.
 * Prevents path traversal attacks.
 */
export function isSafePath(base: string, unsafePath: string): boolean {
    const fullPath = path.resolve(base, unsafePath);
    const relative = path.relative(base, fullPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Validates if a shell command is in the allowlist.
 * Prevents command/argument injection for shell-related operations.
 */
export function isValidShell(shellPath: string): boolean {
    const allowedShells = ['bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd', 'cmd.exe', 'powershell.exe', 'pwsh.exe'];
    // Normalize path to handle Windows/Unix differences
    const normalizedPath = shellPath.replace(/\\/g, '/');
    const basename = normalizedPath.split('/').pop()?.toLowerCase() || '';
    return allowedShells.includes(basename);
}

/**
 * Validates a setting value against a whitelist regex and length limit.
 * Mitigates risks associated with unsanitized user-provided settings.
 */
export function isValidSettingValue(value: string): boolean {
    if (typeof value !== 'string' || value.length > 255) return false;
    // Allow alphanumeric, common path separators, spaces, and some symbols used in paths/commands
    const safeRegex = /^[a-zA-Z0-9._\-\/\\ :~()@+'"]*$/;
    return safeRegex.test(value);
}
