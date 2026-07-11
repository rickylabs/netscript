# Worklog — Issue #661 SAMPLE slice (workspace/05-route-authz)

Run: `docs-661-sample--opus` · branch `docs/661-sample-workspace-authz` · base `955b4abf`
Generator: Opus 4.8 (docs-authoring lane, under netscript-harness + deno-fresh).

## Scope

Rebuild ONE tutorial chapter (`docs/site/tutorials/workspace/05-route-authz.md`) to the MedusaJS
quality bar as the owner-review sample for audit proposal #3, before the full rollout.

## Grounding

- API grounded via `deno doc`-level read of `packages/fresh/src/application/route/mod.ts` +
  `types.ts`, and the tested usage in `packages/fresh/src/application/route/contract.test.ts`.
- Service seam grounded in `packages/service/tests/auth/builder-auth_test.ts` (401/403/200) and the
  dynamic-route/param syntax in `packages/service/tests/hono-tracing_test.ts`
  (`.route('get','/profiles/:id', c => c.req.param('id'))`).
- Series continuity: read chapters 01–04 and the live-dashboard/04 reference chapter (the only prior
  chapter using `defineRouteContract`). Reused chapter 3's `workspaceDb`/`Member` and chapter 2's
  `Principal` so the rebuild stays continuous with the track.
- **De-risked the exact API usage by type-check** (not assumed): scratch file inside
  `packages/fresh/` importing the real `./src/application/route/mod.ts` + `zod`. `deno check` PASSED
  for both `createRouteReference('/api/workspace/[workspace]/members')` (typed `{ workspace }`) and
  the `bindRoutePattern(defineRouteContract({ pathSchema: z.object(...), searchSchema:
  paginationSearchSchema().extend({ role: fallback(...) }) }))` form (typed path + typed
  limit/offset/role + `.href`/`.parsePath`/`.parseSearch`). Scratch removed after verification.

## code:prose measurement (before/after)

Consistent metric: fenced (```) code lines as % of non-fence lines (excludes inline `tabbedCode`
strings on both sides, so the ratio is comparable).

- **Before:** 46 fenced code lines / 200 non-fence lines = **23.0%** (206 raw lines).
- **After:** 105 fenced code lines / 322 non-fence lines = **32.6%** (332 raw lines).

Density rose ~10pts into the MedusaJS 25–45% band. More important than the number: every fenced block
is now a complete, path-labeled, copy-pasteable file, and the code demonstrates the typed-route
primitive the chapter's title promises instead of a static string route.

## What changed and why (owner-review summary — paste into #661)

Rebuilt `tutorials/workspace/05-route-authz.md` to the MedusaJS bar and to audit proposal #3 (the one
chapter whose title promises typed-route + authz, previously using neither). Changes:

1. **Typed route is now the spine.** A new Step 1 declares the members route as a single bound route
   contract (`contracts/routes/workspace-members.ts`) using `createRouteReference` +
   `defineRouteContract`/`bindRoutePattern` + `paginationSearchSchema`/`fallback`. It owns the URL
   pattern, the typed `{ workspace }` path param, and typed `limit`/`offset` pagination — the exact
   `@netscript/fresh/route` surface the audit flagged as showcased in only 1 of 5 tutorial series.
2. **Route made dynamic + real.** The old static `GET /api/workspace` became
   `GET /api/workspace/:workspace/members`, listing chapter 3's `Member` rows via `workspaceDb`,
   with params read *through the contract* (`membersRoute.parsePath(c.req.param())` /
   `.parseSearch(...)`) instead of hand-parsing — the differentiator over a plain framework route.
3. **The tested auth seam is preserved, not replaced.** `.withAuthn()`/`.withAuthz()` +
   `createScopeAuthorizer`/`createStaticCredentialAuthenticator` still drive the 401/403/200 the
   framework's `builder-auth_test.ts` asserts; the authz `match` now aligns with the contract prefix.
4. **MedusaJS skeleton applied.** Prerequisites → 3 single-action Steps → **Test it out** → **Next
   Steps**, every code block a complete path-labeled file, plus a concrete expected `200` JSON body.
5. **Series discipline kept.** learningPath, the "Verify your progress" checklist, the
   "route-level authz not org/role RBAC" warning, the health-public note, and the
   `arch-debt:seamless-auth-roadmap` caveat marker all retained.
6. **Honesty callout added** for the one real seam: Fresh `[workspace]` vs Hono `:workspace` name the
   same param; `parsePath(c.req.param())` bridges them. No invented converter API.

Net: the chapter now teaches "one contract + one guard, checked by the compiler and the framework's
own test — three facts that cannot drift," which is the differentiator the audit says the docs
underuse.

## Validation evidence

- **API type-check:** `deno check --unstable-kv` on the scratch usage → `Check ... route-scratch.ts`
  (pass; only an unrelated npm build-scripts warning). Confirms both contract forms compile with
  typed path + search.
- **Docs verify** (`deno task verify` from `docs/site`): build OK — 512 files, **169 pages**;
  `check:links` → "23454 internal links across 169 pages — all resolve"; `check:caveats` → "27 caveat
  markers across 22 pages — all references resolve" (includes this chapter's caveat).
- **Public-docs grep gate:** `grep -rniE "eis-chat|eischat|VIF|CSB|PR #|pull/[0-9]|dogfood|issues/[0-9]"`
  over the touched file → **0 hits**.

## Notes / drift

- No PR opened, nothing pushed (per slice instructions) — committed locally on the branch.
- Slice-review gate: this is a generator (Opus) product; IMPL-EVAL / Tier-A sign-off is a separate
  opposite-family session per harness invariant and is out of scope for this generation slice.
