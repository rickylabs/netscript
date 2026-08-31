# Research — GLM 5.3 Flash / Qwen 3.8 Flash default open-model routing

## Re-baseline

- Carried-in source: issue #1791, `brief.md`, and the bootstrap `context-pack.md`.
- Re-derived against `main` @ `a3ddcbb598f81180437e06f743e24d6ef137b101` on 2026-08-30.
- Branch bootstrap head before implementation: `bc1b2f88b53e71184ab2ca75dcf54cc2d5f6928d`.
- The merge-base is exactly the owner-specified baseline. The existing bootstrap commit adds only
  this run's `brief.md` and `context-pack.md`; `codex-thread-ids.md` was present untracked and is
  preserved as run-owned launch evidence.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Both owner-selected model IDs are live in the OpenRouter catalog. GLM 5.3 Flash is mandatory-reasoning with `max` supported/default; Qwen 3.8 Flash supports reasoning and tools. | 2026-08-30 public `GET https://openrouter.ai/api/v1/models`; `z-ai/glm-5.3-flash=true`, `qwen/qwen3.8-flash=true`. |
| 2 | The catalog contains only `qwen/qwen3.8-flash`; no `qwen3.8-flash-next` variant exists. | Same catalog query filtered by `qwen3.8-flash`: one result; `nextVariantPresent=false`. |
| 3 | Volatile IDs are centralized in `.llm/tools/agentic/config/models.ts`, and `no-hardcoded-volatile_test.ts` derives its forbidden set from the config exports. | `config/models.ts`; `config/no-hardcoded-volatile_test.ts`. |
| 4 | The active formal PLAN OpenRouter route is Minimax M3/high. IMPL has two active OpenRouter rows: DeepSeek/max for ordinary work and Qwen 3.8 Max/max for complex work. | `runtime/routing-policy.ts` constants and `CANONICAL_ROUTE_POLICY`; `resolveCanonicalFormalEvaluatorRoute()`. |
| 5 | The finite preset union currently doubles as both the launch registry and persisted-state parser vocabulary. Simply retaining old presets in that registry would keep them launchable. | `runtime/provider-profiles.ts`; `runtime/adapters/local-state-adapter.ts`; `runtime/adapters/provider-adapter.ts`. |
| 6 | A persisted legacy preset is already exercised only for Minimax; no test covers all three retired evaluator preset IDs. | `runtime/contract_test.ts` (`desired-state routes preserve validated OpenRouter preset identity`). |
| 7 | Hybrid delegation admits only DeepSeek and defaults effort to `high`; the remote gateway defaults to DeepSeek at `xhigh`. | `claude/hybrid-delegation.ts`; `claude/remote-model-launcher.ts`. |
| 8 | `deno.json` contains the `agentic:claude-openrouter` key twice. JSON parsing retains the later formal `openrouter-run.ts` binding, so the earlier interactive gateway alias is unreachable. | `deno.json:93` and `deno.json:108`; standard duplicate-key last-value behavior. |
| 9 | The live Claude provider canary builds argv without `--effort`, records the requested route effort as if it were evidence, and does not require the `PROVIDER_CANARY_OK` visible response. A reasoning/tool-only empty response can therefore look green. | `runtime/adapters/provider-canary-adapter.ts`; `runtime/provider-canary.ts`; `runtime/provider-canary_test.ts`. |
| 10 | Claude Code officially exposes `CLAUDE_CODE_MAX_OUTPUT_TOKENS`; the canary can set and record a bounded value above the issue's 300-token floor without exposing a secret. | `https://code.claude.com/docs/en/env-vars`; current child environment materialization in `provider-canary-adapter.ts`. |
| 11 | Static preset canaries compose through `planClaudeCommand`, but they do not assert that the planned argv contains the preset's `--effort` value. | `runtime/preset-canary.ts`; `runtime/adapters/claude-adapter.ts`. |
| 12 | No test currently compares the formal OpenRouter bindings in `lane-policy.md` with `CANONICAL_ROUTE_POLICY`. | Focused search across `.llm/tools/agentic/**/*test.ts` and `.llm/harness/`. |
| 13 | OpenHands phase/default routing still selects Minimax/DeepSeek/Qwen Max. The generic workflow allowlist and manual profiles also permit all three legacy routes. | `.github/workflows/openhands-phase-eval.yml`; `.github/workflows/openhands-agent.yml`; `openhands/phase-eval-workflow_test.ts`. |
| 14 | OpenHands does not expose an observed reasoning-effort field. Its workflow can identify provider/model, but any `max` statement would be a request claim rather than attestation. | Workflow request/status outputs and owner non-scope in #1791. |
| 15 | `actionlint` and `yamllint` are not installed. The existing agentic test suite statically checks workflow behavior; YAML parsing must be added as an explicit shell gate. | `command -v actionlint`; `command -v yamllint`; `openhands/phase-eval-workflow_test.ts`. |
| 16 | Source skills with active old-route language are `claude-manager`, `netscript-harness`, `netscript-pr`, and `openhands-handoff`; `.claude/skills` are generated mirrors. | `rg` under `.agents/skills/**/SKILL.md`; `agentic:sync-claude` task. |

## jsr-audit surface scan

- N/A: the slice changes internal `.llm/tools/agentic`, harness/docs, workflows, and root task
  routing. It does not touch `packages/**`, `plugins/**`, or a published JSR surface.

## Open questions

- None that force rework. The issue contract resolves the model IDs, phase bindings, effort,
  historical compatibility, canary floor, workflow behavior, and evaluator requirement.
- The implementation will use a distinct persisted preset-ID vocabulary so legacy records parse
  while active launch selection remains limited to current presets.
