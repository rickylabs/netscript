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

S3 research qualification of the adopted, not-yet-integrated factories: 57 pass, 1 fail,
0 ignored. The sole failure is a 10-second checked compiler-child deadline; 57 runtime,
permission, TLS, durability and cleanup controls pass on Linux. Recheck the failing control
on the integrated graph with no concurrent heavy compiler jobs before changing any deadline.
S2 independent exact-head review returned MERGE on7421a60f2, with current CI/runtime explicitly
pending. S1 has no code blockers, but coordinator runtime arming and final CI proof are pending.

S3 main merge preserves both complete debt groups and main reference navigation links,
adding only the new singular service table row. No runtime source conflict resolution.
