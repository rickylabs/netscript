# Plan: workers payload registry map remainder

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-workers-payload-registry-map--0.0.7` |
| Branch | `feat/workers-payload-registry-map` |
| Phase | `implement` |
| Target | `@netscript/plugin-workers-core`, workers generator/plugin, canonical CLI fixture |
| Archetype | 3 — Runtime/Behavior; 5 — Plugin; bounded Archetype-6 fixture |
| Scope overlays | service contract and generated application boundary |

## Authority and evaluation

The accepted contract is `.llm/runs/workers-payload-type-contract--plan/plan.md`; the owner-provided
`implement-brief.md` selects its unlanded S1–S4 remainder. PLAN-EVAL is **N/A for this mechanical
remainder**: the parent contract already received a separate-session `PASS_PLAN`, and this run opens
no new material design decision. Implementation evaluation remains reserved for a separate session.

## Goal

Make one schema-backed job definition carry the runtime validator and payload type through handler
execution, generated literal ID registries, and typed `triggerJob`, while preserving the existing
wire schema, queue message construction, config-aware operational definitions, and public Map names.

## Scope

- Require Standard Schema values at job payload declarations and handler declarations.
- Carry the schema through domain/root/runtime definitions and validate before enqueue and before
  application handler execution.
- Emit literal `jobHandlersById` / `jobDefinitionsById` objects and derive a public generated payload
  map before projecting to the existing runtime Maps.
- Add broad-default generic workers trigger input/contract surfaces for application opt-in.
- Update first-party jobs/stubs, focused tests, and the canonical CLI generator fixture.

## Non-Scope

- Trigger-core (the definition-bound enqueue guarantee already landed in #1938).
- #1451 operational metadata redesign, task/workflow parity, alternate discovery/loading, dependency
  changes, workspace metadata, other plugins, CI configuration, or EIS-Chat shims.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Standard Schema is the single payload authority. | Type inference and runtime validation cannot drift. |
| D2 | Keep the post-handler-set `this` guard on `.payload(schema)`. | The schema must be known before the handler boundary is fixed. |
| D3 | Preserve `registry`, `jobDefinitions`, and `definitions`; add literal objects before Map widening. | Supported runtime names and #1451/#1872 behavior remain stable. |
| D4 | Broad workers service implementation stays v1 and wire-identical; typed clients opt into a payload map. | The change is TypeScript source precision, not a wire-version change. |
| D5 | Validate with the selected definition immediately before queue enqueue and handler invocation. | Untyped producers are rejected on both sides from the same schema. |
| D6 | Schema-less `.payload<T>()` and `defineJobHandler(handler)` are deliberate source breaks. | A type-only fallback would preserve producer/consumer drift. |

## Open-Decision Sweep

All must-resolve decisions are closed by the accepted plan and brief. Distinct Standard Schema input
and output types, task/workflow parity, and operational registry redesign remain safe to defer.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| RED fails for syntax/arity rather than the defect. | Use baseline-valid calls and prove unused `@ts-expect-error` plus an invalid-payload handler invocation. |
| Literal values widen through a helper or array. | Infer each imported module through a conditional generic resolver and form `as const` objects first. |
| KV persistence attempts to clone a schema function. | Keep schemas as process-local definition metadata while persisting only the existing serializable projection. |
| oRPC runtime changes accidentally. | Reuse the exact v1 schema/value and narrow only the generic returned client contract type. |
| Config-aware fields regress. | Retain current definition factories and their golden policy assertions. |

## Validation Plan

1. Commit RED tests and record failures attributable only to invalid payload reaching a handler and
   unused `@ts-expect-error` on the widened generated/trigger contract.
2. Implement core schema carrier/validation and turn the focused core RED green.
3. Implement literal generators plus typed contract and turn generated consumer proofs green.
4. Run the brief's scoped check/test/lint/fmt gates, CLI registry-generator tests, quality gate,
   docs lint, publish dry-run, and architecture check; separate pre-existing failures.

