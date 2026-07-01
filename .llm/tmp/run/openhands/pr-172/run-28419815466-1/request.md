You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment

Run a **PLAN-EVAL** (harness Plan-Gate, separate-session evaluator pass) on the plugin runtime-launch contract plan. This is the FINAL chapter of the #157/#172 thin-dependency convergence — closing debt `PLUGIN-RUNTIME-DEPENDENCY-ENTRYPOINT-EXPORTS`. **Do NOT implement, edit source, or commit. Evaluate only and post your verdict as a PR comment.**

## SKILL (read before evaluating)
- `.agents/skills/netscript-harness` — the 8-phase model; PLAN-EVAL is a hard stop before implementation.
- `.llm/harness/evaluator/plan-protocol.md` — the PLAN-EVAL instructions you must follow.
- `.llm/harness/gates/plan-gate.md` — the checklist you enforce.
- `.agents/skills/netscript-doctrine` — ARCHETYPE-5 (plugins) + ARCHETYPE-6 (CLI); layering; the #157 thin-connector / core-centralization LAW.
- `.agents/skills/jsr-audit` — publish bar: new `./runtime`/`./services` exports must not regress JSR score or introduce slow types.
- `.agents/skills/netscript-deno-toolchain` — `deno doc` for the touched public surface; scoped check/lint.

## Artifacts to evaluate (committed on this branch `feat/scaffold-surface-167`)
- `.llm/tmp/run/feat-scaffold-surface-167--runtime-launch-contract/research.md`
- `.llm/tmp/run/feat-scaffold-surface-167--runtime-launch-contract/plan.md`

## Context (already landed on this branch)
`scaffold.runtime` E2E is at `passed=21 failed=1` after the scaffold-CLI bridge (`43c0050f`) and install→list reconciliation (`2b61b24d`). The remaining fail is `runtime.wait.workers-api`: thin-dep installs no longer copy `plugins/<name>`, but the generated Aspire AppHost still launches the workers service + background processor from a copied `plugins/workers` workdir that no longer exists.

## What to verify (ground every claim against real code; cite file:line)
1. **Root-cause accuracy.** Confirm the plan's grounding (research.md STEP 1) against the actual code: `generate-register-plugins.ts`/`generate-register-background.ts` workdir/entrypoint emission, `appsettings-entry-builders.ts`, `install-plugin.ts` workdir derivation, and the per-plugin `deno.json` export maps + `scaffold.plugin.json` provider blocks. Is the failure mechanism correctly identified?
2. **The contract decision (D1 Hybrid).** Is "services launch by package-spec `./services` (cwd=projectRoot, bootstrap-module env decoupled); background launch via install-generated userland glue importing a new public `./runtime` export" sound and #157-thesis-consistent? Specifically scrutinize the `import.meta.url`-relative user-data hazard (research.md claims naive package-bin launch silently breaks job discovery in `bin/combined.ts`) — is that real, and does it actually justify Shape B for background? Is there a simpler correct contract the plan missed?
3. **Slice independence + ordering.** Are slices 0-6 each independently committable with a real validating gate? Is Slice 0 (sagas background-processor reconcile) correctly sequenced before Slice 5 (generation change)? Is D4 (only workers+triggers get glue; sagas TBD; auth/streams service-only) correct given the export table?
4. **JSR surface.** Do the new `./runtime`/`./services` exports (D2) carry the doc/slow-type obligations the plan states? Is `deno publish --dry-run --allow-dirty` per touched package the right bar?
5. **Risks.** Are R1-R6 the right risks, and are the mitigations adequate (esp. R2 discovery-in-glue, R3 Aspire `jsr:`-entrypoint launch correctness, R5 bootstrap-module env preservation)? Any missing risk?
6. **Plan-Gate checklist** (`gates/plan-gate.md`): archetype justified, layering respected, no new `any`/casts beyond the 2 sanctioned categories, debt closure mapped to a gate, the bar (`deno task e2e:cli run scaffold.runtime --cleanup` → `failed=0`) is the right merge bar.

## Verdict
Emit **PASS** or **FAIL_PLAN** per `verdict-definitions.md`. On FAIL_PLAN, give specific, actionable corrections (which slice, which decision, what to change) so the plan can be revised in one cycle. Two FAIL_PLAN cycles then escalate. Do not type-check or run E2E for this pass beyond what's needed to verify the grounding claims; this is a plan evaluation, not an implementation.


Issue/PR title: Re-architect plugin scaffold surface (#157): thin, typesafe, no plugin-source copy

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/28419815466-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28419815466-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-172/run-28419815466-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 172
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28419815466
