# Context Pack: #1452 Slice 3 plugin service host context

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-plugin-service-context-s3--1452` |
| Branch | `feat/plugin-service-context-s3` |
| Current phase | `sign-off` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | none |

## Current State

The single implementation slice passed supervisor review and all pre-commit gates. The generic
context assembles caller-resolved appsettings/environment once while retaining lazy memoized DB/KV.
The unchanged CLI template was materialized at its real generated path and booted the real
workers/auth/sagas factories to healthy listeners, then stopped all three. PLAN-EVAL remains N/A.

## Completed

- Read live issue #1452 and merged Slice 1/2 evidence.
- Inspected the public surface with `deno doc` before source.
- Read harness, doctrine file 11, CLI, Deno toolchain, PR, JSR, and gate guidance.
- Recorded pre-work hashes and four-row audit.

## In Progress

- Sign-off commit, post-commit carrier checks, and mandatory separate-session IMPL-EVAL.

## Next Steps

1. Commit the reviewed implementation, carrier, and gate evidence.
2. Verify every carrier `check:*` against the commit.
3. Push and atomically open the required non-draft PR with labels/milestone.
4. Run the separate-session IMPL-EVAL and publish its structured PR comment.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Optional async appsettings/environment resolvers | plan LD-1/LD-2 | No config/Aspire/KV dependency |
| Opaque appsettings type | plan LD-3 | Consumers own schemas |
| CLI untouched | audit row 4 / owner constraint | Test consumes existing template |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-plugin-service-context-s3--1452/*` | new | Harness bootstrap/research/design context |
| `packages/plugin/src/sdk/runtime/plugin-service-context.ts` | modified | Optional opaque appsettings contract |
| `packages/plugin/src/sdk/runtime/plugin-service-context-factory.ts` | modified | Optional async appsettings/environment resolvers; eager one-shot assembly values, lazy DB/KV |
| `packages/plugin/src/sdk/runtime/plugin-service-context-factory_test.ts` | modified | Resolver timing/counts and default environment proof |
| `packages/plugin/src/sdk/runtime/plugin-service-context-generated-consumer_test.ts` | new | Verbatim generated template plus real workers/auth/sagas ready/stop proof |
| `plugins/auth/services/src/init.ts` | modified | Runtime structural narrowing of opaque appsettings; no unsafe cast |
| `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` | regenerated | Public SDK corpus signature/JSDoc carrier; 7,816 symbols unchanged |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | plugin/auth check, lint, fmt all exit 0; full plugin test 97/97 |
| Fitness | PASS_WITH_BASELINE | doc lint 15→15; JSR findings 7→7; publish/docs/quality/arch verdict gates pass |
| Runtime | N/A | owner forbids hosted runtime; focused real-listener consumer proof passed instead |
| Consumer | FOCUSED_PASS | wrapper exit 0: 3 passed, 0 failed, 0 ignored; three real listeners healthy and stopped |

## Open Questions

- None. The unchanged generated template proved all three service boots without a scaffolded
  project.

## Drift and Debt

- Drift: RTK missing; owner non-draft PR-open override; auth required a plugin-local structural
  narrowing edit beyond the planned package-local file ceiling.
- Debt: no new debt; unrelated package debts unchanged.

## Commits

- Sign-off commit pending. The owner requires a non-draft PR after local sign-off.
