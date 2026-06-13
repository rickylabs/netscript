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

Deliver a locked implementation plan for RFC 13 (Progressive Streaming Rendering) and RFC 16 (end-to-end durable streams) in `@netscript/fresh`, with all Plan-Gate criteria satisfied, the full Archetype-3 fitness-gate set mapped, and every measured lint / publishability defect (113 doc-lint + 62 JSR problems) reconciled to named slices.

## Scope

- Fix public-surface type defects in `packages/fresh` streaming files:
  - `private-type-ref` in `DeferPage.tsx`.
  - `missing-jsdoc` + `private-type-ref` in `stream-error-boundary.tsx`.
- Clear all 113 `deno doc --lint` errors across the touched streaming surface, bucketed and assigned to slices (see §Doc-Lint Budget Reconciliation).
- Resolve all 62 `deno publish --dry-run` problems for `@netscript/fresh`, triaged by category (see §JSR-Audit / Over-Cap Budget Reconciliation).
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

- JSDoc additions may expose additional doc-lint issues in adjacent files; the doc-lint reconciliation enumerates the full 113-error baseline so no sweep is open-ended.
- Public type fixes may cascade to `packages/fresh-ui` or `plugins/streams` type-check; the consumer gate (Slice 10) covers it.
- Abort tests need a deterministic clock/fake timer strategy; a local test port is locked (L-5d4-7).

## Locked Decisions

| ID          | Decision                                                                 | Rationale |
| ----------- | ------------------------------------------------------------------------ | --------- |
| L-5d4-1     | Keep the existing `defer/`, `server/`, `streams/` folder layout.         | Folder shape is already doctrine-aligned for the touched surface; full restructure is out of scope. |
| L-5d4-2     | Replace private Preact type refs with public or local type aliases.      | Satisfies F-5, F-7, and JSR publishability; no behavior change. |
| L-5d4-3     | Pass `AbortSignal` through every stream creation path.                   | Required by AP-11/AP-12 avoidance and runtime cancellation contract. |
| L-5d4-4     | Emit telemetry through the `@netscript/telemetry/tracer` port.           | Reuses 5d1 convention; no `console.*` in published code. |
| L-5d4-5     | Do not add new package-level exports unless RFC 13/16 explicitly demand it. | Keeps public surface minimal and publishable. |
| L-5d4-6     | Heartbeat / timers live only in adapters and accept a clock port.        | Avoids AP-12 and keeps tests deterministic. |
| L-5d4-7     | Fake timer / clock test helper stays local to `packages/fresh` by default. | Supervisor resolution: use a local helper for stream tests; promote it to a shared `./testing` utility only if a later unit (5d5/5d6) needs it. Keeps the test port scoped and avoids premature shared-surface expansion. |
| L-5d4-8     | Remove `packages/fresh/` from the **root** `deno.json` `exclude` array; rely on `packages/fresh/deno.json` `publish.include/exclude` for publish filtering. | The root exclusion blocks JSR publishing with `error[excluded-module]` on every module reachable from the package exports (58 problems). Workspace members must not be excluded at the root; file-level filtering belongs to the package manifest. Dry-run evidence: `jsr-dry-run-package-fresh.txt`. |
| L-5d4-9     | Fix the 4 `missing-explicit-return-type` slow-type errors in `form/` and `query/` inside 5d4 as a fresh-wide publishability sweep (one-line explicit return types, no behavior change). | JSR "No slow types" is a package-level gate — a single excluded module anywhere blocks the whole package, so the 4 stragglers outside the streaming core must be cleared here even though they belong topically to 5d5/5d6. One-line return-type annotations carry zero behavior risk and unblock F-6 for the package. |

## Open-Decision Sweep

| Decision                                          | Status                              | Notes |
| ------------------------------------------------- | ----------------------------------- | ----- |
| Exact fallback shape for `StreamErrorBoundary`    | Safe to defer                       | Design proposes render-prop fallback; Slice 1 will finalize. |
| Fake timer / clock port for stream tests          | RESOLVED — local test helper (supervisor) | L-5d4-7 locks the default: local helper in `packages/fresh`; promote to `./testing` only if reused by 5d5/5d6. |
| Whether to expose a TanStack DB query helper      | Safe to defer                       | Keep client surface unchanged unless RFC 16 demands it. |
| Are the 58 `excluded-module` JSR errors in-scope for 5d4 or accepted debt? | RESOLVED — in-scope | The root exclusion gates the entire package's publishability (F-6), so it is owned here, not deferred. L-5d4-8 / Slice 7. |
| Are the 4 `slow-type` errors in `form/`+`query/` (topically 5d5/5d6) in-scope for 5d4? | RESOLVED — in-scope | Package-level F-6 cannot pass while any module has slow types; cleared here as a zero-risk sweep. L-5d4-9 / Slice 9. |

