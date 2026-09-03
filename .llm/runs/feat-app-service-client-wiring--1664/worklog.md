# Worklog: explicit UI scaffold query-client selection

## Run Metadata

| Field              | Value                                           |
| ------------------ | ----------------------------------------------- |
| Run ID             | `feat-app-service-client-wiring--1664`          |
| Branch             | `feat/app-service-client-wiring`                |
| Baseline           | `270c31d4d6e9bab24597ac8fe077227d5e98dcc7`      |
| Archetype          | `6 - CLI / Tooling` (`packages/cli`)            |
| Scope overlay      | `frontend` (generated data-screen command only) |
| Coordinator ruling | PR 1664 bounded repair for issues 1355 and 1360 |

## Design

### Public Surface

- `netscript ui:add page <path> --island --client <service>` selects a generated query client by its
  declared service identity.
- `netscript ui:add island <name> --query --client <service>` uses the same selector.
- `UiAddCommandInput.client?: string` carries the optional presentation input to the application
  resolver.
- Existing `scaffoldUiPage` and `scaffoldUiIsland` inputs gain the same optional selector without
  changing their single-client default.

### Domain Vocabulary

- **service identity** — the value declared by `export const <name>Name = '<service>'` in a
  conventional generated query-client module.
- **candidate** — a discovered query-client module containing `createQueryFactories(`.
- **selection** — exact equality between `--client` and a candidate's declared service identity.

### Ports

- `FileSystemPort` remains the only consumed seam for candidate discovery and source reads; no new
  port or adapter is introduced.

### Constants and Existing Spine

- No new finite-value constant group is needed; service identities are project-defined strings.
- Existing Archetype-6 spine remains unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`,
  `CliRoot`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>`.
- No layer-2 abstract or extension axis changes.

### Commit Slice

| # | Slice                                                                          | Proving gates                                                                                                       | Files                                                                              |
| - | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1 | Add explicit service-identity selection while preserving fail-closed discovery | focused resolver and command tests; scoped structured check/lint/fmt; `packages/cli` tests; quality gate; lock hash | six coordinator-approved source/test files plus `worklog.md` and `context-pack.md` |

### Deferred Scope

- Automatic client choice remains prohibited when more than one service identity is available.
- Gate ordering, generated-client naming, templates, contracts, and service generation are
  unchanged.
- No labels, acceptance-box edits, evaluator dispatch, or merge action are part of this slice.

### Contributor Path

Add future data-bound UI options in `add-ui-input.ts`, declare and forward them in
`add-ui-command.ts`, then keep candidate resolution in `web-scaffold.ts`; prove the CLI mapping in
`add-ui-command_test.ts` and resolver semantics in `web-scaffold_test.ts`.

## Plan Gate

`PLAN-EVAL: N/A` — the coordinator supplied a locked resolution site, exact semantics, file ceiling,
and gate contract. No architecture or sequencing decision remains open.

## Decisions

| Decision                                         | Reason                                                                                                                      | Source                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Match declared service identity, not filename    | Generated module filenames are not the contract                                                                             | Coordinator ruling                                        |
| Preserve the no-selector/single-candidate branch | Existing projects depend on byte-identical auto-discovery                                                                   | Coordinator ruling                                        |
| Use exact service-name equality                  | The CLI flag names one conventional generated service                                                                       | Existing generated-client contract                        |
| Select `users` in the hosted data-screen gate    | `users` is the init fixture and the later browser behavior target; `payments` is the added second-service isolation fixture | `scaffold-gates.ts` and `service-client-runtime-probe.ts` |

## Progress Log

| Time (UTC)           | Step                   | Notes                                                                                                                                                                                    |
| -------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-31T06:05:14Z | Bootstrap and research | Verified clean branch/remote baseline, read required skills/doctrine/harness material, inspected the bounded source and fixture ordering, and recorded the design before implementation. |
| 2026-08-31T06:34:00Z | Implementation         | Added the bounded selector, distinct resolver failures, CLI surface forwarding, focused coverage, and the `users` E2E argument without changing gate order.                              |
| 2026-08-31T07:02:00Z | Validation             | Completed focused and package tests, structured check/lint/fmt with captured non-empty stdout, fitness gates, diff hygiene, and lock-integrity proof.                                    |

## Drift

None. The standard harness pack is otherwise absent in this coordinator-owned run directory; only
the two explicitly required run artifacts are added to respect the file ceiling.

## Gate Results

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Focused resolver and command tests | PASS | 20 passed, 0 failed |
| CLI package tests | PASS | 1,208 passed, 0 failed, 0 ignored |
| Structured check (`packages/cli`) | PASS | 917 files, 8 batches, 0 diagnostics; `stdout.bytes=303` |
| Structured lint (six owned TypeScript files) | PASS | 6 processed, 0 findings; `stdout.bytes=349` |
| Structured fmt (six owned TypeScript files) | PASS | 6 processed, 0 findings; `stdout.bytes=298` |
| `quality:gate` | PASS | quality scan and architecture check exited 0 |
| Diff hygiene | PASS | `git diff --check` exited 0; only the six approved TypeScript files and two required run artifacts changed |
| Lock integrity | PASS | before/after SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |

The recursive `packages/cli` diagnostic walk was not used as the package-test verdict: it traversed
nested E2E fixture workspaces and reported 1,494 passing tests plus three unrelated failures (two
fixture executable permission failures under `/ephemeral/tmp`, and an existing suite-registry
expectation that omits `generated.deno-lint`). The package-owned source/root test boundary above is
green. A broad lint diagnostic likewise found existing findings outside the six owned files; the
scoped lint verdict is clean.

The full `scaffold.runtime` suite was not run in this bounded implementation session. Its gate order
is unchanged; the existing data-screen invocation now supplies the fixture's `users` service.

## Handoff Notes

- Inspect the no-selector/single-candidate code path first; it must retain its existing behavior.
- Formal evaluation is intentionally not dispatched by this session under the coordinator ruling.
- Local implementation and gate work is complete. The remaining handoff actions are the single
  commit, explicit-refspec push, and PR evidence comment.

## Bounded Follow-up: stale expectations at `b37b023f`

### Scope and design

- Current-head baseline: `b37b023fbf8f54937c7cbeea778a4e59bd9fa8e9`; the remote branch matched
  it before the follow-up began. No rebase or merge was performed.
- Public surface, domain vocabulary, ports, constants, extension axes, gate order, and product code
  are unchanged. This is one mechanical expectation slice over exactly two test files.
- `add-ui-command_test.ts` asserts the complete normalized help option line:
  `--client <service> - Select the generated service query client for a data-bound page or island`.
- `suite-registry_test.ts` expects the shipped service-suite gate list without
  `GATE.GENERATED_DENO_LINT`; runtime-suite coverage for that gate remains asserted separately.
