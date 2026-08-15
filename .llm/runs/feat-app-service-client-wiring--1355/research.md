# Research — feat-app-service-client-wiring--1355

## Re-baseline

- Carried-in source: issues #1355 and #1360, whose citations were verified at `fac9e339042c`.
- Re-derived against `origin/main` and local `HEAD` at `3fc0f2f9221a8246f0d26a26189bafb2647be08a` on
  2026-08-15.
- Identity proof: the worktree was clean, `HEAD == origin/main ==` the required baseline, the
  current branch was `feat/app-service-client-wiring`, the checkout was shallow, and the remote
  feature branch did not exist.
- What changed versus the issue citations:
  - PR #1424 (`2e7c845ad`) derived the six `exampleService*` exports from `serviceName`.
  - PR #1427 (`abaf2b009`) moved the client template from
    `packages/cli/src/kernel/assets/app/lib/example-service.ts.template` to
    `packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/service-query.ts.template`
    and moved the canonical islands/loaders under `routes/examples/(_islands)` and
    `routes/examples/(_shared)`.
  - The literal `service` resource, the dead invalidation, the missing all-service generator, and
    both `initialDataUpdatedAt` omissions remain at the new paths.

## Finding 1 — the generated query and invalidation keys disagree

At the current base, `createQueryFactory(resource, ...)` uses `resource` for server-wide
invalidation (`packages/sdk/src/query/query-factory.ts:41-58`), server action keys (`:76-78`),
TanStack query keys (`:145-158`), mutation keys (`:161-170`), and client prefixes (`:179-183`).
`createQueryFactories()` takes the object property name as that resource (`:197-224`).
`createActionQueryKey()` spells the server key as `[resource, action, JSON.stringify(input)]`
(`packages/sdk/src/ports/query-key.ts:23-40`).

The current CLI template still creates the group under the literal property `service` and selects
`.service`
(`packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/service-query.ts.template:22-27`),
while its invalidation uses the camel-cased router name and the string action `list` (`:8-14`). For
an `orders` service and `{ limit: 3, offset: 0 }`, the two concrete client-side arrays are
therefore:

```ts
// Produced by ordersQueries.list.queryOptions(input)
['service', 'list', { input: { limit: 3, offset: 0 } }] // Addressed by bridgeInvalidation(ordersRouterName, 'list')
  ['orders', 'list'];
```

TanStack's prefix match cannot match those arrays. The corresponding server action key is
`['service', 'list', '{"limit":3,"offset":0}']`, and factory/action invalidation prefixes are
`['service']` and `['service', 'list']`. Consequently, two generated factories share both cache
tiers.

`bridgeInvalidation()` itself returns exactly `[resource, action]` or `[resource]`
(`packages/sdk/src/query-client/key-bridge.ts:19-36`), so the helper is internally consistent; the
template supplies an identity different from the factory's. One additional citation drift exists:
`key-bridge.ts:4-7` still describes server keys as beginning with `cache_query`, while the live
`createActionQueryKey()` has no such segment.

## Finding 2 — the resource collision is a template defect and a generator-invariant gap

The immediate collision is a template-literal defect: `service-query.ts.template:22-27` hardcodes
the factory-map key `service`. It is also a generator defect in the contract sense. The
`ServiceClientScaffolder` passes `serviceName` to the template but blindly writes the rendered
content (`packages/cli/src/kernel/adapters/service/client-scaffolder.ts:31-50`), and its sole test
asserts derived export names but never asserts resource identity or a two-service non-collision
(`client-scaffolder_test.ts:8-30`).

The canonical resource identity should be the configured service's router identity: derive it from
the `NetScript.Services` manifest key
(`packages/cli/src/kernel/adapters/service/workspace-mutator.ts:75-97`), using the same camel-case
transform already used by the generated router
(`packages/cli/src/kernel/assets/service/router.ts.template:21-22`) and by `<service>RouterName`
(`service-query.ts.template:8-10`). Thus `orders` remains `orders` and `order-service` becomes
`orderService`; that one identity must feed the client router, query factory, server keys, client
keys, and invalidation prefixes.

The existing service resolver already supplies deterministically sorted manifest names
(`packages/cli/src/kernel/adapters/service/workspace-resolver.ts:19-36`), so the generator should
enumerate that source rather than rediscover services from filesystem layout.

