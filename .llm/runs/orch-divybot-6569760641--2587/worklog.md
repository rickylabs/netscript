# Worklog

## Operator route and process overrides

Exact owner grant: "IMPL-EVAL: a fresh read-only Codex reviewer session. Cockpit does the
cross-family review at READY." "Astra visual review side by side with the Figma PNGs."
"Draft PR, **Refs #2587**. No labels, no session ids."
"Merge origin/main on conflicts, and push normally. **Never rebase or force-push.**"
These specific operator instructions supersede generic closing-keyword/ready boilerplate.
Requested implementation: `gpt-6-astra`, effort `xhigh`. Feature matrix consulted at start.

## Design

1. Public surface: generated record create/update emits attributed activity; Overview
   shows genuine record activity and sample execution state/progress/time after seeding.
2. Vocabulary: record activity (actor, created/updated verb, record, time); seed handoff
   (stable seed identity, pending/accepted receipt); sample job (registered health-check).
3. Ports: existing service repository, injected activity publisher, stream producer,
   worker registry, queue and durable idempotency store. Filesystem only at seed/runtime edges.
4. Constants: record topic and event vocabulary; seed marker/version and stable key;
   existing sample job identity and weekly group size. No display fixture data.
5. Slices: S0 plan/bootstrap (run files); S1 product integration and regressions
   (CLI service/app/seed templates, scaffold writers, workers lifecycle/glue/handoff,
   tests, generated carriers; scoped and quality gates plus source supervisor review);
   S2 live/browser/visual/final reviewer and CI evidence (run files and necessary fixes).
6. Deferred scope: generic auditing/orchestration/retry UI and prior merged polish.
7. Contributor path: generated service activity adapter for extending events; workers
   sample handoff helper for seed lifecycle; this plan links the acceptance path.

PLAN-EVAL: N/A, bounded integration using existing runtime contracts; rationale in plan.md.

2026-11-02 bootstrap: baseline and prior memories verified, issue/PR preflight complete.
Deno 2.9.7 available; RTK unavailable. All required gates are pending, not yet proven.

## S1 source signoff

Independent read-only Codex Astra source supervisor: PASS after one FAIL_FIX round.
Closed marker location, atomic publication/validation, application publisher containment,
and populated stream catch-up disclosure. Added emitted-handler consumer replay coverage.
Deno 2.9.7: 102 focused tests PASS; scoped check/lint/fmt 16 files PASS; quality:gate,
root lint/fmt, docs:accuracy, publish:dry-run and CLI public doc lint PASS.
Live pilot demonstrated actual anonymous create/update events and a completed seeded job
with 100% reported progress. Clean final live/visual and CI acceptance remain pending.
No accepted debt; public report omits private machine paths and reviewer identifiers.

## S2 CI and live acceptance follow-up

CI found a docs snippet dependency closure gap and a consumer database import gap.
Added the canonical activity type to snippet support and declared the existing standard path
mapping in database workspaces. The runtime fixture now links users to the persistent stream
and performs a real successful PATCH before the unchanged Overview ready-panel assertion.
A long real create reference exposed compact table overlap; bounded the link and retained full
accessible text/title. Independent same-session source supervisor PASS for these corrections.
28 follow-up tests PASS; docs:snippets36fences PASS; clean scaffold.service8gates PASS;
7-file scoped check/lint/fmt PASS. Final live app/service/workers134files check PASS.
16 populated browser captures at1440/390 light/dark: HTTP200, no overflow or page errors.
The actual seed job completed with progress100 and remained the same execution after worker
restart. Unlinked stream fallback uses actual record changes with explicit owner attribution.
Separate Astra visual review and fresh IMPL-EVAL remain pending. Required CI is being rerun.

## S2 final evaluation and reconciliation

Fresh read-only final Codex IMPL-EVAL found producer identity reuse after restart and missing
fallback for an app-linked/service-unlinked stream. Added producer-lifetime UUIDs and a same
resource link check, with negative controls. A service-only restart retaining stream history
proved both updates remain visible; unlinking only the service showed actual record changes.
The same evaluator returned PASS; see impl-eval.md. No accepted product debt.

Astra visual review requested clearer status categories and numeric table alignment. Replaced
the status donut with the shipped labelled horizontal chart and right-aligned rich-table amounts.
All16 populated replacements plus4 Records viewport images passed independent review:
every variant8.0–8.3 and at least Figma level; see visual-review.md and visual-dom.json.

Deno2.9.7: 181 focused tests PASS, including CSS budgets; all28 changed TypeScript files
passed scoped check/lint/fmt without dropped files; final generated workspace134files PASS.
The full four-task carrier generation chain passed. Final root checks are being recorded.

CI build failure is resolved: docs build and browser/style jobs are green at4951bf1.
Manual runtime run41398764485 passed PostgreSQL but SQLite lacked a record mutation because
it skips the Postgres endpoint gate. Added shared behavior.record-activity before unchanged
Overview readiness in both tiers.71 gate tests PASS; independent follow-up review PASS in
impl-eval-ci.md. Final full runtime CI is required after the acceptance push.
Reconcile: origin/main still matches the original baseline; no merge conflict or rebase.

Final local acceptance: all six durable gates PASS (root check4203files, quality:gate,
root lint/fmt reports, docs:accuracy, publish:dry-run); four carrier generation tasks and
all15root check tasks PASS. Evidence is sanitized in validation.json with product hashes.
The source supervisor's PASS authorizes this sign-off commit. No pending local fixes.
All owned Aspire endpoints stopped and verified closed; no foreign resource mutation.
The final-head runtime workflow and PR checks supply remote acceptance; their terminal
links belong in the PR phase comment and the excluded READY report handoff.


## Ready-transition core CI repair

Owner later authorized `gh pr ready 2589`; the PR is ready. Coordinator's exact direction:

> PR 2589 at 1b3f459: DeepSeek cross-family review = MERGE (no blocking findings), but core CI run 41404240146 FAILED shards test-1, test-2, test-3, test-6 (check-test red). Read the failed shard reports, fix the regressions (keep negative controls), push normally (no rebase/force), wait for core CI and full scaffold runtime green at the new head, then post a NEW READY comment on issue 2587 with the full head sha and STOP. Cockpit merges; the 0.0.9 canary.2 cut waits on this.

Read all four failed shard reports and reproduced each failure locally. Updated old Donut and
plain-handler assertions for the approved chart/context design; made emitted memory instance
isolation compare the same mutated record across repositories; added actual emitted activity
files to exact golden inventories; made the fake Prisma schema/data use real model Date fields.
No runtime source, authentication assertions, persistence guards, or error controls weakened.
The memory isolation assertion now detects shared mutation instead of inspecting another row.
Combined45tests PASS. Quality gate, scoped TS check/lint/fmt and four carrier generators PASS.
Same independent read-only final evaluator is reviewing this slice; all root check tasks running.
No new visual review required: product UI/rendering files are unchanged from accepted captures.

Independent same-session read-only evaluator returned PASS for all four repairs with no weakened
controls; report in ready-ci-review.md. All15root check tasks PASS, review threads0unanswered.
ready-ci-validation.json binds45passing tests, local reproduction/fix receipts, scoped wrappers,
quality gate, carrier chain and all five product/test files by SHA256. Supervisor reviewed the
canonical generated change and signs off this slice. origin/main remains20ba1729; no merge needed.
Next: normal push, core CI, manual full runtime (ordinary unlabeled PR policy skips that workflow),
then the coordinator-requested NEW READY issue comment with the full head.
