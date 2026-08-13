use harness

# Leaf: legacy-port-pin-sweep (#1243)

You are the implementation supervisor for one direct-to-`main` NetScript milestone leaf. Work only
in `/home/codex/repos/netscript-007-leaf-legacy-port-pin-sweep` on
`fix/legacy-port-pin-sweep`, created from immutable live `origin/main`
`01e0960494c95ce56eb35892c211a095eb13e6ed` with no upstream.

## SKILL

Read completely before acting:

- `AGENTS.md`
- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-doctrine/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/netscript-cli/SKILL.md`
- `.agents/skills/aspire/SKILL.md`
- `.agents/skills/jsr-audit/SKILL.md`
- `.agents/skills/netscript-deno-toolchain/SKILL.md`
- `.agents/skills/rtk/SKILL.md`

Also read the approved coordination contract at
`/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/leaf-contracts.json`
for `legacy-port-pin-sweep`, plus the live issue #1243. The coordinator alone merges, publishes,
changes milestone scope, or mutates central cluster state. Never publish locally and never touch a
different worktree.

## Contract

- Own only #1243 and these declared surfaces:
  `packages/cli/src/kernel/assets/skills.generated.ts`,
  `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-test-support.ts`,
  `packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts`, and
  `plugins/streams/scaffold.plugin.json`.
- Start from the symptom. Fetch the live issue, independently reproduce every live `4437` pin or
  record why a filed occurrence is already fixed. Do not assume the issue's alternative remedy.
- Research the existing endpoint-discovery seam before choosing between resolving the assigned
  endpoint and a truthful explicit-URL/fail-loud contract. Do not invent a parallel discovery API.
- If research makes the remedy genuinely locked/mechanical, record a concrete `PLAN-EVAL: N/A`
  justification before implementation. If a material remedy/design choice remains, complete the
  bounded plan artifacts and stop for the orchestrator to launch a separate PLAN-EVAL.
- Select the smallest doctrine archetype and all required gates before editing. Contract gates are
  structured check/test evidence, publish dry-run/JSR audit, `quality:gate`, `arch:check`, and
  `scaffold.runtime`.

## Harness and delivery

Bootstrap the tracked run dir
`.llm/runs/fix-legacy-port-pin-sweep--0.0.7-wave0/` with `supervisor.md`, `research.md`, `plan.md`,
`worklog.md` containing `## Design`, `context-pack.md`, `drift.md`, `implement.md`, and `receipts/`.
Inspect the live issue before implementation and preserve the API response timestamp/state in
research evidence.

Use the structured NetScript Deno check/test/lint/fmt reporters and durable JSON gate receipts.
Because this leaf touches `packages/**`/`plugins/**`, run `quality:gate` plus the applicable JSR
audit/publish-dry-run surface; a raw CLI invocation is not verdict evidence. Do not run
`scaffold.runtime`, Aspire, or Docker until the topic orchestrator explicitly confirms the single
global expensive-gate lease. If granted, use the one-pass
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, preserve its JSON/domain report,
and prove cleanup with the read-only leak reporter.

Commit in reviewable slices. The first run-artifact commit opens a draft PR against `main` in the
same session. Push only with
`git push origin HEAD:refs/heads/fix/legacy-port-pin-sweep`; never set an upstream. Use `Closes
#1243` only if all live acceptance is truthfully satisfied and mapped with evidence; otherwise use a
plain reference and state remaining scope. Apply the required namespaced labels and milestone
`0.0.7`, keep exactly one `status:` label, and post one structured comment per slice.

After automated gates, stop for the topic orchestrator's substantive Tier-A review. The
orchestrator owns the sign-off commit. A separate opposite-family IMPL-EVAL is mandatory before
coordinator handoff; do not mark ready, merge, publish, or self-certify.

Report progress by updating the run artifacts and conclude each turn with branch/head, draft PR,
gates/receipts, PLAN-EVAL state, blockers, resource cleanup state, and the exact same-thread resume
request you need from the orchestrator.
