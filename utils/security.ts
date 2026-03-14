import path from 'node:path';

/**
 * Validates that a path is safe and stays within a base directory.
 * Prevents path traversal attacks by ensuring the resolved path starts with the base directory.
 */
export function isSafePath(baseDir: string, targetPath: string): boolean {
    const fullPath = path.resolve(baseDir, targetPath);
    const relative = path.relative(baseDir, fullPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}
