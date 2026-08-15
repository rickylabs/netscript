# Context Pack: quality-scan-root-coverage

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage` |
| Branch | `fix/quality-scan-root-coverage` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service`, `docs` |
| Draft PR | `#1656` |
| Thread | `01a003d2-61ee-7ec0-8c74-075b3d631168` |

## Current state

Bootstrap, live research, and bounded plan/design are complete against immutable base
`473e8d75b5281c93dc4729d99f3358a34f2bd687`. PLAN-EVAL is required and implementation is blocked
until the coordinator obtains a separate-session `PASS`.

## Completed

- Verified the exact worktree/branch/baseline; preserved launcher-owned thread metadata.
- Committed and pushed bootstrap as `5dc2d2148`.
- Opened draft PR #1656 with `Closes #1542`, unchecked DoD, run path, slices, and Drift/Debt; no
  acceptance-evidence blocks.
- Applied `type:fix`, `area:tooling`, `status:research`, milestone `0.0.7` (ID 27).
- Re-read #1542 live and re-derived current roots, publish census, doctrine behavior, tests, CI, JSR
  risks, and #1653 low findings.
- Locked a three-path proposed edit surface and three slices in `plan.md`/`worklog.md`.

## Key findings

- Published package/plugin denominator: 35. Non-published declarations: Bench and CLI E2E.
- `quality:scan` fully covers only six plugin members; 29 package members are not fully covered.
- `quality:scan:repo` already uses broad package/plugin roots.
- `arch:check` dynamically covers 36 top-level doctrine units and already includes Streams; nested
  CLI E2E is intentionally excluded and `publish:false`.
- Scanner output already includes its exact `scanned` roots.

## Proposed exact edit surface

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tools/quality/check-root-coverage.ts` | proposed new | Fail-closed published/task/doctrine coverage report. |
| `.llm/tools/quality/check-root-coverage_test.ts` | proposed new | Omission/future-member/exclusion/live invariant tests. |
| `deno.json` | proposed edit | Broad `packages` root and checker binding in both scan tasks. |

Everything else in the frozen outer bound is deliberately untouched unless the coordinator approves
a rescope after PLAN-EVAL.

## Next steps

1. Coordinator launches fresh native opposite-family Fable 5 medium PLAN-EVAL.
2. Evaluator writes `plan-eval.md` and returns `PASS` or `FAIL_PLAN`.
3. Only after coordinator-disposed `PASS`, resume the same Codex thread for S1.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan-Gate | REQUIRED / awaiting coordinator | `plan.md`, `research.md`, `worklog.md` Design |
| Static | NOT FIRED | Implementation authority withheld |
| Fitness | NOT FIRED | Implementation authority withheld |
| Publish/JSR | NOT FIRED | Empty touched-member denominator; final publish dry-run planned |
| Docs | NOT FIRED | Frozen final gates planned |

## Drift and debt

- Drift: launcher pre-seed; historical doctrine omission already repaired on base. Both recorded.
- Debt: none created, closed, or modified. Existing package debt remains outside scope.

## Commits

- See draft PR #1656 commit list and phase comments; no `commits.md` exists.