- `PLAN-EVAL: N/A` remains justified by the locked diagnosis, exact file ceiling, and specified
  gates. The owner explicitly waived evaluator work for this follow-up.

### Measured delta

| Measurement | Before | After |
| --- | --- | --- |
| Repo-wide tests | 4,511 passed / 4 failed (coordinator-supplied intake result) | 4,513 passed / 2 failed / 19 ignored (4,534 total) |
| Named help expectation | Already green but loose at current head | 1 passed / 0 failed with the full rendered option line asserted |
| Named suite-registry expectation | 0 passed / 1 failed | 1 passed / 0 failed |

The only remaining repo-wide failures are the coordinator-identified sandbox cases:

1. `browser version probe distinguishes path and process failure classes`
2. `browser startup reports early status and bounded stderr instead of a target timeout`

Both fail while spawning a fake browser executable under `/ephemeral/tmp` with
`PermissionDenied ... os error 13`; no other test failed.

### Follow-up gate results

| Gate | Result | Durable evidence |
| --- | --- | --- |
| Named help test | PASS — 1 passed / 0 failed | Structured test-wrapper output |
| Named suite-registry test | PASS — 1 passed / 0 failed | Structured test-wrapper output |
| Scoped check (`packages/cli`) | PASS — 918 files, 8 batches, 0 diagnostics; `stdout.bytes=303` | `receipts/check.json` |
| Scoped lint (two owned CLI tests) | PASS — 2 selected / 2 processed, 0 findings; `stdout.bytes=349` | `receipts/lint.json` |
| Scoped fmt (two owned CLI tests) | PASS — 2 selected / 2 processed, 0 findings; `stdout.bytes=298` | `receipts/fmt-check.json` |
| Repo-wide tests | EXPECTED SANDBOX RED — 4,513 passed / 2 failed / 19 ignored | `receipts/test.json` |
| Diff hygiene | PASS — `git diff --check` exited 0 | Local verification |
| Lock integrity | PASS — SHA-256 stayed `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` | Hash plus empty `deno.lock` diff |

The full `packages/cli` lint diagnostic selected 911 files and surfaced 14 pre-existing findings
outside the two-file ceiling; it is not used as this slice's verdict and no unrelated file was
changed. The final lint/format receipts cover exactly the two owned expectation files. The scratch
config only bypasses the root configuration's intentional `packages/cli/` exclusion so wrapper
coverage cannot produce a false green; it does not alter repository configuration.

### Drift, doctrine, and reconcile

- Drift: the help test was not failing at current head because separate substring checks already
  tolerated the shipped option. Tightening them into the complete rendered option-line expectation
  fulfills the requested coverage without product changes.
- Doctrine: Archetype 6 remains `Keep`; this expectation-only slice introduces no new imports,
  layering, folder-shape, public-surface, or debt implication.
- Reconcile: PR 1664 remains the handoff surface. Per owner instruction, this slice performs no
  label, acceptance-box, evaluator, readiness, or merge action.
- Commit trail: the single follow-up commit is the branch head containing this entry; its explicit
  refspec push and before/after PR comment complete the handoff.

## Hosted optimistic-render instrumentation

### Scope and design

- Current-head baseline: `7712e6a06e5394f0aeb748b1b3ecfdf7aeff57d0`; the remote branch matched
  it before this slice began. No rebase or merge was performed.
- Archetype 6 plus the frontend overlay remains the selected profile. This diagnostic slice changes
  only `service-client-browser-probe.ts`; generated islands, helpers, `packages/fresh`, and
  `packages/sdk` remain byte-identical.
- `PLAN-EVAL: N/A` — the coordinator supplied the exact failing assertion, the required evidence
  fields, a strict file ceiling, and a stop/rescope rule. The owner explicitly waived evaluator
  work.
- The probe installs a bounded browser-side QueryCache subscription immediately after
  `Page.loadEventFired`, before either the initial-row assertion or Rename. It retains at most 20
  matching `users/list` events and does not patch cache methods.
- The existing 20-second optimistic assertion, paused update response, request count, and settled
  checks are unchanged. On optimistic timeout only, the thrown error includes the
  `__NETSCRIPT_OPTIMISTIC_RENDER_DIAGNOSTICS__` JSON marker.

### Structured timeout contract

The timeout object records:

- `renderedRowText`, `mutationState`, and `renderState` from the live DOM;
- `islandHydrated` from browser QueryClient discovery and `islandInteractive`, backed by the
  already-observed paused `users.update` response after the CDP Rename click, plus the Fresh island
  host tag when discoverable;
- `listQueryKey`, `listCacheData`, and `listDataUpdatedAt` from the browser QueryClient;
- bounded `cacheEvents` and `onMutateRan`, where the latter requires an event containing the exact
  optimistic renamed value while the network response is still paused;
- `captureError` plus the instrumentation-install discovery result if the diagnostic snapshot itself
  cannot be serialized.

### Validation before hosted execution

