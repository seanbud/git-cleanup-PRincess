## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-03-05 - Improper Settings Validation leading to RCE
**Vulnerability:** User-configurable settings for shell and external editor were persisted without validation, allowing a malicious actor (or a compromised renderer) to point these to arbitrary binaries (e.g., `rm`, `curl`) and achieve Remote Code Execution.
**Learning:** Even when using `execFile` with argument arrays, if the binary itself is user-controlled, it can still be used for malicious purposes. Settings must be treated as untrusted input.
**Prevention:** Implement a strict allowlist of approved binaries for shells and editors. Validate settings at both the point of persistence and the point of execution.
