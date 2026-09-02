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
