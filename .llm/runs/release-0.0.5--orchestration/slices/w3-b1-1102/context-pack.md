# Context Pack: #1102 intent-aware capability discovery

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `release-0.0.5--orchestration/slices/w3-b1-1102` |
| Branch         | `feat/mcp-intent-activation-s4-s5`               |
| Current phase  | `impl`                                           |
| Archetype      | `6 — CLI / Tooling`                              |
| Scope overlays | `docs`                                           |

## Current State

The separate Claude · Fable 5 continuation PLAN-EVAL passed at `71c0a29c2`. S4A retrieval closure
and S4B activation are implemented and green. The real no-AppHost public CLI path now runs
`agent init --with-docs`, installs activation guidance, starts MCP against `.netscript/docs`, and
returns rank-1 `llms#task-router`. The original five rows / 15 citations and 12-document
253,535-byte corpus remain unchanged.

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
- Reproduced the stale installed-corpus assertion as a focused pre-fix failure, corrected it to the
  exact ordered three-document registry, and ran the mandated CLI pair green at raw exit 0 with
  20 passed / 0 failed.
- Recorded that the locked fixtures prove curated `routeHints`, corpus membership, citations, and
  adapter parity but do not constrain BM25 scoring; recorded the getting-started gap and partial
  acceptance-row-3 paraphrase without tuning the locked evaluation.
- Recorded `tool-contracts.ts` growth from the evaluator's 301-line baseline to 367 lines as
  accepted A8 debt with a package follow-up and closure gate.

## In Progress

- S4B is ready to commit/push/comment after the exact CLI pair passed 20/20, the combined activation
  group passed 21/21, scoped 135-file gates passed, and generated skills reproduced. S5 public docs
  and full non-Aspire evidence are next.

## Next Steps

1. Commit/push/comment S5 with all non-Aspire evidence and the durable `EXPENSIVE-GATE-REQUEST`.
2. Stop until the orchestrator commits a serialized runtime-token grant. Then run the exact
   one-pass scaffold runtime command bracketed by leak checks; do not run a focused substitute.

## Key Decisions

| Decision                                             | Source                                | Notes                                                        |
| ---------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `find_guidance`, deterministic hybrid, no embeddings | `plan.md` D1/D4                       | Offline, bounded, falsifiable                                |
| One shared index for filesystem and embedded         | `plan.md` D7                          | No second #1375 path                                         |
| Preserve canonical corpus + extend expected JSON     | `research.md` F15–F18; `plan.md` D13–D15 | Zero corpus-byte change; three additive evaluation rows      |
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
The latest repaired-source regeneration records `eda49bb2e`, 4,685,958 uncompressed /
1,332,143 compressed bytes for the full corpus, and 253,535 bytes / 12 documents for the plaintext
MCP fallback. The selection is unchanged and the chat tutorial's version-less descriptor is not in
the plaintext embed.

## Gates

| Gate family | Current status             | Evidence                                                        |
| ----------- | -------------------------- | --------------------------------------------------------------- |
| Static      | PASS through S5             | 134 MCP tests; CLI pair 20/20; JSR failures=0; scoped gates green |
| Fitness     | Known pre-existing failure | doctrine exit 1 only for #1403 baseline; no new warning remains  |
| Runtime     | TOKEN_REQUESTED            | no AppHost/container started; awaiting durable grant              |
| Consumer    | PASS for D12 paths         | embedded, materialized filesystem, and installed-corpus stdio    |

## Open Questions

- No implementation decision remains open. The serialized runtime verdict and separate-session
  IMPL-EVAL remain owner-controlled. Any change to locked rows, cap, selection, or ranking constants
  still requires recorded drift and evaluator approval.

## Drift and Debt

- Drift: #1375's bounded fallback omits four required destination families and its canonical prose
  predates the unsupported-driver section. S3 refreshes and selects through its existing approved
  generator-owned chain; no second corpus path is introduced.
- Debt: `packages/mcp/src/domain/tool-contracts.ts` deepened the existing A8 file-size warning from
  the evaluator's 301-line baseline to 367 lines. The canonical registry accepts this for #1404
  and requires a role-named contract split before the next MCP public-tool expansion.

## Commits

- `c0bdb02c3` — plan/research/design artifacts; draft PR #1404 carries RESEARCH and PLAN phase
  comments.
- `59ac3b9b2` — opening plan-eval handoff state.
- `271428de5` — cycle-1 PLAN-EVAL repair: D12, dual-adapter/installed-corpus gates, reproducible F4
  sweep, and unordered Prisma top-three constraint.
- `b9692f93d` — merge current `main@3ce91f2c2` before authorized implementation.
- `ec5c7446a` — S1 public contract, enumerable flow shell, activation text, and planned docs changes.
- `26176a608` — S2 shared intent ranker, citations/link routing, and D12 filesystem policy.
- `5e3b58b67` — record the canonical-corpus source blocker without a workaround.
- `fd9267906` — S3 canonical corpus refresh, bounded embedded selection, and locked dual-adapter evaluation.
- `99d753e0a` — S4A retrieval gaps, additive evaluation rows, and score-mutation discriminator.
- `5414bf5b9` — S4B activation across MCP/generated guidance/skills and real installed-corpus stdio.
- S5 commit — public docs, generated README asset, all non-Aspire close gates, token request.
