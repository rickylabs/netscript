# Plan: preserve TanStack usage detail at the owned chat boundary

## Run Metadata

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Run ID         | `fix-ai-usage-detail-passthrough--0.0.7`   |
| Branch         | `fix/ai-usage-detail-passthrough`          |
| Base           | `0274c0a707e36ded3b4470a3911315f963e642d4` |
| Phase          | `plan` — S1 artifact-only hard stop        |
| Target         | `packages/ai`                              |
| Archetype      | `4 — Public DSL / Builder`                 |
| Scope overlays | none                                       |

## Archetype

Doctrine assigns the whole `@netscript/ai` package to Archetype 4 even though this leaf repairs an
integration adapter inside it. The package remains one archetype: preserve its public DSL,
engine/port/composition split, and internal anti-corruption boundary. This leaf adds no runtime,
frontend, service, or docs overlay.

## Current Doctrine Verdict

`packages/ai` is **Keep**: “Preserve the engine/port/composition split.” The repair stays inside the
existing adapter and exercises it through an owned-port event; it creates no new seam or export.

## Axioms in Play

| Axiom | Why it matters                                                                                      |
| ----- | --------------------------------------------------------------------------------------------------- |
| A1    | The owned `Usage` contract is already authoritative; the adapter must conform without changing it.  |
| A2    | The published boundary remains owned and provider-neutral.                                          |
| A6    | Keep the justified anti-corruption mapper; do not add a second helper or translation layer.         |
| A8    | Put the regression in one focused test file; do not mix it into unrelated request-context coverage. |
| A9    | Preserve the package's assigned Archetype 4 shape.                                                  |
| A14   | A boundary regression test and static/publish gates make the mapping durable.                       |

## Goal

Make TanStack `RUN_FINISHED` usage reach `ChatFinishEvent.usage` without losing nested token detail,
cost, cost breakdown, or provider-specific detail, so consumers can perform cache-hit accounting and
read provider-reported cost. Bind the mapper parameter to the actual upstream `TokenUsage` shape,
eliminating the hand-written narrowing that caused the defect.

## Consequence

Today cache-hit/cache-write accounting, reasoning-token accounting, and provider-reported cost are
structurally impossible for consumers of the owned per-turn event: the data is discarded at the
single anti-corruption boundary before it enters `Usage`. The repair preserves the provider's object
at that boundary. It does not redefine terminal multi-turn aggregation.

## Locked product path ceiling

Implementation is permitted to touch exactly these two product/test paths:

1. `packages/ai/src/adapters/tanstack-chat-client.ts`
2. `packages/ai/tests/tanstack_chat_client_test.ts` (new)

Run artifacts under `.llm/runs/fix-ai-usage-detail-passthrough--0.0.7/` do not count against the
product ceiling. No other path under `packages/ai`, and no path outside `packages/ai`, may change.
In particular, `packages/ai/src/contracts/usage.ts`, every entrypoint/`deno.json`, documentation,
`deno.lock`, and the generated MCP export-surface corpus are locked. If implementation needs any
such path or produces export-surface corpus churn, stop and return a scope discovery to the
supervisor.

## Scope

- Import upstream `TokenUsage` as a type from `@tanstack/ai` in the existing bridge.
- Type `toOwnedUsage` with `TokenUsage | undefined`, not a hand-listed structural subset.
- Preserve the usage object unchanged when defined; preserve `undefined` unchanged.
- Add a dedicated fake-adapter regression test at the real `chat()`/`RUN_FINISHED` boundary.
- Re-run the package-scoped static, doctrine, JSR, and lock gates with base-red non-increase rules.

## Non-Scope

- Public `Usage`/detail contracts or exports.
- Typed owned fields for upstream `durationSeconds`, `unitsBilled`, prompt/completion `videoTokens`,
  or completion `documentTokens`.
