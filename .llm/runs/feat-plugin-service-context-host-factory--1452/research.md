# Research — #1452 reusable `PluginServiceContext` host factory

## Re-baseline — 2026-08-31

The carried research was re-checked in the assigned worktree before implementation. The branch is
clean at planning commit `fb08d2f9d`, whose merge-base is current local and remote `main`
`5197e70b7`. The template remains 123 lines and still contains the 69-line `LazyPluginKv` class;
`packages/plugin/deno.json` still has no `@netscript/kv` dependency; and the repository still has no
`appsettings` contract matching the issue wording. No Slice 2 decision has become safe to infer.

`deno doc` confirms the existing public contracts used by Slice 1:
`getKv(config?: SharedKvConfig): Promise<WatchableKv>`, with `WatchableKv` owning the forwarding
surface. The starting `deno.lock` SHA-256 is
`edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.

## What the duplicated glue actually is, measured

`packages/cli/src/kernel/assets/plugins/service-context.ts.template` is **123 lines**, emitted into
every scaffolded project. Of those, the `LazyPluginKv` class is **exactly 69 lines (56%)** — a pure
mechanical lazy-delegation wrapper implementing `WatchableKv` by deferring `getKv()` until first use.
The remaining ~54 lines are the `getDatabaseClient()` helper (a **project-relative**
`await import('../../database/mod.ts')`), a small `createPluginServiceContext()` factory, and imports.

The template is embedded through `gen:assets-barrel` into
`packages/cli/src/kernel/assets/embedded.generated.ts` and guarded by `check:assets-barrel`, so any
template change requires regenerating that carrier — a shared-asset cascade this lane has handled
before.

## The architectural question at the centre of the issue

The issue asks to "publish a generic host-context factory (or smaller composable host primitives)".
Publishing the **whole factory** from `@netscript/plugin/sdk` (where the `PluginServiceContext`
contract already lives, `src/sdk/runtime/plugin-service-context.ts`) requires that package to import
`getKv` from `@netscript/kv`. **`@netscript/plugin` does not currently depend on `@netscript/kv`** —
verified against its `deno.json` imports (`@netscript/contracts`, `@netscript/service`, `@orpc/*`,
`zod`, `@std/*` only). Every `plugin-*-core` package does take that dependency, but the *base*
`@netscript/plugin` package deliberately does not, and every plugin author pays for its dependency
closure.

**That is a real architectural decision, not a mechanical one**, and it is compounded by two more
open questions:

1. **The db-client resolver is inherently consumer-specific.** `getDatabaseClient()` does
   `await import('../../database/mod.ts')` — a path relative to the *generated project*, which no
   published package can resolve. A published factory must accept it as an injected dependency, and
   the injection shape is a public-API design decision.
2. **"appsettings" is undefined here.** The issue's acceptance names "lazy DB/KV, contracts, logger,
   env, and appsettings", but **`appsettings` appears nowhere** in the current template, the
   `PluginServiceContext` contract, or `packages/plugin/src` — searched and found zero occurrences.
   Its intended shape is unspecified.

## The clean decomposition

The issue's own wording — "**or smaller composable host primitives**" — permits taking the bulk of
the value without answering any of the above:

**`LazyPluginKv` has no plugin-specific content at all.** It implements `WatchableKv` (a
`@netscript/kv` type) by deferring `getKv()` (a `@netscript/kv` function). It belongs in
`@netscript/kv`, the package that already owns both halves of its contract. Publishing
`createLazyKv()` there:

- removes **69 of 123 template lines (56%)** from every generated consumer,
- introduces **no new dependency edge anywhere** — `@netscript/kv` already owns everything involved,
- requires **no public-API design decision** — the shape is dictated by the existing `WatchableKv`
  interface,
- and leaves the genuinely contentious part (factory location, db-resolver injection, appsettings)
  untouched and honestly deferred.

## Conclusion

Sliced. **Slice 1** publishes `createLazyKv()` from `@netscript/kv` and adopts it in the scaffold
template — bounded, precedent-free of design risk, `PLAN-EVAL: N/A`. **Slice 2** (the full
`createPluginServiceContext` host factory, the `@netscript/plugin` → `@netscript/kv` dependency
question, the db-resolver injection shape, and the undefined `appsettings` scope) is **deferred and
flagged for an owner/architecture decision**, not silently dropped and not guessed at.
