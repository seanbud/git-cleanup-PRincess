## 2025-05-22 - [Indeterminate Checkbox State for List Management]
**Learning:** In React, the `indeterminate` property of a checkbox cannot be set via a prop and must be managed via a DOM ref and `useEffect`. This provides a significant UX improvement for "Select All" functionality when only some items are selected.
**Action:** Always use a ref to sync the indeterminate state of a master checkbox when implementing partial selection logic in lists.

## 2025-05-22 - [Semantic Buttons for Expandable Sections]
**Learning:** Using `div` with `onClick` for expandable sections (like diff context) breaks keyboard navigation. Converting these to semantic `<button>` elements with `aria-label` ensures the interface is accessible to screen readers and keyboard users.
**Action:** Audit interactive elements and ensure they use semantic HTML tags (`<button>`, `<a>`, `<input>`) rather than `<div>` or `<span>`.
