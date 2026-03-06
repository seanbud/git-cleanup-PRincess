import path from 'node:path';

/**
 * Security: Validates that a path is within the base directory
 * to prevent path traversal attacks.
 */
export function isSafePath(filePath: string, baseDir: string): boolean {
    const resolvedPath = path.resolve(baseDir, filePath);
    const relative = path.relative(baseDir, resolvedPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Security: Validates git config keys to prevent command injection
 * or unexpected behavior.
 */
export function isValidGitKey(key: string): boolean {
    return /^[a-zA-Z0-9.-]+$/.test(key);
}

/**
 * Security: Validates settings values to prevent shell injection.
 */
export function isValidSettingValue(value: string): boolean {
    if (typeof value !== 'string' || value.length > 255) return false;
    // Disallow common shell metacharacters
    return !/[&|;<>$`]/.test(value);
}
