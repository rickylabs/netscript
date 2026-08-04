# Plan: sagas generated KV adapter registration

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sagas-kv-glue-registration--w2-f` |
| Branch | `fix/sagas-kv-glue-registration` |
| Phase | `plan` |
| Target | `plugins/sagas` generated runtime glue |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Archetype

Archetype 5 applies because the change is thin first-party plugin wiring. Runtime/behavior concerns
are folded into the plugin archetype and exercised through the service overlay. The connector will
register the existing core KV adapter at the generated composition edge; it will not redefine a KV
contract or move saga engine behavior.

## Current Doctrine Verdict

`plugins/sagas`: **Keep — doctrine-aligned shape already**. Preserve the plugin adapter/glue layer,
the existing public exports, and the sibling core contracts.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A10 | Generated `sagas/runtime.ts` is the composition edge where the adapter must be registered. |
| A12 | Full saga lifecycle, compensation, correlation, and persistence are the behavioral contract. |
| A13 | The background runner must have an observable healthy crash boundary, not silently die. |
| A14 | Generated-artifact, real-scaffold, OTEL, restart, and publish gates protect the shipped surface. |

## Goal

Fresh default-cache scaffolds emit a saga runner that registers the Redis adapter, starts healthy,
executes correlated terminal and compensating saga paths, and preserves durable state across a
runner restart, while `CACHE_PROVIDER=denokv` remains usable.

## Scope

- Add a RED-first semantic assertion over the emitted `sagas/runtime.ts` artifact.
- Capture the unfixed fresh-scaffold `KvConnectionError` before changing the stub.
- Add the adapter-registration import to the source stub.
- Prove default-cache and Deno-KV selection behavior, then execute the owner-set seven-step protocol.
- Run scoped framework, publishability, runtime, and serialized `scaffold.runtime` gates.

## Non-Scope

- No saga engine, correlation, builder/AST extractor (#1093), core store, or public export changes.
- No provider registry redesign or conditional source generation.
- No published-package confirmation; canary point 2 owns that post-local proof.
- No cleanup of foreign Postgres containers or protected `aspire mcp start` processes.

## Hidden Scope

- Health proof requires populated health reports, not a superficial Running/Healthy state.
- Runtime proof includes start, multiple steps, terminal state, compensation, correlation, OTEL
  traces/spans/logs, process restart, and post-restart state inspection.
- Evidence commands must preserve and inspect their artifacts rather than trusting pipeline status.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Add `import '@netscript/kv/redis';` to `runtime.stub.ts` before importing the runner. | The published KV subpath is the existing explicit registration seam and the stub is the regeneration authority. |
| D2 | Keep the import unconditional in the backend runner glue. | Registration has no effect on Deno-KV selection; conditional generation would duplicate provider policy and widen scope. |
| D3 | Test the collected install artifact contents, including import ordering. | This fails on the current bug and covers the emitted-glue path rather than the engine. |
| D4 | Use a fresh local-source scaffold under the run-owned worktree scratch root for RED and GREEN. | It is what the user receives while retaining precise ownership and safe teardown. |
| D5 | Preserve raw runtime/OTEL/state artifacts and quote decisive lines into `worklog.md` and PR evidence. | Exit codes and superficial health summaries are insufficient under the amended issue. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact saga API/CLI interaction shape | safe to defer | Discover from the generated project; does not affect the stub fix. |
| Exact health-report query command | safe to defer | Use Aspire JSON/resource APIs available in the generated AppHost. |
| Core/provider redesign | safe to defer | Explicitly out of scope; the existing registration seam is sufficient. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Real scaffold proves only startup, not lifecycle | Require terminal + compensation paths, OTEL step spans/correlation, restart durability, and stored-state inspection. |
| Shared-host contention creates false failures | Check `aspire ps`, processes, and ownership before each live/expensive run; serialize; never kill by pattern. |
| Redis import breaks frontend/SSR Deno KV | Prove `CACHE_PROVIDER=denokv` selects/opens Deno KV after the emitted import. |
| Evidence is lost or pipeline status is misleading | Store command artifacts under the run dir, inspect each output file, and quote decisive lines. |
| Existing JSR diagnostics get mistaken for regression | Baseline the 15 private-type refs and require no count/public-export change. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11 hidden global | risk | Keep registration explicit at the executable glue edge; do not open KV at module load. |
| AP-18 giant string snapshot | risk | Assert semantic import/order fragments on the emitted artifact, not a whole-source snapshot. |
| AP-19 silent permissions/provider assumption | existing defect | Register the declared KV dependency in generated backend glue and prove it against the provisioned cache. |
| AP-25 side effect in non-edge file | avoided | The registration side effect belongs in generated executable glue, an explicit edge. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-3/F-5/F-6/F-7/F-8/F-9/F-10/F-11/F-12/F-14/F-15/F-16/F-17/F-18/F-19 | yes | `quality:gate`, scoped wrappers, doc-lint baseline, targeted publish dry-run, review |
| F-13 saga/runtime invariants | yes | Generated-glue test plus real lifecycle, compensation, correlation, OTEL, restart evidence |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing sagas/runtime and plugin type-surface debt | none | No new or deepened debt; adjacent #1093 remains untouched. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED generated glue | focused `resources.test.ts` filter | Fails because emitted artifact lacks Redis registration. |
| 2 | RED real scaffold | fresh init + sagas install + AppHost start/log inspection | `KvConnectionError` captured from `sagas` runner. |
| 3 | GREEN generated glue | same focused test | Emitted artifact imports Redis registration before the runner. |
| 4 | Deno KV compatibility | focused execution with `CACHE_PROVIDER=denokv` after registration import | Deno-KV provider opens; no Redis connection attempted. |
| 5 | Static plugin gates | scoped check/lint/fmt wrappers on `plugins/sagas` | PASS, no new ignores/casts. |
| 6 | Doctrine/JSR | `deno task quality:gate`; doc-lint; targeted publish dry-run | PASS or unchanged documented baseline only. |
| 7 | Owner runtime protocol | Aspire health + lifecycle + compensation + OTEL + correlation + restart | All seven evidence steps truthfully proven. |
| 8 | Merge-readiness | one-pass `scaffold.runtime --cleanup --format pretty` | Explicit SUCCESS, serialized after live-owner preflight. |
| 9 | Hygiene | raw git/lock diff + `agentic:leak-check` | Only owned files; no `deno.lock` churn or owned leaks. |

## Dependencies

- Local-source NetScript CLI scaffold path and generated Aspire AppHost.
- Provisioned default Garnet/Redis cache.
- Existing `@netscript/kv/redis` subpath registration contract.

## Drift Watch

- Any need to touch core/store/provider-selection code or public exports.
- Missing generated health instrumentation that prevents populated reports.
- Lifecycle/OTEL failures unrelated to adapter registration.
- Shared-host owner appearing before a live or expensive gate.

