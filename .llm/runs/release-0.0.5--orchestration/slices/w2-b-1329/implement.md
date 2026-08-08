use harness

You are the W2-B implementation supervisor for the NetScript 0.0.5 stable release. You own exactly
one PR cluster: **#1329 — the documented SSE consumer shape differs from the wire protocol and does
not specify the standard event/OTEL envelope.**

This is the **contract dependency for W3-A (#1326)**. W3-A cannot dispatch until you land. Design
the exported envelope so a reconnecting durable producer can be built on it without a second
revision.

## SKILL

Activate and follow, in this order:

- `netscript-harness`
- `netscript-doctrine` (this touches `packages/plugin-streams-core/**` — contract-first, then
  implementation, then tests; cite the accepted AP-13 console-warning debt and the streams connector
  convergence debt rather than generalising from them)
- `deno-fresh` (the Fresh 2.x consumer helpers and the browser example — islands, `createDefine`, no
  deprecated 1.x patterns)
- `aspire` (correlated OTEL trace capture, isolated AppHost, owned cleanup)
- `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`
- `jsr-audit` (you are changing a published package's export map)

Read `.llm/runs/release-0.0.5--orchestration/slices/_shared-brief-contract.md` in full.

## Identity

| Field          | Value                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Lane           | `normal_implementation` — Codex · OpenAI · GPT-5.6 Sol · medium (justified: versioned contract + telemetry + runtime proof) |
| Worktree       | `/home/codex/repos/ns005-w2b`                                                                                               |
| Branch         | `fix/streams-versioned-sse-envelope`                                                                                        |
| Base           | `origin/main@c383b2e84`                                                                                                     |
| Slice dir      | `.llm/runs/release-0.0.5--orchestration/slices/w2-b-1329/`                                                                  |
| Draft PR       | you open it, direct to `main`                                                                                               |
| IMPL-EVAL      | Claude · Fable 5 · medium, separate session, launched by the orchestrator                                                   |
| Review pairing | `review_codex` → Fable 5 · low                                                                                              |

## The defect

Read #1329 in full and re-verify against the current worktree. The published docs teach ordinary
`EventSource.onmessage` with one change object; the real wire emits **named `data` events carrying
arrays** plus **named `control` offset frames**. No single exported versioned schema governs server
emission, generated consumers, Fresh helpers, docs, replay semantics, or W3C/correlation
propagation.

A docs-only correction is false completion. A consumer that keeps reverse-engineering untyped frames
is false completion.

## Mission

1. **Contract first.** Define the package-owned versioned schema/type contract before touching
   implementation: exhaustive event names; data-batch, control/offset, error and heartbeat payloads;
   ordering, deletion, replay, malformed-frame, correlation-identity, `traceparent` and `tracestate`
   semantics.
2. Export it through the intended public modules with coherent input/output types, module and symbol
   JSDoc, explicit `isolatedDeclarations` annotations, and **no private validator leakage**. No new
   slow-type waiver.
3. Make server emission and generated consumers derive from — or conformance-test against — that one
   authority. Reject any parallel hand-written event-name/payload table.
4. Update the Fresh 2.x helpers and the official native `EventSource` example to consume named
   events and schema-validated payloads. Keep interactive handling in the smallest appropriate
   island/helper.
5. Prove the documented example works **unchanged** against a real generated stream service:
   batching, deletion, offset/replay, reconnect, error/heartbeat, and a malformed-frame control.
6. Capture one correlated Aspire OTEL trace spanning producer → durable stream → SSE consumer with
   repository-standard correlation and W3C context.
7. Gates: schema/contract/server/Fresh tests, `doc:lint` over the full export map,
   `publish:dry-run`, scoped wrappers, `quality:gate`, `arch:check`, docs links/accuracy, then the
   serialised one-pass `scaffold.runtime` (request the token first).

Open the draft PR with `Closes #1329` only when all of the above is evidenced. Tell the orchestrator
the moment the exported envelope shape is settled — W3-A's brief depends on it.
