## 2024-05-27 - [Hidden Login Bypass]
**Vulnerability:** A hidden click handler in `LoginScreen.tsx` allowed bypassing authentication by clicking "Waiting for authorization...".
**Learning:** Development tools and shortcuts can leak into production if not explicitly guarded. "Security through obscurity" (hiding the UI element) is not sufficient.
**Prevention:** Always wrap development-only logic in conditional checks like `if (import.meta.env.DEV)`. Ensure production builds strip out this code or make it unreachable.
