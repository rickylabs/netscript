# Research — W2-A #1325 generated trigger KV bootstrap

## Re-baseline

- Carried-in sources: issue #1325, `preflight.md`, and the former prepared `supervisor.md`.
- Re-derived against `origin/main@c383b2e84c254d90bab8c4f9ffcbf43a7beb8652` on 2026-08-08.
- The defect remains: `plugins/triggers/src/adapter/resources/glue/runtime.stub.ts` imports the
  trigger runtime but never registers Redis; the saga sibling imports `@netscript/kv/redis` first.
- The old supervisor preparation is obsolete: the owner supplied a new branch/worktree, baseline,
  and native Claude evaluator route.
- The referenced `_shared-brief-contract.md` is absent in this worktree. Its fully inlined copy in
  the owner brief is the active contract.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `@netscript/kv` is the canonical provider authority: `autoDetectProvider()` resolves `CACHE_PROVIDER` and Aspire connection variables. | `packages/kv/application/auto-detect.ts` |
| 2 | `registerKvAdapter()` and the private registry are the canonical registration authority; `@netscript/kv/redis` self-registers the Redis factory. | `packages/kv/application/shared.ts`; `packages/kv/redis.ts`; `deno doc packages/kv/mod.ts` |
| 3 | Deno KV is built into the shared lifecycle; Redis/Garnet is intentionally opt-in to keep `ioredis` out of frontend graphs. | `packages/kv/application/shared.ts` |
| 4 | Saga generated glue imports `@netscript/kv/redis` before its runtime import; its test is currently text/order-only and does not prove registration is active. | `plugins/sagas/src/adapter/resources/glue/runtime.stub.ts`; `resources.test.ts` |
| 5 | Trigger generated glue has no provider bootstrap and its resource tests have no runtime registration assertion. | `plugins/triggers/src/adapter/resources/glue/runtime.stub.ts`; `resources.test.ts` |
| 6 | Current scaffold runtime gates wait on resources and inspect topology, but plugin registry generation names workers and sagas only; there is no enumerated KV-runtime health invariant covering sagas and triggers under both provider selections. | `packages/cli/e2e/src/application/gates/scaffold/behavior-plugins-health-gate.ts`; `runtime-gates.ts` |
| 7 | Issue #1325 is open, milestone `0.0.5`, with six unchecked acceptance boxes. | `gh issue view 1325 --repo rickylabs/netscript --json ...` |
| 8 | Workers, sagas, and triggers are the KV-backed first-party background runtimes. Workers' generated/explicit runtime already imports Redis; saga generated glue does too; triggers generated glue does not. | `plugins/workers/bin/runtime.ts`; `plugins/*/src/runtime`; focused `rg getKv` evidence |

## Doctrine and accepted debt

- Archetype: **5 — Plugin Package**, with `SCOPE-service.md` because generated background/Aspire
  runtime behavior is owned.
- Current doctrine verdict: `plugins/triggers` = **Refactor** (“Confirm `verify-plugin.ts` exists”).
- Accepted verification-shape debt: `plugins/triggers — doctrine verdict Refactor`, open, F-3/F-9/F-11.
  The file exists today; this slice will run it but will not restructure the plugin.
- Accepted connector-convergence debt: `triggers-connector-sound-deferred`, open. The raw Hono/HMAC
  service remains outside this runtime-bootstrap fix; no service-contract or router work is allowed.
- Thinness/parity law: cache selection and adapter registration remain in `@netscript/kv`; plugin
  code only composes the core entrypoint into generated userland glue.

## jsr-audit surface scan

- Scanned: `deno doc packages/kv/mod.ts`, `packages/plugin-triggers-core/mod.ts`,
  `plugins/triggers/mod.ts`, and `plugins/sagas/mod.ts`, plus their export maps.
- Planned product change adds no plugin export or export-map entry. Generated glue and E2E contracts
  change, so full plugin doc-lint/publish dry-run remain required; no new slow-type risk is expected.
- The existing plugin surface is small and documented. Any new core/public inspection API is
  rejected unless PLAN-EVAL proves the behavioral test cannot be built through existing seams.

## Open questions

- None that may force implementation rework. The behavioral RED probe imports emitted glue without
  entering its `import.meta.main` process loop, then calls `getKv()` under forced Redis selection.
  The pre-network core failure distinguishes an absent/inert registration from an effective one;
  real connectivity is separately proved by generated Aspire health. If this cannot be implemented
  without a new public inspection hook, stop and return to plan rather than inventing it mid-slice.
