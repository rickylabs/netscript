# docs(orchestration-runtime): outbound webhook delivery has no recipe or template — triggers ship inbound ingress only, so every product hand-rolls signing, retry and dead-lettering — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T3-04 · **Proposed milestone:** 0.0.8 (post-shift "Runtime truth + service slice") ·
**Labels:** `type:docs` `area:docs` `area:plugins` `area:cli` `priority:p2` `status:triage` ·
**Depends on:** T3-03 (soft — the outbox relay is the recipe's preferred delivery substrate; the
recipe can ship without it with a stated at-most-once caveat)

## Summary

NetScript receives webhooks well and says nothing about sending them. `defineWebhook` plus the
ingress/verifier seam is a first-class inbound capability with a tutorial chapter, but there is no
guidance, template, or primitive for *outbound* delivery — signing a payload, retrying with backoff,
capping attempts, dead-lettering, and letting a receiver deduplicate. Agent-built products therefore
invent it: the Wave-6 workflow builder wrote `fire-webhook` jobs by hand and the billing run
simulated outbound calls entirely. This was adjudicated **not a framework defect** — the capability
is composable from `plugin-workers` today — so the fix is a first-party **recipe plus a generated
worker template**, not a new plugin or a new primitive.

## Evidence

- Inbound is complete: `packages/plugin-triggers-core/README.md:7-12,60-97,142-145`
  (`defineWebhook`, `TriggerIngressPort`, `WebhookVerifierPort`, HMAC verification, `enqueueJob`);
  config surface `packages/config/src/domain/schemas/netscript-config-schema.ts:85,107-117`
  (`type: 'webhook'`, `basePath: '/api/v1/webhooks'`);
  docs `docs/site/orchestration-runtime/how-to/author-a-plugin.md:206,223,235` and the tutorial
  chapter `docs/site/tutorials/storefront/05-shipping-webhook.md` — all inbound.
- Outbound is absent: `grep -rn "outbound"` filtered to webhook/delivery over `packages/`,
  `plugins/`, `docs/site` returns nothing; `grep -rln "deliverWebhook|WebhookDelivery|webhook-delivery"`
  returns nothing.
- The composable parts already exist: `defineJob` / `defineJobHandler` / `createJobTools`
  (`packages/plugin-workers-core/mod.ts:17-24`), delivery idempotency
  (`packages/plugin-workers-core/src/ports/worker-idempotency-port.ts`), and a dead-letter vocabulary
  (`packages/queue/mod.ts:70-72` — `DeadLetterReason`, `DeadLetterRecord`, `DeadLetterStorePort`).
- Wave-6: R2 hand-built `fire-webhook` jobs, which failed before token validation because the worker
  had no service endpoint (`research/wave-6-runs.md` §R2 D2); R3 shipped "simulated webhooks"
  (`research/wave-6-runs.md` §R3 product shape).
- Adjudication: `SYNTHESIS.md` §3.5 — "Not a framework defect. Disposition: first-party **recipe +
  worker template** (docs + generation), not a new plugin; p2".

## Current surface

A consumer who needs to notify a third party has: `defineJob` for the background execution,
`enqueueJob` from a trigger or a service, KV/queue-backed retry inside the worker runtime, a
dead-letter store, and `crypto.subtle` for HMAC. What they do not have is any page, example, or
generated file telling them how to assemble those into a delivery that a receiver can trust and
deduplicate — nor a statement of which guarantees the assembly does and does not provide.

## Target contract

1. **A recipe page** under the orchestration-runtime how-tos: outbound webhook delivery, covering the
   endpoint registry (consumer-owned rows: url, secret reference, active flag), the signed request
   shape (timestamp + payload HMAC in a documented header, receiver-side verification snippet), retry
   with capped exponential backoff and a maximum attempt count, dead-lettering through the existing
   `DeadLetterStorePort` vocabulary, a stable per-delivery id the receiver deduplicates on, and an
   explicit guarantee statement: **at-least-once, never exactly-once**.
2. **A generated worker template** the CLI can emit — one `defineJob` delivery job plus its handler,
   parameterized by endpoint lookup, that reads its target from injected configuration rather than a
   hardcoded URL (the exact failure R2 hit), records attempt/outcome, and dead-letters on exhaustion.
3. **The outbox seam.** When the command kit (T3-03) is present, the recipe's canonical source of
   deliveries is the outbox relay, so a webhook is announced only for state that actually committed.
   Without it, the recipe states plainly that enqueueing from inside a request is at-most-once.
4. **Non-goals stated on the page:** this is not a plugin, not a delivery SLA, not a subscription
   management API, and not a receiver-side framework.

## Acceptance

- [ ] An outbound-webhook how-to exists under the orchestration-runtime section.
- [ ] The page documents signing, retry/backoff caps, dead-lettering and receiver deduplication.
- [ ] The page states at-least-once delivery and explicitly disclaims exactly-once.
- [ ] The page's code samples type-check against published entrypoints.
- [ ] A generated delivery worker template ships and reads its endpoint from injected config.
- [ ] The template dead-letters after the configured maximum attempts.
- [ ] Negative: a template with a hardcoded endpoint URL fails a scaffold golden test.
- [ ] Negative: a delivery that exhausts retries is provably in the dead-letter store, not dropped.
- [ ] Tests cover signature generation, backoff schedule, attempt cap and dead-letter routing.
- [ ] The page cross-links inbound `defineWebhook` and names it as the opposite direction.
- [ ] No new package or plugin is created by this issue.

## Boundaries

Do not duplicate: **#1329** (streams SSE envelope + OTEL propagation); **#1325** (triggers Redis
adapter glue); **#554**/**#555** (`TriggerDlqPort` contract route and `DeadLetterStore` CLI/contract
API — this recipe *uses* the dead-letter vocabulary and must not define a second one); **#1208**
(tutorial phase 1) and **#1210** (per-API web-layer deep dives) — this is an orchestration-runtime
how-to, not a tutorial rewrite or a page-builder page; **#742** (saga versioning); **#878**
(enterprise auth audit events). Explicitly out of scope: inbound webhook behavior, a webhooks plugin,
a subscription/endpoint management API, and any change to `plugin-triggers` runtime semantics.

## Docs/consumer proof

The recipe is proven by the generated template compiling and running in the scaffold runtime E2E, by
its samples type-checking against the published export map, and by a Wave-7 row recording whether an
unfamiliar agent used the recipe or hand-rolled delivery again. If an agent still hand-rolls it, the
recipe failed and the disposition (docs vs generation vs primitive) is re-opened with that evidence.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Pack T3 of the Fable-5
remediation plan; disposition adjudicated in `SYNTHESIS.md` §3.5 from the verify-before-filing list in
`research/preplan-package.md`. Checked against `research/github-board-open.md` §7 — no existing owner
for outbound webhook delivery. Draft only; no board mutation performed.
