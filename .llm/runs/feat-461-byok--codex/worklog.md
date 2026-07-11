# Worklog — #461 BYOK per-request resolution

## Design

### Public surface

- Extend `ChatClientCallOptions` with an optional owned connection override object containing `apiKey`, `baseURL`, and Ollama `host`.
- No new entrypoint and no provider SDK export.

### Domain vocabulary

- `ChatClientConnectionOptions`: readonly per-call transport credentials/endpoints.
- Provider-local resolved connection values remain internal and never appear in errors.

### Ports and adapters

- Port: `ChatClientPort.stream(request, callOptions)` remains the single-turn seam.
- Adapters: Anthropic, OpenAI-compatible, OpenRouter, and Ollama resolve their applicable fields for each stream.
- Composition root: provider `createChatClient(model)` supplies a request-time adapter resolver to the TanStack bridge.

### Constants

- Existing provider ids/default endpoints/placeholder key remain authoritative; no new finite variant vocabulary is needed.

### Commit slices

1. **Per-request connection contract and adapter resolution** — changes the chat port, bridge, four chat adapters, focused tests/docs, and run artifacts. Proved by scoped static gates, unit tests, doc lint, architecture gate, and publish dry-run.

### Deferred scope

- Non-chat providers and asynchronous secret-provider callbacks, because they are separate request surfaces.

### Contributor path

- Add a provider-neutral call field in `src/ports/chat-client.ts`; resolve provider-specific meaning in that provider adapter; pass a resolver into `toTanstackChatClient`; add the provider case to the focused BYOK test.

### Plan-Gate

- Owner-waived in the slice brief (carried drift D1). Plan and Design were recorded before source implementation.

## Evidence

| Gate | Command | Result |
| --- | --- | --- |
| Scoped check | `.llm/tools/run-deno-check.ts --root packages/ai --ext ts,tsx` | PASS — 85 files, 0 diagnostics |
| Scoped lint | `.llm/tools/run-deno-lint.ts --root packages/ai --ext ts,tsx` | PASS — 85 files, 0 findings |
| Scoped format | `.llm/tools/run-deno-fmt.ts --root packages/ai --ext ts,tsx` | PASS — 85 files, 0 findings |
| Unit tests | `deno test --allow-all packages/ai/tests/` | PASS — 112 passed, 0 failed |
| BYOK semantics | `packages/ai/tests/byok_test.ts` | PASS — request overrides captured at actual URL/auth headers for Anthropic, OpenAI-compatible, OpenRouter, and Ollama; static fallback captured; logged/error sentinel secrets absent |
| Full export doc lint | `.llm/tools/run-deno-doc-lint.ts --root packages/ai --pretty` | PASS — 12 entrypoints, combined 0 errors / private refs / missing JSDoc |
| Doctrine | `deno task arch:check` | PASS (exit 0); `packages/ai` reports FAIL=0 WARN=0 INFO=0. Workspace baseline warnings are outside this slice. |
| JSR publish dry-run | `deno task publish:dry-run` | PASS (exit 0) — `Success Dry run complete` |

## Reconcile

- Issue #461 remains open with `status:plan`; no PR/status mutation was authorized. No new comments changed acceptance during the slice.
- Implementation matches the locked single-slice plan. No architecture debt was introduced and `deno.lock` was not modified.
- PLAN-EVAL remains owner-waived D1. IMPL-EVAL and Tier-A sign-off remain supervisor-owned; this implementation lane does not self-certify them.
