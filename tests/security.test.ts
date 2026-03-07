
import { expect, test, describe } from 'vitest';
import * as path from 'path';

function isValidShell(shell: string): boolean {
    const allowedShells = ['bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd'];
    return allowedShells.includes(shell);
}

function isValidSettingValue(value: string): boolean {
    if (typeof value !== 'string') return false;
    if (value.length > 255) return false;
    if (/[\n\r]/.test(value)) return false;
    return true;
}

const currentCwd = '/Users/test/repo';

function isSafePath(filePath: string, cwd: string): boolean {
    if (!filePath) return false;
    const resolvedPath = path.resolve(cwd, filePath);
    const relative = path.relative(cwd, resolvedPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

describe('Security Validation Logic', () => {
    test('isValidShell should only allow specific shells', () => {
        expect(isValidShell('bash')).toBe(true);
        expect(isValidShell('powershell')).toBe(true);
        expect(isValidShell('rm -rf /')).toBe(false);
        expect(isValidShell('node -e "..."')).toBe(false);
    });

    test('isValidSettingValue should reject dangerous strings', () => {
        expect(isValidSettingValue('code')).toBe(true);
        expect(isValidSettingValue('a'.repeat(256))).toBe(false);
        expect(isValidSettingValue('code\nrm -rf /')).toBe(false);
    });

    test('isSafePath should prevent path traversal', () => {
        expect(isSafePath('src/index.ts', currentCwd)).toBe(true);
        expect(isSafePath('../../../etc/passwd', currentCwd)).toBe(false);
        expect(isSafePath('/etc/passwd', currentCwd)).toBe(false);
        expect(isSafePath('subfolder/../../etc/passwd', currentCwd)).toBe(false);
    });
});
