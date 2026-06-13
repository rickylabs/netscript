You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment iterations=700 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh

**RESEARCH COMPLETION (finish phase 1).** A prior run for [5d1 support spine] hit its iteration budget and committed an incomplete `research.md` plus real measurement output. This run FINISHES the research — it does not start over. Avoid all unnecessary rework.

Authority docs on this branch (read first): `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d1-plan.md` (execute only its MEASURE-FIRST + research portion) and the BINDING umbrella `plan.md` in the same dir.

**REUSE (do not redo):** Your prior run already wrote the MEASURE-FIRST numbers and inventory into the first ~140 lines of `research.md` — DO NOT re-run `deno doc --lint` / `deno check` / dry-run; trust and cite those committed numbers.

**WRITE-EARLY CONTRACT:** open `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/research.md` immediately and append into the existing skeleton as you go; the workflow auto-commits leftover workspace files even if you run out of budget, so never batch the write to the end. Keep `drift.md` (`D-5d1-n`) current. Stop exploring at ~60% of budget and spend the rest consolidating.

**FILL:** Fill the TODO sections that remain: (a) raw-material synthesis for the error-taxonomy + the ONE cross-cutting telemetry convention (reconcile `defer/telemetry.ts` vs `form/telemetry.ts`), (b) Market comparison with sources (error taxonomy + telemetry conventions in TanStack Start, Next.js App Router, Remix/React Router), (c) Gaps and blockers before design.

**Output:** completed `research.md` + current `drift.md` committed to THIS branch; summary via `OPENHANDS_SUMMARY_PATH` (never post PR comments yourself) with the MEASURE-FIRST table, what you reused from the prior artifacts, remaining gaps, and the final line `RESEARCH COMPLETE — READY FOR DESIGN TRIGGER` (or explicit blockers). Do NOT emit any `@openhands-agent` trigger block — the supervisor triggers the design phase manually after review.

Hard rules: research only — zero implementation; no lockfile changes; no `deno cache --reload`.

Issue/PR title: [5d1] fresh support spine — error · utils · vite config · interactive · mod skeleton (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27461621449-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27461621449-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-34/run-27461621449-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 34
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27461621449
