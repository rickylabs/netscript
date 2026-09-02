# IMPL-EVAL — PASS

GLM 5.3 Flash · `max` · head `25ecb5ee7` · base `d0fa4ffea`.

It rebuilt the census from scratch — its own CommonMark fence parser, its own import-map
construction from raw `deno.json` configs, its own `deno check` materialization and diagnostic
attribution — and reproduced **every** number at both ends. None failed.

All three findings were corrections to my claims, and all three were applied:

1. **My "unrepairable" framing was overstated.** It prototyped a faithful `@app/router.ts` support
   stub in `materializeSharedSupports` that clears the error *and* its downstream `TS18046`
   (7→5, failing READMEs 5→4) without changing a character of the README. Corrected in the policy
   header to a disclosed tradeoff (fixture drift risk) with the reason it is not taken here. Not
   implemented: a shared fixture every package's fences compile against deserves its own evaluated
   slice.
2. **The enumeration named 5 of the 6 TS2307s**, omitting `@example/contracts`. Completed.
3. **My fmt claim was wrong** — and the cause was a methodology error of mine. I checked
   `origin/main` copies by copying them to `/tmp` with flattened names, so `deno fmt` used its
   defaults instead of this repo's config and reported all 5 unclean. Re-verified **in place**:
   `ai`, `mcp`, `service` are unclean on main; `fresh-ui` and `fresh` are clean, and still clean at
   HEAD. No new formatting debt in any of the five. PR body corrected.

---

Scope passes first glance: only `packages/*/README.md` plus the gate tool and its test. Let me see the full diff.
Now let me read the gate tool itself to understand what the census measures, then build my own independent census.
The gate reuses `snippet-extractor` (fence parsing) and `snippet-compiler` (materializes synthetic modules into a temp dir with a merged workspace import map, runs one `deno check`). Key subtlety: the extractor treats a 4-backtick fence as closed only by a fence of ≥4 backticks, so the old mcp mega-fence counted as **one** checked `ts` block whose body mixed prose + a nested fence.

Let me run the gate at HEAD first, then build my own independent census.
Base structure confirmed: a 4-backtick opener at 276 swallowing prose + heading + nested 3-backtick fence, closed by the 4-backtick closer at 305. Now let me understand the import-map resolution so my independent census can mirror the compile environment faithfully.
Gate at HEAD self-reports PASS with exactly the claimed census. Now I'll build a genuinely independent census: my own fence parser, my own import-map construction from raw `deno.json` configs, my own compile + error attribution — reusing only the harness's support fixtures (fixture content, not counting logic).
One member uses `jsr:@std/assert@1`, the rest `@^1` — the gate's merge rule canonicalizes bare-major ranges to `^` and keeps first. Mirroring that faithfully:
Independent census at HEAD **reproduces the gate exactly**: `36/168/73/0/73/0/7/5`. The 7 errors are 6×TS2307 + 1×TS18046 across 5 READMEs — note the gate comment enumerates only 5 of the 6 TS2307 specifiers (`@example/contracts` in `packages/service` is unnamed); I'll come back to that.

Now the base census:
Gate at base reproduces the claimed base census exactly (`36/167/72/0/71/1/32/7`, syntax-invalid fence at `packages/mcp/README.md:277`, PASS). My base census run lost its cwd — rerunning with absolute paths:
My census at base diverges — `deno check` aborts the whole program on the first parse failure, so a single round sees no type errors. The gate iterates exclusions for exactly this reason. Let me capture the raw diagnostic shape and add the exclusion loop.
Still no diagnostics found though `compilerCode=1` — the base failure shape doesn't match my regex. Let me dump the raw stderr:
The gate's regexes only work on **mapped** diagnostics (`mapDiagnostics` rewrites generated paths to `README.md` before matching); my script regexed the raw output. Restructuring to map inside the loop:
**Independent census reproduced at both commits:**

