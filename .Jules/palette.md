## 2025-05-14 - Accessible Checkboxes and Keyboard Shortcuts
**Learning:** Combining non-semantic elements like `div` with `input` for custom checkboxes creates accessibility gaps (missing focus states, roles). Also, users expect standard keyboard shortcuts like `/` for search, but these need visual hints to be discoverable.
**Action:** Always use semantic `<input type="checkbox">` with `aria-label` for selection states, and include bracketed keyboard hints (e.g., `[/]`) in placeholders when implementing focus shortcuts.
