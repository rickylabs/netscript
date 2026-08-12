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

## Gate Results

### Slice #1576

| Gate                              | Result | Evidence                                                                                                   |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Generated dynamic pipeline        | PASS   | `definePage withRoute generated dynamic reference resolves path across the page pipeline`                  |
| Dynamic/catch-all/optional matrix | PASS   | `definePage withRoute generated references resolve dynamic and catch-all path matrices`                    |
| Invalid/missing path              | PASS   | `definePage withRoute generated reference rejects missing dynamic params with 404`                         |
| Parser precedence                 | PASS   | `definePage explicit path schema configured after withRoute takes parser precedence`                       |
| Compile-time parser capability    | PASS   | `surface.test.ts` `@ts-expect-error`; package check would fail if a `$types`-only target remained accepted |
| Scoped check                      | PASS   | `Checked 14 files`                                                                                         |
| Lock hygiene                      | PASS   | `git diff -- deno.lock` empty                                                                              |

## Handoff Notes

- Automatic evaluation is required and intentionally not arranged by this session.
