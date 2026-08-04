# Research — #1229 one-shot trigger defer scheduler

## Baseline

- Live issue #1229 was read before source inspection. Baseline is fetched `origin/main` at
  `c384013662169046106ee9dd193ab8972beab3b4`.
- The defect is current and long-standing: `plugins/triggers/src/runtime/trigger-runtime-processor.ts`
  throws `TriggersError.unsupportedOperation` for `DeferAction`; the processor catches it and writes
  the event to DLQ.
- RED proof already exists as the rejection test in
  `plugins/triggers/src/runtime/trigger-runtime-processor_test.ts`; the first implementation slice
  will preserve that failure as an explicit RED-first commit before replacing it with GREEN.

## Architecture findings

1. `DeferAction` is core-owned, but core has no one-shot defer/replay contract. The existing
   `TriggerSchedulerPort` is cron-definition scheduling and cannot represent durable event replay.
2. A deferred record must contain serializable trigger identity + event + due timestamp. Definitions
   contain handlers and cannot be persisted; replay resolves the definition from the live registry.
3. `KvStore` provides durable set/list/delete and atomic CAS but no portable delayed queue. Therefore
   a package-owned port plus KV adapter must expose deterministic due replay; runtime composition
   supplies clock/wake behavior rather than relying on real sleeps in tests.
4. Idempotency currently marks a deferred event completed. Replay must use a distinct replay event
   identity/idempotency boundary or the existing claim will deduplicate it.
5. The production entrypoints load project definitions already, so restart recovery can bind durable
   records to definitions without persisting functions.
6. Exactly two caveat markers exist: `docs/site/durable-workflows/triggers.md` and
   `docs/site/explanation/durability-model.md`. The matching debt entry is open at
   `.llm/harness/debt/arch-debt.md`.

## Archetype and doctrine

- Primary profile: Archetype 5 (first-party `plugins/triggers`), folding the core Archetype-3
  runtime concern. The thinness law places public port/store contracts in
  `packages/plugin-triggers-core` and only composition in the plugin.
- Current doctrine verdict is historical `Restructure`/`Refactor`; this slice does not widen into a
  package reshaping exercise.
- In-scope axioms: A1, A5, A10, A12, A13, A14. In-scope anti-patterns: AP-1, AP-3, AP-8, AP-11,
  AP-14, AP-24, AP-25.

## JSR surface scan

- Both affected packages have explicit export maps, module barrels, descriptions, and publish
  allowlists. New public port/store/testing symbols require explicit return types and one-line JSDoc.
- Risks: accidental slow inferred public types, missing re-exports across `ports`/`stores`/`testing`,
  or publish list omissions. Planned gates retain full export-map doc lint, JSR audit, and dry runs.
- No dependency or version change is planned; `deno.lock` must not churn.

## Open questions resolved

- Replay semantic: re-run the original event against its registered definition at/after `until`.
- Persistence: KV-backed records, removed only after successful replay; failures remain retryable.
- Cancellation: explicit record id cancellation, proven before due time.
- Past-due: replay immediately on recovery/drain without sleeping.
