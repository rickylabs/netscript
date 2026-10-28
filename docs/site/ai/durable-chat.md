---
layout: layouts/base.vto
title: Durable chat
templateEngine: [vento, md]
order: 2
---

# Durable chat

`@netscript/fresh/ai` turns a Fresh route into a durable AI chat: message history and in-flight
tool calls survive reload, reconnect and multi-tab replay, because a durable session stream backs
them instead of component state. {{ comp.badge({ status: "alpha" }) }}

The subpath ships in `@netscript/fresh{{ releaseSpecifier }}`. It composes
`@durable-streams/tanstack-ai-transport`, `@tanstack/ai-preact` and `@tanstack/ai`, and adds
durable-stream URL resolution, server-side auth headers and the projection law below. It does not
import `@netscript/ai`, so it works with the [AI engine](/ai/engine/) but installs without it.

## Durable chat or a StreamDB shape

NetScript models real-time state in two planes. A StreamDB shape and a durable chat session are
both live and durable, but they model different things.

{{ comp.apiTable({
  caption: "Pick the plane by what you are modeling",
  columns: ["Axis", "StreamDB shapes (data)", "Durable chat sessions (AI chat)"],
  rows: [
    ["Unit", "A collection / row shape", "One chat session (append-only chunk log)"],
    ["Identity", "Keyed by row id inside a named shape", "Keyed by <code>sessionId</code>, one stream per chat"],
    ["Write model", "CRUD mutations reconciled into the shape", "Append-only sanitized chunks"],
    ["What survives", "The current materialized rows", "The full replayable log (messages + tool cards)"],
    ["Read primitive", "<code>useLiveQuery</code> over a shape", "<code>resolveChatSnapshot</code> + live <code>useChat</code>"],
    ["Use it for", "Lists, boards, tables, dashboards", "Conversational, streaming, tool-calling chat"]
  ]
}) }}

A chat needs the session plane because a tool call moves through
`pending → streaming → complete` across several chunks, and a single reconciled row would lose
those intermediate states. Use [durable streams](/durable-workflows/streams/) for live list, board
or table data.

## The primitives at a glance

{{ comp.apiTable({
  caption: "@netscript/fresh/ai — the durable-chat surface",
  rows: [
    { name: "createNetScriptChatStreamProxy", type: "(options) => handler", desc: "Build the durable chat-stream proxy handler. It resolves the session target (static or per request), proxies to the durable-stream URL with server auth, passes the body through unbuffered and tears down on client abort." },
    { name: "toNetScriptChatResponse", type: "(options) => Promise<Response>", desc: "Produce a durable-session `Response` from a server chat stream. It enforces `authorize` (a denial becomes `403`) before it touches the session stream. With `producer: { id, epoch }`, appends are fenced against stale writers." },
    { name: "resolveChatSnapshot", type: "(options) => Promise<NetScriptChatSnapshot>", desc: "Resolve the seed snapshot for SSR and first paint: materialize the session and reduce it through `projectChatSnapshot`." },
    { name: "projectChatSnapshot", type: "(messages) => {messages, renderParts}", desc: "The single projection reducer, deterministic and side-effect-free. The seed and live paths both route through it." },
    { name: "createNetScriptChatConnection", type: "(options) => NetScriptChatConnection", desc: "Open a live session handle: a `subscribe` that tolerates a stream that does not exist yet, a `send` that persists client messages, and one idempotent teardown (`close`/`stop`/`dispose`)." }
  ]
}) }}

## The one-projection law

`resolveChatSnapshot` (the SSR seed) and the live island projection run the same reducer,
`projectChatSnapshot`. They are two entry points into one function applied to one chunk log:

```text
chunks --> [ projectChatSnapshot ] --> { messages, renderParts }
```

If the seed path and the live path diverge, tool cards drift: a card materialized at seed time
renders differently, or vanishes, once the first live chunk arrives, because the two projections
disagree about intermediate tool state. Any projection you add must route both seed and live
through it.

