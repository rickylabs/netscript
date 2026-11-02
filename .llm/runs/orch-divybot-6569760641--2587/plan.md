# Plan & Design — READY FOR REVIEW

Deliver the four remaining #2587 requirements in one cohesive implementation slice,
then an acceptance/evidence slice. Keep the approved Utility layout and existing states.

Locked decisions:

- A generated application activity port receives committed create/update results and a
  verified actor or explicit anonymous identity. The stream adapter uses the existing
  producer and a dedicated record topic. Failed/missing mutations never create events.
- Activity renders actor, verb, linked record and timestamp. Without a stream link,
  use actual record timestamps and explicitly identify the owner rather than inventing
  a mutation actor. Denied/unavailable linked topics remain denied/unavailable.
- Seeding writes a stable pending handoff only after the database writes succeed.
  The generated worker glue consumes it after registry registration. Dispatch uses the
  existing queue and stable idempotency key; completion/dispatch receipts prevent repeat
  startup and reseed from manufacturing additional sample runs. No seed-time API calls.
- Clamp today's sample timestamps to the seed instant, preserving historical spread.
  Derive the final weekly group's day count from the actual grouping.
- Preserve endpoint discovery, authorization boundaries, and explicit nonready states.

Risk selection: PLAN-EVAL N/A. This is bounded scaffold integration of existing producer,
queue/idempotency and startup contracts with owner-specified behavior; no new transport,
durable execution engine, package dependency, or authentication policy is being designed.
Independent source supervision and final IMPL-EVAL remain mandatory.

Gates: Deno 2.9.7 scoped check/lint/fmt/test wrappers; emitted app/service checks;
quality:gate, JSR/doc surface, CSS budgets, complete asset carrier chain and every root
check:* task. Full scaffold.runtime in CI. Real seeded service/workers/streams captures
for changed pages at 1440/390 in light/dark. Separate Astra Figma review >=8/10 and
at least reference craft/density; fresh read-only Codex IMPL-EVAL. Required CI must be
green or policy-skipped before READY. No accepted debt. Cockpit owns merge.

Risks: post-commit stream failure must not misreport database rollback; startup dispatch
must not run without a seed or without the actual sample job; duplicate deliveries must
retain the worker idempotency identity; public reads must not carry service credentials.
Tests target these boundaries, and live acceptance proves actual worker execution.

Deferred: the already-merged chart/health redesign, general audit logging, arbitrary job
orchestration, automatic retry UI, and provider/auth configuration. These are outside #2587.
