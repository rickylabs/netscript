# Expo stream reference

This reference renders cockpit-style `execution` rows through NetScript's injected stream source,
TanStack DB collection sync, and React live-query hook. The app's data layer imports only
`@netscript/sdk` subpaths; Expo supplies the streaming fetch. Workers, sagas, and triggers publish
state under server service identities. Keeping this screen open never runs backend work.

From the repository root:

```sh
deno task --cwd resources/examples/expo-streams prepare
deno task --cwd resources/examples/expo-streams check
cd resources/examples/expo-streams
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

The hook regression tests run with this reference's exact React 19.2.3 and compiler configuration;
the SDK suite launches them in that isolated context. The explicit `stream-react.fixture.ts`
filename keeps the reference-only imports out of root test discovery; the SDK wrapper remains
discoverable and runs both fixture tests. This keeps the renderer and hook on the same React
instance as the Expo reference rather than the workspace's independently resolved React patch.
`react-test-renderer@19.2.3` is retained only for this existing component-lifecycle fixture; it is
deprecated upstream and is not a production app dependency or native-execution proof.

Run the isolated fixture directly from the reference directory with
`deno test --lock=stream-react.fixture.lock --frozen --unstable-kv --allow-all stream-react.fixture.ts`.
It verifies subscription updates/unmount and a fatal pre-readiness error, including rendering the
error after remount. The nested SDK run uses the same committed fixture lock with `--frozen`, so
transitive resolution cannot change between a warm cache, a cold cache, and a PR merge ref. The
fixture imports `act` from React's supported API; the renderer supplies only component creation.

The automated integration test consumes the reference's actual `createCockpitStream` factory under
Deno with an injected byte stream. Collection tests verify live queries, control-gated updates,
replay after a mid-control disconnect, entity validation, and cleanup with `EventSource` undefined.
