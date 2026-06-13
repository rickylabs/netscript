# Plan — 5d4 streaming (defer + PSR + e2e streams)

## Run Metadata

| Field          | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Run ID         | feat-package-quality-wave5-apps--5d4-streaming         |
| Branch         | `feat/package-quality-wave5-apps--5d4-streaming`       |
| Phase          | Plan & Design (Phase 2 of 2)                             |
| Target         | `@netscript/fresh`                                     |
| Archetype      | 3 — Runtime / Behavior                                |
| Scope overlays | `SCOPE-frontend`                                       |

## Archetype

Archetype 3 (Runtime / Behavior) is selected because the wave owns long-running streaming lifecycle: abort handling, KV watch subscriptions, heartbeat cleanup, and renderer teardown. The defer island hydration and page rendering are frontend concerns, so `SCOPE-frontend` is also applied.

## Current Doctrine Verdict

From `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`: `@netscript/fresh` is **Restructure**. Headline action: split `builders/mod.ts` (1,110 LOC) per builder concern and add subpath exports.

This wave does **not** resolve the top-priority `builders/mod.ts` split, but it must not deepen the restructure debt. New streaming code must follow Archetype 3 layering and folder vocabulary.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1    | Public types first; exported props use public types only. |
| A2    | Consumer API: pass a signal, receive a stream. No hidden globals. |
| A4    | No concrete lifecycle in base classes. |
| A5    | Composition over inheritance for renderers and SSE adapters. |
| A6    | Helpers must be justified; prefer platform streams. |
| A7    | Web Platform APIs first (`ReadableStream`, `AbortSignal`, `EventSource`). |
| A8    | One concern per file; telemetry, policy, and renderer wiring separated. |
| A10   | Composition root owns lifecycle ports. |
| A13   | Crash boundaries explicit. |
| A14   | Fitness gates preserve doctrine. |

## Goal

Deliver a locked implementation plan for RFC 13 (Progressive Streaming Rendering) and RFC 16 (end-to-end durable streams) in `@netscript/fresh`, with all Plan-Gate criteria satisfied and all known lint/surface defects mapped to named slices.

## Scope

- Fix public-surface type defects in `packages/fresh` streaming files:
  - `private-type-ref` in `DeferPage.tsx`.
  - `missing-jsdoc` + `private-type-ref` in `stream-error-boundary.tsx`.
- Verify and harden abort/cleanup plumbing in `server/stream.ts`, `server/sse.ts`, and `streams/mod.ts`.
- Add or expand tests that prove:
  - renderer cancellation on abort,
  - KV watch cleanup on abort,
  - client durable-stream subscription lifecycle.
- Align streaming telemetry with the convention established in 5d1.
- Update README permissions and streaming semantics if missing.
- Record new drift / debt entries for anything discovered that cannot be fixed inside the wave.

## Non-Scope

- Full `@netscript/fresh` archetype restructure (builders split, folder migration).
- Rewriting the Fresh runtime integration or route handler pipeline.
- Changes to `plugins/streams` server adapter (unless a defect in the boundary is found).
- Lockfile regeneration or dependency upgrades.
- Documentation site or RFC text edits beyond README updates.

## Hidden Scope

- JSDoc additions may expose additional doc-lint issues in adjacent files; budget one slice for doc lint sweep.
- Public type fixes may cascade to `packages/fresh-ui` or `plugins/streams` type-check; include consumer gate.
- Abort tests need a deterministic clock/fake timer strategy; may require a small test port.

## Locked Decisions

| ID          | Decision                                                                 | Rationale |
| ----------- | ------------------------------------------------------------------------ | --------- |
| L-5d4-1     | Keep the existing `defer/`, `server/`, `streams/` folder layout.         | Folder shape is already doctrine-aligned for the touched surface; full restructure is out of scope. |
| L-5d4-2     | Replace private Preact type refs with public or local type aliases.      | Satisfies F-5, F-7, and JSR publishability; no behavior change. |
| L-5d4-3     | Pass `AbortSignal` through every stream creation path.                   | Required by AP-11/AP-12 avoidance and runtime cancellation contract. |
| L-5d4-4     | Emit telemetry through the `@netscript/telemetry/tracer` port.           | Reuses 5d1 convention; no `console.*` in published code. |
| L-5d4-5     | Do not add new package-level exports unless RFC 13/16 explicitly demand it. | Keeps public surface minimal and publishable. |
| L-5d4-6     | Heartbeat / timers live only in adapters and accept a clock port.        | Avoids AP-12 and keeps tests deterministic. |

