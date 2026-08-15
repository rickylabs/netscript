# Context Pack: quality-scan-root-coverage

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage` |
| Branch | `fix/quality-scan-root-coverage` |
| Current phase | `impl` — slice 1 awaiting Tier-A |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service`, `docs` |
| Draft PR | `#1656` |
| Thread | `01a003d2-61ee-7ec0-8c74-075b3d631168` |

## Current state

PLAN-EVAL cycle 1 passed at `3b95a004fe8bc5c022c7a2601fafef9a1216be68` against immutable plan
`da76d9d8440a969f0715ca035ea6304bbf039efd`. Slice 1 is implemented with durable RED/GREEN
evidence. Work stops for Tier-A before the `deno.json` binding slice.

## Completed

- Verified the evaluator head and the byte-identical approved plan; did not rebase.
- Committed the S1 RED contract at `2c9aa89c0` and checker implementation at `22e35f4be`.
- Added deterministic, fail-closed JSON for workspace census, named exclusions, configured-root
  coverage, doctrine subset coverage, traversal disclosure, and errors.
- Added nine tests for omission failure, ancestry direction, future broad-root coverage,
  exclusions/boundary, deterministic ordering, malformed configuration, the locked live census,
  structured CLI failure, and real `deno task` trailing-argument forwarding.
- Kept `deno.json`, package/plugin sources, exports, dependencies, and lockfiles unchanged.

## Key findings preserved

- Published package/plugin denominator: 35 of 37 in-boundary workspace members. Non-published
  declarations: `packages/bench` and `packages/cli/e2e`.
- Current `quality:scan` still omits 29 package members until S2; `quality:scan:repo` omits zero.
- `arch:check` dynamically exposes 36 doctrine roots and covers all 35 publishable denominator
  members.
- Scanner output owns actual mode/scanned paths. The checker separately reports configured roots
  and explicitly says it did not observe traversal.
- Parent-directory denominator boundary is named as `packages/**` + `plugins/**`; excluded workspace
  member count and paths remain visible (currently zero).

## Exact edit surface status

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tools/quality/check-root-coverage.ts` | S1 implemented | Fail-closed configured-root/doctrine coverage report. |
| `.llm/tools/quality/check-root-coverage_test.ts` | S1 implemented | Nine semantic, live-invariant, and CLI-forwarding tests. |
| `deno.json` | S2 pending | Broad `packages` root and checker binding in both scan tasks. |

Everything else in the frozen outer bound remains deliberately untouched.

## Next steps

1. Topic supervisor performs Tier-A review of S1 and its receipts.
2. Only after a fresh resume, edit `deno.json` in S2 and prove both task bindings.
3. Run the frozen final gate set in S3, then stop before coordinator-granted IMPL-EVAL.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan-Gate | PASS cycle 1 | `plan-eval.md`, evaluator commit `3b95a004f` |
| S1 focused test | RED 1, GREEN 0 | `receipts/slice-1/red-test.json`, `test.json` |
| S1 static | check 0; lint 0; fmt 0 | `receipts/slice-1/{check,lint,fmt-check}.json` |
| Publish/JSR | Empty touched-member denominator | S1 touches internal `.llm` files only; final dry run planned |
| Docs | NOT FIRED | Frozen final gates planned for S3 |

## Drift and debt

- Drift: launcher pre-seed; historical doctrine omission already repaired on base; failed Fable
  launch and amended native evaluator route. All are recorded in `drift.md`.
- Debt: none created, closed, or modified. Existing package debt remains outside scope.

## Commits

- `2c9aa89c0` — S1 RED contract test.
- `22e35f4be` — S1 checker implementation plus durable RED receipt.
- Final S1 evidence/run-artifact commit follows after terminal receipts.
