# Required Status Checks (GitHub Branch Protection)

Use these settings for `main` branch protection so CI gates are enforced:

1. Go to `Settings` -> `Branches` -> `Add branch protection rule` (or edit the existing rule for `main`).
2. Enable `Require a pull request before merging`.
3. Enable `Require status checks to pass before merging`.
4. Mark these checks as required:
   - `lint`
   - `typecheck`
   - `test`
   - `build`
5. Enable `Require branches to be up to date before merging`.
6. (Recommended) Enable `Require conversation resolution before merging`.

Notes:
- These check names come from `.github/workflows/ci.yml`.
- If you rename CI jobs, update both the branch protection rule and this file.
