# plugins/ai Parity Review — #388

## Summary

`plugins/ai` is an ARCHETYPE-5 thin plugin, but thinness is not a lower quality bar. The beta.4
parity target is to meet the workers/sagas/triggers/streams plugin floor while keeping
convention-bearing AI route logic in `packages/plugin-ai-core`.

## Reference Checklist

| Bar | Workers/Sagas Reference | AI Parity State |
| --- | --- | --- |
| Thin plugin delegates conventions to core | `plugin-workers-core`, `plugin-sagas-core` own contracts; plugins wire manifests/resources. | `plugin-ai-core` owns `aiContractV1` and `createAiRouter`; `plugins/ai` emits userland glue. |
| `verify-plugin.ts` | Workers/sagas/triggers/streams ship plugin-owned verify scripts. | Added `plugins/ai/verify-plugin.ts` for contract/runtime-config axes. |
| Scaffolder golden coverage | Reference plugins cover registry/resources with deterministic tests. | AI tests cover the six current starter emitters: `models`, `barrel`, `tool`, `agent`, `stream-proxy`, `chat-route`. The issue's “7 emitters” count is stale against `aiStarterResources`. |
| Plugin doctor coverage | Plugin adapter metadata declares required config and doctor paths. | Doctor test covers missing and configured `ANTHROPIC_API_KEY`. |
| Contract-bound route implementation | Workers/sagas services bind oRPC contracts through typed handlers. | Generated AI stream route imports `aiContractV1` and exports a `createAiRouter(...)`-bound router. |
| Runtime E2E | Runtime plugins join `scaffold.runtime`. | Planned slice 4 adds AI default, `--persist-threads`, and stubbed `--mcp` variants. |
| Publishability | Runtime plugins are publishable JSR packages. | Planned slice 5 flips `plugins/ai` from `publish: false` to an exact publish surface and runs full JSR audit. |

## Deferred Scope

The `--mcp` scaffold.runtime variant is intentionally a beta.4 stub. Full MCP pooling and transport
depth are beta.6 FAI-7/8 scope and must be called out in the PR body.
