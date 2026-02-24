## 2025-05-14 - [React List Rendering Pattern]
**Learning:** Found a common anti-pattern where a memoized list item component (`FileListItem`) was defined but not used in the main rendering loop, leading to unnecessary re-renders of all list items on every state change.
**Action:** Always verify that memoized sub-components are actually used in the render method and that callbacks passed to them are either stable or handled via custom comparison in `React.memo`.

## 2025-05-15 - [High-Frequency Animation Optimization]
**Learning:** High-frequency animations (floating, eye tracking) using JS intervals and state updates were causing major CPU bottlenecks in multi-select views. CSS keyframes are superior for periodic movement, and direct DOM manipulation via Refs is more efficient for mouse tracking to avoid React reconciliation overhead.
**Action:** Use nested wrappers for multi-axis CSS animations to avoid property conflicts. Use direct attribute updates (e.g., setAttribute) on SVG elements for high-frequency tracking interaction.

## 2026-02-22 - [Memoizing Derived Props for Heavy Components]
**Learning:** Passing object literals as props (e.g., `file={ { ...file, diffContent } }`) to heavy components like `DiffView` causes them to re-render and re-parse data on every parent render, even if the data hasn't changed. Memoizing these derived objects with `useMemo` is critical for maintaining reference stability and skipping expensive processing.
**Action:** Always wrap derived objects in `useMemo` if they are passed to components that perform heavy parsing or rendering (like diff viewers or graphs). Use specific identity dependencies (like IDs) to balance performance and correctness.

## 2025-05-16 - [Bulk Operation Efficiency]
**Learning:** Sequential async operations in loops (e.g., spawning a Git process per file) lead to significant overhead as the number of items grows. Batching operations into single commands (e.g., `git checkout -- file1 file2...`) and parallelizing independent I/O (e.g., `Promise.all` for IPC/trash calls) converts O(N) process overhead into O(1) or O(log N) latency.
**Action:** Prefer bulk Git commands for multi-file actions. Use `Promise.all` to overlap independent asynchronous Git/IPC calls, especially in high-frequency data-fetching paths like `getStatusFiles`.