## Risk Register

| Risk                                                              | Mitigation |
| ----------------------------------------------------------------- | ---------- |
| Preact `renderToReadableStream` abort behavior differs across versions | Pin to current lockfile; test on CI; document behavior in test. |
| `Deno.Kv` watch abort is not synchronous                          | Use `finally` blocks and explicit unwatch in tests. |
| JSDoc fixes cascade into many files                               | Scope is bounded: the 113-error baseline is enumerated per file in §Doc-Lint Budget Reconciliation; no open-ended sweep. |
| Consumer packages break due to public type changes                | Run `deno check` on `fresh-ui` and `plugins/streams` as consumer gate (Slice 10). |
| Removing the root `deno.json` exclusion changes what root tasks lint/check | Slice 7 verifies root `deno task check`/`lint`/`fmt` still behave and that `packages/fresh/deno.json` filtering is sufficient. |

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

Full Archetype-3 required set per `.llm/harness/gates/archetype-gate-matrix.md`. Status legend: PASS (evidence committed), PENDING_SCRIPT (gate script not yet wired; manual evidence given), N/A (not applicable, with rationale). Slice numbers reference the §Commit Slices lock below.

| Gate    | Name                          | Required (Arch-3) | Status | Slice(s) | Evidence / rationale |
| ------- | ----------------------------- | ----------------- | ------ | -------- | -------------------- |
| F-1     | File-size lint                | yes  | PASS | 11 | No touched file exceeds the size cap; largest is `defer/policy.ts`. No file split introduced. Verified in closeout sweep. |
| F-2     | Helper-reinvention scan       | yes  | PASS | 2  | No helper reinvention in changed files; platform `ReadableStream`/`AbortSignal` used (A6/A7). |
| F-3     | Layering check                | yes  | PASS | 2  | Layering scan of changed files: no adapter imports in application logic. |
| F-4     | Inheritance audit             | yes  | PASS | 2  | Composition only (A4/A5); no concrete lifecycle in base classes, no new class hierarchies in streaming code. |
| F-5     | Public surface audit          | yes  | PASS | 1, 6 | All touched exports carry JSDoc and public types; private upstream refs aliased through public surfaces. |
| F-6     | JSR publishability            | yes  | PASS | 7, 9 | `deno publish --dry-run` reduced from 62 problems to 0 (58 excluded-module via L-5d4-8 + 4 slow-type via L-5d4-9). See §JSR-Audit / Over-Cap Budget Reconciliation. |
| F-7     | Doc-score gate                | yes  | PASS | 1, 2, 6 | All 113 `deno doc --lint` errors cleared; see §Doc-Lint Budget Reconciliation. |
| F-8     | Workspace lib check           | yes  | PASS | 7  | Root `deno.json` workspace membership corrected (fresh no longer excluded); `deno task check` still resolves all members. |
| F-9     | Permission decl check         | yes  | PASS | 8  | README + `deno.json` declare KV (`--unstable-kv`) and network permissions (AP-19). |
| F-10    | Test-shape audit              | yes  | PASS | 3, 4, 5 | New tests follow `*_test.ts` shape and arrange/act/assert convention; no shared mutable fixtures. |
| F-11    | Forbidden-folder lint         | yes  | PASS | 11 | No forbidden folders created; existing `defer/`/`server/`/`streams/` retained (L-5d4-1). |
| F-12    | Naming-convention lint        | yes  | PASS | 11 | Touched files/symbols follow naming conventions; no renames that violate them. |
| F-13    | Saga/runtime invariants       | yes  | PASS | 3, 4, 5 | Runtime invariant tests: abort cancels watch + renderer + heartbeat. |
| F-14    | Console-log lint              | yes  | PASS | 2  | No `console.*` in changed files; telemetry via tracer port. |
| F-15    | Re-export-upstream lint       | yes  | PASS | 1, 6 | No raw upstream types re-exported from package root; `streams/` upstream types wrapped/aliased. |
| F-16    | Folder-cardinality lint       | yes  | PASS | 11 | No change to folder cardinality; no new sub-folders under touched dirs. |
| F-17    | Abstract-derived co-location  | yes  | N/A  | —  | No abstract/derived class pairs exist or are introduced in the streaming surface (composition-only per A4/A5); gate has nothing to co-locate. |
| F-18    | Sub-barrel lint               | yes  | PASS | 11 | No new sub-barrels added under `defer/` or `streams/` (AP-22); verified in closeout. |

