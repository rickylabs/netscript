You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/google/gemini-3.5-flash output=pr-comment iterations=2500 use harness

ROLE: Deep-search RESEARCH phase for the NetScript docs content-architecture rebuild (Track B). You are the research generator only — do NOT author site content, do NOT rewrite the plan, do NOT touch packages/ or plugins/ source. Produce structured research artifacts the supervisor will synthesize into the plan.

PRE-FLIGHT
- git fetch origin, then git reset --hard origin/docs/content-architecture.
- Read the EXISTING plan you are building on (do not redo it): docs/site/_plan/00..08 (esp. 01-positioning-brief, 02-information-architecture, 06-reference-site-teardown, 08-decisions-locked). 08 holds LOCKED user decisions — treat them as fixed constraints, do not relitigate.
- Skim the live docs system: docs/site/_config.ts, docs/site/_components (if any), base.vto, the Diátaxis dirs. Note which Lume/Vento features are already used vs available.

WRITE ARTIFACTS INCREMENTALLY under docs/site/_plan/research/ (create each file early, then grow it; the commit-back keeps partials if the budget runs out). Do them in THIS priority order so a partial run still delivers the most valuable findings first:

1. research/netscript-feature-landscape.md — EXHAUSTIVE inventory of what NetScript actually offers. Mine: the JSR @netscript namespace description, packages/* and plugins/* public surfaces (use `deno doc` per .agents/skills/netscript-deno-toolchain — do NOT hand-read every source file), and what a freshly scaffolded project ships. Group by capability: services/contracts, background jobs (workers), durable workflows (sagas/triggers/streams), Fresh UI, Aspire orchestration, database, telemetry/observability. This is the feature map the docs must showcase.

2. research/competitors/<name>.md — one file each for: laravel, medusa, tanstack (router + query + start docs), astro, lume (lume.land docs itself), plus market-fit competitors nestjs, encore, trpc, temporal, hono. For EACH: (a) core value prop + who it targets, (b) feature surface relevant to NetScript's overlap, (c) DOC ARCHITECTURE teardown — IA/nav model, Diátaxis usage, onboarding/learning-curve design (the "fil d'Ariane" from zero to productive), landing/why-page structure, signature components that make content spark (interactive examples, callouts, tabs, version switchers, copy-paste blocks, search), tone, and what specifically makes their docs excellent or weak. Cite URLs.

3. research/doc-architecture-patterns.md — cross-cutting synthesis of the patterns worth stealing across all the above: front-door/why-page design, layered complexity & progressive disclosure, capability-hub navigation, code-sample strategy, components-that-spark. Map each pattern to where NetScript should apply it.

4. research/lume-vento-plugins.md — what Lume + the Vento template engine (https://vento.js.org) + Lume plugins (components system, pagefind search, code_highlight, nav, sitemap, etc.) can do that NetScript's site is NOT yet using. Concrete leverage list: which plugin/feature enables which doc-quality pattern from #3. Reference Lume's OWN docs as the canonical example of a Lume-powered doc site.

5. research/market-fit.md — where NetScript fits in the market: the gap it fills (Deno-native, contract-first, durable-workflows-first, Aspire-orchestrated backend meta-framework), honest strengths/weaknesses vs the named competitors, and the adoption story a new dev needs to hear. Respect the locked positioning in 08: outcome-led hero, Alpha maturity (no production-ready/GA claims), Aspire as a hero-level differentiator with an explicit --no-aspire opt-out.

6. research/00-research-summary.md — index of all artifacts + the 10 highest-leverage findings the plan MUST act on, and any gaps left for a continuation run.

RULES
- Research only. No edits outside docs/site/_plan/research/. No package/plugin source changes. No plan or site-content rewrites.
- Web research is expected (competitor + Lume/Vento docs). Cite URLs in every artifact.
- Write files EARLY and grow them so a budget cutoff still leaves usable partials. Commit as you go if the harness allows.
- Final OPENHANDS_SUMMARY_PATH: list artifacts written, the 10 highest-leverage findings, and any gaps left for a continuation run.

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
- Write /home/runner/work/_temp/openhands/27794466530-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27794466530-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-59/run-27794466530-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 59
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/google/gemini-3.5-flash
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27794466530