| | gate @base | mine @base | gate @HEAD | mine @HEAD | claimed |
|---|---|---|---|---|---|
| readmes | 36 | 36 | 36 | 36 | 36 |
| fences | 167 | 167 | 168 | 168 | — |
| tsLike | 72 | 72 | 73 | 73 | 72→73 ✓ |
| checked | 71 | 71 | 73 | 73 | 71→73 ✓ |
| syntaxInvalid | 1 | 1 | 0 | 0 | 1→0 ✓ |
| typeErrors | 32 | 32 | 7 | 7 | 32→7 ✓ |
| failingReadmes | 7 | 7 | 5 | 5 | 7→5 ✓ |

The base error listing also confirms the repair narrative: the 25 repaired errors are exactly `pool`×4+`status`×4 (ai), `Session`/`columns`/`rows`/`selectedIds`/`setSelectedIds` (fresh-ui), `loadOrder`/`desktopWindow`/`ordersRouter`/`routeEvents`×2/`OrderSummary` (fresh), and `OrdersContractV1`/`router`/`service`/`workers`/`queue`/`database` (service). Every floor rose or held, every ceiling fell or held.

Now the central risk — the `declare const` fidelity. Let me see the full fence bodies as they now stand:
The compile proves usage-site compatibility; now I verify each declared symbol is the real exported type via `deno doc`. First, find the export targets:
`DataGridColumn<T>` / `DataGridRow<T>` are real generics on the root entrypoint. Now the rest:
All service/desktop/pool declared types are real exported API. Now the externals and the mcp projection param:
The imports resolved and the generic instantiations are valid — the only error is my probe's own `never` narrowing. Fixing the probe:
`Signal<readonly string[]>`'s `.value` is `readonly string[]` (check1 passed) and both externals resolved without TS2305 — fidelity confirmed. All declared symbols check out.

**Step 4 — the mcp fence repair.** Verify nothing was deleted and the swallowed prose is prose again:
The window mismatch made that diff noisy. Let me normalize exactly the two four-backtick delimiters and diff whole files:
The mcp repair is byte-exact: **two delimiter normalizations + one `declare` line + one closer — nothing deleted or reworded**; the swallowed prose/heading now render as prose/heading. And `indexOpenApiOperations(document: unknown)` confirms the `unknown` declare is faithful.

**Step 5 — the deferrals.** Let me look at the `@example/contracts` fence (the TS2307 the gate comment fails to enumerate) and the other deferred fences:
All 6 TS2307 deferrals are reader-real app/installer-owned imports (`./router.ts`, `./contracts/orders.ts`, `./schema/.generated/client.server.ts`, `./auth/sdk-client.ts`, `@app/router.ts`, `@example/contracts`), and the TS18046 is downstream of the unresolved `@app/router.ts` route. Now let me actually try to repair one, as instructed. First, what shape would a fabricated `@app/router.ts` support need?
A faithful support stub is constructible (`createRouteReference('/partials/orders/[id]', …)`). Let me empirically test whether repairing the fresh fence this way actually works — prototype via my census script with an injected `@app/router.ts` support alias:
**The prototype repair works**: with a ~10-line faithful `@app/router.ts` support stub (real `createRouteReference` API, the same fabrication pattern `materializeSharedSupports` already uses for `@app/lib/orders.ts` etc.), typeErrors drop **7 → 5** and failingReadmes **5 → 4** — the fresh TS2307 *and* the downstream TS18046 both vanish, with `ctx.path.id` correctly inferred. So the deferral is honest but "unrepairable" is overstated for the fresh pair; I'll weigh that in the verdict.

