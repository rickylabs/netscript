use harness

# Slice brief — #1405 durable producer rejection taxonomy

You are the implementation agent for one small, fully specified slice. **Codex · GPT-5.6 Sol ·
low** (`light_implementation`). Do exactly this slice: do not refactor neighbours, do not rename
anything not named here, do not touch #1398's surface.

| Field | Value |
| --- | --- |
| Issue | #1405 |
| Worktree | `/home/codex/repos/ns006-1405` |
| Branch | `fix/1405-durable-producer-rejection-taxonomy` |
| Base | `origin/main@01aa12b67` |
| Orchestrator run dir | `.llm/runs/release-0.0.6-features--orchestration/` |
| Research (read it first) | `.llm/runs/release-0.0.6-features--orchestration/slices/research-1405.md` |

## SKILL

- `netscript-doctrine` — `plugin-streams-core` is a framework package; its `domain/` contracts are
  published surface. Read before editing `producer-contract-v1.ts`.
- `netscript-harness` — slice/commit trail discipline, drift recording.
- `netscript-tools` — the scoped validation wrappers and what counts as gate evidence.
- `netscript-pr` — draft PR body, closing keyword, phase comments, labels.

## The defect, exactly

Two settled **reason strings** misdescribe the state that produced them. Nothing else is wrong: no
write is silently lost, no false `delivered` is possible, and every drop path is already metered.

**D1 — close-drain window reports `producer-failed`.**
`packages/plugin-streams-core/src/application/durable-stream-producer-supervisor.ts:215` sets
`#accepted = false`, then `:216` calls `#closeGracefully()`, which `await`s `flush()` and the
connect promise before reaching `this.#transition('stopping', 0)` at `:225`. Throughout that drain
`#accepted` is false while `#state.state` is still `ready`, so both rejection selectors fall to
their `default` arm and answer `producer-failed`:

- supervisor `#writeRejectionReason()` — `:467-478`
- façade `stateRejection()` — `create-durable-stream.ts:251-262`, reached from `upsert` (`:131-133`)
  and the second write entry point (`:159-160`) because `get closed()` is `!this.#accepted`
  (supervisor `:109-111`)

`#fail()` was never called and `#state.error` is unset. The producer is healthy and closing.

**D2 — first-attempt refusal reports `retry-exhausted`.** `#failActive()` (`:412-423`) settles every
non-`aborted` failure as `retry-exhausted` (`:418-420`), across three call sites:

| Call site | Guard | True cause |
| --- | --- | --- |
| `:302` | `!isRetryable(connected.failure) \|\| attempt === maxAttempts` | **conflated** |
| `:346` | `else if (!isRetryable(result.failure))` | **refusal** — reachable on attempt 1 |
| `:350` | `if (attempt === this.#reconnectPolicy.maxAttempts)` | genuine exhaustion |

## LOCKED decisions — implement these, do not re-decide

1. **D1 reuses the existing `producer-stopping` reason. Do NOT add a `producer-closing` member.**
   `StreamWriteRejectionReasonV1` (`producer-contract-v1.ts:70-78`) already contains
   `producer-stopping`, and it already means "shutting down, not accepting". The bug is that the
   selectors cannot observe the closing intent before the `stopping` transition — fix the
   *observability*, not the vocabulary. Make the closing intent visible from the moment `close()`
   is entered (e.g. a private closing flag set alongside `#accepted = false` at `:215`, consulted by
   `#writeRejectionReason()`), and make the façade's `stateRejection()` agree — the façade must not
   独立ly re-derive `producer-failed` from a stale state snapshot. Preferred shape: have the façade
   ask the supervisor for the reason rather than duplicating the state switch, so the two can never
   drift apart again. `#stopImmediately()` (`:185-186`) has no such window and must not change.

2. **D2 adds exactly one new member to `StreamWriteUnknownReasonV1`** (`:84-87`), named
   **`transport-refused`**. This is the only public-surface addition in the slice. Semantics: the
   transport returned a **non-retryable** failure — the server positively refused — regardless of
   attempt number. Then:
   - `#failActive()` selects: `failure.kind === 'aborted'` → `transport-aborted` (unchanged);
     else `!isRetryable(failure)` → `transport-refused`; else → `retry-exhausted`.
   - Call site `:302` must stop conflating its two guards, so a non-retryable connect failure on the
     final attempt is still reported as a refusal, not as exhaustion.
   - `retry-exhausted` must remain reachable and must still be what `:350` produces.

