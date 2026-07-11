# Worklog

## Design

### Public surface

No new export is planned. The slice verifies the landed `@netscript/fresh/ai` contract: `createNetScriptChatConnection`, `resolveChatSnapshot`, and their existing subscribe/send/offset behavior. Any correction remains behind those names.

### Domain vocabulary

- Durable log: ordered append-only chat chunks.
- Cursor/offset: exclusive replay position shared by SSR seed and live subscribe.
- Tab: an independent connection/subscription over the same session.
- Optimistic turn: local user state applied before persistence completes.
- Convergence: every live tab reduces the same durable ordered log.

### Ports

- Existing `createConnection` seam supplies the upstream subscribe/send transport.
- Existing `materialize` seam supplies SSR/reload snapshots.
- The test fake implements both over one in-memory durable log.

### Constants

- Session id and stream path are fixed test constants.
- No new production finite-domain constants are required.

### Commit slices

1. Durable lifecycle proof: fake durable log + acceptance test; focused tests prove it.
2. Package-quality gates + evidence + push; wrapper/static/publish gates prove it.

### Files

- `packages/fresh/src/runtime/ai/create-chat-connection_integration_test.ts`: end-to-end simulated lifecycle.
- `packages/fresh/src/runtime/ai/create-chat-connection.ts`: only if the test exposes a defect.
- `.llm/runs/feat-219-durable-chat--codex/*`: plan, evidence, drift, and resumable handoff.

### Deferred scope

Application migration and docs-page prose are intentionally excluded. Docs owner guidance: say explicitly that StreamDB shapes serve reactive tables, while AI chat requires the durable-session connection passed to TanStack AI `useChat`.

### Contributor path

Start at `src/runtime/ai/mod.ts`, follow `createNetScriptChatConnection` to its adapter module, then copy the in-memory lifecycle test when extending cursor or subscription behavior.

## Evidence

### Acceptance

| Requirement | Evidence |
| --- | --- |
| SSR seed | Fake durable snapshot materializes the initial assistant message and offset `1`. |
| Optimistic user turn | Test applies local TanStack-style optimistic state before awaiting `send`, then proves durable persistence. |
| Live tokens | Two assistant token entries arrive through every active subscription. |
| Resume after reload | Reload snapshot returns offset `3`; a new connection receives only the subsequent token. |
| Multi-tab convergence | Two independent connections receive the same user turn and both live assistant entries in order. |
| Multibyte fidelity | `—`, `…`, `é`, and `ï` survive seed, send, live fan-out, reload, and final projection. |
| StreamDB regression | Existing `createNetScriptStreamDB` test remains green; no streams production file changed. |

### Gates

| Gate | Result |
| --- | --- |
| Focused AI + StreamDB tests | PASS — 16 passed, 0 failed. |
| Scoped check wrapper (`packages/fresh`, ts/tsx) | PASS — 162 files, 2 batches, 0 findings. |
| Scoped lint wrapper (`packages/fresh`, ts/tsx) | PASS — 162 files, 0 findings. |
| Scoped fmt wrapper (`packages/fresh`, ts/tsx) | PASS — 162 files, 0 findings. |
| Full `packages/fresh` tests | PASS — 196 passed, 0 failed. |
| Full export-map doc lint | PASS — 14 entrypoints, 0 diagnostics. |
| `deno task publish:dry-run` in `packages/fresh` | PASS — dry run complete. |
| JSR fitness helper | Baseline discrepancy: reports `./ai` and `./vite` module-tag findings although doc-lint is clean and `./ai` visibly has `@module`; also reports the package's existing slow-type banner. No finding introduced by this test-only slice. |

### Implementation result

The baseline adapter and proxy already satisfy the requested production contract. This slice adds the missing integrated acceptance proof in `create-chat-connection_integration_test.ts`; no production source change was necessary.

### Reconcile

- Issue #219 remains open and its current owner comment defines final closure as eis-chat consumer migration. This slice proves the package seam but does not perform that external app migration.
- No PR was opened, as required. No issue labels or milestone were changed.
- Docs handoff: state that StreamDB shapes are for data tables/live-query collections; durable AI chat uses the `@netscript/fresh/ai` subscribe/send connection with TanStack AI `useChat`.
