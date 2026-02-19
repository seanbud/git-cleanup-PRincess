## 2026-02-19 - Authentication Bypass in Production
**Vulnerability:** A hidden development shortcut in `LoginScreen.tsx` allowed bypassing authentication by clicking "Waiting for authorization..." in production builds.
**Learning:** Development-only logic can leak into production if not explicitly guarded. "Hidden" UI elements are not secure access controls.
**Prevention:** Wrap all development-only features (shortcuts, debug UI, etc.) in environment checks like `import.meta.env.DEV` to ensure they are stripped from production builds.
