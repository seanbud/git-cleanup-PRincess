# Project Architecture & Patterns

This document outlines the technical architecture and development patterns for `Git Cleanup PRincess`.

## Core Technology Stack

- **Electron**: Main process handling system-level operations (Git CLI, file system, window management).
- **React (TypeScript)**: Renderer process for the UI.
- **Vite**: Build tool and dev server.
- **Tailwind CSS**: Styling.

## Architecture Patterns

### IPC (Inter-Process Communication) Bridge
The application uses a strict IPC bridge to communicate between the Electron main process and the React renderer.
- **Files**: `electron/main.ts` (handlers), `electron/preload.ts` (exposure).
- **Pattern**: The renderer invokes methods exposed via `window.electronAPI`.

### Custom Hooks for State Management
Heavy lifting and Git logic are abstracted into custom hooks to keep components lean.
- `useGitState.ts`: Manages repository status, diffs, and staging.
- `useCharacter.ts`: Logic for the gamified characters (Princess/Prince).

### Theme System
The app supports dual "Princess" and "Prince" themes.
- **Implementation**: `ThemeMode` enum passed through components.
- **Styling**: Conditional Tailwind classes based on the active theme.

## Build & Release Process

### Local Build
```powershell
npm run electron:build
```
This runs a multi-step process:
1. `npm run clean`: Nukes `dist`, `dist-electron`, and `release`.
2. `vite build`: Compiles the React app.
3. `electron-builder`: Packages the app for distribution.

### Bundle Optimization
- We use a tightened `files` glob in `electron-builder.json` to prevent recursive bundling.
- We target `x64` architecture exclusively to minimize installer size.

### Auto-Updates
- Integrated via `electron-updater`.
- GitHub Releases serve as the update source.
- Bumping `version` in `package.json` and pushing a matching `vX.X.X` tag triggers the CI/CD pipeline.

## Repository Structure

- `electron/`: Main process and preload scripts.
- `src/`: React application (components, hooks, utils).
- `public/`: Static assets (sprites, sounds, icons).
- `design/`: Design specs, WIP sprites, and unused assets.
- `.agent/`: Agent instructions and technical documentation.
