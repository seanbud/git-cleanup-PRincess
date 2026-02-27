## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-02-23 - Path Traversal in Electron IPC Handlers
**Vulnerability:** IPC handlers like `shell:trash-item` and `shell:open-path` accepted unsanitized paths from the renderer, allowing operations on files outside the repository.
**Learning:** Even if the renderer is trusted, IPC handlers that interact with the file system must validate that paths are within expected boundaries (e.g., the current repository). `path.resolve` combined with `path.relative` is an effective way to verify path containment.
**Prevention:** Implement a utility like `isSafePath` in the main process and use it to validate all incoming paths from the renderer before passing them to Electron shell APIs or `fs` methods.
