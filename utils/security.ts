import path from 'node:path';

/**
 * Prevents path traversal by ensuring the resolved path is within the base directory.
 */
export function isSafePath(base: string, unsafePath: string): boolean {
  const normalizedBase = path.normalize(base);
  const fullPath = path.isAbsolute(unsafePath) ? unsafePath : path.join(normalizedBase, unsafePath);
  const relative = path.relative(normalizedBase, fullPath);

  // Path is safe if it doesn't start with '..' and is not an absolute path
  // (on Windows, path.isAbsolute(relative) can be true for drive-relative paths like /temp)
  // We also explicitly block paths starting with / or \ to handle Windows/Posix mixed environments
  // or absolute paths like C:\ which might not be caught by isAbsolute on Posix systems.
  if (unsafePath.startsWith('/') || unsafePath.startsWith('\\') || /^[a-zA-Z]:\\/.test(unsafePath)) {
    return false;
  }

  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Validates a shell or editor binary against an allowlist to prevent command injection.
 */
export function isValidShell(shellPath: string): boolean {
  if (!shellPath) return false;

  const allowlist = [
    'bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd', 'wsl',
    'code', 'subl', 'atom', 'idea', 'charm', 'notepad', 'vim', 'nvim', 'emacs', 'nano', 'vi', 'gedit',
    'vscodium', 'cursor', 'zed'
  ];

  // Normalize path and get the basename (handling both / and \ separator)
  const basename = path.basename(shellPath.replace(/\\/g, '/')).toLowerCase();
  const nameWithoutExe = basename.replace(/\.exe$/, '');

  return allowlist.includes(nameWithoutExe);
}
