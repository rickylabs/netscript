# F1 Adversarial Review — locked roadmap design

## Overall Verdict

This plan is **not PLAN-EVAL-ready**. It has multiple BLOCKERs against the harness Plan-Gate: a locked decision overstates its evidence, the open-decision sweep declares "no rework" while the issue graph is already built on an unresolved fork, and the flagship dashboard/telemetry co-land gate is not actually encoded in the child issue dependencies. A strict PLAN-EVAL should return `FAIL_PLAN` until those are corrected in the locked artifacts, not hand-waved at ratification.

## Findings

### F1-01 — BLOCKER — LD-2 turns an incomplete sample into a locked fact

- **Artifact:** `plan.md` lines 61-63; `research.md` lines 24-27 and 41-46.
- **Problem:** LD-2 says the fresh-ui/eis-chat L0-L2 layer is "byte-identical copy-source" and uses that as the rationale for "do NOT re-import L0-L2." The cited corpus does not prove that. The actual evidence says only 5 of 37 shared-name component pairs were verified byte-identical/near-identical, and 32 were explicitly unsampled.
- **Evidence:** `analysis/A-dashboard/03-fresh-ui-vs-nsone-gap-inventory.md` lines 85-89 says only 5 of 37 shared pairs were verified; lines 117-123 say the 32 unsampled pairs still need a scripted full-tree diff; lines 145-149 say "likely identical" is not a proven universal fact.
- **Why this fails PLAN-EVAL:** Plan-Gate requires decisions locked with rationale. This rationale is materially overstated and directly affects DDX-0 scope/cost.
- **Fix:** Either run and cite the scripted full-tree diff before PLAN-EVAL, or rewrite LD-2/research Finding #1 as "sampled L0-L2 files are byte-identical; remaining 32 require DDX-0 verification" and keep DDX-0 acceptance as the proving gate.

### F1-02 — BLOCKER — OF-10 is misclassified as safe to defer, but the current issue graph already chose the per-capability branch

- **Artifact:** `plan.md` lines 120 and 125-129; `design/A-dashboard/epic-and-issues.md` lines 209-219, 252-276, and 290-295.
- **Problem:** OF-10 says deferring the per-capability-vs-flat IA decision only reduces beta.6 scope and causes "not plan rework." That is false for the locked artifact. The beta.6 dashboard plan has already rewritten DDX-10 into a host/registry that depends on DDX-17, added DDX-18a-d per-capability sections to beta.6, and included those sections in the milestone summary.
- **Evidence:** DDX-10 now depends on DDX-17 (`design/A-dashboard/epic-and-issues.md` line 219). DDX-17 blocks DDX-18, DDX-10, and DDX-19 (line 264). DDX-18a-d are beta.6 slices (lines 267-276 and 294). The open question itself admits the branch adds DDX-17 and DDX-18a-d to the beta.6 critical path (`design/A-dashboard/open-questions.md` lines 88-92).
- **Why this fails PLAN-EVAL:** Plan-Gate says any open decision that would force rework when deferred is `FAIL_PLAN`. Reverting to a flat list would require editing DDX-10 scope, dependencies, DDX-16 smoke coverage, milestone summary, and slice count.
- **Fix:** Mark OF-10 "must resolve now" before PLAN-EVAL, or include two complete issue graphs: per-capability beta.6 and flat-list beta.6 fallback, with the selected one explicitly locked after owner ratification.

### F1-03 — BLOCKER — The flagship DDX-8 co-land gate is incomplete in the actual dashboard issue text

- **Artifact:** `plan.md` lines 46-49, 61, 88-95, 103-105, and 135; `design/A-dashboard/epic-and-issues.md` lines 193-200 and 242-246; `design/B-telemetry/epic-and-issues.md` lines 107-144.
- **Problem:** The integrated plan says the flagship trace requires telemetry T4, T5, T6, and T7. The DDX-8 child issue only names the telemetry epic generically and specifically mentions fan-in links plus the triggers bugfix. It omits T6 as a hard dependency even though the plan calls oRPC span creation a silent no-op today, and it omits T7 even though DDX-8 consumes `TelemetryQueryPort` and the plan says DDX-3 co-lands with T7.
- **Evidence:** `plan.md` line 94 says DDX-8 requires T4+T5(+T6)+T7; line 135 says hard co-land gate includes T4/T5/T6/T7. But `design/A-dashboard/epic-and-issues.md` line 199 only says `epic:telemetry-revamp` with "fan-in links + triggers bugfix"; T6/T7 are not named. T6 is explicitly "on the Flow-B critical path" in telemetry (line 118), and T7 is the dashboard query/export surface (lines 120-131).
- **Why this fails PLAN-EVAL:** The co-land gate is load-bearing. If implementers file the child issue as written, DDX-8 can be accepted with T6/T7 missing and still render severed or query the wrong surface.
- **Fix:** Edit DDX-8 and DDX-16 to hard-depend on T4/T5/T6/T7 by ID, and add acceptance criteria that fail if the oRPC callback is span-created and queryable only through mocks or Aspire-only fallback.

