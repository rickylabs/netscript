---
layout: layouts/base.vto
title: Error handling and diagnostics
templateEngine: [vento, md]
---

# Error handling and diagnostics

`@netscript/fresh` ships an explicit error-handling surface for the Web Layer. Instead of letting a thrown loader propagate into a blank screen, it normalizes any failure into a single `ErrorData` payload, classifies it by HTTP status, and renders it with a default display that you can override. Reach for this surface whenever a page loads data that can fail and you want a predictable shape to branch on — and a presentation you control.

## The model

The surface is built around three ideas: a normalized payload, a wrapped loader, and a renderable display.

- **`ErrorData`** is the normalized payload. Every failure is reduced to a stable object — `message`, `status`, optional `code`, a classified `type`, a `retry` flag, and a `timestamp`. Loaders, handlers, and error displays all speak this shape.
- **`errorHandler()`** wraps a loader so a thrown value never escapes raw. It returns a `LoaderResult<T>` — either your success data or a normalized error envelope.
- **`ErrorDisplay`** renders an `ErrorData` payload, with an overridable presentation slot for custom views.

### Error classification

Errors are categorized by HTTP status into the `ErrorType` taxonomy:

| `ErrorType` | Meaning |
| --- | --- |
| `"client"` | Client-side failure (4xx-range status). |
| `"server"` | Server-side failure (5xx-range status). |
| `"unknown"` | Status that does not map cleanly to either category. |

`classifyErrorType(status)` performs this mapping, `getDefaultMessage(status)` returns the default user-facing message for a known status code, and `isRetryable(status, type)` decides whether retry affordances should be offered for a given status-and-type combination.

### The normalized payload

`extractErrorData(error)` takes any thrown value and produces a normalized `ErrorData`:

```ts
interface ErrorData {
  message: string;    // User-facing message derived from the source error.
  status: number;     // HTTP status associated with the error.
  code?: string;      // Optional machine-readable code.
  type: ErrorType;    // HTTP-derived error classification.
  retry: boolean;     // Whether retry affordances should be shown.
  timestamp: number;  // Unix epoch timestamp in milliseconds.
}
```

## Wrapping a loader

`errorHandler()` wraps a loader with Fresh error normalization. It has two forms, distinguished by whether you supply a fallback:

- `errorHandler(loader, fallback)` returns a loader producing `LoaderResult<T, true>` — on failure the result carries both normalized `error` data and your `fallback` value as `data`.
- `errorHandler(loader)` returns a loader producing `LoaderResult<T, false>` — on failure the result carries only normalized `error` data.

`LoaderResult<T, HasFallback>` is a union of either the success value `T` or an error envelope. The result is narrowed with `hasError()` and unpacked with the matching extract/parse helper.

```ts
import {
  errorHandler,
  hasError,
  extractData,
  extractErrorWithFallback,
} from "@netscript/fresh";

// No-fallback form: errored result carries only normalized error data.
const loadOrders = errorHandler(async () => {
  return await fetchOrders();
});

const result = await loadOrders();

if (hasError(result)) {
  // result is { error: ErrorData }
  console.error(result.error.message, result.error.status);
} else {
  // Narrowed to success data.
  const orders = extractData(result);
  renderOrders(orders);
}
```

With a fallback, the errored result still hands you usable data:

```ts
import { errorHandler, hasError, extractErrorWithFallback } from "@netscript/fresh";

const loadStats = errorHandler(
  async () => await fetchStats(),
  { total: 0, pending: 0 }, // fallback
);

const result = await loadStats();

if (hasError(result)) {
  // result is { error: ErrorData; data: typeof fallback }
  const { error, data } = extractErrorWithFallback(result);
  reportError(error);
  renderStats(data); // render the fallback rather than crashing
}
```

### Choosing an extraction helper

The helpers below unpack a `LoaderResult` after you have classified it. Pick the one that matches whether your loader was wrapped with a fallback and how strict you want to be:

| Helper | Result form | Returns |
| --- | --- | --- |
| `extractData(result)` | `LoaderResult<T, false>` | Success data, after a `hasError()` check. |
| `extractDataWithFallback(result)` | `LoaderResult<T, true>` | Fallback data from an errored result. |
| `extractErrorWithFallback(result)` | `LoaderResult<T, true>` | `{ error, data }` — both normalized error and fallback. |
| `safeParseData(result)` | `LoaderResult<T, false>` | Success data, or `null` when the result contains an error. |
| `safeParseDataWithFallback(result)` | `LoaderResult<T, true>` | Success data, or the fallback when errored. |

## Rendering the error

`ErrorDisplay` renders normalized error data with an overridable presentation slot. It accepts `ErrorDisplayProps`:

