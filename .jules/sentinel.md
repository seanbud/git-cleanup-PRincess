## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-03-05 - Binary Hijacking in User-Configurable Settings
**Vulnerability:** While using `execFile` prevents shell injection, allowing users to specify the binary name (e.g., in settings for 'shell' or 'editor') allows them to execute any arbitrary program on the system.
**Learning:** Security validation must happen at both the input (settings save) and execution points. A "double layer" of defense ensures that even if the configuration file is manually tampered with, the application only executes an allowlisted set of safe binaries.
**Prevention:** Maintain an allowlist of known-safe binaries for user-configurable execution and validate against it immediately before calling `execFile`.
