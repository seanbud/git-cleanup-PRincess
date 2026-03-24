// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { isSafePath, isValidShell } from './security';
import path from 'node:path';

describe('isSafePath', () => {
    const base = '/repo/root';

    it('returns true for safe relative paths', () => {
        expect(isSafePath(base, 'file.txt')).toBe(true);
        expect(isSafePath(base, 'src/main.ts')).toBe(true);
        expect(isSafePath(base, './file.txt')).toBe(true);
    });

    it('returns false for path traversal', () => {
        expect(isSafePath(base, '../outside.txt')).toBe(false);
        expect(isSafePath(base, 'src/../../outside.txt')).toBe(false);
        expect(isSafePath(base, '/etc/passwd')).toBe(false);
    });

    it('blocks Windows absolute paths', () => {
        expect(isSafePath(base, 'C:\\windows\\system32\\cmd.exe')).toBe(false);
        expect(isSafePath(base, 'D:\\Users\\Downloads')).toBe(false);
        expect(isSafePath(base, 'C:/windows/system32/cmd.exe')).toBe(false);
    });

    it('handles nested directories within base correctly', () => {
        expect(isSafePath(base, 'nested/dir/file.txt')).toBe(true);
    });
});

describe('isValidShell', () => {
    it('returns true for allowlisted binaries', () => {
        expect(isValidShell('bash')).toBe(true);
        expect(isValidShell('/usr/bin/bash')).toBe(true);
        expect(isValidShell('C:\\bin\\powershell.exe')).toBe(true);
        expect(isValidShell('cmd.exe')).toBe(true);
        expect(isValidShell('code')).toBe(true);
    });

    it('returns false for non-allowlisted binaries', () => {
        expect(isValidShell('malicious-script.sh')).toBe(false);
        expect(isValidShell('/bin/python')).toBe(false);
        expect(isValidShell('C:\\windows\\regedit.exe')).toBe(false);
        expect(isValidShell('')).toBe(false);
    });

    it('normalizes paths correctly', () => {
        expect(isValidShell('C:/bin/powershell.exe')).toBe(true);
        expect(isValidShell('/usr/local/bin/zsh')).toBe(true);
    });
});
