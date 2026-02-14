import { describe, it, expect } from 'vitest';
import { generateLongDiff } from './mockGitService';

describe('generateLongDiff', () => {
  it('should generate a simple diff for non-code files', () => {
    const diff = generateLongDiff('README.md');
    expect(diff).toContain('@@ -1,5 +1,5 @@');
    expect(diff).toContain('-Old Title');
    expect(diff).toContain('+New Title');
  });

  it('should generate a multi-hunk diff for TypeScript files', () => {
    const diff = generateLongDiff('test.ts');
    expect(diff).toContain('@@ -1,15 +1,15 @@');
    expect(diff).toContain('@@ -45,10 +45,12 @@');
    expect(diff).toContain('@@ -120,7 +122,7 @@');
    expect(diff).toContain('@@ -200,5 +200,5 @@');
  });

  it('should generate a multi-hunk diff for TSX files', () => {
    const diff = generateLongDiff('Component.tsx');
    expect(diff).toContain('import React from \'react\';');
    expect(diff).toContain('-const OLD_CONSTANT = 10;');
    expect(diff).toContain('+const NEW_CONSTANT = 20;');
  });

  it('should generate a multi-hunk diff for JavaScript files', () => {
    const diff = generateLongDiff('script.js');
    expect(diff).toContain('doOldThing();');
    expect(diff).toContain('doNewThing();');
  });

  it('should include context lines in code diffs', () => {
    const diff = generateLongDiff('test.ts');
    expect(diff).toContain('// Some unchanged imports');
    expect(diff).toContain('// Context line 1');
    expect(diff).toContain('<span>Footer text</span>');
  });
});
