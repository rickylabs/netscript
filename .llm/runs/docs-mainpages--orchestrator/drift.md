# Drift log — docs-mainpages--orchestrator

- **D-1 (owner override, 2026-08-04).** #1209 finishing lane switched from agy
  (plateaued after 3 rounds — round-3 diff identical to round 2) to the **Claude-workflow
  documentation-authoring exception** (CLAUDE.md § Documentation-authoring exception).
  Validation stays opposite-family (Sol `docs_audit`).
- **D-2 (owner override).** Charter A lanes are owner-routed, not the default
  `documentation_authoring` lane: Sol·low ⇄ agy gemini-3.6-flash·high adversarial generator
  pair; final evaluator + polish OpenCode · Grok 4.5 max (overrides `docs_polish` Fable route).
- **D-3 (owner correction, on record at launch).** Inherited PR #1209 contains AI slop: an
  auth block force-fitted into the live-dashboard tutorial with no preceding auth step.
  Corrected bar: **narrative consistency over feature checklists**; homeless features route to
  #1210 deep-dives; slop-audit the diff before any further authoring.
- **D-4 (owner correction).** Orchestrator effort is LOW; two prior launches came up high
  against instruction. Confirmed in supervisor.md.

## Slop-audit of PR #1209 diff (f7558aa1c..38009a962), 2026-08-04

Confirmed findings:

1. **Auth force-fit (owner's finding, verified).** `live-dashboard/04` Step 2 injects
   `resolveAuthSession(ctx.headers)` / `@app/lib/auth.ts` / `auth.tenantId` / 401 throws into a
   tutorial whose earlier chapters never scaffold auth or tenancy. No `@app/lib/auth.ts` exists
   in the tutorial's app. Numbered feature-checklist comments (`// 1. Cross-layer
   Request-Dedup…` … `// 5. Partials & Deferred-Loader composition`) are checklist slop, not
   narrative.
2. **Contract regression.** The rewritten `ordersData` resource drops the `status` filter that
   Step 1's route contract defines, replacing it with the invented `tenantId` — the page no
   longer honors its own contract.
3. **Good prose deleted.** The `definePage` builder apiTable and the honest "this is the dense
   part — and it earns its weight" callout were deleted and replaced with generic feature tour
   prose.
4. **Unverified APIs.** `dehydrateQueryClient` / `hydrateFromDehydrated` /
   `getIslandQueryClient` / `createNetScriptQueryClient` / `ordersQueryUtils.updateStatus`
   (was `.update`) / `baseQueries.orders.getStats` / `baseQueries.orders.updateStatus.mutate`
   must be verified against `deno doc` before any of it survives.
5. **Lock hygiene.** `deno.lock` gains `jsr:@netscript/queue@0.0.4` (+1 line) in a docs PR —
   drop unless the type fixture genuinely requires it.
6. **Measured gaps stand.** traces 0 occurrences; withForm 1 (token); Partials 1 (token); no
   out-of-scope note on the PR for workspace/erp-sync tutorials.
