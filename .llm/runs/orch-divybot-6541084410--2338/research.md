# Research

Baseline: main `f6839463668c5dae4ca7234d26909e74e10b89c0`; no existing PR found for #2338 and no orchid-triage comment. Consulted prior run memories for the native reviewer launcher, structured validation and unavailable RTK. RTK is absent here; use native commands without inventing a substitute.

NetScript MCP `find_guidance` then `search_docs` consulted before design. Read the streams guide, public options through `deno doc`, supervisor, transport, real-server idempotency test and upstream installed client/server.

The producer supervisor initializes epoch/sequence to zero. A duplicate acknowledgement does not prove the new bytes were appended: server deduplication uses only the tuple. Auto-claim on a 403 cannot discover same-epoch duplicates. The protocol declares client-incremented epochs on restart; it has no producer-session claim endpoint or safe empty append (empty POST and empty JSON arrays are rejected). Source: https://github.com/durable-streams/durable-streams/blob/main/PROTOCOL.md#521-idempotent-producers . Installed client autoClaim also only responds to a stale epoch. Persisted client epoch is the native zero-handshake restart mechanism.

`createDurableStream` is a path singleton; `createServiceStreamProducer` aliases its options. All append retries already retain serialized bytes and identity except a stale-epoch response which changes identity. An explicitly allocated epoch should therefore disable implicit epoch stealing. Existing callers can retain legacy auto-claim when the option is omitted.

Every upsert is explicitly a new event today. Entity equality is an application concern: State Protocol operation/correlation/trace headers can vary for identical entity values. The regression must separately prove session setup/stop/flush append nothing; docs must describe checking persisted document state before invoking upsert. This change must not silently make identical upsert calls disappear.

Archetype 3 runtime/behavior (doctrine verdict Keep). Existing streams connector debt is unrelated: no oRPC/API/proxy changes. Public options use explicit property annotations; no inferred exported return types, new dependencies or consumer wire changes. JSR audit rubric reviewed: add documented numeric option, preserve export map and published file selection, run audit + doc lint, compare baseline private-reference findings if any.
