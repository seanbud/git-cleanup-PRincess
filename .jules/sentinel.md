## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-03-29 - Path Traversal & Command Injection via Settings
**Vulnerability:** IPC handlers allowed reading files outside the repo via relative paths and executing arbitrary binaries via user-controlled shell/editor settings.
**Learning:** Even with `execFile`, allowing the user to specify the binary (e.g., in settings) can lead to command injection if not validated against an allowlist. Path validation must be centralized and robust against platform-specific separators.
**Prevention:** Implement `isSafePath` for all file operations and `isValidShell`/`isValidEditor` for any handler that executes a user-configurable binary.
