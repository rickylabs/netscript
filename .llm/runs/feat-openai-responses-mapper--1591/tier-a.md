# Tier-A — #1591 typed OpenAI Responses generation-options mapper

**Content head:** `ff7d2de60ef470c312d633b851975d67a6774471`
**Base:** `0331014fe` (research/plan) · **Verdict:** ACCEPTED

## Ceiling

Exactly the three authorized files touched: `openai-compatible.adapter.ts`,
`generation_options_test.ts`, `openai_compatible_test.ts`. No change to
`packages/ai/src/contracts/generation.ts`, `tanstack-chat-client.ts`, or any other provider adapter.
`deno.lock` byte-identical, `edfa0c24…`.

## Substance — verified against the authoritative wire shape and the issue's own scope boundary

`openAiResponsesGenerationModelOptions` matches LD-2/the brief's sketch exactly: `reasoningEffort`
(excluding `'off'`) → `reasoning: { effort }`; `maxOutputTokens` → `max_output_tokens`; empty →
`undefined`. Both field names independently confirmed against
`https://developers.openai.com/api/reference/typescript/resources/beta/subresources/responses/methods/create`
before this slice was even dispatched (`research.md`).

**The out-of-scope boundary was respected.** Grepped the diff for `output`/`function_call`/`call_id`/
`toTanstackChatClient` — zero hits beyond the pre-existing import line. This slice touches only the
request-side generation-options mapping; the Responses API's discriminated-union response/streaming
shape (message/function_call items, `output_item.added/done`, etc.) is untouched, exactly as the
brief required.

**The integration test is genuinely strong, beyond what the brief asked for.** Rather than merely
checking which function reference gets selected, it stubs `globalThis.fetch`, drives a real
`client.stream()` call through the full `toTanstackChatClient` pipeline, and asserts the **actual
serialized JSON request body** sent over the wire: `reasoning`/`max_output_tokens` present and
`reasoning_effort`/`max_tokens` **absent** for `api: 'responses'`, and the mirror-image for
`chat-completions` and unset — proving mutual exclusion in both directions, not just presence. The
pure-function unit tests use `Object.hasOwn` to prove the `off` case genuinely omits the `reasoning`
key rather than asserting a value-level equality a subtly wrong implementation could also satisfy.

## Evidence — a real tooling gap found and worked around, not silently trusted

**D-1 (see `drift.md`): `run-gate.ts`'s `check`/`lint`/`fmt-check` catalog gates returned a
non-probative cache hit.** All three receipts showed `outcome: PASS`, `exitCode: 0`, **zero-byte
stdout**, and a `(cached, inputs unchanged)` stderr marker — Deno's own task-runner cache skipped the
underlying wrapper script entirely, a distinct and more severe failure mode than the previously
documented "short duration ≠ replay" heuristic, since here the script never ran at all. Re-verified
all three by direct `deno run` invocation of the wrapper scripts (bypassing `deno task`'s cache
layer): `check` 100 files / 0 diagnostics, `lint` 100 files / 0 findings, `fmt-check` 100 files / 0
findings — genuinely confirming the PR body's claims. The cached, empty receipts were discarded
rather than committed as evidence.

`exports-drift` and `mcp-export-corpus` have no catalog entry on `main` yet (the D-5 fix from
`#1387`'s own leaf hasn't landed on `main`) — ran directly: `docs:exports-drift` PASS;
`check:mcp-export-corpus` PASS, sha256 `a3c4c91e4931…`, matching the PR body's cited hash exactly.
`quality:gate` exit 0, all 36 packages `FAIL=0`, only pre-existing WARNs. `test`: real receipt,
`gitHead == actualGitHead == ff7d2de60`, **150 passed / 0 failed**.

| Gate | Method | Result |
| --- | --- | --- |
| `check` (scoped) | direct wrapper (cache-bypassed) | PASS, 100 files, 0 diagnostics |
| `lint` (scoped) | direct wrapper (cache-bypassed) | PASS, 100 files, 0 findings |
| `fmt:check` (scoped) | direct wrapper (cache-bypassed) | PASS, 100 files, 0 findings |
| `test` (`packages/ai/tests`) | receipt, `gitHead == actualGitHead` | PASS, **150/0** |
| `docs:exports-drift` | direct command | PASS |
| `check:mcp-export-corpus` | direct command | PASS, sha256 `a3c4c91e4931…` matches PR body |
| `quality:gate` | direct command | PASS, exit 0, `FAIL=0` across 36 packages |
| `deno.lock` | `sha256sum` | byte-identical, matches PR body's cited hash |

## Findings

- **D-1**, above — a real, tooling-wide evidence-integrity gap, not scoped to this slice, not fixed
  here (shared harness tooling outside this leaf's ceiling).
- No content defects.

## Verdict

**ACCEPTED.** The implementation is correct, precisely bounded, and its own tests prove more than
the minimum required. Every gate the author claimed was independently re-verified rather than
trusted — one of those re-verifications (the cached `check`/`lint`/`fmt-check` receipts) surfaced a
genuine, previously-undocumented harness tooling gap, now recorded for other lanes.
