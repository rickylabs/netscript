# Tier-A — #1458 typed completion mode for `toNetScriptChatResponse`

**Content head:** `acb096a94e8f2dc182ebc8c73be9ba421e2a6826`
**Base:** `1a887128b` (research/plan) · **Verdict:** ACCEPTED

## Ceiling

Exactly the two authorized files touched, plus run-artifact docs. `deno.lock` byte-identical.

## Substance

`mode`/`waitUntil` added to `NetScriptChatResponseOptions` and the `toResponse` seam's input type,
matching the pinned upstream transport's field names and types exactly (verified in `research.md`
against `@durable-streams/tanstack-ai-transport@0.0.8`'s actual source). Forwarded through both
`toNetScriptChatResponse`'s call to `options.toResponse ?? defaultToResponse` and `defaultToResponse`'s
call to the real transport. Omission preserves `undefined` at every hop — no default injected by the
wrapper (LD-4).

**The failure-propagation proof is genuine, not seam-mocked.** Beyond the seam-substitution unit
test, a second test spins up a **real local `Deno.serve()`** HTTP server and drives the actual
`toNetScriptChatResponse` → `defaultToResponse` → real pinned `toDurableChatSessionResponse` against
it: `mode: 'await'` with a successful source returns `200`; the same mode with a mid-stream-throwing
source causes `toNetScriptChatResponse` to **reject** with the exact error message, proving failure
propagation through the real dependency, not a stand-in; omitted mode with the same failing source
still returns `202` and the failure only surfaces on the captured background task, matching the
transport's documented silent-log behavior. A `methods` array assertion confirms three genuinely
distinct HTTP request cycles occurred. This is local, ephemeral, in-process test infrastructure
(`port: 0`), not a runtime-lease concern.

## Evidence — independently re-verified, no committed receipts trusted as-is

The PR body cited a receipt id (`leaf-1458-focused-test-final`) with no corresponding committed file
— re-cut all Tier-A gates myself rather than accept the claim. Checked specifically for `#1591`'s
D-1 cache-hit trap (`(cached, inputs unchanged)` stderr marker / zero-byte stdout on
`check`/`lint`/`fmt-check`): **not present this time** — all three receipts show genuine, non-empty
stdout with real file-selection counts.

| Gate | Outcome | Duration |
| --- | --- | --- |
| `check` (scoped) | PASS, 200 files, 0 diagnostics | 576 ms |
| `lint` (scoped) | PASS, 200 files, 0 findings | 529 ms |
| `fmt:check` (scoped) | PASS, 200 files, 0 findings | 408 ms |
| `test` (both test files) | PASS — **19 passed / 0 failed** | 905 ms |
| `docs:exports-drift` | direct command | PASS |
| `deno.lock` | `sha256sum` | byte-identical, matches PR body's cited hash |

## Findings

None. Clean, precisely bounded implementation with genuinely strong failure-propagation proof.

## Verdict

**ACCEPTED.** Every claim independently re-verified rather than trusted; no D-1 recurrence this time.
