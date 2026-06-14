You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment iterations=800 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh
- frontend-design
- ux-patterns

**RE-DISPATCH — phase 1 of 2: RESEARCH ONLY.** The previous run (trace `.llm/tmp/run/openhands/pr-38/run-27442097563-1/` on this branch) hit the 500-iteration limit and wrote **no artifact files** — any completion claims in its summary are false, but its distilled findings are real. **Read its `summary.md` first and REUSE those findings instead of re-deriving them.**

Authority docs on this branch — read before anything else:
1. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d5-plan.md` — your full handover. Execute ONLY its MEASURE-FIRST + research portion now; `design.md`/`plan.md` come in a follow-up trigger after supervisor review of your research.
2. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` — BINDING umbrella target architecture.

**WRITE-EARLY CONTRACT (non-negotiable):**
- Within your first ~15 actions, CREATE `.llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/research.md` as a skeleton (headings + TODO markers) and append findings incrementally as you learn. Start `drift.md` (entries `D-5d5-n`) the same way.
- The workflow auto-commits leftover workspace files when the run ends — whatever you wrote survives even if you hit the budget. An 80%-complete research.md on the branch beats a perfect one that never lands.
- Budget discipline: symbol maps from `deno doc`, export statements, and targeted grep — don't read `schema-adapter.ts` (16.3K) / `types.ts` (16K) / `field-descriptors.ts` (15.5K) end-to-end; stop exploring at ~60% of budget and consolidate.

Scope of THIS run (research only):
- MEASURE-FIRST: combined `deno doc --lint` for `./form`; `deno check --unstable-kv`; private-type-ref count; over-cap inventory (16.3K/16K/15.5K trio across the 26-file cluster).
- Symbol map of `./form` public surface + the descriptor/adapter/state internal seams (decomposition raw material).
- fresh↔fresh-ui seam analysis: read `packages/fresh-ui/registry/components/ui/form-field.tsx`, `registry/lib/control-props.ts`, and `packages/fresh-ui/docs/l0-conventions.md`; document the exact state the form system must emit (errors, pending, values) and the `data-*`/ARIA attribute contract fresh-ui expects. This is the marquee integration of the wave — the research must nail the current truth on both sides.
- Standard Schema landscape with sources (zod/valibot/arktype interop) as candidate target for `schema-adapter.ts`; progressive-enhancement market bar (Remix/React Router actions, Next.js server actions + useActionState, TanStack Form) — gaps worth closing vs deferring.

Expected output: `research.md` + started `drift.md` committed to this branch; summary via `OPENHANDS_SUMMARY_PATH` (never post comments yourself) with the MEASURE-FIRST table, seam findings, what was reused from the prior trace, remaining gaps, and final line `RESEARCH COMPLETE — READY FOR DESIGN TRIGGER` (or explicit blockers).

Hard rules: PLAN-phase research only — zero implementation; no lockfile changes; no `deno cache --reload`. Root check excludes `packages/fresh` — always measure entrypoints directly.

Issue/PR title: [5d5] fresh form — RFC 15 forms consuming fresh-ui seams (PLAN pending)

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
- Write /home/runner/work/_temp/openhands/27445678290-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27445678290-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-38/run-27445678290-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 38
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27445678290
