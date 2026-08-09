# Context Pack: #1102 intent-aware capability discovery

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `release-0.0.5--orchestration/slices/w3-b1-1102` |
| Branch         | `fix/mcp-intent-aware-discovery`                 |
| Current phase  | `impl`                                           |
| Archetype      | `6 — CLI / Tooling`                              |
| Scope overlays | `docs`                                           |

## Current State

Research and contract-first design are complete. A separate Claude · Fable 5 PLAN-EVAL cycle 2
returned `PASS`, authorizing implementation. The branch incorporated `main@3ce91f2c2` at
`b9692f93d`; the recovered worktree was clean there. S1 now adds the 22nd read-only MCP contract,
`find_guidance`, its bounded flow shell, vertical docs folders, count-synchronized public surfaces,
and focused red-to-green tests. S2 adds the one shared section parser/index/ranker, concept aliases,
fenced/Vento code citations, direct internal-link routing, corpus composition, and D12 filesystem
source admission. S3 now refreshes the canonical release corpus at repaired `main@399f60185`,
selects the bounded intent destinations, and proves the locked evaluation through embedded and
materialized-filesystem adapters.

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
- Received PLAN-EVAL cycle 2 `PASS`; moved issue #1102 and PR #1404 to exactly `status:impl`.
- Proved S1 with 28 focused MCP tests, 20 CLI/init tests, a 108-file scoped MCP check, scoped lint
  and format, and publish-asset freshness, all at raw exit 0.
- Proved S2 with all 131 MCP package tests, 29 focused retrieval/source-policy tests, a 114-file
  scoped check/lint/fmt, and zero explicit package-source quality findings. The explicit doctrine
  gate still exits 1 only for the recorded pre-existing #1403 findings; the new 410-line warning
  seen during development was removed by splitting parser/ranker/result roles below 300 lines.
- Rebased without a merge onto `main@399f60185`; rebuilt the canonical corpus from a fresh exact
  checkout/output with truthful provenance and confirmed the formerly missing Prisma sections.
- Proved all five locked S3 rows repeatably and byte-equally across generated embedded and
  materialized filesystem adapters; the full MCP suite is 132/132 green.

## In Progress

- S1 and S2 are committed/pushed/commented. S3 implementation and gates are complete pending its
  commit/push/PR comment.

## Next Steps

1. Commit/push/comment S3 with its exact corpus/gate evidence.
2. Stop for orchestrator-owned separate-session IMPL-EVAL/CI; do not start an Aspire/runtime suite
   without a durable token grant.

## Key Decisions

| Decision                                             | Source                                | Notes                                                        |
| ---------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `find_guidance`, deterministic hybrid, no embeddings | `plan.md` D1/D4                       | Offline, bounded, falsifiable                                |
| One shared index for filesystem and embedded         | `plan.md` D7                          | No second #1375 path                                         |
| Approved canonical corpus refresh + expected JSON    | `research.md` F5/F12; `plan.md` D8/D9 | Current mirror is stale; reuse #1375's one generator path    |
| Root `llms.txt` parity across real deployment paths  | `research.md` F14; `plan.md` D12      | Explicit source policy + dual-adapter/installed-corpus gates |
| Adoption belongs only to #1090                       | issue #1102 row 7 / brief             | Never claim usage from top-k tests                           |

## Files Changed

S1 changes the public contract and count surfaces. S2 changes the shared docs port and both adapters,
adds the pure parser/ranker/result policy and focused tests, composes `find_guidance` into the CLI,
and intentionally adds root `llms.txt` to filesystem `search_docs`, `list_docs`, `get_doc`, and
`find_guidance`. Consequently `list_docs.corpus.documentCount` increases by one when that file is
present; `llms-full.txt` and nested/arbitrary text files remain excluded.
S3 adds the checked-in evaluation, refreshed canonical prose/provenance, 12-document bounded MCP
fallback, and its generated MCP/CLI assets. Eight issue-required pages are added; the generic
quickstart fallback page is removed to keep current repaired sources below the immutable 256 KiB
cap without changing any locked citation.

## Gates

| Gate family | Current status             | Evidence                                                        |
| ----------- | -------------------------- | --------------------------------------------------------------- |
| Static      | PASS through S2            | 131 package tests; scoped check/lint/fmt; source quality exit 0   |
| Fitness     | Known pre-existing failure | doctrine exit 1 only for #1403 baseline; no new warning remains  |
| Runtime     | NOT_RUN                    | no implementation; no AppHost/container started                 |
| Consumer    | Partial PASS               | D12 adapter parity passes; installed-corpus stdio remains S4     |

## Open Questions

- No product decision remains open. Locked D12, the 12 exact-ordered citations plus Prisma's
  unordered top-three set, numeric policy/bounds, and canonical prose-refresh scope may change only
  through recorded drift and evaluator approval.

## Drift and Debt

- Drift: #1375's bounded fallback omits four required destination families and its canonical prose
  predates the unsupported-driver section. S3 refreshes and selects through its existing approved
  generator-owned chain; no second corpus path is introduced.
- Debt: none created; existing cardinality/slow-type warnings remain explicit baseline findings.

## Commits

- `c0bdb02c3` — plan/research/design artifacts; draft PR #1404 carries RESEARCH and PLAN phase
  comments.
- `59ac3b9b2` — opening plan-eval handoff state.
- `271428de5` — cycle-1 PLAN-EVAL repair: D12, dual-adapter/installed-corpus gates, reproducible F4
  sweep, and unordered Prisma top-three constraint.
- `b9692f93d` — merge current `main@3ce91f2c2` before authorized implementation.
