# Expo stream reference

This reference renders cockpit-style `execution` rows through NetScript's injected stream source,
TanStack DB collection sync, and React live-query hook. The app's data layer imports only
`@netscript/sdk` subpaths; Expo supplies the streaming fetch. Workers, sagas, and triggers publish
state under server service identities. Keeping this screen open never runs backend work.

From the repository root:

```sh
deno task --cwd packages/sdk/examples/expo-streams prepare
deno task --cwd packages/sdk/examples/expo-streams check
cd packages/sdk/examples/expo-streams
npm install
npm run typecheck
EXPO_PUBLIC_STREAM_URL=https://api.example.com/v1/stream/netscript/workers/executions?offset=-1 npm start
```

Use your actual stream endpoint and credentials. The reference starts from `offset=-1` to
reconstruct state; a persisted cursor alone is insufficient after an app restart unless the
corresponding rows are also restored. Add `authHeaders` to `createCockpitStream`'s source
configuration for authenticated streams. Credentials belong in a secure host provider; never put
them in a public environment value.

`prepare` copies the focused checkout source into ignored local packages for Metro. It copies the
existing stream-core SSE authority rather than replacing its parser. React and TanStack DB resolve
once through npm. This is a checkout reference, not a fork or a published distribution claim. After
the new subpaths ship, replace the two local package dependencies with the matching JSR npm package
aliases using the [JSR npm setup](https://jsr.io/docs/npm-compatibility); keep their versions
aligned. The app targets Expo 57.0.27, React Native 0.86.3, and React 19.2.3.

## Fetch type boundary

`expo-fetch.ts` assigns the real `expo/fetch` to `StreamFetchV1` without an assertion. It forwards
GET, headers, and cancellation. Expo's `FetchRequestInit.body` excludes request streams accepted by
the broader WHATWG `RequestInit`, so forwarding the entire init object is inappropriate. Its
`FetchResponse` satisfies `StreamFetchResponseV1` (`ok`, `status`, `headers`, `body`); requiring a
full Deno `Response` would also require Deno's unrelated `textStream` extension. The SDK reads the
body via `getReader` and never buffers a response in the wrapper.

## Native runtime proof

`app.json` selects Hermes. `runtime-proof.ts` requires `HermesInternal` and checks
`AbortSignal.throwIfAborted`, `AbortSignal.reason`, streaming UTF-8 decoding split across byte
chunks, `URL.searchParams.set` with an opaque offset, and `ReadableStream.getReader`. The mounted
screen shows the results in `runtime-proof`; a failed check shows the error instead.

Record this output on a native device or emulator together with a stream disconnect/reconnect and
updated execution rows. An Android Metro export, a Deno test, and a clean dependency graph are not
Hermes execution. Native Hermes and native Expo network integration remain unverified by this PR;
this executable proof is provided for the follow-up acceptance run.

The automated integration test consumes the reference's actual `createCockpitStream` factory under
Deno with an injected byte stream. Collection tests verify live queries, control-gated updates,
replay after a mid-control disconnect, entity validation, and cleanup with `EventSource` undefined.