> [!IMPORTANT]
> Never build a bespoke snapshot for SSR and a separate live reducer for the island. Seed the first
> paint with `resolveChatSnapshot`, which calls `projectChatSnapshot`, and hand its `offset` to the
> live subscription so seed and live read one continuous chunk log.

## The canonical chat-stream proxy

Every durable chat needs one route that proxies the browser's chat-stream request to the session's
durable-stream URL. `createNetScriptChatStreamProxy` is that route. It resolves the session target,
attaches server-side streams auth (`getStreamsAuth` by default), passes the upstream body through
unbuffered, strips headers that would misdescribe the re-framed bytes and propagates the client
`AbortSignal`, so a disconnect tears the upstream fetch down. Use it directly as a Fresh `Handlers`
entry.

```ts
// routes/api/chat/[sessionId].ts — the one canonical chat-stream proxy
import { createNetScriptChatStreamProxy } from "@netscript/fresh/ai";

const proxy = createNetScriptChatStreamProxy({
  // Resolve the session per request from the route param.
  target: (req) => ({
    sessionId: new URL(req.url).pathname.split("/").pop()!,
  }),
});

export const handler = { POST: proxy, GET: proxy };
```

> [!NOTE]
> This resolver is the one documented exception to NetScript's typed-route rule: `target` only
> receives the raw `Request`, so the session id is parsed from `req.url` by hand. Everywhere else,
> build URLs and read path params from a bound
> [`createRouteReference`](/reference/fresh/) contract.

`NetScriptChatStreamProxyOptions` takes a `target` (a `NetScriptChatSessionTarget` or a
`(request) => NetScriptChatSessionTarget` resolver), an optional `auth` header provider (default:
`getStreamsAuth` from `@netscript/plugin-streams-core`) and an optional `fetch` override for tests.
The returned handler accepts a bare `Request` or a Fresh route context (anything with `.req`), so
both `{ POST: handler }` and a direct call in a test work.

## Authorizing the session response

The proxy moves bytes; authorization happens where you produce the session response.
`toNetScriptChatResponse` sanitizes a server-side chat stream into durable chunks and returns the
session `Response`. Supply an `authorize` hook and the matching `request`: a denial yields
`403 Forbidden` and the session stream is never touched.

```ts
// The server turn: persist the assistant stream into the durable session, gated by authorize.
import { toNetScriptChatResponse } from "@netscript/fresh/ai";

const response = await toNetScriptChatResponse({
  target: { sessionId },
  request,
  // REQUIRED in production — return false to deny (=> 403).
  authorize: (req, id) => sessionBelongsToUser(req, id),
  newMessages, // client messages to persist before the assistant turn
  source: assistantChatStream, // AsyncIterable of server chat chunks
});
```

> [!CAUTION]
> There is no default allow-all. `NetScriptChatAuthorize = (request, sessionId) => boolean | Promise<boolean>`
> is optional at the type level, but without it `toNetScriptChatResponse` cannot gate access to the
> session stream. Ship a real `authorize` before you expose a chat route. Passing `authorize`
> without a `request` is a programming error and throws.

`newMessages` accepts `readonly NetScriptChatSendMessage[]`: server-trusted TanStack UI messages
with `parts`, Model messages with `content` and `toolCalls`, or the `{ id, role, content: string }`
form. Native parts and metadata are stored unchanged; Model content is also exposed as replay parts.
Validate client input before this seam, and give the model the same prompt that you persist. The
plugin-AI scaffold builds its own user turn from `message.text` and ignores client transcript
fields.

## Fencing a reclaimed chat executor

A chat turn that runs in the background, in a worker or saga under a service identity, can be
reclaimed: its lease expires, a new claim runs the turn again, and the old executor may still be
writing. Pass `producer` to fence it. Every append (the text echoes, the complete native
`newMessages` batch and each assistant chunk) then carries one durable-streams idempotent-producer
sequence `(id, epoch, seq)`, and the streams service rejects a writer whose epoch is older than the
newest one that has written. Fenced turns persist the same native message batch as the default
path, including non-text parts and metadata.