- Agent-loop terminal aggregate semantics.
- Direct OpenAI embeddings/vision raw-wire usage parsing.
- MCP mapping, provider SDK changes, dependency/version changes, docs, generated corpus, scaffold,
  E2E, Aspire, Docker, or any runtime lease.
- PR creation, label mutation, PLAN-EVAL disposition, implementation, or test-code changes in S1.

## Hidden Scope

- The upstream type must come from the resolved dependency rather than a local alias or remembered
  shape. `deno doc` proves `TokenUsage` and `RunFinishedEvent.usage` at 0.39.0.
- The regression fixture must populate all 23 upstream leaf fields, including the five fields with
  no typed owned home, so a future upstream-compatible narrowing cannot hide behind the currently
  owned subset.
- Existing doc-lint, JSR slow-type, and folder-cardinality reds are explicit non-increase contracts,
  not work for this leaf.

## Locked Decisions

| ID | Decision                                                                                                    | Rationale                                                                                                                                                                                                    |
| -- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1 | Use imported `TokenUsage` for the mapper parameter.                                                         | It is the actual upstream contract and evolves with the dependency; another hand-written list would recreate the defect class.                                                                               |
| D2 | Return the defined upstream object unchanged as `Usage`.                                                    | Structural compatibility maps every owned field and zero-copy identity preserves nested/provider objects plus upstream-only fields. Rebuilding or spreading the object creates another omission point.       |
| D3 | Do not add or re-key fields in the owned contract.                                                          | #1677 is a mapping defect. Moving standardized upstream-only fields into `providerUsageDetails` would invent naming/duplication policy; typed support is safely deferred.                                    |
| D4 | Test through `toTanstackChatClient` with a fake `AnyTextAdapter` yielding a fully populated `RUN_FINISHED`. | This exercises the real boundary and call site instead of unit-testing a private helper or exporting it for tests.                                                                                           |
| D5 | Use both a positive identity/deep-equality assertion and a mutation-control negative.                       | Identity proves no reconstruction; deep equality proves all nested leaves; the negative feeds the old core-only projection to the same completeness oracle and proves the oracle would catch the regression. |
| D6 | Leave `done.usage` aggregation unchanged.                                                                   | Per-turn usage already forwards unchanged. Aggregating non-additive provider details and cost breakdowns needs a separate contract decision.                                                                 |
| D7 | Create a dedicated test file.                                                                               | Usage passthrough is one concern and should not be coupled to request-context or provider-wire tests.                                                                                                        |
| D8 | Select PLAN-EVAL and stop after S1.                                                                         | The brief explicitly reserves disposition to a separate supervisor/evaluator session; this generator does not self-certify.                                                                                  |

## Test design

The new test constructs a typed `TokenUsage` with distinct sentinel values for every upstream leaf:
three core totals; seven prompt-detail fields; six completion-detail fields; duration; units billed;
cost; three cost-detail fields; and a nested provider-details bag. A minimal `AnyTextAdapter` yields
one `EventType.RUN_FINISHED` event carrying that exact object.

The assertions are:

1. exactly one owned `finish` event is observed and its reason maps normally;
2. `assertStrictEquals(finish.usage, upstreamUsage)` proves the boundary returned the same object;
3. `assertEquals(finish.usage, upstreamUsage)` and an explicit recursive leaf-path census prove all
   nested data remains intact;
4. a mutation-control negative presents the old three-field projection to the same completeness
   assertion and requires that assertion to throw. This demonstrates that dropping any fixture leaf
   makes the regression guard fail rather than pass vacuously;
5. a separate undefined-usage case verifies omission stays omission.

## Open-Decision Sweep

| Decision                     | Status        | Notes                                                                                           |
| ---------------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| Mapper input type            | resolved now  | `TokenUsage`, proven by `deno doc`.                                                             |
| Copy versus identity         | resolved now  | Zero-copy identity is the only design without a new omission list.                              |
| Upstream-only typed homes    | safe to defer | Retained at runtime; adding owned fields is contract scope and not needed for #1677 acceptance. |
| Multi-turn aggregate details | safe to defer | Separate semantic leaf; per-turn detail is restored here.                                       |
| Docs/consumer edits          | resolved now  | None assert a three-field per-turn shape.                                                       |
| Test placement               | resolved now  | Dedicated ceiling-listed boundary test.                                                         |

