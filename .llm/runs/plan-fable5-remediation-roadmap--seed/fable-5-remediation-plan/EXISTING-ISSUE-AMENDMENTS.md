# Existing-issue amendments — quotable text for owner ratification — DRAFT (no GitHub mutation; owner ratification pending)

Pack T6 deliverable. Every block below is **proposed text the owner can paste verbatim**. Nothing
here has been posted, edited, closed, labelled, or milestoned on GitHub. Each entry states: target
issue, amendment type (comment vs body edit), the full text, the rationale, and what it prevents.

**Rules honoured by every amendment.**

- Comments are additive. Where a body edit is proposed it is marked **BODY EDIT** and states which
  section is replaced, so nothing is silently deleted.
- No amendment ticks an existing acceptance checkbox. Close-gate reads checkboxes under
  `## Acceptance` / `## Acceptance criteria` / `gate:`-prefixed boxes
  (`github-conventions.md` §4.3); a comment cannot and must not discharge one.
- No amendment adds a closing keyword to an epic (`AGENTS.md`; conventions §4.7).
- Proposed acceptance boxes are written short and stable so they can be copied verbatim into a
  ```acceptance-evidence``` mapping.
- Draft-IDs (`T3-02`, `T4-06`, …) refer to sibling drafts in this seed run. When those are filed the
  owner substitutes the real `#N`; until then the draft-ID is a placeholder, not a link.
- Facts marked **re-measured** were executed in this worktree at baseline `fac9e339042c` on
  2026-08-08 and supersede corpus figures dated 2026-08-04.