| Gate | Result |
| --- | --- |
| Focused source-contract test | PASS — 1 passed / 0 failed |
| Full focused module test | EXPECTED SANDBOX RED — 23 passed / 2 failed; only the two previously measured `/ephemeral/tmp` executable-spawn permission cases |
| Scoped check (`packages/cli`) | PASS — 918 files, 8 batches, 0 diagnostics; `stdout.bytes=303` |
| Scoped lint (owned probe) | PASS — 1 selected / 1 processed, 0 findings; `stdout.bytes=349` |
| Scoped fmt (owned probe) | PASS — 1 selected / 1 processed, 0 findings; `stdout.bytes=298` |
| `quality:gate` | PASS — quality scan and architecture check exited 0 |
| Diff hygiene | PASS — `git diff --check` exited 0 |
| Lock integrity | PASS — SHA-256 remains `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |

### Review and next measurement

- Substantive review confirmed the diagnostic subscription is installed before the Rename click,
  keeps the response paused on failure, cannot turn a missing optimistic row into a pass, and emits
  the evidence through the command's captured thrown error rather than a live-only console stream.
- The next action is the single explicit-refspec push. The hosted `e2e-cli` / `scaffold-runtime`
  result is the authority for the measured cause and for deciding whether a template/helper fix is
  in scope or the run stops at the Fresh/provider rescope boundary.

### Hosted attempt 1 placement finding

- Workflow `e2e-cli` run `33407916040`, PostgreSQL job `99543222179`, executed the one-pass suite and
  reported 71 passed / 1 failed.
- The sole failure occurred before the optimistic assertion: the initial Rename row expression
  timed out after page load. Because the first instrumentation placement followed that assertion,
  this attempt emitted no structured marker and cannot name the cause.
- The bounded correction moves installation before that assertion and gives both initial-row and
  optimistic-row timeouts the same structured payload. The single commit is amended rather than
  adding a second commit.

## Convergence onto current main (2026-09-02)

### Baseline and merge

- Evaluated branch head: `377811da85045be055059d836c524c213794a71d`.
- Integrated `origin/main`: `77ad823dcb1874ccfc8964b4679ad92a3a145e0b` (44 commits ahead of
  the branch at fetch time).
- Merge conflicts:
  - `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` — took
    `main`'s side, then regenerated with `deno task gen:mcp-export-corpus`.
  - `packages/fresh/deno.json` — preserved `main`'s navigation export/check/doc-lint and dependency
    updates, plus the evaluated branch's `query-hydration-age_browser.ts` browser-test registration.
- Because the branch changes package READMEs, carriers were regenerated in dependency order:
  `gen:agent-docs-prose` (exit 0), `gen:assets-barrel` (exit 0), `gen:publish-assets` (exit 0), and
  `gen:mcp-export-corpus` (exit 0). The MCP corpus reports 35 packages, 272 subpaths, 7,808 symbols,
  and SHA-256 `a3c6de8ebcdec1fffbc2711b84ae331b8adb90778348f02566d2b23a021990e8`.

### Evaluated-head carry measurement

- Relative to merge-base `72599120a435c49e5791e795fd5c84b55f02be03`, the branch touches 57
  non-generated files under `packages/`.
- 51 remain byte-identical to evaluated head `377811da8`.
- Six are not byte-identical, all attributable to commits already on `origin/main`:
  `packages/cli/e2e/src/domain/cli-surface.ts`,
  `packages/cli/e2e/suites/scaffold/capability-suites.ts`,
  `packages/cli/e2e/tests/presentation/suite-registry_test.ts`,
  `packages/cli/src/kernel/templates/app/route-templates_test.ts`,
  `packages/fresh/README.md`, and `packages/fresh/deno.json`.
- This is genuine product/test/config movement, so the formal PASS at `377811da8` does **not** carry
  wholesale to the converged head. A fresh evaluation is required. The branch's implementation
  files for service-client generation, query bridging, UI selection, showcase templates, and the
  optimistic-render diagnostic remain byte-identical.

### Lock hygiene

- `deno.lock` is byte-identical to `origin/main` and has SHA-256
  `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.

### Gate boundary

- This convergence slice does not run Aspire, Docker, a browser, `e2e:cli`, or
  `scaffold.runtime`; the hosted singleton runtime lane remains supervisor-owned.
- Structured static/package test results and post-commit generator checks are appended after the
  converged commit is created and measured.

### Converged-head gate results

| Gate | Exit | Counts / evidence |
| --- | ---: | --- |
| `check:agent-docs-prose` | 0 | Non-empty build/check output; `fresh: true`, `stalePaths: []` |
| `check:assets-barrel` | 0 | Regeneration plus scoped `git diff --exit-code` clean |
| `check:publish-assets` | 0 | Check-mode regeneration clean |
| `check:mcp-export-corpus` | 0 | 35 packages / 272 subpaths / 7,808 symbols; corpus SHA-256 `a3c6de8e…` |
| Structured check — CLI | 0 | 930 files / 8 batches / 0 failed; stdout 303 bytes |
| Structured lint — CLI, exact requested command | 2 | 930 selected / 6 batches / 5 failed / 733 dropped / 0 findings; stdout 104,106 bytes |
| Structured fmt — CLI, exact requested command | 2 | 930 selected / 6 batches / 4 failed / 733 dropped / 0 findings / 197 processed; stdout 102,778 bytes |
| Structured check — Fresh | 0 | 211 files / 2 batches / 0 failed; stdout 303 bytes |
| Structured lint — Fresh | 0 | 211 files / 2 batches / 0 findings; stdout 355 bytes |
| Structured fmt — Fresh | 0 | 211 files / 2 batches / 0 findings; stdout 304 bytes |
| Structured check — SDK | 0 | 102 files / 1 batch / 0 failed; stdout 303 bytes |
| Structured lint — SDK | 0 | 102 files / 1 batch / 0 findings; stdout 355 bytes |
| Structured fmt — SDK | 0 | 102 files / 1 batch / 0 findings; stdout 304 bytes |
| Focused branch-touched CLI tests, excluding browser-probe lane | 0 | 106 passed / 0 failed / 0 ignored across 16 files; stdout 1,441 bytes |
| Fresh query unit suite | 0 | 12 passed / 0 failed / 0 ignored; stdout 308 bytes |
| SDK key-bridge suite | 0 | 2 passed / 0 failed / 0 ignored; stdout 318 bytes |
| `quality:gate` | 0 | Quality scan has 0 findings and 7 existing allowances; doctrine scan has 0 failures; stdout 46,238 bytes |

The exact CLI lint/fmt wrapper failures are configuration coverage refusals, not findings. A clean
detached `origin/main` worktree reproduces them: lint exit 2 with 915 selected / 723 dropped / 0
findings, and fmt exit 2 with 915 selected / 723 dropped / 0 findings. Root `deno.json` deliberately
excludes `packages/cli/` from both lint and fmt. An explicit scratch-config diagnostic can process
the full package but exposes unrelated existing CLI debt; it is not substituted for the requested
verdict and this convergence slice does not rewrite that surface.

### Behavioral question: partial-navigation changes

Neither intervening Fresh change plausibly repairs `behavior.service-client-refetch`:

- Commit `102ef8a10` adds the opt-in `installPartialNavigationCoordinator()`, whose
  `NavigationRuntime` wraps document fetch/history for Fresh partial requests, and `KeyedPartial()`,
  whose Preact key remounts a named Fresh partial boundary. The generated service showcase imports
  neither API. The hosted probe reaches the page through CDP page navigation and then clicks Rename
  inside the already-loaded island; no package coordinator or Fresh partial boundary participates.
- Commit `556690a99` (the implementation for issue 1900, merged as PR 1904) changes only
  `NavigationRuntime`: it captures `platformFetch = originalFetch.bind(globalThis)` and calls that
  receiver-safe function from `interceptFetch()`. That can prevent a detached-fetch `TypeError`
  after the optional coordinator is installed, but it does not touch island hydration,
  `QueryClientProvider`, TanStack observer notification, or Preact rendering.
- `QueryIsland`, the query singleton/hooks, both service-showcase/optimistic template paths, and
  the optimistic helper are byte-identical between evaluated head and the converged head; the
  intervening `main` log is empty for those paths.

Conclusion: these paths are disjoint. They do not provide a reason to spend a hosted runtime rerun
on this convergence alone; the previously measured Fresh/Preact hydration/render-propagation
question remains open for supervisor-owned runtime evidence.

## Width-stable CLI help assertion follow-up (2026-09-02)

### Red-first measurement

