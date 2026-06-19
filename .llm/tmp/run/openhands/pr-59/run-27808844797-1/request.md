You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment run an adversarial PLAN-EVAL (hard gate) for the NetScript documentation-website rebuild. You are the EVALUATOR in a separate session from the planner — be skeptical, try to break the plan, do not author docs, do not edit any files, do not run a build. Verdict only.

## What to evaluate
The plan deliverable on this branch (`docs/content-architecture`):

- `.llm/tmp/run/docs-content-architecture--impl/doc-architecture-v2.md` — the SOTA build plan (PRIMARY artifact under review).

Grounding inputs the plan claims to be built on (verify the plan is faithful to these):
- `.llm/tmp/run/docs-content-architecture--impl/research/competitor-doc-research.md` (the dossier)
- `.llm/tmp/run/docs-content-architecture--impl/ground-truth.md`
- `.llm/tmp/run/docs-content-architecture--impl/ground-truth-project-anatomy.md`
- `.llm/tmp/run/docs-content-architecture--impl/drift.md` (run history / prior decisions)

## Gate
Evaluate strictly against `.llm/harness/gates/plan-gate.md`. A plan PASSES only if EVERY checklist box is satisfiable; any unchecked box → `FAIL_PLAN`. For docs surface, `jsr-audit` is `N/A` (state the reason). Map each gate box to concrete evidence in `doc-architecture-v2.md`:

- Research present and current; plan re-baselined against current state.
- Decisions locked with rationale (IA shape, Diátaxis zones, Capabilities-hub lane, continuous-app Tutorials ladder, reference lane kept untouched).
- Open-decision sweep — any deferred decision that would force rework if deferred → FAIL_PLAN.
- Commit slices enumerated, ordered, < 30, each naming what it proves + gate + files (the §8 waves A–F + per-page authoring map).
- Risk register present with mitigations (§10).
- Gate set selected for the docs surface + scope overlays.
- Deferred scope explicit.

## Adversarial focus (try hard to fail these)
1. **Whole-tree completeness, un-narrowed.** The deliverable is the ENTIRE site arborescence (§2), not the front page. Confirm every zone has an index + all child pages briefed (Start-here, Tutorials ×5, How-to ×8, Explanation ×6, Capabilities ×9, Resources ×2). Flag any zone with hand-wave coverage.
2. **Accuracy markers traceable to ground-truth.** Spot-check §4 per-page accuracy markers against `ground-truth.md` / `ground-truth-project-anatomy.md`: real ports (workers :8091, sagas :8092, triggers :8093, streams :4437, users :3001, Aspire :18888), real commands (`netscript …` public form; Aspire `aspire run` is step 2 BEFORE any db command; JSR global-install path), real code shapes (`defineService`/`createService` two-API split, `defineJobHandler`, `defineSaga` builder, `defineWebhook` Hono), and honest stub disclosure (streams producer/consumer + worker trace/progress are no-ops). Any invented/contradicted fact → FAIL_PLAN.
3. **Fil d'Ariane fully specified.** Verify the continuous-app tutorial narrative is real (workers `create-user-settings` publishes `UserSettingsCreated` → saga handles it → trigger `enqueueJob`s a worker job) and that breadcrumb (navSections membership) + prev/next chains are specified for every body page.
4. **Scope discipline.** Confirm the plan keeps `docs/site/reference/**` (22 units) untouched and treats `base.vto` / `styles/` / `_components/*.vto` / catalog / version pins / packages / plugins as out-of-scope; component gaps are recommendations, not edits this run.
5. **Page-type rigor.** Confirm the page-type catalog (T1–T8) maps only to the 9 SHIPPED Vento components and that the Vento `function`-keyword landmine + `templateEngine: [vento, md]` rule are accounted for.

## Output
Post your verdict as a PR comment: `PASS` or `FAIL_PLAN`, the per-box checklist result with evidence, and for any FAIL the specific items + required fixes. Do NOT post a running status/progress comment — the docs workflow owns the PR status comment; post only your single verdict.


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
- Write /home/runner/work/_temp/openhands/27808844797-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27808844797-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-59/run-27808844797-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 59
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27808844797
