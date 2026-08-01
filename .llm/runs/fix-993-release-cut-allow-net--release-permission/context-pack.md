# Context Pack: release-cut permission diagnosis

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-993-release-cut-allow-net--release-permission` |
| Branch | `fix/993-release-cut-allow-net` |
| Current phase | `implement` |
| Archetype | `6 - CLI / Tooling` analogue |
| Scope overlays | none |

## Current State

The implementation is complete and scoped gates pass, with one documented command-surface caveat: the literal raw lint command finds no files because root config excludes `.llm/`, while the supplemental `--no-config` lint passes both targets. The live probes distinguish missing permission from valid authentication exactly as required.

## Completed

- Skill/harness bootstrap and required reference reads.
- Worktree/baseline verification.
- Task, endpoint, error-shape, consumer, and live-token reproduction research.
- Locked two-slice plan and Design checkpoint, then corrected D1/D3 from the independent PLAN-EVAL findings.
- Added the host-scoped task permission, truthful fail-fast classification, pure rendering helpers, and hermetic regression tests.
- Ran requested check/test/task evidence, supplemental focused lint, and both live acceptance probes.

## In Progress

- Independent substantive slice review passed with no implementation findings; raw-lint exclusion is recorded alongside the passing authoritative wrapper.

## Next Steps

1. Create the sign-off commit, push with the explicit refspec, and post slice evidence.
2. Run separate-session IMPL-EVAL and finalize PR evidence/labels.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Rethrow only `Deno.errors.NotCapable` with the missing flag named. | `plan.md` D1 | Keeps genuine HTTP auth failures on the existing null/401 path. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-993-release-cut-allow-net--release-permission/*` | new | harness bootstrap, research, plan, design, resumable state |
| `deno.json` | changed | `release:cut` grants `--allow-net=api.github.com` |
| `.llm/tools/agentic/lib/agentic-lib.ts` | changed | narrowed capability classification and pure diagnostics |
| `.llm/tools/agentic/lib/agentic-lib_test.ts` | changed | hermetic permission/auth regression tests |
| `.llm/tools/release/cut.ts` | changed | pure operator-facing failure-line formatter |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | pass with documented raw-lint exclusion | check/tests pass; supplemental focused lint checks 2 files |
| Fitness | pass | independent focused review; no findings |
| Runtime | pass | missing-permission line and exact-flags `rickylabs` probes |
| Consumer | pass | scoped `.llm/tools` check |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments after the bootstrap commit is pushed.
