You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=120 use harness

ROLE: **Adversarial PLAN-EVAL** for the NetScript docs **content-architecture rebuild** (this PR, branch `docs/content-architecture`, tip `0aa65579`). You are the **separate evaluator session** — the supervisor (Claude) authored this plan; challenge it hard and push the bar higher, do not rubber-stamp. **In-run plan refinements AUTHORIZED**: if you find a gap you MAY edit/add Markdown under `docs/site/_plan/**` and commit it, justifying each edit in your verdict.

⚠️ ITERATION BUDGET — a prior run of this task hit the iteration limit and produced NO verdict. Be economical:
- Do **not** read all 15 research files line-by-line. The supervisor already synthesized them into `09-research-integration.md` — that file IS your primary target. Spot-check research only where you doubt a specific claim.
- Cap your own `deno doc` audits to ~5 representative units (e.g. `@netscript/core`, `@netscript/runtime`, `@netscript/fresh-ui`, one plugin, `@netscript/cli`) to validate the inventory — do NOT doc all 25.
- Front-load the VERDICT: produce your PASS/FAIL_PLAN line and the blocking-gap list EARLY, then elaborate. If you sense you are running low on iterations, WRITE THE VERDICT COMMENT IMMEDIATELY rather than continuing to read.

READ (prioritized, not exhaustive):
- PRIMARY: `docs/site/_plan/09-research-integration.md` (supervisor Stage-2 synthesis) + `briefs/00-INDEX.md` + `briefs/phase-1-front-door.md` (the Stage-4 dispatch map + first briefs).
- CONTEXT: `08-decisions-locked.md` (LOCKED user decisions — respect; you may flag one as a user recommendation but never silently override) and skim `00`–`07` for the IA/engine baseline.
- GATES: `.llm/harness/gates/plan-gate.md` + `.llm/harness/evaluator/plan-protocol.md`; apply `SCOPE-docs.md`.

CHALLENGE THESE (be adversarial; assume the plan is too comfortable):
1. **Five engine decisions (`09 §3`: D-E1 nav.ts hybrid/keep-manual-navSections, D-E2 Shiki, D-E3 toc, D-E4 sitemap, D-E5 search defer).** Firm adjudication per point. Does keeping manual `navSections` fight a scalable IA? Is the Shiki call hand-wavy? Anything mis-deferred? Edit `09 §3` if you'd change a call.
2. **FULL feature-landscape coverage (user north-star).** Cross-check capability-hub clusters in `briefs/00-INDEX.md §Phase 3` vs the authoritative 21-package + 4-plugin inventory (`09 §2a`). Does EVERY public capability get a reachable, intent-named home? Interrogate the `watchers` open question. (Use your ~5 `deno doc` spot-checks here.)
3. **Adoption bar vs Laravel/Medusa/TanStack/Astro/Lume.** Benchmark page-level ambition (`09 §5` exemplar assignments + `03` outlines). Name the specific pages that merely *match* instead of *beat* the competitor docs, and what would raise each.
4. **The "why" page + honest comparison (`08` Q4, `phase-1-front-door.md`).** Is one honest table enough to win a skeptical engineer? Is "when NOT to use" genuinely honest or performative?
5. **Phase sequencing under engine work.** Does Phase 0 carry too much (components + nav + Shiki + toc + sitemap + callout shim) to ship cleanly? Split engine into a pre-phase? Is "parallel prose while components build" safe?
6. **Accuracy-guardrail teeth (`09 §2c`).** Is "verify every API via `deno doc`" enforceable per brief or just hope? Propose a concrete gate if not.
7. **Plan-Gate checklist** (`gates/plan-gate.md`): mark each item satisfied/unsatisfied with one-line evidence.

OUTPUT — a structured verdict comment:
- **VERDICT line FIRST**: `PLAN-EVAL: PASS` (implementation-ready, gate satisfied) or `PLAN-EVAL: FAIL_PLAN` (with the exact blocking gaps that must close before authoring).
- Per-challenge findings (1–7) — specific, actionable, no generic praise.
- Plan-Gate checklist pass/fail.
- Refinements made (each `_plan/` edit you committed + why), if any.
- Also write the verdict to `.llm/tmp/run/docs-content-architecture--planeval/plan-eval.md` and commit it.

HARD CONSTRAINTS:
- **Docs/planning lane ONLY.** Do NOT edit `packages/`, `plugins/`, version pins, `scaffold-versions.ts`, `aspire/src/public/mod.ts`, the catalog, or lock files. Do NOT run `deno cache --reload`. Refinements limited to `docs/site/_plan/**` Markdown.
- **Do NOT merge** this PR. **Do NOT publish** anything.
- Respect LOCKED `08` decisions; surface any you'd revisit as a user recommendation, not an edit.
- Two FAIL_PLAN cycles then escalate.

Report the workflow run's exit status and a one-paragraph summary of the single most important bar-raising change you demand.


Issue/PR title: docs: content-architecture rebuild (Track B)

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
- Write /home/runner/work/_temp/openhands/27795772956-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27795772956-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-59/run-27795772956-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 59
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27795772956
