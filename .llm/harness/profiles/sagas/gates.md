# Sagas — Fitness Gates (Supplemental)

> **Purpose.** Sagas-specific fitness gates that supplement F-1…F-15 from
> `.llm/harness/gates/fitness-gates.md`. F-13 (saga/runtime invariants) stays as the umbrella; this
> document defines its constituent checks.
>
> **Status.** Manual evidence in Phase A; scripts under `.llm/tools/sagas/` in Phase B.

## Gates

| Gate      | Name                        | Script target (Phase B)                                | Primary concern                                                                                                           | Source                     |
| --------- | --------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| F-SAGA-1  | Public-surface count        | `.llm/tools/sagas/check-public-surface.ts`             | ≤25 root barrel exports                                                                                                   | `architecture.md` §4       |
| F-SAGA-2  | No upstream re-export       | `.llm/tools/check-upstream-reexport.ts` (extends F-15) | No `@saga-bus/*` symbols in public surface                                                                                | drift E14                  |
| F-SAGA-3  | Idempotency-key on `send()` | `.llm/tools/sagas/check-idempotency.ts`                | Every `send()` in T2/T3 sagas has `idempotencyKey`                                                                        | research §03.2.2           |
| F-SAGA-4  | Durability tier declared    | `.llm/tools/sagas/check-durability.ts`                 | T2/T3 sagas declare `.durability('t2'\|'t3')`                                                                             | research §02.2.2           |
| F-SAGA-5  | Query handler purity        | `.llm/tools/sagas/check-query-purity.ts`               | `onQuery` handler has no assignment expressions on `saga.state`                                                           | research §02.2.4           |
| F-SAGA-6  | No singletons               | `.llm/tools/sagas/check-singletons.ts`                 | No `get*Bus`, `set*Bus`, `reset*Bus`, `get*Registry`, `reset*Registry` exports                                            | drift E8/E9                |
| F-SAGA-7  | Composition root present    | `.llm/tools/sagas/check-composition-root.ts`           | `createSagaRuntime` is the only entry; no module-level state                                                              | doctrine 07                |
| F-SAGA-8  | Branded IDs                 | `.llm/tools/sagas/check-branded-ids.ts`                | All public APIs reference `SagaId<TId>` / `JobId<TId>`, not bare `string`                                                 | drift E2/E13               |
| F-SAGA-9  | Test-shape (deterministic)  | `.llm/tools/sagas/check-test-shape.ts`                 | Saga tests use `runSaga` / `TestSagaClock` / `MemorySagaBus`; no real transport in unit tests                             | `dsl-canon.md` §7          |
| F-SAGA-10 | Adapter parity              | `.llm/tools/sagas/check-adapter-parity.ts`             | `tests/parity/saga-bus-parity_test.ts` exists and passes for both `native` and `legacy`                                   | `migration-strategy.md` §7 |
| F-SAGA-11 | Observability spans named   | `.llm/tools/sagas/check-otel-spans.ts`                 | Spans match the spec in `architecture.md` §7                                                                              | architecture §7            |
| F-SAGA-12 | Registry ownership          | `.llm/tools/sagas/check-registry-ownership.ts`         | `plugins/workers/scaffold.runtime.json` contains no saga entry; `plugins/sagas/scaffolding/scaffold.runtime.json` owns it | drift E16/E23              |

## Reporting

Same states as `fitness-gates.md`: `PASS`, `FAIL`, `PENDING_SCRIPT`, `N/A`, `DEBT_ACCEPTED`. Manual
evidence acceptable in Phase A.

## Per-slice gate matrix (delta from `archetype-gate-matrix.md`)

| Slice family                         | Required F-SAGA gates        |
| ------------------------------------ | ---------------------------- |
| E1–E2 (scaffolding)                  | F-SAGA-1, F-SAGA-6, F-SAGA-7 |
| E3–E4 (builders, DSL)                | F-SAGA-1, F-SAGA-8           |
| E5 (ports)                           | F-SAGA-2, F-SAGA-7           |
| E6 (adapters, native engine)         | F-SAGA-2, F-SAGA-10          |
| E7–E8 (composition)                  | F-SAGA-6, F-SAGA-7           |
| E9–E14 (transports, stores)          | F-SAGA-2                     |
| E15 (telemetry)                      | F-SAGA-11                    |
| E16 (config)                         | —                            |
| E17 (testing helpers)                | F-SAGA-9                     |
| E18–E20 (docs, root barrel, surface) | F-SAGA-1, F-SAGA-2           |
| E21–E27 (plugin layer)               | F-SAGA-12                    |
| E28–E47 (consumer migration)         | F-SAGA-8                     |
| E48 NEW (idempotency dedup)          | F-SAGA-3                     |
| E49 NEW (concurrency keys)           | F-SAGA-3 (related)           |

## Phase A — Manual evidence templates

For each F-SAGA gate during Phase A, the slice's evidence row in `worklog.md` must include a short
manual check, e.g.:

```
F-SAGA-3: PASS — grep "send(" packages/plugin-sagas-core/src/ packages/plugin-sagas-core/tests/ | grep -v idempotencyKey returns 0 results
F-SAGA-6: PASS — grep -RE "(get|set|reset)Saga(Bus|Registry)\b" packages/plugin-sagas-core/ returns 0 results
F-SAGA-7: PASS — grep -RE "^let _" packages/plugin-sagas-core/src/ returns 0 results
F-SAGA-12: PASS — jq '.runtimeRegistries[] | select(.dir == "sagas")' plugins/workers/scaffold.runtime.json returns null
```

## Phase B — Script ownership

The scripts under `.llm/tools/sagas/` are owned by Group E. They must be:

- Deno scripts with explicit permissions.
- Registered in `.llm/tools/entry.md`.
- Composable into `deno task arch:check` once it lands.
- Documented in `.llm/harness/profiles/sagas/gates.md` (this file) when added.

## Relationship to F-13

F-13 (saga/runtime invariants) from `fitness-gates.md` is now the **umbrella gate** that aggregates
F-SAGA-1 through F-SAGA-12. Reporting can collapse to F-13 for non-sagas slices; sagas slices should
report the constituent F-SAGA gates individually.