- `COLUMNS=40 deno test ... --filter 'ui:add help explains'` remained green (1 passed / 0 failed),
  because Cliffy 1.2.1 does not read `COLUMNS` for this path. Its `getColumns()` calls
  `Deno.consoleSize().columns` and otherwise falls back to 150 columns.
- Calling the same command's public `getHelp({ width: 40, colors: false })` reproduced the CI class
  deterministically. The existing normalization yielded:
  `--client <service> - Selec t the gener ated servi ce query clien t for a data- bound page or islan d`.
  The full-description `assertStringIncludes` exited 1.
- Root cause: terminal-width-dependent Cliffy table wrapping. At very narrow widths it splits
  inside words, so collapsing whitespace on only the rendered side cannot restore the advertised
  sentence.

### Bounded correction

- The help-contract tests now render with `getHelp({ colors: false, width: 80 })`. Width 80 is
  intentionally narrow enough to exercise ordinary multi-line wrapping while avoiding Cliffy's
  lossy sub-word column split.
- `assertHelpIncludes()` collapses all whitespace runs to one space and trims **both** the rendered
  help and complete expected text before `assertStringIncludes`.
- All sibling rendered-help assertions in the file use the same helper; the option assertion still
  requires the complete `--client <service>` line and full description.

### Gate evidence

| Gate | Exit | Counts / evidence |
| --- | ---: | --- |
| Named post-fix help test | 0 | 1 passed / 0 failed / 6 filtered out |
| Exact `ui/add` structured test wrapper | 0 | 7 passed / 0 failed / 0 ignored |
| Full package-owned CLI suite (`packages/cli/src` + `packages/cli/tests`) | 0 | 1,246 passed / 0 failed / 0 ignored |
| Structured CLI check | 0 | 930 files / 8 batches / 0 failed / 0 diagnostics |
| Owned-file lint with a scratch config matching repository style | 0 | 1 selected / 1 processed / 0 findings |
| Owned-file fmt with a scratch config matching repository style | 0 | 1 selected / 1 processed / 0 findings |
| `quality:gate` | 0 | Quality scan 0 findings / 7 existing allowances; doctrine 0 failures |
| Lock integrity | 0 | No diff from pre-slice head; SHA-256 `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d` |

The exact root configuration still refuses CLI lint/fmt wrapper probes as all-excluded, matching the
already measured main-side coverage issue. Those refusals are not relabeled as passes; a temporary
non-committed config containing the repository's 100-column/single-quote style was used only to
prove the owned file itself, and this test-only slice does not alter root configuration. No Aspire,
Docker, browser, `e2e:cli`, or `scaffold.runtime` command was run.

## Fresh query-fixture startup-budget follow-up (2026-09-02)

### Design

- Effective profile: Archetype 4 (`packages/fresh`) plus the frontend overlay, limited to the
  branch-owned query-hydration browser fixture; `packages/fresh/src`, the #1895 form-navigation
  fixture, and runtime tiers are excluded.
- Public surface: none. This is test-harness reliability and failure-evidence work only.
- Constants: a 60,000 ms monotonic startup deadline, 100 ms poll/fetch interval, and bounded 16 KiB
  tail capture per Vite output stream.
- Control flow: retain the `child.status` race for immediate crash detection; bound each readiness
  fetch by the remaining deadline; include labeled captured stdout/stderr on both startup exit and
  timeout.
- Commit slice: one fixture-test edit plus append-only harness records, proven by Fresh structured
  check/test/lint/fmt, repository quality/doctrine gates, diff hygiene, and lock identity.
- PLAN-EVAL: N/A — the owner supplied the exact defect contract, scope ceiling, constants, and gate
  set; no architecture or product decision remains open.

### Confirmed failure mechanism

- Hosted run `33625391122`, job `100231909142`, reached `Timed out waiting for ...` rather than
  `Vite fixture exited before startup`. In the old implementation that is possible only after all
  100 races against `child.status` returned their 50 ms timer result; the child remained alive
  throughout the approximately five-second readiness budget.
- The two preceding form-navigation tests use a different Vite fixture root. Git history and the
  branch diff show that `tests/query-hydration-age_browser.ts` and its fixture root are branch-added,
  so the query fixture still pays its own module-graph startup cost.
- A local isolated-cache probe was not a CI-speed reproduction: this sandbox exited after 2,550 ms
  because Rollup's native module could not map from the ephemeral cache. That probe independently
  demonstrated why discarded Vite streams were inadequate: the old fixture would suppress the only
  actionable startup error. It is not used as evidence for the hosted runner's slowness.

### Repair and gate evidence

- The waiter now measures a real 60-second wall-clock deadline with `performance.now()`. Sixty
  seconds gives a cold CI Vite resolve an order-of-magnitude larger startup window while remaining
  bounded and far below the outer 30-minute gate timeout.
- Vite stdout and stderr are drained continuously to bounded tail buffers. A timeout reports both
  labeled streams; an early child exit reports the same evidence after the streams close.
- `tests/form-navigation_browser.ts` is the only sibling with the old waiter shape and remains
  untouched as required.

| Gate | Exit | Counts / evidence |
| --- | ---: | --- |
| Structured Fresh check | 0 | 211 selected / 2 batches / 0 failed / 0 diagnostics |
| Structured Fresh package test | 0 | 276 passed / 0 failed / 0 ignored |
| Structured Fresh lint | 0 | 211 selected / 211 processed / 0 findings |
| Structured Fresh fmt | 0 | 211 selected / 211 processed / 0 findings |
| `quality:gate` | 0 | Quality scan 0 findings / 7 existing allowances; doctrine 0 failures |
| Lock integrity | 0 | No diff from `573d01d35`; SHA-256 `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d` |

The package test wrapper does not select the explicitly named `_browser.ts` files, so its zero
ignored count is not a browser verdict. A local Chromium executable exists, but `playwright-cli` is
absent; consequently `deno task --cwd packages/fresh test:browser` was not run. No Aspire, Docker,
`e2e:cli`, or hosted runtime command was run.

## Query-fixture catalog resolution and explicit hydration proof (2026-09-02)

### Design

- Effective profile: Archetype 4 (`packages/fresh`) plus the frontend overlay, constrained to the
  branch-owned query-hydration browser fixture and its test. `packages/fresh/src` and every #1895
  surface remain excluded.
- Public surface: none. The fixture will mirror the sibling route-binding Vite catalog bridge and
  make existing client behavior explicit in browser evidence.
- Catalog bridge: read the root `deno.json` catalog with the precedent's missing-entry error; add a
  post-enforced, fixture-specific virtual module only for bare specifiers proven necessary by the
  query fixture's graph.
- Hydration vocabulary: `freshIslandElement`, `queryClientFound`, `islandHydrated`, and
  `islandInteractive`. Interactivity requires a real browser click that increments rendered island
  state; an effect or SSR markup alone is insufficient.
