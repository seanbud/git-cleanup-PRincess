## 2025-05-14 - [React List Rendering Pattern]
**Learning:** Found a common anti-pattern where a memoized list item component (`FileListItem`) was defined but not used in the main rendering loop, leading to unnecessary re-renders of all list items on every state change.
**Action:** Always verify that memoized sub-components are actually used in the render method and that callbacks passed to them are either stable or handled via custom comparison in `React.memo`.

## 2025-05-15 - [High-Frequency Animation Optimization]
**Learning:** High-frequency animations (floating, eye tracking) using JS intervals and state updates were causing major CPU bottlenecks in multi-select views. CSS keyframes are superior for periodic movement, and direct DOM manipulation via Refs is more efficient for mouse tracking to avoid React reconciliation overhead.
**Action:** Use nested wrappers for multi-axis CSS animations to avoid property conflicts. Use direct attribute updates (e.g., setAttribute) on SVG elements for high-frequency tracking interaction.

## 2026-02-22 - [Memoizing Derived Props for Heavy Components]
**Learning:** Passing object literals as props (e.g., `file={ { ...file, diffContent } }`) to heavy components like `DiffView` causes them to re-render and re-parse data on every parent render, even if the data hasn't changed. Memoizing these derived objects with `useMemo` is critical for maintaining reference stability and skipping expensive processing.
**Action:** Always wrap derived objects in `useMemo` if they are passed to components that perform heavy parsing or rendering (like diff viewers or graphs). Use specific identity dependencies (like IDs) to balance performance and correctness.

## 2026-05-20 - [Parallelizing Git CLI Operations]
**Learning:** Sequential Git CLI calls in Electron IPC handlers can significantly block the main thread and increase UI latency (e.g., status refresh taking >120ms). Converting handlers to asynchronous `execFile` and batching independent Git queries into `Promise.all` blocks reduces latency to the duration of the longest single command and eliminates IPC overhead.
**Action:** Always prefer asynchronous IPC for shell commands. Use `Promise.all` to parallelize independent CLI operations (status, diff-stats, config) and hoist common state (current branch) to avoid redundant lookups.
