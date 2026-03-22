## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing administrator-configured commands to run without allowlist validation.

## 2026-02-24 - Improper Validation and Settings Bug
**Vulnerability:** A logic bug in settings validation caused the wrong configuration field to be reset on error. Additionally, relying solely on validation during the "save" operation was insufficient for defense-in-depth.
**Learning:** Validation logic must be carefully tested to ensure it affects the intended fields. More importantly, security-critical parameters (like shell or editor binaries) should be re-validated at the point of use, not just when they are saved to disk, to protect against manual configuration file tampering.
**Prevention:** Implement validation helpers and apply them both at the boundary (saving settings) and at the execution site (IPC handlers).
