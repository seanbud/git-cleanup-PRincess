## 2025-05-12 - [Semantic Dropdown Triggers]
**Learning:** Using non-semantic `div` elements for dropdown triggers and items completely breaks keyboard navigation and screen reader support, even if they have `onClick` handlers.
**Action:** Always use `<button type="button">` for interactive triggers and list items, resetting styles as needed, and provide explicit ARIA roles and labels to ensure accessibility.
