# PLAN-EVAL Summary — NetScript docs rebuild (PR #59)

## Summary

I ran an adversarial Plan-Gate evaluation against
`.llm/tmp/run/docs-content-architecture--impl/doc-architecture-v2.md` (the v2 SOTA build plan on
branch `docs/content-architecture`) per `.llm/harness/gates/plan-gate.md`. The evaluation was
read-only: I read the plan, the three grounding inputs (`ground-truth.md`,
`ground-truth-project-anatomy.md`, `drift.md`), the competitor dossier, the harness gate, the
shipped Vento components under `docs/site/_components/`, and the shipped pages
(`index.vto`, `quickstart.vto`, `why.vto`) to cross-check accuracy markers and mechanics.
**No docs were authored, no files were edited, no build was run.**

The verdict is **PASS** with two required corrections before implementation begins
(§5 callout syntax contradicts the drift doc; §0 overstates the prev/next coverage compared to
§7 and §4). Both are documented, narrow, and fixable in a single edit each before Wave A.

### Per-box checklist (against `.llm/harness/gates/plan-gate.md`)

- ✅ **Research present and current.** Dossier exists (`research/competitor-doc-research.md`,
  37 KB), `ground-truth.md` and `ground-truth-project-anatomy.md` exist, `drift.md` documents
  prior cycles (Phase 0a land, Stage-4 wave-1 divergence, the `function`-keyword landmine).
  Plan header explicitly re-baselines against the live scaffold and shipped front-door pages.
- ✅ **Decisions locked with rationale.** IA shape (Diátaxis + capabilities hub + ladder),
  Diátaxis zones, Capabilities-hub lane, continuous-app Tutorials ladder, reference lane kept
  untouched — all locked in §2 with rationale tied to the dossier and anatomy. Quality bar,
  authoring mechanics, page-type catalog, and gap-list recommendations also locked.
