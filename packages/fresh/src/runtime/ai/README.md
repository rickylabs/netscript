# `@netscript/fresh/ai`

The **durable-chat runtime plane** for NetScript Fresh apps: the server + island
seam that turns a Fresh route into a chat whose message history and in-flight
tool calls survive reload, reconnect, and multi-tab replay because they are
backed by a durable **session stream** rather than component state.

It composes three upstream libraries and adds only the NetScript glue — durable
URL resolution, auth headers, and the projection law below:

- `@durable-streams/tanstack-ai-transport` — durable session streams, snapshot
  materialization, `toDurableChatSessionResponse`.
- `@tanstack/ai-preact` — the `useChat` island hook + MCP app bridge.
- `@tanstack/ai` — server-side chat activity, tool definitions, MCP sources.

URL/auth resolution is **not** reimplemented here: it reuses the exact
`@netscript/plugin-streams-core` seam (`getStreamsUrl`, `getStreamsAuth`,
`buildStreamUrl`) that `@netscript/fresh/streams` uses. Every chat session is one
durable stream under `/ai/chat/{sessionId}`.

Apps with their own durable stream convention can override that subpath without
forking the runtime. Pass `streamPath` as either a static prefix (the `sessionId`
is appended) or as a per-session function that returns the full subpath:

```ts
const chat = createNetScriptChatConnection({
  target: { sessionId },
  streamPath: ({ sessionId }) => `/eischat/sessions/${sessionId}/messages`,
});
```

## StreamDB _shapes_ vs Durable _Sessions_

`@netscript/fresh/streams` and `@netscript/fresh/ai` look adjacent but model two
different things — conflating them is the doctrinal root of #219:

| Axis          | StreamDB _shapes_ (`./streams`)     | Durable _Sessions_ (`./ai`)                         |
| ------------- | ----------------------------------- | --------------------------------------------------- |
| Unit          | A collection/row shape (TanStack DB) | One chat session stream (append-only chunk log)     |
| Identity      | Row id inside a named shape         | `sessionId` (one durable stream per chat)           |
| Write model   | CRUD mutations reconciled into rows | Append-only sanitized chunks                        |
| Ordering      | Last-writer-wins per row            | Total order of chunks == the transcript             |
| What survives | The current materialized rows       | The full replayable event log (messages + tools)    |
| Read primitive | `useLiveQuery` over a shape        | `resolveChatSnapshot` + live `useChat` subscription |

A tool call is a multi-chunk, mid-stream event — it cannot be expressed as a
single reconciled row without losing the streaming/tool-card intermediate
states. `./streams` stays right for list/board/table live data; `./ai` owns
conversational, append-only, replayable sessions.

## THE ONE-PROJECTION LAW

The **seed/snapshot** projection used for SSR and first paint MUST run the
**same** projection code path as the **live** projection applied to incoming
chunks. Seed and live are two entry points into ONE reducer:

```text
messages --> [ projectChatSnapshot ] --> { messages, renderParts }
```

If seed and live diverge, **tool cards drift**: a card materialized at seed time
renders differently — or vanishes — once the first live chunk arrives, because
the two projections disagree about intermediate tool state. Therefore
`resolveChatSnapshot` (seed) and the FB2 live island reducer must be the literally
same `projectChatSnapshot` applied to the same session log.

## Public surface

### FA1 — connection, response, snapshot (implemented)

| Export                          | Kind     | Role                                                                                          |
| ------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `createNetScriptChatConnection` | function | Live handle to one session: `subscribe` / `send`, SR2-tolerant, F-13 `close`/`stop`/`dispose`. |
| `toNetScriptChatResponse`       | function | Turn a server chat stream into a durable session `Response`; `authorize`-gated (→ `403`).      |
| `resolveChatSnapshot`           | function | Seed snapshot for SSR / first paint; routes through `projectChatSnapshot`.                     |
| `projectChatSnapshot`           | function | The single projection reducer (`messages → { messages, renderParts }`). FB2 imports this.      |
| `NetScriptChatSessionTarget`    | type     | Addresses one session: `{ sessionId, baseUrl?, headers? }`.                                    |
| `NetScriptChatMessage`          | type     | Projected message: `{ id, role, content }`.                                                    |
| `RenderPart`                    | type     | Minimal renderable unit (`text` \| `tool` card) emitted by the reducer. FB2 widens it.         |
| `NetScriptChatSnapshot`         | type     | `{ messages, renderParts, offset }` — the reducer's output plus the replay cursor.             |
| `NetScriptChatAuthorize`        | type     | `(request, sessionId) => boolean \| Promise<boolean>`.                                         |
| `NetScriptChatStreamPath`       | type     | Static prefix or per-session subpath resolver for durable chat streams.                        |
| `NetScriptChatConnectionOptions`, `NetScriptChatResponseOptions`, `NetScriptChatSnapshotOptions` | type | Option bags for the three functions. |

**SR2 tolerance.** `createNetScriptChatConnection(...).subscribe()` complements
the service-side SR2 fix (204/bridge): a first-subscribe that races a
not-yet-created session stream (transient empty completion or transient error —
404/204/premature-close/network) is re-polled with exponential backoff
(`subscribeRetry`, default 5×250ms→5s cap) rather than surfacing as a terminal
error. Once real chunks flow it streams normally; a hard `401`/`403` propagates
immediately.

**Lifecycle (F-13).** A single idempotent teardown is surfaced as
`close()` / `stop()` / `dispose()` (parity with `NetScriptStreamDB`). Each aborts
an internal signal linked into every `subscribe`/`send`, so no subscription
leaks; `send` after dispose rejects.

