# Supervisor: Canary.15 W1-B

## Control plane

- Branch: `fix/scaffold-owned-quality-gates`
- Base: `origin/main@7af6d1c02ab3f380dde7354ebac190e67d363db0`
- Issues: #1024 and #1328
- PR: pending draft creation after bootstrap push
- Current phase: `plan-eval`
- Sole writer thread: `019fdb07-deb8-7971-80aa-d02fb6b56c37`
- Writer route: OpenAI `gpt-5.6-sol`, high
- PLAN-EVAL: required, separate session, not yet run
- IMPL-EVAL: required, separate session, not yet run
- OpenHands: paused
- Merge/release: prohibited in this run phase

Exactly one implementation writer owns this worktree. No app-server, tmux, CLI, or second Codex
writer may overlap it. Resume the recorded thread; do not launch another.

## Phase gate

Product-code edits are blocked. The independent evaluator must read at least:

- this run's `research.md`, `plan.md`, `context-pack.md`, and `drift.md`;
- the current #1024 and #1328 bodies and #1328's #1335 boundary comment;
- `packages/cli/src/kernel/templates/workspace/deno-json.ts`;
- `packages/cli/src/kernel/application/scaffold/plan-init.ts` and the generated verifier pattern;
- `packages/cli/e2e/src/application/gates/scaffold/database-gates.ts` and
  `generated-plugins-check-gate.ts`;
- `.llm/tools/e2e/scaffold-e2e-test.ts`, `.llm/tools/consumer-tools.json`, and the #1092 generated
  agent-tool asset;
- the app/service templates and sagas/triggers/workers resource scaffolders named in `research.md`.

Evaluator route: canonical `formal_plan_evaluation` via Claude Code/OpenRouter, `claude-openrouter`
-> `claude-print`, preset `claude-evaluator-minimax-m3`, model `minimax/minimax-m3`, high effort.
The only allowed provider-limit fallback is fresh separate Antigravity/Google
`gemini-3.6-flash-high`, high.

The evaluator must write its own PLAN-EVAL verdict. The writer must not self-certify, start product
implementation, or repeat a valid PASS.

## Protected state

- Preserve `deno.lock` byte-for-byte and out of the index.
- Do not mutate foreign/quarantined worktrees or `/home/codex/repos/ns004-agenttools`.
- Do not publish, trigger OpenHands, start Billing Run, absorb W1-C/#1335, mark ready, or merge.
- Before the eventual full runtime gate, run leak-check and do not overlap foreign resources.
