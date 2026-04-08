## 2025-05-15 - [Copy Code Accessibility]
**Learning:** Icon-only buttons that are hidden by default (e.g., using `opacity-0` and `group-hover:opacity-100`) must also include `focus:opacity-100` to be accessible and visible to sighted keyboard users when they tab to them.
**Action:** Always include focus states (`focus:opacity-100`, `focus-visible:ring-2`, etc.) when implementing hover-triggered UI elements.
