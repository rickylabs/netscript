# Research — fix-1425-sdk-jsdoc--leaf

## Re-baseline

- Carried-in source: issue #1425 and the implementation brief
- Re-derived against `main` @ `01aa12b67` on 2026-08-12
- Live issue state: open, milestone `0.0.6`, labels `type:fix`, `area:sdk`, `priority:p2`, `status:impl`
- The dispatch baseline and current `origin/main` both resolve to `01aa12b67`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Exactly one `api-clients` occurrence exists in `packages/sdk/**`. | `rtk grep -rn "api-clients" packages/sdk/` |
| 2 | The occurrence is the `createServiceQueryUtils` JSDoc import at line 39; no executable statement contains the stale name. | `packages/sdk/src/query-client/create-service-query-utils.ts` |
| 3 | The consistency target documents `createServiceQueryUtils` as using `queryOptions({ input })`, distinct from the golden-path query factory's `queryOptions(input)`. | `docs/site/reference/sdk/index.md` query-client table |
| 4 | The shipped data-layer convention is one service module under `apps/<app>/lib/<service>.ts`; the example service is `orders`. | issue #1425; repository SDK documentation |
| 5 | Doctrine classifies `@netscript/sdk` as Archetype 4, verdict `Keep`, with high cohesion and only a minor naming review. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/sdk/deno.json` export map, `packages/sdk/mod.ts`, and the affected exported JSDoc.
- Slow-type / surface risks: none introduced; the slice changes one example import only.
- Publish authority: `deno task doc:lint --root packages/sdk --pretty` over the full export map.

## Open questions

- None. The issue fixes the path convention, consistency page fixes the call shape, and the census is one.
