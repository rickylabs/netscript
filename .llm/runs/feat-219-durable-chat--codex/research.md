# Research

## Re-baseline

- Required base and branch match the brief.
- Issue #219 was read in full on 2026-07-11. Its 2026-07-04 owner update records FA1 (#250), FA2 (#251), the gzip-strip fix (#239), and SR1/SR2 as landed; the remaining anchor closure is reference-consumer proof.
- Current main already exports `createNetScriptChatConnection`, `toNetScriptChatResponse`, `resolveChatSnapshot`, `projectChatSnapshot`, and `createNetScriptChatStreamProxy` from `@netscript/fresh/ai`.
- Existing focused tests prove URL/auth resolution, identity encoding, missing-stream retry, teardown, proxy header sanitation, and multibyte-safe HTTP passthrough. They do not prove the entire subscribe lifecycle in one fake durable stream.
- `@netscript/fresh/streams` remains a separate StreamDB shape surface; this slice must not modify it.

## Architecture

- Archetype: 2 — Integration. The package wraps the external durable-streams/TanStack-AI transport behind a NetScript-owned connection contract.
- Overlay: frontend, because the contract is consumed by browser `useChat` islands and must model reload and multi-tab subscription behavior.
- Doctrine focus: A1/A2 public contract, A7 wrapping upstream/Web APIs, A13 cancellation, A14 tests; AP-2/AP-5/AP-7/AP-15/AP-18 are in scope.
- Current doctrine verdict: package surfaces require explicit public contracts, focused adapters, consumer tests, doc-lint, and publish validation; no new debt is intended.

## Exact dependency surface

- Workspace pin: `@durable-streams/tanstack-ai-transport@^0.0.8` and TanStack AI `@tanstack/ai@^0.39.0` / `@tanstack/ai-preact@^0.10.1`.
- The upstream connection consumed by TanStack AI is subscribe/send-shaped. NetScript already deliberately owns the public types rather than re-exporting upstream types.

## Publishability scan

- New public types are not planned unless the lifecycle test exposes a contract gap.
- Existing exports carry JSDoc and examples. Risks are inferred callback/async-iterable types and accidental upstream type leakage; `deno doc --lint` and package dry-run are required.

## Open questions

- Must resolve now: whether two subscribers receive identical ordered chunks and a reloaded subscriber resumes strictly after the SSR offset.
- Safe to defer: eis-chat application migration and docs-page prose; both are owned by other slices.
