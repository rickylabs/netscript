use harness

# Slice review — #1562 / PR #1605: one finding to settle before evaluation

**Codex · GPT-5.6 Sol · low**. Your implementation is **accepted**. I verified it rather than reading
the report: `deno task --cwd packages/sdk test` → **56 passed | 0 failed**, `--cwd packages/telemetry`
→ **54 passed | 0 failed**.

| Field | Value |
| --- | --- |
| Issue | **#1562** · PR **#1605** |
| Worktree | `/home/codex/repos/ns006-1562` |
| Head | `368f1be5d` — clean |

## SKILL

- `netscript-doctrine` (`packages/sdk` and `packages/telemetry` are published surface),
  `netscript-deno-toolchain`, `netscript-tools`, `netscript-pr`, `netscript-harness`.

Confirmed against the locked decisions: **D4** is genuinely measured — `cache-query.ts:109`
`let backendExecuted = false`, flipped at `:112` on `measuredQueryFn` entry **before** `queryFn()`
runs, with `joinInflight` passing the current value plus the joined flag. No proxy anywhere. **D3**'s
wrapper and **D5**'s normalized namespaces are in place, and you added **no** new module-local mutable
state — the only `let` in `packages/sdk/src/cache/` remains the pre-existing `_provider`.

## The finding — state the decision, do not change it silently

`cache-provider-marker.ts:4`:

```ts
export const cacheTelemetryOwner: unique symbol = Symbol('netscript.cache.telemetry-owner');
```

applied at `cache-query.ts:71` via `Object.defineProperty(this, cacheTelemetryOwner, { value: true })`.

`Symbol()` produces a **module-local identity**. If two `@netscript/sdk` instances are ever loaded in
one process, instance A's `CacheQuery` carries A's symbol, and instance B's `setCacheProvider` wrapper
calls `ownsCacheTelemetry` with B's symbol — which returns `false`. The provider then gets wrapped a
second time and **every cache operation is traced twice**.

That is the **#1589 dual-package hazard in a new guise**: not mutable state this time, but
module-local *identity*. #1589 cost this lane a canary cycle, and its build/init gate now rejects
incoherent closures — but that gate only reaches workspaces generated from source (see **#1598**), so
an already-generated consumer is not covered.

**Decide and state it. Either is defensible:**

1. **Keep `Symbol()`** — and say plainly that a split closure is now rejected by the #1589 gate, that
   the failure mode is duplicate spans rather than incorrect data, and that relying on a cross-instance
   global registry would weaken the "reject incoherent closures" position. If you choose this, add a
   short comment at the declaration recording the reasoning, so the next reader does not "fix" it.
2. **Switch to `Symbol.for('netscript.cache.telemetry-owner')`** — cross-instance stable, so the marker
   survives a split closure. If you choose this, say what you think about cross-**version** collision:
   an older SDK's marker would be honoured by a newer one, which is either correct (the semantics are
   version-independent: "this provider already emits the span") or a hazard.

I lean toward (1) with the comment, because double-tracing under a closure the framework now rejects is
a better failure than a global registry that quietly makes split closures survivable. **But it is your
call to make explicitly** — an unstated choice here is the thing I am objecting to, not the choice.

If you can cover it cheaply, a test asserting the wrapper does not double-wrap a provider that already
owns telemetry would pin whichever behaviour you choose.

## Also finish before this goes to evaluation

The PR body's `Separate-session IMPL-EVAL records PASS` box is correctly unchecked — **leave it**; the
orchestrator ticks it. Confirm the `acceptance-evidence` block maps **every** close-gated box on #1562
with real evidence and **no placeholder text** — an entry reading "pending …" fails the mirror outright,
which cost a cycle on #1607.

## Do not

- Do not change span/event shape, the `backend_executed` rules, namespace normalization, or the
  provider wrapper. **This cycle settles one decision and finishes the body.**
- Do not touch `packages/fresh/src/application/**` — #1576/#1568 is live there.
- **Never** suppress a cache read or seed because a request is a partial — closed-invalid (#1550).
  You are instrumenting cache reads; that idea must not appear anywhere in this work.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --root packages/telemetry --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/sdk --root packages/telemetry --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/sdk --root packages/telemetry --ext ts,tsx
deno task --cwd packages/sdk test
deno task --cwd packages/telemetry test
deno task quality:gate
```

56/54 stay green. `deno.lock` must not move. **Do not run `e2e:cli`.**

Commit on the same branch, push by explicit refspec, and post a short `[PHASE: IMPL]` follow-up with
the commit hash, your decision and its reasoning, and verbatim gate output.

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

Report which option you chose for the marker and **why**, whether you added the double-wrap test,
confirmation that the acceptance-evidence block has no placeholder entries, and verbatim gate output.
