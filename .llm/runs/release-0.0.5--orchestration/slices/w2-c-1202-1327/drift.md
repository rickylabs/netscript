# W2-C drift log

## 2026-08-08 — shared contract path absent (minor)

- Expected: `.llm/runs/release-0.0.5--orchestration/slices/_shared-brief-contract.md`.
- Observed: absent from the worktree and `origin/main` tree.
- Resolution: use the complete inlined shared supervisor contract from the launch prompt as the
  authoritative contract. No scope or gate was dropped.

## 2026-08-08 — launch preparation metadata superseded (minor)

- The checked-in `supervisor.md` contains pre-dispatch branch/worktree/evaluator placeholders.
- The explicit launch identity in the current prompt and actual worktree state are authoritative.
- No rival sender or evaluator is launched from this session.

## 2026-08-09 — acceptance gates registered but omitted from runtime allowlist (material)

- Expected: the granted `scaffold.runtime` pass executes the new migration-artifact and consecutive
  allocation/live-endpoint gates.
- Observed: the command returned `passed=76 failed=0`, but none of the four new IDs appeared in its
  execution list. Registration alone does not select a gate because the built-in suite maintains an
  explicit allowlist.
- Repair: add all four IDs to the Postgres runtime allowlist, exclude them from the SQLite tier, and
  assert both selections in the suite-registry test (16 passed, 0 failed).
- Evidence boundary: no blind retry was run. The 76-gate result is green but is not evidence for the
  four omitted acceptance gates. A fresh serialized grant is required before merge readiness.