- Existing contract: retain the exact old/fresh snapshot, request-count, fetching/refetching, and
  `dataUpdatedAt` assertions after the four named hydration assertions.
- Commit slice: one fixture config, one fixture island, one browser test, and append-only harness
  records. The proving gate is `packages/fresh test:browser`; structured Fresh check/test plus lock,
  diff, lint/fmt, and quality/doctrine checks provide the static evidence.
- PLAN-EVAL: N/A — the coordinator supplied an exact in-repo implementation precedent, assertion
  vocabulary, scope ceiling, and gate set; no design choice remains open.

### Implementation and local evidence

- Baseline: converged head `1dd9760246ac93edc9cc264cab14d67f5dbc716f`, containing main
  `37452f11f`. The worktree was clean and the branch pull was already current before edits.
- The fixture config now matches `route-binding-browser/vite.config.ts`: it reads the root catalog,
  preserves the missing-entry error, and uses a post-enforced fixture-specific virtual id. Only
  `@opentelemetry/api` is mapped; `zod`/`catalog:` was not copied because this graph did not require
  it.
- An exact Vite launch and HTTP request passed with status 200, expected page markup, and empty
  stderr. End-to-end readiness took 5,742 ms locally while Vite reported ready in 585 ms; no second
  unresolved specifier appeared.
- The island now exposes a real button-driven interaction counter and a query-client reachability
  attribute. The browser test records the nearest Fresh island element, query-client reachability,
  client-effect hydration, and the post-click state change. Four named assertions run for both old
  and fresh navigation modes before the unchanged snapshot-age assertions.
- The CI-pinned `@playwright/cli@0.1.17` was provisioned outside the repository for a local attempt.
  The browser task exited 1 with 0 passed / 3 failed because the sandbox has neither branded Chrome
  at `/opt/google/chrome/chrome` nor Chromium's required `libnspr4.so`. All failures occurred during
  browser launch; no hydration value was observed locally and the #1895 test files were not edited.

| Gate | Exit | Counts / evidence |
| --- | ---: | --- |
| Exact Vite fixture startup | 0 | HTTP 200 / expected markup / empty stderr; 5,742 ms |
| `packages/fresh test:browser` | 1 | 0 passed / 3 failed; browser-runtime prerequisite failure before page launch |
| Structured Fresh check | 0 | 211 selected / 2 batches / 0 failed / 0 diagnostics |
| Structured Fresh package test | 0 | 276 passed / 0 failed / 0 ignored |
| Structured Fresh lint | 0 | 211 selected / 211 processed / 0 findings |
| Structured Fresh fmt | 0 | 211 selected / 211 processed / 0 findings |
| `quality:gate` | 0 | Quality scan 0 findings / 7 existing allowances; doctrine 0 failures |
| Lock integrity | 0 | No diff from `1dd976024`; SHA-256 `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d` |

The exact-head CI browser lane remains the decisive hydration observation. The test emits a
`query-hydration-evidence:` JSON marker so the four old/fresh values survive in the gate output.

### Final-byte validation

- After formatting the evidence statement, structured Fresh check again passed with 211 selected
  files / 2 batches / 0 failed batches / 0 diagnostics.
- Structured Fresh package tests again passed 276 / 0 / 0 in 7,377 ms; Fresh lint passed 211 / 211
  with 0 findings, and the final Fresh fmt wrapper passed 211 / 211 with 0 findings.
