You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=google/gemini-3.5-flash output=pr-comment iterations=1800 use harness

**Pipeline step 1 — Deep-search research (Gemini 3.5 flash).** You are the RESEARCH lane for the NetScript documentation rebuild (PR #59). Do NOT author doc pages and do NOT touch `docs/site/reference/**`, `packages/`, or `plugins/`. Your deliverable is a research dossier the supervisor will turn into the build plan, which `minimax-m3` will then PLAN-EVAL.

Write output INCREMENTALLY to a committed artifact so nothing is lost if you hit the iteration budget. Create this file early and grow it section by section, committing as you go on this PR branch (`docs/content-architecture`):

`.llm/tmp/run/docs-content-architecture--impl/research/competitor-doc-research.md`

Also write the required `OPENHANDS_SUMMARY_PATH` before exit and summarize findings in the PR comment.

### What to research (be exhaustive, concrete, cite real URLs and page names)

**A. Documentation-architecture teardown** of the reference sites — open the LIVE docs, do not work from memory:
- Medusa (https://docs.medusajs.com/) — especially how they document a MODULE and the framework recipes.
- TanStack Router/Query/Start (https://tanstack.com/router/latest/docs) — multi-library doc shell, framework-adapter tabs, API refs, examples gallery.
- Laravel (https://laravel.com/docs) — breadth + long complete single-feature pages, on-page TOC, Prologue/Getting Started/Architecture Concepts/The Basics/Digging Deeper sequencing.
- Astro (https://docs.astro.build/) — Diataxis-influenced IA, recipes, integrations directory, polished component set (tabs, file-tree, callouts, badges).
- Lume (https://lume.land/) — NetScript's site is built on Lume; what Lume's own docs do well.

For EACH: the full IA/sidebar tree (top + sub levels), the distinct PAGE TYPES and each page's required section order, how one large feature is decomposed across multiple pages and cross-linked, the visual/interactive COMPONENTS, code-sample patterns, wayfinding (sidebar depth, breadcrumbs, prev/next, on-page TOC, search, versioning), and the concrete DEPTH SIGNALS that make them feel exhaustive and production-grade. End each with a "what to steal for NetScript" list.

**B. Value/features + market fit.** NetScript is a Deno-native, contracts-first backend framework (typed oRPC contracts, services, a plugin model for background processing = workers/sagas/triggers/streams, Postgres+Prisma, KV/queue/cron, OpenTelemetry built into handlers, a Fresh UI app, Aspire orchestration). Compare positioning vs NestJS, Encore, tRPC-stacks, Temporal, Hono: each one's headline value, what a developer evaluates before adopting, and the doc patterns that drive adoption. Produce a "market-fit angle" the docs should lead with, and a feature-coverage checklist the site MUST showcase to be credible.

**C. Lume + Vento + plugin leverage.** The site already uses Lume v2.5 + Vento, with components hero/featureGrid/apiTable/tabbedCode/card/callout/breadcrumb(auto)/nextPrev(auto)/learningPath, an auto-generated `deno doc` reference lane (KEEP), and a layout that auto-injects breadcrumb+nextPrev. Research what is achievable within this stack to reach the reference bar — which competitor patterns map to existing components, and which would need NEW Lume/Vento components or plugins (name them concretely: version switcher, file-tree, tabbed-runtime code, param tables, on-this-page TOC, copy button, cards grid, badges, diagrams, search). base.vto/styles are centrally owned — list as recommendations, not edits.

### Output contract
A single dossier with sections A/B/C, each concrete and citation-backed, ending with: (1) a recommended deep multi-level IA outline for NetScript (Diataxis body + capabilities/modules hub lane + getting-started ladder + reference), (2) a page-type catalog, and (3) a prioritized component/design-system gap list. Aim for genuine enterprise-doc depth — explicitly NOT minimalistic. Commit the file to the branch and summarize in the PR comment.


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
- Write /home/runner/work/_temp/openhands/27803608207-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27803608207-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-59/run-27803608207-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 59
- is_pr: true
- output_mode: pr-comment
- selected_model: google/gemini-3.5-flash
- selected_provider: GEMINI
- action_run: https://github.com/rickylabs/netscript/actions/runs/27803608207
