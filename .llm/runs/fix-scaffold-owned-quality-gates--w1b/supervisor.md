# Supervisor: Canary.15 W1-B

## Control plane

- Branch: `fix/scaffold-owned-quality-gates`
- Base: `origin/main@7af6d1c02ab3f380dde7354ebac190e67d363db0`
- Issues: #1024 and #1328
- PR: [#1342](https://github.com/rickylabs/netscript/pull/1342), draft against `main`
- Current phase: `impl` (authorized by independent PLAN-EVAL PASS; Slices 1 and 2 implemented)
- Sole writer thread: `019fdb07-deb8-7971-80aa-d02fb6b56c37`
- Writer route: OpenAI `gpt-5.6-sol`, high
- PLAN-EVAL: PASS on `045ca6c3262c854f830b428e871ef9ed8730ba10`, separate session
  `017613f0-c5be-4738-b59c-0bf540202686`
- IMPL-EVAL: required, separate session, not yet run
- OpenHands: paused
- Merge/release: prohibited in this run phase

PR #1342 carries milestone `0.0.5`, `type:fix`, `area:cli`, `area:tooling`, `priority:p1`,
`wave:v1`, `gate:e2e`, and exactly one lifecycle label: `status:impl`. Its body contains
`Closes #1024`, `Closes #1328`, truthful unchecked Definition-of-Done boxes, and pending
`acceptance-evidence` mappings for every unchecked issue item.

Exactly one implementation writer owns this worktree. No app-server, tmux, CLI, or second Codex
writer may overlap it. Resume the recorded thread; do not launch another.

## Implementation checkpoint

PLAN-EVAL is complete and must not be repeated. Slice 1 is pushed as `80a5dc07b` with trail
`10a9287ec`; Slice 2 has green focused, fresh-scaffold quality, and scoped wrapper evidence and is
ready for its product commit/push/comment reconciliation. Slice 3 must finish all accepted gates and
stop at an independent IMPL-EVAL handoff.

The independent implementation evaluator should read at least:

- this run's `research.md`, `plan.md`, `context-pack.md`, and `drift.md`;
- the current #1024 and #1328 bodies and #1328's #1335 boundary comment;
- `packages/cli/src/kernel/templates/workspace/deno-json.ts`;
- `packages/cli/src/kernel/application/scaffold/plan-init.ts` and the generated verifier pattern;
- `packages/cli/e2e/src/application/gates/scaffold/database-gates.ts` and
  `generated-plugins-check-gate.ts`;
- `.llm/tools/e2e/scaffold-e2e-test.ts`, `.llm/tools/consumer-tools.json`, and the #1092 generated
  agent-tool asset;
- the app/service templates and sagas/triggers/workers resource scaffolders named in `research.md`.

The PLAN-EVAL PASS is distilled in `plan-eval.md`. The writer carried all seven advisories through
the Design checkpoint and implementation, but does not self-certify the final IMPL-EVAL.

## Protected state

- Preserve `deno.lock` byte-for-byte and out of the index.
- Do not mutate foreign/quarantined worktrees or `/home/codex/repos/ns004-agenttools`.
- Do not publish, trigger OpenHands, start Billing Run, absorb W1-C/#1335, mark ready, or merge.
- Before the eventual full runtime gate, run leak-check and do not overlap foreign resources.