Now **step 6 — scope and the fmt-unclean claim**, plus the gate's own unit tests:
Gate unit tests pass (6/6). But the fmt probe says the READMEs are fmt-**clean** on origin/main under default settings — the opposite of the load-bearing claim. The repo's fmt config may differ from defaults; let me check the actual repo fmt settings:
The repo's fmt gate is `--ext ts,tsx` only — Markdown is out of its scope entirely. Let me verify the claim precisely: are the READMEs fmt-clean at HEAD, at origin/main under repo settings, and under default settings?
The claim's truth depends on which settings: under **default** fmt settings all 5 are unclean on main (claim holds), but under the **repo's own pinned settings** (lineWidth 100) the origin/main versions are clean — and 3 of them become unclean at HEAD. Let me see exactly what fmt would change:
The stdin probe may not apply the repo config. Let me redo the origin/main check with real files inside the repo:
The real-file test under repo config confirms the load-bearing claim for the 3 files where it matters (`ai`, `mcp`, `service` — already UNCLEAN on origin/main); `fresh-ui` and `fresh` are CLEAN on main and remain CLEAN at HEAD, so nothing was excluded there. Last check on this point: confirm fmt's complaints don't touch the PR's added lines:
That mixed the three files' line numbers. Per-file check:
fmt flags only pre-existing lines in all 3 files — the PR's added lines are fmt-clean everywhere. The claim verifies.

**Step 7 — does the gate still bite?** Injecting a fresh type error plus a fresh syntax-invalid fence into `packages/mcp/README.md` (will revert immediately after):
The gate bites exactly as designed: exit 1 naming all three crossed ceilings, census printed on fail. Reverting the injection:
Two stray scratch files from my census run (the `--app-router` arg was also consumed as the output path) — removing them:
Worktree clean, scratch confined. One last cross-check — the "un-masked two blocks" claim (tsLike +1, checked +2 arithmetic):
All arithmetic checks out: base mcp had 1 counting block (the 4-backtick mega-fence, swallowed the nested one), syntax-invalid → 0 checked contribution; HEAD has 2 blocks, both checked → tsLike +1, checked +2, exactly the "un-masked two blocks" claim.

---

## IMPL-EVAL report — PR #1935

