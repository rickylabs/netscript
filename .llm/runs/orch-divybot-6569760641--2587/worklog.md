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
