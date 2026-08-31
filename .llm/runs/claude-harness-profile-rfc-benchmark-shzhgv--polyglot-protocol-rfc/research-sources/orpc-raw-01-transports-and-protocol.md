# oRPC raw extract 01 — transports, message-port, RPC protocol/serializer (v1 + v2)

Fetch date: 2026-08-20. Group: `orpc`.

Fetch method note: `WebFetch` on these pages returns lossy LLM summaries. All content below was
retrieved via `curl` against the docs sites' machine-readable `.md` mirrors (both sites expose
`/llms.txt` plus `<page>.md`), so shapes/option names are verbatim from the published source.

Sources fetched (all HTTP 200):

- https://orpc.dev/llms.txt (v1 site index)
- https://orpc.dev/docs/adapters/message-port.md
- https://orpc.dev/docs/rpc-handler.md
- https://orpc.dev/docs/client/rpc-link.md
- https://orpc.dev/docs/advanced/rpc-protocol.md
- https://orpc.dev/docs/advanced/rpc-json-serializer.md
- https://orpc.dev/docs/adapters/websocket.md
- https://orpc.dev/docs/adapters/web-workers.md
- https://orpc.dev/docs/file-upload-download.md
- https://orpc.dev/docs/event-iterator.md
- https://v2.orpc.dev/llms.txt (v2 beta site index)
- https://v2.orpc.dev/docs/adapters/message-port.md
- https://v2.orpc.dev/docs/binary-data.md
- https://v2.orpc.dev/docs/adapters/websocket.md
- https://v2.orpc.dev/docs/rpc/protocol.md
- https://v2.orpc.dev/docs/rpc/serializer.md
- https://v2.orpc.dev/docs/rpc/handler.md
- https://v2.orpc.dev/docs/rpc/link.md
- https://v2.orpc.dev/docs/async-iterator-object.md
- https://v2.orpc.dev/docs/migrations/from-v1.md

Local copies of every fetched `.md` are kept under
`/home/user/netscript/.llm/tmp/docs/orpc-src/` (prefixes `v1-*`, `v2-*`).

---

## 1. Official transport/adapter inventory

### v1 adapter list (from https://orpc.dev/llms.txt, "Adapters" section, verbatim titles)

HTTP; Websocket; Message Port; Astro; Browser; Electron; Elysia; Express.js; Fastify; H3; Hono;
Next.js; Nuxt.js; React Native; Remix; Solid Start; Svelte Kit; TanStack Start; Web Workers;
Worker Threads.

Transport families reduce to three: **HTTP/fetch**, **WebSocket**, **Message Port**. The remaining
entries are host-framework bindings on top of HTTP, or Message Port bindings (Browser, Electron,
Web Workers, Worker Threads).

### v2 adapter list (from https://v2.orpc.dev/llms.txt, adapter pages referenced)

`adapters/aws-lambda`, `adapters/fastify`, `adapters/fetch-api`, `adapters/message-port`,
`adapters/node-http`, `adapters/react-native`, `adapters/websocket`.

Same three transport families. No stdio / pipe / Unix-socket adapter exists in either major.

---

## 2. Message Port adapter

### v1 — https://orpc.dev/docs/adapters/message-port.md

> oRPC offers built-in support for common Message Port implementations, enabling easy internal
> communication between different processes.

Environment table (verbatim):

