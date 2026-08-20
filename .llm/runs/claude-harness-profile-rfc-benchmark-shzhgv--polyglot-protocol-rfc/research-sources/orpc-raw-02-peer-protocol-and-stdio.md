# oRPC raw extract 02 — non-HTTP peer wire protocol + the stdio adapter

Fetch date: 2026-08-20. Group: `orpc`.

Sources:

- https://store.boilerplate.com/product/npm/b3JwYy1hZGFwdGVyLXN0ZGlv — HTTP 200 but **thin**:
  the page is a client-rendered SPA shell; the only text in the served HTML is
  "Boilerplate Store - Ready-to-use components for real projects." No product copy, no version,
  no technical detail. The base64 path segment decodes to `orpc-adapter-stdio`, i.e. the product is
  the npm package of that name. Substance below is from the package registry, its README, and its
  GitHub source (fallbacks, as instructed).
- https://registry.npmjs.org/orpc-adapter-stdio (packument + README)
- https://www.npmjs.com/package/orpc-adapter-stdio (search-engine confirmation)
- https://raw.githubusercontent.com/lott-ai/orpc-adapter-stdio/main/src/shared/stdio.ts
- https://raw.githubusercontent.com/lott-ai/orpc-adapter-stdio/main/src/client/link-client.ts
- https://raw.githubusercontent.com/lott-ai/orpc-adapter-stdio/main/src/server/handler.ts
- https://raw.githubusercontent.com/lott-ai/orpc-adapter-stdio/main/src/client/index.ts,
  `.../src/server/index.ts`
- npm tarball `@orpc/standard-server-peer@1.15.0` (`dist/index.mjs`, `dist/index.d.ts`) — this is
  the module the stdio adapter, the message-port adapter, and the websocket adapter all build on.

---

## 1. `orpc-adapter-stdio` — package facts

From the packument (`https://registry.npmjs.org/orpc-adapter-stdio`):

- name: `orpc-adapter-stdio`; `dist-tags.latest` = **0.0.1**; versions present: `0.0.0`, `0.0.1`.
- published `0.0.1`: **2025-12-30T18:29:38.881Z**.
- maintainer: `lottamus <chris@lott.io>`; repo `git+https://github.com/lott-ai/orpc-adapter-stdio.git`.
- description: "A stdio adapter for oRPC that enables type-safe RPC communication over standard
  input/output streams. Perfect for spawning subprocess servers in Electron, Tauri, or any
  environment where you need IPC with a child process."
- keywords: `unnoq`, `orpc`, `stdio`, `tauri`, `bun`.
- **dependencies: none.** peerDependencies: `@orpc/client ^1.8.0`, `@orpc/server ^1.8.0` — i.e.
  **v1-only**, ESM-only.
- exports: `./client` and `./server` subpaths (`import` + `types`, no `require`).

**This is a third-party community package, not an official oRPC adapter.** oRPC itself ships no
stdio transport in either major.

## 2. What it claims to implement (README, verbatim bullets)

> - 🔌 **Subprocess communication** — Run your oRPC server in a child process and communicate via
>   stdin/stdout
> - 🎯 **Type-safe** — Full end-to-end type safety with your oRPC router
> - 🪟 **Framework agnostic** — Works with Tauri, Electron, plain Node.js/Bun, or any environment
>   with stdio access
> - 🔀 **Isolated messaging** — Uses message prefixes to separate RPC traffic from regular console
>   output

"How It Works" section, verbatim:

> The adapter uses a special prefix (`\x00__ORPC__\x00`) to identify RPC messages in the stdio
> stream. This allows your subprocess to use regular `console.log` statements without interfering
> with RPC communication—only prefixed messages are processed as RPC traffic.

License MIT.

## 3. Public API surface (README "API Reference", verbatim)

Server:

```typescript
import { RPCHandler } from "orpc-adapter-stdio/server";

const handler = new RPCHandler(router, options?);

handler.upgrade({
  write: (chunk: string) => void,
  onMessage: (callback: (chunk: string) => void) => void,
  onClose?: (callback: () => void) => void,
});
```

