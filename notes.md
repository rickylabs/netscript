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

## Process Notes

- Draft PR #483 is open. Requested labels `area:packages`, `priority:high`, and
  `epic:road-to-stable` were not present in the repository label set; existing equivalents/nearest
  labels were applied and the mismatch is recorded in run drift.
- PLAN-EVAL passed via OpenHands run `28758467765`; evaluator noted the strict count is 34
  publishable roots plus non-publishable `@netscript/bench`, and the sanctioned slow-types policy
  covers four packages.

## Lock Hygiene

- No committed `deno.lock` changes.
- 2026-07-06: `deno info npm:better-auth --json` added a transient `npm:better-auth@*`
  resolution to `deno.lock`; reverted immediately per the zero-lock-churn rule.

- 2026-07-06: `deno info npm:@orpc/server@1.14.6` / `npm:@orpc/contract@1.14.6` touched `deno.lock` during read-only declaration inspection; reverted immediately per zero-lock-churn rule.
