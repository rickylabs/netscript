# Drift

## 2026-08-03 — baseline moved

- Severity: routine.
- Prompt base `f663fe0e4` was superseded by supervisor addendum/current `origin/main` `4634afe56`.

## 2026-08-03 — #1021 reproduction refuted

- Severity: significant current-state drift, not scope expansion.
- The issue's 0.0.2 premise no longer holds: current scaffolds emit and track the generated Fresh route files, and a freshly cloned generated workspace passes README `deno task check`.
- Response: do not rewrite correct documentation; locate/strengthen the narrowest regression proof and report the clean-clone CI acceptance box honestly.

## 2026-08-03 — evaluator transport unavailable

- Severity: process-only.
- The locked local Qwen PLAN-EVAL route had no configured direct model/credentials in this runtime.
- The orchestrator explicitly took direct control and instructed implementation to continue without
  replanning. No implementation-session self-evaluation was substituted for the required independent
  harness evaluator.

## 2026-08-03 — E2E fixture ownership cleanup

- Severity: validation hygiene.
- Infrastructure suite runs left root-owned Postgres data beneath generated fixtures (no container
  survived),
  generated fixture, causing the repository-wide forbidden-command scanner to receive
  `PermissionDenied` after 2,516 passing tests.
- Each path was beneath this worktree's exact E2E smoke root. The run-created fixture directories
  and external clean-clone/counterfactual directories were removed; the scanner passed and
  leak-check reported no survivors.

## 2026-08-03 — #1016 CI lane placement corrected

- Severity: implementation-loop correction.
- The first pushed workflow ran an Aspire-dependent infrastructure suite in `scaffold-static`, whose
  contract is deno-only. GitHub failed at `database.init`, exactly as a missing-Aspire lane should.
- Response: keep the README clone gate in `scaffold-static`, and include the hostile-parent config
  plus dev probe in the existing Aspire-backed `scaffold.runtime` gate list.
