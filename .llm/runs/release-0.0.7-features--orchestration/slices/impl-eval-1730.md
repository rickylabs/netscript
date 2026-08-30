use harness

# IMPL-EVAL — #1730 provider-invisibility guard, content head `1baabbd6`

You are a **fresh, separate** `formal_impl_evaluation` session: Claude **Fable 5 · medium**, native
opposite-family for Codex-authored work (`lane-policy.md:46`). You did not author this and must not
fix it — findings with required actions only.

## Where to work

Your **own detached worktree** — not `/home/agent/projects/netscript/worktrees/007-leaf-1730` (D-19).
Establish the head yourself from live git and GitHub; do not trust a SHA here.

## What this leaf is

`RequestContext` must reach TanStack `chat({ context, metadata })` and tool handlers and **nothing
that reaches a provider**. That negative invariant was guarded at the *adapter* boundary but not in
the loop. The #1696 IMPL-EVAL proved the hole by mutation: folding `request.context` into
`modelOptions` (A) or dropping it from tool dispatch (C) each failed 2 tests, but **appending
`JSON.stringify(input.context)` to `system` inside `agent/loop.ts` (B) failed none — 9/9 stayed
green.** This leaf closes B.

Test-only. `agent/loop.ts` and the bridge are unchanged.

## Re-derive; do not accept

The supervisor measured all of this. **That is not evidence for you.**

1. **The guard must fail.** Apply mutation B at `agent/loop.ts:159` —
   `system: \`${input.system ?? ''}${JSON.stringify(input.context ?? {})}\`` — and confirm a **named**
   test goes red. Then revert and prove the tree clean. Also try to **defeat the guard**: it asserts
   absence of a sentinel over a `providerBoundPayload` of `messages`/`system`/`tools`/`options` minus
   `context`. Is there a provider-bound path it does not project? If you find one, that is a finding.
2. **Retry and continuation coverage.** The fixture forces 429-retry → tool-call → continuation.
   Confirm the assertion runs over **every** `provider.requests[i]`, not `[0]`.
3. **S3.** `never reaches the Anthropic provider wire request` was renamed to `Anthropic adapter omits
   context from direct wire serialization` because it could not detect mutation A (the adapter drops
   unknown `modelOptions` keys itself). Rule whether the new name and its boundary comment are honest,
   and whether the vector it disclaims is genuinely owned by the seam test it points at.
4. **Scope.** The leaf's delta over its **merge base** (`3e5cbabf`) must touch zero product outside
   `packages/ai/tests`. Measure over the base, not `origin/main..HEAD` — the naive diff shows 23 files,
   all base motion.
5. **Receipts — by `argv` and `durationMs`, never `exitCode`.** Seven receipts live under **ignored**
   `.llm/tmp/gate-receipts/test-ai-request-context-provider-guard--1730/receipts/` by design: the plan
   lands the evidence commit first, then cuts receipts at that immutable head. Verify all seven at
   `gitHead == actualGitHead == 1baabbd6`.
   **One was defective and was repaired**: `publish-dry-run` recorded `durationMs: 150`; the real task
   takes ~30–40 s, so it was a replay, not a run. Re-cut at attempt 2 → 30,719 ms. Confirm the repair
   and satisfy yourself no other receipt has the same shape.
6. **`doc-lint` is a contracted delta, not a pass.** Base `3e5cbabf` total **20**, head total **20**.
   Verify the delta and that the plan names the base number.
7. **JSR audit** at head and base: **2 findings each**, identical (`F-DOCT-5` `src/ports` 13>12 and
   `F-JSR-7` slow-types), no increase, both base-inherited — the #1768 class for `packages/ai`.
8. `deno.lock` byte-unchanged; no generated carrier moved.

## Rulings

1. **Does the leaf satisfy #1730's five acceptance points?** Say which are met and by what evidence.
2. **Is the guard sufficient**, or does a provider-bound path escape its projection?
3. **Is the renamed Anthropic test honest** about what it covers?
4. **Is a gitignored receipt set acceptable** as durable evidence for merge, given it does not survive
   worktree removal? Rule plainly — the alternative (committing receipts) moves the head after they
   are cut, which is the problem this design avoids.

## Deliverable

Write `evaluate.md` in the leaf run dir per the harness evaluator template — metadata, immutable
identity, re-measurement, gate tables, anti-pattern check, findings with required actions, lessons,
and a verdict with re-evaluation scope if not terminal. Commit **evidence-only**, push by explicit
refspec, report your head.

## Hard boundaries

Do not fix, merge, ready-flip, relabel, close, tick acceptance boxes, or edit the PR body — including
on `PASS`. Revert every perturbation and prove the tree clean. No `e2e:cli`, Aspire, Docker or browser
gates; no runtime lease is held. Do not touch `deno.lock`.