**`authorize` — REQUIRED in production.** Per the ratified chat-authz decision
the hook is intentionally optional at the type level (the framework cannot prove
a caller is production), but the factory bakes in **no** default allow-all.
`toNetScriptChatResponse` enforces it: with `authorize` present it denies the
turn (`403 Forbidden`) unless the hook returns `true`, and throws if `authorize`
is supplied without a `request`. Ship a real `authorize` before exposing a chat
route publicly — without one the session stream is unauthenticated.

### FA2 — durable chat stream proxy (sibling slice #251, same subpath)

`createNetScriptChatStreamProxy` (a.k.a. the chat stream proxy handler) builds a
Fresh route handler that proxies the durable chat session stream (SSE / HTTP
stream passthrough with NetScript auth applied). It **fences #239**: gzip /
content-encoding transport and the plugins/streams HTTP proxy are owned there,
not in this subpath. It resolves the same `/ai/chat/{sessionId}` addressing
convention as FA1, so the island connection and the route proxy read one stream.
Code lands via #251; the surface is documented here for completeness.

The proxy always sends `Accept-Encoding: identity` to durable-streams before
sanitizing response headers. That prevents Deno's auto-decoder from failing
before the proxy can strip a mislabeled `content-encoding: gzip` header.

```ts
export const streamHandler = createNetScriptChatStreamProxy({
  target: (req) => ({ sessionId: sessionIdFrom(req) }),
  streamPath: ({ target }) => `/eischat/sessions/${target.sessionId}/messages`,
});
```

### FA3 — MCP `ui://` sandbox handler

`createMcpSandboxHandler` is exported from `@netscript/fresh/ai/sandbox`. It
builds a Fresh-compatible `GET` handler for sandboxed MCP UI resources. Mount it
on any route and request a registered resource with `?uri=ui://...`; non-`ui://`
or missing resource URIs return `400`, and resolver misses return `404`.

The caller owns two ports: `resolveResource(uri, { request, signal })` for the
registered resource body, and `themes` for design tokens. The handler wraps the
resource body in an isolated HTML document, injects only `--ns-*` custom
properties before that body, stamps `data-theme`, and applies both a
`Content-Security-Policy` response header and a matching meta tag derived from
the `ui://` URI. The incoming request's `AbortSignal` is passed to lookup ports
so registry/database work can cancel on disconnect.

`?theme=<name>` selects a token set. Unknown or absent themes fall back to
`defaultThemeName`; if omitted that documented fallback name is `default`. When
a record theme source does not contain the fallback name, the first record entry
is used instead.

```ts
import { createMcpSandboxHandler } from '@netscript/fresh/ai/sandbox';

export const handler = {
  GET: createMcpSandboxHandler({
    resolveResource: (uri, { signal }) => registry.lookup(uri, { signal }),
    themes: {
      default: { '--ns-color-surface': '#ffffff' },
      dark: { '--ns-color-surface': '#111111' },
    },
  }),
};
```

`createNetScriptMcpSandbox` (+ `NetScriptMcpToolSource`, `NetScriptMcpSandbox`,
`NetScriptMcpSandboxOptions`) is also exported from
`@netscript/fresh/ai/sandbox` and remains the chat-activity tool-wiring skeleton
(server `mergeAgentTools` + island `createMcpAppBridge`).

## End-to-end usage sketch

The path a simplified chat tutorial (durable chat + streaming markdown + one tool
call + one MCP widget + citations) follows:

```ts
// 1. SSR / route loader — seed the first paint from the durable session.
import {
  createNetScriptChatConnection,
  resolveChatSnapshot,
  toNetScriptChatResponse,
} from '@netscript/fresh/ai';

const target = { sessionId } as const;

// Loader: materialize the transcript so far (same reducer the island uses).
const snapshot = await resolveChatSnapshot({ target });
// snapshot -> { messages, renderParts, offset }  (offset seeds the live subscribe)
```

```tsx
// 2. Island — subscribe live, continuing from the seed offset.
const chat = createNetScriptChatConnection({
  target: { sessionId },
  initialOffset: snapshot.offset ?? undefined,
  authorize: (req, id) => sessionBelongsToUser(req, id), // REQUIRED in prod
});

try {
  for await (const chunk of chat.subscribe(signal)) {
    // fold chunk through the SAME projectChatSnapshot the seed used
  }
} finally {
  chat.dispose(); // F-13: idempotent teardown, no leak
}
```

```ts
// 3. Server turn — persist the user message + assistant stream durably.
export async function handler(req: Request): Promise<Response> {
  return toNetScriptChatResponse({
    target: { sessionId },
    request: req,
    authorize: (r, id) => sessionBelongsToUser(r, id), // -> 403 on deny
    newMessages: [{ id, role: 'user', content: prompt }],
    source: runChatActivity(prompt), // AsyncIterable of TanStack chunks
  });
}
```

```ts
// 4. Route proxy — expose the durable stream to the island (FA2 / #251).
import { createNetScriptChatStreamProxy } from '@netscript/fresh/ai';

export const streamHandler = createNetScriptChatStreamProxy({
  target: (req) => ({ sessionId: sessionIdFrom(req) }),
  streamPath: ({ target }) => `/eischat/sessions/${target.sessionId}/messages`,
});
```

Seed (`resolveChatSnapshot`) and live (`createNetScriptChatConnection.subscribe`)
share `projectChatSnapshot`, so tool cards rendered on first paint survive the
first live chunk unchanged — the ONE-PROJECTION LAW in practice.
