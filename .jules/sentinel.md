# 🛡️ Sentinel Security Log

## [2025-05-22] Insecure Server Binding & Sensitive API Key Exposure

- **Vulnerability**: Dev server binding to `0.0.0.0` allowed external access to the development environment.
- **Fix**: Restricted host binding to `127.0.0.1` in both `vite.config.ts` and `vite.web.config.ts`.
- **Vulnerability**: Sensitive API keys (`GEMINI_API_KEY`) were being bundled into the client-side code via Vite's `define` property.
- **Fix**: Removed sensitive keys from the `define` block and added comments regarding secure secret management via Electron main process.
- **Verification**: Verified server is listening on `127.0.0.1:3000` and the application still loads correctly.
