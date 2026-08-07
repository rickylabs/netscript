# Supervisor: Canary.15 W1-B

## Control plane

- Branch: `fix/scaffold-owned-quality-gates`
- Base: `origin/main@7af6d1c02ab3f380dde7354ebac190e67d363db0`
- Issues: #1024 and #1328
- PR: [#1342](https://github.com/rickylabs/netscript/pull/1342), draft against `main`
- Current phase: `impl` (all current-source work implemented; published-consumer close gate blocked)
- Sole writer thread: `019fdb07-deb8-7971-80aa-d02fb6b56c37`
- Writer route: OpenAI `gpt-5.6-sol`, high
- PLAN-EVAL: PASS on `045ca6c3262c854f830b428e871ef9ed8730ba10`, separate session
  `017613f0-c5be-4738-b59c-0bf540202686`
- IMPL-EVAL: PASS on immutable head `a02467d8cd28be215855764d163fb60508afe895`, separate
  session `49e6c09a-705b-47e4-9598-9b45f932c210`
- OpenHands: paused
- Merge/release: prohibited in this run phase

PR #1342 carries milestone `0.0.5`, `type:fix`, `area:cli`, `area:tooling`, `priority:p1`,
`wave:v1`, `gate:e2e`, and exactly one lifecycle label: `status:impl`. Its live body uses
`Closes #1328` and `Refs #1024`; #1024's final post-canary acceptance remains explicitly unchecked.

Exactly one implementation writer owns this worktree. No app-server, tmux, CLI, or second Codex
writer may overlap it. Resume the recorded thread; do not launch another.

## Implementation checkpoint

PLAN-EVAL is complete and must not be repeated. Slice 1 is pushed as `80a5dc07b` with trail
`10a9287ec`; Slice 2 is pushed as `1ab303975` with trail `760d5f1ad`; Slice 3 implementation and its
two merge-readiness repairs run through `3512e1dc4`. Current-source focused/static/package/runtime
gates are green, including the canonical `scaffold.runtime` verdict (`76 passed, 0 failed`) and a
final ownership-aware leak check with no run-owned survivors.

The separate formal evaluator returned **PASS** for current-source implementation correctness with
no defects. It independently ran the canonical runtime (`76 passed, 0 failed`) and scoped
check/lint/format wrappers over 1,195 files with zero diagnostics/findings. The tracked verdict is
`evaluate.md`.

Its #1024 disposition is a deferred release receipt, not a code defect: the authoritative release
order forbids canary.15 until W1-B and W1-C merge. Until the later published post-fix consumer smoke
passes, #1024's last box stays unchecked, PR and issues stay exactly `status:impl`, and this draft PR
must not be marked ready or merged by this run.

The independent implementation evaluator should read at least:

- this run's `research.md`, `plan.md`, `context-pack.md`, and `drift.md`;
- the current #1024 and #1328 bodies and #1328's #1335 boundary comment;
- `packages/cli/src/kernel/templates/workspace/deno-json.ts`;
- `packages/cli/src/kernel/application/scaffold/plan-init.ts` and the generated verifier pattern;
- `packages/cli/e2e/src/application/gates/scaffold/database-gates.ts` and
  `generated-plugins-check-gate.ts`;
- `.llm/tools/e2e/scaffold-e2e-test.ts`, `.llm/tools/consumer-tools.json`, and the #1092 generated
  agent-tool asset;
- `packages/cli/src/kernel/templates/workspace/quality-runner.ts.template` and its colocated test;
- `packages/cli/e2e/src/application/gates/scaffold/generated-quality-probes.ts`;
- the final `scaffold.runtime` and published-consumer evidence in `worklog.md`/`drift.md`;
- the app/service templates and sagas/triggers/workers resource scaffolders named in `research.md`.

The PLAN-EVAL PASS is distilled in `plan-eval.md`; the separate IMPL-EVAL PASS is distilled in
`evaluate.md`. The writer carried all advisories through implementation and did not self-certify
either verdict.

## Protected state

- Preserve `deno.lock` byte-for-byte and out of the index.
- Do not mutate foreign/quarantined worktrees or `/home/codex/repos/ns004-agenttools`.
- Do not publish, trigger OpenHands, start Billing Run, absorb W1-C/#1335, mark ready, or merge.
- Before the eventual full runtime gate, run leak-check and do not overlap foreign resources.