## Finding 3 — no generated export is still name-fixed, but the generator verb is incomplete

At `fac9e339042c`, all six exports were fixed:

| Old fixed symbol                 | Required/current derivation at the base |
| -------------------------------- | --------------------------------------- |
| `exampleServiceName`             | `<camelService>Name`                    |
| `exampleServiceRouterName`       | `<camelService>RouterName`              |
| `exampleServiceContract`         | `<camelService>Contract`                |
| `exampleServiceListInvalidation` | `<camelService>ListInvalidation`        |
| `exampleServiceClient`           | `<camelService>Client`                  |
| `exampleServiceQueries`          | `<camelService>Queries`                 |

The live template implements those derivations at `service-query.ts.template:8-27`, and its test
rejects the substring `exampleService` (`client-scaffolder_test.ts:22-29`). Therefore **zero**
generated exports are currently name-fixed. The implementation must preserve and extend that
regression with a two-service fixture rather than re-implement an already-landed fix.

The verb gap did only partly drift. `service add --with-client` exists
(`packages/cli/src/public/features/services/add/add-service-command.ts:24-58`) and invokes the
single-service scaffolder (`add-service.ts:69-79`), so newly adding a second service can create a
second module. A command named `service generate` also exists, but it only regenerates Aspire
helpers and has no `--dry-run` or `--force`
(`packages/cli/src/public/features/services/generate/generate-service-command.ts:21-41`). There is
still no documented, idempotent verb that regenerates client/query modules for every configured
service. The two verbs do not yet share one client generator.

The closest established content policy is `generate runtime-schemas`: changed/missing files count as
written, identical files count as skipped, dry-run reports planned writes without mutation, and
force rewrites identical output
(`packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas.ts:99-134` and
`generate-runtime-schemas-command.ts:37-65`).

## Finding 4 — `initialDataUpdatedAt` preserves age; both canonical islands discard it

`IslandQueryOptions.initialDataUpdatedAt` is the timestamp when the server loaded `initialData`
(`packages/fresh/src/application/query/query-types.ts:127-140`). Both query hooks call
`useInitialQueryData()` (`packages/fresh/src/application/query/hooks.ts:41-54`), which seeds the
shared TanStack client exactly once and passes `{ updatedAt: initialDataUpdatedAt }` to
`setQueryData()` when supplied (`hooks.ts:125-143`). When omitted, TanStack timestamps the seed at
hydration time.

The package-level contract already has direct coverage: the Fresh initial-data test preserves the
exact server timestamp and observes an old seed as both fetching and refetching
(`packages/fresh/src/application/query/initial-data.test.tsx:7-40`), and the query-options test
checks option forwarding (`query-options.test.ts:57-70`).

Both generated loaders calculate and return `cachedAt` next to their server fetch
(`packages/cli/src/kernel/assets/app/routes/examples/(_shared)/service-showcase.ts.template:79-96`
and `service-showcase.memory.ts.template:76-97`). Both canonical islands pass `initialData` and a
15-second `staleTime` but omit `initialDataUpdatedAt` (`ServiceShowcaseLab.tsx.template:45-59` and
`ServiceShowcaseLab.memory.tsx.template:49-62`), then use `cachedAt` only in a visible stat
(`ServiceShowcaseLab.tsx.template:140-149` and memory `:111-120`).

Once the islands pass `initialDataUpdatedAt: props.cachedAt`, the observable change is:

- a server snapshot older than 15 seconds is stale at hydration and refetches immediately;
- a younger snapshot stays fresh for the remainder of its real 15-second lifetime; and
- the cache state's `dataUpdatedAt` equals `props.cachedAt`, rather than the browser hydration time.

The first paint still displays the server data. The change is cache age and refetch state/timing,
not a new display label.

## Finding 5 — backward compatibility

- Apps that do not regenerate are not edited. Their generated source continues to compile and run
  exactly as before, including the existing cross-service collision, dead invalidation, and
  hydration-age defect.
- The all-service generator owns exactly `apps/<app>/lib/<service>.ts` for every manifest service.
  `service add --with-client` creates that one service's owned module; `service generate` reconciles
  every owned module. Differing client modules are rewritten without `--force`; identical output is
  skipped; `--force` rewrites identical output.
