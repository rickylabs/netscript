# Worklog: preserve TanStack usage detail

## Run Metadata

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Run ID         | `fix-ai-usage-detail-passthrough--0.0.7`   |
| Branch         | `fix/ai-usage-detail-passthrough`          |
| Base           | `0274c0a707e36ded3b4470a3911315f963e642d4` |
| Archetype      | `4 — Public DSL / Builder`                 |
| Scope overlays | none                                       |
| Current phase  | S1 research/plan; artifact-only            |

## Design

### Public Surface

- No exported function, type, entrypoint, builder chain, or consumer import changes.
- `ChatClientPort.stream()` continues returning owned `ChatClientEvent`; `ChatFinishEvent.usage`
  continues using owned `Usage`.
- `TokenUsage` is a type-only internal adapter input. It must not appear in `deno doc` output.

### Domain Vocabulary

- `TokenUsage` — actual upstream `@tanstack/ai@0.39.0` usage shape accepted at the boundary.
- `Usage` — existing owned provider-neutral contract returned across the boundary.
- `ChatFinishEvent` — existing owned per-turn event whose usage must retain all upstream data.
- `fullyPopulatedUsage` — test fixture with a distinct value at every upstream leaf.
- `usageLeafPaths` — test-only census that prevents a partial fixture or partial assertion.

No new product domain type is introduced.

### Ports

- Existing `ChatClientPort` is the exercised owned seam.
- Existing `AnyTextAdapter` is the external adapter seam used only by the fake fixture.
- No new port, registry, abstraction, or dependency.

### Constants

- Test-only sentinel values for all 23 upstream leaf paths.
- Expected `RUN_FINISHED`/`finish` discriminants.
- No product constant.

### Mapping design

`toOwnedUsage(usage: TokenUsage | undefined): Usage | undefined` returns `usage` unchanged. This
maps every structurally compatible owned field without a hand-maintained list and retains all
upstream-only properties in the runtime object. `undefined` remains `undefined`. The return type
stays owned, so no upstream type leaks into consumers.

The five upstream fields without a typed owned home (`durationSeconds`, `unitsBilled`, prompt and
completion `videoTokens`, completion `documentTokens`) are retained but not promoted into the public
contract. Typed access is deferred; `providerUsageDetails` remains reserved for the provider bag
already supplied upstream rather than becoming a duplicate standardized-field namespace.

### Commit Slices

| # | Slice                                                                                                                                                                          | Gate                                                                         | Files                                                                                                               |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1 | Replace the local three-field input type with upstream `TokenUsage`; preserve identity; add fully populated positive, mutation-control negative, and undefined boundary cases. | Focused wrapper test; scoped check/lint/fmt                                  | `packages/ai/src/adapters/tanstack-chat-client.ts`; `packages/ai/tests/tanstack_chat_client_test.ts`; run artifacts |
| 2 | Record non-increase gate evidence and supervisor substantive review.                                                                                                           | Doctrine, quality, doc lint, JSR audit/surface, lock and path-ceiling checks | Run artifacts only                                                                                                  |

No slice may begin until a separate evaluator writes PLAN-EVAL `PASS`.

### Deferred Scope

- Typed owned homes for newer TanStack quantity/media fields — public contract decision.
- Terminal agent-run detail aggregation — non-additive semantic decision.
- Direct embeddings/vision rich wire usage — different adapter contracts.

### Contributor Path

For future TanStack usage changes, inspect the resolved upstream shape with
`deno doc --filter TokenUsage npm:@tanstack/ai@<resolved-version>`, update the fully populated
fixture/path census if upstream adds a leaf, and keep `toOwnedUsage` zero-copy. If typed consumer
access is needed for an upstream-only field, design it first in `src/contracts/usage.ts` under a
separate contract leaf; do not add another mapper-side field list.

## Progress Log

| Time (UTC) | Slice | Step          | Notes                                                                                                                                            |
| ---------- | ----- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-31 | S1    | Bootstrap     | Harness, doctrine, Deno-toolchain, PR, repo-tooling, RTK, and JSR instructions loaded. RTK binary was unavailable; focused shell fallback used.  |
| 2026-08-31 | S1    | Re-baseline   | Clean branch, `HEAD`, and `merge-base HEAD main` all confirmed at `0274c0a707e36ded3b4470a3911315f963e642d4`; stale issue path corrected.        |
| 2026-08-31 | S1    | Research      | Resolved `@tanstack/ai@0.39.0` `TokenUsage` and nested types through `deno doc`; mapped every upstream field to owned home or explicit deferral. |
| 2026-08-31 | S1    | Sibling sweep | MCP has no usage mapper; direct embeddings/vision use other wire shapes; terminal loop aggregate is separate deliberate core-only semantics.     |
| 2026-08-31 | S1    | Baselines     | Static package wrappers, doctrine, quality, full-export doc lint, JSR audit/dry-run, surface counts, and lock hash measured.                     |
| 2026-08-31 | S1    | Design        | Two-path product ceiling and two implementation slices locked. No product/test code changed.                                                     |

