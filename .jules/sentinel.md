## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-02-23 - Broad IPC Hardening & Input Validation
**Vulnerability:** Multiple IPC handlers lacked validation for paths and settings, potentially allowing path traversal or command injection via shell metacharacters in configuration.
**Learning:** Even when using `execFileSync`, unsanitized user-controlled strings in configuration files or secondary commands can still lead to logic flaws or unexpected behavior. Path traversal is a constant risk when the renderer can specify relative paths for file system operations.
**Prevention:** Implement strict input validation for all IPC arguments. Use `path.relative` to enforce repository boundaries and sanitize all setting values against shell metacharacters before saving or using them in process execution.
