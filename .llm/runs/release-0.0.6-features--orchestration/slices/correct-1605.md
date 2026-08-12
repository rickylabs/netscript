use harness

# Correction slice — #1605: fix the published attribute semantics before they freeze

**Codex · GPT-5.6 Sol · low**. IMPL-EVAL returned **PASS** at `a8f4b1ba6` — your implementation is
accepted and merge is not blocked. Three small advisories are worth fixing **now** rather than after
0.0.6 publishes the attribute names, because consumers build alerts on them.

| Field | Value |
| --- | --- |
| Issue | **#1562** · PR **#1605** |
| Worktree | `/home/codex/repos/ns006-1562` |
| Head | `a8f4b1ba6` — clean |

## SKILL

- `netscript-doctrine` (`packages/sdk` and `packages/telemetry` are published surface),
  `netscript-tools`, `netscript-pr`, `netscript-harness`.

Read the `[PHASE: FALLBACK IMPL-EVAL]` comment on #1605 first. It independently confirmed D1/D3/D4/D5
— including every row of your `backend_executed` rule table against a specific test, and that
`createCacheAttributes` makes a key leak structurally impossible. None of that is in question.

## C1 — a **successful** unowned-provider read is published as `outcome=error`

`cache-provider.ts:100-104` calls `recordCacheProviderError(...)` from a `finally`, so it runs on the
success path too and stamps `outcome: 'error'`, `topology_complete: false`.

`netscript.cache.outcome` is a **published bounded enum whose other three values are lookup results**.
As shipped, any error-rate query keyed on `outcome=error` counts every healthy unowned-provider read
as a failure, indistinguishable from a real provider outage except by inspecting span status.

`topology_complete=false` **already** carries the "we cannot know the tier chain" signal on its own.
Overloading `outcome` to say it a second time costs the enum its meaning.

**Fix:** stop emitting `outcome: 'error'` on the success path. Either omit `outcome` when the operation
succeeded but topology is unknowable, or introduce an explicit `unknown` outcome value — your call,
but if you add a value, add it to the bounded enum and its validator so it cannot be set arbitrarily.
Keep emitting `error` when the operation genuinely failed. Add a test asserting a **successful**
unowned-provider read is not labelled `error`.

## C2 — `setCacheProvider(getCacheProvider())` double-wraps

The owned branch (`cache-provider.ts:61-79`) returns a plain object literal **without**
`cacheTelemetryOwner`, so re-registering the boundary wraps it a second time — two spans per
operation, both mislabelled via C1. `mod.ts:22` registers once at import so no shipped path does this,
but idempotent bootstrap and test fixtures are plausible callers.

**Fix:** mark the returned boundary as owning telemetry — one line — and add a re-registration test.

## C3 — correct the marker comment; the decision stands

Your choice of a module-local `Symbol()` is **defensible and stays**. The evaluator agrees, and so do
I. But the rationale recorded at `cache-provider-marker.ts:10` is inaccurate in two ways, and a wrong
comment is worse than none because the next reader will trust it:

1. It says a split closure "may duplicate spans". The real consequence is duplicate spans **plus**
   every operation relabelled `outcome=error, topology_complete=false` — which reads as a **cache
   provider outage**, not as a packaging error. That is a silent misdiagnosis, not the visible failure
   the comment claims. (Fixing C1 also softens this, which is worth noting.)
2. It says a global symbol "would mask incompatible cross-version closures". That holds only for a
   **boolean** marker. `Symbol.for('netscript.cache.telemetry-owner')` holding a contract-**version**
   value instead of `true` would give cross-instance recognition **and** version discrimination —
   exactly the property the note claims is unavailable.

**Fix:** rewrite the comment to state the real failure mode and the real alternative, then say why you
still choose module-local identity. Do **not** change the implementation.

## Do not

- Do not change the span/event shape, the `backend_executed` rules, namespace normalization, the
  provider wrapper's structure, or any test that currently passes. **This cycle adjusts one attribute
  value, adds one marker line, and rewrites one comment.**
- Do not touch `packages/fresh/**` or `packages/cli/**`.
- **Never** suppress a cache read or seed because a request is a partial — closed-invalid (#1550).
- Leave the `Separate-session IMPL-EVAL records PASS` box **unchecked**; the orchestrator owns it.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --root packages/telemetry --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/sdk --root packages/telemetry --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/sdk --root packages/telemetry --ext ts,tsx
deno task --cwd packages/sdk test
deno task --cwd packages/telemetry test
```

57/54 stay green (plus your new tests). `deno.lock` must not move. **Do not run `e2e:cli`.**

Commit on the same branch, push by explicit refspec, and post a short `[PHASE: IMPL]` with the commit
hash, the outcome value you chose for the unknowable-topology success case and why, and verbatim gate
output.

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

Report the C1 attribute decision and its test, the C2 one-liner and its test, the rewritten C3 comment
verbatim, and anything you could not verify.
