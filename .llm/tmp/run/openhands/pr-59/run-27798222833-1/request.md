You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=100 use harness

ROLE: **Adversarial IMPL-EVAL — docs front door benchmark** for the NetScript docs
content-architecture rebuild (PR #59, branch `docs/content-architecture`). You are the
separate evaluator session (generator ≠ evaluator). The supervisor has landed the Phase-0a
chrome + components + the front-door pages (index landing, why, quickstart) as a Lume site
under `docs/site/`. Your job: **benchmark the documentation quality against the named
competitor frameworks and produce an exhaustive, prioritized list of concrete improvements.**

⚠️ ITERATION BUDGET — be economical and verdict-first. Do NOT rebuild the site from scratch
repeatedly. Build once to confirm green, then read the rendered/ source pages and evaluate.
Front-load the VERDICT line; if low on iterations, write the comment immediately.

READ:
- `docs/site/index.vto`, `docs/site/why.vto`, `docs/site/quickstart.vto` (the front door).
- `docs/site/_components/*.vto` (the component system) and `_includes/layouts/base.vto` (chrome).
- `docs/site/_plan/08-decisions-locked.md` (LOCKED decisions — do not propose violating them:
  hero tagline/sub-headline are verbatim-locked; Alpha framing; Aspire hero-level + --no-aspire;
  ONE honest comparison table, never combative; warm "we", no body emoji/hype).
- `docs/site/_plan/01-positioning-brief.md` (6 USPs, personas) and `03-page-outlines.md`.
- The B2 accuracy worklogs `docs/site/_plan/worklog/{index,why,quickstart}.md`.

BENCHMARK AGAINST (study their docs IA, onboarding, and "why adopt" framing):
- **Laravel** (docs depth, ergonomics-first onboarding), **Medusa** (modular/commerce backend),
  **TanStack** (typed DX, framework-agnostic docs), **Astro** (content-site polish, clarity),
  **Lume** (Deno-native static-site docs — our own engine; benchmark our docs vs theirs) and
  **Vento** (https://vento.js.org — concise template docs).

EVALUATE these dimensions, each scored A–F with concrete evidence + fix:
1. **First-5-minutes onboarding** — does quickstart get a dev to a running, observable
   workspace faster/clearer than Laravel/Astro? Cite specific friction.
2. **"Why adopt over X" clarity** — does the why page make a new dev genuinely want NetScript
   over assembling it themselves / over NestJS/Encore/tRPC/Temporal/Hono? Is the honest table
   persuasive without being combative?
3. **Feature landscape legibility** — can a newcomer see the full capability surface (services,
   sagas/durable workflows, observability, plugins, Aspire, fresh-ui) from the front door?
4. **Code-proof credibility** — is there ≥1 runnable, accurate proof per page? Are the API
   symbols/commands real (cross-check the worklogs)? Flag any drift.
5. **Information architecture & navigation** — Diátaxis clarity, plain-English labels, sidebar.
6. **Visual/comprehension polish vs Astro/Lume** — components, callouts, code tabs.

VERDICT — structured comment:
- **VERDICT line FIRST**: `IMPL-EVAL: PASS` | `FAIL_FIX` | `FAIL_RESCOPE` | `FAIL_DEBT`.
- Per-dimension A–F scorecard with one-line evidence each.
- **Exhaustive prioritized improvement list** (P0/P1/P2), each item: page, concrete change,
  why it raises adoption. You MAY produce additional markdown files under
  `docs/site/_plan/eval/` giving concrete direction/outlines for the supervisor + Codex to
  action — do so when a fix needs more than a sentence.
- Write `.llm/tmp/run/docs-content-architecture--impl/evaluate.md` with the verdict + scorecard
  and commit it.

HARD CONSTRAINTS:
- **Docs lane only.** Do NOT edit `packages/`, `plugins/`, version pins, `scaffold-versions.ts`,
  `aspire/src/public/mod.ts`, the catalog, or lock files. Do NOT run `deno cache --reload`.
  Any artifacts you add are limited to `docs/site/_plan/**` and the run `evaluate.md`.
- **Do NOT merge** this PR. **Do NOT publish** anything. Respect LOCKED `08` decisions.

Report the run's exit status and a one-line summary: VERDICT + the single highest-leverage
improvement.


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
- Write /home/runner/work/_temp/openhands/27798222833-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27798222833-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-59/run-27798222833-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 59
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27798222833