## Decisions

| Decision                        | Reason                                                                                                  | Source                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Archetype 4 / Keep              | Doctrine assigns the package, not individual files, one archetype.                                      | Doctrine 06/10 and Archetype 4 profile               |
| Upstream type, zero-copy return | Removes the omission list and preserves identity/nested fields.                                         | `deno doc` plus structural comparison                |
| No public contract edit         | All #1677 named fields already have owned homes; extra upstream fields can be retained and typed later. | `src/contracts/usage.ts`; field map in `research.md` |
| Dedicated boundary test         | One concern, real `chat()` seam, no private helper export.                                              | Existing fake-adapter pattern; A8/A14                |
| Terminal aggregate deferred     | Costs/provider bags/units require explicit aggregation semantics.                                       | `src/agent/loop.ts`; package architecture docs       |
| PLAN-EVAL selected              | Supervisor owns disposition; generator/evaluator separation is mandatory.                               | Leaf brief and harness plan protocol                 |

## Drift

| Drift                                                                    | Severity                                         | Logged in drift.md                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| Stale issue path corrected to `src/adapters/tanstack-chat-client.ts`.    | minor                                            | No separate artifact requested; recorded in `research.md`.                        |
| Resolved upstream shape has five newer fields without typed owned homes. | significant research finding, no scope expansion | No separate artifact requested; recorded and deferred in `research.md`/`plan.md`. |
| RTK command unavailable.                                                 | minor tooling                                    | Recorded here; focused fallback used.                                             |

## Gate Results

### Static Gates (S1 baseline only)

| Gate                 | Command or check                                 | Result                  | Notes                                                                                          |
| -------------------- | ------------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Base identity        | raw Git via `deno eval`                          | PASS                    | Clean base/merge-base `0274c0a...`; non-shallow.                                               |
| Check                | scoped check wrapper, `packages/ai`, `ts,tsx`    | PASS                    | 100 selected; 0 occurrences.                                                                   |
| Lint                 | scoped lint wrapper, `packages/ai`, `ts,tsx`     | PASS                    | 100 selected/processed; 0 findings.                                                            |
| Format               | scoped format wrapper, `packages/ai`, `ts,tsx`   | PASS                    | 100 selected/processed; 0 findings.                                                            |
| Full-export doc lint | `deno task doc:lint --root packages/ai --pretty` | BASE RED                | exit 1; 9 entrypoints; 128 private refs; 0 missing JSDoc. Exact distribution in `research.md`. |
| JSR audit/dry-run    | package audit tool                               | PASS WITH BASE WARNINGS | exit 0; dry-run OK; 1 slow warning; 2 findings.                                                |
| Lock                 | SHA-256                                          | PASS                    | `edfa0c24...89d1820c`.                                                                         |

### Fitness Gates

| Gate                     | Result                 | Evidence                     | Notes                                                         |
| ------------------------ | ---------------------- | ---------------------------- | ------------------------------------------------------------- |
| Code quality             | PASS                   | package-scoped scanner       | 0 findings, 0 allowances.                                     |
| Doctrine F-1–F-19        | PASS WITH BASE WARNING | package-scoped doctrine scan | exit 0; existing F-16 `src/ports` count 13 only.              |
| F-5/F-7 public docs      | BASE RED               | full-export doc lint         | Exact non-increase, not promised green.                       |
| F-6 JSR publishability   | PASS WITH BASE WARNING | JSR audit dry-run            | Existing one slow warning; no new surface risk.               |
| F-10 regression behavior | NOT RUN                | New test absent at base      | S1 is static/artifact-only; S2 must run focused wrapper test. |

### Runtime Gates

| Gate                       | Result | Evidence        | Notes                                    |
| -------------------------- | ------ | --------------- | ---------------------------------------- |
| Aspire/scaffold/E2E/Docker | N/A    | Leaf constraint | No runtime lease; explicitly prohibited. |
| Provider network           | N/A    | Test design     | Fake adapter; no network.                |

### Consumer Gates

| Consumer                         | Result            | Evidence                                 | Notes                                         |
| -------------------------------- | ----------------- | ---------------------------------------- | --------------------------------------------- |
| Owned per-turn event             | PLANNED           | fully populated boundary test            | Must preserve object identity and all leaves. |
| Public surface                   | BASELINE RECORDED | 13 export symbol counts in `research.md` | Any change/corpus churn is STOP.              |
| Terminal multi-turn `done.usage` | N/A / deferred    | current code/docs                        | Remains core-only aggregate.                  |

## S1 Handoff Notes

- Read `research.md`'s field map first, especially the five newer upstream fields.
- Verify the two-path ceiling and zero-copy identity decision in `plan.md`.
- Apply the Plan-Gate checklist in a separate evaluator session and write the disposition there;
  this session stops without PLAN-EVAL or implementation.
- Base reds must remain exact non-increase contracts. Do not turn them into unrelated cleanup.
