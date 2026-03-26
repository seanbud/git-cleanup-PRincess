import { describe, it, expect } from 'vitest';
import { isSafePath, isValidShell } from './security';
describe('Security Utils', () => {
  it('isValidShell', () => {
    ['bash', 'code.exe', 'vscodium'].forEach(s => expect(isValidShell(s)).toBe(true));
    ['evil.sh', ''].forEach(s => expect(isValidShell(s)).toBe(false));
  });
  it('isSafePath', () => {
    expect(isSafePath('/repo', 'src/file.ts')).toBe(true);
    expect(isSafePath('/repo', '../etc/passwd')).toBe(false);
    expect(isSafePath('/repo', '/etc/passwd')).toBe(false);
    if (process.platform === 'win32') expect(isSafePath('C:\\a', '\\b')).toBe(false);
  });
});
