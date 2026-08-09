# PLAN-EVAL — W2-B #1329 versioned stream SSE envelope

**Verdict: PASS** — plan branch `origin/fix/streams-versioned-sse-envelope@95b610831` (artifacts only, no product code), evaluated against base `c383b2e84` by a separate Claude · Fable 5 · medium session on 2026-08-08.

## Evaluator identity and inputs

- Read: `evaluator/plan-protocol.md`, `gates/plan-gate.md`, `evaluator/verdict-definitions.md`,
  `netscript-harness`, `netscript-doctrine`, `jsr-audit`, `deno-fresh` skills,
  `gates/archetype-gate-matrix.md`, `debt/arch-debt.md`, issue #1329 (full body via `gh issue view`),
  and the branch's `research.md`, `plan.md`, `worklog.md` (Design), `drift.md`, `supervisor.md`,
  `preflight.md`, plus the local `implement.md` brief.
- Worked read-only from `/home/codex/repos/ns005-stable-opus5`; did not touch `/home/codex/repos/ns005-w2b`.

## Evidence independently verified (not taken from the plan)

1. **Docs defect is real.** `docs/site/durable-workflows/streams.md:121` — official example assigns
   `source.onmessage`, parses one `{ key, value? }` object with an untyped cast. Matches issue #1329.
2. **Wire is named `data`/`control` with array payloads.**
   `~/.cache/deno/npm/registry.npmjs.org/@durable-streams/server/0.3.7/dist/index.js:3734-3835`
   (`handleSSE`): writes `event: data` per message (JSON streams formatted via
   `formatResponse(path, [message])` → JSON array), then `event: control` carrying
   `streamNextOffset` + optional `streamCursor`/`upToDate`/`streamClosed`; keepalive on long-poll
   timeout is a `control` with `upToDate: true`, not a third event name. Field names confirmed in
   `@durable-streams/client@0.2.6/dist/index.js:85-95` and `src/sse.ts`. Research findings 2–4 are
   accurate, including the "heartbeat is not a wire event" distinction.
3. **No versioned public vocabulary today.** `deno doc packages/plugin-streams-core/mod.ts` shows
   only loose `ChangeEvent`/`ControlEvent`/`StateEvent`; no event-name constants, version, validator,
   parse result, replay state, or browser binding. Research finding 5 verified.
4. **Correlation floor is absent.** `packages/plugin-streams-core/src/application/create-durable-stream.ts:249-264`
   `#publishHeaders` passes `messageId: key` to instrumentation but never `correlationId`, while
   `src/telemetry/instrumentation.ts:28,68,176` and `attributes.ts:24` show the correlation attribute
   plumbing exists and goes unused on normal writes. Research finding 6 verified.
5. **Doc-lint baseline is red exactly as claimed.** Ran
   `deno task doc:lint --root packages/plugin-streams-core --pretty` myself: 5 `private-type-ref`
   diagnostics (3 in `src/telemetry/instrumentation.ts`, 2 in `src/telemetry/attributes.ts`),
   `combinedTotal: 5`. The plan owning this as unwaivered hidden scope is correct and required —
   this PR changes the export map of a published package.
6. **Generated consumer bypasses NetScript today.**
   `plugins/streams/src/adapter/resources/consumer/consumer.stub.ts:21` imports `createStreamDB`
   from `@durable-streams/state/db` directly; `:73` uses Fresh 2.x `createDefine`. Research findings
   7–8 verified. `packages/fresh/deno.json` confirms the `./streams`-style multi-entry export map and
   `create-stream-db.ts:16-18` confirms the upstream StreamDB wrap.
7. **Both cited debts exist verbatim.** `.llm/harness/debt/arch-debt.md:709`
   (`packages/plugin-streams-core — AP-13 console.warn runtime reporting`) and `:450`
   (`streams-connector-sound-deferred`). The plan cites both, preserves both, deepens neither, and
   claims closure of neither.
