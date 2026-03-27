import { describe, it, expect } from 'vitest';
import { isSafePath, isValidShell } from './security';
import path from 'node:path';

describe('isSafePath', () => {
  const base = '/repo/path';

  it('allows safe relative paths', () => {
    expect(isSafePath(base, 'file.txt')).toBe(true);
    expect(isSafePath(base, 'subdir/file.js')).toBe(true);
  });

  it('denies paths with .. traversal', () => {
    expect(isSafePath(base, '../outside.txt')).toBe(false);
    expect(isSafePath(base, 'subdir/../../outside.txt')).toBe(false);
  });

  it('denies absolute paths', () => {
    expect(isSafePath(base, '/etc/passwd')).toBe(false);
  });

  if (process.platform === 'win32') {
    it('denies Windows-specific traversal on Windows', () => {
      expect(isSafePath(base, 'C:\\windows\\system32')).toBe(false);
      expect(isSafePath(base, '\\absolute\\path')).toBe(false);
      expect(isSafePath(base, '/absolute/path')).toBe(false);
    });
  }
});

describe('isValidShell', () => {
  it('allows common shells', () => {
    expect(isValidShell('bash')).toBe(true);
    expect(isValidShell('/usr/bin/zsh')).toBe(true);
    expect(isValidShell('powershell.exe')).toBe(true);
    expect(isValidShell('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe')).toBe(true);
  });

  it('allows common editors', () => {
    expect(isValidShell('code')).toBe(true);
    expect(isValidShell('vim')).toBe(true);
    expect(isValidShell('nvim.exe')).toBe(true);
  });

  it('denies unknown/malicious binaries', () => {
    expect(isValidShell('malware')).toBe(false);
    expect(isValidShell('rm')).toBe(false);
    expect(isValidShell('curl')).toBe(false);
    expect(isValidShell('python')).toBe(false);
  });

  it('handles empty input', () => {
    expect(isValidShell('')).toBe(false);
    // @ts-ignore
    expect(isValidShell(null)).toBe(false);
  });
});
