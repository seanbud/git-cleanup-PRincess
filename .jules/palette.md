# Palette UX Journal

## 2025-05-15 - Improving Dropdown Accessibility in RepoHeader
**Learning:** Interactive elements implemented as `div` tags with `onClick` are inaccessible to keyboard users and screen readers. Converting these to semantic `<button>` elements with ARIA roles (`listbox`, `option`) and states (`aria-expanded`, `aria-selected`, `aria-haspopup`) provides the necessary structural context.
**Action:** Always use semantic HTML tags (`<button>`, `<a>`, `<input>`) for interactive elements. Apply style resets like `bg-transparent border-none p-0` and `w-full text-left` to maintain visual consistency when replacing `div` elements.
