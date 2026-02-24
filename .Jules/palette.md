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

## 2025-05-24 - [Keyboard Navigation for List Items]
**Learning:** Making list items keyboard-focusable (`tabIndex={0}`, `role="button"`) and handling `Enter`/`Space` keys is essential for accessibility. When doing so, nested interactive elements like checkboxes should have `tabIndex={-1}` to avoid redundant tab stops for keyboard users.
**Action:** Implement robust keyboard navigation for interactive lists by making the container focusable and managing nested interactive elements' tab order.

## 2025-05-25 - [Accessibility for Toggle Buttons in Diff View]
**Learning:** Using semantic `<button type="button">` with `aria-expanded` and `aria-label` for chunk headers and context expansion in diff views ensures that complex code-viewing interfaces are navigable for screen reader and keyboard users.
**Action:** Always use buttons for toggles in the diff view and include `focus:ring-inset` to provide clear focus indicators without layout shifts.

## 2025-05-26 - [Semantic Dropdown Triggers and Items]
**Learning:** In complex navigation headers, using `div` for dropdown triggers and list items breaks keyboard accessibility. Converting these to semantic `<button type="button">` with `aria-haspopup`, `aria-expanded`, and `role="listbox/option"` provides native focus management and screen reader support with minimal CSS overhead.
**Action:** Replace all interactive `div` elements in navigation and menu components with semantic buttons, ensuring they have appropriate ARIA states and focus rings.