| Environment | Documentation |
| --- | --- |
| [Electron Message Port](https://www.electronjs.org/docs/latest/tutorial/message-ports) | Adapter Guide `/docs/adapters/electron` |
| Browser (extension background to popup/content, window to window, etc.) | `/docs/adapters/browser` |
| [Node.js Worker Threads Port](https://nodejs.org/api/worker_threads.html#workerparentport) | `/docs/adapters/worker-threads` |

Basic usage (three code blocks, verbatim):

```ts [bridge]
const channel = new MessageChannel()
const serverPort = channel.port1
const clientPort = channel.port2
```

```ts [server]
import { RPCHandler } from '@orpc/server/message-port'
import { onError } from '@orpc/server'

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error)
    }),
  ],
})

handler.upgrade(serverPort, {
  context: {}, // Provide initial context if needed
})

serverPort.start()
```

```ts [client]
import { RPCLink } from '@orpc/client/message-port'

const link = new RPCLink({
  port: clientPort,
})

clientPort.start()
```

**Pair contract as documented:** the adapter does not expose `postMessage`/`addEventListener`
directly. The contract is: server side calls `handler.upgrade(port, { context })`; client side
constructs `new RPCLink({ port })`; **both sides must call `port.start()`**. The port object need
not be a `MessagePort` — the Web Workers adapter passes `self` (inside the worker) and a `Worker`
instance (main thread), so the required duck-type is "has `postMessage` and `addEventListener`
/`on('message')`" as satisfied by MessagePort, Worker, `self`, Electron MessagePortMain, and
`node:worker_threads` ports.

#### Transfer section (v1, `#transfer`) — verbatim

> By default, oRPC serializes request/response messages to string/binary data before sending over
> message port. If needed, you can define the `transfer` option to utilize full power of
> [MessagePort: postMessage() method](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort/postMessage),
> such as transferring ownership of objects to the other side or support unserializable objects like
> `OffscreenCanvas`.

```ts [handler]
const handler = new RPCHandler(router, {
  experimental_transfer: (message, port) => {
    const transfer = deepFindTransferableObjects(message) // implement your own logic
    return transfer.length ? transfer : null // only enable when needed
  }
})
```

```ts [link]
const link = new RPCLink({
  port: clientPort,
  experimental_transfer: (message) => {
    const transfer = deepFindTransferableObjects(message) // implement your own logic
    return transfer.length ? transfer : null // only enable when needed
  }
})
```

Warning (verbatim):

> When `transfer` returns an array, messages using
> [the structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
> for sending, which doesn't support all data types such as
> [Event Iterator's Metadata](/docs/event-iterator#last-event-id-event-metadata). So I recommend you
> only enable this when needed.

Tip (verbatim):

> The `transfer` option run after [RPC JSON Serializer](/docs/advanced/rpc-json-serializer) so you
> can combine them together to support more data types.

Note the signatures differ by side: handler gets `(message, port)`, link gets `(message)`. Return
value is `Transferable[] | null`; `null`/empty means "stay on the default string/binary encoding".

### v2 — https://v2.orpc.dev/docs/adapters/message-port.md

Page title/description: "Message Port Adapter — Use oRPC over the Message Port API to communicate
between contexts such as iframes, web workers, and service workers." (v2 drops the explicit
Electron/Worker-Threads environment table and states contexts in prose.)

Same bridge/server/client shape; deltas vs v1:

```ts Server
handler.upgrade(serverPort, {
  /**
   * Provide initial context if needed. The context can be an async function
   * that receives the per-call request as its first argument, and is **not**
   * related to the initial upgrade request.
   */
  context: request => ({}),
})

serverPort.start()
```

```ts Client
import { RPCLink } from '@orpc/client/message-port'
import { onError } from '@orpc/client'

const link = new RPCLink({
  port: clientPort,
  interceptors: [
    onError((error) => { console.error(error) }),
  ],
  /**
   * Optional headers to attach to each per-call request.
   * These can be accessed in the server context or via the Request Headers Plugin.
   */
  headers: () => ({})
})

clientPort.start()
```

v2 transfer section is textually identical for the option name (`experimental_transfer`, still
experimental in v2) and the two signatures. The link example in v2 omits `port` in the snippet but
the option still exists. v2 warning wording changed:

> When `transfer` returns an array, messages are sent using the structured clone algorithm, which
> doesn't support all data types. If you need to support additional data types, consider customizing
> your [RPC Serializer](/docs/rpc/serializer).

(v1 pointed at RPC JSON Serializer + named Event Iterator metadata as the concrete casualty; v2
generalizes and points at the new `RPCSerializer`.)

### Web Workers adapter (v1) — https://orpc.dev/docs/adapters/web-workers.md

Explicitly notes Web Workers exist in Bun and Deno. Worker side:

```ts
import { RPCHandler } from '@orpc/server/message-port'
handler.upgrade(self, { context: {} })
```

Main thread side:

```ts
import { RPCLink } from '@orpc/client/message-port'
export const link = new RPCLink({ port: new Worker('some-worker.ts') })
```

Note: inside the worker `handler.upgrade(self, ...)` is used **without** a `.start()` call; the
`.start()` requirement is specific to `MessageChannel` ports.

---

## 3. WebSocket adapter

### v1 — https://orpc.dev/docs/adapters/websocket.md

Server adapter table (verbatim):

| Adapter | Target |
| --- | --- |
| `websocket` | MDN WebSocket API (Browser, Deno, Cloudflare Worker, etc.) |
| `crossws` | [Crossws](https://github.com/h3js/crossws) library (Node, Bun, Deno, SSE, etc.) |
| `ws` | [ws](https://github.com/websockets/ws) library (Node.js) |
| `bun-ws` | [Bun Websocket Server](https://bun.sh/docs/api/websockets) |

Two server-side call shapes exist:

- **Upgrade style** (`@orpc/server/websocket`, `@orpc/server/ws`): `handler.upgrade(socket, { context })`.
  Deno: `const { socket, response } = Deno.upgradeWebSocket(req); handler.upgrade(socket, { context: {} })`.
- **Per-message style** (`@orpc/server/crossws`, `@orpc/server/bun-ws`, Cloudflare hibernation):
  `handler.message(peerOrWs, message, { context })` on each message + `handler.close(peerOrWs)` on
  close. Cloudflare hibernation signature:
  `webSocketMessage(ws: WebSocket, message: string | ArrayBuffer)` → `await handler.message(...)`;
  `webSocketClose(ws)` → `handler.close(ws)`. The Hibernation Plugin is called out for Durable
  Object hibernation.

v1 client:

```ts
import { RPCLink } from '@orpc/client/websocket'
const websocket = new WebSocket('ws://localhost:3000')
const link = new RPCLink({ websocket })
```

> Tip: Use [partysocket](https://www.npmjs.com/package/partysocket) library for
> manually/automatically reconnect logic.

### v2 — https://v2.orpc.dev/docs/adapters/websocket.md

Server adapters collapse to two rows:

| Adapter | Target |
| --- | --- |
| `websocket` | MDN WebSocket API, `ws`, Bun's WebSocket, Deno's WebSocket, Cloudflare Hibernation WebSocket, uWebSockets |
| `crossws` | crossws |

`handler.upgrade(ws, { context: request => ({}) })` or `await handler.message(ws, message, {...})`
+ `await handler.close(ws)` (both now awaited in v2 examples). uWebSockets is newly documented
(`.ws('/*', { async message(ws, message, isBinary) {...}, async close(ws, code, message) {...} })`).

v2 client link — `connect` factory plus built-in reconnect:

```ts
import { RPCLink } from '@orpc/client/websocket'

const link = new RPCLink({
  connect: info => new WebSocket('ws://localhost:3000'),
  /**
   * Whether to connect immediately on initialization, instead of waiting
   * for the first call. Reduces latency for the first request.
   * @default false
   */
  connectOnInit: true,
  /**
   * Optional headers to attach to each per-call request.
   * These can be accessed in the server context or via the Request Headers Plugin.
   */
  headers: () => ({})
})
```

Reconnect config surface (verbatim defaults):

```ts
const link = new RPCLink({
  reconnect: {
    enabled: true,                                    // @default false
    delay: info => info.attempt === 1 ? 0 : 2_000,    // @default same expression
    maxAttempt: Infinity,                             // @default Infinity; "Should greater than 1";
                                                      // when exceeded, `getConnectedPeer` throws
    onClose: {
      enabled: false, // @default false — proactively reconnect right after socket closes
      delay: 0        // @default 0
    }
  }
})
```

---

## 4. RPC protocol wire format (HTTP)

### v1 — https://orpc.dev/docs/advanced/rpc-protocol.md

- **Routing:** procedure chosen by `pathname`. `curl https://example.com/rpc/planet/create` calls
  `planet.create` with `/rpc` prefix.
- **Input:** "Any HTTP method can be used. Input can be provided via URL query parameters or the
  request body, based on the HTTP method." Default `StrictGetMethodPlugin` blocks GET except for
  procedures explicitly allowed.

Query form: `url.searchParams.append('data', JSON.stringify({ json: { name: 'Earth', detached_at:
'2022-01-01T00:00:00.000Z' }, meta: [[1, 'detached_at']] }))`.

Body form: `POST` with `Content-Type: application/json` and body
`{"json":{"name":"Earth","detached_at":"2022-01-01T00:00:00.000Z"},"meta":[[1,"detached_at"]]}`.

File form (multipart):

```ts
const form = new FormData()
form.set('data', JSON.stringify({
  json: { name: 'Earth', thumbnail: {}, images: [{}, {}] },
  meta: [[1, 'detached_at']],
  maps: [['images', 0], ['images', 1]]
}))
form.set('0', new Blob([''], { type: 'image/png' }))
form.set('1', new Blob([''], { type: 'image/png' }))
```

Success response — status 200–299, `Content-Type: application/json`:

```json
{ "json": { "id": "1", "name": "Earth", "detached_at": "2022-01-01T00:00:00.000Z" },
  "meta": [[0, "id"], [1, "detached_at"]] }
```

Error response — status 400–599, body is an `ORPCError` object:

```json
{ "json": { "defined": false, "code": "INTERNAL_SERVER_ERROR", "status": 500,
            "message": "Internal server error", "data": {} },
  "meta": [] }
```

**Meta format (v1):** `[type: number, ...path: (string | number)[]]` where `type` is a numeric type
code and `path` locates the value inside `json`.

v1 numeric type table (verbatim):

| Type | Description |
| --- | --- |
| 0 | bigint |
| 1 | date |
| 2 | nan |
| 3 | undefined |
| 4 | url |
| 5 | regexp |
| 6 | set |
| 7 | map |

**Maps:** "The `maps` field is used with `FormData` to map a file or blob to a specific path in
`json`."

### v2 — https://v2.orpc.dev/docs/rpc/protocol.md

- Routing identical (pathname).
- **Sending input:** "Requests can use the `POST`, `PUT`, `PATCH`, or `DELETE` method, or other
  methods like `GET` and `QUERY` when the server allows them. Send input in the query string (`GET`)
  or request body (other methods)."
- **Meta keys became strings.** Same examples now read `meta: [['date', 'detached_at']]` and
  `meta: [["bigint", "id"], ["date", "detached_at"]]`.
- **`maps` no longer requires `meta`** in the file example: `maps: [['thumbnail'], ['images', 0]]`.
- Success: "should use an HTTP status code in the `2xx` range (must be less than `400`)".
- Error body gains `inferable`, loses `status`:

```json
{ "json": { "defined": false, "inferable": false, "code": "INTERNAL_SERVER_ERROR",
            "message": "Internal server error", "data": { "id": "1234567890" } },
  "meta": [["bigint", "data", "id"]] }
```

- Error: "should use an HTTP status code in the `4xx` or `5xx` range (must be greater than or equal
  to `400`)".
- New cross-origin header requirement, repeated verbatim on the protocol / serializer / handler /
  link / binary-data pages: "To better support `Blob`, `File`, and `ReadableStream<Uint8Array>` at
  the root level in cross-origin scenarios, extend your CORS allowlist to allow clients to send and
  receive the `Content-Disposition` and `Standard-Server` headers" — i.e.
  `new CORSHandlerPlugin({ allowHeaders: ['Content-Disposition', 'Standard-Server'], exposeHeaders: ['Content-Disposition', 'Standard-Server'] })`.

---

## 5. Serializer

### v1 supported data types — https://orpc.dev/docs/rpc-handler.md

`string`, `number` (including `NaN`), `boolean`, `null`, `undefined`, `Date` (including
`Invalid Date`), `BigInt`, `RegExp`, `URL`, `Record (object)`, `Array`, `Set`, `Map`,
`Blob` (unsupported in `AsyncIteratorObject`), `File` (unsupported in `AsyncIteratorObject`),
`AsyncIteratorObject` (only at the root level; powers the Event Iterator).

No `ReadableStream<Uint8Array>` in v1.

### v1 custom serializers — https://orpc.dev/docs/advanced/rpc-json-serializer.md

```ts
export const userSerializer: StandardRPCCustomJsonSerializer = {
  type: 21,
  condition: data => data instanceof User,
  serialize: data => data.toJSON(),
  deserialize: data => new User(data.id, data.name, data.email, data.age),
}
```

> Ensure the `type` is unique and greater than `20` to avoid conflicts with built-in types in the
> future.

Wired via `customJsonSerializers: [userSerializer]` on **both** `new RPCHandler(router, {...})` and
`new RPCLink({ url, ... })`. Built-in overrides reuse the numeric type, e.g. `{ type: 3, condition:
data => data === undefined, serialize: data => null, deserialize: data => undefined }` — the docs
note "oRPC represents `undefined` only in array items and ignores it in objects."

### v2 — https://v2.orpc.dev/docs/rpc/serializer.md

Supported types table (verbatim, note the "Handler key" column — this is the new string vocabulary):

| Type | Handler key | Notes |
| --- | --- | --- |
| string | | |
| number | | |
| NaN | `nan` | |
| boolean | | |
| null | | |
| undefined | `undefined` | Ignore `undefined` properties |
| Date | `date` | Includes `Invalid Date`. |
| BigInt | `bigint` | |
| RegExp | `regexp` | |
| URL | `url` | |
| Record (object) | | `toJSON` methods are ignored |
| Array | | |
| Set | `set` | |
| Map | `map` | |
| Blob | | Unsupported in `AsyncIteratorObject` |
| File | | Unsupported in `AsyncIteratorObject` |
| AsyncIteratorObject | | Only at the root level |
| `ReadableStream<Uint8Array>` | | Only at the root level |

Custom serializer construction:

```ts
import { RPCSerializer } from '@orpc/client'

const serializer = new RPCSerializer({
  handlers: {
    person: { // <- add support for Person
      condition: v => v instanceof Person,
      serialize: (v: Person) => ({ name: v.name, age: v.age }),
      deserialize: v => new Person(v.name, v.age),
    },
    date: { // <- replace the default Date handler
      condition: v => v instanceof Date,
      serialize: (v: Date) => v.getTime(),
      deserialize: v => new Date(v),
    },
  },
})

const handler = new RPCHandler(router, { serializer })
const link = new RPCLink({ serializer })
```

**Serialization format (v2), verbatim:** two optional fields `json` and `meta`.
`meta` is `[handler: string, ...path: (string | number)[]]`.

```json
{ "json": { "name": "John", "age": 30, "createdAt": "2024-01-01T00:00:00.000Z" },
  "meta": [ ["date", "createdAt"] ] }
```

**With files:** serializer returns a `FormData`; the `data` field holds a JSON string with `json`,
`meta`, and `maps`; remaining fields hold the file parts.

> `maps` is stored in the format `[...path: (string | number)[]]`, and its order corresponds to the
> file parts in the `FormData`. For example, `[['thumbnail'], ['images', 0]]` means the first file
> part corresponds to `json.thumbnail` at `form.get('0')`, and the second file part corresponds to
> `json.images[0]` at `form.get('1')`.

**Direct file** (whole payload is one Blob/File, no FormData wrapper):

```http
HTTP/1.1 200 OK
Content-Type: image/png
Content-Disposition: attachment; filename="earth.png"
Content-Length: 12345
Standard-Server: file

<binary data>
```

**AsyncIteratorObject** → SSE stream, one serialized chunk per event:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

event: message
data: {"json":{"name":"John","createdAt":"2024-01-01T00:00:00.000Z"},"meta":[["date","createdAt"]]}

event: message
data: {"json":{"name":"Jane","createdAt":"2024-01-02T00:00:00.000Z"},"meta":[["date","createdAt"]]}
```

**`ReadableStream<Uint8Array>`** — passed through as-is:

```http
HTTP/1.1 200 OK
Content-Type: application/octet-stream
Standard-Server: octet-stream

<binary chunk 1>
<binary chunk 2>
```

`Standard-Server` header values seen: `file`, `octet-stream`. Purpose (verbatim): "If the receiver
mistakenly handles this payload as a regular (non-file) body, set the `standard-server` header to
help the receiver detect the actual data type and handle it correctly." Reference:
https://github.com/middleapi/standardserver#how-body-parsing-works

Serializer source pointer given by the docs:
https://github.com/middleapi/orpc/blob/main/packages/client/src/rpc-serializer.ts
(note: v2 repo org is `middleapi/orpc`, not `unnoq/orpc`.)

---

## 6. Handler / Link config surfaces

### v1 `RPCHandler` — https://orpc.dev/docs/rpc-handler.md

> `RPCHandler` is designed exclusively for RPCLink and **does not** support OpenAPI. Avoid sending
> requests to it manually.

> This documentation is focused on the HTTP Adapter. Other adapters may remove or change options to
> keep things simple.

```ts
const handler = new RPCHandler(router, {
  plugins: [ new CORSPlugin() ],
  interceptors: [ onError((error) => { console.error(error) }) ],
})

const { matched, response } = await handler.handle(request, {
  prefix: '/rpc',
  context: {}
})
```

Filtering: `filter: ({ contract, path }) => !contract['~orpc'].route.tags?.includes('internal')`.

Default plugins table: `StrictGetMethodPlugin`, applies to HTTP Adapter, toggle option
`strictGetMethodPluginEnabled`.

Lifecycle interceptor stages named in the v1 mermaid diagram: `adaptorInterceptors` →
`rootInterceptors` → `interceptors` → `clientInterceptors`.

### v2 `RPCHandler` — https://v2.orpc.dev/docs/rpc/handler.md

**Supported HTTP methods (new security default):**

> By default, `RPCHandler` only responds to `POST`, `PUT`, `PATCH`, and `DELETE` requests. Any other
> method, such as `GET` or `HEAD`, is treated as unmatched, as if no procedure exists at that path.

```ts
const handler = new RPCHandler(router, {
  allowMethods: ['POST', 'PUT', 'PATCH', 'DELETE', 'QUERY'],
})
```

`QUERY` is the draft HTTP safe-method-with-body
(https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/) — "reads input from the
request body and stays preflight-protected". Constant `RPC_DEFAULT_ALLOW_METHODS` exported from
`@orpc/server/standard`. `allowMethods` may also be a function `(method, procedure, path) => boolean`.

Enabling GET requires `GetMethodCsrfProtectionHandlerPlugin` (from `@orpc/server/plugins`) or
`SameSite=Strict` cookies.

Interceptor vocabulary (v2): `routingInterceptors` (every request, pre-routing; may return
`{ matched: false }`), `interceptors` (matched requests only, before error handling, gets
`procedure`), `clientInterceptors` (after input decode / before output encode, may throw
`ORPCError`), adapter interceptors named per adapter (`fetchInterceptors`).

Other options: `plugins`, `serializer` (an `RPCSerializer` instance), `filter: (contract, path) =>
boolean` (positional now), `errorStatusMap`.

`COMMON_ERROR_STATUS_MAP` (verbatim, from `@orpc/server`) — this is the error-code vocabulary:

| Error Code | HTTP Status |
| --- | ---: |
| BAD_REQUEST | 400 |
| UNAUTHORIZED | 401 |
| PAYMENT_REQUIRED | 402 |
| FORBIDDEN | 403 |
| NOT_FOUND | 404 |
| METHOD_NOT_SUPPORTED | 405 |
| NOT_ACCEPTABLE | 406 |
| TIMEOUT | 408 |
| CONFLICT | 409 |
| GONE | 410 |
| PRECONDITION_FAILED | 412 |
| PAYLOAD_TOO_LARGE | 413 |
| UNSUPPORTED_MEDIA_TYPE | 415 |
| UNPROCESSABLE_CONTENT | 422 |
| PRECONDITION_REQUIRED | 428 |
| TOO_MANY_REQUESTS | 429 |
| CLIENT_CLOSED_REQUEST | 499 |
| INTERNAL_SERVER_ERROR | 500 |
| NOT_IMPLEMENTED | 501 |
| BAD_GATEWAY | 502 |
| SERVICE_UNAVAILABLE | 503 |
| GATEWAY_TIMEOUT | 504 |

**Event stream options (v2, fetch adapter), verbatim with defaults:**

```ts
const handler = new RPCHandler(router, {
  toFetchResponse: {
    eventStream: {
      initialComment: {
        enabled: true,   // @default true — initial comment sent immediately to flush headers
        comment: '',     // @default '' — must not include newline characters
      },
      keepAlive: {
        enabled: true,   // @default true — periodic ping comment
        interval: 15000, // @default 15000 ms, measured after the last event
        comment: '',     // @default ''
      },
      emptyCloseEventEnabled: true, // @default true — send `close` even when iterator completes with undefined
    },
  },
})
```

(Node adapter uses `sendStandardResponse` instead of `toFetchResponse`.)

### v1 `RPCLink` — https://orpc.dev/docs/client/rpc-link.md

```ts
const link = new RPCLink({
  url: 'http://localhost:3000/rpc',
  headers: () => ({ 'x-api-key': 'my-api-key' }),
  fetch: (request, init) => globalThis.fetch(request, { ...init, credentials: 'include' }),
  interceptors: [ onError(error => console.error(error)) ],
})
export const client: RouterClient<typeof router> = createORPCClient(link)
```

- Client context: `new RPCLink<ClientContext>({ headers: async ({ context }) => ({...}) })`;
  call site `client.planet.list({ limit: 10 }, { context: { something: 'value' } })`.
- Default method is `POST`; `method: ({ context }, path) => 'GET' | 'POST'`; helper
  `inferRPCMethodFromContractRouter(contract)` from `@orpc/contract`.
- `url` may be a function (lazy URL).
- "Unlike traditional SSE, the Event Iterator does not automatically retry on error." → Client Retry
  Plugin.
- Lifecycle stages: `interceptors` → `clientInterceptors` → `adapterInterceptors`.

### v2 `RPCLink` — https://v2.orpc.dev/docs/rpc/link.md

```ts
const link = new RPCLink({
  origin: 'https://example.com',
  url: '/rpc',
  headers: ({ context }) => ({ authorization: `Bearer ${token}` }),
  interceptors: [ /* around the whole call */ ],
  plugins: [ new RetryAfterLinkPlugin() ],
  fetch: (request, init) => { /* only available in fetch adapter */ },
})
```

- `origin`: "Server protocol and domain. Omit in the browser to use the current origin."
- `url`: "Usually a path prefix like `/api`. May include query params that are added to every
  request."
- `headers`: "Headers sent with every request... Keys should be lowercase."
- Each may be a function of `{ path, context }`.
- Interceptor vocabulary: `interceptors` (whole call), `transportInterceptors` (after input
  encoding, before response decoding; receives `options.request` with `headers`),
  `fetchInterceptors` (fetch adapter; access to final `url` and `RequestInit`).
- `serializer: new RPCSerializer({ handlers: {...} })`.
- Method: default `POST`; `method: ({ context }, path) => 'GET' | 'POST'`.
- **Malformed responses:** when the link cannot decode a response (proxy/gateway answered), it
  produces an `ORPCError` with code `MALFORMED_ORPC_RESPONSE`, `cause` is a `MalformedResponseError`
  carrying `.response.status` and `.response.body`.
- Event stream options mirror the handler under `toFetchRequest.eventStream` (same
  `initialComment` / `keepAlive` / `emptyCloseEventEnabled` shape and defaults).
- Lifecycle: caller → `interceptors` → encode request → `transportInterceptors` → transport →
  adapter interceptors → server.

---

## 7. Binary / File / Blob handling

### v1 — https://orpc.dev/docs/file-upload-download.md

> oRPC natively supports standard File and Blob objects. You can even combine files with complex
> data structures like arrays and objects for upload and download operations.

> For uploading files larger than 100 MB, we recommend using a dedicated upload solution or
> extending the body parser..., as **oRPC does not support chunked or resumable uploads**.

> For downloading files, we recommend using **lazy file** libraries like `@mjackson/lazy-file` or
> `Bun.file` to reduce memory usage.

### v2 — https://v2.orpc.dev/docs/binary-data.md

> `File`, `Blob`, and `ReadableStream<Uint8Array>` are supported by the RPC Serializer and OpenAPI
> Serializer.

> `File` and `Blob` are buffered in memory by default. For large files on Node, use the
> [Tmp File Upload Plugin](/docs/plugins/tmp-file-upload) to stream uploads into temporary files
> instead.

`ReadableStream<Uint8Array>` example returns a stream and sets `Content-Type` via
`context.resHeaders?.set(...)` (Response Headers Plugin, `ResponseHeadersHandlerPluginContext`).

---

## 8. Event iterator / AsyncIteratorObject (streaming) per transport

### v1 — https://orpc.dev/docs/event-iterator.md

- Defined by an async generator handler: `os.handler(async function* ({ input, lastEventId }) {...})`.
- Validation helper `eventIterator(schema)` from `@orpc/server` (Standard Schema).
- `withEventMeta(data, { id: 'some-id', retry: 10_000 })` attaches SSE event id/retry; on reconnect
  the client sends it back and the handler reads `lastEventId`.
- `return` ends the stream and marks it successfully completed — "This behavior is exclusive to
  oRPC. Standard SSE clients, such as those using EventSource will automatically reconnect when the
  connection closes."
- Cleanup via `finally` block when the client closes the connection.
- Pairs with the Publisher Helper for resume support.

### v2 — https://v2.orpc.dev/docs/async-iterator-object.md

- Renamed Event Iterator → **AsyncIteratorObject**. Handler signature now
  `async function* ({ input, signal, lastEventId })` — a `signal` is provided.
- "When the client closes the connection or an unexpected error occurs, oRPC aborts the provided
  `signal`. Use it to exit loops and avoid resource leaks. Put cleanup logic in a `finally` block."
- `withEventMeta` unchanged in role; resume via `lastEventId`.
- Publisher: `publisher.subscribe('something-updated', { signal, lastEventId })`.

**Per-transport availability:** streaming is a first-class part of the RPC protocol, not an
HTTP-only feature. Over HTTP it is SSE (`text/event-stream`). Over WebSocket / Message Port / any
peer transport it is carried as `MessageType.EVENT_ITERATOR` frames of the peer protocol (see
extract 02). The one documented transport-specific hole is v1 Message Port with
`experimental_transfer` enabled: structured clone "doesn't support all data types such as Event
Iterator's Metadata".

---

## 9. v1 → v2 migration deltas relevant to transports

From https://v2.orpc.dev/docs/migrations/from-v1.md.

**Wire format changes** (verbatim):

> Two formats changed on the wire:
> - The RPC serializer format, described in the RPC Protocol.
> - The error response body, which adds an `inferable` field and no longer contains a `status`
>   field, since `status` was removed from errors.
>
> Because of these changes, a v1 RPC Link or OpenAPI Link **cannot talk to a v2 server (and vice
> versa)**. Deploy the upgraded server and clients together.

**RPC Handler:**

- GET rejected by default: v1's `StrictGetMethodPlugin` + `strictGetMethodPluginEnabled` removed in
  favor of `allowMethods`, default `['POST', 'PUT', 'PATCH', 'DELETE']`.
- `rootInterceptors` → `routingInterceptors`; `adapterInterceptors` → `fetchInterceptors` (named per
  adapter).
- `filter` takes positional args: v2 `filter: (contract, path) => ...` vs v1
  `filter: ({ contract, path }) => ...`. "The v1 destructured form still type-checks but reads the
  wrong values."
- `customJsonSerializers` (numeric `type`, must be > 20) → `serializer: new RPCSerializer({ handlers })`
  with **string** keys shared between handler and link; override built-ins by reusing the key
  (e.g. `date`) "instead of matching a magic number".
- Event stream options: flat `eventIteratorKeepAliveEnabled` / `eventIteratorKeepAliveInterval` /
  `eventIteratorKeepAliveComment` → nested under `toFetchResponse.eventStream` (node uses
  `sendStandardResponse`); **keep-alive default changed from 5s to 15s**.
- **WebSocket adapters unified:** `@orpc/server/ws` and `@orpc/server/bun-ws` removed; single
  `@orpc/server/websocket` covers `ws`, Bun, Deno, Cloudflare, and more.

**Client:**

- `RPCLink` splits `url` into `origin` + `url` (path prefix starting with `/`).
- Custom `fetch` first argument is now a URL **string** instead of a `Request` object.
- `clientInterceptors` → `transportInterceptors`; `adapterInterceptors` → `fetchInterceptors`;
  event stream options under `toFetchRequest.eventStream`.
- WebSocket link uses a `connect` factory instead of a WebSocket instance; "Reconnection is now
  built in, so you no longer need `partysocket`."
- `ContractRouterClient` → `RouterContractClient`.

**Streaming naming aliases (deprecated but working):** `eventIterator`→`asyncIteratorObject`,
`consumeEventIterator`→`consumeAsyncIterator`, `eventIteratorToStream`→`asyncIteratorToStream`,
`eventIteratorToUnproxiedDataStream`→`asyncIteratorToUnproxiedDataStream`,
`streamToEventIterator`→`streamToAsyncIteratorObject`.
`EventPublisher` removed → `MemoryPublisher` from `@orpc/publisher/memory` (`publish` now async).

**Plugin renames:** handler plugins get a `HandlerPlugin` suffix (`CORSPlugin`→`CORSHandlerPlugin`);
link plugins get a `LinkPlugin` suffix (`ClientRetryPlugin`→`RetryLinkPlugin`,
`DedupeRequestsPlugin`→`DedupeLinkPlugin`, `RetryAfterPlugin`→`RetryAfterLinkPlugin`). New v2
plugins: Timeout, Request Compression, Response Compression. v2 Batch Plugin "supports every
response type, including AsyncIteratorObject and File/Blob" (v1 `exclude` existed to skip those).

**Package moves relevant here:** `@orpc/server/hibernation` (subpath) → `@orpc/hibernation`;
`@orpc/experimental-publisher` → `@orpc/publisher`; `@orpc/otel` → `@orpc/opentelemetry`. The Durable
Iterator integration no longer exists in v2.

**Message Port adapter is unchanged across majors** apart from: `context` may now be a per-call
async function, the link gains `headers`/`interceptors`, and the transfer warning points at
`RPCSerializer` instead of the RPC JSON Serializer. `experimental_transfer` is still experimental in
v2.
