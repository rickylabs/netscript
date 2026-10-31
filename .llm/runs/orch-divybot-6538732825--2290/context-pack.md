# Context pack

Issue #2290 (0.0.9 D1); PR https://github.com/rickylabs/netscript/pull/2492.
Branch orch/divybot-6538732825; base 6b7f152f6ac2bbdddcd5f4eb896b3d9f8aaf2db4.
Bootstrap commit 7d27bf03c53f6a7d705798ea38274ec1db226700; implementation passed independent
slice review before sign-off commit. PLAN-EVAL cycle 1 requested better gate/surface coverage;
cycle 2 PASS before implementation (same plan reviewer session).

Implemented public constants/type, optional AuthzDecision.code, retiredPaths option and resolver
marker, exact compiled retired-path set, middleware 404/410 mapping, docs and regression tests.
Auth suite 231 passed. Existing scopes/roles, active/public/raw/internal route precedence and
anonymous refusal retained. Negative control reverted only authorizer+middleware: both selected
new regression tests failed with 403 versus 404/410; restored byte-for-byte.

Structured check/lint/fmt, doc tests and plugin consumer (11), quality:gate, full-export doc lint,
JSR audit, member publish:dry-run, prod install, exports drift and snippet checks pass. README
compilation gate passes its existing ratchet (5 unrelated baseline errors across 4 READMEs).
Restored full service test suite passed 642 results, zero failures and zero ignored. Independent IMPL-EVAL round 1 PASS with no blockers; its evidence/documentation notes were
reconciled without changing source behavior. See evaluate.md. No local scaffold.runtime launched.


## Current CI correction

Owner reported quality FAILURE. Current job 124439860756 on 4d1ebfb fails agent-docs prose
freshness. The earlier review's main-only regeneration assumption was incorrect. Refreshed native
agent-docs, export corpus, assets barrel and publish assets. Only two generated files changed:
CLI agent-docs-prose (two updated pages out of 202) and MCP export corpus (service root/auth
plus plugin/service's re-exported AuthzDecision documentation). No auth runtime or tests changed. The reported test-4 failure consists of two generator
tests requiring a fresh committed MCP corpus; the same refresh addresses both.

Freshness receipts and member dry runs passed. Independent same-session slice review round 3
PASS. Next: commit and push with run record, verify assets-barrel and the two failing clone-based generator tests against the clean committed tree, then same-session final
review at the pushed head and inspect current CI. No local scaffold.runtime, labels or milestones.
Canonical revised report uses the excluded atomic handoff; coordinator retains merge authority.

## Latest maintenance state

Rebase onto main 8902e1a58eb308bd69e3086ba3520d339207147d is resolving the final generated
commit. Auth source/tests are byte-identical to the approved pre-rebase branch. Generated docs
and export metadata refreshed natively. Owner explicitly authorized a force-push; use an exact
force-with-lease against 3691cc4f2069afc228462e7f73d9805d3e841fa6. After rebase, validate
service auth and generated freshness/clone regressions, push, and use the same independent
review session for the new exact head. No merge, labels, local scaffold runtime or release.
