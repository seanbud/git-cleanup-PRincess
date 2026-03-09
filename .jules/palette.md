# Palette Journal - UX & Accessibility Learnings

## 2025-05-15 - [Accessible Dropdown Triggers]
**Learning:** When implementing custom dropdowns, use semantic `<button type="button">` for triggers and list items instead of `<div>` to ensure they are keyboard-focusable and reachable by screen readers. Triggers require `aria-haspopup="listbox"` and `aria-expanded` to communicate their purpose and state.
**Action:** Always prefer semantic button elements for interactive dropdown components and ensure list containers use `role="listbox"`.
