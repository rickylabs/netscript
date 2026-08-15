# PLAN-EVAL — feat-app-service-client-wiring--1355

- Plan evaluator session: fresh native Claude session, 2026-08-15 (cycle 1 of 2)
- Run: `feat-app-service-client-wiring--1355` · PR #1664 (draft, `Closes #1355`, `Closes #1360`)
- Surface / archetype: `packages/sdk` (Archetype 2, integration) target seam; `packages/cli` (6),
  `packages/fresh` (4) consumers
- Scope overlays: `frontend`

## Attachment identity

| Field              | Value                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Session ID         | `176aace4-b2a2-4b16-bdaa-9db687c7d132`                                                               |
| Bridge session ID  | `cse_01TiYhwUCkdyjziEpFP3kgaS`                                                                       |
| Remote Control URL | `https://claude.ai/code/session_01TiYhwUCkdyjziEpFP3kgaS`                                            |
| PID                | `716145` (`claude bg-spare`, spare-claimed process)                                                  |
| cwd                | `/home/codex/repos/netscript-007-features-1355`                                                      |
| Requested route    | native Claude Fable 5 · medium · Remote Control (`lane-policy.md:45`)                                |
| Observed route     | `jobs/176aace4/state.json` `respawnFlags`: `--model claude-fable-5 --effort medium --remote-control` |
| Match              | yes (read from `respawnFlags`, not argv — argv is `claude bg-spare …` and carries neither flag)      |

## Immutable identity check

- local `HEAD` = `7f20a34fee4e99ac17edb6ed4de06a3ec9c1934b`;
  `git ls-remote origin
  refs/heads/feat/app-service-client-wiring` = same;
  `gh pr view 1664 --json headRefOid` = same; draft = `true`; state `OPEN`; body lines 7–8 carry
  `Closes #1355` / `Closes #1360`.
- `git status --short` empty. No refusal condition.

## Checklist results

| Plan-Gate item                          | Result      | Evidence / location                                                                                                                                                 |
| --------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS        | `research.md:3-19` re-baselined at `3fc0f2f92`; ~15 citations spot-checked below, all hold at this head.                                                            |
| Decisions locked                        | PASS        | `plan.md:86-96` D1–D7 with rationale.                                                                                                                               |
| Open-decision sweep                     | **FAIL**    | `plan.md:98-105` flags two decisions for PLAN-EVAL (ruled below) but misses one that forces rework if deferred — generator-owned output paths (evaluator sweep §A). |
| Commit slices (< 30, gate + files each) | PASS (weak) | `plan.md:179-189`, seven slices, each with gate/stop; files are named by member, not per file — add file lists on amendment (fix 6).                                |
| Risk register                           | PASS        | `plan.md:135-147`.                                                                                                                                                  |
| Gate set selected                       | PASS        | `plan.md:159-170`, `:196-226`; gate-class split verified (below).                                                                                                   |
| Deferred scope explicit                 | PASS        | `plan.md:58-67`; L3 dialect deferral is defensible (see note N3).                                                                                                   |
| jsr-audit surface scan (pkg/plugin)     | PASS        | `research.md:172-186` per member; pins verified exact `@0.0.6` in all three `deno.json`; `packages/cli/deno.json:50` `isolatedDeclarations:false` risk named.       |

## § 1 Ruling on the open fork — **direct emit; no SDK overload**

The generated constant becomes

```ts
export const <svc>ListInvalidation = { queryKey: <svc>Queries.list.clientKey() } as const;
```

(defined _after_ `<svc>Queries`). Reasons, weighed as instructed:

1. **What fixes the dead invalidation.** In both options the fix is the same expression: deriving
   the prefix from `factory.list.clientKey()` (`query-factory.ts:179-183`) so it shares
   `[resource, action]` with `queryOptions().queryKey` (`:145-152`). The proposed overload
   `bridgeInvalidation(queryKey)` would be `{ queryKey }` — an identity wrapper adding no policy.
   Under A6 (helpers justified) that is not a justified public helper; `clientKey()` already _is_
   the SDK's discoverable typed cross-tier path (landed for exactly this in #1265).
2. **Trap for the next caller.** Identical in both options: the string overload
   `bridgeInvalidation(resource, action)` (`key-bridge.ts:32-37`) stays public either way. The
   overload does not remove the trap; it adds a safe sibling next to it. Direct emit costs nothing
   on this axis relative to the overload.
