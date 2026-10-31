# PLAN-EVAL — round 1

Independent native Claude Opus 5.5 / high, read-only, closed stdin.

I found no blockers in the plan for #2267.

**Plan-gate checklist (archetype 2):**
- **Research is current.** It is re-checked against current main (`3d83caf`) and the owner's narrowed scope. I confirmed the bug at `packages/kv/adapters/memory.adapter.ts:520`, `:537` and `:580`: `writeEntry` and `removeEntry` call `notifyWatchers` from inside the `atomic()` mutation loop (`:211-213`).
- **Decisions are locked.** Storage helpers will return events without notifying; `atomic()` collects them and sends them in mutation order after the whole loop; standalone `set`/`delete` notify straight away. This meets the issue's request to "emit watch notifications once, after the whole commit". Fixed-key and prefix handlers only push to a queue synchronously (`:268`, `:363`), so all events from one commit still reach the consumer as one batch.
- **TTL is preserved.** `writeEntry` keeps the `expiresAt` calculation and the expiration-heap push (`:507-517`). The sweep's notify point (`:580`) is unchanged, and the existing TTL test (`packages/kv/tests/memory.adapter_test.ts:38`) still runs.
- **The tests can detect the current bug.**
  - `get()` reads storage synchronously (`:81-99`), and `ready` resolves once subscription completes (`application/watch-handle.ts:10-19`).
  - So a handler added through bracket access to the private `watchers`/`prefixWatchers` maps can capture `get(sibling)` while the notification is being sent. On the original file, it sees the sibling mutation not yet applied.
  - The plan asserts outside the callback, which gets around the swallowed exceptions at `:613-628`.
  - It correctly treats a public async-iterator read as a false-green check, and requires an original-file negative control for each new test.
- **Slices, risks and gates are present.** There are three ordered slices (S0–S2), each with files and a gate. The risk register covers false greens, lost previous values, TTL, baseline failures and head movement. The gate set is complete: structured test/check/lint/fmt wrappers, `doc:lint`, publish dry-run, JSR audit, `quality:gate`, `arch:check` and the review-thread gate.
- **Existing failures are kept separate.** The plan captures a baseline before any production edit and compares identical findings.
- **Owner constraints are recorded.** No local scaffold E2E, no labels or closing keywords.
- **Deferred scope and JSR audit.** Both are explicit. No public surface, export or dependency changes.

**One gap, not blocking:** the plan doesn't say what happens to collected events if a mutation throws partway through the loop. With the change, mutations already applied would get no notification. This falls under the deferred rollback scope, and `combineAtomicValue` can't throw for its inputs. The implementer could note it in `drift.md`.

VERDICT: PASS
