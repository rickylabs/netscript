# Worklog: generated route runtime binding

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `fix-1576-form-c-route-path-binding--1576-1568` |
| Branch         | `fix/1576-form-c-route-path-binding`            |
| Archetype      | `4 — Public DSL / Builder`                      |
| Scope overlays | `frontend`                                      |

## Design

### Public Surface

- `definePage().withRoute(reference)` — now requires the complete parser-bearing reference that its
  runtime already expects.
- `definePartial({ route, ... })` — additive route-bound overload exposing parsed state.
- `PartialRouteContext` / routed partial option and handler types — caller-facing inference helpers.

### Caller-Facing Chain

```ts
definePartial({
  name: 'order-summary',
  route: routes.orders.$id.$route,
  loader: async (ctx) => ({ id: ctx.path.id, page: ctx.search.page }),
  component: OrderSummary,
});
```

### Domain Vocabulary

- Complete route reference — `$types` plus `safeParsePath`/`safeParseSearch` runtime capability.
- Partial route context — Fresh request context augmented with `path`, `search`, and `route`.
- Route-state resolver — shared schema/reference precedence and HTTP failure policy.

### Ports and Constants

- No external port or new finite constant is needed; parsing is a pure package-owned policy seam.

### Validation Rules

- Path parse failure throws `Response(404)`.
- Search parse failure retries empty/default input; a second failure throws `Response(400)`.
- Explicit schema wins over reference parser; reference parser wins over empty fallback.

### Commit Slices

| # | Slice                                   | Gate                         | Files                                                   |
| - | --------------------------------------- | ---------------------------- | ------------------------------------------------------- |
| 1 | #1576 page binding and divergence guard | focused tests + scoped check | page runtime/types/tests + run artifacts                |
| 2 | #1568 partial binding reuse             | requested full gate set      | define-partial, surface/docs/type tests + run artifacts |

### Deferred Scope

- Browser scaffold E2E is not run because the brief explicitly prohibits `e2e:cli`.
- Formal evaluation is automatic-label lifecycle work and is not launched locally.

### Contributor Path

Add route parsing behavior to the route reference contract, consume it only through the shared
resolver, and extend the page/partial matrix together so their runtime policy stays identical.

## Progress Log

| Time       | Slice     | Step        | Notes                                                                                                                                                                                                                                        |
| ---------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-12 | bootstrap | activated   | Skills, harness authority, doctrine, issues, and baseline re-checked.                                                                                                                                                                        |
| 2026-08-12 | #1576     | implemented | Reference-aware page resolver, parser-bearing type constraint, and page pipeline matrix landed locally.                                                                                                                                      |
| 2026-08-12 | #1576     | reviewed    | Checked precedence, 404 propagation, generated dynamic/catch-all/optional state, every requested page pipeline stage, and compile-time incomplete-target rejection. No out-of-scope file touched. This is generator review, not A1 sign-off. |
| 2026-08-12 | #1576     | reconcile   | Issues remain open; resolving PR will carry both closing keywords. No new comments/evaluator output observed. Plan unchanged.                                                                                                                |
| 2026-08-12 | #1568     | implemented | Added the published `definePartial({ route })` overload, routed context/handler types, shared path/search resolution, README example, page/partial parity matrix, invalid-state matrix, and route mutation inference coverage.               |
| 2026-08-12 | #1568     | reviewed    | Confirmed route resolution runs before loader error rendering, all method handlers receive the same bound context, legacy overload behavior stays intact, and no parallel parser or out-of-scope file was introduced.                        |
| 2026-08-12 | final     | validated   | Scoped check/lint/fmt, 234-test Fresh suite, repository quality gate, explicit Fresh source quality scan, diff check, and lock hygiene all pass. Existing warning-only doctrine/dependency output remains unchanged.                         |

## Gate Results

### Slice #1576

| Gate                              | Result | Evidence                                                                                                   |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Generated dynamic pipeline        | PASS   | `definePage withRoute generated dynamic reference resolves path across the page pipeline`                  |
| Dynamic/catch-all/optional matrix | PASS   | `definePage withRoute generated references resolve dynamic and catch-all path matrices`                    |
| Invalid/missing path              | PASS   | `definePage withRoute generated reference rejects missing dynamic params with 404`                         |
| Parser precedence + fallback      | PASS   | `definePage explicit path schema wins while the route supplies absent search parsing`                      |
| Compile-time parser capability    | PASS   | `surface.test.ts` `@ts-expect-error`; package check would fail if a `$types`-only target remained accepted |
| Scoped check                      | PASS   | `Checked 14 files`                                                                                         |
| Lock hygiene                      | PASS   | `git diff -- deno.lock` empty                                                                              |

### Slice #1568 and final gates

| Gate                        | Result | Evidence                                                                                              |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| Routed loader + handler     | PASS   | `definePartial route option exposes parsed path and search to loaders and handlers`                   |
| Page/partial path parity    | PASS   | `definePartial route binding matches definePage across generated path matrices`                       |
| Shared invalid-state policy | PASS   | `definePartial route binding uses shared 404 and 400 invalid-state responses`                         |
| Route mutation inference    | PASS   | `assertPartialRouteMutationInference` covers add, rename, and removal through compile-time assertions |
| Fresh scoped check          | PASS   | 188 files, 2 batches, 0 findings                                                                      |
| Fresh scoped lint           | PASS   | 188 files, 1 batch, 0 findings                                                                        |
| Fresh scoped format         | PASS   | 188 files, 1 batch, 0 findings                                                                        |
| Fresh package tests         | PASS   | `ok                                                                                                   |
| Explicit Fresh quality scan | PASS   | 0 findings; 1 existing documented allowance in `route-support.ts`                                     |
| Repository quality gate     | PASS   | exit 0; warning-only existing dependency/doctrine inventory                                           |
| Diff/lock hygiene           | PASS   | `git diff --check` clean; `deno.lock` unchanged                                                       |

## Handoff Notes

- Automatic evaluation is required and intentionally not arranged by this session.
- Browser scaffold E2E and publish dry-run were not run; the former is explicitly prohibited and
  neither is part of the owner-specified gate set.
