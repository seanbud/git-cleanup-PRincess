## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-03-01 - Renderer-Controlled Command Execution via Settings
**Vulnerability:** The Electron main process used renderer-provided settings (e.g., `externalEditor`, `shell`) directly in `execFile` without validation.
**Learning:** Even when using `execFile` (which avoids shell injection), allowing the renderer to specify arbitrary executable names is dangerous. An attacker could set these settings to a malicious binary or a sensitive system tool.
**Prevention:** Always validate and sanitize all inputs from the renderer, especially those used in filesystem or process execution APIs. Use a whitelist or strict character blocking for user-configurable executable paths.
