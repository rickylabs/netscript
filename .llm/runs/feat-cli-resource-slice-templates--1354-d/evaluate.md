# Evaluation: Slice D neutral resource template family — formal IMPL-EVAL (PR #1948)

Filled from `.llm/harness/templates/evaluate.md`. Result values: `PASS`, `FAIL`, `N/A`,
`NOT_RUN`. This file replaces the earlier `evaluate.md` committed in `4af7c98d5`, which was
produced by an evaluator launched from the generator session at pre-rebase head `5fd40ef13`
(see Process observations). This receipt is the supervisor-dispatched formal IMPL-EVAL.

## Metadata

| Field          | Value                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Run ID         | `feat-cli-resource-slice-templates--1354-d`                                                     |
| PR             | #1948 `feat(cli): establish neutral resource slice templates` — open, non-draft, base `main`, milestone `0.0.7`, labels `area:cli,status:impl,wave:v1,type:feat,priority:p2,orchestrator:features` |
| Attested head  | `4af7c98d5a180eeaf989fcf8f08ab4c4c25f74de` (`git rev-parse HEAD` after `merge --ff-only origin/feat/cli-resource-slice-templates` → "Already up to date") |
| Base           | `origin/main` = `e341c6f71033658099f694c4d8542a9676e6c68d` (#1946 / Slice C squash)             |
| Product commit | `792b7199b feat(cli): add neutral resource slice templates`; `4af7c98d5` is harness-only        |
| Later head     | `4861e0060 chore(harness): record Slice D PR handoff` landed on the branch during this evaluation; `git diff --name-only 4af7c98d5..4861e0060 -- packages` is empty (harness-only), so the product attestation at `4af7c98d5` holds unchanged |
| Master plan    | `origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md` — D3, D4, D5, D7, D8, Slice D |
| PLAN-EVAL      | `N/A` recorded in run `plan.md`/`supervisor.md` (locked master plan already PLAN-EVAL'd)         |
| Archetype      | `6 — CLI / Tooling`; Fresh 2.x generated-shape overlay, static validation only                  |
| Evaluator      | Native opposite-family Claude Fable 5.1 session (`claude-fable-5-1`), separate from the Codex implementation session; 2026-09-02 |
| Worktree state | Product tree clean; two uncommitted harness-only edits (`drift.md`, `worklog.md`) in the working tree — not part of `4af7c98d5` |
| Writes by this session | this file only; one throwaway round-trip script was created under `packages/cli/` and deleted (`git status` clean afterwards) |

## Verdict summary

No HIGH or MEDIUM finding. Four LOW findings, none blocking. All 11 required gates exit 0 at head.

## 1. Ceiling and layering — PASS

- `git diff --name-only origin/main..4af7c98d5 -- packages` = **18 files**, exactly the Slice D
  roster (11 `resource-slice/*.template`, `README.md`, `manifest.ts`, `embedded.generated.ts`,
  `scaffold-template-assets.ts`, `render-resource-slice.ts`, `render-resource-slice_test.ts`,
  `plan-resource-slice_test.ts`). Ceiling 18 met with the ceiling-exempt generated carrier
  included; hand-authored count is 17.
- `deno.lock` not in the diff. Outside `assets/resource-slice/`, the only `assets/` changes are
  `manifest.ts` (11 additive keys, zero removals) and the regenerated carrier.
- Overlap: `#1664` (100 files) ∩ D = ∅; `#1943` (Slice B, open) ∩ D = ∅; Slice A's four
  (`client-selector.ts`/`_test.ts`, `ui/web-scaffold.ts`/`_test.ts`) ∩ D = ∅ (`comm -12`).
- Layering: `render-resource-slice.ts` imports only `TemplatePort` (type), C's contract types and
  `markOwnedResourceSliceLeaf`, and the carrier *type*. No `Deno.*`, no filesystem, no asset read;
  `TemplatePort.render(template, context)` resolves synchronously via the pure `renderTemplate`.
  Asset IO lives solely in `adapters/templates/scaffold-template-assets.ts`
  (`loadResourceSliceTemplateAssets` → `loadTemplateMap`). D8 honoured.
- Slice C source untouched except `plan-resource-slice_test.ts` (one added roster-parity test).

## 2. D7 emitted-file contract and D3 marker — PASS

- Planned paths for `orders` at `/orders` match D7's table one-for-one: 6 core leaves
  (`index.route.ts`, `index.tsx`, `index.layout.tsx`, `(_components)/orders-view.tsx`,
  `(_islands)/OrdersIsland.tsx`, `(_shared)/orders-loaders.ts`), `--form` → `orders-form.tsx` +
  `(_lib)/orders-form.ts`, `--partial` → `orders-summary.tsx` + `routes/partials/orders/summary.tsx`,
  `--stream` → `(_islands)/OrdersStream.tsx`. Test "each option changes only page/view and adds
  its declared leaves" proves option isolation; "combined render records every strict canonical
  page/view predecessor" proves the 7 prior-subset renderings for additive transitions.
- Page contract: one `.withResource('orders', () => loadOrdersResource())`, one markup layer to
  the view, option layers only when selected, `.withLayout` + `.withMeta`, no view markup in the
  page. View uses app-owned `Card` primitives; no raw table. Loader path: factory
  `queryOptions` + `clientKey` through `fetchQuery`, `dehydrateQueryClient`, `cachedAt`; no raw
  `fetch(`, no handwritten `queryKey: [`, no `any`, no `JSON.parse(` (asserted by test and by my
  grep over the family: zero hits).
- Directory-role headers: `(_components)` on the view, `(_islands)` on the island, `(_shared)` on
  loaders, `(_lib)` on the form contract — the always-first leaf of each helper directory, as D7
  and the README specify; sibling optional leaves do not repeat them.
- Marker: the renderer does not hand-roll the marker; it calls C's `markOwnedResourceSliceLeaf`,
  which enforces an LF-terminated body and computes `sha256ResourceSliceBody(body)` over the
  entire body after the marker line including its final newline. Independent round-trip run by
  this session over the full 11-leaf render: every leaf's first line begins with
  `// @netscript/resource-slice {"schema":1,"resource":"orders","role":"…`, key order
  `schema,resource,role,options,bodySha256`, recomputed hash equals `bodySha256`, content ends
  with LF, `classifyResourceSliceLeaf(content, candidate)` → `exact`; same bytes against a
  changed candidate → `owned`; a one-byte body edit → `owned-edited`. **11/11 leaves.**

## 3. D4 — one neutral family, no extension point — PASS

- `grep -rnE "viewer|withPolicy|withTelemetry|hero|notes|extension|preset|fetch\(|JSON\.parse|\bany\b"`
  across `assets/resource-slice/` (excluding README): **zero hits**. The form layer's `mutate` is
  `(input) => copyOrdersFormValues(input)` — no viewer gate.
- No variable, slot, or hook exists in the templates or `renderVariables()` for a preset to inject
  layers; option fragments are renderer-owned and closed over `form|partial|stream`. README states
  "there is no neutral-template extension registry".
- Old canonical service-example templates (`assets/app/routes/examples/**`) are neither deleted
  nor edited (diff on `assets/` shows only `manifest.ts` + carrier outside the new family).
  Retirement correctly remains Slice F.

## 4. D5 — Fresh declaration Form B and cache-age — PASS

- `index.route.ts` → `defineRouteContract({})` default export; `index.tsx` → `.withRoute(appRoutes.{{routeAlias}})`, and `withRouteContract` appears nowhere in the family.
- Island: `QueryIsland` wrapper + `useIslandQuery({...queryOptions, queryKey: clientKey, initialData: props.initialData, initialDataUpdatedAt: props.cachedAt})`. The `initialDataUpdatedAt` cache-age behaviour is **present, not deferred**. (For lineage: #1664's shipped `ServiceShowcaseLab` island passes `initialData` and displays `cachedAt` but does not pass `initialDataUpdatedAt`; the neutral island therefore carries the HIGH-1 improvement.)
- The plan's D7 names `useIslandQuery`; the dispatch brief said `useQuery` — the template follows the plan and Fresh's `query/mod.ts` export.

## 5. Templates compile as emitted — PASS

- Test `full render type-checks as a consumer without starting a server` renders all 11 leaves
  (form+partial+stream) into a temp fixture under `packages/cli/`, writes a consumer `deno.json`
  mapping `@netscript/fresh/*` and `@netscript/sdk/*` to the **workspace source modules**, a
  `router.ts`, `utils.ts`, a `createQueryFactories`-based `lib/orders.ts`, and runs
  `deno check --no-lock --unstable-kv` over the rendered files; asserts exit 0. Rendered output is
  checked, not merely string-compared. Ran green in this session (see gate table).
- `check:emitted-samples` also exit 0 (48 samples / 38 artifact paths).

## 6. Carriers — PASS

- `manifest.ts`: 11 `resourceSlice*` keys; `plan-resource-slice_test.ts` asserts planner roster ==
  manifest `resource-slice/` keys. `scaffold-template-assets.ts`: `RESOURCE_SLICE_TEMPLATE_URLS`
  covers all 11; renderer's `TEMPLATE_ASSET_NAMES` maps every planner template name to a carrier key.
- `check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus` (35 pkgs / 273 subpaths /
  7,834 symbols, sha `087da112…`) all exit 0 at head.
- `docs:readme-fences`: PASS, `type_errors=7` — baseline held, no raise.

## 7. LOW-4 child count / arch — PASS

- `application/resource-slice/` direct children: **12** (cap 12; no F-16 WARN emitted for it).
  The plan's projected 14 assumes Slice A's two selector files, which are not on this base
  (recorded in `drift.md`). Rescope threshold (15) not approached.
- `arch:check` exit 0, CLI block `FAIL=0 WARN=60 INFO=1`.

## Gate table (run by this session at `4af7c98d5`, raw exit codes)

| Gate | Exit | Evidence |
| --- | ---: | --- |
| `run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | 935 files, 8 batches, 0 failed batches, 0 diagnostics |
| `run-deno-test.ts -- --allow-all …/application/resource-slice/` | 0 | 42 passed / 0 failed / 0 ignored (3.6 s) |
| `check:assets-barrel` | 0 | — |
| `check:publish-assets` | 0 | — |
| `check:mcp-export-corpus` | 0 | 35 / 273 / 7,834; sha `087da112…` |
| `check:emitted-samples` | 0 | 48 samples from 38 artifact paths |
| `check:aspire-version-parity` | 0 | `ok:true`, fail 0, deferred 18 (pre-existing), missing 0 |
| `docs:readme-fences` | 0 | PASS, 36 READMEs, 73 checked, `type_errors=7` (baseline) |
| `docs:jsdoc-examples` | 0 | PASS, 359 checked, failures 0, deferred `unboundName=116` (baseline) |
| `arch:check` | 0 | CLI `FAIL=0 WARN=60 INFO=1`; no `resource-slice` warning |
| `quality:gate` | 0 | scanner `ok:true`, findings `[]`, 7 accepted allowances (pre-existing), boundary `ok:true` |

CI at head: `build`, `code-quality`, `close-gate`, `classify changes` pass; `check-test`, `quality`
pending at evaluation time (lane to confirm before merge; local equivalents above are green).

## Findings (severity-ranked)

- **LOW-1 (evidence gap, non-blocking).** `render-resource-slice_test.ts` proves markers via
  `parseOwnedResourceSliceLeaf` and hash goldens but never routes a rendered leaf through C's
  `classifyResourceSliceLeaf`. This session performed that round-trip (11/11 `owned`); Slice E
  should add the assertion so the reconciler contract is pinned in-tree.
- **LOW-2 (fixture fidelity, non-blocking).** The consumer type-check fixture stubs
  `@app/components/ui/mod.ts` with hand-written `Card`/`FormField`/`Input`/`InlineNotice`/`Button`/
  `getInputProps` shapes rather than the real scaffold's `ui/mod.ts`. The real module exports every
  imported symbol, and the existing scaffold-tested `managed-form.tsx` uses identical props, so the
  risk is low; Slice F's init-equivalence and the hosted lane cover the real primitives.
- **LOW-3 (evidence discrepancy).** Worklog/PR body report CLI `WARN=59`; this session measured
  `WARN=60`. The new `assets/resource-slice/` directory deepens the pre-existing F-16 WARN on
  `src/kernel/assets` (16 children) — WARN class, plan-mandated location, no debt entry required.
- **LOW-4 (process).** The IMPL-EVAL comment already on #1948 (`5515502617`) and the
  `evaluate.md` committed in `4af7c98d5` come from an evaluator launched by the generator session
  at pre-rebase head `5fd40ef13`; the committed file self-references `4af7c98d5`, the commit that
  contains it. Protocol requires the supervisor to trigger the evaluator; this session is that
  dispatch and supersedes the earlier receipt. Lane should also commit the two pending harness-only
  edits (`drift.md`, `worklog.md`).

## Concept of Done / close-gate

- `Refs #1354` only; no closing keyword; #1354 remains open. `close-gate` CI job passes.
- Definition-of-Done boxes in the PR body are consistent with measured evidence (with LOW-3's count
  delta). Debt registry: no new doctrine violation introduced; nothing to record.
- Design checkpoint present in `worklog.md` (§ Design, 7 items) ahead of the product commit.

[PHASE: IMPL-EVAL] [VERDICT: PASS]