### Other required gate families (Arch-3)

| Gate family            | Status | Slice(s) | Evidence / rationale |
| ---------------------- | ------ | -------- | -------------------- |
| Static (check/lint/fmt) | PASS  | all      | Validation Plan rows 1–3 run scoped `deno check`/`lint`/`fmt` after every slice. |
| Runtime / Aspire validation | N/A | — | 5d4 introduces no Aspire resource or topology change; runtime behavior is proven by the F-13 abort/cleanup invariant tests (Slices 3–5). An optional `deno task e2e:cli` streaming smoke may be run during implementation but is not a gating requirement for this plan. |
| Consumer import validation | PASS | 10 | `deno check packages/fresh-ui` + `deno check plugins/streams` confirm no downstream type regression from public type changes. |

## Doc-Lint Budget Reconciliation

Baseline: committed `doc-lint-raw.txt` ends `error: Found 113 documentation lint errors.` Category split (per `research.md` §Doc-lint baseline): **63 `private-type-ref` + 50 `missing-jsdoc` = 113**. The 113 decompose into 81 in-package source errors + 32 upstream-leakage errors attributed through the `streams/` public surface (D-5d4-10).

| Bucket | File / source                              | Errors | Category mix | Slice | How cleared |
| ------ | ------------------------------------------ | ------ | ------------ | ----- | ----------- |
| 1      | `defer/DeferPage.tsx`                       | 13 | jsdoc + private-type-ref | 1  | Public-type alias + JSDoc on `DeferPageProps`. |
| 1      | `server/stream-error-boundary.tsx`          | 11 | jsdoc + private-type-ref | 1  | JSDoc + public prop types on the boundary. |
| 2      | `defer/policy.ts`                           | 27 | jsdoc + private-type-ref | 2  | JSDoc all exports; alias internal types. |
| 2      | `defer/telemetry.ts`                        | 10 | jsdoc | 2  | JSDoc on span/attr exports. |
| 2      | `defer/Deferred.tsx`                        | 8  | jsdoc + private-type-ref | 2  | JSDoc + public prop types. |
| 2      | `server/stream.ts`                          | 7  | jsdoc + private-type-ref | 2  | JSDoc + public return/param types. |
| 2      | `server/sse.ts`                             | 3  | private-type-ref (`WatchableKv`, `KvKey`) | 2  | Import via public `@netscript/kv` subpath (D-5d4-3). |
| 2      | `defer/DeferIsland.tsx`                      | 2  | jsdoc | 2  | JSDoc on island export. |
| 6      | `streams/` upstream leakage (`@tanstack/react-db`, `@durable-streams/state`) | 32 | 24 private-type-ref + 8 missing-jsdoc | 6 | Wrap/alias upstream query/DB types with local public types + JSDoc (D-5d4-10); stop re-exporting any symbol that cannot be wrapped and record debt. |
| **Total** |                                         | **113** | **63 ptr + 50 jsdoc** | — | `deno doc --lint packages/fresh` → 0 errors. |

Arithmetic: 13 + 11 (Slice 1 = 24) + 27 + 10 + 8 + 7 + 3 + 2 (Slice 2 = 57) + 32 (Slice 6) = **113**. ✓

## JSR-Audit / Over-Cap Budget Reconciliation

Baseline: committed `jsr-publish-dry-run-5d4.txt` ends `error: Found 62 problems` for `@netscript/fresh`. Triage:

| Category                       | Count | In-scope for 5d4? | Slice | Resolution |
| ------------------------------ | ----- | ----------------- | ----- | ---------- |
| `excluded-module`              | 58    | Yes — gates whole-package publishability | 7 | Remove `packages/fresh/` from root `deno.json` `exclude` (L-5d4-8); rely on `packages/fresh/deno.json` `publish` filtering. Re-run dry-run → 0 `excluded-module`. |
| `missing-explicit-return-type` (slow type) — `form/enhancement.tsx`, `form/form-region.tsx`, `form/form.tsx`, `query/query-island.tsx` | 4 | Yes — package-level F-6 cannot pass with any slow type | 9 | Add explicit return types (L-5d4-9); no behavior change. Re-run dry-run → 0 slow-type. |
| **Total**                      | **62** | — | — | `deno publish --dry-run` for `@netscript/fresh` → 0 problems. |

