# Worklog: bind the Fresh navigation platform fetch

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-fresh-navigation-fetch-binding--1900` |
| Branch | `fix/fresh-navigation-fetch-binding` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- `@netscript/fresh/navigation` remains unchanged: two values
  (`installPartialNavigationCoordinator`, `KeyedPartial`) and five types (`ComponentChild`,
  `ComponentChildren`, `KeyedPartialProps`, `PartialNavigationCoordinator`, `RouteChange`).
- `installPartialNavigationCoordinatorForPlatform` and `NavigationPlatform` remain internal test
  seams outside the package export map.

### Domain Vocabulary

- `originalFetch` — raw captured function retained for exact final-disposal restoration.
- `platformFetch` — receiver-bound callable used for transport invocation.
- `NavigationLease` / `ManagedPartialBody` — existing ordering and drain vocabulary, unchanged.

### Ports

- `NavigationPlatform` — existing browser ownership seam; no new method or public seam is added.

### Constants

- None. This slice introduces no finite domain vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Preserve the platform fetch receiver at both invocation sites and prove it with a receiver-sensitive double while retaining drain/restoration behavior. | focused structured Fresh gates + quality/JSR/invariant checks | `coordinator.ts`, `coordinator_test.ts`, run evidence |

### Deferred Scope

- Hosted Chromium `fresh-browser` rerun — supervisor-owned per the lane constraint.
- #1895 fixtures and rebase — owned by #1895 after this fix lands.

### Contributor Path

Read `coordinator.ts` constructor and `interceptFetch()`, then run the colocated
`coordinator_test.ts`; transport receiver, response ordering, drain, and disposal contracts are
covered in that pair.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-09-01T20:33:46Z | bootstrap | re-baseline | Confirmed current `origin/main` and exact seven-symbol navigation surface. |
| 2026-09-01T20:33:46Z | plan | PLAN-EVAL | `N/A` — #1900 supplies a complete mechanical contract, two-file scope, invariant, regression shape, and gate ownership; no architecture or open decision remains. |
| 2026-09-01T20:35:57Z | bootstrap | PR | Opened draft PR #1904 with all six required labels and milestone 0.0.7 (#27). |
| 2026-09-01T20:39:04Z | S1 | implement | Kept raw `originalFetch` for restoration, captured bound `platformFetch`, and routed both fetch paths through it. |
| 2026-09-01T20:39:04Z | S1 | regression | Added a double that throws unless `this === globalThis`; intercepted and pass-through calls both pass. |
| 2026-09-01T20:39:04Z | S1 | gates | Structured Fresh check/lint/fmt passed over 207 files; source tests passed 254/254; quality gate, JSR audit, and publish dry-run passed. |
| 2026-09-01T20:39:04Z | S1 | reconcile | #1900 remains open and correctly linked by `Closes #1900`; #1895 is referenced only and untouched; PR #1904 has exactly one `status:impl` label and the requested metadata. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Preserve raw fetch plus bound callable | Final disposal currently restores by raw function identity. | `plan.md` D1; `coordinator.ts` |
| Bind to `globalThis` | In production it is the Window receiver of `globalThis.fetch`. | #1900 diagnosis; Web Platform edge |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Frontend overlay references absent `.claude/05-frontend.md` and `.resources/deps-docs/` paths in this worktree. | minor | yes |
| Draft PR was not opened with the already-pushed orchestrator brief commit; it will open with the run-plan bootstrap before product implementation. | minor | yes |
| Full Fresh doc lint currently reports 45 diagnostics outside `./navigation`, despite the doctrine handoff's earlier zero-diagnostic statement; navigation itself reports zero. | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Focused check | `run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS | 207 files, 2 batches, 0 findings. |
| Focused source tests | `run-deno-test.ts -- --allow-all packages/fresh/src` | PASS | 254 passed, 0 failed. Navigation-only confirmation was 9 passed. |
| Focused lint | `run-deno-lint.ts --root packages/fresh --ext ts,tsx` | PASS | 207/207 processed, 0 findings. |
| Focused format | `run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | PASS | 207/207 processed, 0 findings. |
| Full package doc lint | `deno task doc:lint --root packages/fresh --pretty` | FAIL | 45 pre-existing diagnostics in builders/query/route/streams; `./navigation` is 0. No changed file is implicated. |
| Publish dry-run | `deno task publish:dry-run` from `packages/fresh` | PASS | `@netscript/fresh@0.0.6` dry-run completed successfully. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Archetype 4 applicable set | PASS | `deno task quality:gate` exit 0 | Quality scan found no findings; doctrine gate completed with baseline warnings only. |
| F-5 navigation surface | PASS | `deno doc --json` reports 7 symbols | Two values, two aliases, three interfaces; no surface file changed. |
| F-6 JSR publishability | PASS | package publish dry-run exit 0 | Test remains excluded from publication. |
| F-7 full package doc lint | FAIL (baseline) | structured report, 45 diagnostics | Navigation entrypoint is clean; unrelated current-main residue is recorded in drift. |
| F-19 scoped runners | PASS | structured check/test/lint/fmt results above | All requested focused gates green. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Focused navigation semantics | PASS | 9/9 navigation tests; 254/254 Fresh source tests | Receiver, drain, restoration, ordering, and EOF disposal coverage passed. |
| Hosted `fresh-browser` | NOT_RUN | supervisor-owned | Run `33542380097` is the known pre-fix failure. |
| Drain-never-abort production scan | PASS | focused `rg` returned no matches | Zero `.abort(`, `AbortController`, or `.cancel(` outside navigation tests. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Navigation entrypoint | PASS | `deno doc --json packages/fresh/src/runtime/navigation/mod.ts` | Seven symbols after implementation; two values and five types unchanged. |
| Wrapper restoration | PASS | receiver regression and existing disposal assertion | Final disposal restores the raw original function by identity. |

## Slice Review (Tier-A)

| Field | Value |
| ----- | ----- |
| Verdict | **PASS** |
| Reviewer | Claude · Anthropic · Fable 5 (fresh native opposite-family session, background job `e39b230c`) |
| Date | 2026-09-01 |

Substantively reviewed and independently re-verified:

1. Raw `originalFetch` retained unbound (`coordinator.ts:118`) and restored by exact identity at
   final disposal (`coordinator.ts:323`); regression asserts `getFetch() === receiverSensitiveFetch`
   after dispose.
2. `platformFetch = originalFetch.bind(globalThis)` (`coordinator.ts:119`) — the Window receiver —
   is the sole transport callable at both sites: pass-through (`coordinator.ts:238`) and intercepted
   partial (`coordinator.ts:248`). No remaining unbound transport invocation.
3. The regression double throws unless `this === globalThis`; `wrappedFetch` is an arrow function,
   so reverting either site to `this.originalFetch(...)` or detaching the callable fails the test.
   Both intercepted (`fresh-partial` URL) and pass-through (`/asset.css`) paths asserted, 2 calls.
4. Drain-never-abort, EOF-awaited disposal loop, history wrapper ownership guards, and
   unhandled-rejection handling are untouched by the diff.
5. Product scope is exactly `coordinator.ts` + `coordinator_test.ts`; focused scan confirms zero
   production `.abort(`/`AbortController`/`.cancel(` tokens in navigation.
6. Navigation entrypoint re-verified at seven symbols (2 values, 3 interfaces, 2 aliases);
   `deno.lock` has no diff against worktree or `origin/main`.
7. Gate evidence re-verified: focused navigation tests 9/9 via the structured test wrapper;
   full-package doc-lint reproduces exactly the recorded unrelated baseline failure
   (45 = 28 private-type-ref + 17 missing-jsdoc; navigation 0; builders 3 / query 8 / route 25 /
   streams 11).

No blocking findings. Sign-off commit follows; IMPL-EVAL remains owned by a separate session.

## IMPL-EVAL

| Field | Value |
| ----- | ----- |
| Verdict | **PASS** |
| Evaluator | Claude · Anthropic · `claude-fable-5` · medium — fresh native session `session_01F8px5DXrKvzcD6PdYWbXDL` (background job `24a85855`), separate from generator and Tier-A reviewer |
| Date | 2026-09-01 |
| Head / Base | `5a21b1013` / `e938ecd31` |

Independently re-verified: raw `originalFetch` retained and restored by identity; `globalThis`-bound
`platformFetch` at both transport sites; detach-sensitive regression covers intercepted and
pass-through paths (strict-mode double throws unless `this === globalThis`); drain/EOF-disposal
semantics untouched with zero production cancellation tokens; product scope exactly the two files;
7-symbol entrypoint and `deno.lock` unchanged; PLAN-EVAL N/A recorded before implementation and
justified. Reran green: scoped check/test/lint/fmt (207 files; navigation 9/9), `quality:gate`, JSR
audit, publish dry-run. Full-package doc-lint red (45, outside navigation) confirmed as pre-existing
baseline drift, not a blocker. Two low findings: post the pending `[PHASE: IMPL]` PR comment before
any status advance, and file follow-up ownership for the doc-lint baseline (contradicts the RESOLVED
F-7 arch-debt entry). Full verdict in `evaluate.md`.

Post-evaluation reconciliation: posted the required `[PHASE: IMPL]` evidence comment on PR #1904,
resolving evaluator finding F1. Finding F2 remains an explicitly supervisor/orchestrator-owned
follow-up because repairing or filing cross-surface doc-lint debt would expand this locked P1 slice.

## Handoff Notes

- Evaluator should inspect the receiver-sensitive regression first, then raw-vs-bound fetch storage,
  both invocation sites, the disposal identity assertion, and the zero-cancellation production scan.
- Product diff is exactly `coordinator.ts` and `coordinator_test.ts`; `deno.lock`, navigation
  `mod.ts`, `types.ts`, and `keyed-partial.tsx` have no diff.