Client:

```typescript
import { RPCLink } from "orpc-adapter-stdio/client";

const link = new RPCLink({
  stdio: {
    write: (chunk: string) => void,
    onMessage: (callback: (chunk: string) => void) => void,
    onClose?: (callback: () => void) => void,
  },
  // ... other StandardRPCLinkOptions
});
```

Exported protocol utilities (from both `/client` and `/server`):

```typescript
import { isORPCMessage, parseORPCMessage, ORPC_MESSAGE_PREFIX } from "orpc-adapter-stdio/client";

isORPCMessage(someString);   // boolean
parseORPCMessage(orpcMessage); // string | null
```

Wiring examples from the README — server (Bun child process):

```typescript
const handler = new RPCHandler(router);
handler.upgrade({
  onMessage: async (callback) => {
    for await (const chunk of Bun.stdin.stream()) {
      callback(Buffer.from(chunk).toString());
    }
  },
  write: (chunk) => { process.stdout.write(`${chunk}\n`); },
});
```

Client (parent process spawning the child):

```typescript
const child = Bun.spawn(["bun", "run", "server.ts"], { stdin: "pipe", stdout: "pipe" });

const link = new RPCLink({
  stdio: {
    write: (message) => child.stdin.write(message),
    onMessage: async (callback) => {
      for await (const chunk of child.stdout) { callback(Buffer.from(chunk).toString()); }
    },
  },
});

const client: RouterClient<Router> = createORPCClient(link);
const response = await client.ping({ message: "Hello!" }); // { message: "Pong: Hello!" }
```

Tauri sidecar variant (`@tauri-apps/plugin-shell`):

```typescript
const command = Command.sidecar("binaries/my-sidecar");
const childPromise = command.spawn();

const link = new RPCLink({
  stdio: {
    onMessage: (callback) => command.stdout.on("data", callback),
    write: async (message) => { const child = await childPromise; await child.write(message); },
  },
});
```

## 4. Framing implementation — `src/shared/stdio.ts` (verbatim)

```ts
export interface SupportedStdio {
  write: (chunk: string) => void;
  onMessage: (callback: (chunk: string) => void) => void;
  onClose?: (callback: () => void) => void;
}

export type SupportedStdioData = string | ArrayBufferLike | Uint8Array;

/**
 * Unique prefix used to identify oRPC messages in stdio streams.
 * This allows distinguishing RPC messages from other output (like console.log).
 */
export const ORPC_MESSAGE_PREFIX = "\x00__ORPC__\x00";

export function isORPCMessage(message: string): boolean {
  return message.startsWith(ORPC_MESSAGE_PREFIX);
}

export function parseORPCMessage(message: string): string | null {
  if (!isORPCMessage(message)) return null;
  return message.slice(ORPC_MESSAGE_PREFIX.length);
}

export function postStdioMessage(stdio: SupportedStdio, data: SupportedStdioData): void {
  const message = chunkToString(data).trim();
  if (message.length === 0) return;
  stdio.write(`${ORPC_MESSAGE_PREFIX}${message}\n`);
}

export function onStdioMessage(stdio: SupportedStdio, callback: (data: string) => void): void {
  let partialMessage = ""; // partial message from previous chunk not containing a newline

  stdio.onMessage((chunk: SupportedStdioData) => {
    const bufferStr = chunkToString(chunk);
    if (bufferStr.trim().length === 0) return;

    // If the previous chunk did not contain a newline, we need to append it to the current chunk
    const messageStr = partialMessage + bufferStr;

    const lastChar = messageStr[messageStr.length - 1];
    const msgsSplit = messageStr.split("\n");
    const msgs = lastChar === "\n" ? msgsSplit : msgsSplit.slice(0, -1); // remove the last incomplete message
    partialMessage = lastChar === "\n" ? "" : (msgsSplit.at(-1) ?? "");

    for (const msgStr of msgs.map((msg) => msg.trim()).filter(Boolean)) {
      // Only process oRPC messages, ignore other output (e.g., console.log)
      const parsed = parseORPCMessage(msgStr);
      if (parsed !== null) { callback(parsed); }
    }
  });
}

function chunkToString(input: SupportedStdioData): string {
  if (typeof input === "string") return input;
  if (input instanceof SharedArrayBuffer) return new TextDecoder().decode(new Uint8Array(input));
  return new TextDecoder().decode(input);
}

export function onStdioClose(stdio: SupportedStdio, callback: () => void): void {
  stdio.onClose?.(() => callback());
}
```

