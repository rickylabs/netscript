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

S1: merged current main cleanly into original service branch, preserving all old evidence.
No manual source or workflow conflict resolution was needed. New merge-head gates follow;
historical tests do not certify this merge. All review-thread checks currently pass.

## S1 local gate completion

At source merge 24c73ee2f37c6c4257e3d245c3afda59cbd7d3d0, root `deno task check`
passes all 3828 selected files/32 batches. Complete service/plugin/docs-tool tests:
824 passed, 0 failed, 0 ignored. Service lint/fmt: 126 files each, 0 findings/drops.
Quality:gate (quality scan + architecture/dependency checks) passes with existing warnings.
Full service doc lint: all 8 entrypoints, zero findings. Service and MCP published-member
static dry-runs pass. JSR audit passes with existing sanctioned service slow-type INFO only.
All four canonical generated-doc freshness gates pass with no regeneration or lock churn.
See gate-summary.json for sanitized durable receipt results; raw output remains local.

Reconcile: original branch retained, main merged normally, no manual source/workflow conflict
resolutions; no labels or milestones changed. All review-thread gates pass with zero threads.
PR bodies now start with Refs and service/reader breaking migrations are explicit. The old
release/EIS checklist claims are outside this bounded leaf; they are not asserted complete.
Coordinator notified of 2422's missing runtime opt-in. Independent exact-head review is next;
required runtime CI remains unproven, and no release or merge readiness is claimed yet.

Independent implementation round 1 found no code blockers and returned CHANGES on exact head
7dd579d78bb7fe0cd498618b45f65f64e640ee69 because runtime/CI proof is pending. Verbatim
report is evaluate-round-1.md. Corrected its stale immediate-health documentation finding in
the service README, CHANGELOG and reference pipeline/rate-limit guide. No runtime source
change. Canonical prose regeneration and exact next-head evidence are required. This terminal
review leaves external gate proof pending; the independent S2 reader lane can proceed.

S1 documentation repair complete: README and reference guide now distinguish deferred health
from immediate service-info, and CHANGELOG describes middleware/body-limit ordering. Canonical
prose/build, assets-barrel and publish-assets generation succeeded; only the expected prose
carrier changed. Runtime source remains byte-identical to the already tested source merge.
Continue S2 while service runtime CI remains coordinator-owned and unproven.

S3 integration found the new anonymous alias creates a private-type-ref at the downstream
factory facade. Repairing the native owner definition in S1 avoids facade growth and retains
the same public structural contract. This is a necessary integration fix, not an added API.
Current service head will move; earlier exact-head verdict remains preserved and not relabeled.

Native anonymous contract repair: AuthnOptions owns the exact same readonly string/request
union; AnonymousRule and AnonymousRequestMatch are derived native public views. Service
full-export doc lint remains0 and the complete service/plugin/docs-tool suite passes824/0/0.
The change avoids adding any native factory facade exports or relaxing existing debt bounds.
Scoped source lint/fmt pass. Regenerate the canonical native export corpus next.

Canonical export-corpus regeneration for the native alias repair succeeded: 35 packages,
301 subpaths, 8930 symbols, no export-count growth. The generator changes only its owning
carrier. Runtime tests remain824/0/0 and native service doc lint0; final source gates follow.

Final S1 source reconciliation at37f26c1dc07da57a83a7cfbccc5344a349d1414c: root check,
quality/architecture/dependency gate, service/MCP publication dry-runs, and all four canonical
freshness gates PASS with durable receipts. Complete service/plugin/docs-tool tests824/0/0,
service doc lint0, scoped native contract lint/fmt0. Final checkpoint adds only run evidence.
Current source CI passes check/test, quality and build; runtime CI is unproven because its
opt-in label remains coordinator-owned. Independent exact-head reevaluation follows.
Reconcile: the gate-summary checkpoint380febd9 was pushed before its paired worklog/context
append completed; this follow-up completes the same evidence slice without rewriting history.
