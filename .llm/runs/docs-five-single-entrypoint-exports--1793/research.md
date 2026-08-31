# Research

## Baseline

Re-baselined against `origin/main` `96d44758d`. Each of the five package `deno.json` files exposes
only `.` mapped to `./mod.ts`; each reference page lacked the table row consumed by
`parseDocContent()`.

## Symbol coverage

`deno doc --json packages/<pkg>/mod.ts` was inspected for every package.

| Package | Decision | Evidence |
| --- | --- | --- |
| `watchers` | `entrypoints-only` | The supported API tables omit exported strategy implementations that the page explicitly classifies as internal. |
| `runtime-config` | `complete` | All 20 exported symbols are present in the page's symbol tables. |
| `prisma-adapter-mysql` | `entrypoints-only` | The curated tables omit `PrismaMySqlTransactionOptions`. |
| `auth-workos` | `entrypoints-only` | The page documents WorkOS APIs and selected shared auth re-exports, not every exported auth-core contract. |
| `auth-better-auth` | `entrypoints-only` | The page documents Better Auth APIs and selected shared auth re-exports, not every exported auth-core contract. |

## Open questions

None. Issue #1793 fixes the exact pages, mapping fields, generator order, gates, and PR lifecycle.