### F1-04 — MAJOR — DDX-16 does not actually depend on all beta.6 dashboard scope

- **Artifact:** `plan.md` lines 92-95; `design/A-dashboard/epic-and-issues.md` lines 242-246 and 290-295.
- **Problem:** The integrated DAG routes DDX-17 → DDX-18a-d into DDX-16, and the beta.6 milestone summary includes DDX-17 and DDX-18a-d. The DDX-16 issue text says it depends on "all beta.6 core" but only lists DDX-3...13 and DDX-5...12, which excludes DDX-0, DDX-1, DDX-2, DDX-4, DDX-14, DDX-15, DDX-17, and DDX-18a-d.
- **Evidence:** `plan.md` line 95 puts DDX-17 and DDX-18a-d before DDX-16. `design/A-dashboard/epic-and-issues.md` line 294 includes DDX-17 and DDX-18a-d in beta.6. DDX-16's dependency line 246 omits them.
- **Fix:** Replace the range shorthand with an explicit dependency list for every beta.6 slice DDX-0 through DDX-18d that DDX-16 smokes, and name the panel/section smoke assertions for DDX-17/18.

### F1-05 — MAJOR — PR taxonomy is invalid/incomplete for the drafted issue labels

- **Artifact:** `.github/labels.yml` lines 1-13 and 139-151; `plan.md` line 111; `design/A-dashboard/epic-and-issues.md` lines 278-280; `design/CD-docs/epic-and-issues.md` lines 51-53, 83-85, 113-114, and 140-142; `design/E-desktop/epic-and-issues.md` lines 3-6.
- **Problem:** The drafts use `wave:v1`, `wave:v1-min`, `wave:defer`, and `wave:v2`, but `.github/labels.yml` contains no `wave:*` labels at all. `wave:v2` is not in the canonical netscript-pr taxonomy, which allows only `wave:v1`, `wave:v1-min`, and `wave:defer`. The plan's owner action only says create milestones and epic labels; it does not call out missing wave labels or the invalid `wave:v2`.
- **Evidence:** `.github/labels.yml` declares `type:`, `status:`, `priority:`, `area:`, `ci:`, and `gate:` labels, but no `wave:` block. DDX-19 uses `wave:v2` at `design/A-dashboard/epic-and-issues.md` line 279.
- **Fix:** Add an owner action to create/sync the valid `wave:*` labels before filing, change DDX-19 to `wave:defer`, and remove all `wave:v2` references unless the PR skill and `.github/labels.yml` are updated first.

### F1-06 — MAJOR — The plan says every new public surface has `gate:jsr`, but the issue labels do not

- **Artifact:** `plan.md` lines 168-174; `research.md` lines 51-71; `design/A-dashboard/epic-and-issues.md` lines 68-80, 98-110, 130-145, and 252-264; `design/E-desktop/epic-and-issues.md` lines 68-90.
- **Problem:** The integrated plan claims each planned public-surface delta is addressed by a named slice with `gate:jsr`. The actual issue drafts omit `gate:jsr` from several public-surface-changing slices: DDX-0 (`@netscript/fresh-ui` L3 registry/export), DDX-2 (`packages/plugin-dashboard-core` new published package/contracts), DDX-4 (`plugins/dashboard` new published plugin), DDX-17 (`DashboardPanelContribution` published contract), and #E1 (`@netscript/sdk` public exports).
- **Evidence:** `plan.md` lines 170-173 says those surfaces have a `gate:jsr` acceptance criterion. The listed issue labels at the cited child lines contain no `gate:jsr`. Telemetry T2 correctly includes `gate:jsr`, proving the omission is not just formatting (`design/B-telemetry/epic-and-issues.md` lines 64-66).
- **Fix:** Add `gate:jsr` labels and explicit `deno task doc:lint --root ...`, `deno publish --dry-run --allow-dirty`, and public export-map acceptance to every issue that changes a published package/plugin surface.

### F1-07 — MAJOR — Dashboard slice count is internally inconsistent

