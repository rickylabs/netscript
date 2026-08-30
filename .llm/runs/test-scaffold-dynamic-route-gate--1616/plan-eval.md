# PLAN-EVAL — test-scaffold-dynamic-route-gate--1616 (cycle 1)

- Plan evaluator session: native opposite-family · Claude Fable 5 · 2026-08-30 · evaluator worktree
  `worktrees/007-eval-1616-plan` (detached, artifact-only)
- Generator identity (from `supervisor.md`): OpenAI GPT-5.6 Sol — opposite family confirmed
- Run: `test-scaffold-dynamic-route-gate--1616`
- Evaluated head: `112a6a7ba259b6f412c697cb124a8f4070224e4d` (local == remote == PR #1773 head,
  verified with `gh pr view 1773 --json headRefOid`)
- Base: `main` @ `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c`
- Surface / archetype: `packages/cli` scaffold writer + `packages/cli/e2e` runtime catalog /
  Archetype 6 (CLI / Tooling)
- Scope overlays: `frontend`

## Verdict

**`FAIL_FIX`** — the plan's shape is right and should not change: product seed (D1), one
`[id]` route (D2), gate in the existing runtime behavior sequence (D6), reused endpoint resolver
(D7), no workflow commit (D8), honest lease boundary. Four bounded corrections to `plan.md` are
required before implementation; each is a lock the plan leaves implicit and each would otherwise
surface only under the expensive lease or, worse, pass green without proving binding. Under
`verdict-definitions.md` strictly this is a bounded Plan-Gate failure (one unchecked box:
open-decision sweep); the brief's vocabulary for that is `FAIL_FIX`. Implementation remains blocked
until `plan.md` carries the four locks and a cycle-2 PLAN-EVAL confirms.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` re-baselined at `3e5cbabf` on 2026-08-30. Spot-checked: the issue's exact grep exits 1 at this head; `app-route-seeds.ts` seeds only static patterns; `1ed78f50…` resolves and is the #1602 fix; pre-fix `runtime/context.ts` `resolvePathParams` returns `{}` when no schema is supplied — mechanism confirmed from the tree, not from the brief. |
| Decisions locked | PASS | D1–D8 in `plan.md § Locked Decisions`, each with rationale. |
| Open-decision sweep | **FAIL (bounded)** | Four decisions are left implicit that force rework or produce a false green if deferred — see *Required fixes* F1–F4. None is flagged in the plan's sweep table. |
| Commit slices (< 30, gate + files each) | PASS | Six ordered slices, RED first, each names files and proving gate. |
| Risk register | PASS | Seven risks with mitigations. Row 1 ("seed and post-generation route shapes diverge") names the right risk but its mitigation is not a lock — closed by F4. |
| Gate set selected | PASS | Ten ordered rows; static/fitness/repository rows lease-free, rows 8–10 explicitly leased. Matches Archetype 6 + frontend overlay (browser coverage stays in `behavior.app-reference`). |
| Deferred scope explicit | PASS | `plan.md § Non-Scope` — no generator rework, no fixture injection, no new suite, no workflow edit, no unleased runtime. |
| jsr-audit surface scan | PASS (N/A with reason) | No export-map, `mod.ts`, `testing.ts`, or declaration change; new `.tsx.template` rides the existing embedded asset barrel. `cli/public-api-doc-completeness` debt unchanged. |

## Attack narrative

### 1. D1 — seeding the product scaffold is a public-surface decision

The plan's reasoning holds. #1616's acceptance box 2 reads *"an existing runtime gate exercises
that dynamic route end to end — generated, built, and requested — rather than through a
hand-authored fixture"* and the issue names Reading A as what it closes. An E2E-injected fixture
would be a second hand-authored model and would not be what a consumer receives; the plan is right
to refuse it.

Representativeness: the emitted page mirrors exactly the shape #1576 hit — a
`createRouteReference` with no explicit path schema (seed + generator both emit that form) bound
through `definePage().withRoute(...)` and consumed via `ctx.path.<param>`. The scaffold's own pages
already bind this way (`health.tsx.template`, `examples/index.tsx.template` →
`.withRoute(appRoutes.x)`), so the dynamic page is the existing convention plus one `[id]` segment,
not a new idiom for consumers to learn. The generator's page-module rewriter skips pages that
already carry `.withRoute(` (`manifest-page-module.ts` `scanPageModuleRouteBinding`), so the seeded
binding survives regeneration — same as every current scaffold page.

Cost honesty — two consumer-visible surfaces the plan does not list:

- `packages/cli/src/kernel/templates/app/agent-conventions.ts` renders the generated project's
  conventions doc from an explicit list of canonical example routes (`telemetry-route`,
  `service-partial`, …). A new canonical dynamic example that the conventions doc does not mention
  is a consumer-facing omission. Non-blocking; recommend adding it.
- `packages/cli/src/public/features/root/public-command-tree_test.ts:114-122` pins a
  retained-example-route list (`examples/crud.tsx`, `examples/telemetry/index.tsx`, …). Extending
  it is cheap and is the natural home for the "route survives every init variant" assertion.
  Non-blocking.

No repo doc or site page enumerates the scaffold tree (grep over `*.md` found only the three
source sites), so nothing else pins `scaffold.init` output. The `orders` example is thematically
detached from the `{{modelName}}`-driven examples, but the issue itself proposes
`/examples/orders/[id]`; acceptable.

### 2. Three distinct assertions

The plan names them (row 8 compile, D5 rendered id, D5 self href) but **as written D5 collapses (b)
and (c) into one substring check**: `order-42` is a substring of `/examples/orders/order-42`, so a
body that contains only the href marker satisfies both markers with a naive `includes`. That is the
exact blind-spot shape the brief warns about. → **F1**.

(a) compile-time: `generated.deno-check` on the seeded reference and a page that consumes
`ctx.path.id` as `string` catches inference regressing to `{}`; it would not catch a broadening to
`any`/`Record<string,string>`. The fresh package's own type tests carry that; acceptable for this
gate, noted.

### 3. Would this gate have fired on #1576?

Yes — walked against the pre-fix tree (`1ed78f50^`):

1. `resolvePathParams(undefined, ctx.params)` → `{}` for **every** request mode (the pre-fix code
   never consulted the route; partial vs full made no difference — the partial was merely where the
   consumer saw it).
2. Page reads `ctx.path.id` → `undefined`; renders `route.href({ path: { id } })` → href builder
   throws on the missing required param → Fresh returns **500**.
3. Probe requires HTTP 200 → **fails on status** before markers are even inspected. If a future
   regression produced `{}` without a throw, the rendered-id marker is absent → fails.

Both conditions hold only if the template really derives the rendered id from `ctx.path.id` and
the href from that id — which the plan states but does not test at the text level. → covered by F2.

### 4. Runtime-lease honesty

Honest. Rows 1–7 are lease-free and are what RED/GREEN slices 1–4 prove; rows 8–10 are explicitly
"leased" and slice 5 says *"after the coordinator grants the serialized lease"*. The RED-feasibility
section states plainly that the exact live 500 is not reproducible lease-free on fixed `main`. The
plan does not quietly assume a lease anywhere. D8's premise "existing CI owns the runtime suite" is
true (`.github/workflows/e2e-cli-prod.yml`, `e2e-cli-prod-local.yml` run `scaffold.runtime`), though
note those are not per-PR jobs — the leased one-pass run in row 10 is the real merge proof, which the
plan already says.

### 5. False-green surface

- **Substring collapse** (attack 2) → F1.
- **Fixed id shared with the examples link.** The probe requests `order-42` and the examples page
  links `order-42`. A template fallback (`ctx.path.id ?? 'order-42'`), a literal in the page, or a
  `ctx.params`/`ctx.url` read would all render the markers without typed binding. → **F2** (nonce
  id + template-text assertions).
- **Partial mechanism ambiguity.** Fresh 2 detects a partial by the `fresh-partial` **search
  param** (`PARTIAL_SEARCH_PARAM = "fresh-partial"`, `ctx.isPartial =
  url.searchParams.has(...)`); there is no header. D4's "with `fresh-partial: true`" reads like a
  header. A header-based probe would silently exercise the full-page path only. → **F3**. The
  scaffold `_layout.tsx.template` wraps page content in `<Partial name='page'>`, so a real partial
  response does carry the page body and the markers — good.
- **Seed/generator key divergence.** `generated.deno-check` runs *before* `runtime.aspire.start`,
  so it type-checks the CLI-authored **seed**; the vite plugin's `buildStart` then regenerates
  `.generated/routes.ts` from the route files, so the live probe hits **generator output**. The
  generator maps `[id]` → key `$id` and metadata id `examples.orders.$id`
  (`toRouteKeySegment`, `renderRouteReferenceExpression`). If the seed uses any other key (e.g.
  `examples.orders.detail`) the router alias type-checks at row 8 and breaks at runtime — visible
  only under lease. Existing seeds mirror the generator exactly (`examples.crud` ↔
  `examples/crud.tsx`), so the convention exists; the plan must lock it. → **F4**.
- **Empty selection.** Reusing `probe-app-home`'s resolver means zero resolved URLs ends in a
  thrown pending error after the retry budget, never a pass. Plan should state this inherits
  (one sentence); not blocking.

### 6. Scope discipline

`git diff --stat 3e5cbabf..112a6a7b -- . ':!.llm/runs'` is **empty**. Verified.

### 7. Receipt honesty

All cited SHAs resolve: `3dc2efcc` (bootstrap), `c06d3654` (research), `112a6a7b` (plan) are the
three commits above base; `1ed78f508545c4197eb0deffab1714153bdb3a33` is `fix(fresh): bind
generated route references to runtime path and search state (#1602)`; `3e5cbabf…` is `main`. PR
body slice SHAs match `git log`. PR is draft, base `main`, labels `type:test area:cli area:fresh
status:plan-eval`, milestone `0.0.7`, `Closes #1616`.

Credential boundary: D8 plans no `.github/workflows/**` edit and the risk register isolates any
unexpected one into a final unpushable commit. Correct.

## Open-decision sweep (evaluator-run)

Decisions the plan leaves implicit that force rework or a false green if deferred:

1. Marker discrimination between rendered path id and self href (F1).
2. Which id the probe requests and how the template is proven to source it from `ctx.path` (F2).
3. Exact partial-request mechanism and whether the plain GET is also probed (F3).
4. Seeded key path / metadata id for the dynamic reference and its equality with generator output
   (F4).

## Required fixes (bounded — amend `plan.md` D4/D5, slice 1, slice 2; no shape change)

1. **F1 — Element-scoped markers, not substrings.** Lock D5 to two markers that cannot satisfy each
   other: the rendered id as element text/attribute (e.g. `data-order-id="<id>"` or
   `<output id="order-id"><id></output>`) and the href as an attribute
   (`href="/examples/orders/<id>"`). The RED probe unit test must include negative cases: a body
   with only the href marker fails the path assertion; a body with only the id marker fails the
   href assertion; a 500 body fails on status.
2. **F2 — Nonce id and template-text proof.** The probe requests `/examples/orders/<nonce>` with a
   per-run generated id (never the fixed `order-42` that the examples page links) and requires the
   nonce in both markers. The scaffold template test asserts the emitted `[id].tsx` reads
   `ctx.path.id`, derives the href from that value via the bound route, and contains no
   `ctx.params`, `ctx.url`, or literal id fallback. (`order-42` may remain as the examples-page
   link — that is product copy, not the probe's input.)
3. **F3 — Lock the partial mechanism; probe both modes.** D4 becomes: GET
   `/examples/orders/<nonce>?fresh-partial=true` (Fresh 2 `PARTIAL_SEARCH_PARAM`; no header
   exists). Additionally probe the plain GET `/examples/orders/<nonce>`; both must return 200 with
   both markers. Pre-fix #1576 failed in both modes; probing both closes the render-path split at
   negligible cost.
4. **F4 — Lock the seeded key to generator output.** Seed `routePatterns.examples.orders.$id.$route
   = '/examples/orders/[id]'` and `routes.examples.orders.$id.$route =
   createRouteReference(..., { id: 'examples.orders.$id', kind: 'page' })`; the `router.ts.template`
   alias references `generatedRoutes.examples.orders.$id.$route`. Add a unit test that the seed for
   this route equals the manifest generator's output for `routes/examples/orders/[id].tsx` (run
   `generateRouteManifest`/render helpers over a temp routes dir). This is the plan's own risk row 1
   turned into a lock, and it is the Reading-B provenance check in miniature at zero lease cost.

## Notes (non-blocking)

- Add `routes/examples/orders/[id].tsx` to `agent-conventions.ts` canonical references and to the
  `public-command-tree_test.ts` retained-route list.
- "Critical" is the default for every `commandGate` (`gate-factory.ts`); no extra work implied.
- State once that the probe inherits `probe-app-home`'s zero-candidate failure semantics.
- Cycle budget: this is cycle 1 of the two allowed.

## Evaluator boundary

Wrote this file only. No source, test, `plan.md`, `research.md`, PR body, label, draft state,
milestone, or issue was touched. Diff versus `112a6a7b` outside `.llm/runs/` is empty.