- The init-owned showcase module at `apps/<app>/routes/examples/service/(_lib)/service-query.ts` is
  rendered from the same canonical template but is not generator-owned. `service generate` does not
  rewrite that module in an existing app, so existing showcases retain their prior source until the
  app is re-initialized or the owner migrates it.
- `service generate --dry-run` and `--force` govern the entire composite command, not only the
  client half. Dry-run plans client modules and Aspire helpers without any writes; default writes
  changed/missing and skips identical output across both halves; force rewrites identical client and
  Aspire output.
- Regeneration is an intentional generated-source migration. Projects generated before PR #1424 may
  need six imports changed: `exampleServiceName`, `exampleServiceRouterName`,
  `exampleServiceContract`, `exampleServiceListInvalidation`, `exampleServiceClient`, and
  `exampleServiceQueries` become their corresponding `<camelService>*` symbols. That naming delta is
  already on current `main`, not newly introduced by this leaf. Projects generated after #1424
  retain their names.
- The resource change intentionally abandons any process-local or persisted browser entries under
  the old literal `service` namespace. They become orphaned and are repopulated under the correct
  per-router key; no service/HTTP payload contract changes.
- Passing `initialDataUpdatedAt` may cause an old server snapshot to refetch earlier. This is the
  documented behavior the option exists to preserve, not a TypeScript breaking change.
- No SDK overload is added. The generated invalidation constant directly uses the already-published
  `<service>Queries.list.clientKey()` API, so a 0.0.7 CLI can add/regenerate an owned module in an
  app still pinned to `jsr:@netscript/sdk@0.0.6` without creating a new SDK-version compile failure.

## Proposed public-contract delta across the three publishable packages

| Package            | Ruled delta                                                                                                                                                                                                                                                                                                                                                                        | Compatibility posture                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `@netscript/sdk`   | No type/export change. Correct `key-bridge.ts`'s stale server-key example, point factory consumers to `factory.<action>.clientKey()`, and add semantic resource match/mismatch tests for the retained string helper.                                                                                                                                                               | Existing public API remains unchanged; doc-lint and publish dry-run still apply because the published module changes.                   |
| `@netscript/cli`   | Emit `{ queryKey: <svc>Queries.list.clientKey() } as const` after `<svc>Queries`; own only `apps/<app>/lib/<service>.ts`; introduce the all-service content-comparing generator and whole-command dry-run/force behavior; pass `cachedAt`; document the verb, L1/L2 dialect, overwrite/result contract, six-symbol migration, and namespace migration in `packages/cli/README.md`. | Direct emit compiles against SDK 0.0.6; consumer source changes only when added/regenerated, and regeneration is explicitly documented. |
| `@netscript/fresh` | No new query API: keep the existing `IslandQueryOptions` contract, add real-browser coverage through the public `useQuery` wrapper, include it in `test:browser`, and document hydration-age behavior in `packages/fresh/README.md`.                                                                                                                                               | No type break; makes the existing contract exercised and discoverable.                                                                  |

PLAN-EVAL cycle 1 ruled out the SDK overload under A6: `{ queryKey }` would be an identity wrapper
adding no policy, would leave the string-form trap public, and would unnecessarily couple generated
output to SDK 0.0.7. Rename safety is already supplied by `.list.clientKey()` property access. If a
named helper is wanted later, it requires a separate issue and a deprecation path for the string
form; this leaf does not add it.

## JSR audit surface scan

`jsrAudit.applicable` is **true** for all three touched members.

