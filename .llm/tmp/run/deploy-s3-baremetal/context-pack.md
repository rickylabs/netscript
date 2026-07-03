# Context Pack — deploy-s3-baremetal

## What this run is

Planning-only harness run for the **bare-metal deploy targets** slice of epic #327: **#339**
(`WindowsServicePort → OsServicePort` + `SystemdAdapter`) + **#340** (`deno compile` single-binary
bare-metal artifact). One coherent bare-metal slice, Archetype 7. **#341 (rollback/health-gate/OTEL/
secrets) is out of scope.**

## State

- Phase: Research + Plan & Design **DONE**. Plan-Gate **PENDING** (PLAN-EVAL, separate session,
  OpenHands/minimax M3). No implementation before PASS.
- Branch `feat/deploy-s3-baremetal`, worktree `.claude/worktrees/deploy-s3`, base `origin/main`
  @ `bf0113df`. Draft PR: see `commits.md` / PR body.
- Artifacts: `research.md`, `plan.md`, `worklog.md`, this pack. Run dir is gitignored → `git add -f`.

## Load-bearing facts

- #337 config contract (`DeployTargetBaseSchema`, `deploy.targets.windows`) is **merged on main**;
  this slice adds `deploy.targets.linux` (spread base). The old `deploy.windows.*` only appears on
  stale branches.
- #338 doctrine (Archetype 7 + F-DEPLOY-1/2 + reconciliation) is **PR #357, DRAFT, not on main** —
  read-only reference in the `deploy-s2` worktree. Sequence implementation after/with #357.
- Two seams ship on main: (a) 3-op stub `DeployTargetPort`/`WindowsServiceDeployTarget` + registry;
  (b) real `WindowsServicePort`/`ServyCliAdapter`. LD-1 unifies them (target adapter composes port).
- Two Windows call paths: install/uninstall use the port; start/stop/status call `runServy()`
  directly — must unify behind `OsServicePort`.
- File-size ceiling tight: `upgrade` 342, `build-windows-strategy` 301, `compile-runner` 292 → extract.

## Next action

Run PLAN-EVAL (separate session). On PASS, implement via WSL Codex daemon-attached slices in the
S0→S10 order in `plan.md` §Commit-Slice List.
