You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 provider=openrouter output=pr-comment iterations=120 use harness — run PLAN-EVAL (separate-session plan gate) for the docs-v4 IA-deepening run on this PR branch.

This is a **planning-only** PR. Do NOT implement, author docs, or change `docs/site` or framework code. Read the artifacts, apply the plan gate, and emit a verdict comment only.

## Inputs to read (on this PR branch `docs/v4-ia-deepening`)
- `.llm/tmp/run/docs-v4-ia-deepening/plan.md` — locked decisions, workstreams, build/eval/merge flow
- `.llm/tmp/run/docs-v4-ia-deepening/ia-tree.md` — concrete 3-level IA tree (THE design under review)
- `.llm/tmp/run/docs-v4-ia-deepening/seam-coverage.md` — capability seam audit + the auth decision
- `.llm/tmp/run/docs-v4-ia-deepening/research.md` — Phase-0 scout synthesis (grounded in `deno doc`)
- `.llm/tmp/run/docs-v4-ia-deepening/drift.md` — D1 process failure + remediation gates
- `.llm/harness/debt/arch-debt.md` — entry "packages/auth-better-auth — seamless better-auth integration roadmap" (R0–R5)
- `.llm/harness/evaluator/plan-protocol.md` and `.llm/harness/gates/plan-gate.md` — the protocol you enforce

## What to evaluate
1. **IA soundness.** Is the 3-level Capability-Hub tree complete, navigable (≤3 levels), and free of orphan/duplicate coverage? Does every named `@netscript/fresh` Web-Layer page map to a REAL export subpath (verify against `deno doc packages/fresh/mod.ts`)? Flag any invented symbol or page with no backing export.
2. **The 3 open IA questions** in `ia-tree.md` (Background-Processing vs Durable-Workflows split; Reference pillar-local vs global; Fresh examples leaf) — RULE on each with a recommendation and rationale.
3. **Seam verdict correctness.** Re-verify the headline claim with `deno doc packages/auth-better-auth/mod.ts`: that `NetscriptBetterAuthOptions` has no `plugins` field and `createBetterAuthBackend({ auth })` accepts a structural `BetterAuthInstance`. Confirm R0 (passthrough) is the right minimal seam and that R1 (plugin DB-schema generation) is correctly flagged as a hard prerequisite for the documented path to actually work at runtime.
4. **Honesty constraints.** Does the plan correctly require docs to state the R1 schema-gen requirement and the R2 interactive-flow caveat (magic-link/passkey) rather than implying full parity?
5. **Process gates.** Are the three drift-D1 gates (caveat-harvest, link-integrity build gate, seam-coverage discipline) concrete and enforceable, or hand-wavy?
6. **Scope/sequencing.** Is the R0 framework slice correctly ordered relative to the docs that document it? Any missing workstream or under-scoped slice?

## Verdict
Emit `PASS` or `FAIL_PLAN` with specific, file-referenced findings and your rulings on the 3 open questions. Two `FAIL_PLAN` cycles then escalate. Preserve lock hygiene: do not commit `deno.lock` or source churn.

## SKILL
- `.agents/skills/netscript-harness` — harness phases, PLAN-EVAL protocol, plan-gate, verdict definitions
- `.agents/skills/netscript-doctrine` — package/plugin archetype + public-surface gates (auth seam touches ARCHETYPE code)
- `.agents/skills/netscript-deno-toolchain` — `deno doc` / `deno doc --filter` to verify export surfaces (Fresh subpaths, auth options)
- `.agents/skills/openhands-handoff` — OpenHands run/verdict conventions, pr-comment output mode
- `.agents/skills/netscript-tools` — validation evidence + raw-git verification conventions


Issue/PR title: docs-v4: IA-deepening plan + seam audit + auth roadmap (planning only)

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
- Write /home/runner/work/_temp/openhands/27936594391-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27936594391-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-107/run-27936594391-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 107
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27936594391
