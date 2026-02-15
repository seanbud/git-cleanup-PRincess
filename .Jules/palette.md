## 2025-05-15 - [Accessibility of Custom Interactive Components]
**Learning:** Custom UI elements like theme toggles or "Select All" controls built with `div` or `span` are common accessibility traps. They lack keyboard focus, ARIA roles, and standard interaction patterns (like Space/Enter).
**Action:** Always use native semantic elements (like `<input type="checkbox">`) when possible, even if custom styling is needed (using `appearance-none`). For non-native elements, explicitly add `role`, `aria-*` attributes, `tabIndex`, and `onKeyDown` handlers.
