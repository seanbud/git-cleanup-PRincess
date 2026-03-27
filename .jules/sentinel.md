## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-03-27 - Path Traversal and Binary Execution Risks
**Vulnerability:** IPC handlers allowed potentially malicious file paths (traversal) and execution of arbitrary binaries via user-configurable settings.
**Learning:** Even when using safe execution methods like `execFile`, if the binary itself is user-controlled, it can lead to arbitrary code execution. Path traversal in Electron's `shell.trashItem` or `fs.readFileSync` can expose or destroy files outside the intended scope.
**Prevention:** Implement an allowlist for user-configurable binaries (shells/editors). Use a robust `isSafePath` utility that resolves and compares paths to ensure they stay within the authorized directory. Validate inputs at both the storage (saving settings) and execution layers.
