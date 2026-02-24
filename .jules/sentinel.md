## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## 2026-02-21 - Command Injection in Electron IPC
**Vulnerability:** Shell command injection via interpolated strings in `child_process.execSync` within IPC handlers.
**Learning:** Passing unsanitized strings from the renderer to the main process for shell execution is extremely dangerous. Even quoting arguments is insufficient if the shell interprets special characters or if the input breaks out of quotes.
**Prevention:** Always use argument arrays with `execFile` or `execFileSync` to bypass the shell entirely. Restrict IPC handlers to specific binaries (e.g., `git`) rather than allowing arbitrary commands.

## 2026-02-24 - RCE via Unvalidated Settings and Windows `start`
**Vulnerability:** Persistent Command Injection via `shell` and `externalEditor` settings, and an injection risk in `shell:open-terminal` on Windows.
**Learning:** Even when using `execFile`, passing a user-controlled command to `cmd.exe /c start` is dangerous on Windows because `start` and `cmd` can still interpret metacharacters if not handled carefully. Furthermore, trusting IPC input to be the correct type (e.g., Array vs String) at the handler level is a common pitfall.
**Prevention:** Validate all settings before persisting them using a whitelist of allowed characters. On Windows, when using `start`, always provide an explicit empty title `""` as the first argument to ensure subsequent arguments are correctly interpreted as the command. Perform runtime type validation on all IPC arguments.