- `error: ErrorData` — the normalized payload to render.
- `title?: string` — optional title shown above the message.
- `showRetry?: boolean` — whether retry affordances appear for retryable errors.
- `children?` — a render prop or replacement node for custom presentation.

```tsx
import { ErrorDisplay, hasError, extractData } from "@netscript/fresh";

export default function Page({ result }) {
  if (hasError(result)) {
    return (
      <ErrorDisplay
        error={result.error}
        title="We could not load this page"
        showRetry
      />
    );
  }

  const data = extractData(result);
  return <Dashboard data={data} />;
}
```

For compact, in-flow surfaces — a failed widget inside an otherwise healthy page — use `InlineError`, which renders the same normalized `ErrorData` in a tighter layout:

```tsx
import { InlineError } from "@netscript/fresh";

<InlineError error={result.error} />;
```

### Custom presentation with primitives

The `children` prop of `ErrorDisplay` accepts a render prop that receives `ErrorPrimitives` — a precomputed view payload shared by package-owned and app-owned error views. It exposes the resolved `errorTitle`, `errorMessage`, `errorCode`, `errorType`, `errorStatus`, `errorTimestamp`, `errorIcon`, `isRetryable`, and the default renderer's utility classes (`bgColor`, `borderColor`, `textColor`), alongside the raw `error`. This lets you replace the markup while keeping the framework's classification and message resolution.

```tsx
import { ErrorDisplay } from "@netscript/fresh";

<ErrorDisplay error={result.error}>
  {(p) => (
    <section class={`${p.bgColor} ${p.borderColor} ${p.textColor}`}>
      <h2>{p.errorIcon} {p.errorTitle}</h2>
      <p>{p.errorMessage}</p>
      {p.errorCode ? <code>{p.errorCode}</code> : null}
    </section>
  )}
</ErrorDisplay>;
```

{{ comp callout { type: "note" } }}
The `children` render prop and `ErrorDisplay` return values are typed as `ErrorDisplayContent` — the renderable content accepted and returned by the error display helpers.
{{ /comp }}

## API summary

| Symbol | Description |
| --- | --- |
| `ErrorData` | Normalized error payload for loaders, handlers, and error displays. |
| `ErrorType` | HTTP-derived error category: `"client"`, `"server"`, or `"unknown"`. |
| `LoaderResult<T, HasFallback>` | Loader result returned by `errorHandler()` — success value or an error envelope. |
| `errorHandler(loader, fallback?)` | Wrap a loader with Fresh error normalization; the fallback form also returns fallback data. |
| `extractErrorData(error)` | Extract a normalized `ErrorData` payload from any thrown value. |
| `classifyErrorType(status)` | Classify an HTTP status code into the `ErrorType` taxonomy. |
| `getDefaultMessage(status)` | Return the default user-facing message for a known HTTP status code. |
| `isRetryable(status, type)` | Whether a status-and-type combination should offer retry affordances. |
| `hasError(result)` | Narrow a `LoaderResult` to its error envelope. |
| `extractData(result)` | Extract success data after a `hasError()` check. |
| `extractDataWithFallback(result)` | Extract fallback data from an errored loader result. |
| `extractErrorWithFallback(result)` | Extract both normalized error data and fallback data. |
| `safeParseData(result)` | Return success data, or `null` when the result contains an error. |
| `safeParseDataWithFallback(result)` | Return success data, or fallback data from a loader result. |
| `ErrorDisplay(props)` | Render normalized error data with an overridable presentation slot. |
| `InlineError({ error })` | Render normalized error data in a compact inline layout. |
| `ErrorDisplayProps` | Props accepted by the default error display component. |
| `ErrorPrimitives` | Shared error-display payload for package-owned and app-owned views. |
| `ErrorDisplayContent` | Renderable content accepted and returned by the error display helpers. |

## Related

{{ comp.cardsGrid({ columns: 3, cards: [ { title: "Data loading and the query cache", body: "Where loaders run and how their results are cached.", href: "/web-layer/query/" }, { title: "Routing and route contracts", body: "How requests and statuses reach a page.", href: "/web-layer/route/" }, { title: "Server-validated forms", body: "Surfacing validation failures back to the page.", href: "/web-layer/form/" }, { title: "Deferred and streaming UI", body: "Handling failures inside streamed regions.", href: "/web-layer/defer-streaming-ui/" }, { title: "Testing Fresh pages", body: "Assert on normalized error results.", href: "/web-layer/testing/" }, { title: "Live dashboard tutorial", body: "See error handling end-to-end in the flagship build.", href: "/tutorials/live-dashboard/" } ] }) }}

See the [Web Layer hub](/web-layer/) for the full pillar map.
