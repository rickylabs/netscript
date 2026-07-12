# Research — fix-agentic-openrouter-lanes--codex

## Re-baseline

- Carried-in source: `.llm/runs/dashboard-design--orchestrator/run-eval.md` on `design/dev-dashboard-revamp`, summarized in `brief.md`.
- Re-derived against `main` @ `ec61dc78` on 2026-07-12; branch bootstrap is `f5dba45e`.
- The launcher already uses `app-server-message-cli.ts`, not a direct top-level Codex invocation, but still passes a named profile into the app-server initialization path and relies on a caller-provided profile home.
- The supported profile renderer already emits `<name>.config.toml` and `wire_api = "responses"`; launcher materialization and validation are missing.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Thread parsing only recognizes rollout paths or nested `thread.id`, while Codex 0.144 app-server emits additional thread/start shapes. | `agentic-lib.ts::parseThreadInfo`; launcher warning at `launch-codex-slice.ts` tail. |
| 2 | A successful child exit is overwritten to exit 1 whenever no thread id is parsed. | `launch-codex-slice.ts` after `child.status`. |
| 3 | Codex OpenRouter profile rendering is credential-free and Responses-only, but launcher does not materialize it. | `runtime/adapters/codex-profile-adapter.ts`. |
| 4 | Claude OpenRouter command planning rejects launch/resume and only builds static smoke requests. | `runtime/adapters/claude-adapter.ts`. |
| 5 | Provider canary requires tools, reasoning, and streaming for every route and exposes only one explicit route per invocation. | `runtime/provider-canary.ts`, adapter, and CLI. |
| 6 | `OPENROUTER_PRESETS` has three entries but no exhaustive cheap CI canary contract. | `runtime/provider-profiles.ts`; existing tests only spot-check matching. |

## jsr-audit surface scan

N/A: this is internal `.llm/tools/agentic` tooling, with no package export or JSR publish surface.

## Open questions

- Must resolve now: whether Codex can suppress the native namespace tool for GLM 5.2, or whether Claude's Anthropic-compatible path is the viable lane.
- Must resolve now: the exact OpenRouter Anthropic base path/model mapping accepted by Claude CLI.
- Safe to defer: remote-control support for experimental Claude/OpenRouter sessions; this mission requires a real bounded turn, not native Claude mobile control.
