## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-03-17 - Path Traversal in Electron IPC Handlers
**Vulnerability:** File-related IPC handlers (`file:read-base64`, `shell:trash-item`, etc.) were susceptible to path traversal attacks, allowing the renderer process to access or modify files outside the intended repository directory.
**Learning:** Functions like `path.join` or `path.resolve` do not protect against traversal if the input contains `..` or is an absolute path. Security must be enforced by verifying the relationship between the base directory and the target path.
**Prevention:** Use a dedicated `isSafePath` utility that employs `path.relative` to ensure the resolved path remains within the application's working directory and does not escape via `..` segments.
