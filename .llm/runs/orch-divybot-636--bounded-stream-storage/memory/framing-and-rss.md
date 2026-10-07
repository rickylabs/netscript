# Durable streams framing and RSS — 2026-10-07

Current committed NetScript lock resolves @durable-streams/server 0.3.7 through npm range ~0.3.7 (root npm catalog ^0.3.7). `deno info npm:@durable-streams/server@0.3.8` mutates ranges and peer identifiers in lock; use --no-lock for inspection, --frozen for tests. Both 0.3.7/0.3.8 have full-file scan/read hooks.

Frames advance offset by payload.length + 5. Fork physical bytes add forkOffset. Stream filenames start with `encodeStreamPath(path)` (base64url), NOT plain stream names. Preserve arbitrary interior offset behavior by starting from a verified boundary. Recovery can skip payload bodies once header length and snapshot size prove frame completeness. Cached boundary entries and segments have fixed capacity.

`NETSCRIPT_STORAGE_RSS_REPORT=<json-path> deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --output <wrapper-json> -- --frozen --allow-all plugins/streams/services/src` passes all 17 tests including >=1 GiB native recovery and native tail negative controls. Linux worker VmHWM is reliable through synchronous recovery where parent sampling can miss a transient allocation. Wrapper only retains diagnostics for failures; optional RSS report stores numeric successful output separately. Measured 1,073,746,944 bytes log: native recovery 2,201,464,832 bytes RSS; native tail-only 2,203,815,936; bounded recovery 57,532,416, after tail 58,617,856. Ceiling 536,870,912.

Check/lint/fmt wrappers output JSON by default; --json is invalid. --output requires outer --allow-write. Check defaults --unstable-kv; pass --deno-arg --frozen.
