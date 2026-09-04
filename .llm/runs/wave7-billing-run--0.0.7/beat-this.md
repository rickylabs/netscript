# What the three prior billing builds actually did — and the bars that follow

Audited read-only: `closebook-billing-run-grok45-20260807`, `vela-billing-control`, `obol-billing-run`.
All three: NetScript 0.0.5-canary.16, same assignment, same PLAN. Numbers are `git diff <scaffold> HEAD`.

| | closebook | vela | obol |
| --- | --- | --- | --- |
| hand-authored ts/tsx | 58 files / +5,476 | 56 / +4,670 | 64 / +4,542 |
| DB models / enums / migrations | 15 / **0** / 2 | 19 / 8 / **3** | 14 / 8 / 2 |
| contract procedures | ~25 | **11** | 24 + CRUD |
| product pages (detail routes) | 5 (**0**) | 8 (1) | 6 (2) |
| tests / assertions | 33 / 73 | **8 / 12** | 37 / 80 |
| type escapes | **0** | 11 | **34** |
| `tokens.json` rewritten | **no** | yes | **no** |
| `(design)/…/registry.ts` | stock | stock | stock |

**The single most revealing fact:** `routes/(design)/design/(_shared)/registry.ts` has blob SHA
`cc0755485af5` in **all three repositories** — byte-identical, untouched scaffold. Not one product
component was ever registered in the gallery. Three independent frontier models, same blind spot.

## The 12 bars

1. **Rewrite the token source, not a stylesheet on top of it.** `assets/tokens.css` **and**
   `assets/tokens.json` must both diverge from the stock registry theme, and `/design/tokens` must
   render the product's palette. obol changed *neither* and `@import`ed a 688-line override sheet;
   closebook changed the CSS but left the JSON stock, so its own token page publishes colours the
   product never uses. **Bar: ≥40 changed token entries in `tokens.json`, proved by diff.**
2. **Register your own components.** Bar: `registry.ts` diverges, **≥6 product components** appear
   in the gallery, `/design/components` captured in the product skin.
3. **Zero type escapes in authored code.** obol had 29 `: any` + 5 `as unknown as` + 31
   `deno-lint-ignore no-explicit-any` *at the money serialization boundary*. closebook proved 0 is
   achievable at the same scale. **Bar: 0.**
4. **≥60 tests / ≥120 assertions, write path covered.** vela's 812-line `repository.ts` — every
   money mutation — had **zero** tests. **Bar: every mutating procedure has a test that can fail;
   delete the stock `tests/scaffold_test.ts` all three shipped verbatim.**
5. **≥15 negative-authorization tests.** vela proved 401/403/200 only as prose in its record.
   **Bar: a test file, not a curl transcript.**
6. **Use the auth you installed.** closebook migrated 4 better-auth tables, left `auth/mod.ts` the
   untouched stub with zero product references, hand-rolled an HMAC token, and required pasting a
   secret into `localStorage` that appears in no README. **Bar: a stranger following the README
   alone obtains a credential and completes a privileged mutation.**
7. **Zero scaffold leftovers, zero placeholder files.** closebook shipped 15 `routes/examples/**`
   files and four stubs still reading `export const queryLoaders = {} as const;`.
8. **Use the framework's data path.** closebook exported `billingQueries` and never imported it;
   its screens are 6–10 KB islands hand-rolling `useState`/`useEffect` refetch. **Bar: 0 raw
   `fetch()` in product code, lists through the query factories, islands under ~4 KB.**
9. **Prove the live story in a browser, two tabs** — and a saga whose compensation reaches a
   **terminal** state. vela's is still stuck `compensating`. No prior build has proved compensation.
10. **≥20 models, DB-level enums, ≥3 migrations.** closebook had 15 models, **0 enums**, and 11
    stringly-typed status columns carrying legal values in a `//` comment.
11. **≥12 pages incl. ≥4 detail routes, ≥20 registry components used.** None of the three used
    `ChartBlock`, `Donut`, `Dropzone`, `FilterForm`, `FormField`, `Pagination`, `Select`,
    `Skeleton` or `Switch`; only vela used `DataTable`.
12. **>6,000 authored TS lines across 80+ files, and a record the diff cannot contradict.** All
    three landed in a narrow 4,542–5,476 band, so this ceiling is untested. obol's 791-line record
    with a four-part ledger is the shape; obol also credits its skin to a file it never touched —
    that is the failure mode to avoid.
