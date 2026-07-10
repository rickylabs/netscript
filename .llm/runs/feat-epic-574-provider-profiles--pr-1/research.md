# Research — feat-epic-574-provider-profiles--pr-1

## Re-baseline

- Carried-in source: issue #577 brief, merged PR #585 controller, and
  `.llm/runs/refactor-epic-574-agentic-runtime-controller--pr-0b/`.
- Re-derived against integration branch `rickylabs-epic-574-wsl-agentic-runtime` at `93eb4f02`
  on 2026-07-10; implementation branch HEAD was `17a8d36a`.
- HEAD ancestry: `git merge-base --is-ancestor 93eb4f02 HEAD` exited 0.
- Ahead/behind after a scoped fetch: integration `0 behind / 1 ahead`; feature remote
  `0 behind / 0 ahead`.
- `git fetch origin` initially failed because this worktree's only configured origin fetch refspec
  names the nonexistent branch `feat/fresh-ui-pixel-polish`. A scoped fetch of the integration and
  feature branches succeeded without changing Git configuration.
- The controller files named in the brief exist under the internal-tool root
  `.llm/tools/agentic/runtime/`, not under `packages/cli/`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | #576 already owns the versioned runtime command/result contract, route identity, desired/observed state, explicit read/mutation ports, pure planner, and provider/agent adapters. #577 must extend these types rather than create another controller. | `.llm/tools/agentic/runtime/{contract,state,ports,planner}.ts` |
| 2 | `RouteIdentity` already carries agent/provider/model/effort/worktree/session/mobile identity. Provider kinds already include `anthropic`, `openai`, `openrouter`, and `custom`. | `runtime/contract.ts` |
| 3 | OpenRouter and custom routes are currently blocked twice: `validateProviderRoute()` emits issue-577 `capability_deferred`, and `routeDeferred()` in the planner blocks them before lifecycle planning. | `runtime/adapters/provider-adapter.ts`; `runtime/planner.ts` |
| 4 | Existing provider validation is value-free. It receives credential **key names**, allowlists conflicts, and returns only names/diagnostics. Current conflict sets are incomplete for cross-provider selection because they list only each agent's native key. | `runtime/adapters/provider-adapter.ts`; provider test in `runtime/adapters_test.ts` |
| 5 | Process plans are data-only (`AgentProcessRequest`) and currently contain executable, argv, cwd, timeout, and capture bound, but no late-bound child-environment policy. This is the seam to extend without reading secrets in domain/application code. | `runtime/ports.ts` |
| 6 | Apply-mode launch/resume/smoke remains blocked on sender ownership (#580). #577 may make profile selection and read-only canaries runnable, but must not implement daemon repair, sender locking, or general live lifecycle apply. | `runtime/planner.ts` (`planLifecycleAction`) |
| 7 | Claude Code officially supports `--model`; gateway routing uses `ANTHROPIC_BASE_URL` and an auth token/key. Custom base URLs are gateway routes, not native Anthropic Remote Control routes. | [Claude CLI reference](https://docs.anthropic.com/en/docs/claude-code/cli-usage); [Anthropic gateway docs](https://docs.anthropic.com/en/docs/claude-code/llm-gateway) |
| 8 | Current Codex uses named sibling profile files (`$CODEX_HOME/<name>.config.toml`) selected with `--profile`; user-level provider config supports `model_provider`, `model_providers.<id>.base_url`, and `env_key`. The supported custom-provider wire is Responses only. Project config is intentionally forbidden from overriding provider/auth/profile selection. | [Codex advanced configuration](https://developers.openai.com/codex/config-advanced); [Codex config reference](https://developers.openai.com/codex/config-reference) |
| 9 | OpenRouter publishes all three requested model slugs: `minimax/minimax-m3`, `z-ai/glm-5.2`, and `x-ai/grok-4.5`. Its model pages expose Responses and Anthropic Messages endpoints, but runner-specific tools/reasoning/streaming compatibility still requires canary evidence and must fail closed. | [MiniMax M3](https://openrouter.ai/minimax/minimax-m3/api); [GLM 5.2](https://openrouter.ai/z-ai/glm-5.2/api); [Grok 4.5](https://openrouter.ai/x-ai/grok-4.5/uptime) |
| 10 | No live credential is available or authorized. Therefore a credential-absent canary is a first-class expected diagnostic, never a pass. No test or artifact may contain a credential-shaped fixture value. | User acceptance and safety constraints |
| 11 | The branch already has a coordinator-owned `supervisor.md`; `codex-thread-ids.md` was pre-existing and untracked at pre-flight. It must not be swept into this slice accidentally. | direct `git status --short --branch` |

## Archetype / doctrine fit

- Effective profile: Archetype 6 — CLI / Tooling, scoped internal-tool variant; no scope overlay.
- Horizontal kernel rule applies: finite provider/profile contracts and process/canary ports remain
  value-free; `Deno.env` and `Deno.Command` belong only in `.llm/tools/agentic/runtime/adapters/**`.
- Relevant risks: AP-1 (overgrowing the existing contract/test files), AP-3 (turning the process
  request into a credential god-interface), AP-11/AP-25 (parent/global environment access outside
  an edge), AP-18 (string-only argv snapshots), AP-24 (preset switch instead of typed registry).
- Current doctrine verdict for the repository CLI is `Restructure`, but this run changes internal
  `.llm/tools` controller tooling and does not widen the published `@netscript/cli` surface.

## jsr-audit surface scan

- N/A: this is a non-package internal-tool wave. It does not touch `mod.ts`, package exports,
  `deno.json` dependencies, or JSR publish shape.
- Slow-type/public-surface risk: none planned. New exported internal-tool types still require
  explicit return types and focused `deno doc` inspection.

## Open questions closed by the plan

1. **Where profiles live:** typed, credential-free profile definitions live in source; no provider
   becomes a global default. Codex uses a selected child profile layer, never project provider
   config. Claude uses supported per-child CLI/environment routing.
2. **How credentials cross the edge:** only a late-bound environment policy (source key, target key,
   explicit clears) enters a process plan. Values are resolved inside the child-process adapter at
   spawn time and are never returned, logged, persisted, or placed in argv.
3. **What a canary proves:** separate static contract validation from a bounded read-only live
   process probe. Fan-out eligibility requires explicit tool, reasoning, and streaming support;
   missing credentials or unsupported behavior returns structured failure/block evidence.
4. **Custom Claude base URL:** it is explicitly experimental for non-Anthropic models and reports
   Remote Control unavailable. No custom route may inherit native Anthropic credentials silently.
