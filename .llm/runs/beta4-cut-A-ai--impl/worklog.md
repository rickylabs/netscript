# Worklog: AI Flagship Parity #388

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta4-cut-A-ai--impl` |
| Branch | `feat/ai-flagship-parity-388` |
| Archetype | `5 - Plugin Package` |
| Scope overlays | `service`, `docs` |

## Design

### Public Surface

- `packages/plugin-ai-core` exports an in-process `AiRouter` binder/implementation helper for the
  `/v1/ai` route contract.
- `plugins/ai` exports exact published subpaths: `.`, `./adapter-cli`, `./public`, `./plugin`,
  `./adapter`, `./scaffold`, `./contracts`.
- `plugins/ai/verify-plugin.ts` becomes the plugin-owned verification entrypoint.
- CLI E2E exposes `ai` as a scaffold.runtime gate/variant.

### Domain Vocabulary

- `AiRouter` — the context-bound oRPC implementer from `aiContractV1`.
- `AiRouteBinding` — generated/userland glue that maps app-owned model/tool functions to contract
  route handlers.
- `AiStarterEmitterId` — finite set of six scaffold emitters: `models`, `barrel`, `tool`, `agent`,
  `stream-proxy`, `chat-route`.
- `AiRuntimeVariant` — `default`, `persist-threads`, `mcp-stub`.

### Ports

- No new long-lived external port is introduced in beta.4. The router binder consumes existing
  `@netscript/ai` model/tool/agent abstractions and Web Platform request primitives.

### Constants

- `AI_STARTER_EMITTER_IDS` — six current starter resources.
- `AI_RUNTIME_VARIANTS` — `default`, `persist-threads`, `mcp`.
- Required config key — `ANTHROPIC_API_KEY`, sourced from plugin metadata.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Harness artifacts and plan gate | separate PLAN-EVAL PASS | `.llm/runs/beta4-cut-A-ai--impl/*` |
| 2 | Contract-bound router and scaffold output | targeted contract/golden tests | `packages/plugin-ai-core/**`, `plugins/ai/src/adapter/resources/**` |
| 3 | Plugin parity verification | verify script + plugin/golden/doctor tests | `plugins/ai/**`, relevant CLI/plugin tests |
| 4 | Scaffold.runtime AI E2E | targeted e2e registry/gate tests | `packages/cli/e2e/**` |
| 5 | Publishability and final gates | wrappers, doc lint, publish dry-run, full scaffold.runtime once | `plugins/ai/deno.json`, exports, run artifacts |

### Deferred Scope

- MCP pooling internals — beta.6 FAI-7/8; beta.4 lands a named stub variant only.
- Generative UI, reasoning/BYOK, skill loading, memory/retriever, and OTel adapter — later FAI
  slices.

### Contributor Path

To extend the AI plugin, add the convention-bearing type or route to `packages/plugin-ai-core`, then
wire it through a thin `plugins/ai` resource/generator and add a golden test. Runtime scaffold gates
live under `packages/cli/e2e/src/application/gates/scaffold/` with suite registry expectations in
the presentation tests.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-05 | 1 | Bootstrap | Read requested skills, doctrine, archetype gates, and FAI-0..3 design source. |
| 2026-07-05 | 1 | Research/plan | Re-baselined current branch and wrote run artifacts. |
| 2026-07-05 | 1 | Plan fix | PLAN-EVAL failed on incomplete gate mapping; expanded full Archetype 5 plus service/docs overlay gates. |
| 2026-07-05 | 2 | Contract binding | Added `createAiRouter` in `plugin-ai-core`, AI contract soundness test, and generated stream-route binding to `aiContractV1`. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Put router binding in core | Plugins stay thin; convention-bearing logic belongs in `plugin-ai-core`. | ARCHETYPE-5 thinness law |
| Six emitter goldens | `aiStarterResources` is the current truth; issue text's seven is stale. | `plugins/ai/src/adapter/plugin.ts` |
| Stub `--mcp` | Owner prompt permits beta.4 stub because pooling is beta.6. | owner prompt / FAI-2 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| PLAN-EVAL uses local separate evaluator if OpenHands is unavailable in this session. | minor | yes |
| User requires `commits.md`; harness docs say PR comments are canonical. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | separate evaluator over research/plan/design | NOT_RUN | Pending after artifact creation. |
| PLAN-EVAL cycle 1 | separate evaluator over research/plan/design | FAIL | Gate set mapping was incomplete. |
| PLAN-EVAL cycle 2 | separate evaluator over research/plan/design | PASS | `plan-eval.md` records PASS. |
| Slice 2 check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-ai-core --root plugins/ai --ext ts,tsx` | PASS | 35 files selected, 0 diagnostics. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-5/F-6/F-19 | NOT_RUN | pending | Run after implementation slices. |
| F-10 contract/resource tests | PASS | `deno test --unstable-kv packages/plugin-ai-core/tests/contracts/ai-contract-soundness_test.ts`; `deno test --unstable-kv plugins/ai/src/adapter/resources/resources.test.ts` | Contract soundness and generator resource assertions pass. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| scaffold.runtime ai | NOT_RUN | pending | Full suite once at end. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Generated app scaffold | NOT_RUN | pending | Covered by scaffold.runtime. |

## Handoff Notes

- Inspect the `stream-proxy.stub.ts` generated output first: it is the central false-done defect.
- Then verify `plugins/ai/deno.json` export map and publish dry-run.
