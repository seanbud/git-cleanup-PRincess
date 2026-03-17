import path from 'node:path';

/**
 * Validates that a path is safe and within the specified base directory.
 * Prevents path traversal attacks.
 */
export function isSafePath(base: string, filePath: string): boolean {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(base, filePath);
    const relative = path.relative(base, fullPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Validates if a given shell command is in the allowlist.
 */
export function isValidShell(shell: string): boolean {
    const allowlist = [
        'bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd',
        'bash.exe', 'zsh.exe', 'sh.exe', 'fish.exe', 'powershell.exe', 'pwsh.exe', 'cmd.exe'
    ];
    // Normalize path by getting basename and removing .exe if present
    // On non-Windows, path.basename does not recognize backslashes.
    const normalized = shell.replace(/\\/g, '/');
    const name = path.basename(normalized).toLowerCase();
    return allowlist.includes(name);
}

/**
 * Validates if a setting value matches the expected character pattern and length.
 * Mitigates command injection risk in settings.
 */
export function isValidSettingValue(value: string): boolean {
    // Allows alphanumeric, dots, underscores, dashes, slashes, backslashes, spaces, colons, tildes, parentheses, @, +, ', and ".
    // This covers most common paths and editor commands while blocking shell metacharacters like ; & | > < $ `
    const regex = /^[a-zA-Z0-9._\-\/\\ :~()@+'"]*$/;
    return typeof value === 'string' && value.length < 255 && regex.test(value);
}
