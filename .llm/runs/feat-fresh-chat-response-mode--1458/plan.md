# Plan — #1458 typed completion mode for `toNetScriptChatResponse`

**PLAN-EVAL: N/A.** Small, mechanical, single-file addition with a complete contract/scope/
acceptance/gates record. The exact upstream types and behavior are already verified in
`research.md` against the pinned dependency's actual source; no design decision remains beyond
forwarding two already-typed fields through one existing seam.

## Problem (from #1458)

`toNetScriptChatResponse()` cannot express `mode: 'await'` — a consumer needing the response to wait
for the durable write (and see write failures) must supply a full custom `toResponse` adapter and
depend on the transport package directly, defeating the point of the owned wrapper.

## Locked decisions

- **LD-1.** Add `mode?: 'immediate' | 'await'` and `waitUntil?: (task: Promise<unknown>) => void` to
  `NetScriptChatResponseOptions`. Field names and types match the upstream transport exactly (no
  renaming, no re-typing).
- **LD-2.** `defaultToResponse` forwards both into its `toDurableChatSessionResponse({...})` call.
- **LD-3.** The `toResponse` custom-adapter seam's input type also gains `mode`/`waitUntil` (both
  optional, forwarded as given), so a consumer overriding `toResponse` does not silently lose them.
- **LD-4.** No default-value change: omitting `mode` preserves today's `immediate` behavior exactly.

## Ceiling

- `packages/fresh/src/runtime/ai/create-chat-connection.ts`
- `packages/fresh/src/runtime/ai/create-chat-connection_test.ts`

No other file. No change to `@durable-streams/tanstack-ai-transport` (external, pinned), no change to
`resolveChatSnapshot` or any read-path/live-subscription code.

## Required test coverage

Per the issue's own "Expected": tests for **response status** and **failure propagation** in both
modes, using the same `toResponse` seam-substitution pattern the existing test file already
establishes (`toResponse(input) { ...capture and assert on input fields... }`):

- `mode: 'await'` (or default `toResponse`) with a source that yields normally: eventually resolves
  with the transport's real `200` (if exercising the real `defaultToResponse` path against a fake
  stream target) — or, via the `toResponse` seam, assert `input.mode === 'await'` is forwarded.
- `mode` omitted / `'immediate'`: assert `input.mode` is `'immediate'` or `undefined` (matching
  LD-4 — no forced default written into the wrapper) via the seam.
- `waitUntil` supplied: assert it is forwarded into `input.waitUntil` unchanged (reference equality).
- **Failure propagation**, the part of the issue's acceptance most worth proving directly rather than
  through the seam: exercise the real `defaultToResponse` path (no custom `toResponse`) with a source
  that throws, once with `mode: 'await'` and once with `mode` unset/`'immediate'`, and assert the
  `await` case rejects (or the returned response reflects the failure) while the `immediate` case
  still resolves successfully (matching the transport's own documented behavior: immediate mode
  never surfaces a background write failure to the caller).

## Tier-A stop

Scoped `check`/`lint`/`fmt` (`packages/fresh`); the relevant test file(s); `docs:exports-drift`
(no new public symbol is added — `NetScriptChatResponseOptions` is a widened existing interface, not
a new export, so this should stay flat); `deno.lock` hash check.

**Known tooling gap (D-1, filed against #1591's leaf, not fixed here):** `run-gate.ts`'s
`check`/`lint`/`fmt-check` catalog gates can return a non-probative `(cached, inputs unchanged)`
zero-byte-stdout result. If a cut receipt shows empty `stdout`, re-verify by invoking the underlying
wrapper script directly (`deno run ... .llm/tools/run-deno-check.ts ...` etc., bypassing `deno task`)
before trusting it.

## Acceptance

- [ ] `mode`/`waitUntil` added to `NetScriptChatResponseOptions`, matching the upstream types exactly.
- [ ] Both forwarded through `defaultToResponse` into the real transport call.
- [ ] The `toResponse` seam's input type also carries both, for custom-adapter symmetry.
- [ ] Response status and failure propagation proven in both modes, per the issue's "Expected".
- [ ] Ceiling respected exactly; `deno.lock` byte-identical.
- [ ] `Refs #1458` in the PR body; closing keyword only if this PR fully resolves the issue (it does).
