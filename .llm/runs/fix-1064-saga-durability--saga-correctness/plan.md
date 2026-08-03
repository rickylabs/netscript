# Plan: saga engine correctness (#1064, #1065, #1066)

## Run Metadata

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| Run ID         | `fix-1064-saga-durability--saga-correctness`                            |
| Branch         | `fix/1064-saga-durability`                                              |
| Phase          | `plan`                                                                  |
| Target         | `packages/kv`, `packages/plugin-sagas-core`, `plugins/sagas`, saga docs |
| Archetype      | `2 - Integration`, `3 - Runtime/Behavior`, `5 - Plugin`                 |
| Scope overlays | `docs`                                                                  |

## Archetype

The KV Redis adapter is an Archetype 2 infrastructure adapter behind the stable `KvStore` port. The
saga engine is an Archetype 3 durable state machine. The durable runtime factory is an Archetype 5
composition root and must stay thin. Documentation uses the docs scope overlay.

## Current Doctrine Verdict

- `packages/kv`: **Refactor** — adapter audit is explicitly required; this slice repairs one proven
  contract drift without broad cleanup.
- `packages/plugin-sagas-core`: runtime/state-machine rules apply; preserve explicit failure and
  deterministic state transitions.
- `plugins/sagas`: **Keep** — only composition wiring belongs here.

## Axioms in Play

| Axiom | Why it matters                                                                           |
| ----- | ---------------------------------------------------------------------------------------- |
| `A1`  | The existing atomic, cascade, and correlation contracts lead implementation.             |
| `A5`  | Inject and compose the existing compensator rather than subclassing runtime behavior.    |
| `A7`  | Use platform primitives for internal serialization/clock behavior.                       |
| `A10` | `createDurableSagaRuntime` owns default runtime composition.                             |
| `A12` | Correlation must deterministically resume the correct durable state machine.             |
| `A13` | Unsupported effects and failed atomic commits must fail explicitly and boundedly.        |
| `A14` | Real-adapter, concurrency, public-surface, static, and fitness gates preserve the fixes. |

## Goal

Make Redis-backed saga persistence honor atomic compare-and-set, make returned compensation effects
execute through the default durable runtime with no silent effect drops, and resolve saga instances
by extractor → explicit key → deterministic default, including two concurrent workflows.

## Scope

- Serialize or isolate Redis atomic transactions so `WATCH`/read/`MULTI`/`EXEC` form one
  connection-safe operation.
- Add a real Redis `KvSagaStore` regression covering `kv.list`, bounded save, and competing
  expected-version saves.
- Dispatch publish-produced cascades, wire the existing compensator by default, redispatch
  compensation-produced cascades, and reject unknown/missing effect handling loudly.
- Apply correlation extraction before explicit/default fallback and remove `message.id` from
  identity resolution.
- Add concurrent and resume-path correlation regressions.
- Align the canonical saga capability page and storefront tutorial.

## Non-Scope

- #1013 and #1015; shared roots are reported in PR text, not absorbed.
- Scaffold/plugin registry/install files owned by the concurrent plugin-wiring slice.
- General Redis adapter refactoring, connection pooling, or unrelated KV tests.
- Spawn implementation; it remains explicitly unsupported and loud.
- Release cutting or dependency upgrades.

## Hidden Scope

- Real server lifecycle and ownership proof for Redis/Garnet.
- Default compensation requires a clock satisfying the existing `SagaClockPort`, but must not expand
  the public surface.
- Compensation handler return effects must themselves be dispatched.
- Docs must state instance-key precedence and supported compensation path consistently.

## Locked Decisions

| ID   | Decision                                                                                                                                                                          | Rationale                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `D1` | Keep Redis transaction ownership inside `RedisKvAdapter`; serialize atomic sequences per shared command connection unless tests prove a dedicated connection is required.         | `WATCH` is connection-scoped; minimal repair preserves the public port and lifecycle. |
| `D2` | Integration tests use a real externally supplied Redis URL and explicit timeout; no fake adapter qualifies.                                                                       | Acceptance targets real adapter divergence and forbids hangs.                         |
| `D3` | The bridge dispatches the exact cascade ledger returned by engine handling; it does not infer effects from state.                                                                 | Preserves effect-as-data contract.                                                    |
| `D4` | Default factory composes the existing `SagaCompensator`; an injected compensator remains the override.                                                                            | Keeps plugin thin and advanced injection intact.                                      |
| `D5` | Unknown cascade kinds throw an error naming the kind; missing scheduler/compensator errors continue naming the missing option.                                                    | Eliminates silent-drop paths.                                                         |
| `D6` | Correlation precedence is definition extractor (specific rule before wildcard) → explicit `message.correlationKey` → message-type default. `message.id` is never an instance key. | Meets #1066 in both collapse and fork directions.                                     |
| `D7` | Canonical content lives at `docs/site/durable-workflows/sagas.md`; `docs/site/capabilities/durable-sagas.md` redirects there. Update the canonical page and storefront tutorial.  | Updates the content reviewers reach through the capability redirect.                  |

