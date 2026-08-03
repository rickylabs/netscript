## Summary

`web-layer/builders/index.md:15-31` opens with a minimal `definePage()` chain. Agents anchor on the
first sample they see and never learn the possibility envelope. Both wave-four agents shipped a
single-layer page; one of them had read this page.

## Proposal

Do **not** rewrite the manual. Replace the opening sample with one screen that shows the envelope,
then label it:

```tsx
const ordersPage = definePage()
  .withRoute(routes.orders.$route)
  .withPolicy('balanced')
  .withTelemetry({ enabled: true, spanName: 'orders.list' })
  .withResource('queryClient', () => createNetScriptQueryClient())
  .withLayer('list', OrdersIsland, {
    loader: loadAndDehydrateOrders,
    partial: routes.partials.orders.$route.href(),
    partialName: 'orders-list',
    fallback: <OrdersSkeleton />,
    staleTime: 15_000,
  })
  .withForm('create', CreateOrderForm, {
    schema: CreateOrderSchema,
    mutate: (input) => ordersClient.create(input),
  })
  .withLayout((slots) => <OrdersLayout list={slots.list()} create={slots.create()} />)
  .build();
```

Immediately after it, name what the reader just saw: route typing, resource resolution, independent
layers, partial/fallback/staleness, managed forms, telemetry, layout slots. Keep a "smallest useful
page" sample **after** it.

This is the precise version of "lead with full power" — not an instruction to make every page long.

## Why it matters

Run 1's own retrospective, unprompted:

> *"My board is a single `withLayer` whose island does everything. The intended shape — a `list`
> layer with its own loader, partial route, skeleton fallback and `staleTime`, beside a separate
> query island — is exactly what the live-dashboard tutorial builds, and I read that tutorial."*

It read the right material and still built the minimal shape, because the minimal shape was what it
saw first.

## Acceptance

- [x] The builders page leads with a full-envelope example and an explicit capability list
- [x] The minimal example remains, positioned after it
- [x] `withForm`, partials, fallbacks, `staleTime`, telemetry and layout slots are all visible above
      the fold

## Notes

Documentation only — no release cut required, suitable for a subagent slice. Wave-four docs
investigation, remediation #4.