3. **No behaviour change beyond reason strings.** Which writes are accepted, rejected, cancelled, or
   delivered is identical before and after. `#fail()` is still called from exactly the paths it is
   called from today. If you find yourself changing an acceptance decision, stop and report it.

4. **Update the doc comments and the exported surface consistently.** `transport-refused` needs its
   JSDoc line in the union, and `packages/plugin-streams-core/mod.ts:44-45` already re-exports both
   unions — verify the export still resolves; do not add new exports.

## Required tests — these are the deliverable, not an afterthought

Acceptance box 4 says a future refactor that collapses these reasons must **fail**. A test that only
asserts the new string passes trivially if someone later reintroduces the old one on the other path,
so each test must assert the correct reason **and** explicitly assert it is not the old wrong one.

1. A write issued after `close()` is entered but **before** the drain completes settles
   `rejected` / `producer-stopping`, asserted **not** `producer-failed`. You must actually hold the
   drain open (a transport whose `close`/`flush` does not resolve until the test releases it) —
   a test that races is not evidence.
2. Append transport returns a **non-retryable** failure on **attempt 1** with `maxAttempts > 1`:
   settles `delivery-unknown` / `transport-refused`, asserted **not** `retry-exhausted`, and assert
   the transport was called exactly **once** (proving no retries were exhausted).
3. Append transport returns **retryable** failures until `maxAttempts`: still settles
   `delivery-unknown` / `retry-exhausted`.
4. A non-retryable **connect** failure settles `transport-refused` (covers the `:302` conflation).
5. Existing behaviour guard stays green:
   `packages/plugin-streams-core/tests/telemetry/durable-stream-producer-telemetry_test.ts:172-219`
   already distinguishes rejected / dropped / delivery-unknown. Do not edit it to fit your change;
   if it goes red, your change altered classification and that is a stop-and-report.

## Gates — turn these green; they are part of the deliverable, not a checklist to hope about

This slice touches `packages/**`, so the scoped wrappers alone are **not** a verdict.

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-streams-core --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/plugin-streams-core --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/plugin-streams-core --ext ts,tsx
deno task quality:gate
deno task doc:lint --root packages/plugin-streams-core --pretty
deno test packages/plugin-streams-core
```

`deno task quality:gate` (= `quality:scan` + `arch:check`) is **mandatory** for a `packages/**`
slice. A new `// deno-lint-ignore`, `as unknown as`, `any`, or `@ts-ignore` introduced to green a
wrapper is a review-blocking finding, not a pass — if you think you need one, stop and report.

Do **not** run `deno task e2e:cli` — this slice does not touch scaffold output, and that gate is
expensive and serialised across the lane.

**Known hazard, pre-empted:** `deno fmt` rewraps long lines and can silently undo a scripted string
edit. After the format wrapper runs, re-grep for every string you introduced (`transport-refused`,
`producer-stopping`) and confirm it is still present in the file you put it in.

## Commit trail

1. Open a **draft PR against `main`** in the same session as your first commit. Title:
   `fix(streams): name the closing and refusal states in producer write reasons`.
   Body per `netscript-pr` — it MUST carry `Closes #1405` in `## Scope`, the run dir path, the slice
   checklist, a Definition of Done, and a fenced `acceptance-evidence` block mapping each of the
   five acceptance boxes of #1405 to its evidence. Labels: `type:fix`, `area:plugins`,
   `status:impl`, milestone `0.0.6`.
2. Commit by slice, push, and post an `[PHASE: IMPL]` comment with the commit hash and **pasted real
   gate output** (exit codes, test counts). No green box without evidence.
3. Keep `worklog.md` in your slice dir current as part of the same commit.

## Reporting contract

When done, report: the reason strings as implemented, the exact test names and what each would
catch, verbatim gate output, and **anything you could not do or that surprised you**. If you hit a
red gate, do not go idle — report the red with its output. A red gate reported is useful; a red gate
sat on is the failure mode this brief exists to prevent.

You do **not** merge, and you do **not** flip the PR to ready. The orchestrator holds merge
authority and runs the pre-merge gate.
