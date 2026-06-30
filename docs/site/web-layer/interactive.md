---
layout: layouts/base.vto
title: Interactive islands
templateEngine: [vento, md]
---

# Interactive islands

The interactive entrypoint of `@netscript/fresh` is intentionally small. It exposes the
browser-facing seams that the framework owns directly, while route builders, server helpers,
and copy-based UI registry components stay on explicit subpaths. Reach for this surface when an
island needs to read an in-flight promise during render using the Suspense throw-promise
protocol, rather than threading loading state through props.

## The interactive entrypoint

`@netscript/fresh` keeps its interactive runtime narrow on purpose. The package documents this
boundary directly: the entrypoint is limited to package-owned interactive seams, so anything
that is route-shaped, server-shaped, or registry-shaped lives elsewhere and is consumed through
its own path.

Today that surface is two functions built around promises:

- `usePromise<T>` reads a promise during render using the Suspense throw-promise protocol. When
  the promise is still pending, the call throws the promise so a surrounding Suspense boundary
  can show its fallback; when the promise is fulfilled, the call returns the resolved value of
  type `T`.
- `resolvedPromise<T>` creates a promise that is already primed as fulfilled with a given value.
  It pairs with `usePromise()` so a component can be driven with a value that is available
  synchronously without special-casing the read path.

Because `usePromise` participates in Suspense, the island that calls it should be rendered inside
a Suspense boundary that supplies a fallback. The deferred and streaming UI surface covers how
those boundaries are wired across the server render; see
[Deferred and streaming UI](/web-layer/defer-streaming-ui/).

## Reading a promise inside an island

The example below composes only the two documented symbols. `usePromise` reads the promise to
get its resolved value, and `resolvedPromise` provides an already-fulfilled promise for the case
where the value is available up front.

```tsx
import { resolvedPromise, usePromise } from "@netscript/fresh/interactive";

interface Metric {
  label: string;
  value: number;
}

function MetricReadout({ data }: { data: Promise<Metric> }) {
  // Suspends while `data` is pending; returns the resolved Metric once fulfilled.
  const metric = usePromise(data);
  return (
    <p>
      {metric.label}: {metric.value}
    </p>
  );
}

// An already-fulfilled promise, suitable for synchronous values.
const seeded = resolvedPromise<Metric>({ label: "Sessions", value: 42 });

export default function MetricIsland() {
  return <MetricReadout data={seeded} />;
}
```

{{ comp callout { type: "note" } }}
`usePromise` relies on the Suspense throw-promise protocol, so the calling component must render
within a Suspense boundary that provides a fallback. Wire that boundary on the server render — see
[Deferred and streaming UI](/web-layer/defer-streaming-ui/).
{{ /comp }}

## API summary

| Symbol | Description |
| --- | --- |
| `usePromise<T>(promise: Promise<T>): T` | Read a promise using the Suspense throw-promise protocol. |
| `resolvedPromise<T>(value: T): Promise<T>` | Create a promise already primed as fulfilled for `usePromise()`. |

## Companion UI helpers

The copy-based registry components of `@netscript/fresh-ui` live on workspace-local deep paths so
applications can own and evolve them after copy. Its root entrypoint exposes only the supported
helper utilities that are safe to consume as package runtime dependencies, including:

- `cn(...inputs: ClassValue[]): string` — combines clsx and tailwind-merge for class merging.
- `getToast(url: URL): RegistryToast | undefined` — reads a toast payload from a URL when
  redirect-flash query parameters are present.
- `withToast(path: string, toast: RegistryToast): string` — appends a toast payload to a relative
  application path.
- `stripToastFromUrl(url: URL): string` — removes all toast query parameters while preserving path
  and hash.

For the full Web Layer UI surface and the workspace-owned registry components, see the pillar hub at
[/web-layer/](/web-layer/).

## Related

{{ comp.cardsGrid({ columns: 3, cards: [ { title: "Deferred and streaming UI", body: "Wire the Suspense boundaries that usePromise relies on.", href: "/web-layer/defer-streaming-ui/" }, { title: "Data loading and the query cache", body: "Load and cache data that islands consume.", href: "/web-layer/query/" }, { title: "The Fresh page model", body: "Server rendering and the page contract.", href: "/web-layer/server/" } ] }) }}

- [Live dashboard tutorial](/tutorials/live-dashboard/) — the flagship walkthrough that brings
  interactive islands together end to end.
