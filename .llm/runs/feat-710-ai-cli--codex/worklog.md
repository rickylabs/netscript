# #710 AI CLI implementation worklog

## Plan

PLAN-EVAL is owner-waived for this implementation lane (carried drift D1). The issue acceptance
boxes are the locked contract.

1. Add an AI-owned project configuration service and command router for `model`, `provider`, `mcp`,
   `list`, and resource `remove`; prove it with focused command tests over a temporary workspace.
2. Make tool/agent resource mutations regenerate static registries and the app composition root;
   prove add/remove consistency and callable tool wiring in tests.
3. Add MCP scaffolding and runtime registration, plus provider/model source emission; prove generated
   TypeScript contains the supported runtime seams and list JSON reflects persisted configuration.
4. Extend AI doctor checks for provider/model/tool consistency; prove dangling refs and missing
   provider keys fail while the scaffolded default passes.
5. Add CLI E2E coverage for the new verbs without running the orchestrator-owned E2E gate, then run
   scoped check/lint/format and targeted tests for touched roots.

## Design

- **Public surface:** existing `plugin ai` adapter CLI gains nested verbs expressed through the
  current `PluginCliArgs` contract; no new published package export is required.
- **Domain vocabulary:** `AiProviderId`, model aliases/refs, MCP server definitions, and enumerable
  resource kinds. Supported providers are finite constants: `anthropic`, `openai-compatible`,
  `openrouter`, `ollama`.
- **Ports:** reuse `ProjectFiles` for project-relative reads/writes/listing; deletion remains inside
  the AI adapter boundary.
- **Composition:** `ai/models.ts` is deterministic generated state; `ai/ai.ts` imports generated
  tool/agent/MCP registries so resource commands are immediately runnable.
- **Deferred scope:** skills lifecycle is p3 and excluded. The orchestrator owns execution of
  `scaffold.runtime`/`e2e:cli` and IMPL-EVAL.
- **Contributor path:** add a provider constant/template in the AI project configuration module,
  route a command in the AI command handler, and cover the emitted source in its adjacent test.

## Evidence

### Implementation slice

- Commit `646456f4` (`feat(cli): make AI resources self-configuring`) contains the adapter contract,
  host `plugin ai` forwarding surface, AI lifecycle commands, generated composition, and focused
  tests.
- Scoped check wrappers passed for `plugins/ai` (37 files), `packages/plugin` (151 files),
  `packages/cli/src/public/features/plugins` (43 files), and `packages/cli/e2e` (86 files), all with
  zero diagnostics and `--unstable-kv` supplied by the wrapper.
- Scoped lint wrappers passed for the same four roots with zero findings.
- Scoped format wrappers passed for the same four roots with zero findings.
- Targeted plugin and AI tests: 25 passed, 0 failed. Coverage includes add/list/remove tool and
  agent synchronization, provider/model mutation and JSON listing, MCP add/list plus runtime tool
  registration, and doctor failures for dangling refs/missing keys/unwired tools.
- Host `plugin ai` forwarding test: 1 passed, 0 failed.
- Real adapter CLI subprocess smoke: `install` created seven userland artifacts; `add tool
  subprocess-tool` created the tool and `.netscript/generated/plugin-ai/tools.registry.ts`.

### Orchestrator-owned evidence

- `deno task e2e:cli` / `scaffold.runtime` was intentionally not run per the slice brief. The suite
  now contains `scaffold.plugin.ai.lifecycle`, which adds `e2e-tool`, and the AI chat behavior gate
  resolves and calls that tool through the generated composition root. Execution remains unproven
  until the orchestrator runs the gate.

### Reconcile notes

- Slice 1: acceptance scope remains items 1–5; skills lifecycle remains deferred. No PR was opened
  or commented because the brief explicitly prohibits this implementation lane from opening PRs.
- Slice 2: E2E coverage is registered in both `scaffold.plugins` and `scaffold.runtime`; execution is
  deliberately left to the beta-9 orchestrator.

## Drift

- D1 (carried, owner-approved): PLAN-EVAL is waived; this worklog contains the required short plan
  and design checkpoint before implementation.

## Orchestrator fix-forward (Tier-A review, Codex lane quota-exhausted)

- CI scaffold-runtime `behavior.ai-chat-route` failed; reproduced locally with a full
  `e2e:cli run scaffold.runtime` in this worktree. Root cause: the generated tools registry
  imported `ai/tools/skill-loader.ts` (the MCP scaffolder's opt-in FACTORY module, which needs a
  SkillLoaderPort and exports no AiToolDefinition) and `resolveAiToolDefinitions` throws on
  modules without a definition. Fix: `skill-loader.ts` added to `AI_TOOLS_TARGET.exclude` —
  factory modules are composition-root-wired, not registry entries. plugins/ai tests 16/16,
  scoped check 0 findings.
- Applied by the beta-9 orchestrator (`09e5ae68`) — Codex lane at provider usage limit (resets 10:34).
