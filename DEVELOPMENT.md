# Development Workflow: git-cleanup-PRincess

This document outlines how we will work together to iteratively improve the application.

## 🔄 Iterative Development Loop

1.  **Request**: You ask for a new feature or a bug fix.
2.  **Implementation**: I write the code and update the configuration files.
3.  **Verification**:
    - **Code Check**: I will verify that the code builds using `npm run build`.
    - **Visual Check**: Because I cannot see the local GUI window, I will rely on you to run `npm run electron:dev` and report back any issues or successes.
4.  **Commit**: I will commit the changes to the feature branch.

## 🧪 Testing Strategy

### Manual Testing
- Run `npm run electron:dev` to verify UI changes and interactivity.
- Run `npm run electron:build` to verify packaging for distribution.

### Automated Testing (Future)
- We can implement unit tests (Vitest) for logic that doesn't require a GUI.
- We can implement Playwright/Spectron tests for end-to-end Electron testing.

## 🚀 Deployment
- Every time we push a tag (e.g., `v1.0.1`), the GitHub Action I created will automatically build installers for Windows, Mac, and Linux and upload them to a GitHub Release.
