## Review — #1069's envelope sample is now proven to compile, and one regression was reverted

### The sample type-checks

I compiled the exact chain from `docs/site/web-layer/builders.md` against the real package, in
`packages/fresh/tests/sample-check.tsx`, with local stubs for the app-level symbols only
(`MetricChart`, `MetricChartSkeleton`, `EditOrderForm`, `loadOrderMetrics`, `updateOrderStatus`) —
every framework symbol, method and option name is the real one.

```
$ deno check --unstable-kv packages/fresh/tests/sample-check.tsx
Check packages/fresh/tests/sample-check.tsx
TS9019 [ERROR]: Binding elements can't be exported directly with --isolatedDeclarations.
export const { handler, default: page } = orderPage;
Found 2 errors.
```

Both errors are on the **scratch harness's own export line**, not on the builder chain:
`packages/fresh` compiles with `isolatedDeclarations` because it is a published package, and that
rule rejects a destructured or inferred default export. A generated app route module is not built
under that constraint. The chain itself — `withRouteContract` → `withResource` → `withPolicy` →
`withTelemetry` → `withLayer` (with `loader`, `partial`, `partialName`, JSX `fallback`, `staleTime`,
`staleReloadMode`) → `withForm` (`schema`, `mutate`) → `withLayout((slots, ctx) => …)` with
`slots.chart()` / `slots.editOrder()` called → `withHeader` → `withStatus` → `build()` — produced
**zero** diagnostics. That is the evidence #1069 needed, and the scratch file has been removed.

### Regression caught and reverted

An uncommitted edit deleted `withStreaming()` from both the builder-method table and the "Defer
policy and streaming" section of `builders.md`. `withStreaming()` is real:

```
packages/fresh/src/application/builders/define-page/builder/mod.tsx:419:    withStreaming() {
packages/fresh/src/application/builders/define-page/builder/state.ts:172:  withStreaming(): DefinePageBuilder<TTypes, THasConfiguredRoute>;
packages/fresh/src/application/builders/define-page/tests/search-params.test.tsx:189: Deno.test('definePage withStreaming generates a chunked GET response ...')
```

Deleting accurate documentation to tidy a section is a regression, not a cleanup. Reverted; the page
still documents it in three places. #1069 says *do not rewrite the manual* — that constraint cuts
both ways.

### Where the PR stands

- **#1068** — landed (`18665fafc`, corrected in `6ccfc88fd`). Verification of the built `llms.txt`
  is still to be posted.
- **#1069** — landed (`b2efd884f`, corrected in `6ccfc88fd`), and now compile-verified above. One
  open question I will not resolve silently: the sample leads with `withRouteContract`, whose input
  type `DefinePageRouteContractInput` is marked `@internal` and whose `$route` is normally inserted
  by the Vite codegen pass, while the page's own preamble points readers at `withRoute()`. It
  compiles and it is a real public builder method, so this is an editorial call, not a correctness
  one — but it is a call, and it is recorded here rather than buried.
- **#1070** — in flight.
- **#1020** — in flight.

Two implementation turns ended early on this slice before the current one (the OpenRouter Gemini
generator with `aborted_streaming`, then an Antigravity turn that exited after ~3 minutes). Both left
work uncommitted. Nothing committed has been lost, and the branch is clean at `6ccfc88fd`.
