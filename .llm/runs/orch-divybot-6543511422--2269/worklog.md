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

## S2 — honest guidance, issue fixtures and CI documentation repair

Independent supervisor S2 review PASS (supervisor-review-s2.md). Removed unused expected-page
fields from low-confidence fixture cases as suggested. Original-intent IDF coverage is required;
unsupported task qualifiers force low confidence even when an alias activates a known concept.
Lexically supported sections on the strongest page receive bounded context, without changing the
anchor. This repairs the original score-only ownership fixture rather than replacing its answers.

The reviewer explicitly authorized checking only the plugin golden case's TWO specific routes;
its unrelated third fallback is no longer asserted. All 8 cases and adapter/run determinism remain.
The getting-started case now uses its concrete CLI init section. All other expected routes remain.

| Gate | Result |
| --- | --- |
| Full MCP suite + affected CLI/docs/carrier/generator/release consumers | PASS, 303 tests, 0 failed/ignored |
| Focused guidance incl. issue 2269 fixture | PASS, 36 tests |
| Structured MCP check | PASS, 155 selected files, 0 findings |
| Structured MCP lint/format | PASS, 154 selected files, full coverage |
| CLI changed-source format with inherited style rules, no include/exclude | PASS, 1/1 file processed |
| quality:gate durable receipt | PASS, exit 0 |
| MCP doc:lint | PASS, 0 diagnostics |
| docs:exports-drift | PASS (repairs CI build failure) |
| Canonical prose/publish/export corpus/assets generation | PASS; export read used explicit --allow-dirty |

Negative controls: restoring original confidence produced 7 failing issue-intent cases; removing
page-context scoring reproduced the original score-only ownership golden failure. Source restored.
The full 303-test rerun used the regenerated docs reference page and fixed export inventory.

CI build failure on S1 was the missing @netscript/mcp/docs export-reference entry. Added the public
subpath, transport and citation semantics in reference/mcp and regenerated its sole prose row.
Extended the per-entrypoint doc-lint fixture from 3 to 4 entrypoints. Updated the Aspire generated
carrier inventory for its relocation, preserving scan policy and all retained run evidence.

Reconcile S2: PR 2529 is still draft, source commits are ordinary pushes, coordinator owns labels
and merging. No runtime resources, lock churn, force pushes, rebase, merge, tags or release.
Remaining: committed-head carrier freshness, final independent IMPL-EVAL, ready transition, checks
snapshot and review threads. No local scaffold.runtime; no scaffold templates or runtime wiring
were edited. CLI offline docs generation and MCP composition have direct consumer evidence.

## Committed-head verification and independent evaluation

At 1261c03e42626a941d5b60d311f2b8c598fef780:

| Gate | Result |
| --- | --- |
| check:agent-docs-prose (run-gate receipt issue2269-prose) | PASS, exit 0 |
| check:assets-barrel (issue2269-assets) | PASS, exit 0 |
| check:publish-assets (issue2269-publish) | PASS, exit 0 |
| check:mcp-export-corpus (issue2269-exports) | PASS, exit 0 |
| check:aspire-version-parity (issue2269-aspire-parity) | PASS, exit 0 |
| Export corpus generator clean-head tests | PASS, 14 additional tests |
| Public CLI MCP stdio against an empty project | PASS, all 11 acceptance responses cited; see public-cli-acceptance.json |
| check:review-threads | PASS, 0 threads / 0 unanswered |
| Native MCP publish dry-run | PASS; no slow-type diagnostics |
| Static JSR audit | Exit 0; inherited cardinality warnings; its slow-types banner heuristic is not a native warning |
| Independent IMPL-EVAL round 1 | PASS / MERGE 1261c03e42626a941d5b60d311f2b8c598fef780 |

The evaluator independently ran 27 retrieval/guidance/release tests and 7 CLI/carrier parity tests,
all passing. Its report is evaluate.md. CI docs build at this head succeeded; other required checks
remain draft-skipped until ready. The source tree remains clean after freshness generation.

Runtime e2e-cli verdict: NOT NEEDED for this scoped change, independently confirmed. No scaffold
source templates, plugin scaffolding, DB or runtime wiring changed. CLI offline docs and public
MCP composition have direct consumer tests. The owner forbids a local scaffold runtime; none ran.
Coordinator remains the merge owner and may select additional CI gates.

Accepted maintenance debt and its bounded cost are recorded under mcp-tool-contracts-a8-1102;
no runtime debt. Existing static warnings are not suppressed. The new public docs subpath passes
native doc-lint/publish analysis. No lock changes, started application resources, or unknown-owner
cleanup required. Final exact-head verdict and CI snapshot are published in the PR/READY report.
