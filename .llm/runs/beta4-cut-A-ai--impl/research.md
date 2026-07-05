# Research — beta4-cut-A-ai--impl

## Re-Baseline

- Carried-in source: `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md`
  sections FAI-0 through FAI-3, plus the owner prompt.
- Re-derived against current worktree on `feat/ai-flagship-parity-388`; branch was clean at start.
- Current branch still matches the carried-in defects:
  - `plugins/ai/src/adapter/resources/stream-proxy/stream-proxy.stub.ts` emits a raw `Request` to
    `Response` POST handler using `@netscript/ai/agent`, not `aiContractV1`.
  - `plugins/ai/src/adapter/plugin.ts` lists six starter emitters, not seven.
  - `plugins/ai` has no `verify-plugin.ts`; workers/sagas/triggers/streams do.
  - `plugins/ai/deno.json` still has `"publish": false`.
  - `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` has runtime gates for sibling
    plugins but no AI variant.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `plugin-ai-core` already exports the real `aiContractV1` and `AiRouter` types. | `deno doc --filter AiRouter packages/plugin-ai-core/mod.ts` |
| 2 | The scaffolded stream proxy bypasses the contract and returns a raw HTTP handler. | `plugins/ai/src/adapter/resources/stream-proxy/stream-proxy.stub.ts` |
| 3 | The actual AI starter-resource count is six: `models`, `barrel`, `tool`, `agent`, `stream-proxy`, `chat-route`. | `plugins/ai/src/adapter/plugin.ts` |
| 4 | The AI plugin doctor path already declares `ANTHROPIC_API_KEY` as required config, but lacks a test that exercises it. | `plugins/ai/src/adapter/plugin.ts` |
| 5 | Reference plugins ship `verify-plugin.ts` and runtime manifests; AI lacks the verify script. | `plugins/workers/verify-plugin.ts`, `plugins/sagas/verify-plugin.ts`, `plugins/triggers/verify-plugin.ts`, `plugins/streams/verify-plugin.ts` |
| 6 | `plugins/ai` is intentionally unpublished today. | `plugins/ai/deno.json` |

## jsr-audit Surface Scan

- Surfaces scanned/planned:
  - `packages/plugin-ai-core` existing export map, including `.` and `./contracts/v1`.
  - `plugins/ai` planned full export map: `.`, `./adapter-cli`, `./public`, `./plugin`,
    `./adapter`, `./scaffold`, `./contracts`.
- Risks:
  - `plugins/ai` must flip from `publish: false` to a publish include/exclude map.
  - Every new importable subpath needs an exact `exports` key; no wildcards.
  - Generated assets must use import attributes where static text/JSON embedding is needed; no
    `Deno.readTextFile`/`fromFileUrl` runtime reads.
  - Internal imports inside `plugins/ai` must stay relative and avoid self-referential bare
    `jsr:@netscript/plugin-ai/...` imports.
  - Full-map `deno doc --lint`, plugin-local `deno publish --dry-run --allow-dirty`, and root
    `deno task publish:dry-run` are required evidence.

## Open Questions

- `--mcp` scaffold.runtime variant can be stubbed because MCP pooling is beta.6. Decision: stub now,
  record drift, and call it out in the PR body.
- PLAN-EVAL launch path: use a separate local evaluator agent if no OpenHands tool is callable in
  this session; do not self-certify.