- `quality:gate` passed with 0 quality findings (7 pre-existing allowances) and 0 doctrine
  failures. `deno.lock` remained byte-identical to `1dd976024` with SHA-256
  `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.

### First exact-head browser observation and instrumentation correction

- CI run `33631309859`, job `100251294576`, evaluated the PR merge head for branch commit
  `7f99cbeff`. The browser step reported 2 passed / 1 failed and emitted both complete hydration
  objects before the assertion:
  `freshIslandElement=null`, `queryClientFound=true`, `islandHydrated=true`, and
  `islandInteractive=true` for both old and fresh modes.
- A direct fixture response then showed the cause of the lone false field: Fresh 2 emits
  `<!--frsh:island:app:0:-->` and `<!--/frsh:island-->` boundary comments, not a
  `<fresh-island>` element. The initial ancestor selector therefore measured a DOM shape from a
  different Fresh representation even though the client effect and click had both executed.
- The first assertion now checks the exact `frsh:island:app:0:` boundary immediately before the
  island root. The remaining three assertions and all snapshot-age assertions are unchanged.
- Final-byte rerun: check 211 files / 2 batches / 0 diagnostics; package tests 276 / 0 / 0 in
  7,682 ms; lint and fmt each 211 / 211 with 0 findings.

### Second exact-head browser observation

- CI run `33633076918`, job `100257200773`, again observed the three client facts as true in both
  modes, but `freshIslandElement` remained null: Fresh removes its `frsh:island` server comments
  during client boot, so the boundary is not a hydrated-DOM invariant.
- The fixture now explicitly marks the `QueryHydrationAgeBrowser` root with
  `data-fresh-island="query-hydration-age"`, using the alternate island selector already present in
  the #1845 diagnostics. The named element check asserts that this root is `main`; client-effect
  hydration and post-click state change remain independent assertions against SSR-only markup.
- Final-byte local rerun: check 211 files / 2 batches / 0 diagnostics; package tests 276 / 0 / 0 in
  7,562 ms; lint and fmt each 211 / 211 with 0 findings.

## 2026-09-02 generated-island attribution measurement

- Measurement baseline: branch `e979f8b3d6e279602f25a0046185324e29f129c5`; freshly fetched
  `origin/main` `25a026c0e7c494caf714c0a605b1e7a6bce07165`; merge-base
  `37452f11f5045f0f5a98e07d802bcc2a2e94333b`.
- Blob comparison found the writers, app entry, Vite config, host component, route page/layout, and
  both showcase loaders byte-identical between branch and current main. The database and memory
  island templates differ only by `initialDataUpdatedAt: props.cachedAt`.
- The service-query template changes no discovery or component structure: it removes the
  `bridgeInvalidation` import/call, keys `createQueryFactories` by the generated service name, and
  derives the invalidation prefix from `list.clientKey()`. `createQueryFactories` treats that name
  as an arbitrary resource string; `clientKey()` returns an array. The branch therefore adds no
  client import or module-load hazard relative to main.
- Fresh plugin-vite 1.1.2 delegates initial discovery to Fresh core 2.3.3, whose `crawlRouteDir`
  explicitly identifies `routes/**/(_islands)/**` as islands. The generated route-local location is
  supported without listing each generated module in `islandSpecifiers`.
- Structural comparison: both generated and focused fixtures default-export a component wrapping
  an inner `useQuery`/`useQueryClient` component in `QueryIsland`. The focused fixture directly
  registers its single app module, accepts two primitive props, and adds explicit effect/click
  evidence. The generated app relies on route crawling, crosses the definePage/layer/host-component
  chain, receives dehydrated service data, and imports the generated client/query/mutation graph.
  Its source has no stable `data-fresh-island` marker, unlike the evidence-focused fixture.
- Outcome: runtime attribution is **indeterminate without a clean-main browser observation**. Static
  attribution strongly excludes this branch's three template changes, but a source comparison is
  not permission to claim a browser fact that was never measured. The exact
  `behavior.service-client-refetch` probe is branch-only and does not exist on current main; an
  inspected clean-main runtime log therefore could not contain that check.
- Decisive evidence: render the same generated service project from current clean main, navigate to
  the generated service example with the existing CDP diagnostics, and record initial row,
  query-client, interaction, island marker, and browser/Vite module-load errors. This remains a
  supervisor-owned browser measurement; no browser, Aspire, Docker, hosted runtime, or `e2e:cli`
  command was run here.
- Hosting the actual generated source in the focused fixture is not cheap: it requires rendering
  and supplying the generated contracts, service client/query module, showcase loader, optimistic
  helper, copied UI modules/aliases, and Fresh route/layer registration. Stubbing those seams would
  prove a surrogate rather than the generated artifact.
- No product or test source changed. `deno.lock` remained byte-identical to both HEAD and current
  main, SHA-256 `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.

## 2026-09-02 README fence ratchet follow-up

### Design

- Surface: the branch-authored `packages/fresh/README.md` cache-age example only; no runtime or
  exported API changes.
- Contract: retain the complete `useQuery` example while binding every contextual name with a real
  public import or a typed declaration. No `any`, ratchet edits, or baseline-README cleanup.
- Commit slice: one README example plus append-only harness records, proved by the README fence and
  JSDoc ratchets, scoped Fresh check, and lock identity.
- PLAN-EVAL: N/A — this is a mechanical documentation correction with an owner-authorized file,
  exact seven-error attribution, fixed conventions, and a fixed gate set.

### Red-first attribution and repair

- Baseline head `771548f6d` contains main `3066a0cc5`. The pre-edit README gate exited 1 with
  `readmes=36 fences=168 ts_like=73 checked=72 syntax_invalid=1 type_errors=39
  failing_readmes=7 unattributed_failure=false`.
- Contrary to the initial attribution, `packages/cli/README.md` has the same single checked fence as
  main and already declares its contextual callback. `git blame` and the ref-level fence census
  identify commit `1df8a5274` as the author of Fresh's sixth checked fence.
- The Fresh cache-age fence now imports the public `useQuery` wrapper. Its trailing context block
  defines `Order` and `OrdersInput`, then declares the query factory's typed `clientKey`, the
  client's async `list`, the list input, and the server-loaded `initialOrders`/`cachedAt` props.
  This binds all seven formerly unbound references without casts.

| Gate | Exit | Evidence |
| --- | ---: | --- |
| `docs:readme-fences` before | 1 | 168 fences / 73 TS-like / 72 checked / 39 type errors / 7 failing READMEs |
| `docs:readme-fences` after | 0 | 168 fences / 73 TS-like / 72 checked / 32 type errors / 7 failing READMEs |
| `docs:jsdoc-examples` | 0 | 358 checked / 0 failures; deferred `unboundName=116`, `typeError=14` |
| Structured Fresh check | 0 | 211 selected / 2 batches / 0 failed / 0 diagnostics |
| Lock integrity | 0 | Byte-identical to HEAD and main; SHA-256 `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d` |

No Aspire, Docker, browser, runtime-tier, or `e2e:cli` command was run.

## 2026-09-02 S9 convergence onto `88fc6d69d`

### Design and merge contract

- Archetype: 6 — CLI / Tooling. This is a mechanical convergence slice with no public or feature
  contract change.
- PLAN-EVAL: N/A — the coordinator supplied the exact parents, three conflict paths, resolution
  rule, generated-carrier policy, and gate set. No architecture or sequencing decision remained.
- Parent 1: `ad50a5e22820178019cfeafe5989744e25ef9831`; parent 2:
  `88fc6d69dd3287c2d5bcb75dbef751c982d596e0`.
- Conflict rule: preserve the branch's service-client gate sequence and S9's agent-init/MCP-smoke
  registrations, without reordering either side's existing entries.

### Conflict resolutions

| Path | Resolution |
| --- | --- |
| `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts` | Kept the branch's service-client add, generate, and generated-contract command gates in their existing order, then kept S9's scaffold agent-init command gate before the shared service-list tail. |
| `packages/cli/e2e/src/domain/cli-surface.ts` | Kept the branch's two service-client scaffold IDs and S9's scaffold agent-init ID in their respective order. S9's `agent.aspire-mcp-smoke` receipt-gate ID/export remains present. |
| `packages/cli/e2e/suites/scaffold/capability-suites.ts` | Kept the branch's service-client add/generate entries and S9's agent-init entry before the existing UI/runtime tail. S9's Aspire MCP smoke gate remains in the runtime suite. |

All staged generated paths were first restored from `origin/main`. The MCP corpus generator's
normal write mode refused the unresolved merge's dirty package read set, so its documented
`--allow-dirty` merge override was used; the later check mode passed. The Aspire surface manifest
was regenerated to 915 rows / 0 unmatched. `check:assets-barrel` then regenerated the combined
branch carrier and passed after that generated result was staged.

### Validation

| Gate | Exit | Evidence |
| --- | ---: | --- |
| Structured CLI check | 0 | 970 selected files / 9 batches / 0 failed batches / 0 diagnostics |
| Full `packages/cli/e2e/tests/` unit directory | 1 | 305 passed / 2 failed / 0 ignored; both failures are the previously recorded no-exec sandbox temp-fixture spawn limitation in `service-client-runtime-probe_test.ts` |
| `suite-registry_test.ts` | 0 | 20 passed / 0 failed / 0 ignored |
| `check:mcp-export-corpus` | 0 | 35 packages / 273 subpaths / 7,846 symbols; SHA-256 `cc64442fb17e54e59924574afd87a48a7ad25b25f0ebdb5de079c60d6b38d06d` |
| `check:assets-barrel` | 0 | Combined generated asset carrier is current |
| `check:publish-assets` | 0 | Published asset set is current |
| `check:aspire-version-parity` | 0 | Expected 13.5.3; 914 checked / 0 failed / manifest fresh |
| `docs:readme-fences` | 0 | 169 fences / 74 TS-like / 74 checked / 7 tolerated type errors / 0 unattributed failures |
| `arch:check` | 0 | Dependency and doctrine scans completed with warnings only / 0 failures |
| Lock identity | 0 | Byte-identical to both parents; SHA-256 `6c8f90a26375dcc0cec969f01e5bfb9e474216adb10f1cfbf68df5edab6b94d6` |

### Product-diff attribution

- The staged merge-tree comparison from `ad50a5e22` found 57 non-generated `packages/**` or
  `plugins/**` paths: 53 are byte-identical to `origin/main` and therefore pure S9 arrivals.
- The three hand-resolved paths differ from `origin/main` only by this branch's pre-existing gate
  entries. `suite-registry_test.ts` also differs from both parents because Git merged both sides
  automatically; `git log ad50a5e22..origin/main -- <path>` attributes S9's side of that file to
  `88fc6d69d`.
- No unmerged entries remain. No Aspire, Docker, browser, hosted-runtime, or `e2e:cli` command was
  run.

## 2026-09-03 generated service-refetch discriminating measurement

### Design and bounded experiment

- Archetype: 6 — CLI / Tooling. The product surface under measurement is generated Fresh UI, but
  this slice is limited to scaffold templates and their browser evidence probes; `packages/fresh/src`
  is not a permitted implementation seam.
- Baseline: branch `4e86a311397c7bf38adf68e2139201c331673bf2`, compared with the coordinator-pinned
  clean-main ref `9464ab223`. The later remote `main` tip is deliberately not merged into this
  bounded slice.
- PLAN-EVAL: N/A — the coordinator supplied an ordered three-outcome experiment, exact comparison
  ref, bounded edit ceiling, and fixed validation set. No architecture or public-contract choice is
  being delegated to this implementation session.
- Red-first source measurement: both `ServiceShowcaseLab` templates retain clean main's default
  export, `QueryIsland` boundary, row structure, and interaction label. Their only branch delta is
  `initialDataUpdatedAt: props.cachedAt`. The service-query template changes the query-factory
  resource name and list invalidation derivation, not island registration or provider placement.
- Next discriminators: emit identical stock `users` sqlite workspaces from both refs under
  `/home/agent/tmp`, compare the three generated files byte-for-byte, serve the branch artifact
  without Aspire, and run both #1885's hydration receipt and the service-refetch browser evidence
  against that same URL.

### Emitted-artifact comparison

- Public CLI scaffolds from both refs completed with exit 0: 210 files / 47 directories each,
  project `service-refetch-fixture`, sqlite database, and service name `users`.
- A recursive comparison found exactly two differing emitted files. The generated island differs
  only by the branch's `initialDataUpdatedAt: props.cachedAt`; its route-local `(_islands)` path,
  default export, `QueryIsland`, `Rename` control, `ul[data-state]`, and Fresh boot registration are
  byte-identical. The generated service-query module removes `bridgeInvalidation`, changes the
  factory member from `service` to `users`, and derives the invalidation prefix from
  `usersQueries.list.clientKey()`.
- The standalone route returned HTTP 200 and the server HTML contained
  `frsh:island:ServiceShowcaseLab:1:`, `Seed User`, `Rename`, and `data-state="success"`.

### Browser discriminators and measured cause

- Browser support was recovered without a system install: the cached Playwright Chromium was run
  with Debian browser libraries extracted under `/home/agent/tmp`; every Deno eval used
  `--no-lock`. A capability-check import briefly changed `deno.lock`; that diagnostic-only change
  was immediately restored to HEAD before further work.
- Red-first #1885 receipt output (exit 0):
  `ISLAND_HYDRATION_OBSERVATION={"initialRow":"Seed User","rowAfterRename":"Seed User*","dataState":"success","freshIslandElement":"ul[data-state=\"success\"]"}` and
  `ISLAND_HYDRATION_PROBE_RESULT={"islandHydrated":true,"freshIslandElement":"ul[data-state=\"success\"]"}`.
- Red-first service probe output (exit 1):
  `SERVICE_CLIENT_BROWSER_PROBE_ERROR=optimistic row assertion failed` with diagnostics
  `renderedRowText="Seed User**"`, `islandInteractive=true`, and `queryClientFound=false`.
  The exact doubled suffix is discriminating: #1885 had already persisted `Seed User*`; the app's
  server cache still SSR-rendered `Seed User`, then the service probe's own Refresh loaded
  `Seed User*`, but the probe continued expecting a rename derived from its pre-refresh snapshot.
- Removing only `initialDataUpdatedAt` in the temporary artifact reproduced the same false
  optimistic failure. Substituting both clean-main emitted files allowed the optimistic assertion
  but then timed out at refetch because main's `service` query key and `users` invalidation prefix
  do not match. The branch templates are therefore not the hydration failure.
- A direct response-paused browser timeline on the unchanged branch artifact observed the true
  optimistic state while held: row `Seed User*****`, disabled Rename control, and notice
  `Optimistically renamed record #1.`. An ordinary unpaused interaction observed one update and
  exactly one following list request.
- After the probe re-read the row after its baseline Refresh, the optimistic phase passed and
  exposed a second CDP-only fault: `Fetch.continueResponse` left the browser mutation promise
  pending. Sending `Fetch.disable` immediately after continuing the sole held response releases
  interception; the mutation settles and invalidation produces the required single refetch.
- The timeout diagnostics now classify hydration from the #1885-compatible observable interaction
  contract and report the concrete `ul[data-state="..."]` surface. QueryClient discovery remains a
  separate diagnostic field and no longer turns an executed Rename handler into a false
  non-hydration claim.

### Fixed exact-head browser evidence

- Re-running the probes in the requested order against the same standalone Vite/service pair:
  `ISLAND_HYDRATION_OBSERVATION={"initialRow":"Seed User******","rowAfterRename":"Seed User*******","dataState":"success","freshIslandElement":"ul[data-state=\"success\"]"}`
  and `ISLAND_HYDRATION_PROBE_RESULT={"islandHydrated":true,"freshIslandElement":"ul[data-state=\"success\"]"}` (exit 0).
- Fixed service probe output (exit 0):
  `SERVICE_CLIENT_BROWSER_PROBE_RESULT={"baselineListRequestCount":1,"finalListRequestCount":2,"mutationSucceeded":true,"optimisticRowContainedRenamedName":true,"finalRowContainedRenamedName":true,"renamedName":"Seed User********"}`.
- No template or Fresh runtime source changed. The code touch is the branch-owned CDP probe plus its
  existing unit test; validation receipts follow below.

### Constraint drift and cleanup

- The generated `netscript-dev db` wrapper unexpectedly launched an isolated AppHost while running
  sqlite init/generate/seed. This contradicted the no-Aspire constraint; it was not an intentional
  runtime gate. The process was interrupted at disclosure, its exact run-owned process tree was
  terminated, and a read-only process check confirmed no process rooted in this fixture remained.
  Subsequent runtime work used only standalone Vite and the generated Deno service; Docker and
  `e2e:cli` were never invoked.

### Final validation

| Gate | Exit | Counts / evidence |
| --- | ---: | --- |
| Exact touched probe test with `TMPDIR=/home/agent/tmp` | 0 | 25 passed / 0 failed / 0 ignored |
| Structured CLI check | 0 | 984 selected / 9 batches / 0 failed / 0 diagnostics |
| Structured Fresh check | 0 | 219 selected / 2 batches / 0 failed / 0 diagnostics |
| Full `packages/cli/e2e/tests/` unit directory | 0 | 325 passed / 0 failed / 0 ignored |
| `check:assets-barrel` | 0 | Generated asset barrel current |
| `check:publish-assets` | 0 | Published asset set current |
| `check:emitted-samples` | 0 | 48 emitted TypeScript samples from 38 artifact paths checked |
| `check:mcp-export-corpus` | 0 | 35 packages / 273 subpaths / 7,846 symbols; corpus current |
| `check:aspire-version-parity` | 0 | Expected 13.5.3 / 916 checked / 0 failed / manifest fresh |
| `arch:check` | 0 | Dependency and doctrine checks completed with 0 failures |
| `quality:gate` | 0 | Root coverage complete; 0 quality findings / 7 existing allowances; doctrine 0 failures |
| `docs:readme-fences` | 0 | 169 fences / 74 TS-like / 74 checked / 7 tolerated type errors / no unattributed failure |
| `docs:jsdoc-examples` | 0 | 359 checked / 0 failures; deferred `unboundName=116`, `typeError=14` |
| Source formatting and diff hygiene | 0 | 2 touched TypeScript files formatted; `git diff --check` clean |
| Lock integrity | 0 | Byte-identical to the slice baseline; SHA-256 `6c8f90a26375dcc0cec969f01e5bfb9e474216adb10f1cfbf68df5edab6b94d6` |

The touched-test wrapper was also run once without the required home-directory `TMPDIR`; that
environment reported 23 passed / 2 failed because `/ephemeral/tmp` forbids execution of the two
test-created browser stubs. Re-running on the slice's prescribed executable temp root passed all
25 tests. No generated carrier, template, Fresh source, SDK source, or lock-file byte changed.

## 2026-09-03 hosted no-island follow-up at `dbb577826`

### Design

- Archetype: 6 — CLI / Tooling. This is a bounded E2E ordering and failure-evidence correction; it
  changes no public CLI vocabulary, scaffold template, generated application, or Fresh runtime.
- Public surface: unchanged. The internal runtime suite will run the served-surface and hydration
  discriminators immediately before the service-client refetch proof.
- Domain vocabulary: a bounded page-failure snapshot consisting of final URL, main-document HTTP
  status, title, first 600 body-HTML characters, console/runtime errors, and failed HTTP/network
  requests.
- Ports and effects: the existing CDP client remains the only browser edge. `Network`, `Runtime`,
  and `Log` events supply diagnostics already available during the probe; no new process or network
  abstraction is introduced.
- Constants: retain the existing gate IDs and add only a fixed 600-character document snippet cap.
- Commit slice: reorder the three behavior gates, colocate their gate definitions in runtime
  behavior composition, add bounded failure capture, align refetch with the same canonical URL as
  the #1885 probes if static and standalone evidence show `preview=success` adds no behavior needed
  by the assertion, update order/diagnostic tests, then run the coordinator-specified gates.
- Deferred scope: no template/runtime repair without evidence; no Aspire, Docker, hosted runtime,
  or local `e2e:cli` execution.
- Contributor path: `capability-suites.ts` declares verdict order; `behavior-gates.ts` composes the
  live-app command gates; `service-client-browser-probe.ts` owns CDP evidence.
- PLAN-EVAL: N/A — the coordinator supplied the exact order, bounded diagnostic fields, decision
  rule for the query string, touch ceiling, and gate set. No material architecture decision remains.

### Measurement and implementation

- Static route inspection found that `preview=success` is parsed into `previewState` only. Both the
  database and memory loaders still fetch the service records, the lab panel always renders the
  default-exported `ServiceShowcaseLab`, and the island always installs its `QueryClientProvider`.
- The exact-branch generated fixture at
  `/home/agent/tmp/ns1664-local-out.IOeTzR/service-refetch-fixture` was served with its standalone
  Deno service and Vite, without Aspire or Docker. Direct requests measured:
  - `/examples/users`: HTTP 200, 135,557 bytes, one `frsh:island:ServiceShowcaseLab:1:` marker, one
    `>Rename<` control, and one `data-state="success"` marker.
  - `/examples/users?preview=success`: HTTP 200, 135,635 bytes, with the same three marker counts.
  - The 78-byte response delta is serialized preview state; the query does not suppress the island,
    its bundle, or the control in this standalone generated app.
- The refetch gate now targets the same canonical `/examples/users` document as the two #1885
  discriminators. The query was removed to eliminate an unnecessary hosted-environment difference,
  not because local evidence showed it caused the missing DOM.
- Runtime order is now `behavior.island-served-surface` → `behavior.island-hydration` →
  `behavior.service-client-refetch`, with the refetch command moved from scaffold composition into
  runtime behavior composition immediately after hydration.
- Refetch failures now carry bounded structured evidence for final URL, document HTTP status,
  document title, the first 600 body-HTML characters, console/runtime/log errors, and failed HTTP or
  network requests. HTTP failures include method/status/URL, so missing client bundles survive into
  the gate artifact. Existing mutation, optimistic-row, and exactly-one-refetch success assertions
  are unchanged.

### Validation

| Gate | Exit | Counts / evidence |
| --- | ---: | --- |
| Structured CLI check | 0 | 985 selected / 9 batches / 0 failed batches / 0 diagnostics |
| Touched E2E unit tests | 0 | 47 passed / 0 failed / 0 ignored |
| Full `packages/cli/e2e/tests/` unit directory | 0 | 327 passed / 0 failed / 0 ignored |
| `arch:check` | 0 | Dependency and doctrine scans completed with 0 failures |
| `quality:gate` | 0 | Root coverage complete; 0 findings / 7 existing allowances; doctrine 0 failures |
| Source formatting and diff hygiene | 0 | 8 touched TypeScript files formatted; `git diff --check` clean |
| Lock integrity | 0 | Byte-identical to `dbb577826`; SHA-256 `6c8f90a26375dcc0cec969f01e5bfb9e474216adb10f1cfbf68df5edab6b94d6` |

No Aspire, Docker, hosted tier, browser-runtime suite, or `e2e:cli` gate was run locally. The next
hosted sqlite run will either pass on the canonical path or report which earlier island discriminator
failed plus the served document/network evidence from the refetch probe.