## Open-Decision Sweep

| Decision                                  | Status        | Notes                                                                                             |
| ----------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| Redis test opt-in mechanism               | safe to defer | Follow existing environment-gated integration-test convention; slice evidence explicitly runs it. |
| Private system clock location             | safe to defer | Keep it unexported at the existing composition boundary; no consumer-visible choice.              |
| Broader Redis connection manager redesign | safe to defer | Not required if serialization proves atomic correctness.                                          |
| #1013/#1015 relationship                  | safe to defer | Mention any shared root in PR; do not implement.                                                  |

## Risk Register

| Risk                                                 | Mitigation                                                                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Fix removes hangs but still permits lost updates     | Assert exactly one winner among concurrent expected-version saves on real Redis.                                                     |
| Serialization queue becomes poisoned after rejection | Release in `finally`; test a failed atomic operation followed by a successful one if implementation uses a queue.                    |
| Cascades recurse forever                             | Dispatch only returned ledgers; each nested compensation result is processed once and normal saga semantics control further effects. |
| Correlation extractor throws or returns undefined    | Propagate extractor errors; fall back only on `undefined`, then explicit/default.                                                    |
| Docs overpromise scaffold wiring                     | Describe current default durable runtime only; avoid plugin registry/scaffold claims.                                                |
| Concurrent slice overlap                             | Stop before editing install/registry/scaffold-owned files.                                                                           |

## Anti-Patterns to Resolve or Avoid

| AP                                      | Status   | Plan                                                                      |
| --------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `AP-6` hidden global state              | risk     | Keep transaction serialization instance-owned.                            |
| `AP-10` swallowed failures              | existing | Make unknown/unhandled cascades throw and preserve missing-option errors. |
| `AP-14` infrastructure leakage          | risk     | Keep Redis mechanics behind `KvStore.atomic`.                             |
| `AP-25` hand-rolled platform substitute | risk     | Use platform promises/timers only for internal lifecycle behavior.        |

## Fitness Gates

| Gate                               | Required | Expected evidence                                                                         |
| ---------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `F-1..F-19` per A2/A3/A5 matrix    | yes      | `deno task arch:check`, `quality:scan`, scoped wrappers, manual evidence where unscripted |
| `F-6` JSR publishability           | yes      | package JSR audits/doc lint and publish dry-run for touched published surfaces            |
| `F-10` test shape                  | yes      | real Redis adapter regression plus focused saga behavior tests                            |
| `F-13` saga/runtime invariants     | yes      | concurrent correlation and compensation dispatch tests                                    |
| Docs source/link/terminology gates | yes      | docs content/link checks and source comparison                                            |

## Arch-Debt Implications

| Entry                             | Action        | Notes                                                                               |
| --------------------------------- | ------------- | ----------------------------------------------------------------------------------- |
| Existing KV adapter audit verdict | none          | This slice repairs one proven defect; it does not claim the broader audit complete. |
| New debt                          | none expected | Any unavoidable debt requires a registry entry before merge.                        |

## Validation Plan

| Order | Gate                 | Command or check                                                                      | Expected result                                                   |
| ----- | -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1     | #1064 focused        | Real-Redis targeted test with owned URL and timeout                                   | list returns; save completes/fails loudly; exactly one CAS winner |
| 2     | #1064 package        | touched KV/saga store tests; scoped check/lint/fmt                                    | PASS, no ignored diagnostics                                      |
| 3     | #1065 focused        | default durable runtime compensation and unknown-effect tests                         | registered compensation invoked; unsupported kind names failure   |
| 4     | #1065 package/plugin | touched saga-core and plugin tests; scoped check/lint/fmt                             | PASS                                                              |
| 5     | #1066 focused        | two concurrent extracted keys; same key with distinct ids; explicit/default fallbacks | separate/resumed instances exactly as specified                   |
| 6     | Docs                 | docs lint/content/link gate for both pages                                            | PASS and pages agree                                              |
| 7     | Public surface       | `deno doc`, doc lint, JSR audit/publish dry-run for touched packages/plugins          | PASS; no accidental export expansion                              |
| 8     | Required aggregate   | `deno task check`, touched tests, `deno task quality:scan`, `deno task arch:check`    | PASS with artifact output inspected                               |
| 9     | Harness evaluation   | opposite-family slice reviews and final separate IMPL-EVAL                            | PASS                                                              |

## Dependencies

- Owned Redis 7 container on port 46379 for diagnosis and slice gate; no foreign container access.
- Existing `@netscript/kv`, saga-core, and sagas plugin contracts only; no new dependency planned.

## Drift Watch

- Need for a public API/export, a dependency change, a plugin registry/scaffold edit, or scope from
  #1013/#1015.
- Any inability to reproduce the real Redis atomic failure after the fix.
- Any canonical docs path or runtime semantics differing from research.
