# Git Branching Strategy

- **`development`** is the base branch. All work is branched from it and merged back into it.
  There is no `main`/release branch yet — that can be introduced later if/when this project has
  an actual deployment or release process (out of scope for Phase 1).
- **One feature branch per requirement**, cut from `development`:
  ```
  git checkout development
  git pull                     # once a remote exists; skip for a local-only repo
  git checkout -b feature/<short-description>
  ```
  Name it after the requirement, e.g. `feature/topic-search`, `feature/note-attachments`,
  `feature/edge-delete-confirm`. For a bug fix, use `fix/<short-description>` instead of
  `feature/...`.
- **Commit to the feature branch** as the requirement is implemented (see `ARCHITECTURE.md` for
  the implementation rules and the requirement-intake workflow that precedes any coding).
- **Test and verify on the feature branch first.** Only merge to `development` once the change
  has been run and checked (backend + frontend as applicable per `README.md`'s local run steps).
- **Merge to `development`** once verified, then delete the feature branch:
  ```
  git checkout development
  git merge --no-ff feature/<short-description>
  git branch -d feature/<short-description>
  ```
- Do not commit directly to `development` for a feature or fix — always go through a feature/fix
  branch, even for small changes, so `development` only ever receives tested, complete work.
