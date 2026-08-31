# Research — #1458 typed completion mode for `toNetScriptChatResponse`

## The gap is a thin-wrapper omission, confirmed against the actual upstream types

`packages/fresh/src/runtime/ai/create-chat-connection.ts`'s `toNetScriptChatResponse()` /
`NetScriptChatResponseOptions` wraps the third-party `@durable-streams/tanstack-ai-transport`
package's `toDurableChatSessionResponse`. Read that package's actual shipped types
(`node_modules`-cache `src/types.ts`/`src/server.ts` for `@durable-streams/tanstack-ai-transport@0.0.8`,
the version this repo pins):

```ts
export type ToDurableStreamResponseMode = 'immediate' | 'await';
export type WaitUntil = (promise: Promise<unknown>) => void;
export type ToDurableChatSessionResponseOptions = {
  stream: DurableChatSessionStreamTarget;
  newMessages: Array<DurableSessionMessage>;
  responseStream: AsyncIterable<TanStackChunk>;
  mode?: ToDurableStreamResponseMode;
  waitUntil?: WaitUntil;
};
```

The transport function's own implementation confirms the issue's exact behavioral claim:

- `mode: 'await'`: awaits the write, then returns `new Response(null, { status: 200, ... })`; a
  write failure **rejects the promise** and propagates to the caller.
- default (`mode` unset) or explicit `mode: 'immediate'`: returns `new Response(null, { status: 202,
  ... })` **before** the write completes; the write continues via `options.waitUntil?.(backgroundTask)`
  if supplied, and any write failure is caught and only `console.error`'d — never surfaces to the
  caller.

`create-chat-connection.ts`'s `defaultToResponse` calls `toDurableChatSessionResponse({ stream,
newMessages, responseStream: source })` — **`mode` and `waitUntil` are never forwarded**, even though
the dependency already fully supports them. `NetScriptChatResponseOptions` has no field for either.

## Scope, precisely bounded — same shape as #1591

Add `mode?: 'immediate' | 'await'` and `waitUntil?: (task: Promise<unknown>) => void` to
`NetScriptChatResponseOptions`, thread both into `defaultToResponse`'s call to
`toDurableChatSessionResponse`, and (for symmetry — a caller supplying a custom `toResponse` adapter
must not have `mode`/`waitUntil` silently dropped) add both to the `toResponse` seam's own input
type. No new abstraction, no design decision beyond forwarding two already-typed upstream fields.

## Explicitly out of scope

No change to `@durable-streams/tanstack-ai-transport` itself (external dependency, pinned version).
No change to `resolveChatSnapshot`, `createNetScriptChatConnection`, or any read-path/live-subscription
code — this is a write-path (`toNetScriptChatResponse`) option only.