No unresolved decision would force implementation rework.

## Commit Slices

| # | Slice                                | What it proves                                                                                                                                              | Gate                                                            | Files                                                                                                               |
| - | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1 | Bind and preserve upstream usage     | The real upstream type crosses the owned boundary without reconstruction, and a fully populated event plus mutation control prevents field-drop regression. | Focused test; scoped check/lint/fmt                             | `packages/ai/src/adapters/tanstack-chat-client.ts`, `packages/ai/tests/tanstack_chat_client_test.ts`, run artifacts |
| 2 | Package-quality and surface sign-off | No doctrine/JSR/public-surface/lock regression and all base reds satisfy exact non-increase contracts.                                                      | Gate table below; substantive supervisor review before sign-off | Run artifacts only                                                                                                  |

Both implementation slices occur only after separate-session PLAN-EVAL `PASS`. Slice commits,
pushes, phase comments, and final IMPL-EVAL are supervisor-owned later phases, not S1 actions.

## Risk Register

| Risk                                                                         | Mitigation                                                                                                                                   |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| An upstream release adds fields and another mapper list drops them.          | Type the parameter as upstream `TokenUsage`, return by identity, and populate/census the resolved shape in the regression fixture.           |
| Structural assignability accidentally leaks TanStack into the published API. | Type-only import in an internal file; unchanged owned return type; require identical public surface counts/signatures and zero corpus churn. |
| Test passes without traversing the real bridge.                              | Drive `toTanstackChatClient().stream()` through fake `chatStream` and a real `RUN_FINISHED` event.                                           |
| Equality test is vacuous or only checks core fields.                         | Fully populated distinct sentinels, recursive path census, strict identity, and old-mapper mutation control.                                 |
| Scope expands to terminal aggregation or raw provider parsers.               | Locked two-path ceiling; record those seams as deferred and stop on any additional path need.                                                |
| Existing package reds are misreported as regressions or promised greens.     | Compare exact per-entrypoint/finding counts to the measured base table.                                                                      |
| Validation mutates the lock.                                                 | Hash `deno.lock` before/after; byte mismatch is a hard failure and must not be accepted.                                                     |

## Anti-Patterns to Resolve or Avoid

| AP    | Status       | Plan                                                                                                 |
| ----- | ------------ | ---------------------------------------------------------------------------------------------------- |
| AP-2  | risk avoided | Do not add a generic copier/helper; correct the existing justified adapter seam.                     |
| AP-9  | defect/risk  | Remove the premature local subset type; use the upstream contract directly at the external boundary. |
| AP-14 | risk avoided | Type-only internal import; never re-export `TokenUsage`.                                             |
| AP-22 | risk avoided | No barrel or subpath change.                                                                         |
| AP-25 | risk avoided | Fake adapter only; no network, environment, or load-time side effect.                                |

## Fitness and gate baseline table

Every baseline below was measured at the base SHA. Pre-existing reds are exact non-increase
contracts.

