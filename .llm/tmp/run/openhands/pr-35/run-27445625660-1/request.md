You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment iterations=1000 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh
- frontend-design
- ux-patterns

**RE-DISPATCH — phase 1 of 2: RESEARCH ONLY.** The previous run (trace `.llm/tmp/run/openhands/pr-35/run-27442040668-1/` on this branch) ran out of iteration budget and wrote **no artifact files** — any completion claims in its summary are false, but its distilled findings are real. **Read its `summary.md` first and REUSE those findings instead of re-deriving them.**

Authority docs on this branch — read before anything else:
1. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d2-plan.md` — your full handover. Execute ONLY its MEASURE-FIRST + research portion now; `design.md`/`plan.md` come in a follow-up trigger after supervisor review of your research.
2. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` — BINDING umbrella target architecture.

**WRITE-EARLY CONTRACT (non-negotiable):**
- Within your first ~15 actions, CREATE `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/research.md` as a skeleton (headings + TODO markers) and append findings incrementally as you learn. Start `drift.md` (entries `D-5d2-n`) the same way.
- The workflow auto-commits leftover workspace files when the run ends — whatever you wrote survives even if you hit the budget. An 80%-complete research.md on the branch beats a perfect one that never lands.
- Budget discipline is CRITICAL here: this is the heaviest cluster. NEVER read the over-cap files end-to-end — build the symbol map from `deno doc`, export statements, and targeted grep. Stop exploring at ~60% of budget and consolidate.

Scope of THIS run (research only):
- MEASURE-FIRST: combined `deno doc --lint` for `./builders`; `deno check --unstable-kv`; private-type-ref count; over-cap inventory (`builders/mod.ts` 41.5K, `define-page/builder.tsx` 38.6K, `types.ts` 22.6K, `navigation.tsx` 20.7K, `runtime.tsx` 18.6K, `define-page.test.tsx` 46K).
- PUBLIC SYMBOL MAP: every exported symbol of `./builders` with its defining file and internal dependencies — this map is the decomposition's foundation and the single most valuable research artifact.
- Identify the island/hydration seam that 5d6 (query bridge) will consume, and the streaming touchpoints owned by 5d4 (`createStreamingResponse` / `createIncrementalStreamingResponse` call sites in the builder).
- DSL market bar with sources: TanStack Start route/loader API, Next.js App Router conventions, Remix data APIs — what `definePage` must match or beat.

Expected output: `research.md` + started `drift.md` committed to this branch; summary via `OPENHANDS_SUMMARY_PATH` (never post comments yourself) with the MEASURE-FIRST table, symbol-map stats, what was reused from the prior trace, remaining gaps, and final line `RESEARCH COMPLETE — READY FOR DESIGN TRIGGER` (or explicit blockers).

Hard rules: PLAN-phase research only — zero implementation; no lockfile changes; no `deno cache --reload`. Root check excludes `packages/fresh` — always measure entrypoints directly.

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
- Write /home/runner/work/_temp/openhands/27445625660-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27445625660-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-35/run-27445625660-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 35
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27445625660
