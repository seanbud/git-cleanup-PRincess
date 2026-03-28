import { isSafePath, isValidShell } from './security';
import path from 'node:path';

// Mock vitest-like testing for bun test
const describe = (name: string, fn: Function) => {
  console.log(`\n${name}:`);
  fn();
};

const it = (name: string, fn: Function) => {
  try {
    fn();
    console.log(`(pass) ${name}`);
  } catch (error: any) {
    console.log(`(fail) ${name}`);
    throw error;
  }
};

const expect = (received: any) => ({
  toBe: (expected: any) => {
    if (received !== expected) {
      throw new Error(`Expected ${expected}, but received ${received}`);
    }
  }
});

describe('isSafePath', () => {
  const base = '/repo';

  it('allows relative paths within the base', () => {
    expect(isSafePath(base, 'src/App.tsx')).toBe(true);
    expect(isSafePath(base, 'package.json')).toBe(true);
  });

  it('prevents traversal outside the base using ..', () => {
    expect(isSafePath(base, '../etc/passwd')).toBe(false);
    expect(isSafePath(base, 'src/../../etc/passwd')).toBe(false);
  });

  it('prevents absolute paths (on Linux/macOS style)', () => {
    expect(isSafePath(base, '/etc/passwd')).toBe(false);
  });

  it('prevents drive-relative paths (Windows style)', () => {
    expect(isSafePath(base, '\\Windows\\System32')).toBe(false);
    expect(isSafePath(base, 'C:\\Users\\admin')).toBe(false);
  });
});

describe('isValidShell', () => {
  it('allows binaries from the allowlist', () => {
    expect(isValidShell('bash')).toBe(true);
    expect(isValidShell('powershell')).toBe(true);
    expect(isValidShell('code')).toBe(true);
    expect(isValidShell('vim')).toBe(true);
    expect(isValidShell('cursor')).toBe(true);
  });

  it('allows absolute paths for allowlisted binaries', () => {
    expect(isValidShell('/usr/bin/bash')).toBe(true);
    expect(isValidShell('C:\\Program Files\\Microsoft VS Code\\bin\\code.exe')).toBe(true);
    expect(isValidShell('/usr/local/bin/nvim')).toBe(true);
  });

  it('rejects binaries not in the allowlist', () => {
    expect(isValidShell('rm')).toBe(false);
    expect(isValidShell('curl')).toBe(false);
    expect(isValidShell('python')).toBe(false);
    expect(isValidShell('cat')).toBe(false);
  });

  it('handles empty or null inputs', () => {
    expect(isValidShell('')).toBe(false);
  });
});
