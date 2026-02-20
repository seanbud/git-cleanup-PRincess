## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-03-05 - Command Injection via Electron IPC
**Vulnerability:** Passing raw command strings from the renderer to the main process and executing them via `execSync` allowed arbitrary shell command injection.
**Learning:** Even with seemingly safe strings, shell meta-characters and user-controlled inputs (like filenames or branch names) can be exploited to execute malicious code.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell. Never allow the renderer to specify the executable; use dedicated handlers for specific OS actions like opening editors or terminals. Validate URL protocols for `shell.openExternal`.
