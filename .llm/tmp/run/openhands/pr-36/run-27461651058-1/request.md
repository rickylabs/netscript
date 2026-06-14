You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment iterations=800 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh
- aspire

**PHASE 2 of 2 — DESIGN + PLAN for [5d3 route — manifest + contract runtime].** Phase-1 research is COMPLETE and committed on this branch — REUSE it, do not re-derive.

Authority docs (read first): `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d3-plan.md` and the BINDING umbrella `plan.md` in the same dir.

**REUSE:** `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/research.md` plus the committed measurement artifacts in that dir (`deno-doc-lint.txt`, `deno-doc-lint-raw.txt`, `deno-doc-route.json`, `dry-run-raw.txt`). Do NOT re-run the measurement sweeps.

**Deliver** to `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/`: `design.md`, `plan.md` (PROPOSED slice lock, ≤30 slices, per-slice gates + retired doc-lint/over-cap budget), `context-pack.md`, and update `drift.md` (`D-5d3-n`). `plan.md` MUST end with: **Review map** · **Assumptions** · **Questions for supervisor** · **Dependencies & merge impact** · **Side-effect ledger**.

**WRITE-EARLY CONTRACT:** create the skeleton files within your first ~15 actions and append incrementally; the workflow auto-commits leftover workspace files even on budget cutoff. Stop exploring at ~60% budget and consolidate.

**Output:** artifacts committed to THIS branch; summary via `OPENHANDS_SUMMARY_PATH` with artifact paths + commit hashes, the MEASURE-FIRST table, proposed slice count, top-5 decisions/risks, final line `READY FOR PLAN-EVAL` (or blockers). Do NOT emit any `@openhands-agent` block — the supervisor triggers PLAN-EVAL manually.

Hard rules: PLAN only — zero implementation; no self-eval, no merging; no lockfile changes; no `deno cache --reload`.

Issue/PR title: [5d3] fresh route — manifest + contract runtime (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27461651058-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27461651058-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-36/run-27461651058-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 36
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27461651058
