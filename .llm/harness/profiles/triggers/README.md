# Triggers Harness Profile

> **Purpose.** Triggers is a high-leverage, cross-axis archetype (it integrates webhooks, file
> events, scheduled fires, and — once Group H lands — queues and streams; it cascades into workers,
> sagas, and streams). The base Arch-1/4 and Arch-5 profiles cover the _mechanical_ shape; this
> profile adds the **production-grade architectural rules** the base profiles do not encode.
>
> **Activation.** Active whenever a slice touches `packages/plugin-triggers-core/`,
> `plugins/triggers/`, `packages/cron/`, or `packages/watchers/`. Read alongside
> `.llm/harness/archetypes/ARCHETYPE-4-dsl-builder.md` (for core) and
> `.llm/harness/archetypes/ARCHETYPE-5-plugin.md` (for plugin), plus
> `.llm/harness/archetypes/ARCHETYPE-3-runtime-behavior.md` for the primitive audits.

## Documents in this profile

| Doc                                                | Purpose                                                                                                                                                                                            | Authority                                                                                                                           |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`architecture.md`](./architecture.md)             | The production-grade architecture target: layers, durability tiers, ports, runtime composition. **v1** — read alongside `architecture-v2.md` in the run folder for the rescoped target.            | Derived from `.llm/research/triggers-production-architecture/07-netscript-triggers-synthesis.md`                                    |
| `architecture-v2.md` (in run folder)               | The rescoped architecture absorbing evaluator findings F-1..F-14: open kind discriminator, cron ownership decision, primitive audit table, persistent-cron forward-compat, three-tier idempotency. | `.llm/tmp/run/feat-plat-impl-triggers--plan-and-impl/architecture-v2.md`                                                            |
| [`dsl-canon.md`](./dsl-canon.md)                   | The **one** canonical userland DSL shape (handler-first `defineWebhook(handler, spec)` family); resolves the dual-canon risk identified in evaluator finding F-2                                   | Derived from `01..06` synthesis + `10-cross-ecosystem-libraries.md` §7 (Cloudflare declarative model)                               |
| [`extension-axes.md`](./extension-axes.md)         | Named extension axes (verifier, scheduler, file-watcher, event-store, idempotency, DLQ, ingress, processor middleware, cron-provider, watcher-strategy) and the stub-only base pattern for each    | Derived from `08-netscript-cron-primitive.md`, `09-netscript-watchers-primitive.md`, and doctrine `07-composition-and-extension.md` |
| [`migration-strategy.md`](./migration-strategy.md) | Extend-before-replace cut-over for the four migration axes (verifier, scheduler, processor, registry) + primitive-audit cost                                                                       | Resolves evaluator finding F-10                                                                                                     |
| [`gates.md`](./gates.md)                           | Triggers-specific fitness gates F-TRG-1…F-TRG-18 supplementing F-13; primitive-audit gates, persistent-cron forward-compat gate, scheduler-axis-ownership gate                                     | Derived from `01..06` + Phase A baseline F-13 + evaluator findings F-4 / F-11 / F-14                                                |

## Reading order

For a fresh agent picking up an open Group F slice:

1. `architecture.md` v1 — read first for the unchanged sections (layers, T1 pipeline, durability
   tiers, observability spec).
2. `architecture-v2.md` (run folder) — read second for the rescoped decisions (open kind
   discriminator, scheduler ownership, primitive audits, three-tier idempotency, persistent-cron
   compat).
3. `dsl-canon.md` — read before writing any trigger file or builder code.
4. `extension-axes.md` — read before adding any new verifier, scheduler, watcher strategy, store, or
   middleware.
5. `migration-strategy.md` — read before any slice that touches the legacy `@netscript/triggers`
   package, `@netscript/cron`, or `@netscript/watchers`.
6. `gates.md` — read at the gating phase of every slice.

## Relationship to base archetypes

This profile **supplements** Arch-1/4/5 (and Arch-3 for the primitive audits); it does not replace
them. The profile's rules apply _in addition to_ the universal slice checklist in
`workflow/run-loop.md` and the archetype gates in `gates/archetype-gate-matrix.md`. Where this
profile is stricter, the profile wins (e.g., F-TRG-6 cron-import-ban is stricter than F-PLG-1).

## Relationship to research

The ten docs under `.llm/research/triggers-production-architecture/` are the _source material_. This
profile is the _operational distillation_. If the profile and the research disagree, the research is
correct and the profile must be updated.

| Research doc                      | Distills into profile section                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `01-hookdeck`                     | `architecture.md` §5 (ack-then-process)                                                                                       |
| `02-svix`                         | `architecture.md` §§8–10 (retry, circuit breaker, DLQ, idempotency TTL)                                                       |
| `03-trigger-dev`                  | `architecture.md` §6–7 (idempotency, concurrency keys)                                                                        |
| `04-inngest`                      | `architecture.md` §6 (event-level + function-level idempotency)                                                               |
| `05-temporal`                     | `architecture.md` §13 (schedule durability + backfill)                                                                        |
| `06-bullmq`                       | `architecture.md` §11 (graceful shutdown drain)                                                                               |
| `07-synthesis`                    | `architecture.md` (whole)                                                                                                     |
| `08-netscript-cron-primitive`     | `extension-axes.md` §3 (cron-provider axis); `architecture-v2.md` §13 (cron ownership)                                        |
| `09-netscript-watchers-primitive` | `extension-axes.md` §4 (watcher-strategy axis); `architecture-v2.md` §14                                                      |
| `10-cross-ecosystem-libraries`    | `architecture-v2.md` §3 (kind taxonomy); §18 (scheduler-ownership decision); `dsl-canon.md` §1 (declarative-trigger evidence) |