Framing summary: **newline-delimited, UTF-8 text frames, each prefixed with the 11-byte sentinel
`\x00__ORPC__\x00`.** Non-prefixed lines are dropped (that is the console.log isolation
mechanism). Frames are `.trim()`ed on both send and receive, and empty frames are skipped.

Consequence worth flagging for any protocol reuse: this framing is **text-only**. The peer codec
(below) can emit a binary `Uint8Array` frame when a Blob/File is attached; `postStdioMessage` runs
that through `TextDecoder` and `.trim()`, so binary payloads are lossy/corrupting on this transport.
There is also no length prefix — recovery depends on newline integrity.

## 5. Adapter internals — it is a thin shell over `@orpc/standard-server-peer`

`src/client/link-client.ts` (verbatim):

```ts
import { ClientPeer } from "@orpc/standard-server-peer";

export interface LinkStdioClientOptions { stdio: SupportedStdio; }

export class LinkStdioClient<T extends ClientContext> implements StandardLinkClient<T> {
  private readonly peer: ClientPeer;

  constructor(options: LinkStdioClientOptions) {
    this.peer = new ClientPeer((message) => postStdioMessage(options.stdio, message));
    onStdioMessage(options.stdio, async (message) => { await this.peer.message(message); });
    onStdioClose(options.stdio, () => { this.peer.close(); });
  }

  async call(request: StandardRequest, _options: ClientOptions<T>, _path: readonly string[], _input: unknown)
    : Promise<StandardLazyResponse> {
    const response = await this.peer.request(request);
    return { ...response, body: () => Promise.resolve(response.body) };
  }
}
```

`src/server/handler.ts` (verbatim):

```ts
import { createServerPeerHandleRequestFn } from "@orpc/server/standard-peer";
import { ServerPeer } from "@orpc/standard-server-peer";

export class StdioHandler<T extends Context> {
  constructor(private readonly standardHandler: StandardHandler<T>) {}

  upgrade(stdio: SupportedStdio, ...rest: MaybeOptionalOptions<HandleStandardServerPeerMessageOptions<T>>): void {
    const peer = new ServerPeer((message) => postStdioMessage(stdio, message));

    onStdioMessage(stdio, async (message) => {
      await peer.message(message,
        createServerPeerHandleRequestFn(this.standardHandler, resolveMaybeOptionalOptions(rest)));
    });

    onStdioClose(stdio, () => { peer.close(); });
  }
}
```

**Takeaway:** oRPC's non-HTTP transports are all the same two-line pattern — construct a
`ClientPeer`/`ServerPeer` with a `send(message)` closure, pump inbound frames into `peer.message()`,
call `peer.close()` on disconnect. Adding a transport to oRPC means supplying byte/string transport
for opaque frames; it does **not** mean touching the RPC protocol.

---

## 6. `@orpc/standard-server-peer@1.15.0` — the peer wire protocol

This is the message-framed protocol used over WebSocket, Message Port, and (via the third-party
adapter) stdio. Extracted from the published `dist/index.d.ts` and `dist/index.mjs`.

### Message envelope and types (`index.d.ts`, verbatim)

