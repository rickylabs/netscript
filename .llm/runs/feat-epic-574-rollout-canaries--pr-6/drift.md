# Drift log: rollout canaries + outcome report (#582)

## 2026-07-10 — bootstrap observations

- **Severity:** minor/tooling.
- **What:** plain `git fetch origin` targets a stale configured ref
  (`feat/fresh-ui-pixel-polish`) and failed.
- **Resolution:** fetched the required integration and feature refs explicitly; did not mutate
  remote configuration. Baseline and ancestry were then verified.

- **Severity:** recorded owner override.
- **What:** the Claude coordinator owns Plan-Gate, Tier-A review, and merge; this WSL Codex session
  generates/implements but never self-certifies. Owner-interactive canaries use explicit
  owner-accepted evidence.
- **Impact:** compatible with generator/evaluator session separation. No implementation authority or
  promotion authority is inferred.

## 2026-07-10 — Plan-Gate handoff form

- **Severity:** process-note.
- **What:** the Claude coordinator supplied `Plan-Gate: APPROVED` and the implementation resume
  directive directly, but did not add a `plan-eval.md` commit to this branch.
- **Resolution:** recorded the explicit approval in run artifacts and resumed S1. This worker did
  not create an evaluator artifact or self-certify.

## 2026-07-10 — S2 runner observations

- **Severity:** minor implementation correction.
- **What:** the first quota synthetic command omitted read/write permissions needed only for the
  existing persistence test's temporary directory.
- **Resolution:** corrected the runner argv and reran live evidence. Final state-machine and
  routing-state exits are `0/0`; no #579 behavior changed.

- **Severity:** minor scope-budget drift.
- **What:** the formatted orchestration module is 382 LOC versus the 360 LOC planning target. The
  contract (165 LOC) and CLI edge (53 LOC) remain separate and below their budgets.
- **Rationale:** the module spells out nine canary commands and evidence policies without hiding
  them behind dynamic configuration or duplicating upstream logic. Splitting the five small live
  row builders would add navigation seams without reducing behavior. All TypeScript remains below
  the Archetype-6 hard cap of 500 LOC.

## 2026-07-10 — final doctrine evidence

- **Severity:** gate-classification note.
- **What:** running `check-doctrine.ts --root .llm/tools/agentic` exits 1 because the generic scanner
  treats the repo-internal tool directory as a publishable package and requires `mod.ts`. It also
  reports pre-existing large files, directory cardinality, and CLI exit edges outside this issue.
- **Resolution:** recorded it as a non-verdict and performed the planned manual Archetype-6 review
  over owned files. All new TypeScript is below 500 LOC, injected/pure roles remain separated, and
  no new package/public surface or architecture debt was introduced.
