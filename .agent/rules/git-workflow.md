# Git Workflow & Branching Strategies

This document defines the official Git workflow for the `git-cleanup-PRincess` project. All contributors and automated agents must adhere to these rules to maintain a clean and reliable codebase.

## Core Principles

- **Main Integrity**: The `main` branch must always be in a stable, buildable state.
- **Isolation**: All new features, bug fixes, and updates must be developed on isolated branches.
- **Squash & Merge**: When a branch is ready to be merged into `main`, it should be squashed into a single, clean commit to maintain a readable history.

## Branching Naming Convention

Banches should be prefixed based on their purpose:

- `feature/` : For new components, features, or significant functional updates.
  - *Example*: `feature/syntax-highlighting`, `feature/dust-bunny-variants`
- `fix/` : For bug fixes and small technical corrections.
  - *Example*: `fix/diff-rendering-glitch`, `fix/sound-loading-error`
- `refactor/` : For code cleanup, architectural changes, or performance optimizations without changing functionality.
  - *Example*: `refactor/app-tsx-hooks`
- `release/` : For preparing a new version release.
  - *Example*: `release/v2.0.0`

## Workflow Steps

1. **Branch Creation**: Create a new branch from the latest `main`.
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```
2. **Development**: Commit your changes to the feature branch. Use descriptive commit messages.
3. **Verification**: Verify the changes through automated tests or manual checks as defined in the project's verification plan.
4. **Merge**: Once verified, merge the branch into `main` using the squash method.
   - If using GitHub: Select "Squash and merge" on the Pull Request.
   - If using CLI:
     ```bash
     git checkout main
     git merge --squash feature/your-feature-name
     git commit -m "feat: your feature description"
     git branch -d feature/your-feature-name
     ```

## Automated Agent Rules

- **Always Create Branches**: Agents must never commit directly to `main`.
- **Validation**: Agents should attempt to run builds or tests before recommending a merge.
- **Documentation**: Update the `walkthrough.md` or relevant documentation when a feature is merged.
