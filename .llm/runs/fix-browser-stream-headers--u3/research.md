# U3 intake: caller-provided stream headers

Decision for planning: forward the existing upstream per-header contract through the two current
factories. Do not create a credential issuer, transport, recovery loop, or shared options framework.
Implementation remains unauthorized pending coordinator review and the selected plan gate.

Baseline: `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d`, branch `fix/browser-stream-headers`. Root
initialized this exact worktree with CLI0.0.8 (190 prose/1 API/8 exports), inspected/restored eight
tracked incidental paths and the detection-only alias. Current tracked source/config/locks are
unchanged. Generated untracked tooling is not a product change.

## Load-bearing source

| Authority                                                                | Actual finding                                                                                                                                                                                                                  | Planning consequence                                                                                                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/fresh/src/runtime/streams/create-stream-db.ts`                 | Public options omit headers; exported factory input restricts values to `Record<string,string>`; composition always calls `getStreamsAuth()`. The default adapter uses native DurableStream plus the existing recovery adapter. | Add one input without resolving callbacks. Audit the existing exported port widening and preserve default recovery/lifecycle.                           |
| `plugins/workers/streams/factory.ts`                                     | Independent thin upstream factory; always calls `getStreamsAuth()`; public return projects collections only.                                                                                                                    | Add the same caller capability directly, without routing workers through Fresh or widening the return handle for tests.                                 |
| `packages/plugin-streams-core/src/application/stream-url-resolver.ts`    | Producer auth reads STREAMS_SECRET/DURABLE_STREAMS_SECRET lazily; denied env access can throw; browser/no secret returns `{}`.                                                                                                  | Explicit headers, including `{}`, replace ambient auth. Only `undefined` selects legacy auth. Explicit base URL plus headers must work with env denied. |
| Locked npm `@durable-streams/client@0.2.7` public `HeadersRecord`        | `string` or `() => MaybePromise<string>` per header. Native resolver awaits callbacks before each request, including polls.                                                                                                     | Reuse this public type and native execution; a whole-map callback, eager resolution or local serializer is incorrect.                                   |
| `packages/fresh/deno.json`, `plugins/workers/package.json`, root catalog | Both owners already depend on the client; catalog pins client0.2.7/state0.3.2/server0.3.9.                                                                                                                                      | No new dependency, shared/core type owner, version or lock edit is needed.                                                                              |

Public type evidence was obtained with portable Deno2.9.7
`deno doc --frozen --filter HeadersRecord npm:@durable-streams/client@0.2.7` (exit0). Exact cached
source is under the public npm cache `@durable-streams/client/0.2.7/dist/index.d.ts`
(`HeadersRecord`) and `index.js` (`resolveHeaders`, request call). This proves the primitive; it is
not a NetScript implementation test.

## Existing proving surfaces

- Fresh `src/runtime/streams/create-stream-db_test.ts` already owns an actual native persistent
  reference server, outage/restart, resumed offsets, collection identity, terminal failure and
  cancellation controls. Fixture: `packages/fresh/tests/_fixtures/stream-db-server.ts` uses native
  DurableStreamTestServer0.3.9. Extend these rather than copying a transport/server/recovery loop.
- Fresh `stream-db-recovery-adapter_test.ts` remains a regression gate. Callback failure must retain
  actual native/recovery classification; do not invent refresh policy.
- Fresh `tests/type-fixtures/streamdb-wrapper_type.ts` proves public wrapper/live-query types. The
  port currently permits custom adapters that assume string values: widening is a source
  compatibility risk requiring an explicit consumer/migration statement, not a universal nonbreaking
  claim.
- Workers `tests/streams/factory-discovery_test.ts` already inspects the actual upstream stream
  through a checked runtime object. `live-query-consumer_type.ts` proves collection inference.
  Actual-request and bounded-close proof must use upstream public handles/schema checks, without
  private fields/casts or a production handle expansion merely for tests.
- Existing docs owner: `docs/site/durable-workflows/streams.md`; public JSDoc is in the two source
  owners. The Fresh module's claim that plugin factories call it is stale in current source and may
  be corrected locally if needed.

## Boundaries and unresolved proving details

Explicit record identity should reach the native client untouched; static, sync and async values,
multiple requests, reconnect rotation, empty replacement, absent legacy auth and
failure/cancellation need real-client controls. A fetch observer may delegate to actual fetch to
inspect headers, but may not substitute a handwritten transport. Tests must restore globals/env and
close native consumers/server processes on every path.

The plan must select the smallest workers actual-request/cleanup fixture and a compatible public
factory-port decision before implementation. No unexplained new shared helper or lifecycle handle is
pre-approved. Tests/gates in this intake are proposed, not run.

U1 hosts, U2 CORS, U4 health, EIS reader issuance/roles/TTL/workspaces/browser bootstrap,
sagas/triggers/auth factories, versions/releases and process supervision are excluded. Header
forwarding is not authentication and does not close S16.

## Tooling and routing

Installed MCP `find_guidance` was used for streams/header guidance; its corpus is navigation and
does not replace the exact source. Doctrine, Harness, integration/plugin archetypes, consumer gates,
plan gate and JSR rubric were consulted. No source quality, runtime or publish PASS is asserted. RTK
was absent from PATH and the documented executable path; bounded raw reads were used without
installation.

The actual pinned Harness matrix (`bd02f966a42dd1029b4349a038c52d0928fac41f`) resolved feature/plan
to Fable5.1 low, fallback Muse Spark1.3 xhigh. Native print uses the existing `runClaudePrint` suite
and verified official task-owned Claude2.1.251 executable; normal existing authenticated
subscription, no key/profile copies. Root selects the separate plan evaluator after reading the
concrete output.
