# OpenHands Summary — 5d6 PLAN phase

## Summary
Created and committed the PLAN-phase deliverables for `@netscript/fresh` sub-gate 5d6 (`./query` + `./server` + final package surface). No implementation was performed. All measurements were reused from the committed run artifacts produced by the prior research run.

## Changes
- **`.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/design.md`** (new)
  - RFC 17 typed island query bridge: server-loader → island-props → client-hook design.
  - Hook wrapper strategy to retire 49 upstream `@tanstack/preact-query`/`@tanstack/react-db` private-type-ref errors.
  - `defineFreshApp` alpha-surface seams (`createApp`, `staticFiles`, `fsRoutes`, `preConfigure`, `telemetry`).
  - RFC 14 seam audit conclusions and scope boundary.
  - F-16 entrypoint lock, root barrel policy, private-type-ref retirement map.
  - Risk register and six supervisor questions.

- **`.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/plan.md`** (new)
  - Proposed 30-slice commit lock.
  - Full Archetype 3 gate matrix with N/A rationale and slice mappings.
  - MEASURE-FIRST table reused from `doc-lint-aggregate.json` and `dry-run.log`.
  - Required tail sections: Review map, Assumptions, Questions for supervisor, Dependencies & merge impact, Side-effect ledger.

- **`.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/drift.md`**
  - Added `D-5d6-7` entry recording PLAN-phase completion and readiness for PLAN-EVAL.

- **`.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/commits.md`**
  - Recorded commit hashes.

## Validation
- No code changes; no `deno check`, `deno doc --lint`, or `deno publish --dry-run` was re-run.
- Plan artifacts were committed successfully.

## Artifact paths + commit hashes
| Artifact | Path | Commit |
|---|---|---|
| design.md | `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/design.md` | `1bdd141` |
| plan.md | `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/plan.md` | `1bdd141` |
| drift.md | `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/drift.md` | `1bdd141` |
| commits.md | `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/commits.md` | `bcc1cc1` |

## MEASURE-FIRST table (reused from committed artifacts)
| Entrypoint | Total errors | privateTypeRef | missingJSDoc | Other |
|---|---|---:|---:|---:|
| `./query/mod.ts` | 88 | 64 | 23 | 1 |
| `./form/mod.ts` | 74 | 11 | 60 | 3 |
| `./defer/mod.ts` | 60 | 14 | 46 | 0 |
| `./builders/mod.ts` | 40 | 21 | 19 | 0 |
| `./streams/mod.ts` | 32 | 24 | 8 | 0 |
| `./mod.ts` | 23 | 15 | 8 | 0 |
| `./server.ts` | 13 | 8 | 5 | 0 |
| `./config/vite.ts` | 20 | 3 | 17 | 0 |
| `./route/mod.ts` | 0 | 0 | 0 | 0 |
| `./error/mod.ts` | 0 | 0 | 0 | 0 |
| `./utils/mod.ts` | 0 | 0 | 0 | 0 |
| `./interactive.ts` | 0 | 0 | 0 | 0 |
| **Deduplicated total** | **276** | **115** | **157** | **4** |
| **Dry-run package** | **62** | — | — | — |

Target after all slices: **0** doc-lint errors, **0** dry-run errors.

## Slice count
30 proposed commit slices (Phase A: 1–5, Phase B: 6–9, Phase C: 10–15, Phase D: 16–30).

## Gate-to-slice map (high-level)
- F-1, F-11, F-16: slices 5, 11, 12, 14, 21, 27
- F-2, F-3, F-9: slices 1, 10, 14, 19, 25
- F-4, F-17: slices 6, 8, 15, 25
- F-5, F-16, F-18: slices 2, 6, 9, 11, 12, 13, 16, 22
- F-6, F-7, F-8, F-15: slices 2, 3, 4, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 24, 29
- F-10, F-14: slices 4, 7, 20, 23, 28
- Runtime/Aspire/browser/consumer-import: slices 7, 14, 21, 28, 30

## Top decisions / risks
1. Replace raw upstream hook re-exports with package-owned wrappers to clear 49 private-type-refs.
2. Keep RFC 17 recommended path as `initialData`; dehydration helpers remain an advanced opt-in.
3. Add backward-compatible `defineFreshApp` seams for future RFC 14 adapter without breaking existing callers.
4. Lift `packages/fresh` from root workspace `exclude` in closeout slice; budget for one-time root fmt/lint/check pass.
5. Open questions for supervisor remain in `design.md` §5 (hook aliases, dehydration scope, SSE surface, `createQueryFactories` helper, telemetry schema).

## Remaining risks
- Supervisor may rescope hook re-export policy or dehydration components.
- Root workspace exclusion lift may surface unexpected legacy fmt/lint debt.
- Cross-cluster private-type-ref fixes depend on prior 5d1–5d5 landings matching assumptions.

READY FOR PLAN-EVAL