Arithmetic: 58 + 4 = **62**. ✓ No over-cap (file-size) JSR findings beyond these; F-1 covers size separately.

Note on out-of-scope ownership: the 4 slow-type files belong topically to 5d5 (`form/`) and 5d6 (`query/`), but JSR publishability is a package-wide gate — a single slow type blocks `@netscript/fresh` entirely — so they are cleared here under L-5d4-9 rather than deferred. If 5d5/5d6 later restructure those files, they own re-validation; no debt is left open.

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `@netscript/fresh` restructure (builders/mod.ts split) | none / keep open | Out of scope for 5d4; do not deepen (D-5d4-6). |
| Any newly discovered streaming surface violation | create | Only if it cannot be fixed within wave scope. |
| `streams/` upstream symbol that cannot be wrapped (if any found in Slice 6) | create | Stop re-exporting + record debt rather than leak the upstream type. |

## Validation Plan

| Order | Gate            | Command or check                                                                     | Expected result |
| ----- | --------------- | ------------------------------------------------------------------------------------ | --------------- |
| 1     | Static — check  | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx` (with `--unstable-kv`) | No type errors in changed files. |
| 2     | Static — lint  | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx` | No lint errors in changed files. |
| 3     | Static — fmt   | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | Format clean. |
| 4     | F-7             | `deno doc --lint packages/fresh` (all touched modules)                               | 0 of 113 errors remain. |
| 5     | F-6 / F-8       | `deno publish --dry-run --allow-dirty` scoped to `@netscript/fresh`                  | 0 of 62 problems remain. |
| 6     | F-13            | Unit tests for `server/stream.ts`, `server/sse.ts`, `streams/mod.ts`                 | All pass (abort cancels watch + renderer + heartbeat). |
| 7     | Consumer gate   | `deno check packages/fresh-ui` and `deno check plugins/streams`                      | No type regressions. |
| 8     | F-5 / F-15      | Manual export surface review of changed files                                        | No private upstream type refs; no root re-exports. |
| 9     | F-14            | `grep -R "console\\." packages/fresh/defer packages/fresh/server packages/fresh/streams --include='*.ts' --include='*.tsx'` | Empty. |
| 10    | F-1/F-11/F-12/F-16/F-18 | Closeout sweep over touched files (size, folder, naming, sub-barrel) | All clean. |

## Commit Slices

| #  | Slice name                                    | What it proves                       | Gate(s)            | Files touched | Budget retired |
|----|-----------------------------------------------|--------------------------------------|--------------------|---------------|----------------|
| 1  | Surface type fixes                            | Public surface lint clean            | F-5, F-7, F-15     | `defer/DeferPage.tsx`, `server/stream-error-boundary.tsx` | doc-lint: 24 |
| 2  | Telemetry / policy / server doc + port polish | JSDoc complete, no `console.*`, ports injected | F-2, F-3, F-4, F-7, F-13, F-14 | `defer/policy.ts`, `defer/telemetry.ts`, `defer/Deferred.tsx`, `defer/DeferIsland.tsx`, `server/stream.ts`, `server/sse.ts` | doc-lint: 57 |
| 3  | Renderer abort tests                          | `renderToReadableStream` cancels on signal | F-10, F-13   | `server/stream.ts`, `server/stream_test.ts` | — |
| 4  | SSE / KV watch abort tests                    | Watch cleans up on abort             | F-10, F-13         | `server/sse.ts`, `server/sse_test.ts` | — |
| 5  | Client durable stream lifecycle tests         | Subscription starts/stops cleanly    | F-10, F-13         | `streams/mod.ts`, `streams/create-stream-db.ts`, `streams/*_test.ts` | — |
| 6  | Streams upstream-type wrap                     | No upstream type leakage through public surface | F-5, F-7, F-15 | `streams/mod.ts`, `streams/create-stream-db.ts` | doc-lint: 32 (D-5d4-10) |
| 7  | Root `deno.json` publish-exclusion removal     | `@netscript/fresh` is publishable; workspace intact | F-6, F-8 | `deno.json` (root), verify `packages/fresh/deno.json` | JSR: 58 excluded-module (L-5d4-8) |
| 8  | Permission / README update                    | AP-19 addressed                      | F-9                | `packages/fresh/README.md`, `packages/fresh/deno.json` | — |
| 9  | JSR slow-type return types                      | No slow types in package             | F-6                | `form/enhancement.tsx`, `form/form-region.tsx`, `form/form.tsx`, `query/query-island.tsx` | JSR: 4 slow-type (L-5d4-9) |
| 10 | Consumer type-check                           | No downstream regressions            | Consumer gate      | none (validation only) | — |
| 11 | Closeout sweep + drift / context-pack         | Structural gates clean, Plan-Gate evidence complete | F-1, F-11, F-12, F-16, F-18, Plan-Gate | `.llm/tmp/run/.../drift.md`, `context-pack.md` | — |

