## 2025-05-14 - Copy to Clipboard Visual Feedback
**Learning:** When implementing "Copy to Clipboard" functionality, providing immediate visual feedback by temporarily changing the icon (e.g., to a checkmark) and the button's background color significantly improves user confidence that the action was successful.
**Action:** Always include a temporary success state (approx. 2 seconds) for clipboard interactions, ideally using a `useEffect` for robust cleanup of the timer.
