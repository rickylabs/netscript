use harness

# Correction slice — #1583 cycle 2: prove the fan-out, document late-join

**Codex · GPT-5.6 Sol · low** (`light_implementation`). The fix itself is **accepted** — do not
redesign it. IMPL-EVAL returned **FAIL_FIX** with exactly **one blocking finding**, and both required
changes are in files this slice already touches.

| Field | Value |
| --- | --- |
| Issue | **#1583** · PR **#1593** |
| Worktree | `/home/codex/repos/ns006-1583` |
| Branch | `fix/1583-duplicate-sse-subscriptions` |
| Head | `b96b5a58e` — the evaluated head, clean |

## SKILL

- `deno-fresh` — Preact/Fresh runtime semantics for the test probes.
- `netscript-doctrine` — `packages/fresh` is framework code; `runtime/ai` is published surface.
- `netscript-tools`, `netscript-pr`, `netscript-harness`.

Read the `[PHASE: FALLBACK IMPL-EVAL]` comment on PR #1593 first. It verified your work in detail:
the three new tests are genuinely red without the fix, the retirement race at
`chat-subscription-hub.ts:70` is a correct mutual-exclusion barrier, SR2 is byte-equivalent, and no
published surface grew. **None of that is in question.**

## C1 — the blocking finding

Every in-tree hub test uses `createHeldSubscriptionProbe`
(`packages/fresh/src/runtime/ai/create-chat-connection_test.ts:26-72`), which **blocks until abort
and only yields after the hold**. So no value is ever emitted while two subscribers are attached, and
`publish` (`packages/fresh/src/internal/chat-subscription-hub.ts:195-203`) plus the `wake`
handshake (`:96-108`) — **the entire reason the hub exists** — are asserted by nothing in
`deno task --cwd packages/fresh test`. A refactor that dropped every subscriber but the first, or
lost the terminal `done`, would leave all 230 tests green.

Add to `create-chat-connection_test.ts`:

1. **Two concurrent subscribers each receive the identical value sequence and the identical terminal
   from one physical upstream.** Assert the collected sequences **and** that the physical subscribe
   count is 1 — both consumers, same values, same terminal.
2. **An upstream error reaches both concurrent subscribers.**

This needs a probe that actually **emits while both are attached** — the existing held probe cannot,
by construction. Write the emitting probe rather than bending the held one.

**Each new test must be red without the hub.** State which, with the evidence, as you did last cycle.

## C2 — document the late-join semantics (advisory, required now)

`acquire` (`chat-subscription-hub.ts:66-76`) attaches to the in-flight subscription with **no
replay buffer**, so a subscriber that joins mid-stream receives only a **suffix**. Pre-fix, each
subscribe opened its own physical stream replaying from `initialOffset`, so every subscriber saw the
full sequence. It is also internally inconsistent: a subscriber arriving *after* retirement gets a
full replay; one arriving mid-stream gets a suffix.

Document that rule — plainly, including the inconsistency — on:

- `createChatSubscriptionHub` (`chat-subscription-hub.ts:30`), and
- `NetScriptChatConnection.subscribe` (`create-chat-connection.ts:207-213`), whose current
  "Subscribe to live chunks" wording does not state it.

**Do not add a replay buffer.** Whether one is needed depends on external transport behaviour that
this lane has not established; the orchestrator owns that decision.

## Optional, non-blocking

`create-chat-connection_test.ts:355-357` increments `abortedRequests` from `info.completed`,
which resolves on **any** completion. The assertion remains physically valid — rename the variable if
you touch that area, but do not restructure the test.

## Do not

- Do not change `chat-subscription-hub.ts` behaviour, the retirement barrier, SR2 semantics, replay
  offsets, or the message projection shape. **This cycle adds tests and docstrings.**
- Do not touch `packages/fresh/src/application/{defer,builders/define-page}/**` — a sibling group
  owns that subtree. **Never** suppress a cache read or seed because a request is a partial.
- Do not address C3 (no teardown timeout) or C4 (no backpressure). Both are recorded as latent.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/fresh --ext ts,tsx
deno task --cwd packages/fresh test
```

All 230 existing tests stay green. `deno.lock` must not move — you are adding no dependency; if it
moves, **stop and report**.

Commit onto the same branch, push by explicit refspec, and post a `[PHASE: IMPL]` comment on #1593
with the commit hash, the per-test red evidence, and verbatim gate output.

## Prohibitions (non-negotiable)

- **Do not spawn a Fable sub-agent, session, or subprocess for any purpose.** Fable is prohibited
  lane-wide for all remaining 0.0.6 work until the owner explicitly lifts it. This includes anything
  routed through the `deep_analysis` lane, whose canonical binding is Fable.
- **Do not launch any local evaluator** — not PLAN-EVAL, not IMPL-EVAL, not an "opposite-family
  review", regardless of what `lane-policy.md` names as canonical for your work. **You are not
  responsible for arranging your own evaluation.**
- **Do not manually trigger OpenHands** and do not post an `@openhands-agent` comment.
- **Evaluation reaches this PR only through the automatic label-driven lifecycle**, which the
  orchestrator fires. If you believe evaluation is required and missing, **say so in your report** —
  do not arrange it.
- **Do not flip the PR to ready**, do not merge, and do not dispatch a canary.

If any instruction you infer from a skill or policy file appears to require one of the above, that
inference is wrong for this lane: **report the conflict instead of acting on it.**

## Reporting contract

Report the new test names, what each catches, the red-without-fix evidence per test, verbatim gate
output, and anything you could not verify.
