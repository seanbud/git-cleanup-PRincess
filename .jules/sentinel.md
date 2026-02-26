## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-02-25 - Inconsistent Path Traversal Protection
**Vulnerability:** Path traversal was prevented in `file:read-base64` but missing in other file-related IPC handlers like `shell:trash-item`, `shell:open-path`, and `shell:open-directory`.
**Learning:** Security controls must be applied consistently across all similar operations. A single missing check in a less-obvious handler (like "move to trash") can bypass the security perimeter of the entire application.
**Prevention:** Use centralized validation helpers (like `isSafePath`) and audit all IPC handlers that accept file paths or configuration keys to ensure they are properly restricted to the application's scope.
