import path from 'node:path';

/**
 * Allowlist of safe shell and editor binaries to prevent command injection.
 */
const SAFE_BINARIES = new Set([
    'bash', 'bash.exe',
    'zsh', 'zsh.exe',
    'sh', 'sh.exe',
    'fish', 'fish.exe',
    'powershell', 'powershell.exe',
    'pwsh', 'pwsh.exe',
    'cmd', 'cmd.exe',
    'code', 'code.exe',
    'subl', 'subl.exe',
    'atom', 'atom.exe',
    'idea', 'idea.exe',
    'charm', 'charm.exe',
    'notepad', 'notepad.exe'
]);

/**
 * Validates if a shell or editor command is in the allowlist.
 */
export function isValidShell(command: string): boolean {
    if (!command) return false;
    // Normalize path separators to handle Windows paths on Linux
    const normalized = command.replace(/\\/g, '/');
    // Extract the binary name if it's a path
    const binary = path.basename(normalized).toLowerCase();
    return SAFE_BINARIES.has(binary);
}

/**
 * Ensures a path is safe and stays within the base directory to prevent path traversal.
 */
export function isSafePath(basePath: string, targetPath: string): boolean {
    if (!targetPath) return false;

    // Resolve the absolute path
    const resolvedPath = path.resolve(basePath, targetPath);

    // Check if the resolved path is within the base path
    const relative = path.relative(basePath, resolvedPath);

    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Validates if a setting value is of a primitive type and not an object/array.
 */
export function isValidSettingValue(value: any): boolean {
    return ['string', 'number', 'boolean'].includes(typeof value) || value === null;
}
