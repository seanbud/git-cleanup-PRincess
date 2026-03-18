import path from 'node:path';

/**
 * Security validation constants and helpers.
 */

// Allowlist for terminal shells and editors
export const SHELL_ALLOWLIST = new Set([
  'bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd',
  'bash.exe', 'zsh.exe', 'powershell.exe', 'pwsh.exe', 'cmd.exe',
  'code', 'code.exe', 'vim', 'vi', 'nano'
]);

// Regex for valid string settings (alphanumeric, dots, dashes, slashes, spaces, and some safe path characters)
export const VALID_SETTING_REGEX = /^[a-zA-Z0-9._\-\/\\ :~()@+'"]*$/;

// Maximum length for any string setting to prevent buffer overflow or DoS
export const MAX_SETTING_LENGTH = 255;

/**
 * Validates if a given shell or editor path/command is in the allowlist.
 */
export function isValidShell(shellPath: string): boolean {
  if (!shellPath) return false;
  // Get the basename (e.g., 'bash' from '/usr/bin/bash' or 'powershell.exe' from Windows path)
  // For Windows paths, basename might not work correctly on Linux, so we normalize backslashes
  const normalizedPath = shellPath.replace(/\\/g, '/');
  const name = normalizedPath.split('/').pop()?.toLowerCase();
  return name ? SHELL_ALLOWLIST.has(name) : false;
}

/**
 * Validates a string setting value against regex and length constraints.
 */
export function isValidSettingValue(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (value.length > MAX_SETTING_LENGTH) return false;
  return VALID_SETTING_REGEX.test(value);
}

/**
 * Verifies that a file path is safe and contained within the repository root.
 */
export function isSafePath(base: string, target: string): boolean {
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(base, target);
  const relative = path.relative(resolvedBase, resolvedTarget);

  return !relative.startsWith('..') && !path.isAbsolute(relative);
}