8. **Upstream client never echoes the cursor on requests.** `CURSOR_QUERY_PARAM` is defined and
   exported in `@durable-streams/client@0.2.6/src/constants.ts:104` but no client request code sets
   it; the server reads it optionally (`server/0.3.7/dist/index.js:3603`) for CDN collapsing.
   Resume-by-offset-only is therefore correct, which validates the plan's replay-state design as
   sufficient (see W3-A section for the advisory).

## Findings (severity order)

### F1 (low) — Replay snapshot omits `streamCursor` and terminal/closed state

Evidence: worklog Design declares `StreamSseReplayStateV1 — last committed offset plus pending
batch state`; D5 locks cursor/closed into the **control payload** but the bind-handle snapshot
retains neither. Verified upstream behavior (evidence item 8) shows offset-only resume is correct,
so this does not force an envelope revision — cursor echo is a CDN optimization and closed is
readable from the last control outcome. Concrete change: during S1, either carry
`lastObservedCursor?` and a terminal `closed` marker in `StreamSseReplayStateV1`, or state in the
contract JSDoc/docs that resume is offset-only and terminal state is read from the final control
outcome. Additive either way; not plan-gate blocking.

### F2 (low) — SSE-consumer OTEL leg mechanism unnamed

Evidence: plan S4/validation row 7 name isolated AppHost, leak-check bracketing, browser/consumer
receipt, and OTEL trace export — the proof is executable, not asserted. But the plan does not say
where the *consumer* span is emitted; a browser `EventSource` island does not export OTLP. The
implementer will need a Deno-side consumer (test consumer or route handler) inside the AppHost to
close the producer → durable stream → SSE-consumption trace. This is slice-internal mechanics, not
a contract or gate gap. Concrete change: record the consumer-span host in the S4 worklog entry so
IMPL-EVAL can check the trace is genuinely end-to-end rather than producer-only.

### F3 (informational) — Version detection is validation-failure, by design

"Versioned" here cannot mean a wire version field: D10 locks the transparent proxy (no byte
rewriting) and research correctly refuses to mutate upstream payloads. The operational answer the
plan gives is: an unrecognized/incompatible frame fails the v1 schema, becomes a typed
non-retryable `StreamSseErrorPayloadV1` with event name and last committed offset, and never
advances replay (D7 + Diagnostics section); upstream drift is caught by conformance fixtures pinned
to real server output (risk register row 1). That is a defined rejection behavior, not a decorative
version field. Verified as coherent; no change required.

## The decision questions

1. **Contract first, one authority — yes.** S1 (contract, schemas, parse, replay, binding) precedes
   S2 (producer/service conformance) and S3 (Fresh/generated/docs consumers). D1/D10 forbid a
   parallel table; the docs example is governed by a copy-exact conformance test (S3, validation
   row 6); the contributor path states no service/generator/docs file owns a second event-name or
   payload table. No surviving parallel table found in the planned shape.
2. **Complete enough for W3-A — yes, with F1 noted.** Exhaustive names (D2), data-batch/deletion
   (D3, delete = no value, removes `type + key` identity), control/offset (D5), heartbeat
   classification (D5), error payload with retryability + last committed offset, ordering
   (wire-order arrays; control commits all preceding pending data), replay/resume-from-offset
   (D6, at-least-once, idempotent materialization documented), malformed frames (D7,
   never-advance), correlation identity with key fallback (D4), `traceparent`/`tracestate`
   preserved verbatim (D3/D4). The reconnect seam is deliberately inputs-only (D8) — correct scope
   split with #1326.
3. **Versioning works operationally** — see F3.
4. **Wire is the authority.** S4 proves the unchanged documented example against a real generated
   service covering batching, deletion, control/replay, reconnect seam, heartbeat/error/malformed;
   conformance fixtures are pinned to real server output. A docs-only correction cannot tick this
   plan's gates.
5. **JSR surface handled.** D9 (explicit public types, no inference from private validators),
   research jsr-audit scan present with the 5 `private-type-ref` + 1 slow-type baseline named as
   owned hidden scope, `./sse` subpath included in full export-map `doc:lint`, `publish:dry-run`,
   detached import checks (S1/S5, validation row 4), zero-waiver bar stated.