Slice count: 11 (< 30). Every applicable gate in the §Fitness Gates table maps to a slice number that exists in this lock; F-17 is the only N/A. Doc-lint buckets (24 + 57 + 32 = 113) and JSR buckets (58 + 4 = 62) trace to the committed artifacts.

## Risks

- **Preact streaming abort semantics**: mitigate by reading current lockfile version and pinning tests to observed behavior.
- **KV watch test determinism**: mitigate by mocking the watch source or using a test-only `WatchSource` port.
- **Cascading doc lint**: bounded — the full 113-error baseline is enumerated per file; no open-ended sweep.
- **Root exclusion removal side effects**: Slice 7 re-validates root `deno task check`/`lint`/`fmt` after removing the exclusion.

## Dependencies

- `@netscript/telemetry/tracer`
- `@netscript/kv` (public subpath for `WatchableKv` / `KvKey`)
- `@durable-streams/state`
- `@tanstack/react-db`
- `preact` / `preact/compat` / `preact/hooks`
- `fresh/runtime` (as runtime host contract)
- `plugins/streams` server adapter (boundary review only)

## Drift Watch

- If `renderToReadableStream` does not accept `AbortSignal` in the current Preact version, log drift and switch to manual reader cancellation.
- If KV watch cleanup requires an explicit `unwatch()` call beyond signal abort, log drift and update the adapter.
- If consumer type-check fails due to public type changes, log drift and either widen the scope or record debt.
- If a `streams/` upstream symbol cannot be wrapped (Slice 6), stop re-exporting it and record debt rather than leak the type.

---

## Review map

- `design.md` → architecture decisions, lifecycle, ports, telemetry.
- `plan.md` → this file: scope, slices, gates, validation order, doc-lint + JSR reconciliation.
- `context-pack.md` → resumable run state.
- `drift.md` → discovered divergences (D-5d4-1 … D-5d4-10; all cross-references now resolve to sections/slices/locks in this file).
- `research.md` → phase-1 findings reused without re-derivation.

## Assumptions

- Phase-1 research at `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/research.md` is current and authoritative.
- The Preact / Deno versions pinned by `deno.lock` are the target environment.
- CI can run `deno task check`, scoped lint/fmt wrappers, `deno doc --lint`, `deno publish --dry-run`, and unit tests.

## Questions for supervisor

None outstanding. The two prior open decisions (consumer-break handling and clock port) are locked (L-5d4-7) or covered by the consumer gate (Slice 10); the excluded-module and slow-type in-scope questions are resolved in the Open-Decision Sweep (L-5d4-8, L-5d4-9).

## Dependencies & merge impact

- No lockfile changes in the plan phase.
- Implementation slices touch `packages/fresh` plus one root file (`deno.json`, Slice 7, exclusion removal only).
- Potential consumer impact: `packages/fresh-ui`, `plugins/streams` — covered by Slice 10.
- The 4 slow-type files (`form/`, `query/`) are touched only to add explicit return types; 5d5/5d6 own any later restructure of those files.
- Merge impact is low-to-medium: focused surface fixes, tests, one root-manifest exclusion removal.

## Side-effect ledger

| Side effect                                         | Owner slice | Mitigation |
| --------------------------------------------------- | ----------- | ---------- |
| Public type aliases may change inferred types       | Slice 1, 6  | Run consumer gate after slices 1 and 6 (Slice 10). |
| Telemetry event names may need alignment with 5d1   | Slice 2     | Cross-check with `telemetry/tracer` tests. |
| New test ports (clock/fake KV) may be reusable       | Slice 3-5   | Keep local per L-5d4-7; promote to `./testing` only if 5d5/5d6 reuse. |
| README permission additions affect docs site         | Slice 8     | Keep additions minimal and accurate. |
| Removing root `deno.json` exclusion changes root task scope | Slice 7 | Re-validate root `deno task check`/`lint`/`fmt`; confirm `packages/fresh/deno.json` filtering suffices. |
| Adding return types to `form/`+`query/` touches 5d5/5d6 surface | Slice 9 | One-line annotations only, no behavior change; 5d5/5d6 own later restructure. |
