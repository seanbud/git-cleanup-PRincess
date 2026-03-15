import path from 'node:path';

/**
 * Validates if a path is safe to access within a base directory.
 * Prevents path traversal attacks.
 */
export function isSafePath(baseDir: string, targetPath: string): boolean {
    const resolvedPath = path.isAbsolute(targetPath) ? targetPath : path.resolve(baseDir, targetPath);
    const relative = path.relative(baseDir, resolvedPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Validates if a shell path is in the allowlist of common terminal shells.
 */
export function isValidShell(shellPath: string): boolean {
    const commonShells = ['bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd'];
    // Normalize backslashes for comparison on Linux hosts when testing Windows paths
    const normalizedPath = shellPath.replace(/\\/g, '/');
    const basename = path.basename(normalizedPath).toLowerCase().replace('.exe', '');
    return commonShells.includes(basename);
}

/**
 * Validates a setting value against a character allowlist and length limit.
 * Helps prevent command injection and other malicious inputs.
 */
export function isValidSettingValue(value: string, maxLength: number = 255): boolean {
    if (typeof value !== 'string' || value.length > maxLength) return false;
    // Allow alphanumeric, common path characters, and some safe punctuation
    const safeRegex = /^[a-zA-Z0-9._\-\/\\ :~()@+'"]*$/;
    return safeRegex.test(value);
}
