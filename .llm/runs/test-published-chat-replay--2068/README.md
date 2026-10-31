# Published native chat replay proof

This verification leaf for #2068 consumes `@netscript/fresh@0.0.8/ai` from JSR. Read this file to reproduce or extend the proof. The framework fixes already shipped; EIS-Chat adoption and removal of its custom adapter remain open in that application's repository. This PR does not close #2068.

From the repository root, run:

```sh
deno run --frozen --allow-all .llm/runs/test-published-chat-replay--2068/run-proof.ts --output-root "$CHAT_PROOF_OUTPUT"
```

Set `CHAT_PROOF_OUTPUT` to a new directory outside the repository, beneath an existing parent with no ancestor `deno.json`, `deno.jsonc` or `package.json`. The launcher refuses an occupied output directory, workspace ancestry or an existing proof cache. It creates the standalone consumer and its initially absent `DENO_DIR`; it never deletes or reloads a cache. Keep output private: raw command logs contain machine paths. Only the sanitized `result.json` belongs in public evidence.

`consumer.deno.jsonc` pins the public entrypoint and assertions. `consumer.lock.json` is the native standalone Deno lock captured during the initial cold resolution; it is copied as the consumer's `deno.lock`. Both native install and `deno ci --prod` use that frozen lock. The launcher rejects links, overrides, workspace members and unexpected dependency metadata. Native standalone `workspace.dependencies` metadata is legitimate. The repository lock must retain its original hash.

`published-chat-probe.ts` deliberately has a name that root test discovery does not select. The launcher copies it to `consumer_test.ts` outside the workspace; it copies the config as `deno.json`. Direct workspace test execution is not published evidence. The native module graph must contain only published JSR URLs for every NetScript module, exact Fresh 0.0.8 with integrity, and local files confined to the copied consumer. Public source content hashes are recorded in `result.json`.

`http-stream-fixture.ts` implements HTTP storage and JSON/SSE framing. Every stored application record, including live updates, comes from the real default published `toNetScriptChatResponse` writer's POST body. Tests assert raw storage equals the received POSTs. The fixture never manufactures native messages or protocol chunks. This is controlled-backend verification, not qualification of a production durable-stream service or a real model provider.

The first test checks native UI/model/activity messages, multimodal/tool/thinking/structured parts, metadata and future fields, repeated reload parity, writer-echo deduplication and cold public replay. The second checks a native seed and offset, two readers sharing exactly one SSE, same-ID live updates without duplicates, independent first-reader cancellation, final-reader transport cancellation, reload parity and an unchanged seed. Event latches wait for actual transport events; finite deadlines only prevent hangs. Forced cleanup runs in `finally`, after cancellation assertions.

The negative oracle runs the identical probe while the fixture drops only native `netscript.chat.messages` records on GET/SSE relay. Stored writer output stays intact. The first test must fail a named semantic assertion, with no process, compile, timeout, abort or connection failure. This proves the probe notices missing native persistence; it is not a production code revert. Positive requires exactly two passing tests and no ignored tests; control requires exactly one failing test.

The seeded test also retains an untouched historical activity message while adding a new live message ID and updating an existing ID. Both readers must return the complete ordered native history. After the final reader aborts, a third reader resumes at the current stream end; disposing the connection must end that reader and cancel its reopened SSE before fixture cleanup.

The repository's structured check/lint/fmt/test wrappers run from the consumer with its cache. The parent wrapper process uses the repository's frozen tooling import map; every child gate receives the consumer config explicitly. The graph attestation describes the probe, not the tooling wrapper. Extend the public message fixtures or lifecycle assertions in the non-discoverable probe, then run into another new output directory. Do not replace writer persistence with fabricated records or weaken provenance checks.

`published-result.json` records the successful frozen cold run. `plan-eval.md`, `implementation-eval.md`, `worklog.md` and `context-pack.md` carry review and handoff state. No framework/scaffold source, root dependencies or root lock change; no local scaffold runtime or paid inference is needed.
