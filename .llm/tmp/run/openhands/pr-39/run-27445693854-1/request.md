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

**RE-DISPATCH — phase 1 of 2: RESEARCH ONLY.** The previous run (trace `.llm/tmp/run/openhands/pr-39/run-27442118991-1/` on this branch) hit the 500-iteration limit and wrote **no artifact files** — any completion claims in its summary are false, but its distilled findings are real. **Read its `summary.md` first and REUSE those findings instead of re-deriving them.**

Authority docs on this branch — read before anything else:
1. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d6-plan.md` — your full handover. Execute ONLY its MEASURE-FIRST + research portion now; `design.md`/`plan.md` come in a follow-up trigger after supervisor review of your research.
2. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` — BINDING umbrella target architecture (you are its enforcement unit: your phase-2 plan will carry the wave-closeout gate slices).

**WRITE-EARLY CONTRACT (non-negotiable):**
- Within your first ~15 actions, CREATE `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/research.md` as a skeleton (headings + TODO markers) and append findings incrementally as you learn. Start `drift.md` (entries `D-5d6-n`) the same way.
- The workflow auto-commits leftover workspace files when the run ends — whatever you wrote survives even if you hit the budget. An 80%-complete research.md on the branch beats a perfect one that never lands.
- Budget discipline: use `deno doc`, targeted grep, and headers; stop exploring at ~60% of budget and consolidate.

Scope of THIS run (research only):
- MEASURE-FIRST: combined `deno doc --lint` for `./query`, `./server`, and `.`; PLUS the whole-package baseline across all 12 entrypoints (your unit closes the wave — this number is the closeout denominator); `deno check --unstable-kv`; private-type refs; `deno publish --dry-run` status for `packages/fresh`.
- Inventory: `query/` (hooks, hydration, query-client, query-island — all tiny, 705B–1.9K) and `server/define-fresh-app.ts` (2.2K) + the full `server.ts` export surface.
- RFC 17 + 5b sdk research: how `createQueryFactories` and the `createServiceClient` Transport seam are meant to back the island query bridge; document the dehydrate/hydrate chain as it exists today and where it's missing. Market bar with sources: TanStack Start server-function + Query integration.
- RFC 14 seam audit inputs: the extension points `defineFreshApp` must protect (adapter seam) so unified mode never breaks the alpha surface.

Expected output: `research.md` + started `drift.md` committed to this branch; summary via `OPENHANDS_SUMMARY_PATH` (never post comments yourself) with the MEASURE-FIRST table (incl. whole-package baseline), what was reused from the prior trace, remaining gaps, and final line `RESEARCH COMPLETE — READY FOR DESIGN TRIGGER` (or explicit blockers).

Hard rules: PLAN-phase research only — zero implementation; no lockfile changes; no `deno cache --reload`. Root check excludes `packages/fresh` — always measure entrypoints directly.

Issue/PR title: [5d6] fresh query + server + final surface — RFC 17 bridge, defineFreshApp, RFC 14 seam audit (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27445693854-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27445693854-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-39/run-27445693854-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 39
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27445693854
