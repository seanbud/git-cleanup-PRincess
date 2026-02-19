# 🛡️ Sentinel Security Log

## 2026-02-19 - API Key Leak via Vite Define
**Vulnerability:** Sensitive API keys (GEMINI_API_KEY) were being bundled into the frontend JavaScript via Vite's `define` configuration.
**Learning:** Even if an environment variable is not explicitly used in the source code, including it in the `define` block of `vite.config.ts` makes it accessible to anyone who inspects the client-side artifacts.
**Prevention:** Only expose public configuration to the frontend. Manage all secrets in the Electron main process and never use `define` or the `VITE_` prefix for sensitive data.

## [2025-05-22] Insecure Server Binding & Sensitive API Key Exposure
- **Vulnerability**: Dev server binding to `0.0.0.0` allowed external access to the development environment.
- **Fix**: Restricted host binding to `127.0.0.1` in both `vite.config.ts` and `vite.web.config.ts`.
- **Vulnerability**: Sensitive API keys (`GEMINI_API_KEY`) were being bundled into the client-side code via Vite's `define` property.
- **Fix**: Removed sensitive keys from the `define` block and added comments regarding secure secret management via Electron main process.
- **Verification**: Verified server is listening on `127.0.0.1:3000` and the application still loads correctly.
