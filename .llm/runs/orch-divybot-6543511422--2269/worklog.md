# Worklog

## Design

1. Public surface: @netscript/mcp/docs exposes the one full compressed documentation corpus and
   its verified decoder/composition functions. Existing MCP tools gain deterministic slug aliases
   and a release citation; CLI offline docs preserve decoded content.
2. Vocabulary: AgentDocsPage (path, gzip, SHA-256, size); corpus citation (framework version,
   content hash); canonical page slug (pages/...); confidence (high/medium/low).
3. Ports: existing DocsCorpusPort, no new IO port. Web CompressionStream/crypto only for transport.
4. Constants: canonical carrier path; generated framework version; existing confidence policy gains
   named coverage thresholds if required. No second document selection list.
5. Commit slices: ordered in plan.md, each updates this file and context-pack.md. Bootstrap first.
6. Deferred: runtime/scaffold changes, remote loading, undocumented APIs, release cuts.
7. Contributor path: .llm/tools/docs/generated-carriers.md explains adding a page and refreshing
   consumers. Guidance ranking policy and issue fixture identify intent extension points.

## Bootstrap

Matrix resolved; owner evaluator override recorded in supervisor.md. Working tree was clean.
RTK absent. Issue acceptance and comments read; no duplicate PR. Local MCP research completed.

PLAN-EVAL round 1: FAIL_PLAN (undocumented API search needed explicit fallback contract).
Plan repaired before code; every zero-match search has explicit low confidence, no-seam fallback
and version citation. Round 2 resumes the same reviewer.

## S1 — shared full corpus, canonical lookup and citations

Independent supervisor review: PASS (supervisor-review-s1.md). Its lazy-load and substring-admission
findings were repaired before commit. The small metadata carrier stores a fixed independently
generated digest; no full corpus decompression occurs on non-docs import.

| Gate | Result |
| --- | --- |
| Structured MCP check (154 selected source files) | PASS, 0 findings |
| Structured MCP lint (153 selected files) | PASS, 0 findings |
| Scoped source format | Applied; checked again at final gate |
| Structured S1 test set (published page walk, release source, docs, generator, release fixture, parity) | PASS, 76 tests |
| CLI offline docs/command/transport/release consumer tests | CLI/transport passed; moved release fixture mkdir corrected, covered by 76-test rerun |
| quality:gate via durable run-gate receipt | PASS, exit 0 |
| MCP doc:lint | PASS, 0 diagnostics across 4 entrypoints |
| MCP publish:dry-run | PASS, no slow types |

Negative controls: restoring the curated corpus made page walk and issue slug fixtures fail;
removing alias candidates made both walk and six-slug tests fail; restoring pre-fix search flow
made explicit no-seam fallback and cited search tests fail. Source restored after each experiment.
Full structured reports are retained outside Git; no private execution metadata is committed.

Known S2 work: historical full-corpus guidance expectations and confidence need repair. The new
getting-started expectation is reviewer-approved; the plugin third-result change was rejected and
reverted. S2 must preserve two correct plugin routes and repair score-only ranking.

Reconcile S1: issue 2269 remains open, PR 2529 remains draft, no labels/milestones changed;
no new issue comments alter scope. The carrier relocation requires coordinated consumer/generator
path edits (more than the target file count); no unrelated source changes or lock churn.