## Open-Decision Sweep

| Decision                                          | Status             | Notes |
| ------------------------------------------------- | ------------------ | ----- |
| Exact fallback shape for `StreamErrorBoundary`    | Safe to defer      | Design proposes render-prop fallback; slice will finalize. |
| Fake timer / clock port for stream tests          | Must resolve now   | Needed before slice 3/4 abort tests can be written. |
| Whether to expose a TanStack DB query helper      | Safe to defer      | Keep client surface unchanged unless RFC 16 demands it. |

## Risk Register

| Risk                                                              | Mitigation |
| ----------------------------------------------------------------- | ---------- |
| Preact `renderToReadableStream` abort behavior differs across versions | Pin to current lockfile; test on CI; document behavior in test. |
| `Deno.Kv` watch abort is not synchronous                          | Use `finally` blocks and explicit unwatch in tests. |
| JSDoc fixes cascade into many files                               | Scope doc sweep to changed files only; use scoped lint wrappers. |
| Consumer packages break due to public type changes                | Run `deno check` on `fresh-ui` and `plugins/streams` as consumer gate. |

## Anti-Patterns to Resolve or Avoid

| AP       | Status    | Plan |
| -------- | --------- | ---- |
| AP-1     | existing  | Do not expand `builders/mod.ts`; keep changes outside it. |
| AP-11    | risk      | Inject telemetry and clock ports; no module singletons. |
| AP-12    | risk      | Timers only in adapters with a clock port. |
| AP-13    | risk      | Replace any `console.*` found in touched files. |
| AP-19    | risk      | README declares KV / network permissions. |
| AP-22    | risk      | No new sub-barrels under `defer/` or `streams/`. |

## Fitness Gates

| Gate    | Required | Expected evidence |
| ------- | -------- | ----------------- |
| F-2     | yes      | No helper reinvention in changed files; use platform streams. |
| F-3     | yes      | Layering scan of changed files: no adapter imports in application logic. |
| F-5     | yes      | Public surface audit: all exports have JSDoc and public types. |
| F-7     | yes      | Doc-score check on `packages/fresh` changed files = 100. |
| F-9     | yes      | Permission declarations in README and `deno.json`. |
| F-13    | yes      | Runtime invariant tests: abort cancels watch + renderer + heartbeat. |
| F-14    | yes      | No `console.*` in changed files. |
| F-15    | yes      | No re-exported upstream types from package root. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `@netscript/fresh` restructure (builders/mod.ts split) | none / keep open | Out of scope for 5d4; do not deepen. |
| Any newly discovered streaming surface violation | create | Only if it cannot be fixed within wave scope. |

## Validation Plan

| Order | Gate            | Command or check                                                                     | Expected result |
| ----- | --------------- | ------------------------------------------------------------------------------------ | --------------- |
| 1     | Static — check  | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx` | No type errors in changed files. |
| 2     | Static — lint  | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx` | No lint errors in changed files. |
| 3     | Static — fmt   | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | Format clean. |
| 4     | F-7             | `deno task publish:dry-run` scoped to `@netscript/fresh`                             | Doc score 100 or known debt. |
| 5     | F-13            | Unit tests for `server/stream.ts`, `server/sse.ts`, `streams/mod.ts`                 | All pass. |
| 6     | Consumer gate   | `deno check packages/fresh-ui` and `deno check plugins/streams`                      | No type regressions. |
| 7     | F-5 / F-15      | Manual export surface review of changed files                                        | No private upstream type refs. |
| 8     | F-14            | `grep -R "console\\." packages/fresh/defer packages/fresh/server packages/fresh/streams --include='*.ts' --include='*.tsx'` | Empty. |