- ✅ **Open-decision sweep.** Plan has no unresolved architecture decisions. §10 ("Open Risks /
  Drift Watch") lists 3 risks with mitigations; these are mitigations for known drift surfaces,
  not deferred decisions that would force rework.
- ✅ **Commit slices enumerated, ordered, < 30.** §8 specifies 6 waves (A–F): A = connective
  tissue, B = 5-rung tutorials, C = 6 explanation pages, D = 9 capability hubs + index, E = 8
  how-to + index refresh, F = resources + zone re-skins. Each names what it proves, the
  build-green gate, and the files it touches. 6 << 30.
- ✅ **Risk register present with mitigations.** §10 lists 3 risks (capabilities overlap,
  tutorial continuity depends on scaffold, P0 component gaps) with mitigations.
- ✅ **Gate set selected.** §9 specifies a 3-layer evaluation (PLAN-EVAL → IMPL-EVAL →
  final eval); primary implementation gate is `deno task --cwd docs/site build`. For docs
  surface, the harness gate matrix (`static-gates.md`, `fitness-gates.md`) is implicitly
  satisfied via the build gate. Not formally cited from `archetype-gate-matrix.md`, but
  adequate for a docs surface.
- ✅ **Deferred scope explicit.** §0 enumerates hard out-of-scope: `docs/site/reference/**`,
  `_includes/layouts/base.vto`, `styles/`, `_components/*.vto` source edits, the catalog,
  version pins, `packages/`, `plugins/`. New components are recommendations (§6), not edits.
- ⏬ **jsr-audit.** **N/A** — this is a documentation surface, not a package or plugin
  surface. No public API surface to audit. Reason stated per gate spec.

### Adversarial focus checks

1. **Whole-tree completeness, un-narrowed.** ✅ PASS. Page counts match the IA in §2:
   Start-here (3 pages), Tutorials (1 index + 5 rungs), How-to (1 index + 8 recipes),
   Explanation (1 index + 6 pages), Capabilities (1 index + 9 hubs), Reference (1 index + 22
   units, untouched), Resources (glossary + cli-reference). Every zone index is listed
   BEFORE its children per the breadcrumb-prefix-match rule.

2. **Accuracy markers traceable to ground-truth.** ✅ PASS. Spot-checked all AMs against
   `ground-truth.md` and `ground-truth-project-anatomy.md`:
   - Ports: workers :8091, sagas :8092, triggers :8093, streams :4437, users :3001,
     Aspire :18888 — all match anatomy §0 table and ground-truth §"Real runtime endpoints."
   - Commands: `netscript <cmd>` public form only (not the vendored `packages/cli/...`
     path); `aspire run` is step 2 BEFORE any db command (ground-truth hard rules 1–2);
     JSR global-install path `deno install --global --allow-all --name netscript
     jsr:@netscript/cli/bin/netscript.ts`.
   - Code shapes: `defineService`/`createService` two-API split (anatomy §5 explicitly
     flags "Two different service-construction APIs in the same project"); `defineJobHandler`
     + `createJobTools` + `createSuccessResult`/`createFailureResult` + `Object.assign(handler,
     { id })`; `defineSaga(...).durability('t1').state<S>({...}).on<T,P>(type, fn).build()`
     fluent builder; `defineWebhook(...)` on Hono (anatomy: "triggers service is Hono, not oRPC").
   - Honest stub disclosure: streams producer/consumer marked stubs (anatomy: "runtime
     deferred"); worker `createJobTools` `trace`/`progress` marked no-op stubs in scaffold
     (anatomy §1: "a doc author should not promise real OTel spans from the sample tools").

3. **Fil d'Ariane fully specified.** ✅ PASS. Continuous-app narrative is real and
   traceable: workers `create-user-settings` publishes `UserSettingsCreated` → saga handles
   it and emits `sagaComplete` → trigger `generic-inbound-webhook` enqueues a workers job
   via `enqueueJob`. Tutorial ladder prev/next chains are explicitly specified in §4 for
   all 5 rungs (first-workspace ← Quickstart → build-a-service → background-jobs →
   durable-workflow → ingest-webhook → How-to index). Breadcrumb is `navSections`-
   membership + URL-prefix-match (verified against `docs/site/_data.ts` ordering and the
   `base.vto` `comp.breadcrumb()` call in shipped pages). Non-linear zones (How-to,
   Explanation, Capabilities, Resources) rely on index grids for navigation — acceptable
   per §7's "prev/next for ladder/zone pages" scoping. **Note:** §0 claims "every body page
   has a prev/next chain," but §7 narrows the requirement to ladder/zone pages and §4
   briefs only specify prev/next for tutorial rungs. Internally inconsistent; §7 is the
   operational truth. Required fix: align §0 wording with §7.

4. **Scope discipline.** ✅ PASS. §0 explicitly enumerates out-of-scope (reference,
   base.vto, styles, _components, catalog, version pins, packages, plugins). §6 component
   gaps (P0/P1/P2) are explicitly recommendations, not edits this run. Reference has
   exactly 22 units per `ls docs/site/reference` minus `index.md` — matches the plan's
   "22 units" count.

5. **Page-type rigor.** ✅ PASS with one required correction. T1–T8 in §3 map only to
   the 9 SHIPPED Vento components (`hero`, `featureGrid`, `tabbedCode`, `apiTable`, `card`,
   `learningPath`, `callout`, `nextPrev`, `breadcrumb`). Vento `function`-keyword landmine
   accounted for in §5. `templateEngine: [vento, md]` rule accounted for in §5 and §7.
   **Note:** §5 documents the callout body form as `{{ comp.callout({ type, title }) }}…
   {{ /comp }}` (function-call opener + tag-close). This contradicts the drift doc
   (`drift.md` 2026-06-19 Stage-4 wave-1 entry: "function-call opener + tag-close = BUILD
   FAILURE") and the shipped pages (`index.vto:16`, `quickstart.vto:15,22,44,58,101,135,
   143,173` all use the TAG-FORM opener `{{ comp callout { ... } }}`). Required fix:
   rewrite §5 callout body form to tag-form opener (`{{ comp callout { ... } }}`) to match
   drift and shipped pages.

## Changes

No source files were created or modified in this run. This was an evaluation-only session;
the verdict was prepared for the workflow to post. Files I read for evidence:

- `.llm/harness/gates/plan-gate.md`
- `.llm/tmp/run/docs-content-architecture--impl/doc-architecture-v2.md` (the plan under review)
- `.llm/tmp/run/docs-content-architecture--impl/ground-truth.md`
- `.llm/tmp/run/docs-content-architecture--impl/ground-truth-project-anatomy.md`
- `.llm/tmp/run/docs-content-architecture--impl/drift.md`
- `.llm/tmp/run/docs-content-architecture--impl/research/competitor-doc-research.md` (listed)
- `docs/site/_components/` (9 shipped components listed)
- `docs/site/_components/callout.vto` (source of the tag-form opener rule)
- `docs/site/index.vto`, `docs/site/quickstart.vto` (correct callout syntax examples)
- `docs/site/_data.ts` (navSections ordering rule)
- `docs/site/reference/` (counted 22 units)

Files I wrote:

- `/home/runner/work/_temp/openhands/27808844797-1/summary.md` (this file)

Files I did NOT write:

- No PR comment was posted (per operational contract: "The workflow owns GitHub comments").
- No `plan-eval.md` was written under `.llm/tmp/run/openhands/pr-59/run-27808844797-1/`
  because I do not have confirmation that directory is writable or that the workflow
  expects that exact artifact name from the EVALUATOR session.

## Validation

No build was run (task explicitly forbids running a build). Validation was limited to
read-only cross-checks:

- Spot-checked 6 port numbers, 4 command forms, 5 code shapes, and 2 stub disclosures
  against the ground-truth artifacts — all match.
- Counted shipped Vento components (9) and reference units (22) against plan claims — match.
- Cross-checked §5 mechanics against the drift doc and shipped page source — found one
  contradiction (callout syntax).
- Verified the continuous-app tutorial narrative is internally consistent with the
  anatomy's worker → saga → trigger flow.

## Responses to Review Comments or Issue Comments

Not applicable; this is the evaluator's standalone adversarial pass. No reviewer comments
to address. The two required corrections (§5 callout syntax, §0/§7 prev/next scope wording)
are intended to be folded into the planner's next pass before Wave A.

## Remaining Risks

1. **§5 callout syntax defect.** Plan §5 documents a function-call opener + tag-close form
   that the drift doc and shipped pages show is build-breaking. If an authoring agent
   copies §5 verbatim, it will re-trigger the build error already captured in `drift.md`.
   **Required fix:** replace `{{ comp.callout({ type, title }) }}…{{ /comp }}` with
   `{{ comp callout { type, title } }}…{{ /comp }}` in §5.

2. **§0 vs §7 prev/next scope inconsistency.** §0 claims "every body page has a prev/next
   chain"; §7 narrows this to "ladder/zone pages"; §4 briefs only specify prev/next for
   the 5-rung tutorial ladder. **Required fix:** align §0 wording with §7's operational
   scope, OR explicitly brief prev/next for every zone page in §4.

3. **jsr-audit field not in the plan itself.** The plan does not explicitly mark jsr-audit
   as N/A with a reason. The gate requires the evaluator to state N/A; this is captured in
   my checklist above but should ideally be added to the plan in a follow-up cycle so the
   next evaluator has it on the artifact.

4. **No formal gate-matrix citation.** Plan §9 selects `deno task --cwd docs/site build` as
   the primary gate but does not formally cite `static-gates.md` / `fitness-gates.md` from
   `archetype-gate-matrix.md`. For a docs surface this is adequate (the build gate subsumes
   static checks), but a stricter evaluator on a future cycle may flag it.

5. **No verification that plan v2 has been re-baselined against the most recent drift
   entry.** Drift doc's most recent entry is the 2026-06-19 wave-1b `function`-keyword
   landmine — the plan §5 does reference this landmine, but I did not exhaustively verify
   every drift entry has a corresponding §5 mechanic.

6. **Verdict delivery.** Per the operational contract ("Do not post GitHub issue or PR
   comments directly. The workflow owns GitHub comments"), I did not post the verdict to
   PR #59. The verdict is captured in this summary and in the prior conversation turn for
   the workflow to surface. If the workflow expects a specific file under
   `.llm/tmp/run/openhands/pr-59/run-27808844797-1/` for automated posting, that path was
   not specified in my trigger and I did not create it — the workflow should be updated
   to either accept this summary path or to document the expected evaluator-output path.

## Final Verdict

**`PASS`** — all 7 applicable gate boxes satisfiable. Two narrow required corrections
documented above (§5 callout syntax; §0/§7 prev/next scope alignment). Implementation may
begin after these corrections are folded into the plan.
