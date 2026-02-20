## 2025-05-14 - [React List Rendering Pattern]
**Learning:** Found a common anti-pattern where a memoized list item component (`FileListItem`) was defined but not used in the main rendering loop, leading to unnecessary re-renders of all list items on every state change.
**Action:** Always verify that memoized sub-components are actually used in the render method and that callbacks passed to them are either stable or handled via custom comparison in `React.memo`.

## 2025-05-15 - [High-Frequency Animation and Interaction Optimization]
**Learning:** Found that the 'DustSpore' component was triggering thousands of re-renders per second due to JS-based animations (setInterval every 50ms) and window 'mousemove' listeners that updated state on every pixel of movement.
**Action:** Offload high-frequency animations to CSS keyframes and use direct DOM manipulation via React refs for high-frequency interactions (like mouse tracking) to bypass the React reconciliation cycle. Attach expensive window listeners conditionally based on component state (e.g., isLooking, isHovered) to further reduce idle CPU usage.