**Every number reproduced, independently.** I wrote my own census (own CommonMark fence parser, own import-map construction from raw `deno.json` configs, own `deno check` materialization + diagnostic attribution, reusing only the harness's support fixtures) and ran it alongside the gate at both commits:

| | gate @base | mine @base | gate @HEAD | mine @HEAD |
|---|---|---|---|---|
| readmes / fences | 36 / 167 | 36 / 167 | 36 / 168 | 36 / 168 |
| tsLike / exempt | 72 / 0 | 72 / 0 | 73 / 0 | 73 / 0 |
| checked / syntaxInvalid | 71 / 1 | 71 / 1 | 73 / 0 | 73 / 0 |
| typeErrors / failingReadmes | 32 / 7 | 32 / 7 | 7 / 5 | 7 / 5 |

No number failed to reproduce. The base error listing confirms the repair narrative: the 25 repaired errors are precisely `pool`×4+`status`×4 (ai), `Session`/`columns`/`rows`/`selectedIds`/`setSelectedIds` (fresh-ui), `loadOrder`/`desktopWindow`/`ordersRouter`/`routeEvents`×2/`OrderSummary` (fresh), `OrdersContractV1`/`router`/`service`/`workers`/`queue`/`database` (service).

**Ratchet is genuinely tighter.** Floors: 36→36, 72→73, 71→73. Ceilings: 1→0, 7→5, 32→7. No bound loosened; every bound sits exactly at the measured census. Policy unit tests pass 6/6 with consistently updated expectations.

**No `declare const` lies.** `deno doc` confirms every declared symbol is the real exported type from the imported subpath: `McpTransportPool` (class; `server(id)`/`snapshot`/`connect`/`reconnect` all match usage), `DataGridColumn<T>`/`DataGridRow<T>`, `DesktopBindableWindow`/`DesktopRpcRouter`, `ServiceRouter`, `ContractPolicyContract`; `Signal<readonly string[]>['value']` is `readonly string[]` (probe-verified); `ComponentChild` resolves from `preact`; and `indexOpenApiOperations(document: unknown)` makes the `unknown` declare exactly faithful. The `{ stop(): Promise<void> }` handles are consumer-owned locals — nothing to falsify — and the clean compile proves `createRuntimeHost` accepts them.

**mcp repair changes nothing but delimiters + one declare.** Whole-file diff after normalizing the two 4-backtick lines: exactly `declare const openApiDocument: unknown;` + blank + one closer added. Swallowed prose, heading, and nested fence are byte-identical and now render as Markdown.

**Gate still bites.** Injected a fresh `TS2322` fence and a syntax-invalid fence into `packages/mcp/README.md`: FAIL, exit 1, naming all three crossed ceilings (`syntax-invalid fences 1 > 0`, `failing readmes 6 > 5`, `type errors 8 > 7`) with the census printed. Reverted cleanly.

**Scope + fmt claim.** Only the 5 READMEs + gate policy + policy test changed; no `packages/`/`plugins/` source. Real-file `deno fmt --check` under the repo's pinned settings: `ai`, `mcp`, `service` are already fmt-UNCLEAN on origin/main (claim holds where it matters); fmt flags only pre-existing lines in all three — the PR's added lines are fmt-clean in all 5 files.

**Three minor findings, none verdict-changing:**

1. **The deferral rationale is overstated for one pair.** I prototyped the repair: a ~10-line faithful `@app/router.ts` support stub using the real `createRouteReference` API — the same fabrication pattern `materializeSharedSupports` already uses for `@app/lib/orders.ts` etc. — eliminates both the fresh `TS2307` **and** the downstream `TS18046` (errors 7→5, failingReadmes 5→4), with `ctx.path.id` correctly inferred. So "repairing those would mean documenting something other than what a reader actually writes" is not strictly true — the README text wouldn't change at all; only the gate's fixture environment would. The deferral is honest and disclosed (the fence carries a reader-facing comment), and the stub carries real drift risk against the actual generator, but "unrepairable" should have read "deferred with a disclosed tradeoff." The other 5 TS2307s (`./router.ts`, `./contracts/orders.ts`, `./schema/.generated/client.server.ts`, `./auth/sdk-client.ts`, `@example/contracts`) are genuinely not honestly repairable in place.
2. **The policy comment's enumeration is incomplete**: it names 4 files + the `@app/*` alias (5 of the 6 TS2307s) and omits `@example/contracts` in `packages/service`. The class statement ("imports of consumer-owned or installer-emitted files") covers it, but the named list doesn't.
3. **The fmt-unclean claim is accurate for 3 of the 5 edited files**; `fresh-ui` and `fresh` are fmt-clean on main — and also clean at HEAD, so no churn was excluded there anyway.

[PHASE: IMPL-EVAL] [VERDICT: PASS]
=== RESULT ===
All arithmetic checks out: base mcp had 1 counting block (the 4-backtick mega-fence, swallowed the nested one), syntax-invalid → 0 checked contribution; HEAD has 2 blocks, both checked → tsLike +1, checked +2, exactly the "un-masked two blocks" claim.

---

## IMPL-EVAL report — PR #1935

**Every number reproduced, independently.** I wrote my own census (own CommonMark fence parser, own import-map construction from raw `deno.json` configs, own `deno check` materialization + diagnostic attribution, reusing only the harness's support fixtures) and ran it alongside the gate at both commits:

| | gate @base | mine @base | gate @HEAD | mine @HEAD |
|---|---|---|---|---|
| readmes / fences | 36 / 167 | 36 / 167 | 36 / 168 | 36 / 168 |
| tsLike / exempt | 72 / 0 | 72 / 0 | 73 / 0 | 73 / 0 |
| checked / syntaxInvalid | 71 / 1 | 71 / 1 | 73 / 0 | 73 / 0 |
| typeErrors / failingReadmes | 32 / 7 | 32 / 7 | 7 / 5 | 7 / 5 |

No number failed to reproduce. The base error listing confirms the repair narrative: the 25 repaired errors are precisely `pool`×4+`status`×4 (ai), `Session`/`columns`/`rows`/`selectedIds`/`setSelectedIds` (fresh-ui), `loadOrder`/`desktopWindow`/`ordersRouter`/`routeEvents`×2/`OrderSummary` (fresh), `OrdersContractV1`/`router`/`service`/`workers`/`queue`/`database` (service).

**Ratchet is genuinely tighter.** Floors: 36→36, 72→73, 71→73. Ceilings: 1→0, 7→5, 32→7. No bound loosened; every bound sits exactly at the measured census. Policy unit tests pass 6/6 with consistently updated expectations.

**No `declare const` lies.** `deno doc` confirms every declared symbol is the real exported type from the imported subpath: `McpTransportPool` (class; `server(id)`/`snapshot`/`connect`/`reconnect` all match usage), `DataGridColumn<T>`/`DataGridRow<T>`, `DesktopBindableWindow`/`DesktopRpcRouter`, `ServiceRouter`, `ContractPolicyContract`; `Signal<readonly string[]>['value']` is `readonly string[]` (probe-verified); `ComponentChild` resolves from `preact`; and `indexOpenApiOperations(document: unknown)` makes the `unknown` declare exactly faithful. The `{ stop(): Promise<void> }` handles are consumer-owned locals — nothing to falsify — and the clean compile proves `createRuntimeHost` accepts them.

**mcp repair changes nothing but delimiters + one declare.** Whole-file diff after normalizing the two 4-backtick lines: exactly `declare const openApiDocument: unknown;` + blank + one closer added. Swallowed prose, heading, and nested fence are byte-identical and now render as Markdown.

**Gate still bites.** Injected a fresh `TS2322` fence and a syntax-invalid fence into `packages/mcp/README.md`: FAIL, exit 1, naming all three crossed ceilings (`syntax-invalid fences 1 > 0`, `failing readmes 6 > 5`, `type errors 8 > 7`) with the census printed. Reverted cleanly.

**Scope + fmt claim.** Only the 5 READMEs + gate policy + policy test changed; no `packages/`/`plugins/` source. Real-file `deno fmt --check` under the repo's pinned settings: `ai`, `mcp`, `service` are already fmt-UNCLEAN on origin/main (claim holds where it matters); fmt flags only pre-existing lines in all three — the PR's added lines are fmt-clean in all 5 files.

**Three minor findings, none verdict-changing:**

1. **The deferral rationale is overstated for one pair.** I prototyped the repair: a ~10-line faithful `@app/router.ts` support stub using the real `createRouteReference` API — the same fabrication pattern `materializeSharedSupports` already uses for `@app/lib/orders.ts` etc. — eliminates both the fresh `TS2307` **and** the downstream `TS18046` (errors 7→5, failingReadmes 5→4), with `ctx.path.id` correctly inferred. So "repairing those would mean documenting something other than what a reader actually writes" is not strictly true — the README text wouldn't change at all; only the gate's fixture environment would. The deferral is honest and disclosed (the fence carries a reader-facing comment), and the stub carries real drift risk against the actual generator, but "unrepairable" should have read "deferred with a disclosed tradeoff." The other 5 TS2307s (`./router.ts`, `./contracts/orders.ts`, `./schema/.generated/client.server.ts`, `./auth/sdk-client.ts`, `@example/contracts`) are genuinely not honestly repairable in place.
2. **The policy comment's enumeration is incomplete**: it names 4 files + the `@app/*` alias (5 of the 6 TS2307s) and omits `@example/contracts` in `packages/service`. The class statement ("imports of consumer-owned or installer-emitted files") covers it, but the named list doesn't.
3. **The fmt-unclean claim is accurate for 3 of the 5 edited files**; `fresh-ui` and `fresh` are fmt-clean on main — and also clean at HEAD, so no churn was excluded there anyway.

[PHASE: IMPL-EVAL] [VERDICT: PASS]