| Member             | Publish surface and pin baseline                                                                                                                                     | Risk / implementation bar                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@netscript/cli`   | Three exports; templates are included; six internal pins are exact `@0.0.6` (`packages/cli/deno.json:6-29,57-75`).                                                   | The member opts out of workspace `isolatedDeclarations` (`:46-55`), so new exported generator result/request types need explicit annotations plus the JSR/no-slow-type publish dry-run. |
| `@netscript/fresh` | Sixteen exports including `./query`; four package names across five exact internal `@0.0.6` specifiers; README is published (`packages/fresh/deno.json:6-22,47-74`). | Audit the query subpath and changed README/file list; root isolated declarations remain in force.                                                                                       |
| `@netscript/sdk`   | Twelve exports including `./query` and `./query-client`; the one internal pin is exact `@0.0.6` (`packages/sdk/deno.json:6-18,27-51`).                               | No type/export delta; audit the changed published JSDoc/tested semantics with full export-map doc-lint and publish dry-run.                                                             |

No dependency or version change is planned. Implementation must run the repo JSR audit and full
export-map `deno doc --lint` for each member, re-audit exact `@netscript/*` pins, inspect each
publish file list, and run per-member `deno publish --dry-run --allow-dirty` as the isolated-
declaration/no-slow-type publish bar. The root `publish-dry-run` receipt remains the single binding
contract receipt; per-member reports are supplemental evidence.

## Doctrine and frontend-overlay findings

- Effective target profile: SDK Archetype 2 (integration) with the frontend overlay; CLI and Fresh
  retain their measured Archetype 6 and Archetype 4 package shapes. Current doctrine verdicts are
  Keep for CLI, Fresh, and SDK
  (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:25-54`).
- A1 applies because the cache identity and generator result types precede implementation; A2 favors
  one derived identity; A6 rejects an identity-wrapper overload because `clientKey()` already owns
  the discoverable typed path; A8 keeps generation planning/writing separated; A14 makes semantic,
  browser, JSR, and publish gates part of the architecture.
- Avoid AP-9 (parallel generators), AP-12 (new unowned clock reads), AP-18 (giant generated-string
  snapshots), AP-23 (generation logic inline in Cliffy composition), and AP-25 (filesystem writes
  outside an edge).
- The frontend overlay requires contract, route, browser, and state validation
  (`.llm/harness/archetypes/SCOPE-frontend.md:20-35`). Its additional-read link
  `.claude/05-frontend.md` does not exist at this baseline; this is recorded as reference drift and
  does not authorize a docs edit.
- No existing architecture-debt entry owns this key/hydration seam; no debt update is proposed.

## Proposed determinations

### PLAN-EVAL — propose **required**

`lane-policy.md:61-69` makes this conditional. This leaf is genuinely decision-heavy: cache resource
identity is a public cross-tier contract; one generator must reconcile two command paths, owned
output paths, whole-command flags, negative atomicity, and already-generated source compatibility;
and the proof spans three publishable members plus two leased runtime gates. PLAN-EVAL cycle 1 ruled
direct emission and package README locations while returning `FAIL_PLAN` for six plan-text gaps.
Implementation remains stopped until a separately dispatched cycle returns PASS.

### Expensive gates — propose **required after cheap convergence and explicit lease**

Neither `scaffold.runtime` nor `fresh-browser` was run in Phase 1. Run them only after
implementation is complete, every cheaper gate is green at the committed candidate head, the
coordinator explicitly releases the leaf, and the singleton expensive-gate lease is recorded.

- `scaffold.runtime` must run once in the evaluator/merge-readiness pass. It alone proves the public
  CLI creates/regenerates a real two-service project, the emitted modules type-check in their
  consumer workspace, the generated keys stay isolated through both cache tiers, the invalidation
  workflow mutates observable cache state, and the whole Deno/Aspire/runtime path cleans up. It is a
  release/merge-readiness gate, so its evidence is the suite-owned exact-head output, raw exit code
  and failing suite names, plus the central lease/cleanup record—not a run-gate receipt.
- `fresh-browser` must then exercise the new hydration-age browser regression: old server data
  refetches at hydration, fresh server data does not, and the visible initial snapshot remains
  correct. Static Fresh tests cannot prove mount/hydration timing in a browser.
- Before the lease, targeted checks/tests establish key arrays, type-level rename failure,
  two-service collision rejection, generator idempotency/dry-run/force/no-contract atomicity,
  emitted source shape, `initialDataUpdatedAt` presence in both variants, JSR/public docs, package
  publishability, formatting/lint, and architecture. They do not prove a generated app boots or a
  browser hydrates.

## PLAN-EVAL cycle-1 rulings

1. Emit `{ queryKey: <svc>Queries.list.clientKey() } as const` directly after `<svc>Queries`; add no
   SDK overload.
2. Put the documented generator contract/migration in `packages/cli/README.md` and the hydration-age
   note in `packages/fresh/README.md`; do not edit `docs/**`.
3. Generator-owned modules are exactly `apps/<app>/lib/<service>.ts`; the init-owned route showcase
   stays separate while sharing the canonical template.
4. Whole-command `--dry-run`/`--force` semantics cover both client and Aspire-helper output.