| Order | Gate / fitness coverage            | Base measurement                                                                              | S2 command or check                                                                                                                                    | Acceptance                                                                                                      |
| ----- | ---------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 1     | Regression behavior / F-10         | New test absent; 20 package tests counted; not executed in static-only S1                     | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/ai/tests/tanstack_chat_client_test.ts`            | Focused positive, mutation-control negative, and undefined case pass.                                           |
| 2     | Static check / F-19                | PASS; 100 files; 0 occurrences                                                                | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/ai --ext ts,tsx`                                                       | PASS; 0 occurrences.                                                                                            |
| 3     | Lint / F-1, F-10, F-12, F-14, F-19 | PASS; 100 files; 0 findings                                                                   | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/ai --ext ts,tsx`                                                        | PASS; 0 findings.                                                                                               |
| 4     | Format / F-19                      | PASS; 100 files; 0 findings                                                                   | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/ai --ext ts,tsx`                                                         | PASS; 0 findings.                                                                                               |
| 5     | Quality scan                       | PASS; 0 findings; 0 allowances                                                                | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/ai --max-allow 0`                                                       | PASS; no finding or allowance.                                                                                  |
| 6     | Doctrine / F-1–F-5, F-8–F-19       | exit 0; one F-16 warning (`src/ports`=13 children)                                            | `deno run --allow-read --allow-run .llm/tools/fitness/check-doctrine.ts --root packages/ai --text`                                                     | exit 0; same single warning and count, no new warning.                                                          |
| 7     | Full-export doc lint / F-5, F-7    | exit 1; 9 entrypoints, 128 private refs, 0 missing JSDoc; exact distribution in `research.md` | `deno task doc:lint --root packages/ai --pretty`                                                                                                       | No new failing entrypoint; every private-ref count ≤ its baseline; missing JSDoc remains 0. Exit 1 may persist. |
| 8     | JSR/publish dry-run / F-6, F-7     | exit 0; dry-run OK; 1 slow warning; 2 findings; exact export counts in `research.md`          | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/ai --text`                                      | exit 0; dry-run OK; slow warnings ≤1; findings ≤2; exact export counts/signatures unchanged.                    |
| 9     | Consumer boundary                  | Per-turn owned event currently loses details                                                  | Focused regression event through `ChatClientPort.stream`                                                                                               | Fully populated `TokenUsage` is the identical owned `Usage` object.                                             |
| 10    | Export/corpus ceiling / F-5, F-15  | 13 exports with recorded counts; contracts doc JSON baseline unchanged; no corpus diff        | Inspect `git diff -- packages/ai packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` and compare package audit surface | Only the two ceiling paths change; no entrypoint/contract/corpus change. Any corpus churn is STOP/RESCOPE.      |
| 11    | Lock hygiene                       | SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`                    | `sha256sum deno.lock` plus raw Git status                                                                                                              | Exact hash; no lock diff.                                                                                       |

Runtime/Aspire, browser, scaffold, CLI E2E, Docker, dependency, and release gates are N/A because
the leaf changes an internal pure mapping and focused test only. No runtime lease is requested.

## Arch-Debt Implications

| Entry                                          | Action                  | Notes                                                                |
| ---------------------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| Existing `packages/ai/src/ports` F-16 warning  | none                    | Measured base red; this leaf neither owns nor deepens it.            |
| Existing package slow/private-type diagnostics | none                    | Exact non-increase gates; no new debt accepted.                      |
| Agent-loop terminal aggregate detail           | defer outside this leaf | Semantic product decision, not a doctrine violation discovered here. |

## Dependencies

- Existing locked `@tanstack/ai@0.39.0` resolution only. No dependency or lock change.
- Separate-session PLAN-EVAL is the hard stop before S2.

## Drift Watch

- Any need to edit a third product/test path, any path outside `packages/ai`, or any public
  contract/export/corpus path is significant scope drift: stop and report.
- Any resolved `TokenUsage` version/shape different from the S1 evidence requires research and
  field-map refresh before implementation.
- Any baseline count increase is a regression, even when the command remains pre-existing red.
- Do not reinterpret terminal `done.usage` core aggregation as fixed by this leaf.

## Deferred Scope

- Typed owned representation of TanStack's five newer no-home fields.
- Multi-turn aggregation rules for details/cost/provider data.
- Rich usage parsing for direct embeddings/vision wire adapters.
- Any documentation explaining those future contracts.

## PLAN-EVAL handoff

PLAN-EVAL is selected and must run in a separate evaluator session. S1 stops here. This generator
does not write `plan-eval.md`, issue a verdict, implement code, or claim approval.
