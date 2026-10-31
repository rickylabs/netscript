# Resume issue 2396

Start from research.md and plan.md in this directory. Own existing PR branches only.
Baseline main: 6a71cd0599673d70cd6311de3bb20b2d6a9dde2c.
Order: 2422 service, 2423 reader headers, 2421 final host integration. No product edits yet.
Next: independent owner-selected PLAN-EVAL, then merge main and run each slice's gates.
Preserve historical evidence and locks. No labels/milestones/merge/release/local runtime E2E.
Native MCP and shared memory were consulted. RTK absent; shallow clone required explicit
branch refspecs and deepening. Final canonical issue report uses the assignment file handoff.

PLAN-EVAL round 1 returned FAIL_PLAN. Four plan-only fixes are recorded in plan.md,
supervisor.md and drift.md. Round 2 must PASS before product edits. Exact new integration,
legacy and guide paths are locked; saga/trigger review is read-only. CI label arming belongs
to the coordinator; production CLI graph proof remains post-publish debt, not a dry-run claim.

PLAN-EVAL round 2: PASS, separate Anthropic session on the owner-requested model.
Implementation may begin. Next: S1 on original branch fix/native-service-policy.

S2 main integration: source merged cleanly. Debt conflict preserves both complete entries:
existing reader-header type closure and main's token-export cardinality debt. Prose carrier
conflict takes main's generated carrier, to be regenerated canonically for the merged authored
guide. No retained run evidence is removed; no debt scope, target or status is changed.

S2 integrated complete Fresh/workers suites pass: 460/0/0, including native wire/header
identity, reconnect/lifecycle and compiler controls. Scoped stream runtime/test lint and format
pass 16 files each with no dropped targets. Canonical authored-prose generation and dependent
barrel/publish-assets generation succeeded after the merge; only expected prose carrier differs.
Next: stable merged-head root/quality/publish/doc and canonical-corpus checks, then independent
exact-head implementation review. Required runtime CI remains an actual gate, not a local claim.
