# Research — OpenCode MCP attachment and provider-valid resume

## Re-baseline

- Carried-in source: `.llm/runs/release-0.0.5--orchestration/post-c14-handoff.md` and
  `slices/w1-c-1324-1330/{preflight,supervisor}.md`, read from coordination commit `3e757c273`
  because those paths are not present in the requested implementation baseline.
- Re-derived against `origin/main` at `1455231b0b7700c515e6226538cb12ec251f943c` and the live
  bodies/comments of #1324 and #1330 on 2026-08-07.
- What changed vs the carried-in version:
  - branch/worktree/base are owner-specified and differ from the prepared placeholders;
  - the prepared Qwen IMPL-EVAL route is stale; live policy binds DeepSeek V4 Flash 0731 max;
  - #1324's live follow-up requires available-tool count to be separate from MCP call count;
  - the current routing policy contains exactly one OpenCode route, `adversarial_design_eval`;
  - the protected implementation-base `deno.lock` SHA-256 is
    `d32ef0c1f2b9256e05cf7339c452bd8cf6addeb9a4b433d38abcee992651b529`, not the older
    coordination-checkout hash.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `opencode` is the pinned 1.17.20 binary and `opencode run` supports `--session`, `--format json`, `--model`, and `--variant`. | `opencode --version`; `opencode run --help`; `.llm/tools/agentic/config/versions.ts` |
| 2 | Every current native OpenCode launch goes through `opencode-run.ts`; evaluation and hybrid delegation reuse its argv/environment helpers, while web launch reuses `openCodeChildEnvironment`. | `.llm/tools/agentic/opencode/*`; `.llm/tools/agentic/claude/hybrid-opencode-adapter.ts` |
| 3 | The launcher inherits an external `OPENCODE_CONFIG`, but it neither discovers nor translates the generated root `.mcp.json`. | `.llm/tools/agentic/opencode/opencode-run.ts`; `packages/cli/src/public/features/agent/init/init-agent.ts` |
| 4 | NetScript agent init writes Claude-style `mcpServers` entries for `netscript` and `aspire`: `{command,args}`. OpenCode 1.17.20 expects `mcp.<name> = {type:'local', command:[...]}`. | `init-agent.ts`; OpenCode tag v1.17.20 `packages/core/src/v1/config/mcp.ts` |
| 5 | OpenCode merges `OPENCODE_CONFIG`, project config, and finally `OPENCODE_CONFIG_CONTENT`; a narrow final overlay can attach project MCP/plugin entries without reserializing or discarding provider, model, permission, or credential configuration. | OpenCode tag v1.17.20 `packages/opencode/src/config/config.ts` |
| 6 | OpenCode 1.17.20 calls `experimental.chat.messages.transform` immediately before `MessageV2.toModelMessagesEffect` on every dispatch and during compaction. The hook mutates `{info,parts}` messages and a thrown error fails the operation. | OpenCode tag v1.17.20 `packages/opencode/src/session/prompt.ts`, `packages/plugin/src/index.ts` |
| 7 | Upstream conversion currently admits empty assistant text/reasoning parts, preserves tool parts, rewrites pending/running tools to interrupted results, and handles provider switches after the transform. Normalizing the raw fragment list is therefore the narrowest seam that preserves stored history and tool ordering. | OpenCode tag v1.17.20 `packages/opencode/src/session/message-v2.ts` |
| 8 | Empty text adjacent to signed Anthropic reasoning may be a structural separator; deleting it can invalidate provider signatures. That shape must fail closed using only the local message/event id. | v1.17.20 `message-v2.ts` signed-reasoning comment and metadata branch |
| 9 | OpenCode exposes `/mcp`, `/experimental/tool/ids`, and `/experimental/tool?provider=&model=` from its local server, while `opencode debug agent <agent> --tool <id> --params <json>` can execute one tool without a model turn. | v1.17.20 `server.mdx`, experimental HTTP handlers, `opencode debug agent --help` |
| 10 | The full required fixture matrix is missing from the current agentic suite: malformed/colliding config; interrupted text; tool-only turns; empty deltas; reasoning-only events; provider switch; repeated resume; unsafe normalization. | `rg` over `.llm/tools/agentic` tests |
| 11 | This is internal `.llm/tools/agentic` infrastructure, not a published `packages/**` or `plugins/**` surface. Package doctrine, jsr-audit, publish, and scaffold-runtime gates are not triggered. | owned-file plan and `archetype-gate-matrix.md` |

## External authority

- OpenCode tag `v1.17.20` / commit `4473fc3c9055046183990a965d68df3db7ea6f62` was inspected
  for the exact plugin, config, MCP, message-conversion, CLI, and server contracts.
- Official OpenCode docs confirm custom config precedence, MCP configuration, local server tool
  enumeration, and the message-transform hook. No secondary implementation source is used.

## jsr-audit surface scan

- N/A: no published package/plugin export, dependency, version, or JSR surface is changed.

## Open questions resolved by the plan

- Attachment boundary: final in-memory config overlay, not a generated replacement config file.
- Collision policy: nearest project `.mcp.json` wins only for the same MCP server name; unrelated
  external/project OpenCode settings survive native merge.
- Resume boundary: pre-dispatch plugin normalization, not destructive storage/database rewriting.
- Unsafe signed-reasoning shape: fail closed with local event identity only.
- Live route matrix: the single current OpenCode route from `CANONICAL_ROUTE_POLICY`; policy data is
  queried, not duplicated in launcher code.