- **Artifact:** `plan.md` lines 27-28, 76-80, and 176-184; `design/A-dashboard/epic-and-issues.md` lines 267-280 and 290-295.
- **Problem:** The plan calls dashboard "DDX-0...19 (20)" and also says that includes DDX-18a-d as four per-capability sections plus DDX-19. That arithmetic is impossible. DDX-0 through DDX-17 are 18 slices, DDX-18a-d are 4 more, and DDX-19 is 1 more: 23 implementation slices if the per-capability model is real. The issue draft also describes DDX-18 as "4 parallel sub-slices."
- **Evidence:** DDX-18's model is "18a workers, 18b sagas, 18c triggers, 18d streams" (`design/A-dashboard/epic-and-issues.md` lines 267-270). The plan's commit-slice framing says dashboard 20 and no epic exceeds the bound (`plan.md` lines 182-184).
- **Fix:** Recount the dashboard implementation slices as 23, or collapse DDX-18a-d back into one slice in the issue text. Keep the Plan-Gate `<30` claim, but make the count true.

### F1-08 — MAJOR — DDX-2's proposed package shape calls non-doctrine folders "doctrine layering"

- **Artifact:** `design/A-dashboard/epic-and-issues.md` lines 98-103; `design/A-dashboard/proposal.md` lines 76-93 and 112-115; `docs/architecture/doctrine/05-folder-structure.md` canonical role vocabulary and checklist.
- **Problem:** DDX-2 acceptance says `packages/plugin-dashboard-core` will use "doctrine layering" with `domain/ports/application/adapters/public/telemetry/testing`. But the doctrine role vocabulary does not include `public/` or `telemetry/` as canonical `src/` role folders. The proposal then calls that vocabulary "doctrine-clean." That is at best undocumented drift and at worst a folder-vocabulary violation.
- **Evidence:** Doctrine 05's role vocabulary includes `domain`, `ports`, `application`, `adapters`, `runtime`, `state`, `middleware`, `presets`, `registry`, `diagnostics`, `presentation`, `testing`, and `internal`; not `public` or `telemetry`. The proposal uses both under `src/` (`design/A-dashboard/proposal.md` lines 89-91) and asserts doctrine cleanliness at lines 112-115.
- **Fix:** Rename `src/public` to the package root `mod.ts`/subpath facade or `presentation` as appropriate; place self-instrumentation under `diagnostics`/`middleware`/`adapters` per role; or record explicit doctrine drift/debt before PLAN-EVAL.

### F1-09 — MINOR — #E2 puts `Closes #375` in an issue draft, not in the resolving PR body

- **Artifact:** `design/E-desktop/epic-and-issues.md` lines 61-64, 93-97, and 219-232; netscript-pr closing-keyword rule.
- **Problem:** The document correctly says resolving PRs carry closing keywords, but the #E2 draft itself says its issue body is `Closes #375`. A closing keyword in a normal issue body does not provide the PR auto-close guarantee the PR skill requires. If #E2 is a sub-issue, the PR that implements #E2 must close #E2 and likely #375, or the rescope edit to #327 must clearly explain manual closure of #375.
- **Evidence:** The convention at lines 63-64 says resolving PRs carry `Closes #En`; line 96 puts `Closes #375` in the #E2 issue body. The PR skill requires closing keywords in the PR body or commit message for auto-close.
- **Fix:** Move the closing-keyword instruction into #E2's eventual PR-body acceptance: `Closes #<E2 issue>` and `Closes #375` if #E2 fully resolves #375. Keep the issue draft itself as `Part of #327; folds #375`.

### F1-10 — NIT — Research finding #14 does not match the plan's four-milestone claim

- **Artifact:** `plan.md` lines 50-51 and 111; `research.md` lines 37-39; `design/B-telemetry/epic-and-issues.md` lines 3-6; `design/E-desktop/epic-and-issues.md` lines 8-11.
- **Problem:** The plan states four milestones (`0.0.1-beta.5/6/7/8`) do not exist yet. The consolidated research finding only says beta.6 and beta.7 are absent. B/E design files separately caveat beta.5 and beta.8, but the consolidated finding is narrower than the integrated claim.
- **Fix:** Update research Finding #14 to cover beta.5 and beta.8 with evidence, or narrow the plan claim to what was actually verified.

## What Is Genuinely Solid

- The telemetry package analysis is concrete and well-supported. The oRPC tracing gap is backed by both the code (`packages/telemetry/src/orpc/tracing-plugin.ts` only enriches `trace.getActiveSpan()`) and the analysis corpus.
- The `ServiceApp.fetch()` / missing sdk `ClientLinkPort` conclusion is well-grounded in current code: `ServiceApp` has `fetch(request)`, `build()` returns the Hono app, and `createServiceClient()` is currently hardwired to `createHttpClientLink`.
- The thin plugin + fat `plugin-dashboard-core` direction is doctrine-aligned in principle. The plugin-thinness law supports putting dashboard domain/ports/contracts in a core package and keeping `plugins/dashboard` as delivery glue.
- The docs S0 precursor is a real sequencing guard: the docs issue draft cleanly blocks authoring on IA reconciliation and names validation gates.

## Severity Count

- **BLOCKER:** 3
- **MAJOR:** 5
- **MINOR:** 1
- **NIT:** 1
