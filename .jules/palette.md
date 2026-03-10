## 2025-05-14 - Improved Header Accessibility
**Learning:** Using semantic `<button>` elements with `aria-haspopup` and `aria-expanded` instead of `<div>` for dropdown triggers significantly improves keyboard navigability and screen reader support without breaking styles when paired with Tailwind resets.
**Action:** Always prefer `<button type="button">` with `bg-transparent border-none p-0` for interactive elements that are not naturally buttons.
