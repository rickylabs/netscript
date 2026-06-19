You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment run an adversarial IMPL-EVAL (final implementation gate) for the NetScript documentation-website authoring wave on this branch (`docs/content-architecture`). You are the EVALUATOR in a separate session from the author — be skeptical, try to break the work, do not author or edit docs, do not fix anything. Verdict only.

## What to evaluate
The 27-page authoring wave just landed (tip ~`9687f97f`). Evaluate the authored Markdown pages against the approved plan and ground-truth, then run the build gate.

Authored / changed pages (the wave under review):
- Tutorials (Learn ladder): `docs/site/tutorials/{first-workspace,build-a-service,background-jobs,durable-workflow,ingest-webhook}.md`
- How-to: `docs/site/how-to/{add-a-service,database-migration,queue-kv-cron,add-opentelemetry,customize-fresh-ui,deploy,author-a-plugin}.md`
- Explanation: `docs/site/explanation/{contracts,durable-workflows,observability,aspire}.md`
- Capabilities hub (10): `docs/site/capabilities/**` (index + services, background-jobs, durable-sagas, triggers, streams, database, kv-queues-cron, telemetry, fresh-ui)
- Resources: `docs/site/{glossary,cli-reference}.md`
- Chrome/wayfinding: `docs/site/_data.ts` (navSections contract), `docs/site/{index,why,quickstart}.vto` (landing dead-link fixes)

Grounding inputs (verify the pages are faithful to these — any invented/contradicted fact → FAIL_FIX):
- `.llm/tmp/run/docs-content-architecture--impl/doc-architecture-v2.md` (the approved SOTA plan)
- `.llm/tmp/run/docs-content-architecture--impl/ground-truth.md`
- `.llm/tmp/run/docs-content-architecture--impl/ground-truth-project-anatomy.md`
- `.llm/tmp/run/docs-content-architecture--impl/commits.md` (wave log + known backlog at the tail)

## Gate
Evaluate against `.llm/harness/evaluator/protocol.md`, the `SCOPE-docs.md` overlay, and the plan's §8 wave map. Emit exactly one verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT` (see `.llm/harness/evaluator/verdict-definitions.md`).

### Hard build gate (run it yourself)
From the repo root: `deno task --cwd docs/site build`. It must finish green (expect `🍾 Site built into _site`, ~150 files). Lume hard-fails on any render/template error, so a non-green build is an automatic `FAIL_FIX` — report the exact `TemplateError`/`TransformError` and offending page:line. Note (do not fail on) the non-fatal `Unknown language: "no-highlight"` highlighter warning — it is a known plugin-config backlog item, build still green.

## Adversarial focus (try hard to fail these)
1. **Accuracy vs ground-truth.** Spot-check per-page facts against `ground-truth*.md`: real ports (workers :8091, sagas :8092, triggers :8093, streams :4437, users-service :3001, Aspire dashboard :18888, fresh app :8010); `aspire run` (from `aspire/`) is step 2 BEFORE any `netscript db` command; JSR global-install path `deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts`; code shapes (`defineService`/`createService(...).serve()` two-API split, `@orpc/contract`+zod+`implement()`, `defineJobHandler`+`createJobTools`, `defineSaga(...).durability().state().on().build()`, `defineWebhook` on raw Hono routes — NOT oRPC); honest stub disclosure (streams producer/consumer + worker trace/progress are no-ops). Any fabricated or contradicted fact → FAIL_FIX with page:line.
2. **Fil d'Ariane (the learning thread).** Verify the continuous-app narrative is real and consistent across tutorials: worker `create-user-settings` publishes `UserSettingsCreated` → saga handles it + emits `sagaComplete` → trigger `enqueueJob`s a worker job. Verify every body page is a member of `navSections` (breadcrumb source) and that the prev/next chains resolve. Flag orphan pages.
3. **Whole-tree completeness.** Confirm every zone has an index + all briefed child pages present and substantive (not stubs). Cross-check against the plan's §8 wave map. Flag any hand-wave / thin page. Note: `tutorials/getting-started.md` is a known-stale orphan flagged for retirement (see commits.md backlog) — report it, classify as FAIL_FIX-minor or backlog at your discretion.
4. **Scope discipline.** Confirm `docs/site/reference/**` (22 generated units) is untouched, and `base.vto` / `styles/` / `_components/*.vto` / catalog / version pins / `packages/**` / `plugins/**` were not edited. Any such edit → FAIL_RESCOPE.
5. **Comp-tag rigor.** Confirm comp tags are balanced (the supervisor already reconciled 12 function-form callouts → tag form and 2 `function`-keyword breakers; verify no residual `{{ comp.callout({...}) }}` paired with `{{ /comp }}`, and no bare `function` keyword inside any comp-tag arg). The green build is necessary but spot-check the three reconciled tutorials.

## Output
Post your verdict as a SINGLE PR comment: the verdict token, the build result (exit + file count), the per-zone completeness/accuracy findings with page:line evidence, and for any FAIL the specific items + required fixes (these become the WSL Codex iteration backlog). Do NOT post a running status/progress comment — the docs workflow owns the PR status comment; post only your single verdict.


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
- Write /home/runner/work/_temp/openhands/27812125012-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27812125012-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-59/run-27812125012-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 59
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27812125012
