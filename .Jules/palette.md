## 2025-05-15 - [Keyboard Accessibility and Hints]
**Learning:** Custom interactive components like theme toggles often lack keyboard support and ARIA roles. Adding `tabIndex`, `onKeyDown` (for Enter/Space), and `role="switch"` significantly improves accessibility. Additionally, providing visual hints for keyboard shortcuts (like `[/]`) in input placeholders enhances discoverability and user delight.
**Action:** Always check custom UI components for keyboard navigability and add aria-labels to all icon-only interactions.
