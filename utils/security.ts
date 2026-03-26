import path from 'node:path';
/** Validates shell/editor binary allowlist. */
export const isValidShell = (s: string) => {
  if (!s) return false;
  const n = path.basename(s.replace(/\\/g, '/')).toLowerCase().replace(/\.exe$/, '');
  return ['bash','zsh','sh','fish','powershell','pwsh','cmd','wsl','code','subl','atom','idea','charm','notepad','vim','nvim','emacs','nano','vi','gedit','vscodium','cursor','zed'].includes(n);
};
/** Prevents path traversal. */
export const isSafePath = (b: string, u: string) => {
  if (path.isAbsolute(u) || (process.platform === 'win32' && /^[\\\/]/.test(u))) return false;
  const r = path.relative(path.normalize(b), path.normalize(path.join(b, u)));
  return !r.startsWith('..') && !path.isAbsolute(r);
};