```ts
type EncodedMessage = string | ArrayBufferLike | Uint8Array;
interface EncodedMessageSendFn { (message: EncodedMessage): Promisable<void>; }

declare enum MessageType {
    REQUEST = 1,
    RESPONSE = 2,
    EVENT_ITERATOR = 3,
    ABORT_SIGNAL = 4
}

type EventIteratorEvent = 'message' | 'error' | 'done';

interface EventIteratorPayload {
    event: EventIteratorEvent;
    data: unknown;
    meta?: EventMeta;
}

interface RequestMessageMap {
    [MessageType.REQUEST]: Omit<StandardRequest, 'signal'>;
    [MessageType.EVENT_ITERATOR]: EventIteratorPayload;
    [MessageType.ABORT_SIGNAL]: void;
}
interface ResponseMessageMap {
    [MessageType.RESPONSE]: StandardResponse;
    [MessageType.EVENT_ITERATOR]: EventIteratorPayload;
    [MessageType.ABORT_SIGNAL]: void;
}

interface BaseMessageFormat<P = unknown> {
    /** Client-guaranteed unique identifier */
    i: string;
    /** @default REQUEST | RESPONSE */
    t?: MessageType;
    p: P;
}

interface SerializedEventIteratorPayload {
    e: EventIteratorEvent;
    d: unknown;
    m?: EventMeta;
}

interface SerializedRequestPayload {
    /** The url of the request; might be relative path if origin is `http://orpc` */
    u: string;
    b: StandardBody;
    /** @default {} */
    h?: StandardHeaders;
    /** @default POST */
    m?: string;
}

interface SerializedResponsePayload {
    /** @default 200 */
    s?: number;
    /** @default {} */
    h?: StandardHeaders;
    b: StandardBody;
}
```

So a single peer frame is a JSON object with **three one-letter keys**: `i` (correlation id, client
guaranteed unique), `t` (MessageType, omitted when it is the default REQUEST on the request
direction / RESPONSE on the response direction), and `p` (payload). Payload keys are also
single-letter: request `{u, b, h?, m?}`, response `{s?, h?, b}`, event-iterator `{e, d, m?}`.
Abort-signal frames carry `p: undefined` on the response direction.

### Origin shortening (`index.mjs`, verbatim)

```js
const SHORTABLE_ORIGIN = "http://orpc";
const SHORTABLE_ORIGIN_MATCHER = /^http:\/\/orpc\//;
```

On serialize: `u: request.url.toString().replace(SHORTABLE_ORIGIN_MATCHER, "/")`. On deserialize:
`payload.u.startsWith("/") ? new URL(`${SHORTABLE_ORIGIN}${payload.u}`) : new URL(payload.u)`.
Method is omitted when `POST` and defaults back to `"POST"`; status omitted when `200` and defaults
back to `200`; headers omitted when empty and default to `{}`.

### Binary framing — JSON + 0xFF delimiter + blob (`index.mjs`, verbatim)

```js
const JSON_AND_BINARY_DELIMITER = 255;

async function encodeRawMessage(data, blob) {
  const json = stringifyJSON(data);
  if (blob === void 0 || blob.size === 0) {
    return json;                                  // <- plain string frame
  }
  return readAsBuffer(new Blob([
    new TextEncoder().encode(json),
    new Uint8Array([JSON_AND_BINARY_DELIMITER]),
    blob
  ]));                                            // <- binary frame
}

