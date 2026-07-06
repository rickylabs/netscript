# Notes - issue #303 doc-lint remainder

## Stops / Deferrals

- `packages/auth-better-auth/src/better-auth.ts` exposes Better Auth passthrough options whose
  public fields reference upstream private declaration aliases:
  `NetscriptBetterAuthOptions.plugins` -> `BetterAuthOptions['plugins']` and
  `betterAuthOptions` -> `Omit<BetterAuthOptions, 'database' | 'plugins'>`. A trivial re-export or
  `BetterAuthPlugin[]` replacement did not satisfy `deno doc --lint`; resolving this cleanly needs
  a public API redesign for the passthrough surface, so it is deferred per the issue #303 brief.
- `packages/fresh/src/application/vite/vite.ts` exposes `NetScriptVitePlugin = Plugin` from Vite.
  `deno doc --lint` reports Vite's `Plugin` declaration as private. Replacing this with a
  package-owned structural hook interface would change the public plugin type contract, so it is
  deferred per the issue #303 brief.
- `packages/contracts` still reports 12 `private-type-ref` diagnostics after local alias/JSDoc
  cleanup. The remaining refs are tied to the oRPC-bound base contract/CRUD route seam (`oc`,
  `AnySchema`, `ContractProcedureBuilderWith*`, `Schema`, and aliases over those types). This is the
  sanctioned `86eca907` carve-out class; changing it would require redesigning the sound oRPC
  builder surface.
- `packages/plugin-ai-core` is reduced from 23 diagnostics to 2 after JSDoc and public vocabulary
  re-export cleanup. The remaining refs are the exported `aiContract` value naming the internal
  precise contract definition shape and `aiContractV1` naming oRPC's `Implementer` type. Removing
  those annotations breaks `--isolatedDeclarations`; replacing them with a package-owned structural
  type would change the public contract API, so this needs a design decision rather than a local
  doc-lint edit.
- `packages/plugin-auth-core` is reduced from 3 combined diagnostics to 2 after replacing the
  `PluginCapabilities` alias with a package-owned `AuthCapabilities` interface. The remaining refs
  are the same precise oRPC contract-definition/implementer seam as the other feature-plugin
  contract packages.
- `packages/plugin-sagas-core` is reduced from 11 combined diagnostics to 2 after making store
  client/delegate/KV aliases public on the store subpath and replacing the `PluginCapabilities`
  alias with a package-owned `SagasCapabilities` interface. The remaining refs are the same precise
  oRPC contract-definition/implementer seam as the other feature-plugin contract packages.
- `packages/plugin-workers-core` is reduced from 16 combined diagnostics to 4 after making KV,
  registry, runtime enum-schema, and idempotency support aliases public on the relevant subpaths and
  replacing the `PluginCapabilities` alias with a package-owned `WorkersCapabilities` interface. The
  remaining refs are the same precise oRPC contract-definition/implementer seam.
- `packages/plugin-triggers-core` is reduced from 8 combined diagnostics to 2 after making KV and
  trigger-domain support aliases public on the store subpath and replacing the `PluginCapabilities`
  alias with a package-owned `TriggersCapabilities` interface. The remaining refs are the same
  precise oRPC contract-definition/implementer seam; exporting that internal shape widens the public
  surface to oRPC helper types and increases doc-lint noise, so it is deferred for design review.
- `packages/plugin` root/protocol wrapper leaks were cleaned up, leaving 13 combined diagnostics in
  the contract-base and service subpaths. Those refs name the shared oRPC base contract and service
  builder/binder generics; replacing them would change the plugin service public API shape, so they
  are deferred as design-seam residue.
- First-party plugin wrapper entrypoints now re-export CLI/scaffold/E2E support aliases, making
  `plugins/streams` doc-lint clean and reducing wrapper noise in `plugins/ai`, `plugins/auth`,
  `plugins/sagas`, and `plugins/workers`. Remaining plugin-root refs come from their core
  contract/runtime/public seams; `plugins/triggers` remains runtime/core-seam residue.
- `packages/prisma-adapter-mysql` reports 6 private-type refs in `src/adapter.ts`. This is DB layer
  surface area and the issue brief explicitly routes DB-layer work out of scope (`ROUTE-TO-PRISMA`),
  so it is recorded rather than redesigned in this slice.
- `packages/fresh-ui` remains a design-heavy interactive surface cluster. A local conversion from
  exported Preact `JSX.*` prop aliases to the package-owned `FreshUiElementProps` vocabulary reduced
  doc-lint counts but broke hook/component type-checking across runtime call sites. The package needs
  a planned public-props/internal-props split rather than an opportunistic doc-lint rewrite.

## Process Notes

- Draft PR #483 is open. Requested labels `area:packages`, `priority:high`, and
  `epic:road-to-stable` were not present in the repository label set; existing equivalents/nearest
  labels were applied and the mismatch is recorded in run drift.
- PLAN-EVAL passed via OpenHands run `28758467765`; evaluator noted the strict count is 34
  publishable roots plus non-publishable `@netscript/bench`, and the sanctioned slow-types policy
  covers four packages.
- Type-soundness residue grep was narrowed to plugin service/router seams plus Fresh/Aspire
  touchpoints. No unexpected `any` handler erasure was found in router contexts; remaining hits are
  accepted contract error-map casts, KV/schema/runtime adapter casts, tests, or Fresh/Fresh UI
  framework touchpoints already covered by the deferrals above.

## Lock Hygiene

- No committed `deno.lock` changes.
- 2026-07-06: `deno info npm:better-auth --json` added a transient `npm:better-auth@*`
  resolution to `deno.lock`; reverted immediately per the zero-lock-churn rule.

- 2026-07-06: `deno info npm:@orpc/server@1.14.6` / `npm:@orpc/contract@1.14.6` touched `deno.lock` during read-only declaration inspection; reverted immediately per zero-lock-churn rule.
