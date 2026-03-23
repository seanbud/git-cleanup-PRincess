## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-02-24 - Cross-Platform Path Traversal
**Vulnerability:** Path traversal vulnerabilities allowed accessing files outside the repository via `..` or absolute paths in Electron IPC handlers.
**Learning:** Standard `path.relative` checks are insufficient for cross-platform absolute paths (especially Windows drive letters) when running in a POSIX-like environment. `path.isAbsolute` may return `false` for Windows paths on Linux.
**Prevention:** Combine `path.relative` logic with explicit regex checks for Windows-style absolute paths (`/^[a-zA-Z]:\\/`) and always resolve paths against a trusted base directory before validation.
