# Research — #2661 Streams access persistence

Re-baselined at `87965d800b7d61312e8612c82bdb0cb98bdf5b29`. The #2660 causal run at
`a0abc5cf11c95479d39cd13c08180e9d664659c8` measured two synchronous metadata writes per
reader per append and reproduced the delay with independent client sockets. See its
`.llm/runs/docs-streams-subscriber-capacity-2650--impl/phase-b.md`.

| Source-inspected finding | Source |
| --- | --- |
| File mode composes the existing guarded subclass before native recovery. The core package owns the producer and SSE contracts. | `plugins/streams/services/src/bounded-file-store.ts`, plugin and core package export maps |
| The pinned file store persists every touch via `putSync`. The store checks both expiration policies with `>=`; the server touches on GET and POST, including SSE read and wake. | Upstream `file-store.ts:661–698`, `server.ts:1164–1261`, pinned distribution |
| Native append writes the event and metadata before notification. It builds an update from a pre-I/O metadata snapshot. A renewal can be lost if the snapshot is written back unconditionally. | Upstream `file-store.ts`, `appendInner` |
| Recovery reads LMDB metadata, uses creation time for legacy records without a last-access timestamp, and retains expiry metadata when reconciling frame offsets. The existing package restart claim covers orderly shutdown. | Upstream `file-store.ts`, `recover` and `streamMetaToStream`; `plugins/streams/README.md` |
| LMDB defaults to overlapping sync on non-Windows platforms. Same-boot process recovery can use committed transactions. Full disk flush has distinct semantics. | Pinned LMDB 3.5.7 `README.md`, Overlapping Sync Options |

The checkout's NetScript MCP `find_guidance` pointed to the retention how-to and the SSE contract.
The retention how-to confirms sliding reads and appends and fixed absolute expiry. The service
factory and producer declarations were inspected with `deno doc`.

JSR scan: `plugins/streams/deno.json` exposes both companion entry points. The change ships behind
them and keeps their declared types and exports. Test files and `test_utils` are excluded from
the package file list. The JSR audit and release preflight check the published implementation.

The coordinator rejected the provisional crash window. The source-inspected `handleRead`
touch sites precede GET completion and each SSE data/control write, including repeat wakeups.
The existing proxy can fence those successful responses without changing their payload or the
append response. Native `handleAppend` calls `touchAccess` after its storage call. The append
bridge can write the access at the native metadata commit and confirm it at that touch.
