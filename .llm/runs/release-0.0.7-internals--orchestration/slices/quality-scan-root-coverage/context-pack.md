# Context Pack: quality-scan-root-coverage

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage` |
| Branch | `fix/quality-scan-root-coverage` |
| Current phase | `impl` — slice 3 awaiting Tier-A |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service`, `docs` |
| Draft PR | `#1656` |
| Thread | `01a003d2-61ee-7ec0-8c74-075b3d631168` |

## Current state

All three planned implementation slices are landed. S1 and S2 have topic-supervisor Tier-A
sign-offs. S3 recorded the full frozen gate set, raw Git implementation-surface review, explicit
empty-denominator JSR audit, and DoD evidence audit at signed-off S2 head
`4ae309d5774676d710ba24f56119b028bc2c095c`. Work stops for S3 Tier-A before formal IMPL-EVAL.

## Landed behavior

- Checker derives 37 workspace members, 37 inside the named `packages/**`/`plugins/**` boundary,
  and 35 publishable members.
- `packages/bench` and `packages/cli/e2e` remain named `publish:false` exclusions.
- Both quality tasks and the 36-root doctrine set cover every publishable member.
- `quality:scan` traverses `packages`, `plugins`, and `docs/site`; repo scan retains five roots.
- Changed-file PR mode still executes the checker, then forwards changed-file arguments only to the
  scanner, whose output distinguishes actual traversal from configured roots.
- Permanent fixtures fail on omitted members even though the live repository is green.

## Exact implementation surface

| Path | Final status |
| --- | --- |
| `.llm/tools/quality/check-root-coverage.ts` | fail-closed deterministic checker |
| `.llm/tools/quality/check-root-coverage_test.ts` | nine semantic/live/CLI/forwarding tests |
| `deno.json` | checker-first tasks and broad package root |

No package/plugin, workflow, scanner, doctrine tool, gate catalog, docs source, dependency, or
lockfile changed.

## Final S3 gates

| Gate | Status | Receipt |
| --- | --- | --- |
| check | PASS 0 | `receipts/slice-3/check.json` |
| full test | PASS 0; 4,128 passed / 19 ignored | `receipts/slice-3/test.json` |
| quality job | PASS 0 | `receipts/slice-3/quality-job.json` |
| publish dry run | PASS 0 | `receipts/slice-3/publish-dry-run.json` |
| quality gate | PASS 0 | `receipts/slice-3/quality-gate.json` |
| docs source format | PASS 0 from `docs/site` | `receipts/slice-3/docs-source-format-docs-cwd.json` |
| docs source-format test | PASS 0; 6/6 | `receipts/slice-3/docs-source-format-test.json` |
| docs accuracy | PASS 0 | `receipts/slice-3/docs-accuracy.json` |

`receipts/slice-3/docs-source-format.json` truthfully records the preceding wrong-root-cwd attempt
as exit 1; it is not treated as a green gate.

## JSR audit

Applicable with an explicit touched-publishable-member denominator of **0**. Git diff from immutable
base contains no `packages/**` or `plugins/**` path, so per-member export/pin/runtime-asset/
`import.meta` rows are empty and the plan's rescope tripwire did not fire. The canonical workspace
isolated-declaration publish dry run passes. Both lockfiles remain unchanged.

## Definition of Done handoff

- Ready to tick after coordinator review: root coverage/exclusions; omission failure invariant;
  scanned-root reporting; frozen evidence set; JSR row with explicit empty-denominator record.
- Not ready to tick: combined PLAN-EVAL/IMPL-EVAL row. PLAN-EVAL passed, but formal IMPL-EVAL has not
  been authorized or run.
- The implementation thread did not mutate the PR body or any checkbox.

## Next steps

1. Topic supervisor performs S3 Tier-A review.
2. Coordinator decides whether to grant formal separate-session IMPL-EVAL.
3. Only after IMPL-EVAL PASS may the coordinator update DoD boxes/status/readiness.

## S3 evidence head

- Gate-attested head: `4ae309d5774676d710ba24f56119b028bc2c095c`.
- Final S3 run-artifact commit follows.
