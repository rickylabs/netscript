# IMPL-EVAL — OpenHands confirmatory lane (PR #1904, closes #1900)

| Field | Value |
| ----- | ----- |
| Phase | IMPL-EVAL (confirmatory; prior native pass in `evaluate.md`) |
| Evaluator | OpenHands agent · provider OPENROUTER · model `openrouter/z-ai/glm-5.3-flash` · effort max |
| Target head | `8dbe290127b07f747fdc99f616220f199fc45bac` (verified == PR #1904 head, state OPEN) |
| Product commit | `5a21b1013` — fix(fresh): preserve the navigation fetch receiver |
| Evaluator independence | Separate cloud session from the Codex generator and from the prior native Claude evaluator |
| Read-only | No repo files edited, no commits, no pushes |

## Decisions

| # | Decision | Result | Evidence |
| - | -------- | ------ | -------- |
| 1 | Binding correct and total | PASS | `coordinator.ts:118-119`: `originalFetch` kept raw for identity restoration; `this.platformFetch = this.originalFetch.bind(globalThis)`. Exactly two transport call sites, both `platformFetch`: pass-through `:238`, intercepted `:248`. Repo-wide grep of `packages/fresh/src/runtime/navigation` (non-test) shows no other invocation of the unbound reference. `wrappedFetch` (`:122`) is an arrow, so reverting a call site to `this.originalFetch(...)` yields `this === NavigationRuntime`, not `globalThis` — the fix is total. |
| 2 | `globalThis` receiver; SSR-import-safe | PASS | Receiver probe: bound call reaches `globalThis`; detached invocation throws `TypeError: detached platform fetch` (the hosted `Illegal invocation` signature). SSR probe: importing `packages/fresh/src/runtime/navigation/mod.ts` outside a browser (no `Window`) → `SSR_IMPORT_OK`, both value exports present, install fn present, `globalThis.fetch` untouched. The `bind` executes only at coordinator construction (client install), never at module scope — module scope is imports + type/interface/class declarations only. Consumer type fixture (`navigation-consumer_type.ts`) included in package `check` task, exit 0. |
| 3 | Regression pins receiver, both paths | PASS | `coordinator_test.ts:248` 'captured platform fetch preserves its Window receiver on both transport paths': double throws unless `this === globalThis`; exercises intercepted path (`/receiver-preserved` after `stageAnchor`) and pass-through (`/asset.css`); asserts `calls === 2`; asserts raw-identity restoration post-dispose. Mutation probe: reverted fix → regression FAILS on detached invocation (MUTATION_OK); control plain-function double passes under the same broken shape, confirming the receiver-blindness hole that hid the defect across 253 green tests. |
| 4 | Drain, never abort; EOF disposal | PASS | Zero `.abort(` / `AbortController` / `.cancel(` across all six navigation files (coordinator.ts, coordinator_test.ts, keyed-partial.tsx, keyed-partial_test.tsx, mod.ts, types.ts). `dispose()` restores fetch/pushState/replaceState wrappers by identity, then `while (this.fetches.size > 0 || this.bodies.size > 0) { … await Promise.allSettled([...fetches, ...drains]) }` — drain-to-EOF awaited, unbounded until settled. Untouched by diff. |
| 5 | Public surface unchanged | PASS | `mod.ts` exports exactly 7 symbols: 2 values (`KeyedPartial`, `installPartialNavigationCoordinator`) + 5 types (`ComponentChild`, `ComponentChildren`, `KeyedPartialProps`, `PartialNavigationCoordinator`, `RouteChange`). Probe census matches `deno doc` and prior F-5. |
| 6 | Scope 2 product files; lock unmoved | PASS | `git show --stat 5a21b1013`: product diff = `coordinator.ts` (+4/−2) + `coordinator_test.ts` (+24); sign-off `8dbe29012` adds run-dir artifacts only. `deno.lock` empty in base→head diff and worktree. |

## Supervisor measurements re-derived — no divergence

| Measurement | Supervisor | This run |
| ----------- | ---------- | -------- |
| `packages/fresh` structured check | 207 files / 0 diagnostics | 207 files / 0 diagnostics, exit 0 |
| Coordinator suite | 7 passed / 0 failed | 7 passed / 0 failed |
| Full navigation dir tests | — | 9 passed / 0 failed |
| Hosted `fresh-browser` | supervisor-owned | NOT_RUN locally per boundary (pre-fix failure run `33542380097`) |

## Findings

| Severity | Finding | Evidence | Action |
| -------- | ------- | -------- | ------ |
| low | Full `packages/fresh` test run on this CI runner: 275 passed / 1 failed — `vite build emits the registered defer island in the client bundle` (rollup cannot resolve `npm:@opentelemetry/api@^1.9.0` from remote `jsr.io/@fresh/core/2.3.3` in a vite fixture build). A/B against pristine `origin/main` in a clean temp extraction reproduces it identically → environmental/pre-existing, zero overlap with this diff. | `packages/fresh/tests/defer-island-client-bundle_test.ts`; A/B rerun on `origin/main` = same failure | None in this PR; environmental CI-runner limitation. Informational for CI owners. |
| info | Prior lane F2 (full-package `doc:lint` baseline residue: builders 3 / query 8 / route 25 / streams 11; navigation = 0) remains outside this PR's locked non-scope; follow-up ownership unchanged. | prior `evaluate.md` F2 | Supervisor/orchestrator follow-up issue. |

No high or medium findings. `Closes #1900` is correct — the PR fully resolves it. #1895 is the browser
proof and rebases onto this fix; not evaluated here per boundary.

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | `PASS` |
| Rationale | All six decisions verified with independent probes, mutation testing, scoped gate reruns, and an SSR import probe; supervisor measurements reproduce exactly (207/0, 7/0); the only red observed anywhere is a pre-existing environmental vite-fixture failure reproduced on pristine main, outside the diff. |

OPENHANDS_VERDICT: PASS
