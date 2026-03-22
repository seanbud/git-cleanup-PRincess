import { describe, it, expect } from 'bun:test';
import { isSafePath, isValidShell } from './security';
import path from 'node:path';

describe('isSafePath', () => {
    const base = '/users/princess/repo';

    it('should return true for relative paths inside the base directory', () => {
        expect(isSafePath(base, 'src/main.ts')).toBe(true);
        expect(isSafePath(base, 'index.html')).toBe(true);
    });

    it('should return true for absolute paths inside the base directory', () => {
        const full = path.join(base, 'src/main.ts');
        expect(isSafePath(base, full)).toBe(true);
    });

    it('should return false for traversal attempts (e.g., ../)', () => {
        expect(isSafePath(base, '../other/secret.txt')).toBe(false);
        expect(isSafePath(base, '../../etc/passwd')).toBe(false);
    });

    it('should return false for absolute paths outside the base directory', () => {
        expect(isSafePath(base, '/etc/passwd')).toBe(false);
        expect(isSafePath(base, '/users/other-user/repo')).toBe(false);
    });

    it('should handle nested directory checks correctly', () => {
        expect(isSafePath(base, 'src/components/Button.tsx')).toBe(true);
    });
});

describe('isValidShell', () => {
    it('should return true for common shell names', () => {
        expect(isValidShell('bash')).toBe(true);
        expect(isValidShell('zsh')).toBe(true);
        expect(isValidShell('powershell')).toBe(true);
        expect(isValidShell('pwsh')).toBe(true);
    });

    it('should return true for full paths to common shells', () => {
        expect(isValidShell('/bin/bash')).toBe(true);
        expect(isValidShell('/usr/local/bin/zsh')).toBe(true);
        expect(isValidShell('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe')).toBe(true);
    });

    it('should return true for common editors', () => {
        expect(isValidShell('code')).toBe(true);
        expect(isValidShell('cursor')).toBe(true);
        expect(isValidShell('vim')).toBe(true);
    });

    it('should return false for unknown or potentially dangerous commands', () => {
        expect(isValidShell('curl')).toBe(false);
        expect(isValidShell('rm')).toBe(false);
        expect(isValidShell('nc')).toBe(false);
        expect(isValidShell('python -c "import os; os.system(\'rm -rf /\')"')).toBe(false);
    });

    it('should return false for empty or null inputs', () => {
        expect(isValidShell('')).toBe(false);
    });
});
