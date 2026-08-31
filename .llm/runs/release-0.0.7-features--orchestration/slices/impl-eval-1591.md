use harness

# IMPL-EVAL — #1591 typed OpenAI Responses generation-options mapper

You are a **separate evaluator session**, opposite family to the author (Codex authored; you are not).
You certify or reject; you do not fix, commit, push, comment on GitHub, or move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, already checked out at the evidence head |
| **Content head** | `ff7d2de60ef470c312d633b851975d67a6774471` |
| **Evidence head** | `ff991165ffc0146718dd1e516e0bddf6dd72ac8f` |
| Base | `0331014fe` |
| PR | rickylabs/netscript **#1805**, draft, `Fixes #1591` |
| Run dir | `.llm/runs/feat-openai-responses-mapper--1591/` (`plan.md`, `research.md`, `tier-a.md`, `drift.md`) |

## SKILL

`netscript-harness`, `netscript-doctrine` (`packages/ai`), `netscript-tools`, `rtk`.

## What to judge

1. **Ceiling.** Exactly three files: `packages/ai/src/adapters/openai-compatible.adapter.ts`,
   `packages/ai/tests/generation_options_test.ts`, `packages/ai/tests/openai_compatible_test.ts`.
   `deno.lock` byte-identical.
2. **The mapping is correct against the real OpenAI Responses wire.** `reasoningEffort` (excluding
   `'off'`) → nested `reasoning: { effort }`; `maxOutputTokens` → `max_output_tokens`; empty options →
   `undefined`. Verify against the authoritative reference, not just against the sibling
   Chat-Completions mapper — the whole point of this issue is that the two wire shapes differ.
3. **Selection is correct and non-regressive.** `createChatClient` must use the new mapper **only**
   when `api: 'responses'`, and must keep the existing mapper for `undefined` and
   `'chat-completions'`. A regression here silently changes every existing caller's request body.
4. **The integration test proves mutual exclusion, not just presence.** It stubs `fetch` and asserts
   on the real serialized request body. Verify it actually proves Responses fields present **and**
   Chat-Completions fields absent, and the mirror-image for the other configs — presence-only
   assertions would pass against a broken implementation that emitted both.
5. **Evidence integrity.** Verify by `argv`, `gitHead == actualGitHead`, and `durationMs` — never
   `exitCode` alone. **Check `stdout.bytes` is non-zero**: this run found (drift **D-1**) that
   `run-gate.ts`'s `check`/`lint`/`fmt-check` gates can return `PASS`/exit 0 with zero-byte stdout and
   a `(cached, inputs unchanged)` stderr marker, certifying nothing. The supervisor's Tier-A hit
   exactly that and re-verified via direct wrapper invocation — confirm that re-verification was
   sound.
6. **Out-of-scope boundary held.** The Responses API's response/streaming side (discriminated output
   items, `call_id` correlation, `response.output_item.*` events) is explicitly **not** this issue's
   scope. Confirm the diff touches no response-parsing or streaming code.

## Verdict

Return exactly one of `PASS`, `ACCEPTED_WITH_FINDINGS`, `FAIL_FIX`, `FAIL_PLAN`, naming the exact head
you certify. Findings must be concrete: file, line, what breaks. State plainly anything you could not
verify.

**Do not run `e2e:cli`, Aspire, Docker, or any browser gate.** No runtime lease is held by this lane.