3. **Type-level rename safety.** Identical: `.list` property access on the factory type fails
   `deno check` on rename in both options; the semantic-negative and type-negative tests
   (`plan.md:73-75`) are unchanged.
4. **Cost of widening a published surface** — real and asymmetric. The overload couples the CLI
   template to an SDK ≥ 0.0.7 API: `service add --with-client` run by a 0.0.7 CLI inside a project
   pinned to `jsr:@netscript/sdk@0.0.6` would emit a module that fails `deno check` until the app
   bumps its SDK pin. Direct emit compiles against the already-published SDK, so D6 (`plan.md:95`)
   holds for the "newly generated into an existing app" case too.

**What this costs:** the SDK does not gain a named "safe" entry point; discoverability rests on
`clientKey()`'s JSDoc. To pay that down without a type change, S1 becomes: (a) correct the stale
module doc at `key-bridge.ts:4-7` (still says `['cache_query', …]`; research already flags it) and
add a JSDoc pointer on `bridgeInvalidation` to `factory.<action>.clientKey()` as the
factory-consistent path; (b) add the SDK semantic test the issue asks for — a
`bridgeInvalidation(resource,'list').queryKey` that does not prefix-match a factory whose resource
differs, and one that does when the resource matches (locks the S6 regression). Doc-lint and the SDK
publish dry-run still run (files changed) but no new exported type is audited. Amend `plan.md:102`,
`:111-120`, `:184`, `:319` and `research.md:164,168-170,239-241` accordingly.

