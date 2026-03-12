## 2026-03-12 - [Semantic Dropdowns in RepoHeader]
**Learning:** Using semantic `<button>` elements instead of `<div>` for dropdown triggers and options significantly improves keyboard accessibility and screen reader support without breaking visual layout, provided style resets are applied.
**Action:** Always prefer `<button type="button">` for interactive elements and use ARIA roles like `listbox` and `option` for custom dropdown implementations.
