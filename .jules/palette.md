## 2025-05-26 - [Accessible and Semantic Dropdown Menus]
**Learning:** Converting `div`-based dropdown triggers and list items to semantic `<button>` elements with appropriate ARIA roles (`listbox`, `option`) and attributes (`aria-haspopup`, `aria-expanded`, `aria-selected`) significantly improves keyboard navigation and screen reader support without requiring layout changes.
**Action:** Audit and convert all interactive "triggers" from `div` to `<button type="button">` and apply the `listbox`/`option` pattern for selection-based menus.

## 2025-05-26 - [Dual Visual and Screen Reader Feedback for Icon Buttons]
**Learning:** Sighted users benefit from native tooltips (`title` attribute) on icon-only buttons, which complements the `aria-label` used by screen readers, providing a consistent experience across different user groups.
**Action:** Always include both `aria-label` and `title` attributes on icon-only buttons to ensure they are descriptive and discoverable.
