## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-03-05 - Missing Validation in Shell and File IPC Handlers
**Vulnerability:** IPC handlers for shell operations (trash, open) and file reading lacked validation, allowing path traversal or execution of potentially dangerous user-configured strings.
**Learning:** Even when using "safe" APIs like `shell.trashItem` or `execFile`, lack of input validation can still lead to unauthorized file access or shell injection if the inputs (like file paths or editor commands) are sourced from the renderer without server-side verification.
**Prevention:** Implement a centralized security utility to validate paths against the active repository (`isSafePath`) and sanitize user-configurable settings (`isValidSettingValue`). Always validate inputs in the main process before passing them to OS-level APIs.
