You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment iterations=1000 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh

**RESEARCH COMPLETION — PASS 2 (finish phase 1).** A prior completion run for [5d1 support spine] rebuilt the section structure + committed real measurements, then hit its iteration budget before writing the prose — `research.md` now has the correct headings with explicit `TODO:` / `(Placeholder…)` markers in the body. Your ONLY job this run: REPLACE EVERY `TODO:` and `(Placeholder…)` marker in `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/research.md` with real content. Do NOT restructure the document, do NOT re-run `deno doc --lint` / `deno check` / dry-run — trust the committed measurement artifacts and the numbers already in research.md. Avoid all rework; spend the entire budget on synthesis + sourced market research.

Authority docs on this branch (read first if needed): `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d1-plan.md` (research portion only) and the BINDING umbrella `plan.md` in the same dir.

**FILL:** Fill every TODO in research.md: the per-file doc-lint breakdown + remediation cost (line ~53), enumerate the remaining 12 items (line ~72), confirm the exact F-1 cap from doctrine (line ~92), the inventory summaries for handler.ts/primitives.ts/mod.ts/components/ErrorDisplay.tsx, cache mod.ts/cache-entry.ts, the wrapper surface, the seam + relocation candidacy, the curated-root policy question, the two telemetry export maps (span/event shapes, OTel alignment) for defer/telemetry.ts vs form/telemetry.ts, the raw-material synthesis for phase-2 design, the error-taxonomy + telemetry-convention market rows (TanStack Start, Next.js App Router, Remix/React Router) WITH SOURCES, and the Gaps and blockers section.

**WRITE-EARLY CONTRACT:** edit `research.md` in place and save after EACH marker you fill — never batch to the end; the workflow auto-commits leftover workspace files even on budget cutoff. Keep `drift.md` (`D-5d1-n`) current.

**Output:** `research.md` with ZERO remaining `TODO:`/`(Placeholder…)` markers + current `drift.md`, committed to THIS branch; summary via `OPENHANDS_SUMMARY_PATH` (never post PR comments yourself) listing the markers filled, sources cited, and the final line `RESEARCH COMPLETE — READY FOR DESIGN TRIGGER` (or explicit remaining blockers). Do NOT emit any `@openhands-agent` trigger block — the supervisor triggers the design phase manually after review.

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
- Write /home/runner/work/_temp/openhands/27463663315-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27463663315-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-34/run-27463663315-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 34
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27463663315
