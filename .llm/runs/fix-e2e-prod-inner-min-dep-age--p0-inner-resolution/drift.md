# Drift

## D-1 — generated-project policy candidate rejected

The initial candidate assumed the generated root `minimumDependencyAge` policy could govern the
inner resolution. Deno 2.9.3 reproduction showed the `deno x` JSR re-run ignores both discovered
and explicit config. The plan therefore uses a direct `deno run` URL so the explicit flag governs
the single resolver. No doctrine drift results.

## D-2 — Plan-Gate explicitly waived by owner

The local formal evaluator credential was unavailable. On 2026-07-17 the owner explicitly directed
the implementation session to implement S1 without attempting PLAN-EVAL because evaluations are
supervisor-dispatched. This instruction is the written Plan-Gate waiver required by the run loop;
the implementation session did not self-evaluate.

## D-3 — unpinned Aspire endpoint hypothesis disproved

The owner's prime hypothesis for the `0.0.2-canary.2` app-home failure was wrong: a live Aspire
13.4.6 executable registered with `.withHttpEndpoint({ env: 'PORT' })` did expose an allocated proxy
URL in `urls[]` and a separate target port in `environment.PORT`. Reproduction with the published
CLI instead showed the dashboard resource had exited (`state: Finished`, `exitCode: 1`) because
Deno did not apply the generated version-qualified `minimumDependencyAge.exclude` entry to the
newly published `@netscript/fresh`. Changing the experimental exclusion to the versionless package
identity `jsr:@netscript/fresh` made Vite start and repopulated Aspire's `urls[]`. The implementation
therefore corrects the shipped workspace policy rather than the endpoint declaration or retry
budget.

## D-4 — warm dependency cache hid the canary.4 render defect

The first exact published-CLI reproduction returned HTTP 200 because the contributor Deno cache
already contained Fresh's npm runtime dependencies. Repeating the same generated app with an empty
`DENO_DIR` reproduced the production HTTP 500: Vite could not resolve
`npm:@tanstack/preact-query@^5.101.0` imported by the published `@netscript/fresh`. The package's
workspace `package.json` declared five catalog-backed runtime dependencies, but the JSR-published
`deno.json` did not. After correcting Fresh's manifest, the same cold-cache probe exposed the next
missing dependency in `@netscript/sdk` (`@orpc/tanstack-query`), so the implementation aligns both
publish manifests with their runtime dependency sets and adds cold-cache regression assertions. It
does not change the generated page or add retries.
