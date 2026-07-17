## SKILL

- netscript-harness
- netscript-release
- netscript-tools
- netscript-deno-toolchain
- jsr-audit
- netscript-pr
- rtk

Act as the separate formal IMPL-EVAL session for harness run
`.llm/runs/feat-811-release-canary--canary-readiness/` in `/home/codex/repos/b10-canary`, PR #812,
issue #811.

You are the evaluator, not the implementation session. Do not use Task, Agent, Workflow, Skill, or
any delegation/fan-out facility; do not invoke closed-model subagents. Perform the evaluation
directly in this Qwen session. Do not modify product/release/workflow source, GitHub state, refs, or
the PR. Read-only commands and independent validation are allowed. Your only permitted write is the
required evaluator artifact `.llm/runs/feat-811-release-canary--canary-readiness/evaluate.md`.

Read fully and apply:

- `.llm/harness/evaluator/protocol.md` and its verdict definitions/template
- `.llm/harness/workflow/run-loop.md`
- `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`
- `.llm/harness/gates/release-gates.md`
- this run's `plan.md`, `plan-eval.md`, `worklog.md`, `context-pack.md`, `drift.md`,
  `final-gates.md`, and slice-review artifacts
- `.llm/harness/debt/arch-debt.md`
- issue #811, merged PR #810, draft PR #812, its commit trail, body, and phase comments

Evaluate `origin/main...HEAD` at the current committed head. Verify every #811 deliverable:

1. shared stable/canary preparation and collision-safe `<target>-canary.N` derivation;
2. structured publish readiness, effective workspace set, first-publish checklist/provisioning,
   lockstep/residue/versionless checks, and a witnessed red test for every new row;
3. canonical #810 preflight reuse and exact denoland/deno#35546 plus authenticated-canary sunset;
4. canary workflow reuse of the real publisher, no Latest mutation, exact returned downstream run
   id, awaited canary-pinned production E2E, and SHA-bound success only after both stages;
5. fail-closed stable-publish and GitHub-release pair enforcement for identical content with exact
   version-only inheritance;
6. token resolution including in-process `~/.config/gh/hosts.yml` fallback without secret output;
7. mandatory canary-first doctrine, immutable/yank policy, mirror sync, honest debt delta, and OWNER
   action boundary;
8. the complete final gate evidence, zero quality findings/allowances, and no new suppressions.

This is implementation of release-readiness automation, not an actual release cut. Per the approved
plan and explicit user scope, live JSR canary publication, live `e2e-cli-prod`, repository
permission changes, and JSR grants are post-merge OWNER actions. Treat the release-gate class as
design-only/N/A for this draft implementation PR; do not require a live mutating publish to pass
IMPL-EVAL.

The PR intentionally remains draft at `status:impl` until this verdict. The merge close-gate and
`status:ready-merge` are not being claimed; unchecked IMPL-EVAL boxes are therefore expected at
evaluation start. PR #810 has merged and both PR bodies now document their task-boundary
integration.

Run the smallest independent commands needed to substantiate your rows. Write a complete
`evaluate.md` using the template and evidence standard. End your response with exactly one
machine-readable line:

`IMPL_EVAL_VERDICT: PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT`