6. **Fresh work sound.** D11: helper re-exports/binds the core authority, generated code imports
   the NetScript helper, interactivity stays in one island, seed routes keep `createDefine`; matches
   the deno-fresh 2.x rules and the current stub's structure.
7. **OTEL proof is executable** — leak-check → isolated AppHost → trace export → owned cleanup →
   leak-check (validation row 7), with F2's mechanism note.
8. **Acceptance truthful.** All eight #1329 boxes map to slices: 1→S1, 2→S2/S3, 3→S3+S4, 4→S3/S5
   docs + Design semantics, 5→S2 (D3/D4), 6→S4, 7→S1 drift-negative fixtures, 8→S3/S5. None is
   observational-only. Both debts cited and preserved (verified rows). Non-scope correctly excludes
   W3-A reconnect, connector convergence, AP-13 replacement, and merge/publish authority.
9. **Gates can fail.** Every proving gate is a command with an expected raw exit code; the
   worklog's gate tables already demonstrate honest `FAIL` (doc-lint baseline) and `NOT_RUN`
   states, so a did-not-run is visible, and the serialized `scaffold.runtime` requires a recorded
   token grant before execution.

## Plan-gate checklist

- [x] **Research present and current** — `research.md` re-baselined against
      `origin/main@c383b2e84` 2026-08-08; I spot-checked findings 1–8, 10–12 against the tree and
      upstream caches (evidence above); the stale prepared/held metadata and missing
      `_shared-brief-contract.md` are recorded in `drift.md`.
- [x] **Decisions locked** — D1–D11 with rationale.
- [x] **Open-decision sweep** — table present; deferred items (reconnect algorithm, connector
      convergence, AP-13 reporter) are genuinely safe to defer — W3-A consumes D6–D8. My own sweep
      found no unflagged decision that forces rework (F1 is additive; F2 is slice-internal).
- [x] **Commit slices** — S0–S6, ordered, 7 < 30, each names what it proves, its decisive gate,
      and files.
- [x] **Risk register** — present with concrete mitigations; the two highest-value rows (upstream
      drift pinning, at-least-once double delivery) match verified upstream behavior.
- [x] **Gate set selected** — F-1..F-19 incl. F-6/F-7 (JSR/doc) and F-13 (runtime invariants)
      matches the Archetype-3 required column of `gates/archetype-gate-matrix.md`, plus
      frontend/service/docs overlays.
- [x] **Deferred scope explicit** — Non-Scope + Deferred Scope sections.
- [x] **jsr-audit (package wave)** — surface scan in `research.md` over `.`, `./telemetry`,
      `./testing` plus the planned `./sse`; slow-type and private-type risks named with owning
      slices (S1/S5); baseline red independently reproduced.

## Contract completeness for W3-A

Nothing here blocks building #1326 on this envelope; both items are additive and should be folded
into S1 while the type is still unpublished:

1. **Cursor and terminal state in the replay snapshot (F1).** The wire contract already models
   `streamCursor` and `streamClosed` (D5), so the envelope itself needs no revision — but
   `bindStreamEventSourceV1`'s replay snapshot, W3-A's reconnect input, retains only the committed
   offset and pending batch. Either add optional `lastObservedCursor` and a terminal/closed marker
   to `StreamSseReplayStateV1` now, or document in the contract that resume is offset-only
   (verified correct against upstream 0.2.6/0.3.7) and that terminal state is read from the last
   control outcome. Deciding it in S1 costs one line; deciding it in W3-A costs a published-type
   change.
2. **Offsets are opaque.** The contract should state that offsets (`0_0`-style) are opaque ordered
   tokens never parsed by consumers, so W3-A's bounded-reconnect bookkeeping does not grow a
   dependency on upstream's offset encoding.
3. Already sufficient and verified: retryable/non-retryable split on `StreamSseErrorPayloadV1`,
   last-committed-offset on every error, heartbeat as liveness signal, at-least-once + idempotent
   materialization rule, correlation/trace identity stable across replay, dispose semantics, and
   `streamClosed` as the no-more-data signal.

