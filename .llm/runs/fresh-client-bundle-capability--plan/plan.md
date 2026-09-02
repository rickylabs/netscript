# Plan: deterministic Fresh client-bundle capability

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fresh-client-bundle-capability--plan` |
| Branch | `test/fresh-client-bundle-capability` |
| Phase | `plan` |
| Target | `packages/fresh` tests and browser fixtures |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Archetype

`@netscript/fresh` is explicitly classified as Archetype 4. This slice tests the client behavior
materialized by its `definePage().withLayer(...).build()` DSL; it does not redesign the builder or
its published contract. The frontend overlay applies because the load-bearing evidence is a real
Fresh client navigation and named partial swap.

## Current Doctrine Verdict

**Keep** — preserve per-concern builders and route contracts. The planned changes add semantic test
fitness without changing exports, folder roles, or route inference.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A7 | The test uses Deno's workspace/import-map, lockfile, `--frozen`, and `--cached-only` behavior rather than inventing dependency resolution. |
| A8 | Shared browser/Vite test runtime belongs in the existing test-fixture role, separate from product source. |
| A14 | The bundle and browser tests are fitness functions for emitted client behavior, not string-only substitutes for navigation. |

## Goal

Make the Fresh client-bundle assertion deterministic and extend the established Fresh browser gate
to prove that a cache-miss deferred layer requests its configured partial and swaps its named
boundary exactly once.

## Scope

- Replace unlocked, bare npm Vite execution in Fresh tests with the package's exact-pinned `vite`
  import resolved through the root lock under `--frozen --cached-only`.
- Keep the existing client-bundle content assertion and continuously exercise it without registry
  resolution at test time, using dependencies materialized by CI's deterministic `deno install`.
- Add direct policy assertions for partial hit and partial miss action/reason pairs.
- Add one `packages/fresh` fixture app built with `definePage().withLayer(...)` and one Playwright
  browser regression under the existing `test:browser` task.
- Reuse the established CI browser signal and runtime; update no workflow and add no browser
  dependency.
- Update only this run directory alongside `packages/fresh/**`.

## Non-Scope

- `packages/cli/e2e/**`: its dump-DOM Chrome probe cannot drive client navigation, and duplicating
  Playwright there would create new infrastructure.
- A new browser lane or workflow: current Fresh CI already provisions the needed driver/image.
- Route inference, `packages/fresh/src/application/route/types.ts`, or its tests: #1610 owns them.
- Product defer behavior changes: current policy is correct; this leaf pins it with tests.
- Root `deno.json`, `deno.lock`, caches, or dependency versions: the required exact Vite pin and
  lock entry already exist.

## Hidden Scope

- The two pre-existing Fresh browser fixture launches must adopt the same locked Vite helper;
  otherwise the browser gate would retain the defect while the default bundle test is fixed.
- `test:browser` must enumerate the new browser test so the existing CI gate actually runs it.
- #1557's later comment adds direct pure-policy assertions; satisfying only the browser criterion
  would leave the issue incomplete.

## Design Note — #1557 Capability Decision

1. **Assertion level — package browser test.** Only the `packages/fresh` layer can combine the real
   emitted client bundle, the `definePage().withLayer(...)` behavior under test, and the existing
   Playwright client-navigation driver. CLI E2E can inspect server-rendered DOM but cannot execute
   the hydrated partial-fetch path. A new lane would duplicate an existing, CI-wired capability.
2. **Navigation driver — real Playwright browser.** The defer coordinator submits from a hydrated
   `useEffect`; a DOM shim, static bundle scan, or HTTP client cannot prove that behavior. The test
   reuses CI's existing `@playwright/cli@0.1.17` plus Chromium install. Incremental image size and
   dependency cost are zero; per-run cost is one additional Vite fixture startup and one browser
   session (expected seconds, measured by CI). Local execution is unavailable until the already
   external `playwright-cli` is present; the slice will not install or vendor it.
3. **Deterministic bundle build — workspace alias plus frozen locked cache.** All test fixture Vite
   processes use `deno run --frozen --cached-only -A vite ...`. `vite` resolves from
   `packages/fresh/deno.json` to exact `npm:vite@7.2.2`, whose graph is in the root lock. CI's
   deterministic `deno install` step warms the Deno cache before tests; `--cached-only` then forbids
   registry fallback at test time, and a genuinely cold Deno cache fails loudly. No `--no-lock` or
   runtime `npm:vite@...` specifier survives.
4. **Suite placement — split by cost.** Pure policy tests and the deterministic production bundle
   build stay in the default package suite. Real-browser navigation remains behind the established
   `test:browser` task and `needs_fresh_browser` impact gate because Chromium installation and
   process startup are materially heavier than unit/package tests. This is an existing explicit
   gate, not an unreported skip.

The browser test will intercept the configured partial endpoint, delay it until the fallback is
visible, then observe semantic states for the fixture's named boundary. The observer records unique
`fallback -> loaded` states, yielding exactly one swap. A planted second state is then recorded as
a negative control, and the same exact-one assertion must reject its count of two.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Land both #1601 and #1557 in `packages/fresh`; do not touch CLI E2E. | Current main already has the only real client-navigation capability. |
| D2 | Centralize locked Vite command construction in a test-fixture module. | It encodes a repository-specific determinism policy and prevents browser fixtures from drifting back to unlocked npm resolution. |
| D3 | Use Playwright request interception plus a MutationObserver-based semantic state ledger. | It observes the actual request and counts boundary transitions without coupling to incidental bundle strings or mutation callback counts. |
| D4 | Add a planted second boundary state and assert that the exact-one checker rejects it. | This proves the test would detect the load-bearing double-swap regression. |
| D5 | Keep browser coverage impact-gated, with pure policy coverage in the default suite. | Preserves fast default runs while retaining an explicit CI verdict for the client-only behavior. |
| D6 | Close both issues only after CI browser evidence and all close-gated acceptance items exist. | Local driver absence prevents an unsupported early completeness claim. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact browser CI duration | Safe to defer | CI will measure it; no design choice depends on the number because the existing gate/image is reused. |
| Local Playwright installation | Safe to defer | Do not add it to the repo or host; CI already owns provisioning. |
| Fresh internal partial marker representation | Safe to defer | The test observes fixture-owned semantic state nodes inside the named `Partial`, not private Fresh comment/marker syntax. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| `--cached-only` fails because the test runner did not materialize Vite. | CI runs deterministic `deno install` before tests; retain the loud cold-cache failure rather than resolving from the registry at test time. |
| Browser observer races the automatic island submission. | Intercept and pause the configured endpoint, wait for fallback, install the observer, then release the request. |
| MutationObserver callback multiplicity inflates a swap count. | Record unique semantic state values, not raw callback/mutation counts. |
| A double swap would still pass. | Apply the exact-one assertion to the real count and prove rejection with a planted second state. |
| Browser test is written but not executed in CI. | Add it to `test:browser`; rely on the existing `packages/fresh/**` classifier and receipt-backed CI gate. |
| Existing route-inference work conflicts. | Do not edit route files or inference tests; all fixture routing uses stable `App` APIs and existing builders. |
| Local browser gate cannot run. | Record the missing `playwright-cli`, run all non-browser gates locally, then use the ready PR's provisioned CI browser receipt before claiming #1557 complete. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | Risk | The shared helper must encode lock/offline policy, not merely rename `Deno.Command`. |
| AP-9 | Risk | Reuse the established browser shape; do not invent a generalized browser framework. |
| AP-18 | Avoid | Assert semantic request and swap behavior; retain the narrow bundle content assertion only for client registration. |
| AP-19 | Avoid | Browser/Vite tests remain explicit `--allow-all` gates; no published permission change. |
| AP-25 | Avoid | Process/network effects stay in test fixtures, never product source. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-10 | Yes | New source/test files remain below size thresholds; `arch:check`. |
| F-2 | Yes | Manual review that the helper adds lock/offline policy; `arch:check`. |
| F-3/F-4/F-5/F-7/F-8/F-9/F-11/F-12/F-14/F-15/F-16/F-17/F-18 | Yes/no-change | `quality:gate`; no published-source or folder changes. |
| F-6 | No-change audit | Tests remain excluded from publish; no export/dependency/file-list change. |
| F-19 | Yes | Scoped check/lint/fmt/test wrappers over `packages/fresh`. |
| Browser validation | Yes | `deno task --cwd packages/fresh test:browser` in provisioned CI; local result may be NOT_RUN/blocked only until CI. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `packages/fresh` existing debt | none | No public compatibility, docs, or hosted-example scope is changed or deepened. |
| New debt | none expected | A browser test without CI evidence cannot close #1557; it remains open rather than becoming debt. |

## Commit Slices

| # | What it proves | Gate | Files |
| - | --- | --- | --- |
| 0 | Current research and design decisions are reviewable before implementation. | Separate-session PLAN-EVAL | run-dir mandatory artifacts |
| 1 | The wanted client-bundle assertion builds through exact locked `npm:vite@7.2.2` with registry resolution disabled at test time after deterministic CI installation. | Targeted wrapper test from the CI-prewarmed Deno cache | `packages/fresh/tests/_fixtures/vite-runtime.ts`, `packages/fresh/tests/defer-island-client-bundle_test.ts`, run artifacts |
| 2 | Partial hit/miss policy pairs are direct, and a real cache-miss client navigation requests the configured endpoint and swaps the named boundary exactly once with a double-swap negative control. | Default package test; `test:browser` in CI | `packages/fresh/src/application/defer/DeferIsland.test.ts`, `packages/fresh/tests/_fixtures/browser-runtime.ts`, `packages/fresh/tests/form-navigation_browser.ts`, `packages/fresh/tests/defer-client-navigation_browser.ts`, `packages/fresh/tests/fixtures/defer-client-navigation-browser/**`, `packages/fresh/deno.json`, run artifacts |
| 3 | The complete scoped change satisfies static, test, doctrine, dependency, and browser gates. | Full validation plan and separate-session IMPL-EVAL | run artifacts only |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Targeted deterministic bundle | `run-deno-test.ts -- --allow-all packages/fresh/tests/defer-island-client-bundle_test.ts` after deterministic dependency installation | PASS without test-time registry resolution; cold Deno cache fails loudly |
| 2 | Fresh check | `run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS |
| 3 | Fresh package tests | `deno task --cwd packages/fresh test` (task uses Deno test; record structured wrapper result as well) | PASS |
| 4 | Fresh lint | `run-deno-lint.ts --root packages/fresh --ext ts,tsx` | PASS |
| 5 | Fresh format | `run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | PASS |
| 6 | Code quality/doctrine | `deno task quality:gate` | PASS/no new allowance |
| 7 | JSR no-change audit | Verify export map/publish include-exclude diff and `deno task deps:why vite` | No published-surface or dependency change |
| 8 | Browser regression | `deno task --cwd packages/fresh test:browser` | PASS in CI-provisioned Playwright environment; local host currently lacks driver |
| 9 | Evaluation | Fresh native Claude/Fable IMPL-EVAL | PASS |

## Dependencies

- Existing exact `vite` import and root lock entry.
- Existing CI-provisioned `@playwright/cli@0.1.17` and Chromium image payload.
- No new package, browser, or workflow dependency.

## Deferred Scope

- General browser-test infrastructure beyond the two small shared test helpers.
- CLI E2E client navigation.
- Any defer runtime change uncovered by the regression; that would require `FAIL_RESCOPE` rather
  than silently broadening a test leaf.

## Drift Watch

- Any need to edit route inference, root config/lock, CI workflow, or product defer source.
- Any inability of the current `definePage().withLayer()` output to exercise the partial endpoint.
- Any browser result that shows more than one real swap or more than one endpoint request.
