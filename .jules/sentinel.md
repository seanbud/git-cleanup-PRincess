## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-02-23 - Path Traversal & Command Injection in IPC
**Vulnerability:** IPC handlers allowed potentially unsafe file system operations outside the repository and accepted unsanitized setting values that could be exploited if passed to shells.
**Learning:** Even with `execFileSync` and argument arrays, application logic (like `shell.trashItem` or `shell.openPath`) can be abused for path traversal if not bounded. Furthermore, sensitive settings that control shell or editor selection must be validated against shell metacharacters.
**Prevention:** Implement centralized validation helpers like `isSafePath` and `isValidSettingValue`. Apply these to all IPC handlers that touch the file system or process configuration data. Ensure that settings updates perform safe merges rather than blindly overwriting the configuration object.
