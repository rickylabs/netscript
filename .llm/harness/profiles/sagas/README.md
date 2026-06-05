# Sagas Harness Profile

> **Purpose.** Sagas is a high-leverage, cross-axis archetype (it integrates
> workers, streams, triggers, telemetry, and the AI-agent plugin). The base
> Arch-4 and Arch-5 profiles cover the *mechanical* shape; this profile adds
> the **production-grade architectural rules** the base profiles do not
> encode.
>
> **Activation.** Active whenever a slice touches `packages/plugin-sagas-core/`
> or `plugins/sagas/`. Read alongside `.llm/harness/archetypes/ARCHETYPE-4-dsl-builder.md`
> (for core) and `.llm/harness/archetypes/ARCHETYPE-5-plugin.md` (for plugin).

## Documents in this profile

| Doc | Purpose | Authority |
|---|---|---|
| [`architecture.md`](./architecture.md) | The production-grade architecture target: layers, durability tiers, ports, runtime composition | Derived from `.llm/research/sagas-production-architecture/05-netscript-sagas-synthesis.md` |
| [`dsl-canon.md`](./dsl-canon.md) | The **one** canonical userland DSL shape (chain-style `defineSaga(id)...build()`); resolves the dual-canon conflict identified in evaluator finding F-3 | Derived from `01-wolverine-low-ceremony-sagas.md` + run drift entry E1 |
| [`extension-axes.md`](./extension-axes.md) | Named extension axes (transport, store, bus, agent runtime, outbox, history) and the stub-only base pattern for each | Derived from `02-temporal-durable-execution.md`, `04-voltagent-ai-durable-state.md`, and doctrine `07-composition-and-extension.md` |
| [`migration-strategy.md`](./migration-strategy.md) | Extend-before-replace cut-over for `@saga-bus/core` → native engine; per-slice toggle policy | Resolves evaluator finding F-2 |
| [`gates.md`](./gates.md) | Sagas-specific fitness gates F-SAGA-1…F-SAGA-12 supplementing F-13; idempotency, durability-tier, signal/query, concurrency-key checks | Derived from `03-trigger-dev-integration-patterns.md` + Phase A baseline F-13 |

## Reading order

For a fresh agent picking up an open Group E slice:

1. `architecture.md` — read first; it is the target shape.
2. `dsl-canon.md` — read before writing any saga file or builder code.
3. `extension-axes.md` — read before adding any new transport, store, or adapter.
4. `migration-strategy.md` — read before any slice that touches `@saga-bus/*`.
5. `gates.md` — read at the gating phase of every slice.

## Relationship to base archetypes

This profile **supplements** Arch-4/Arch-5; it does not replace them. The
profile's rules apply *in addition to* the universal slice checklist in
`workflow/run-loop.md` and the archetype gates in
`gates/archetype-gate-matrix.md`. Where this profile is stricter, the
profile wins (e.g., F-SAGA-3 idempotency-key check is stricter than F-13).

## Relationship to research

The five docs under `.llm/research/sagas-production-architecture/` are the
*source material*. This profile is the *operational distillation*. If
the profile and the research disagree, the research is correct and the
profile must be updated (the research has citations; the profile is opinion).