Contents: [#1278](#1278) · [#1276](#1276) · [#1279](#1279) · [#1275](#1275) · [#1245](#1245) ·
[#1333](#1333) · [#1335](#1335) · [#1210](#1210) · [#1208](#1208) · [#922](#922) · [#301](#301) ·
[#1126](#1126) · [#1325/#1326/#1329](#1325-1326-1329) · [#979](#979) · [#1090/#1197](#1090-1197) ·
[board hygiene](#board-hygiene)

---

<a id="1278"></a>

## 1. #1278 — Type soundness ratification (0.0.6, `type:umbrella`)

**Amendment type:** comment (additive). No body rewrite — the inventory A/B/C/D structure stays.

**Proposed comment text:**

> **Epic-of-record consolidation + re-measurement (2026-08-08).**
>
> This issue is the epic of record for type soundness. #1276 covers the same 2026-08-04 owner
> directive with a different organisation and is being closed as superseded; its unique content is
> folded in below so nothing is lost.
>
> **Measured numbers folded in from #1276** (as recorded there, 2026-08-04): 56 `as unknown as`
> occurrences across `packages/` + `plugins/`; 8 `deno-lint-ignore no-explicit-any` suppressions;
> 7 ratified `quality:scan` allowances (6 in `packages/cli`, 1 in
> `plugins/workers/streams/producer.ts`); doc line references `web-layer/query-bridge.md:259`
> (compiler refusal printed at 276-277), `reference/contracts/index.md:32`,
> `reference/triggers/index.md:310`.
>
> **Tranches folded in from #1276**, retained as phases of this epic so deferral stays visible:
> T1 public surface first (eliminate `any` from exported types); T2 the documented workarounds
> (#1245 + #1249, docs update lands with the fix); T3 the ratified `quality:scan` allowances
> ("pending package-boundary unification is a plan, not a resting state"); T4 production
> `as unknown as`; T5 test-side casts; T6 keep it fixed (extend `quality:scan`).
> #1276's constraints carry over: framework source runs as WSL Codex slices per `CLAUDE.md`, docs
> updates follow each fix on the docs lane, and "no suppression-as-fix" — a new
> `deno-lint-ignore` / `as unknown as` introduced to green a gate is a review-blocking finding.
> #1276 also names #1255 (`page.layer.delivery` span attribute misreport) as subsumed, alongside
> #1245 and #1249.
>
> **Re-measurement at `fac9e339042c` (2026-08-08).** Four inventory items have moved since the
> 2026-08-04 measurement and this epic should be re-scoped before it is scheduled:
>
> - Inventory A: `web-layer/query-bridge.md` no longer contains `as unknown as`, and
>   `BaseContractProcedure = Readonly<{ ~orpc: any }>` no longer appears in
>   `reference/contracts/index.md` — grep for `as unknown as` and for `~orpc` returns nothing at
>   this baseline. The only remaining docs hit is `reference/triggers/index.md:310`
>   `const observedEvents: any[] = [];` and its executable twin
>   `docs/site/reference/triggers/examples_test.ts:65`.
> - Inventory B: `packages/fresh/src/application/form/_internal/runtime-types.ts` has **zero**
>   matches for `as unknown as` / `as any` / `quality-allow` today; the "2 casts" line item is
>   stale. The only remaining cast in the whole web layer is
>   `packages/fresh/src/application/builders/define-page/builder/route-support.ts:96`.
> - Inventory C: the allowance count is **7** under the default `quality:scan` roots but **10**
>   under `--root packages --root plugins`, so three allowances already sit outside the ratified
>   set with nothing reporting the delta.
> - Inventory D: there are **6** soundness test files, not ~19 —
>   `packages/plugin-{workers,sagas,triggers,auth,ai}-core/tests/contracts/*-contract-soundness_test.ts`
>   and `plugins/workers/services/src/routers/health-soundness_test.ts`. They are already exempt by
>   construction: `.llm/tools/quality/scan-code-quality.ts:87` excludes `_test.ts`.
>
> **Correction to a shared assumption.** #1276 T6 states that `quality:scan` "covers
> `packages/cli/src` + `plugins` only". That is true of the default task
> (`scan-code-quality.ts:18`), but `quality:scan:repo` already covers all of `packages/` +
> `plugins/` and runs on push-to-main and a Monday 07:17 UTC cron
> (`.github/workflows/code-quality.yml:50-59`). Root scope is not the gap. The gaps are: the
> `explicit-any` rule cannot tell an exported type from a local one
> (`scan-code-quality.ts:51`); `// quality-allow:` accepts any free-text reason with no issue id
> (`:136`); `--max-allow` exists (`:173-181`) but is passed by no task and no workflow, so the
> allowance budget is unbounded; and no Markdown file is ever opened (`:87`).
>
> **Inventory C is being filed as its own trackable child** so the guard rail can land and be
> gated independently of the burn-down. That child carries `Part of #1278`.

**Rationale.** #1278 holds the milestone (0.0.6) and the richer acceptance shape; #1276 holds the
only measured numbers and the tranche decomposition. Folding rather than choosing keeps both. The
re-measurement is not optional: three of #1278's own inventory line items no longer describe the
repository, and scheduling against them would produce slices with nothing to fix.

**What it prevents.** (a) Closing #1276 losing the 56/8/7 counts and the T1–T6 decomposition;
(b) a remediation slice opening `runtime-types.ts` or `query-bridge.md` and finding the work already
done — the #1245 failure mode repeating at epic scale; (c) an implementer building the Inventory C
gate on the false premise that widening roots is the fix.

---

<a id="1276"></a>

## 2. #1276 — epic(quality): ratify and eliminate unsound types (Backlog / Triage)

**Amendment type:** comment, then owner closes as **not planned** (duplicate). Per
`.github/labels.yml` header rules, a not-planned closure **removes** the `status:` label rather than
setting `status:shipped`.

**Proposed comment text:**

> **Closing as superseded by #1278.**
>
> #1278 (`Type soundness ratification`, milestone 0.0.6) and this issue record the same 2026-08-04
> owner directive over the same evidence set. #1278 is the epic of record because it carries the
> release milestone and the inventory A/B/C/D acceptance shape.
>
> Nothing from this issue is discarded. Its unique content — the measured counts (56
> `as unknown as`, 8 `deno-lint-ignore no-explicit-any`, 7 ratified `quality:scan` allowances with
> their rationale strings), the exact doc line references, the T1–T6 tranche decomposition, the
> "no suppression-as-fix" constraint, the WSL-Codex lane constraint, and the subsumption of #1245 /
> #1249 / #1255 — has been folded into #1278 verbatim in a comment dated 2026-08-08. The T1–T6
> tranches survive there as phases so each remains independently deferrable.
>
> Superseded by #1278. No work is lost; track type soundness on #1278.

**Rationale.** `github-board-open.md` §4.2 confirms the duplication by reading both bodies. Two
umbrellas over one directive means two planning surfaces and two chances to schedule the same slice.

**What it prevents.** Two parallel type-soundness programs; a slice filed against #1276's T-numbers
that duplicates a slice filed against #1278's letter-numbers.

---

<a id="1279"></a>

## 3. #1279 — docs: migration chapter (0.0.6, `type:umbrella`)

**Amendment type:** comment (additive), plus a **proposed milestone move** the owner executes
separately.

**Proposed comment text:**

> **Epic-of-record consolidation (2026-08-08).**
>
> This issue is the epic of record for the migration chapter. #1275
> (`epic(docs): migration chapter — migrate-from guides, capability equivalence matrix, and
> end-to-end migration recipes`, Backlog / Triage) is the same scope under different wording and is
> being closed as superseded. Its framing is folded in here so nothing is lost: **migrate-from
> guides**, a **capability equivalence matrix**, and **end-to-end migration recipes** are the same
> three deliverables as this issue's per-framework guides / compatibility matrix / e2e recipes.
> Where the two bodies differ in emphasis, treat #1275's "capability equivalence matrix" as the
> normative name — it states what the matrix is for.
>
> **Proposed milestone change, for owner decision.** Migration documentation is post-remediation
> marketing surface, not remediation. Recommendation: move this issue out of 0.0.6 to the late
> train, so 0.0.6 stays the verification + docs-accuracy + soundness cut. This is a scheduling
> proposal only; no scope changes.

**Rationale.** `github-board-open.md` §4.2 lists #1275/#1279 as the second confirmed duplicate pair.
The SYNTHESIS milestone-train direction keeps 0.0.6 as the verification/docs/soundness cut; a
migration chapter cannot be written truthfully until the seams it documents stop moving.

**What it prevents.** A migration guide authored against seams that the typed-seam and generation
milestones are about to change — the most expensive class of docs rework.

---

<a id="1275"></a>

## 4. #1275 — epic(docs): migration chapter (Backlog / Triage)

**Amendment type:** comment, then owner closes as **not planned** (duplicate); remove the `status:`
label on closure.

**Proposed comment text:**

> **Closing as superseded by #1279.**
>
> #1279 (`docs: migration chapter — per-framework guides, compatibility matrix, and e2e migration
> recipes`) is the same scope and carries a release milestone. This issue's three deliverables —
> migrate-from guides, capability equivalence matrix, end-to-end migration recipes — have been
> folded into #1279 in a comment dated 2026-08-08, with "capability equivalence matrix" adopted as
> the normative name for the matrix.
>
> Superseded by #1279. Track the migration chapter there.

**Rationale + prevention.** Same as #1276/#1278: one prose-only umbrella per topic, or the board
grows two plans for one chapter.

---

<a id="1245"></a>

## 5. #1245 — fix(fresh/query): island query types reject the package's own documented patterns

**Amendment type:** **BODY EDIT** — replace the three-boundary scope with the remnant — plus a
comment recording why. The body edit is required here rather than a comment because the current body
*describes work that is merged*, and a comment does not stop a reader from implementing it.

**Proposed comment text (post first, then edit the body):**

> **Rescope: ~75% of this issue landed in #1265 (2026-08-04, `77c034c33`, closing #1252).**
>
> Re-verified against `main` at `fac9e339042c` on 2026-08-08. Of the three boundaries this issue
> was filed on, only fragments remain:
>
> - Boundary 1 (`initialDataUpdatedAt` absent from `IslandQueryOptions`, TS2353) — addressed by
>   #1265.
> - Boundary 2 (`createNetScriptQueryClient()` returning a `QueryClient` typed as the narrower
>   `QueryClientPort`, TS2551 + TS2345) — addressed by #1265;
>   `docs/site/web-layer/query-bridge.md` no longer carries the `as unknown as IslandQueryClient`
>   cast.
> - Boundary 3 (`IslandQueryResult` missing `isRefetching` / `isFetching`, TS2339) — addressed by
>   #1265.
>
> Leaving this issue open at its filed scope would send a remediation slice to re-implement merged
> work. The body is being edited down to the remnant; nothing is being ticked or claimed complete.
>
> **Remnant scope (what this issue now owns):**
>
> 1. `getIslandQueryClient()`'s `@throws` JSDoc documents a guard the implementation does not have
>    (`packages/fresh/src/application/query/…/query-client.ts:26-27`). This is published through
>    `deno doc`, so the wrong contract ships to consumers.
> 2. The `clientKey` falsy-input asymmetry between
>    `packages/sdk/src/query/query-factory.ts:174` and `packages/sdk/src/ports/query-factory.ts:98`.
> 3. Regression tests for both, so the JSDoc and the body cannot diverge again.
> 4. A consumer migration note: `rickylabs/eis-chat` carries six copied casts written against the
>    pre-#1265 types. The note must say which casts to delete and against which version, so
>    eis-chat-class apps can drop them rather than carry them forward.

**Proposed replacement `## Acceptance` section (BODY EDIT):**

> ## Acceptance
>
> - [ ] `getIslandQueryClient()`'s `@throws` matches the implementation, or the guard is added.
> - [ ] The `clientKey` falsy-input asymmetry between the SDK query factory and its port is resolved.
> - [ ] Regression tests cover the documented throw contract and the falsy `clientKey` case.
> - [ ] `deno doc` output for `getIslandQueryClient` states no guard the body lacks.
> - [ ] A consumer migration note names the casts an eis-chat-class app can now delete and the
>       version they became unnecessary in.
> - [ ] `docs/site/web-layer/query-bridge.md` is simplified where it documented a boundary that
>       #1265 removed.
>
> Related: #1265 (merged 2026-08-04, `77c034c33`), #1252 (closed by it), #1210 (discovery source),
> #1278.

**Rationale.** `research/repo-audit/web-layer.md` §13 verified the merge by running the checker
against current source, not by reading the issue. `github-board-open.md` §7 lists #1245 as the owner
for island query type gaps, so the issue must stay open — but at its true remaining size.

**What it prevents.** The single highest-probability waste in this roadmap: a slice re-implementing
#1265. It also prevents the opposite error — closing #1245 outright and losing the `@throws` defect
and the consumer migration note, which nothing else owns.

---

<a id="1333"></a>

## 6. #1333 — fix(scaffold/frontend): make the default app an idiomatic eis-chat-grade reference (0.0.5, p0)

**Amendment type:** comment (additive). **Not a body rewrite** — the ten existing acceptance boxes
stay exactly as written; this comment proposes additional boxes for the owner to append if accepted.

**Proposed comment text:**

> **Acceptance detail expansion (2026-08-08, seed-run proposal — additive).**
>
> The ten acceptance boxes here are correct but under-specified in the places where measured agent
> runs actually drifted. The pre-plan's expansion list, grounded against current source, proposes
> these as *additional* boxes. Existing boxes are unchanged and none is ticked.
>
> - [ ] The default app's primary resource route is implemented contract-first via
>       `withRouteContract`, not a hand-written handler.
> - [ ] Data reaches the page through the typed SDK on a cache-first path, not a direct service
>       call from the route.
> - [ ] `withResource` appears in the default app with a shared resource refined per layer.
> - [ ] Route params and search params are typed (`withPathParams` / `withSearchParams`), not
>       parsed from strings.
> - [ ] Route-local groups are demonstrated: `(_components)`, `(_islands)`, **`(_shared)`** and
>       **`(_lib)`**.
> - [ ] The generated app's own quality gate fails on `any` in app code, so a consumer inherits the
>       no-`any` rule rather than reading about it.
> - [ ] The four seams are visibly distinct in the generated tree — DB model, API contract, route
>       contract, view model — with the narrowing between them shown, not implied.
> - [ ] Loading, error, empty and success states are executable code in the default route, not
>       prose.
> - [ ] The default app links to `/design` and `/design/composition` from a place a reader reaches
>       without being told to.
>
> **Why these and not others.** Every one of them names a surface a measured Wave-6 run failed to
> reach: R2 (`workflow-builder-kimi-k3-max`, canary.13) shipped a **676-line `LoomCanvas.tsx`**
> with product `QueryIsland` / `withForm` / Fresh-UI feature-loop adoption at **0 / 0 / 0**;
> `definePage` and fresh-ui appear only in scaffold examples, never in Loom's product routes.
> The repo audit confirms the mechanism: `withResource`, `withForm`, `withRouteContract`,
> `withSearchParams`/`withPathParams`, `withStreaming` and `definePartial` have **zero** examples
> in the generated app — which is the surface `agent-conventions.ts` designates as canonical for
> agents, and `agent-conventions.ts:133` instructs agents to use `withForm` while listing no local
> reference for it.
>
> **Discharged dependency.** This issue's `Related:` line names #1328, which closed 2026-08-07
> (`status:shipped`, `canary:0.0.5-canary.15`). That dependency no longer blocks.
>
> **Boundary.** The mobile-action-loss observation from the Wave-6 review belongs to this issue's
> acceptance surface unless it reproduces as a `@netscript/fresh-ui` defect on the current canary;
> it should not be filed separately without that repro.

**Rationale.** The pre-plan's explicit instruction is "expand #1333, do not file new issues" for the
canonical scaffolded frontend. #1333 is p0 in the active milestone, so an additive comment is the
only safe amendment shape — a body rewrite of a p0 mid-milestone risks losing agreed text.

**What it prevents.** The T2 pack filing a "canonical vertical slice" issue that duplicates #1333;
and #1333 shipping against ten boxes that a compliant implementation can satisfy while still
producing an app with no `withResource`, no typed params, and no `(_shared)`/`(_lib)`.

---

<a id="1335"></a>

## 7. #1335 — Epic: Scaffold conformance (Backlog / Triage, `type:umbrella`)

**Amendment type:** comment (additive) + **BODY EDIT** limited to the `## Sub-issues` list. The
`## Sub-issues` checklist is deliberately *not* close-gated (conventions §4.4), so editing it does
not touch the merge gate.

**Proposed comment text:**

> **Sub-issue list refresh (2026-08-08).**
>
> The only listed sub-issue, **#1328**, closed on 2026-08-07 (`status:shipped`,
> `canary:0.0.5-canary.15`), so this epic currently reads as 0% complete when its first child has
> shipped. The `## Sub-issues` list is being refreshed to tick #1328 and to link the children that
> exist in prose today.
>
> **#1333 is this epic's frontend row.** The body names "Frontend scaffold modernization and dynamic
> app naming" as plain text; that is #1333 (0.0.5, p0). Linking it here prevents a dedup pass from
> re-filing it. This epic does not own #1333's implementation and must not close it.
>
> **Proposed additional children** (seed-run drafts; the owner substitutes filed numbers):
>
> - Service-layout child — collapsible `domain` / `application` / `ports` / `adapters` / `routers` /
>   `auth` slice vocabulary, `service add-handler` placement, and a decision table for when a
>   generated service collapses to a single file (seed draft-ID **T3-02**).
> - Generated-surface conformance rows this epic's inventory must produce a child for, each already
>   evidenced at source: `/design/components` lists 50 of the registry's 66 items with no sync gate;
>   `ui:add page --island` emits a `useSignal(0)` counter and an empty `queryLoaders = {}` instead
>   of the advertised data-screen triad; `resolveProjectRoot` returns the workspace root while the
>   app lives at `apps/<name>/`; `appRoutes.crudExample` aliases `serviceExample` so
>   `/examples/crud` is unreachable and a test asserts the alias; the canonical island never passes
>   `initialDataUpdatedAt: props.cachedAt` although the loader computes it; the generated
>   quality-runner's source list is a literal allow-list decoupled from the workspace generator.
>
> This is an umbrella. No implementation PR should close it directly.

**Proposed `## Sub-issues` replacement (BODY EDIT):**

> ## Sub-issues
>
> - [x] #1328 — generated check misses TSX/plugin runtimes; scaffold-owned quality findings
> - [ ] #1333 — frontend scaffold modernization and dynamic app naming
> - [ ] Service-layout child — slice vocabulary + `service add-handler` placement + decision table
> - [ ] `/design/components` registry sync gate (50 of 66 items listed)
> - [ ] `ui:add page --island` emits the advertised data-screen triad
> - [ ] `resolveProjectRoot` writes into the app tree, not the workspace root
> - [ ] `appRoutes.crudExample` points at `/examples/crud`
> - [ ] Generated quality-runner source selection derives from the workspace generator

**Rationale.** `github-board-open.md` §4.1 flags #1335's stale checkbox explicitly, and §4.2 warns
that #1335 names #1333's work as plain text rather than a link — the exact condition that produces a
duplicate filing.

**What it prevents.** Re-filing #1333 during a dedup pass; an epic that reads as untouched while its
first child shipped; and the T2/T3 packs filing conformance children with no umbrella linkage.

---

<a id="1210"></a>

## 8. #1210 — docs(web-layer): differentiator deep-dives + competitive tutorial benchmark (0.0.6)

**Amendment type:** comment (additive). No body edit — the per-API sub-page structure and the
competitive benchmark stay as written.

**Proposed comment text:**

> **Cross-capability golden recipes — proposed addition to this issue's scope (2026-08-08).**
>
> The per-API deep-dives teach one API at a time. Every measured agent failure so far happened at a
> *crossing* — the point where two capabilities meet and neither API page owns the seam. Proposal:
> add a "golden recipes" set to this issue, each recipe end-to-end, type-checked against published
> entrypoints, and each naming the seams it crosses.
>
> - **Contract-first resource screen.** route contract → typed SDK client → cache-first query
>   factory → layered `definePage` → `QueryIsland` hydration → optimistic mutation with rollback.
> - **DB-model-first product.** generated `@database/zod` model → narrowed/extended versioned API
>   contract → handler → OpenAPI → SDK → page. (Coordinate with #1332, which owns the docs
>   statement of the DB-first predecessor path.)
> - **Live data screen.** durable stream producer → SSE consumer → island live query, including
>   the event envelope, replay offsets and `traceparent` propagation. (Coordinate with #1329, which
>   owns the envelope definition; this recipe consumes it and must not redefine it.)
> - **Background work with a receipt.** worker job → saga publish → compensation → one correlated
>   trace, showing that a discarded publish result is a failure and not a success.
> - **Trigger to service.** webhook or scheduled trigger → worker → service call, including the KV
>   adapter registration and the service-reference injection a generated background runtime needs.
> - **Protected screen.** auth boundary → protected route → typed principal available in the page
>   loader, with the unauthenticated path shown.
> - **Second service.** `service add` → generated client/query module → a page that composes two
>   services without hand-written fetch.
> - **Validated form.** Zod contract → `withForm` → server-side validation → partial navigation
>   → error state, with the native-constraint attributes the browser receives.
> - **Add a capability the framework does not ship.** third-party plugin → discovery → generated
>   registry → `plugin doctor` → healthy Aspire resource.
> - **Webhook delivery.** an outbound-delivery recipe over the worker template (retries, backoff,
>   dead-letter, signature) — recorded as a recipe, not a promised primitive.
>
> Each recipe should end with the falsifiable check the deep-dives already use: remove the seam and
> the example must fail, so the recipe proves a mechanism rather than illustrating one.
>
> **Provenance of this list.** The pre-plan directs "expand #1210 with cross-capability golden
> recipes" without enumerating them. The ten above were derived by the 2026-08-08 seed run from the
> capability crossings that measured Wave-6 runs actually failed at; treat the list as a proposal
> to be trimmed, not a specification.

**Rationale.** The pre-plan's dedup matrix says "expand instead of new" for #1210. Enumerating the
recipes inside #1210 is what makes that instruction actionable; a bare "add golden recipes" line
would be re-interpreted by every implementer.

**What it prevents.** A separate "cookbook" or "recipes" issue duplicating #1210; and deep-dive
pages that each document their own API correctly while no page documents any crossing.

---

<a id="1208"></a>

## 9. #1208 — docs(tutorials): no tutorial demonstrates the page builder (0.0.5, p0, `status:plan`)

**Amendment type:** comment (additive). Records the phase-2 obligation so it cannot evaporate.

**Proposed comment text:**

> **Phase-2 filing obligation — recorded so it cannot be lost (2026-08-08).**
>
> This issue's body defines a phase 2 (the full inconsistency-and-underleverage sweep across all
> tutorials) and says it will be "tracked as a checklist comment on #1208 when phase 1 lands".
> As of 2026-08-08 **no phase-2 issue exists on the board**, and a checklist comment on a p0 issue
> that is itself about to close is not a durable owner.
>
> Obligation, stated here so the next reader inherits it: **when the phase-1 PR merges, phase 2 is
> filed as its own issue** in the same milestone family, titled in house shape, carrying
> `Refs #1208` (not a closing keyword), with the tutorial inventory as its acceptance checklist.
> If phase 2 is instead decided to be unnecessary, that decision is recorded as a comment here and
> the row is struck — but it is not left implicit.
>
> Note for roadmap authors: because phase 2 has no issue number, it is one of the two highest
> duplicate-filing risks on this board. Do not file it before phase 1 merges, and do not file it
> twice after.

**Rationale.** `github-board-open.md` §6.3 and §7 both flag the promised-but-nonexistent phase-2
issue as a dedup trap. SYNTHESIS §7 ranks it alongside the prose-only umbrellas as a top risk.

**What it prevents.** Both failure modes at once: phase 2 vanishing when #1208 closes, and phase 2
being pre-emptively filed by a roadmap pass as a new issue that then collides with the real filing.

---

<a id="922"></a>

## 10. #922 — Epic: Frontend contribution layer (0.0.7, `type:umbrella`, 24 open children)

**Amendment type:** comment (additive clarification). **No body rewrite** — the wave narrative and
the RFC #890 design record stay verbatim.

**Proposed comment text:**

> **Wave-label vs milestone clarification (2026-08-08) — additive, no scope change.**
>
> This epic's body sequences its waves as `beta.13` / `beta.15` / `beta.17`. Those milestone titles
> no longer exist: the `0.0.1-beta.N` line was renamed to `0.0.N` around 2026-08-01, and milestones
> have since been renamed in place several times. The body text is a historical record and is being
> left as written; this comment supplies the current mapping so no one reads a dead title as a
> schedule.
>
> Measured milestone placement of this epic's children as of 2026-08-08:
>
> | Body wave | Children | Actual milestone |
> | --- | --- | --- |
> | Wave 0 proofs (beta.13) | #923–#927 | 0.0.7 |
> | Wave 1 contracts + spine (beta.13) | #928–#933 | 0.0.7 |
> | Wave 1b gateway | #934 | 0.0.7 |
> | Wave 2 DX/lifecycle (beta.13) | #935–#938, #940 | 0.0.7 |
> | Wave 2 DX/lifecycle | #944 | 0.0.9 |
> | Wave 3 consumers (beta.15) | #939, #941 | 0.0.7 |
> | Wave 3 consumers (beta.15) | #942, #943 | 0.0.11 |
> | Completion (beta.17) | #945, #946 | 0.0.13 |
>
> The epic itself is 0.0.7. Note **#944 is a Wave-2 item milestoned later (0.0.9) than Wave-3
> siblings still in 0.0.7** — that inversion is a real ordering question for whoever schedules this
> epic, not a labelling artifact.
>
> **Re-baseline reminder.** This epic's body says "Refs #427, #432 — both KEEP-and-re-baseline per
> the RFC's supersession map; no issues closed by this epic's filing." As of 2026-08-08 **the
> re-baseline has not happened**: #427 and #432 are still open verbatim under `epic:dev-dashboard`
> (#400), and #400's 29 open children overlap this epic's consumer wave. The re-baseline is
> outstanding work owned by whoever schedules #922's Wave 3, and it should be done before #400's
> dashboard panels are planned against the old text.
>
> **If milestones shift again**, note the house pattern: milestones are renamed in place
> highest-to-lowest and the freed title is created afterwards, so children do not move and this
> table stays valid under the old numbers — only the titles change.

**Rationale.** `github-board-open.md` §6.5 measured the drift; `github-board-history.md` §5 documents
the rename mechanism that caused it. The re-baseline omission is measured in §4.2.

**What it prevents.** Someone "fixing" #922 by moving children to match dead beta titles; and #400's
dashboard work being planned against superseded #427/#432 text. Also prevents an epic body rewrite
that would destroy the RFC #890 review trail.

---

<a id="301"></a>

## 11. #301 — epic: Road to 0.0.1-stable (Backlog / Triage, `type:umbrella`)

**Amendment type:** comment (additive) + optional **BODY EDIT** limited to ticking the five closed
rows. The child checklist is not close-gated, so ticking it is safe.

**Proposed comment text:**

> **Stale checkbox audit (2026-08-08).**
>
> Five children listed here as unchecked are already CLOSED: **#305, #306, #391, #399, #401**.
> Remaining genuinely open: #302, #303, #307, #309, #313, #327, #400. This epic therefore reads far
> less complete than it is, which distorts any milestone reforecast that reads it.
>
> No checked box on this epic points at a still-open issue, so there are no false-complete rows —
> the error is one-directional and safe to correct by ticking.
>
> Note for planners: three of the remaining rows (#313, #327, #400) are themselves umbrellas with
> their own child sets, so this epic's true remaining scope is much larger than its row count
> suggests.

**Rationale.** `github-board-open.md` §4.1 verified each of the five against the closed set.

**What it prevents.** A roadmap reading #301 as ~8% complete and re-planning finished work; and a
"road to stable" status report built on a checklist nobody has reconciled.

---

<a id="1126"></a>

## 12. #1126 — Epic: OpenAPI→MCP service introspection (0.0.5, `type:umbrella`)

**Amendment type:** comment (additive) + optional **BODY EDIT** ticking the nine closed rows.

**Proposed comment text:**

> **Stale checkbox audit (2026-08-08).**
>
> Nine children listed here as unchecked are already CLOSED: **#1128, #1129, #1130, #1131, #1132,
> #1133, #1134, #1135, #1136**. Only **#1137, #1138, #1139, #1140** remain open (all four carry
> `epic:openapi-mcp`).
>
> This epic is materially near completion and currently reads as barely started. Correcting the
> checklist matters for 0.0.5 scoping specifically: #1126 is one of the 0.0.5 umbrellas, and an
> uncorrected checklist inflates the apparent remaining 0.0.5 surface.
>
> This is an umbrella. No implementation PR should close it directly.

**Rationale + prevention.** Same as #301. Additional stake: #1126 sits in the *active* milestone, so
its stale checklist directly distorts the "can 0.0.5 close" decision.

---

<a id="1325-1326-1329"></a>

## 13. #1325, #1326, #1329 — evidence attachment (no scope change)

**Amendment type:** comment on each. Evidence pointers only — no acceptance box is added, changed or
ticked, and no scope is touched. These three are already well-specified; the amendment exists so the
Wave-6 measurements and the 2026-08-08 source audit are discoverable from the issue.

**Proposed comment on #1325** (`fix(triggers): generated background runtime omits the Redis adapter`):

> **Additional evidence (2026-08-08) — no scope change.**
>
> Independently reproduced at source: `plugins/triggers/src/adapter/resources/glue/runtime.stub.ts`
> emits the generated `triggers/runtime.ts` with no `@netscript/kv/redis` import, so the generated
> runtime carries no adapter for the default Aspire Redis/Garnet cache.
>
> Two measured agent runs hit this independently, which is why the generalisation requirement in
> this issue's acceptance is the real deliverable rather than the one-line import:
>
> - **Wave-6 R2** (`workflow-builder-kimi-k3-max/`, Kimi K3 Max, `0.0.5-canary.13`) — crash-loop
>   `KvConnectionError`; the builder added a one-line side-effect import to a scaffold-owned trigger
>   entrypoint, i.e. hand-edited a generated file.
> - **Wave-6 R3** (`billing-run-grok-4.5-high-canary.16/`, Grok 4.5 high, `0.0.5-canary.16`) —
>   repair commit `8b86649` adds the `@netscript/kv/redis` triggers import; recorded as "hard to
>   diagnose".
>
> **Classification conflict worth recording:** R2 classifies this as a framework defect (D-class);
> R3 classifies the same surface as a docs/MCP discoverability gap with "no framework defect
> established". Both runs had to add the same glue by hand on two different canaries. The
> source-level evidence above resolves the conflict in favour of the defect classification.

**Proposed comment on #1326** (`fix(streams): DurableStreamProducer permanently drops writes`):

> **Additional evidence (2026-08-08) — no scope change.**
>
> Mechanism re-confirmed at source in
> `packages/plugin-streams-core/src/application/create-durable-stream.ts`: `#connect` runs once, on
> failure sets `#connectError` and returns, and `#appendEvent` drops every event while that field is
> set; no timer, retry policy or state transition ever clears it — so the operator log line
> promising "until reconnect" names a transition the implementation cannot perform.
>
> **Wave-6 R2** recorded the consequence class independently: "durable-stream producer silently
> drops writes forever after a startup-order race". R3 ran a single clean graph and plausibly
> avoided the race, so R3's silence is not evidence against this — it is a coverage gap.
>
> **Pairing reminder:** this issue's acceptance depends on the standardized stream event envelope
> defined by **#1329**. The two must be scheduled as a pair; landing reconnect telemetry against an
> undefined envelope produces spans that #1329 will then redefine.

**Proposed comment on #1329** (`fix(streams): documented SSE consumer shape differs from the wire`):

> **Additional evidence (2026-08-08) — no scope change.**
>
> Consumer-side confirmation from measured runs, both of which reverse-engineered the wire because
> the documented shape does not receive anything:
>
> - **Wave-6 R2** (`workflow-builder-kimi-k3-max/`) — `apps/dashboard/islands/LoomCanvas.tsx` uses
>   named `data` events with array payloads, arrived at by runtime inspection.
> - **Wave-6 R3** (`billing-run-grok-4.5-high-canary.16/`) — used the wrong durable-stream path
>   (`/v1/streams/billing/run-events` → 404) before finding the correct
>   `/v1/stream/netscript/billing/run-events` → 200. R3's own audit classifies this as a docs/MCP
>   discoverability gap; it maps onto this issue's documented-shape defect.
>
> Two independent consumers reconstructing the same undocumented envelope is the strongest available
> argument for this issue's first acceptance box (one exported versioned schema defining every SSE
> event name and payload) over a documentation-only fix.

**Rationale.** These three are the 0.0.5 streams/triggers core and are already correctly scoped;
what they lack is the cross-run evidence that makes their *generalisation* requirements defensible
during implementation review.

**What it prevents.** An implementer satisfying #1325 with a one-line import (R2's own workaround)
rather than the enumerated invariant; #1326 and #1329 being scheduled apart; and #1329 being closed
with a docs edit because R3's classification was read without R2's.

---

<a id="979"></a>

## 14. #979 — fix(aspire): plugin API resources still pin host ports 8091–8094 (no milestone)

**Amendment type:** comment (additive evidence). Also appears in the board-hygiene batch below for
its missing milestone.

**Proposed comment text:**

> **Additional evidence — the stub-port surface is wider than the Aspire entries (2026-08-08).**
>
> This issue owns the plugin API resources' pinned host ports. A 2026-08-08 source audit found the
> same hardcoded ports in three further layers, which matters because dropping `Port` from the
> scaffolder's plugin entries will not by itself remove the pinning — these paths bypass the
> allocator entirely:
>
> - **Contribution env/health literals** — each contribution allocates through
>   `ctx.port(name, DEFAULT)` and then publishes a literal:
>   `plugins/sagas/src/aspire/sagas-contribution.ts:135` (`SAGAS_API_URL:
>   http://localhost:8092`) and `:146` (health URL, `_ctx` unused);
>   `plugins/triggers/src/aspire/triggers-contribution.ts:139` and `:149` (same pattern).
>   `plugins/workers/src/aspire/workers-contribution.ts:71,81` is the correct counter-example — it
>   uses the allocated port.
> - **Fixed-port fallbacks in runtime clients** — `SAGAS_API_DEFAULT_PORT = 8092`
>   (`plugins/sagas/src/constants.ts:11`), `plugins/sagas/src/cli/adapters/runtime-api-client.ts:27`
>   (`http://127.0.0.1:8092/api/v1/sagas`),
>   `plugins/workers/src/cli/adapters/runtime-api-client.ts:27` (`…:8091/api/v1/workers`).
> - **E2E probe contexts** — `plugins/workers/src/e2e/probes/probe-context.ts:5`
>   (`http://localhost:8091`), `plugins/sagas/src/e2e/probes/probe-context.ts:3`
>   (`http://127.0.0.1:8092`).
>
> Commit `0b11ca47a` (#1211, randomize default listener ports) is what turned each of these from a
> working default into latent breakage: once ports are randomized, a literal fallback silently
> targets a port nothing is listening on.
>
> **Why this belongs here and not in a new issue:** this issue already owns the prerequisite chain
> (resolve endpoints from the Aspire resource service instead of hardcoding, including the
> `--allow-net` grant handed to the generated project, plus the ~20 `docs/site/**` passages that
> `curl` those ports). The literals above are the same defect at a different layer and should be
> enumerated in the same sweep. A separate seed-run draft (**T4-06**) tracks the stub-port
> hardcodes if the owner prefers them split; if so, it carries `Refs #979` and this comment is its
> evidence base.
>
> **Sibling:** #980 (`netscript service add` pins an Aspire host port) is the same defect on a
> different command and is likewise unmilestoned.

**Rationale.** `research/repo-audit/runtime-plugins.md` §1.3-1.4 enumerated these at source; the
`github-board-open.md` §7 dedup checklist names #979 as the owner for Aspire plugin port pinning, so
this is evidence attachment, not a new filing.

**What it prevents.** A fix that removes `Port` from the scaffolder's entries, passes the E2E suite
(which probes the literals), and leaves two workspaces still colliding — plus the silent
`127.0.0.1:8092` fallback that the saga publish-receipt defect rides on.

---

<a id="1090-1197"></a>

## 15. #1090 and #1197 — measured adoption evidence (Wave 6)

**Amendment type:** comment on each. Evidence only; neither comment ticks or proposes an acceptance
box, because #1090's boxes are explicitly observational and #1197's demand a *future* re-measurement.

**Proposed comment on #1197** (`agentic: the agent-init harness had zero adoption on 0.0.4`):

> **Wave-6 measurements — the seventh and eighth data points (2026-08-08).**
>
> This issue records six consecutive measured runs with zero docs-MCP calls. Wave 6 adds two more,
> and the second one breaks the streak in a way that is directly relevant to this issue's
> acceptance:
>
> - **R2** (`workflow-builder-kimi-k3-max/`, Kimi K3 Max, `0.0.5-canary.13`): **live NetScript MCP
>   calls 0** for the whole run. `netscript agent init` was skipped naturally until a 07:53:21Z
>   supervisor correction; the builder's own explanation was that it "misread 'agent tooling' as
>   optional editor garnish instead of the framework discovery path". `plugin doctor` and Aspire
>   OTEL unused. **Even after `agent init` ran, MCP calls stayed 0** — `agent init` could not attach
>   the generated `.mcp.json` to an already-running OpenCode host. Tool mix: 378 tool parts
>   (bash 263, edit 48, write 44, read 14, webfetch 7, todowrite 1, skill 1).
> - **R3** (`billing-run-grok-4.5-high-canary.16/`, Grok 4.5 high, `0.0.5-canary.16`): **MCP calls
>   non-zero** — export 6, docs search 3, doctor 2, doc 2, operation schema 2, API-service listing
>   2, plus package/service discovery; Aspire MCP list-apphosts 1, list-resources 1. 514 tool calls
>   total. This followed a **supervisor-enforced preflight**: `agent init`, local docs, reload, MCP
>   attachment and a harmless docs-lookup proof, all in the same session **before implementation**.
>
> **What this adds to this issue.** The zero is not purely a discovery-motivation problem. R2 gives
> a concrete mechanical cause — a running host cannot pick up a newly written `.mcp.json` — which is
> a fixable defect distinct from "agents do not know to look". And R3 shows the number moves when
> attachment is enforced at session start, which is evidence for this issue's "routing at the moment
> of failure" requirement being necessary but not sufficient: attachment has to work first.
>
> No acceptance box is proposed here; this issue's acceptance correctly demands a *re-measured*
> future run, and R2/R3 are prior runs, not that measurement.

**Proposed comment on #1090** (`verify(wave-five): does the shipped agent surface change behaviour?`):

> **Wave-6 observations relevant to this issue's four criteria (2026-08-08) — evidence, not
> discharge.**
>
> None of the four criteria here is satisfied by Wave 6, and this comment does not tick anything.
> Recording what Wave 6 observed, so the eventual verification run has a baseline:
>
> - *Non-zero MCP diagnostic usage:* R2 = 0 across the run; R3 = non-zero (export 6, docs 3,
>   doctor 2) but only after a supervisor-enforced preflight, so it is not an unassisted
>   observation.
> - *An agent building a data screen runs `ui:add` or records why not:* R2 did neither —
>   product `QueryIsland` / `withForm` / Fresh-UI feature-loop adoption **0 / 0 / 0**, and a
>   **676-line `LoomCanvas.tsx`** shipped instead. `definePage` and fresh-ui appear only in the
>   scaffold examples, never in the product routes.
> - *The #1071 falsifiable check (blind, six agents per arm, varying only the app-scoped conventions
>   file):* not run in Wave 6. Wave 6 was a natural experiment with a deliberate
>   no-contamination rule — suggestions such as naming the plugins or banning hand-rolled SSE were
>   explicitly **rejected as builder prompt contamination**. That discipline is worth preserving in
>   the eventual arm design, but it means Wave 6 cannot substitute for the controlled check.
> - *An agent asked to build a service-backed UI reaches a Web Layer page before writing a route:*
>   not observed in either run.
>
> **Thesis reinforcement.** Wave 6 restates this issue's own lesson with a second mechanism: R2
> adopted the framework and immediately surfaced five-plus D-class seams, so non-adoption is not
> inevitable — the shipped surface has to be *reachable at the moment of need*, and R3 shows the
> number moves when it is enforced.
>
> Reminder for planners: #1090, #1102, #1197 and #1201 are one measurement chain. Planning them
> separately builds the extraction harness three times.

**Rationale.** SYNTHESIS §1 and §6 treat the measurement chain as owned and untouchable; the value
this run can add is evidence, not scope. R2/R3 are the first measurements taken *after* the runs
#1197 describes.

**What it prevents.** A remediation slice claiming #1197's acceptance on the strength of R3's
non-zero MCP count — which was supervisor-enforced, not spontaneous; and the T7 pack re-deriving the
Wave-6 numbers instead of citing them.

---

<a id="board-hygiene"></a>

## 16. Board-hygiene batch

One batch, executed by the owner in a single pass. Every item is label/milestone metadata only — no
issue body changes, no closures, no scope decisions. All facts from `github-board-open.md` §5.1,
§4.1 and `github-conventions.md` §2.2, measured 2026-08-08.

### 16.1 Issues missing required metadata

The minimum contract is: ≥1 `type:`, ≥1 `area:`, exactly one `status:`, a `priority:`, and a
milestone (`github-conventions.md` §2.3).

| Issue | Missing | Proposed action |
| --- | --- | --- |
| **#175** | **all labels** (zero labels), no `priority:`, no `status:` | Triage: add `type:`, `area:`, `priority:`, `status:triage`. It sits in milestone `0.0.2`, which is stable-released — so also decide: still wanted, or close as not planned. |
| **#950** | no `priority:`, no `status:` | Add `priority:` + `status:triage`. It is an `epic:ai-stack` member in milestone `0.0.8`. |
| **#1000** | no `priority:`, no milestone | Add `priority:` + a milestone. Also carries the legacy `documentation` label (see 16.3). |
| **#979** | no milestone | Assign a milestone. It has a real dependency chain (E2E port probes + ~20 docs passages) so it should not sit unmilestoned; see §14 above. |
| **#980** | no milestone | Assign the same milestone as #979 — same defect, different command. |

**Proposed comment for #175** (it is the only zero-label issue and needs a human decision):

> **Board hygiene (2026-08-08).** This issue carries **no labels at all** — the only such issue on
> the open board — and no `priority:`. It is assigned to milestone `0.0.2`, which was released as
> `v0.0.2` on 2026-08-01 and still holds 5 open issues (#175, #767, #768, #863, #864). Requesting
> triage: apply the minimum taxonomy (`type:` + `area:` + `priority:` + `status:triage`), and either
> re-milestone it to a live cut or close it as not planned. No scope judgement is being made here.

### 16.2 `.github/labels.yml` parity

The file is materially out of date in both directions. Per its own header rule — *"Add new labels
here first, then create them; do NOT delete existing labels (that strips them off live issues) —
deprecate in this file and propose removal to the maintainer"* — the fix is **declare and create,
never delete**.

**(a) Declared in `labels.yml` but NOT live (2) — create them:**

- `status:close-gate-override` (`b60205`, "Audited exception to the closing-keyword acceptance
  gate")
- `docs-eval:skip`

**Consequence if not fixed:** the audited close-gate escape hatch documented in
`netscript-pr/SKILL.md` **cannot be applied today** — the label does not exist, so an audited
exception has no way to be recorded. This is the highest-value item in the whole hygiene batch
because it silently removes a documented process option.

**(b) Live but NOT declared in `labels.yml` (33, excluding the machine-generated `canary:*`) — add
them to the file so the declared taxonomy matches reality:**

- `area:` — `agentic`, `ai`, `contracts`, `db`, `packages`, `queue`, `release`, `runtime-config`,
  `sagas`, `services`, `streams`, `triggers`, `workers` (several in active use: `area:agentic` on
  #1330/#1331/#1343, `area:contracts` on #1332/#1263, `area:release`).
- `epic:` — `deploy-plugin`, `desktop-frontend`, `enterprise-auth`, `road-to-stable`,
  `unified-runtime`.
- `status:` — `blocked` (in live use on #1320 and #1280), `in-progress`, `in-review`, `review`.
- `type:` — `feature`, `release`.
- gates/flags — `gate:ci`, `e2e-cli-gate`, `priority:high`, `codex`, `dx`, `prime-time`, `sagas`,
  `service`, `question`, `invalid`.

**(c) Duplicate pairs — deprecate in the file with a note, do not delete.** Record the preferred
member so new issues stop splitting: prefer `type:feat` over `type:feature`; `priority:p1` over
`priority:high`; `area:database` over `area:db`; `area:plugins` over the per-plugin
`area:sagas`/`area:streams`/`area:triggers`/`area:workers` (the per-plugin ones are what #1325,
#1326 and #1329 actually carry, so if the split is intentional, say so in the file rather than
leaving it ambiguous).

**(d) The `status:` single-label hazard.** `labels.yml` says exactly one `status:` per open issue,
but four undeclared `status:` values are live (`blocked`, `in-progress`, `in-review`, `review`),
two of which duplicate declared columns. Either declare `status:blocked` (it is genuinely in use and
has no declared equivalent) and deprecate the other three, or map them onto declared columns.
Whichever, record it in the file.

**(e) `wave:*` labels.** `wave:v1`, `wave:v1-min` and `wave:defer` are declared and live but appear
on none of the recently filed issues. Mark them deprecated in `labels.yml` unless the plan revives
the band, so new filings stop being asked to consider them.

### 16.3 Legacy non-namespaced labels still in use

- `rfc` on **#234, #313, #510, #820** — all open, all `Backlog / Triage`. Decision needed: keep
  `rfc` as the flag it is declared to be, or introduce a namespaced equivalent. Do not strip it from
  live issues without a replacement.
- `documentation` on **#1000** only — the last user of the GitHub-standard label where
  `type:docs` + `area:docs` is the house taxonomy. Proposed: add `type:docs` + `area:docs` to #1000
  and leave `documentation` in place (deletion strips it from the issue).

### 16.4 Orphaned `epic:` labels (label group with no umbrella issue)

- `epic:desktop-frontend` — sole member #859.
- `epic:docs-cut` — sole member #695.
- `epic:telemetry-revamp` — sole member #248 (which is also `epic:ai-stack`).

Proposed: for each, either file/point to an umbrella, fold the member into an existing epic, or
deprecate the label in `labels.yml`. A single-member epic label is indistinguishable from a typo at
read time.

### 16.5 Cross-epic double membership

- **#451, #453, #454, #455** carry both `epic:deployment` and `epic:unified-runtime`. This is not
  itself an error, but it means **#823**'s entire open membership sits inside **#327**'s unchecked
  child list — three umbrellas (#327, #823, #830) over one child set.
- **#830** is an umbrella *and* a member of `epic:deployment` (i.e. a child of #327).
- **#248** sits in both `epic:ai-stack` and `epic:telemetry-revamp`.

Proposed: record the intended containment in each umbrella body (a single line naming the parent) so
the double membership reads as deliberate. Do not remove labels — the label group is the machine
truth for membership and stripping it loses the relationship.

**Proposed comment for #823** (the clearest case):

> **Board hygiene (2026-08-08).** This epic's entire open membership (#451, #453, #454, #455) also
> carries `epic:deployment` and appears in #327's unchecked child list; #830 is a third umbrella
> over the same deployment surface. No labels are being changed. Requesting one line in each of
> #327 / #823 / #830 stating the intended containment, so a planner reading any one of them knows
> whether the four shared children are owned here, there, or jointly. Planning these three
> independently will produce duplicate slices over one child set.

**Rationale for the whole batch.** `github-board-history.md` §6.7: label hygiene in this repo is
real and enforced — every closed 0.0.5 row carries exactly one `status:`, a `canary:` label and its
milestone, and the close-gate verifies GraphQL `closingIssuesReferences` against body keywords.
Drafts produced by this run will be rejected by those same gates if the taxonomy they are filed
against is itself inconsistent.

**What it prevents.** (a) An audited close-gate exception being impossible to record because
`status:close-gate-override` does not exist; (b) new issues splitting across `type:feat`/
`type:feature` and `area:db`/`area:database`, which makes every label-based query wrong;
(c) #979/#980/#1000 remaining invisible to every milestone view; (d) three deployment umbrellas
each planning the same four children.

---

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Baseline
`fac9e339042c` (== `origin/main`). Sources: `SYNTHESIS.md` §3 (adjudications 2, 3, 4),
`research/github-board-open.md` §4–§7, `research/github-board-history.md` §5–§6,
`research/github-conventions.md` §2–§4, `research/preplan-package.md`,
`research/repo-audit/{web-layer,scaffold-doctrine,runtime-plugins}.md`, `research/wave-6-runs.md`.
Every re-measured figure was executed in this worktree on 2026-08-08; the working tree was left
clean. **No GitHub state was read-modified or written by this run.**
