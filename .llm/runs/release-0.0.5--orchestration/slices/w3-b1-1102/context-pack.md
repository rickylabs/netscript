# Context Pack: #1102 intent-aware capability discovery

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `release-0.0.5--orchestration/slices/w3-b1-1102` |
| Branch         | `fix/mcp-intent-aware-discovery`                 |
| Current phase  | `plan-eval`                                      |
| Archetype      | `6 — CLI / Tooling`                              |
| Scope overlays | `docs`                                           |

## Current State

Research and contract-first design are complete at baseline `3f41a3639`. The plan introduces a 22nd
MCP tool, `find_guidance`, over one shared deterministic section index; it extends rather than
duplicates #1375's generated fallback. PLAN-EVAL cycle 1 returned `FAIL_PLAN`; its M1 and two minor
findings are repaired in plan artifacts only. No product source has been changed. Implementation is
blocked pending a fresh cycle-2 Claude · Fable 5 PLAN-EVAL `PASS`.

## Completed

- Read requested skills and harness/doctrine/gate references.
- Read live issue #1102 and quoted all seven acceptance rows into research/plan.
- Opened every source behind the retrieval, corpus, activation, generated guidance, and gate claims.
- Recorded current top-five results for the issue intents.
- Ran current `@netscript/mcp` JSR audit, full-export doc-lint, and package publish dry-run.
- Locked public vocabulary, bounds, algorithm family, 12 exact-ordered citations plus the Prisma
  unordered top-three set, corpus refresh/selection strategy, five commit slices, test pre-fix
  failure modes, and package-scoped validation.
- Repaired cycle-1 M1 with D12: filesystem admits only root `llms.txt`, both adapter inputs
  canonicalize it to `llms`, and dual-adapter plus installed-corpus gates exercise the task-router
  row.
- Checked in and executed the exact production-corpus pre-fix query sweep.

## In Progress

- Stopped at draft PR #1404 with `status:plan-eval`; awaiting fresh orchestrator-launched PLAN-EVAL
  cycle 2.

## Next Steps

1. Orchestrator launches a fresh Claude · Fable 5 · medium PLAN-EVAL cycle 2.
2. If and only if `plan-eval.md` says `PASS`, move status to `impl` and implement S1.
3. Commit/push/comment each slice independently; request the serialized gate only after non-Aspire
   gates are green.

## Key Decisions

| Decision                                             | Source                                | Notes                                                        |
| ---------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `find_guidance`, deterministic hybrid, no embeddings | `plan.md` D1/D4                       | Offline, bounded, falsifiable                                |
| One shared index for filesystem and embedded         | `plan.md` D7                          | No second #1375 path                                         |
| Approved canonical corpus refresh + expected JSON    | `research.md` F5/F12; `plan.md` D8/D9 | Current mirror is stale; reuse #1375's one generator path    |
| Root `llms.txt` parity across real deployment paths  | `research.md` F14; `plan.md` D12      | Explicit source policy + dual-adapter/installed-corpus gates |
| Adoption belongs only to #1090                       | issue #1102 row 7 / brief             | Never claim usage from top-k tests                           |

## Files Changed

Only this run directory is changed in the plan phase. Product paths listed in `plan.md` remain
untouched until PLAN-EVAL PASS.

## Gates

| Gate family | Current status             | Evidence                                                        |
| ----------- | -------------------------- | --------------------------------------------------------------- |
| Static      | NOT_RUN for implementation | plan phase only                                                 |
| Fitness     | Baseline audit complete    | research F10; implementation package gates pending              |
| Runtime     | NOT_RUN                    | no implementation; no AppHost/container started                 |
| Consumer    | NOT_RUN                    | planned installed-corpus CLI stdio + generated-agent assertions |

## Open Questions

- PLAN-EVAL cycle 2 must approve or reject D12, the 12 exact-ordered citations plus Prisma's
  unordered top-three set, numeric policy/bounds, and canonical prose-refresh scope. None remains
  open for the implementation supervisor.

## Drift and Debt

- Drift: #1375's bounded fallback omits four required destination families and its canonical prose
  predates the unsupported-driver section. S3 refreshes and selects through its existing approved
  generator-owned chain; no second corpus path is introduced.
- Debt: none created; existing cardinality/slow-type warnings remain explicit baseline findings.

## Commits

- `c0bdb02c3` — plan/research/design artifacts; draft PR #1404 carries RESEARCH and PLAN phase
  comments.
