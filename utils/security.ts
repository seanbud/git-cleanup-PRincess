import path from 'node:path';

export function isSafePath(filePath: string, currentCwd: string): boolean {
    const fullPath = path.resolve(currentCwd, filePath);
    const relative = path.relative(currentCwd, fullPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function isValidShell(shell: string): boolean {
    const allowlist = ['bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd'];
    return allowlist.includes(shell);
}

export function isValidSettingValue(value: string): boolean {
    // Basic validation: length limit and character restriction to prevent command injection
    // Added ' and " to allow for paths with quotes
    return value.length <= 255 && /^[a-zA-Z0-9._\-\/\\ :~()@+'"]*$/.test(value);
}