**Second flagged decision — migration-note location — ruled:** package READMEs, not `docs/**`.
`packages/fresh/README.md` for the `initialDataUpdatedAt` hydration-age note (Fresh owns the option,
`query-types.ts:135-136`, README is published); **and** `packages/cli/README.md` for the generator
verb, its overwrite/dry-run/force contract, and the regeneration migration (resource-namespace
change, pre-#1424 `exampleService*` rename). The CLI README entry is also what discharges the #1355
acceptance box "A **documented** verb regenerates …" (fix 4). Both are inside the publish file
lists; neither is `docs/**`.

## Evaluator-run open-decision sweep

**A. Which files does the all-service generator own? — must resolve now (unflagged → FAIL).** Two
locations exist today for the same module: `netscript init` writes the showcase's module to
`apps/<app>/routes/examples/service/(_lib)/service-query.ts`
(`write-example-service-app-files.ts:69-72`; islands import `../(_lib)/service-query.ts`,
`ServiceShowcaseLab*.tsx.template:13-17`), while `service add --with-client` writes
`apps/<app>/lib/<service>.ts` (`client-scaffolder.ts:8-21,31`; test asserts
`/app/apps/dashboard/lib/orders.ts`). `plan.md` never states which path(s) the generator plans and
writes. Everything downstream depends on it: "byte-identical second `generate`" (`plan.md:249`),
"regenerating upgrades existing modules" (`research.md:144-145`), the two-service consumer import
(`plan.md:250-251`), and whether scenario 3's live invalidation proof (`plan.md:282-288`) exercises
generator output or init output. Recommended lock: the generator owns exactly
`apps/<app>/lib/<service>.ts` for every manifest service (issue #1355 target §1); the init-emitted
`(_lib)/service-query.ts` stays init-owned route-example source rendered from the **same** template
(so scenario 3 still proves the corrected invalidation, and the plan must say so explicitly), and
Finding 5 is amended to say regeneration does not rewrite a pre-existing app's showcase module. If
the author instead wants the generator to also rewrite `(_lib)/service-query.ts` for the showcase
service, that is acceptable but must be stated with its own scenario line and a #1354 boundary note.

**B. Behaviour of the _existing_ `service generate` verb — must be stated (compat, fix 2).** Today
`service generate` only regenerates Aspire helpers (`generate-service-command.ts:21-41`). Under D4
(`plan.md:93`) — modelled on `generate-runtime-schemas.ts:115-129`, which overwrites any file whose
content differs — running `service generate` for Aspire in an existing app will now also rewrite
hand-edited `lib/<service>.ts` modules without `--force`. That is a change for
generated-but-not-explicitly-regenerated apps and D6's rationale ("packages do not mutate consumer
source") is only true because the user ran the verb. Acceptable, but the plan must say it in
Compatibility/D6, and must say whether `--dry-run`/`--force` apply to the Aspire-helper half of the
command (Aspire regen is not content-comparing today).

C. Nothing else found that forces rework: L3 dialect (deferred, note N3), plugin contributions
(#1348-gated), both safe to defer as recorded.

## § 2 Diagnoses re-derived from source at `7f20a34fe`

- Key-shape mismatch — **holds.** `queryOptions().queryKey = [resource, action, { input }]`
  (`query-factory.ts:145-152`), `clientKey()` `= [resource, action(, {input})]` (`:179-183`), server
  key `[resource, action, JSON.stringify(input)]` (`ports/query-key.ts:36-40`), `bridgeInvalidation`
  `= { queryKey: [resource, action] | [resource] }` (`key-bridge.ts:19-37`). Template: factory group
  literal `service` (`service-query.ts.template:22-27`) vs invalidation
  `bridgeInvalidation(<svc>RouterName, 'list')` (`:11-14`) → `['orders','list']` cannot prefix-match
  `['service','list',…]`. Consumed at `ServiceShowcaseLab.tsx.template:105-106` and memory
  `:92-93,:135`.
- `'service'` collision — **holds.** `createQueryFactories` passes the object key as `resource`
  (`query-factory.ts:214-220`); every generated factory is `.service` → shared server prefix
  `['service']`, `['service','list']` and shared TanStack keys.
- #1360 — **holds.** Both islands pass `initialData`/`staleTime: 15_000` and omit
  `initialDataUpdatedAt` (`ServiceShowcaseLab.tsx.template:53-59`, memory `:58-62`); `cachedAt` is
  computed in the loader (`service-showcase.ts.template:83,93`) and used only in a stat (`:148`,
  memory `:119`). `IslandQueryOptions.initialDataUpdatedAt` = "Timestamp when the server loaded
  `initialData`, used to preserve its cache age" (`query-types.ts:135-136`); consumed by
  `useInitialQueryData` → `setQueryData(key, data, { updatedAt })` (`hooks.ts:125-143`).
  Load-bearing detail the plan should state: the islands' `useQuery` is imported from
  `@netscript/fresh/query`, and that export **is** the Fresh `useIslandQuery` wrapper
  (`hooks.ts:212-216`, `mod.ts:62-76`), not raw TanStack — so the `fresh-browser` scenario proves
  the same code path the generated island runs. Keep the browser fixture on that public `useQuery`.
- Citation drift — **honest.** Re-verified: `key-bridge.ts:4-7` `cache_query` stale (true);
  `client-scaffolder.ts:31-50`, `client-scaffolder_test.ts:8-30`, `add-service.ts:69-79`,
  `router.ts.template:21-22`, `workspace-resolver.ts:19-36`, `generate-service-command.ts:21-41`,
  `generate-runtime-schemas.ts:99-134`, `hooks.ts:41-54,125-143`, `initial-data.test.tsx:7-40`,
  `SCOPE-frontend.md:15` (`.claude/05-frontend.md` absent) all hold. `workspace-mutator.ts:75-97` is
  ambiguous (three files of that name); the intended one is
  `kernel/adapters/service/workspace-mutator.ts` — qualify the path on amendment (fix 6).

## § 3 Three-member public-surface scope

- SDK: under this ruling the type surface is unchanged; obligation collapses to doc-lint + publish
  dry-run on the touched module. Precise enough.
- CLI: request/result contract described (`plan.md:124-129`) but the _result_ shape and the
  overwrite/atomicity contract are not written as public behaviour of the verb — the CLI README (fix
  4) plus a named exported result type (explicit annotations, `isolatedDeclarations:false` risk at
  `packages/cli/deno.json:50`) closes it. Output paths (sweep A) are the missing half.
- Fresh: no new type; README note ruled above. Per-member JSR obligations are enumerated per member
  (`plan.md:206`, `research.md:176-181`), not in aggregate — adequate.

## § 4 Compatibility

- D6 holds for untouched apps (nothing edits consumer source on package upgrade). It is _not_ fully
  honest about existing apps that run the existing `service generate` verb (sweep B). Under the
  direct-emit ruling, `service add` into 0.0.6-pinned apps stays compilable; under the overload it
  would not have.
- Pre-#1424 migration (`research.md:147-150`) is stated but not actionable: it names the rename but
  not the exact import list — the CLI README migration entry (fix 4) must list the six
  `exampleService*` → `<svc>*` symbols and the resource-namespace/orphaned-cache consequence.

## § 5 Pre-lease scenario assertions

- Two-service sequence, byte-identical second run, cross-module type-check (`plan.md:240-252`) —
  falsifiable once output paths are locked (sweep A); "type-checks both modules without aliases" is
  checkable by a `deno check` of a consumer importing both.
- Key pairs "differ only at index 0" with shared input (`:253-281`) — concrete arrays, checkable by
  deep-equality plus a `partialMatchKey` assertion; a `users` filter vs `payments` key negative is
  named. Sufficient.
- Invalidation proof (`:282-288`) — a second `users.list` network request after `onSettled` plus DOM
  equal to the server-persisted `renamedName`, with `invalidateQueries` spying explicitly rejected.
  This can fail (no second request if the prefix does not match; DOM stays optimistic value if
  refetch never lands) and is sufficient for "actually invalidates". One tightening: assert the
  second request occurs _after_ the mutation response, not merely "a second request", so a
  hydration-age refetch (post-#1360, snapshot > 15 s old) is not mistaken for invalidation — e.g.
  count list requests before click and require count+1 after settle.
- Hydration comparison (`:290-303`) — controlled `hydrationNow`, `−60_000` vs `hydrationNow`,
  qf-count `1` vs `0`, `dataUpdatedAt` equality: falsifiable and specific.
- The plan does **not** claim the existing suite proves any of this: `plan.md:233-236` lists the
  scenarios as lease preconditions; `packages/cli/e2e/suites/scaffold/` has no `service add`, and
  `packages/fresh/deno.json:26` `test:browser` runs only `form-navigation_browser.ts`. Correctly
  framed as extension work.

## § 6 Slices and evidence set

- Seven bounded slices each ending at a Tier-A stop; expensive work isolated to S5 after S4
  convergence (`plan.md:181-189`).
- Gate-class repair complete and consistent: `plan.md:79-84,196-201,211,214-226`; `catalog.ts`
  contains no `scaffold.runtime` entry (grep), `fresh-browser` at `catalog.ts:55`;
  `release-gates.md:22` owns `scaffold.runtime`; `run-gate.ts` accepts `--cwd`/`--git-head`
  (`:60,:72`). Five-file receipt set is honest scoping: the sixth gate is proven by suite-owned
  exact-head output + lease/cleanup record, not left unproven.

## Verdict

`FAIL_PLAN`

### Required fixes (all plan-text; no code)

1. **Record the fork ruling** — direct emit `{ queryKey: <svc>Queries.list.clientKey() }`; no
   `bridgeInvalidation` overload. Rewrite `plan.md` Open-Decision row `:102`, SDK contract
   `:111-120` (→ JSDoc correction of `key-bridge.ts:4-7` + pointer, semantic match/mismatch tests),
   S1 `:184`, Drift Watch `:319`; align `research.md:164,168-170,239-241`.
2. **Lock generator-owned output paths** (sweep A) and restate scenarios 1/3 and Finding 5 against
   them.
3. **State `service generate` compat** (sweep B): differing client modules are rewritten without
   `--force`; say whether `--dry-run`/`--force` govern the Aspire-helper half; add to D6/Finding 5.
4. **Name where the verb is documented** — `packages/cli/README.md` (verb, result/overwrite
   contract, migration list of the six renamed symbols + namespace change);
   `packages/fresh/README.md` for the hydration-age note. Update Scope `:54`, Open-Decision `:103`,
   S3 `:186`.
5. Tighten scenario 3 to "list-request count + 1 after mutation settles" (§ 5).
6. Housekeeping: per-slice file lists in the slice table; qualify `workspace-mutator.ts` citation.

Items 1–4 are unchecked-box fixes; 5–6 are cheap and should ride the same amendment. No
`FAIL_RESCOPE`: archetype, scope, and gate set are right; the plan is incomplete, not wrong.

## Notes

- N1 Already-decided items complied with: PLAN-EVAL exists; no expensive gate run or lease taken by
  this session; gate class unchanged.
- N2 A6 reading in `plan.md:34` ("overload justified only if it makes a typed contract
  discoverable") is the right test — and `clientKey()` already satisfies it, which is why the
  overload fails it.
- N3 L1/L2 vs L3 dialect: #1355 target §7 asks for it to be "decided and documented once", but it is
  not an acceptance checkbox; deferring is safe for the close-gate. State in the CLI README that the
  generator emits the query-factory (L1/L2) dialect.
- N4 Under the direct-emit ruling nothing in the plan changes the SDK type surface; if the author
  still wants a named SDK helper later, file it separately with a deprecation path for the string
  form — that is the only shape that removes the trap.
