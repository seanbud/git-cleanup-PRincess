## 2025-05-22 - [Indeterminate Checkbox State for List Management]
**Learning:** In React, the `indeterminate` property of a checkbox cannot be set via a prop and must be managed via a DOM ref and `useEffect`. This provides a significant UX improvement for "Select All" functionality when only some items are selected.
**Action:** Always use a ref to sync the indeterminate state of a master checkbox when implementing partial selection logic in lists.

## 2025-05-22 - [Semantic Buttons for Expandable Sections]
**Learning:** Using `div` with `onClick` for expandable sections (like diff context) breaks keyboard navigation. Converting these to semantic `<button>` elements with `aria-label` ensures the interface is accessible to screen readers and keyboard users.
**Action:** Audit interactive elements and ensure they use semantic HTML tags (`<button>`, `<a>`, `<input>`) rather than `<div>` or `<span>`.

## 2025-05-23 - [Keyboard Shortcut Hints in Placeholders]
**Learning:** Adding visual hints for keyboard shortcuts in input placeholders (e.g., "[/]") increases discoverability and provides a "power user" feel to the interface without cluttering it.
**Action:** Use bracket notation in placeholders to hint at available keyboard shortcuts for common actions like searching or filtering.

## 2025-05-23 - [Semantic Checkboxes vs Custom Divs]
**Learning:** Replacing custom `div`-based checkboxes with real semantic `<input type="checkbox">` elements, even when they need custom styling, is crucial for accessibility (ARIA) and keyboard navigation.
**Action:** Always prefer semantic input elements for selection states and use refs to manage indeterminate states if needed.

## 2026-02-20 - [Keyboard Navigation for List Items]
**Learning:** For interactive lists, adding keyboard support (Enter/Space) and visible focus states (`focus-visible`) is essential for accessibility. Using a shared handler that accepts both `MouseEvent` and `KeyboardEvent` allows for clean, typed multi-select logic (using meta/shift keys) without type casting.
**Action:** Implement `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler for all interactive list items, and ensure focus styles are visually distinct.