async function decodeRawMessage(raw) {
  if (typeof raw === "string") { return { json: JSON.parse(raw) }; }
  const buffer = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  const delimiterIndex = buffer.indexOf(JSON_AND_BINARY_DELIMITER);
  if (delimiterIndex === -1) {
    return { json: JSON.parse(new TextDecoder().decode(buffer)) };
  }
  return {
    json: JSON.parse(new TextDecoder().decode(buffer.subarray(0, delimiterIndex))),
    buffer: buffer.subarray(delimiterIndex + 1)
  };
}
```

A peer frame is therefore either a **UTF-8 JSON string**, or a **binary buffer** of
`utf8(json) || 0xFF || <blob bytes>`. Exactly one blob per frame.

### Body ↔ header normalization (`index.mjs`, verbatim)

```js
async function serializeBodyAndHeaders(body, originalHeaders) {
  const headers = { ...originalHeaders };
  const originalContentDisposition = headers["content-disposition"];
  delete headers["content-type"];
  delete headers["content-disposition"];
  if (body instanceof Blob) {
    headers["content-type"] = body.type;
    headers["content-disposition"] = originalContentDisposition ??
      generateContentDisposition(body instanceof File ? body.name : "blob");
    return { body, headers };
  }
  if (body instanceof FormData) {
    const tempRes = new Response(body);
    headers["content-type"] = tempRes.headers.get("content-type");
    const formDataBlob = await tempRes.blob();
    return { body: formDataBlob, headers };
  }
  if (body instanceof URLSearchParams) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    return { body: body.toString(), headers };
  }
  if (isAsyncIteratorObject(body)) {
    headers["content-type"] = "text/event-stream";
    return { body: void 0, headers };            // <- stream body carried by later frames, not this one
  }
  return { body, headers };
}

async function deserializeBody(headers, body, buffer) {
  const contentType = flattenHeader(headers["content-type"]);
  const contentDisposition = flattenHeader(headers["content-disposition"]);
  if (typeof contentDisposition === "string") {
    const filename = getFilenameFromContentDisposition(contentDisposition) ?? "blob";
    return new File(buffer === void 0 ? [] : [buffer], filename, { type: contentType });
  }
  if (contentType?.startsWith("multipart/form-data")) {
    return new Response(buffer, { headers: { "content-type": contentType } }).formData();
  }
  if (contentType?.startsWith("application/x-www-form-urlencoded") && typeof body === "string") {
    return new URLSearchParams(body);
  }
  return body;
}
```

Header names that carry protocol meaning on peer transports: **`content-type`** and
**`content-disposition`** (presence of `content-disposition` is the File/Blob discriminator on
decode). `content-type: text/event-stream` on a REQUEST/RESPONSE frame means "the body is an async
iterator delivered as subsequent `EVENT_ITERATOR` frames sharing the same `i`".

### Peer classes (`index.d.ts`, verbatim)

```ts
declare class ClientPeer {
    constructor(send: EncodedMessageSendFn);
    get length(): number;
    open(id: string): AbortController;
    request(request: StandardRequest): Promise<StandardResponse>;
    message(raw: EncodedMessage): Promise<void>;
    close(options?: AsyncIdQueueCloseOptions): void;
}

declare class ServerPeer {
    constructor(send: EncodedMessageSendFn);
    message(raw: EncodedMessage, handleRequest?: ServerPeerHandleRequestFn)
      : Promise<[id: string, StandardRequest | undefined]>;
    close(options?: ServerPeerCloseOptions): void;
}

interface ClientPeerCloseOptions extends AsyncIdQueueCloseOptions {
    /** Should abort or not? @default true */
    abort?: boolean;
}
```

Also exported: `experimental_ClientPeerWithoutCodec` / `experimental_ServerPeerWithoutCodec` (take
`experimental_RequestMessageSendFn` / `experimental_ResponseMessageSendFn` operating on already
**decoded** `[id, type, payload]` tuples — i.e. an escape hatch for transports that carry structured
values natively, such as Message Port with structured clone), plus `AsyncIdQueue`,
`toEventIterator(queue, id, cleanup, options)`, and
`resolveEventIterator(iterator, callback: (payload) => Promise<'next' | 'abort'>)`.

Correlation/multiplexing model: ids come from a `SequentialIdGenerator`; concurrent calls are
multiplexed over one channel by `i`; an in-flight call's `AbortController` is created by
`ClientPeer.open(id)` and cancellation travels as a `MessageType.ABORT_SIGNAL` (4) frame with the
same `i`. Stream termination travels as an `EVENT_ITERATOR` (3) frame with `e: 'done'` or
`e: 'error'`.

Dependencies of the peer package: `@orpc/shared@1.15.0`, `@orpc/standard-server@1.15.0` (no
transport dependency at all).
