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
