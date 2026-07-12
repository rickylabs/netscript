# IMPL-EVAL — quality-q752-fresh--codex

- Impl evaluator session: Claude Opus 4.8 (opposite-family to the Codex generator), separate session — 2026-07-12
- Run: `quality-q752-fresh--codex`
- Surface / archetype: `@netscript/fresh` — Archetype 4 (Public DSL / Builder) + `frontend` overlay
- Evaluated commit: HEAD `86ffd51a` against base `3b3d615b`
- Working tree: clean; branch `quality/q752-fresh-h` (no upstream, never pushed)

## Verdict

`PASS`

The owner contract is met: 24 of 25 baseline unsafe casts are genuinely typed away, the sole survivor
carries a concrete member-level justification, no suppression strategy was introduced, and every
verification gate reproduced the recorded evidence. One non-blocking finding (doc-lint regression) is
accepted under this slice's explicit “doc-lint recorded” wording but must be tracked as a follow-up.

## Contract scorecard (independently reproduced)

| Owner-contract item | Result | Evidence |
| ------------------- | ------ | -------- |
| Scanner 0 findings | PASS | `scan-code-quality.ts --root packages/fresh --max-allow 6` → `{"ok":true,"findings":[],"allowCount":1}` |
| ≤ 6 allowances | PASS | allowCount `1` |
| Drive allowance count down | PASS | rejected pass `25` → this pass `1`; base itself had `0` allowances / 25 findings |
| No suppression strategy | PASS | 1 documented `quality-allow` (member-level reason); **no new** `deno-lint-ignore` (3 pre-existing `ban-types`/`prefer-const` unchanged from base); `as unknown as` non-test src **25→1**; `as never` non-test src **15→8** |
| Properly type findings | PASS | Zod `instanceof` + `.unwrap()` guards; StreamDB `state is StateSchema<…>` structural guard; TanStack upstream-generic binding; route public/impl type unification (see technical review) |
| No `deno.lock` change | PASS | `sha256sum deno.lock` = `da85900f…1ec1f5` (unchanged); 0 lines in `git diff …-- deno.lock` |
| Scoped check | PASS | `run-deno-check.ts --root packages/fresh --ext ts,tsx` → 164 files, 0 diagnostics |
| Scoped lint | PASS | `run-deno-lint.ts …` → 164 files, 0, no new ignore |
| Scoped fmt | PASS | `run-deno-fmt.ts …` → 164 files, 0 |
| Package tests | PASS | `deno task test` → **197 passed, 0 failed** |
| Publish dry-run | PASS | `deno publish --dry-run --allow-dirty` → `Success`, no slow-type error, all 14 exports |
| Doc-lint recorded | RECORDED | `deno task doc:lint --root packages/fresh` → 25 diagnostics (8 private-type-ref + 17 missing-JSDoc), all in `route/_internal/contract-types.ts` via the `route` entrypoint; base was **0** (reproduced on a `3b3d615b` worktree) |
| No PR / GitHub mutation | PASS | branch has no upstream and no `origin/quality/q752-fresh-h` ref (never pushed); `drift.md` logs the owner “Do NOT open PRs” omission |

## Technical review of the five flagged boundaries

1. **Sole `quality-allow` — `route-support.ts:96`** — CONFIRMED legitimate. `promoteRouteContractConfig`
   assigns `boundRoute` to `RuntimePageConfig<TRouteTypes, true>['route']`. `DefinePageWithRouteContract`
   preserves prior path/search output when an optional schema is omitted, whereas `BoundRouteContract`
   maps omission to `EmptyRecord`; the two conditional-type families cannot be equated without
   presence-specific legacy-builder overloads. Sibling assignments on the same function (`pathSchema`,
   `searchSchema`, lines 94–95) needed only single `as` casts — only the `route` member required the
   double cast, which corroborates a narrow, real incompatibility. Reason is concrete and member-level,
   satisfying plan D6 and the PLAN-EVAL watch item (note 4). Count = 1, well under the ceiling.
2. **TanStack generic adapter — `query/hooks.ts`** — CONFIRMED. Base erased overloads via
   `(options as never) as unknown as IslandQueryResult<…>`. Now the wrappers bind upstream generics
   directly (`useTanStackQuery<TData,TError,TSelected,QueryKey>(options)`), model infinite data as
   `IslandInfiniteData<TData,TPageParam>` (`{pages,pageParams}`), adapt the infinite `queryFn` context
   explicitly, and wrap the sync mutationFn as async. No `as unknown as` remains. Residual single
   `as`/`as never` (page-param narrowing, react-db live-query factory, `isFetching`/`isMutating`
   filters) are scanner-permitted narrowings at opaque third-party seams — see Finding 2.
3. **Zod narrowing — `form/schema-adapter/zod-internals.ts`** — CONFIRMED. The base `schema._def as
   unknown as ZodDefWithInner` double casts are gone. Narrowing now uses public class guards
   (`instanceof z.ZodDefault/ZodOptional/ZodPipe/…`), public `.unwrap()`, and an
   `item instanceof z.ZodType` array guard over `_zod.def.items`. Runtime evidence justifies each
   member access (plan D2/D4).
4. **Public route inference — `route/mod.ts`** — CONFIRMED. Every exported function now returns the
   clean exported public type (`RouteReference`, `BoundRouteContract`, `DefineRouteContract`, …) and the
   `_internal` implementations return structurally compatible values with **no** `as unknown as` (base
   had one on each). The façade/implementation type duplication is unified per research finding #4.
