## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-03-18 - Insecure Settings and Path Traversal in IPC
**Vulnerability:** IPC handlers allowed saving arbitrary strings as shell/editor commands and performing file operations on arbitrary paths provided by the renderer.
**Learning:** Renderer-provided paths and settings must be validated in the main process even if the frontend is trusted. Path traversal can expose sensitive system files, and insecure settings can lead to command injection if used as executable paths.
**Prevention:** Use `path.resolve` and `path.relative` to verify paths are within the expected directory. Validate sensitive settings against an allowlist or a strict regex that excludes shell metacharacters.