## Commit Slices

| # | Slice name                                    | What it proves                       | Gate(s)        | Files touched |
|---|-----------------------------------------------|--------------------------------------|----------------|---------------|
| 1 | Surface type fixes                            | Public surface lint clean            | F-5, F-7       | `defer/DeferPage.tsx`, `server/stream-error-boundary.tsx` |
| 2 | Telemetry / port polish                       | No `console.*`, port-injected tags   | F-13, F-14     | `defer/telemetry.ts`, `server/stream.ts`, `server/sse.ts` |
| 3 | Renderer abort tests                          | `renderToReadableStream` cancels on signal | F-13       | `server/stream.ts`, `server/stream_test.ts` |
| 4 | SSE / KV watch abort tests                    | Watch cleans up on abort             | F-13           | `server/sse.ts`, `server/sse_test.ts` |
| 5 | Client durable stream lifecycle tests         | Subscription starts/stops cleanly    | F-13           | `streams/mod.ts`, `streams/create-stream-db.ts`, `streams/*_test.ts` |
| 6 | Permission / README update                    | AP-19 addressed                      | F-9            | `packages/fresh/README.md`, `packages/fresh/deno.json` |
| 7 | Consumer type-check                           | No downstream regressions            | Consumer gate  | none (validation only) |
| 8 | Drift / context-pack closeout                 | Plan-Gate evidence complete          | Plan-Gate      | `.llm/tmp/run/.../drift.md`, `context-pack.md` |

## Risks

- **Preact streaming abort semantics**: mitigate by reading current lockfile version and pinning tests to observed behavior.
- **KV watch test determinism**: mitigate by mocking the watch source or using a test-only `WatchSource` port.
- **Cascading doc lint**: mitigate by scoping doc edits to touched files and running scoped wrappers after each slice.

## Dependencies

- `@netscript/telemetry/tracer`
- `@durable-streams/state`
- `@tanstack/react-db`
- `preact` / `preact/compat` / `preact/hooks`
- `fresh/runtime` (as runtime host contract)
- `plugins/streams` server adapter (boundary review only)

## Drift Watch

- If `renderToReadableStream` does not accept `AbortSignal` in the current Preact version, log drift and switch to manual reader cancellation.
- If KV watch cleanup requires an explicit `unwatch()` call beyond signal abort, log drift and update the adapter.
- If consumer type-check fails due to public type changes, log drift and either widen the scope or record debt.

---

## Review map

- `design.md` → architecture decisions, lifecycle, ports, telemetry.
- `plan.md` → this file: scope, slices, gates, validation order.
- `context-pack.md` → resumable run state.
- `drift.md` → discovered divergences.
- `research.md` → phase-1 findings reused without re-derivation.

## Assumptions

- Phase-1 research at `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/research.md` is current and authoritative.
- The Preact / Deno versions pinned by `deno.lock` are the target environment.
- CI can run `deno task check`, scoped lint/fmt wrappers, and unit tests.

## Questions for supervisor

1. Should the fake-timer / clock port be introduced as a new shared testing utility, or kept local to the stream tests?
2. If consumer type-check in `fresh-ui` or `plugins/streams` fails, do we widen 5d4 scope or record debt and defer?
3. Is a PLAN-EVAL session already scheduled, or should this plan be handed off explicitly?

## Dependencies & merge impact

- No lockfile changes in the plan phase.
- Implementation slices touch only `packages/fresh`.
- Potential consumer impact: `packages/fresh-ui`, `plugins/streams`.
- Merge impact is low-to-medium: focused surface fixes plus tests.

## Side-effect ledger

| Side effect                                         | Owner slice | Mitigation |
| --------------------------------------------------- | ----------- | ---------- |
| Public type aliases may change inferred types       | Slice 1     | Run consumer gate after slice 1. |
| Telemetry event names may need alignment with 5d1   | Slice 2     | Cross-check with `telemetry/tracer` tests. |
| New test ports (clock/fake KV) may be reusable       | Slice 3-5   | Place under `testing/` if reused outside one file. |
| README permission additions affect docs site         | Slice 6     | Keep additions minimal and accurate. |
