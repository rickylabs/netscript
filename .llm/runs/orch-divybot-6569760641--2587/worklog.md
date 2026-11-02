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
