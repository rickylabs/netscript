You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 provider=openrouter output=pr-comment iterations=600

use harness — run **PLAN-EVAL** (separate-session plan gate) for the **alpha-1 deprecation-shim removal** run on PR #113 (`chore/alpha1-jsr-shim-removal`). This is a hard gate: NO implementation begins until this returns `PASS`.

This is a **planning-only** PR. Do NOT implement, delete code, or change framework source. Read the artifacts, verify the manifest against the real surface, apply the plan gate, and emit a verdict comment only.

## Context
The NetScript framework is **pre-release alpha-1 with a zero-backwards-compat policy**. A prior consumer-check found `main` already carries every canonical prod-readiness API plus leftover `@deprecated` back-compat shims. PR-B removes ONLY those shims, in 3 risk-tiered slices. A separate PR-C will sweep the rest of the repo project-wide (out of scope here).

## Inputs to read (on this PR branch `chore/alpha1-jsr-shim-removal`)
- `.llm/tmp/run/chore-alpha1-jsr-shim-removal/research.md` — the removal manifest (Tier 1/2/3) with file:line and consumer claims
- `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan.md` — locked decisions, slices S1–S3, version policy, gate set
- `.llm/tmp/run/chore-alpha1-jsr-shim-removal/context-pack.md`, `worklog.md`, `drift.md`
- `.llm/harness/debt/arch-debt.md` — confirm no entry depends on a symbol being removed
- `.llm/harness/evaluator/plan-protocol.md` and `.llm/harness/gates/plan-gate.md` — the protocol you enforce

## What to evaluate (verify against the REAL surface — `deno doc` / `git grep` on this branch, do not trust the manifest blindly)
1. **Manifest accuracy.** For each Tier-1 symbol (8 cli `windows.ts` aliases, db `buildConnectionString`, `mssqlJsonExtension`, telemetry `context/job.ts`), confirm it is genuinely `@deprecated` AND has **0 internal consumers** (`git grep` the symbol across `packages/**`, `plugins/**`; exclude the definition + same-name unrelated class methods). Flag any symbol with a live consumer that the plan calls "0-consumer".
2. **Tier-2 correctness.** mssql `trustedConnection` and fresh `serveStaticFiles`/`registerFsRoutes`: confirm the named canonical replacement (`authentication.type='ntlm'`, `staticFiles`/`fsRoutes`) EXISTS and is functionally equivalent, and that the only consumers are the impl + its tests (so the fold-onto-canonical is safe).
3. **Tier-3 pre-condition (the risky slice).** The plan says S3 retires the legacy workers `schedule()` plumbing and the `saga-bus-legacy` adapter + legacy saga runtime WHOLESALE, conditioned on first proving the canonical path covers the functionality. VERIFY the canonical replacements actually exist and are complete: `defineScheduledTrigger(...).enqueueJob(...)` for scheduling (check the triggers/workers exports) and `SagaBusBridge`/native runtime for sagas (`deno doc` the sagas package). RULE on whether wholesale retirement is safe or whether S3 must be narrowed/deferred — be specific about any functional gap.
4. **Version policy.** The plan bumps each affected package's **minor** (0.Y.Z → 0.(Y+1).0) with a BREAKING note rather than a major, because the framework is < 1.0 alpha-1. Rule on whether that is correct vs a coordinated bump.
5. **Reference/scaffold safety.** Require S1 to grep `templates/`, `plugins/*/templates`, `docs/`, and scaffold output for any removed symbol before deletion. Confirm the plan makes this a gate, not an afterthought.
6. **Gate set + lock hygiene.** Are the gates (scoped check/lint/fmt, per-package test, arch:check, publish:dry-run, scaffold.runtime e2e at IMPL-EVAL) sufficient for a breaking removal? Confirm the plan forbids `deno.lock` churn.
7. **Zero-cast.** Removal-only must introduce no new casts; confirm.

## Verdict
Emit `PASS` or `FAIL_PLAN` with specific, file-referenced findings and an explicit ruling on the Tier-3 wholesale-retirement question (#3) and the version policy (#4). Two `FAIL_PLAN` cycles then escalate. Preserve lock hygiene: do not commit `deno.lock` or source churn.

## SKILL
- `.agents/skills/netscript-harness` — harness phases, PLAN-EVAL protocol, plan-gate, verdict definitions
- `.agents/skills/netscript-doctrine` — package/plugin archetype + public-surface gates (removals touch ARCHETYPE-2/3/5 public surface)
- `.agents/skills/netscript-deno-toolchain` — `deno doc` / `deno doc --filter` to verify export surfaces + consumer checks, `deno why`
- `.agents/skills/netscript-tools` — validation evidence + raw-git verification conventions (consumer-grep)
- `.agents/skills/openhands-handoff` — OpenHands run/verdict conventions, pr-comment output mode


Issue/PR title: PR-B: alpha-1 deprecation-shim removal (breaking, zero-compat)

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
- Write /home/runner/work/_temp/openhands/27986503722-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27986503722-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-113/run-27986503722-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 113
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27986503722
