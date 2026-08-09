# Context Pack: #1356 UI app-root resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/cli-1356` |
| Branch | `fix/ui-commands-resolve-app-root` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

S1 implementation is complete on the Tier-D branch based at `origin/main@1395f3989`.
`PLAN-EVAL: N/A` was recorded before product edits. IMPL-EVAL passed at `3f7d954bd` and both
serialized runtime gates are owner-reported green. A narrow CI-only ANSI assertion repair is being
amended for re-evaluation scope/CI; the draft PR remains #1422.

## Completed

- Shared application resolver implements explicit app path, named app, current-app inference,
  sole-app inference, and deterministic ambiguity errors.
- All five UI commands use it and document `--app`; `UiAddCommandInput` now matches its action.
- Corrected E2E gate rejects workspace-root fixtures, runs every assertion in the Fresh app, and
  keeps both local-source paths workspace-relative.
- Pre-fix REDs, 36 focused green tests, five real help probes, scoped wrappers, quality scan, and
  aggregate doctrine gate are recorded in `worklog.md`.
- CI color variance is normalized before the unchanged exact `--app <name>` assertion; a
  missing-option scratch mutation proves the detector still fails.

## In Progress

- Amend/push the ANSI-only test repair and hand back for owner re-evaluation scope/CI.

## Next Steps

1. Amend S1 and guarded-force-push with the explicit refspec.
2. Post the colorized green and missing-option RED evidence.
3. Stop for owner-controlled re-evaluation scope, CI, and merge.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| PLAN-EVAL N/A | run-loop §4 | Mechanical, no open decision. |
| Shared kernel application resolver | doctrine A6/A8/AP-25 | Existing `FileSystemPort`; no new port/base. |
| App precedence and ambiguity | live issue #1356 | Explicit, current app, single app, otherwise error. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/cli/src/kernel/application/ui/resolve-ui-app-root.ts` | new | shared app selection policy |
| `packages/cli/src/public/features/{root,ui}/**` | changed | resolver composition + five command surfaces |
| `packages/cli/e2e/src/application/gates/scaffold/ui-ai-gates.ts` | changed | app-targeted standing gate |
| owned focused tests | new/changed | behavioral and old-layout controls |
| this run directory | changed | evidence and handoff |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | scoped check/lint/fmt: 829 files, 0 findings, raw exits 0 |
| Fitness | PASS required aggregates | quality scan + arch check exits 0; extra CLI diagnostic exposes pre-existing global debt |
| Runtime | N/A locally | serialized token not granted |
| Consumer | PASS focused | 36 tests; real help/process probes; corrected gate old-layout negative |

## Open Questions

- Owner/CI must provide the full runtime acceptance row before merge.

## Drift and Debt

- Drift: Tier-D runtime identity was not registered; recorded in `supervisor.md` and `drift.md`.
- Debt: pre-existing CLI Restructure diagnostic remains `FAIL=50 WARN=51 INFO=1`; no new finding.

## Commits

- `bad81a011` — S0 harness contract.
- S1 final commit — see PR #1422 after push.
