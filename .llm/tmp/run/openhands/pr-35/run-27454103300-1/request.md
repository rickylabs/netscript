You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment iterations=800 use harness

PHASE 2 of 2 — DESIGN + PLAN for [5d2 builders]. Authority docs on this branch: .llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d2-plan.md + BINDING umbrella plan.md in the same dir. REUSE the committed phase-1 research at .llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/research.md — do not re-derive it. Deliver design.md + plan.md + context-pack.md and update drift.md (entries D-5d2-n), committed to this branch per the handover's expected-output spec; plan.md MUST end with: Review map · Assumptions · Questions for supervisor · Dependencies & merge impact · Side-effect ledger. WRITE-EARLY CONTRACT: create skeleton files within your first ~15 actions, append incrementally, consolidate at ~60% budget. Hard rules: PLAN only — zero implementation; no lockfile changes; no deno cache --reload. On success END your summary with this exact PLAN-EVAL trigger block (on failure: blockers, no trigger

Issue/PR title: [5d2] fresh builders — definePage DSL decomposition (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27454103300-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27454103300-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-35/run-27454103300-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 35
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27454103300