```ts
import { NetScriptChatProducerError, toNetScriptChatResponse } from "@netscript/fresh/ai";

try {
  await toNetScriptChatResponse({
    target: { sessionId: turn.sessionId },
    newMessages: turn.newMessages,
    source: assistantChatStream,
    mode: "await", // the executor waits for every append to be acknowledged
    // id: stable across retries of this turn. epoch: this claim's generation.
    producer: { id: `chat-turn:${turn.sessionId}:${turn.id}`, epoch: claim.generation },
  });
} catch (error) {
  if (error instanceof NetScriptChatProducerError && error.kind === "stale-epoch") {
    // A newer claim (error.currentEpoch) owns this turn; nothing from this writer was stored.
    return;
  }
  throw error;
}
```

- **The caller owns the epoch.** NetScript never claims or bumps an epoch, and `autoClaim` stays
  off, because re-claiming a stale epoch would defeat fencing. Use a non-negative integer that
  increases on every claim of the turn, such as a claim counter or row version. When your job
  runtime exposes a lease or claim generation, use that.
- **A replay under the same pair is deduplicated chunk by chunk.** Each chunk is its own producer
  batch, so its sequence number is its index in the turn: text echoes first, then the native batch,
  then the assistant chunks. Replaying a turn under the same `(id, epoch)` appends only the chunks
  an earlier call never stored. The service drops an already-stored index without comparing
  content, so use one id per turn.
- **A new epoch starts a new sequence.** A newer claim rewrites the turn from index `0`; whatever an
  older claim stored before it was fenced stays in the transcript.
- **One request per chunk.** Fenced turns trade batching for determinism: each chunk is its own
  request, with at most five in flight.
- **Fencing starts once the newer claim has written.** Until the new epoch's first append, the
  service has not seen it, so it still accepts an older writer.
- **Errors are typed.** A rejected append becomes a `NetScriptChatProducerError` whose `kind` uses
  the State Protocol producer vocabulary (`'stale-epoch'`, `'sequence-gap'`, `'stream-closed'`,
  `'retryable'`, ...). It is thrown in `'await'` mode or while echoing `newMessages`. In the default
  `'immediate'` mode, a failure after the `202` is only logged, so executors should use `'await'`.
- **Without `producer`, nothing changes.** The default unfenced path runs with no producer headers.

## Seeding first paint (SSR)

For SSR and first paint, materialize the session and reduce it through the projection reducer with
`resolveChatSnapshot`, then hand the returned `offset` to the live subscription.

```ts
import { resolveChatSnapshot } from "@netscript/fresh/ai";

const snapshot = await resolveChatSnapshot({ target: { sessionId } });
// snapshot.messages   -> ordered NetScriptChatMessage[]
// snapshot.renderParts -> transport RenderPart[] (text + tool cards)
// snapshot.offset      -> replay cursor for the live subscription (or null if empty)
```

`messages` and `renderParts` are the reduced rendering projection. `nativeMessages` holds the
complete persisted messages, including attachments, tools, structured data, metadata and opaque
future parts. Seed and live share the native replay reducer: native appends become standard
TanStack `MESSAGES_SNAPSHOT` chunks that contain the complete state, while ordinary assistant
chunks pass through. Message IDs reconcile text echoes and native batches without duplicates.

```ts
import { createNetScriptChatConnection, resolveChatSnapshot } from '@netscript/fresh/ai';

const target = { sessionId: 'chat-session' };
const seed = await resolveChatSnapshot({ target });
const connection = createNetScriptChatConnection({
  target,
  initialMessages: seed.nativeMessages,
  initialOffset: seed.offset ?? undefined,
});
// Also initialize the island's TanStack message state from seed.nativeMessages.
connection.dispose();
```

Pair the seed's native messages with its offset so the next native snapshot keeps the history. An
offset alone reads only the suffix; without an offset, the connection replays the complete stored
log and then follows live updates.

## The live connection

