# Research — fix-sdk-root-cache-provider-leak--0.0.7

## Re-baseline

- Carried-in source: issue #1462 and the fixes-lane leaf brief.
- Re-derived against `origin/main` @ `13878a80a50c55b9662099fed64555f2310ae4a3` on 2026-08-30.
- Version drift: the issue reproduces `@netscript/sdk@0.0.5`; the checked-in package is `0.0.6`, and
  the same source chain remains present.
- Branch state: `fix/sdk-root-cache-provider-leak` equals the baseline and has no upstream.

## Doctrine reading

| Concern         | Finding                                                                                                                                                                                                                                                | Authority                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Archetype       | `packages/sdk` is **Archetype 2 — Integration**, not Archetype 4. It integrates service discovery, typed clients, query facilities, and the KV cache adapter.                                                                                          | `docs/architecture/doctrine/06-archetypes.md` assigns `packages/sdk` to Archetype 2; `.llm/harness/archetypes/ARCHETYPE-2-integration.md` |
| Current verdict | **Keep** — “Preserve discovery/client/cache adapter boundaries.” This leaf repairs one crossed boundary; it does not restructure the SDK.                                                                                                              | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`                                                                           |
| Public surface  | The published surface is the product; `mod.ts` is a curated manifest, and subpaths isolate adapter-specific/server-only code. Adding or removing a subpath is a semver-visible change.                                                                 | Doctrine 01 A1/A2/A14 and doctrine 02/05                                                                                                  |
| Layering        | `domain → ports → application`, with adapters depending on ports/domain and external clients. Composition roots wire adapters; non-edge modules must not perform IO or registration at load time.                                                      | Doctrine 05 and 07                                                                                                                        |
| Composition     | A composition root has explicit named defaults and **no module-load-time side effects**. Optional integration is supplied explicitly rather than discovered through import magic.                                                                      | Doctrine 07, R-COMP-DECL                                                                                                                  |
| Anti-patterns   | The current registration is AP-11 (hidden module global) and AP-25 (side effect in a non-edge barrel). The repair must also avoid AP-14 (upstream re-export), AP-22 (unpublished useless barrel), and AP-9 (new abstraction without a second variant). | Doctrine 09; Archetype-2 profile                                                                                                          |
| Fitness gates   | Archetype 2 requires F-1..F-12 (as selected by its profile), F-14..F-19, static gates, JSR/publish gates, and consumer import checks. Runtime/Aspire is optional only when a real backend is exercised.                                                | Archetype gate matrix and Archetype-2 profile                                                                                             |

No relevant open SDK entry exists in `.llm/harness/debt/arch-debt.md`. This leaf must not create or
deepen architecture debt.

## Findings

| #  | Finding                                                                                                                                                                                                                                                                                                   | How to verify                                                                                                                                          |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | The SDK root documentation says, exactly, “Use `@netscript/sdk/cache` only from server-side code. Importing it auto-registers…” but the root immediately re-exports that server-only module. The code violates its own published boundary.                                                                | `packages/sdk/mod.ts:24-25,46` at the baseline                                                                                                         |
| 2  | `@netscript/sdk/cache` registers `cacheQuery` at module load.                                                                                                                                                                                                                                             | `packages/sdk/src/cache/mod.ts:16-22`: imports `setCacheProvider`/`cacheQuery`, then calls `setCacheProvider(cacheQuery)`                              |
| 3  | `defineServices` is published only through the root; no `./presets` export exists.                                                                                                                                                                                                                        | `packages/sdk/deno.json` export map; `deno doc --filter defineServices packages/sdk/mod.ts` succeeds while the query entry does not contain the symbol |
| 4  | Browser-oriented `queryOptions().queryFn()` branches on the module-scoped provider. When registration leaked in, it invokes the cache-backed action; otherwise it calls the injected typed client directly.                                                                                               | `packages/sdk/src/query/query-factory.ts:115-128`                                                                                                      |
| 5  | The default cache adapter has a dynamic `import('@netscript/kv')`. Keeping the cache module reachable from the root retains a server-adapter edge even if registration is made pure.                                                                                                                      | `packages/sdk/src/cache/kv-cache-store.ts:68-84`                                                                                                       |
| 6  | `defineFreshApp` currently preserves server behavior only through a bare side-effect import. It is the correct server composition root, but its opt-in must become an explicit `setCacheProvider(cacheQuery)` call inside `defineFreshApp()`.                                                             | `packages/fresh/src/runtime/server/define-fresh-app.ts:1-7,89`                                                                                         |
| 7  | Scaffolded Fresh `main.ts` calls `defineFreshApp`; the CLI also emits a redundant bare cache import when cache is enabled. The Fresh composition-root change covers generated apps. Changing CLI scaffold output would expand the leaf into an E2E-required surface and is not necessary for correctness. | `packages/cli/src/kernel/assets/app/main.ts.template`; `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts:315-324`               |
| 8  | The public README teaches root `defineServices`; the generated site reference twice says the cache subpath auto-registers. Those statements would become false without migration prose.                                                                                                                   | `packages/sdk/README.md:76`; `docs/site/reference/sdk/index.md:79-82,267`                                                                              |
| 9  | The only non-generated root-import example for a cache implementation is stale after cache removal from the root.                                                                                                                                                                                         | `packages/sdk/src/cache/kv-cache-store.ts:41` imports `KvCacheStore` from `@netscript/sdk`                                                             |
| 10 | The issue has five unchecked acceptance boxes. In particular, it requires both browser isolation and preserved explicit Fresh bootstrap registration; a focused subpath by itself is insufficient.                                                                                                        | GitHub issue #1462 body fetched on 2026-08-30                                                                                                          |

## Public-surface inspection (`deno doc` first)

- `deno doc --filter defineServices packages/sdk/mod.ts` resolves the preset from
  `src/presets/define-services.ts`.
- `deno doc --filter hasCacheProvider packages/sdk/mod.ts` resolves the provider registry only
  because the root re-exports `src/cache/mod.ts`.
- `deno doc --filter defineServices packages/sdk/src/query/mod.ts` exits non-zero (“Node
  defineServices was not found”), confirming there is no focused current entry.
- `deno doc packages/sdk/src/cache/mod.ts` renders the cache adapter and provider surface and
  repeats the import-time registration contract.

This inspection preceded focused source reads. It establishes the actual published shape rather than
inferring it from filenames.

## Design alternatives and dominance

| Move from #1462                              | What it fixes                                                                                                                                    | What it leaves                                                                                          | Dominance result                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1. Add a browser-safe `./presets` entry      | Gives new callers a narrow, side-effect-free `defineServices` import.                                                                            | Existing root callers still trigger the defect; import-only cache registration remains hidden.          | **Does not dominate.** It routes careful callers around the bug but leaves the published root and bootstrap contract wrong. |
| 2. Make the SDK root side-effect-free        | Fixes existing `defineServices` root callers. Removing the cache re-export also removes the `@netscript/kv` dynamic-import edge from that graph. | A narrow intent-revealing preset entry is still absent; server registration must be restored elsewhere. | Necessary, but alone does not dominate move 3 because servers lose registration.                                            |
| 3. Make server bootstrap register explicitly | Preserves Fresh server behavior and makes ownership visible at the composition root.                                                             | Does not protect browser/root imports by itself.                                                        | Necessary, but alone does not dominate move 2.                                                                              |

**Locked choice: all three.** Moves 2 + 3 are the minimum implied by acceptance. Adding move 1 is an
additive, doctrine-aligned subpath that gives browser/shared code a minimal graph and a durable
place for the preset without loading unrelated root responsibilities. No single alternative
dominates the combined choice: omitting move 2 leaves existing root consumers unsafe; omitting move
3 breaks Fresh servers; omitting move 1 saves one export but leaves callers without the focused
boundary named by the issue. The cost of move 1 is a new stable surface and its generated/doc
derivatives, which are explicitly owned below rather than treated as free.

The root must **remove** the cache re-export, not merely make `src/cache/mod.ts` pure. A pure cache
barrel would stop registration but would keep `KvCacheStore` and its dynamic `@netscript/kv` edge
reachable from browser builds, so it does not satisfy the client-chunk acceptance as strongly as the
curated-root split.

## Compatibility consequence

This is a pre-1.0 but real compatibility change:

1. Consumers importing cache symbols such as `KvCacheStore`, `cacheQuery`, or `setCacheProvider`
   from `@netscript/sdk` will fail to compile and must import them from `@netscript/sdk/cache`
   (provider functions also remain available from `@netscript/sdk/query` where currently published).
2. Consumers that use `import '@netscript/sdk/cache'` only for its side effect will still compile
   but will no longer register a provider. They must call `setCacheProvider(cacheQuery)` in their
   server composition root.
3. Consumers bootstrapping through `defineFreshApp()` remain covered: that function will perform the
   explicit registration before configuring cache invalidation or routes.
4. Non-Fresh/custom server bootstraps are **not** covered automatically and are the behavioral break
   that needs migration guidance.

A migration note is owed. `packages/sdk` has no package `CHANGELOG.md`; creating a new unpublished
changelog convention is broader than this fix. The owned migration note will therefore live in the
published `packages/sdk/README.md`, and the public SDK site reference will be updated to the same
explicit-registration contract. The PR summary must call out the break for 0.0.7 rather than label
it patch-compatible.

## jsr-audit surface scan

Baseline commands were run before any edits:

| Check                                                         | Baseline outcome                                                                                                                          | Planning consequence                                                                                                                                                         |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deno doc` inspection                                         | Root exposes `defineServices` and cache-provider symbols; query does not expose the preset.                                               | Root removal and focused entry are public-surface changes.                                                                                                                   |
| `deno task doc:lint --root packages/sdk --pretty`             | Exit 1. Wrapper reports three unique private-type-ref source files and no missing JSDoc.                                                  | Preserve the measured negative exactly; no new unique source or diagnostic may be introduced.                                                                                |
| `deno doc --lint packages/sdk/src/presets/define-services.ts` | Exit 1 with 10 private-type-ref diagnostics.                                                                                              | `./presets` cannot point directly at `define-services.ts`; a curated entry must publicly re-export the dependent SDK contract types and must have a clean targeted doc-lint. |
| JSR audit helper                                              | Exit 0 with two warnings: existing `src/` cardinality 13 > 12 and a slow-types warning. It reports 12 current entrypoints and dry-run OK. | Record both warnings as measured negatives; the leaf may not call them green or expand into cardinality/type remediation. The planned 13th entry must add no new finding.    |

The new `./presets` entry is additive, but removing root cache exports is a breaking surface change.
`surface:diff` must report the exact added entry and removed root symbols at symbol granularity; its
negative result is evidence, not a reason to rewrite the release baseline in this leaf.

## Generated-derivative cascade

The published export and reference prose feed checked-in generated assets. The plan owns the source
change and the exact derivative outputs:

| Gate              | Generator/check                                                         | Owned derivative                                                                                             |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| MCP export corpus | `deno task gen:mcp-export-corpus` / `deno task check:mcp-export-corpus` | `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`                         |
| Publish assets    | `deno task gen:publish-assets` / `deno task check:publish-assets`       | `packages/mcp/src/publish-assets.generated.ts`; `packages/cli/src/kernel/assets/publish-assets.generated.ts` |

After product changes, each check is expected to fail once as a measured stale-derivative negative,
then its generator is run, the named output is reviewed/committed, and the check must pass. A coarse
“generated assets changed” claim is insufficient; base-vs-head review must inspect the SDK entry and
registration prose inside each derivative.

## Open questions

None remain for implementation. The product surface, compatibility behavior, file ceiling, red test
shape, and gate set are locked. Any new product/proof path is a rescope-and-stop.