5. **StreamDB structural guard — `runtime/streams/create-stream-db.ts`** — CONFIRMED. Base double-cast
   `input.state as unknown as StateSchema<…>` and `… as unknown as NetScriptStreamDB<TDef>` are replaced
   by a real `isDurableStateSchema(state): state is StateSchema<StreamStateDefinition>` predicate
   (per-collection runtime checks) that narrows before `createStreamDB(...)`, whose result is
   structurally assignable to the package-owned `NetScriptStreamDB<TDef>` (collection values typed
   `unknown`). Honest structural adaptation (plan D5), with a `TypeError` guard for the negative case.

## Findings (ordered by severity)

### 1 — Doc-lint 0 → 25 on the `route` entrypoint (medium, non-blocking)

Removing the type-hiding casts unified the public route surface with the implementation types in
`route/_internal/contract-types.ts`; those internal types are not in the export map and carry no JSDoc,
so the `route` entrypoint now reports **8 `private-type-ref` + 17 `missing-jsdoc`** (reproduced;
base = 0). This is a *direct and intended* consequence of the core fix — the only ways to zero it are
(a) export + document the route contract types (a public-surface expansion belonging to the deferred
Archetype-4 subpath-exports restructure), or (b) restore a cast to hide the type, which would reintroduce
the exact scanner finding the slice removes and is prohibited by the owner goal. The implementer correctly
chose neither and logged the deferral in `drift.md`.

- **Why acceptable now:** the owner contract wording is “doc-lint **recorded**,” not “doc-lint clean”;
  the canonical wrapper records-and-exits-0 by design; publish dry-run stays green (private-type-ref does
  not block publish — only slow types do); the diagnostics are confined to one internal file.
- **Required follow-up (do not leave open-ended):** track the “documentation-surface consolidation” as an
  explicit debt/issue against the existing `@netscript/fresh` Restructure verdict
  (`10-codebase-verdict-and-handoff.md`) so the JSR documentation factor is restored — either export +
  JSDoc the route contract types or relocate them off the public reference chain. This is a close-out
  bookkeeping item, not a re-implementation.

### 2 — 8 residual `as never` bridges to opaque upstream generics (low)

`hooks.ts` (react-db live-query factories, `isFetching`/`isMutating` filters), `query-island.tsx`
(`QueryClientProvider client`), `runtime/streams/mod.ts` (live-query factories), and
`define-fresh-app.ts` (Fresh `staticMiddleware`). All are single-cast narrowings the scanner does **not**
flag (it targets `as unknown as`/`as any`/`any`), reduced from 15→8, and sit at genuine third-party
boundaries where the upstream generic is not reconstructable. Not a suppression strategy; noted for future
tightening only.

### 3 — Allowance irreducibility is well-argued but not exhaustively proven (low/informational)

The `route-support.ts:96` justification is plausible and member-level documented in the worklog Decisions
table, meeting D6’s bar. A fully exhaustive proof of irreducibility was not attempted, but with a count of
1 (down from 25) and a concrete conditional-type conflict, this is acceptable.

## Allowance audit

| # | File:line | Reason recorded? | Member-level? | Verdict |
| - | --------- | ---------------- | ------------- | ------- |
| 1 | `route-support.ts:96` (`route` field) | yes | yes — `DefinePageWithRouteContract` (prior output on omission) vs `BoundRouteContract` (`EmptyRecord` on omission) conditional divergence | JUSTIFIED — keep |

Total allowances **1 / 6 ceiling**; target was 0, but the single survivor clears the D6 justification bar.
No blanket `no-explicit-any` ignore, no `as any`, no new `deno-lint-ignore`.

## Drift assessment

The three `drift.md` entries are accurate and appropriately severity-rated:
- *No-PR local evidence trail* (minor) — verified: branch unpushed, no remote ref, no GitHub mutation.
- *Archetype corrected during research* (minor) — no source preceded the correction; consistent with plan.
- *Structured doc-lint diagnostics recorded* (minor) — verified count (8 + 17 = 25) and that publish/slow
  types stay green. The only gap is that the deferral is stated but not yet filed as trackable debt — see
  Finding 1’s required follow-up. This does not rise to `FAIL_DEBT`: it is a close-out bookkeeping action
  on an already-owned Restructure verdict, and no *new* doctrine violation is introduced (the internal
  types already existed; they were previously masked by an unsound cast).

## Commands / evidence

```
scan-code-quality.ts --root packages/fresh --max-allow 6   → ok:true, findings:[], allowCount:1
run-deno-check.ts --root packages/fresh --ext ts,tsx        → 164 files, 0 diagnostics
run-deno-lint.ts  --root packages/fresh --ext ts,tsx        → 164 files, 0, no new ignore
run-deno-fmt.ts   --root packages/fresh --ext ts,tsx        → 164 files, 0
deno task test (packages/fresh)                            → 197 passed, 0 failed
deno publish --dry-run --allow-dirty (packages/fresh)      → Success, no slow types, 14 exports
deno task doc:lint --root packages/fresh                    → 25 diagnostics (8 private-type-ref + 17 missing-jsdoc); base 3b3d615b = 0
sha256sum deno.lock                                        → da85900f…1ec1f5 (unchanged); 0 lines in lock diff
git grep 'as unknown as' non-test src: base 25 → head 1
git grep 'as never'       non-test src: base 15 → head 8
git @{u} / origin ref                                     → none (branch never pushed; no PR)
```

## Remediation

None required for PASS. One non-blocking close-out action before the run is considered fully landed:
file the deferred route-contract documentation-surface consolidation (Finding 1) as a tracked entry under
the existing `@netscript/fresh` Restructure verdict, so the doc-lint `route`-entrypoint regression has an
owner and closing gate rather than an open-ended defer.
