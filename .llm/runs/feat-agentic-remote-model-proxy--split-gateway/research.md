# Research — feat-agentic-remote-model-proxy--split-gateway

## Re-baseline

- Carried-in source: live Claude/OpenRouter fork experiment and `aattaran/deepclaude` as prior art.
- Re-derived against `orchestrator/0.0.5` @ `015ddef6d226d6cf2773c21e116a1debbf3d1cac` on 2026-08-05.
- The live experiment proves OpenRouter inference and fork/resume work, but Claude Code rejects
  `/remote-control` whenever the configured base URL is non-Anthropic.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Claude Code 2.1.222 is installed and current. | `claude --version` and npm dist-tag check |
| 2 | Anthropic documents Remote Control as disabled for custom `ANTHROPIC_BASE_URL` hosts. | `https://code.claude.com/docs/en/remote-control` |
| 3 | Remote Control depends on Anthropic OAuth/control traffic, while inference uses `/v1/messages`. | official Remote Control docs and request-boundary inspection |
| 4 | Existing repo code already has a tested loopback Deno proxy, typed ports, central endpoints, model constants, and secret-blind audit conventions. | `claude/evaluator-model-guard.ts`, `config/{endpoints,models}.ts` |
| 5 | Prior art restores Remote Control by routing `/v1/messages` to the alternate model provider and other requests to `api.anthropic.com`. | `aattaran/deepclaude/proxy/model-proxy.js` |
| 6 | OpenRouter exposes the requested model as `deepseek/deepseek-v4-flash-0731`. | OpenRouter model API page |
| 7 | OpenRouter credentials are already resolved from env or `$HOME/.config/netscript-agentic/openrouter.env` by the OpenCode adapter. | `opencode/opencode-run.ts` |

## jsr-audit surface scan

N/A: this is internal `.llm/tools/agentic` tooling, configuration, tests, tasks, and operator docs;
it does not alter a package/plugin export or JSR surface.

## Open questions

- None that would force implementation rework. The live canary will determine whether current
  Claude Code accepts a loopback split gateway for Remote Control; failure is a runtime finding,
  not an excuse to weaken credential isolation.
