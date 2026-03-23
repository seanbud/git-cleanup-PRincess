import { describe, it, expect } from 'vitest';
import { isSafePath, isValidShell } from './security';
import path from 'node:path';

describe('Security Utilities', () => {
    describe('isSafePath', () => {
        const base = '/users/princess/repo';

        it('should allow relative paths inside base', () => {
            expect(isSafePath(base, 'src/main.ts')).toBe(true);
            expect(isSafePath(base, 'package.json')).toBe(true);
            expect(isSafePath(base, '.')).toBe(true);
        });

        it('should block paths using .. to exit base', () => {
            expect(isSafePath(base, '../outside.txt')).toBe(false);
            expect(isSafePath(base, '../../etc/passwd')).toBe(false);
            expect(isSafePath(base, 'src/../../outside.txt')).toBe(false);
        });

        it('should block absolute paths outside base', () => {
            expect(isSafePath(base, '/etc/passwd')).toBe(false);
            expect(isSafePath(base, 'C:\\Windows\\System32\\cmd.exe')).toBe(false);
        });
    });

    describe('isValidShell', () => {
        it('should allow common shells and editors', () => {
            expect(isValidShell('bash')).toBe(true);
            expect(isValidShell('/usr/bin/zsh')).toBe(true);
            expect(isValidShell('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe')).toBe(true);
            expect(isValidShell('code')).toBe(true);
            expect(isValidShell('vim')).toBe(true);
        });

        it('should block unauthorized binaries', () => {
            expect(isValidShell('rm')).toBe(false);
            expect(isValidShell('curl')).toBe(false);
            expect(isValidShell('wget')).toBe(false);
            expect(isValidShell('python -c "import os; os.system(\'rm -rf /\')"')).toBe(false);
            expect(isValidShell('/usr/bin/python3')).toBe(false);
        });

        it('should handle empty or null input', () => {
            expect(isValidShell('')).toBe(false);
            // @ts-ignore
            expect(isValidShell(null)).toBe(false);
        });
    });
});