`createNetScriptChatConnection` opens the live session handle that the island subscribes to. Its
`subscribe` tolerates a first subscribe that races a not-yet-created stream: it re-polls with
backoff instead of throwing. `send` persists client messages, and `close`/`stop`/`dispose` are one
idempotent teardown, so no connection leaks.

```ts
import { createNetScriptChatConnection } from "@netscript/fresh/ai";

const chat = createNetScriptChatConnection({
  target: { sessionId },
  authorize: (req, id) => sessionBelongsToUser(req, id), // REQUIRED in prod
  initialOffset: snapshot.offset ?? undefined, // continue from the seed cursor
});

try {
  for await (const chunk of chat.subscribe(signal)) {
    render(chunk);
  }
} finally {
  chat.dispose();
}
```

Logical readers share one physical SSE connection. Cancelling one reader leaves its peers active,
cancelling the last one closes the SSE, and disposal cancels all reads and sends. A later
subscription on the same connection resumes at the transport cursor with the existing replay
state; a reader that joins an active subscription receives subsequent chunks only.

## The transport RenderPart

The reducer emits a minimal, transport-level `RenderPart`: either reduced message `text` or a
`tool` card reduced from the chunk log. It is separate from the rich presentation `RenderPart` of
the [chat UI](/ai/chat-ui/), which widens this transport contract.

{{ comp.apiTable({
  caption: "RenderPart (transport) — @netscript/fresh/ai",
  rows: [
    { name: "kind", type: "\"text\" | \"tool\"", desc: "Whether this part renders message text or a tool card." },
    { name: "id", type: "string", desc: "Stable id of this part within the transcript." },
    { name: "role", type: "\"system\" | \"user\" | \"assistant\" | \"tool\"", desc: "Author role the part belongs to." },
    { name: "text", type: "string?", desc: "Reduced text (present when `kind === 'text'`)." },
    { name: "toolName", type: "string?", desc: "Invoked tool name (present when `kind === 'tool'`)." },
    { name: "toolState", type: "\"pending\" | \"streaming\" | \"complete\" | \"error\"", desc: "Lifecycle state of the tool card reduced from the chunk log." },
    { name: "input", type: "unknown?", desc: "Reduced tool input (may be partial while `streaming`)." },
    { name: "output", type: "unknown?", desc: "Reduced tool output, present once `complete`." }
  ]
}) }}

The message and session shapes are small: `NetScriptChatMessage` (`{ id, role, content }`),
`NetScriptChatSessionTarget` (`{ sessionId, baseUrl?, headers? }`, one durable stream per
`sessionId`) and `NetScriptChatSnapshot` (`{ messages, renderParts, offset }`).

## The `ui://` sandbox

`@netscript/fresh/ai/sandbox` serves themed `ui://` resources for MCP-driven UI through
`createMcpSandboxHandler`: a Fresh route handler that serves the registered `ui://` resource
selected by `?uri=`, injects the active theme's `--ns-*` custom properties, stamps `data-theme`
and applies a per-response CSP derived from the resource URI. `?theme=` selects a token set; an
absent or unknown theme falls back to `defaultThemeName` (default `"default"`).

```ts
// routes/mcp/sandbox.ts
import { createMcpSandboxHandler } from "@netscript/fresh/ai/sandbox";

export const handler = {
  GET: createMcpSandboxHandler({
    resolveResource: (uri, { signal }) => registry.lookup(uri, { signal }),
    themes: {
      default: { "--ns-color-surface": "#ffffff" },
      dark: { "--ns-color-surface": "#111111" },
    },
  }),
};
```

## Next steps

Render this transcript with the [chat UI](/ai/chat-ui/) components.

- [Build a durable chat](/ai/how-to/build-a-durable-chat/) wires the session route, proxy, seed and
  island step by step.
- The [`@netscript/fresh` reference](/reference/fresh/) lists every export of the `/ai` and
  `/ai/sandbox` subpaths.
- [MCP](/ai/mcp/) explains where `ui://` resources come from.
