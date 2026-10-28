---
layout: layouts/base.vto
title: Error handling and diagnostics
templateEngine: [vento, md]
order: 9
---

# Error handling and diagnostics

This page shows how `@netscript/fresh/error` handles a failing loader. It normalizes any failure into
one `ErrorData` payload, classifies it by HTTP status, and renders it with a default display you can
override, so a thrown loader never ends in a blank screen.

## The model

The surface has three parts:

- **`ErrorData`** is the normalized payload. Every failure becomes a stable object with `message`, `status`, optional `code`, a classified `type`, a `retry` flag, and a `timestamp`. Loaders, handlers, and error displays all use this shape.
- **`errorHandler()`** wraps a loader so a thrown value never escapes raw. It returns a `LoaderResult<T>`: your success data or a normalized error envelope.
- **`ErrorDisplay`** renders an `ErrorData` payload, with an overridable presentation slot for custom views.

### Error classification

`ErrorType` classifies an error by HTTP status:

| `ErrorType` | Meaning |
| --- | --- |
| `"client"` | Client-side failure (4xx-range status). |
| `"server"` | Server-side failure (5xx-range status). |
| `"unknown"` | Status that does not map cleanly to either category. |

`classifyErrorType(status)` performs this mapping. `getDefaultMessage(status)` returns the default user-facing message for a known status code, and `isRetryable(status, type)` decides whether to offer retry affordances for a status and type.

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

`errorHandler()` wraps a loader with error normalization. It has two forms:

- `errorHandler(loader, fallback)` returns a loader producing `LoaderResult<T, true>`. On failure the result carries normalized `error` data and your `fallback` value as `data`.
- `errorHandler(loader)` returns a loader producing `LoaderResult<T, false>`. On failure the result carries only normalized `error` data.

`LoaderResult<T, HasFallback>` is a union of the success value `T` and an error envelope. Narrow it with `hasError()`, then unpack it with the matching extract or parse helper.

```ts
import {
  errorHandler,
  hasError,
  extractData,
  extractErrorWithFallback,
} from "@netscript/fresh/error";

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

With a fallback, an errored result still carries usable data:

```ts
import { errorHandler, hasError, extractErrorWithFallback } from "@netscript/fresh/error";

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

These helpers unpack a `LoaderResult` after you classify it. Pick one by whether the loader has a fallback and how strict you want to be:

| Helper | Result form | Returns |
| --- | --- | --- |
| `extractData(result)` | `LoaderResult<T, false>` | Success data, after a `hasError()` check. |
| `extractDataWithFallback(result)` | `LoaderResult<T, true>` | Fallback data from an errored result. |
| `extractErrorWithFallback(result)` | `LoaderResult<T, true>` | `{ error, data }`: the normalized error and the fallback. |
| `safeParseData(result)` | `LoaderResult<T, false>` | Success data, or `null` when the result contains an error. |
| `safeParseDataWithFallback(result)` | `LoaderResult<T, true>` | Success data, or the fallback when errored. |

## Rendering the error

`ErrorDisplay` renders normalized error data with an overridable presentation slot. It accepts `ErrorDisplayProps`:

- `error: ErrorData`: the normalized payload to render.
- `title?: string`: an optional title above the message.
- `showRetry?: boolean`: whether retry affordances appear for retryable errors.
- `children?`: a render prop or replacement node for custom presentation.

```tsx
import { ErrorDisplay, hasError, extractData } from "@netscript/fresh/error";

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

For a failed widget inside an otherwise healthy page, use `InlineError`. It renders the same `ErrorData` in a compact layout:

```tsx
import { InlineError } from "@netscript/fresh/error";

<InlineError error={result.error} />;
```

### Custom presentation with primitives

`ErrorDisplay`'s `children` prop accepts a render prop that receives `ErrorPrimitives`, a precomputed view payload shared by package-owned and app-owned error views. It exposes the resolved `errorTitle`, `errorMessage`, `errorCode`, `errorType`, `errorStatus`, `errorTimestamp`, `errorIcon`, `isRetryable`, the default renderer's utility classes (`bgColor`, `borderColor`, `textColor`), and the raw `error`. You replace the markup and keep the framework's classification and message resolution. The render prop and `ErrorDisplay`'s return value are typed as `ErrorDisplayContent`.

```tsx
import { ErrorDisplay } from "@netscript/fresh/error";

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

## API summary

| Symbol | Kind | Description |
| --- | --- | --- |
| `ErrorData` | interface | Normalized error payload for loaders, handlers, and error displays. |
| `ErrorType` | type alias | HTTP-derived error category: `"client"`, `"server"`, or `"unknown"`. |
| `LoaderResult<T, HasFallback>` | type alias | Loader result returned by `errorHandler()`: a success value or an error envelope. |
| `errorHandler(loader, fallback?)` | function | Wrap a loader with Fresh error normalization; the fallback form also returns fallback data. |
| `extractErrorData(error)` | function | Extract a normalized `ErrorData` payload from any thrown value. |
| `classifyErrorType(status)` | function | Classify an HTTP status code into the `ErrorType` taxonomy. |
| `getDefaultMessage(status)` | function | Return the default user-facing message for a known HTTP status code. |
| `isRetryable(status, type)` | function | Whether a status-and-type combination should offer retry affordances. |
| `hasError(result)` | function | Narrow a `LoaderResult` to its error envelope. |
| `ErrorDisplay(props)` | component | Render normalized error data with an overridable presentation slot. |
| `InlineError({ error })` | component | Render normalized error data in a compact inline layout. |
| `ErrorDisplayProps` | interface | Props accepted by the default error display component. |
| `ErrorPrimitives` | interface | Shared error-display payload for package-owned and app-owned views. |
| `ErrorDisplayContent` | type alias | Renderable content accepted and returned by the error display helpers. |

The extraction helpers (`extractData`, `extractDataWithFallback`, `extractErrorWithFallback`,
`safeParseData`, `safeParseDataWithFallback`) are listed in
[Choosing an extraction helper](#choosing-an-extraction-helper).

## Next steps

Assert on normalized error results in [Testing Fresh pages](/web-layer/testing/). See also
[Data loading and the query cache](/web-layer/query/) and
[Deferred and streaming UI](/web-layer/defer-streaming-ui/).
