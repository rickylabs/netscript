# Context Pack: explicit UI scaffold query-client selection

## Run Metadata

| Field         | Value                                      |
| ------------- | ------------------------------------------ |
| Run ID        | `feat-app-service-client-wiring--1664`     |
| Branch        | `feat/app-service-client-wiring`           |
| Current phase | `bounded follow-up handoff`                 |
| Baseline      | `270c31d4d6e9bab24597ac8fe077227d5e98dcc7` |
| Archetype     | `6 - CLI / Tooling`                        |
| Scope overlay | `frontend`                                 |

## Current State

The earlier selector work and stale-expectation follow-up are complete. The current bounded slice
instruments the hosted browser probe at both the initial-row and optimistic-row assertions. It adds a
timeout-only structured JSON payload for DOM state, hydration/interactivity, browser QueryClient
state, cache events, and in-browser `onMutate` proof. No template, carrier, `packages/fresh`, or
`packages/sdk` file has changed; the hosted result must name the measured cause before any fix is
considered.

## Completed

- Required harness, CLI, doctrine, tools, and Archetype-6 references read.
- Current resolver, CLI input/flag mapping, unit tests, and E2E fixture sequence inspected.
- Lock baseline recorded: `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.
- Design checkpoint recorded in `worklog.md`; `PLAN-EVAL: N/A` justified there.
- Selector implementation and distinct error coverage completed within the six approved TypeScript
  files.
- Focused tests, CLI package tests, structured static gates, fitness gates, diff hygiene, and lock
  integrity all passed; exact evidence is recorded in `worklog.md`.
- Follow-up named tests pass independently: 1 passed / 0 failed each.
- Follow-up repo-wide test result is 4,513 passed / 2 failed / 19 ignored; both failures are the
  expected sandbox-only browser executable spawn permission cases.
- Follow-up scoped receipts are non-empty: check/lint/fmt `stdout.bytes=303/349/298`.

## In Progress

- Create and push the one instrumentation commit, then read the hosted `scaffold-runtime` evidence.

## Next Steps

1. Create one commit containing the browser probe and these two run artifacts.
2. Push `HEAD:refs/heads/feat/app-service-client-wiring` explicitly.
3. Read the hosted `e2e-cli` / `scaffold-runtime` failure payload and post the measured cause to the
   PR.
4. Change the two showcase island templates, optimistic helper, and regenerated carrier only if the
   measurement identifies one of those files; otherwise stop at the Fresh/provider rescope boundary.

## Key Decisions

| Decision                               | Source             | Notes                                                                            |
| -------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| Keep fail-closed ambiguity             | Coordinator ruling | No auto-pick with multiple candidates                                            |
| Match module-declared service identity | Coordinator ruling | Filenames are deliberately ignored                                               |
| Preserve one-candidate discovery       | Coordinator ruling | Existing default path remains unchanged                                          |
| Pass `users` in the E2E gate           | Fixture evidence   | Init and browser behavior use `users`; `payments` proves the second-service case |

## Files Changed

| Path                                                             | Status | Notes                      |
| ---------------------------------------------------------------- | ------ | -------------------------- |
| `.llm/runs/feat-app-service-client-wiring--1664/worklog.md`      | new    | Design and evidence ledger |
| `.llm/runs/feat-app-service-client-wiring--1664/context-pack.md` | new    | Resumable state            |
| `packages/cli/src/kernel/application/ui/web-scaffold.ts` | modified | Service-identity selection and errors |
| `packages/cli/src/kernel/application/ui/web-scaffold_test.ts` | modified | Resolver behavior coverage |
| `packages/cli/src/public/features/ui/add/add-ui-input.ts` | modified | Optional client input |
| `packages/cli/src/public/features/ui/add/add-ui-command.ts` | modified | CLI flag and forwarding |
| `packages/cli/src/public/features/ui/add/add-ui-command_test.ts` | modified | Command-surface coverage |
| `packages/cli/e2e/src/application/gates/scaffold/ui-data-screen-gates.ts` | modified | Explicit `users` selection |

### Current bounded follow-up

| Path | Status | Notes |
| --- | --- | --- |
| `packages/cli/src/public/features/ui/add/add-ui-command_test.ts` | modified | Exact rendered `--client` option-line contract |
| `packages/cli/e2e/tests/presentation/suite-registry_test.ts` | modified | Corrected service-suite gate expectation |
| `.llm/runs/feat-app-service-client-wiring--1664/{worklog.md,context-pack.md}` | modified | Follow-up evidence and handoff |
| `.llm/runs/feat-app-service-client-wiring--1664/receipts/{check,lint,fmt-check,test}.json` | refreshed | Durable scoped and repo-wide evidence |

### Hosted optimistic-render instrumentation

| Path | Status | Notes |
| --- | --- | --- |
| `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts` | modified | Timeout-only bounded CDP/QueryCache evidence |
| `.llm/runs/feat-app-service-client-wiring--1664/{worklog.md,context-pack.md}` | modified | Design, gates, and hosted handoff |

## Gates

| Gate family            | Current status | Evidence                                    |
| ---------------------- | -------------- | ------------------------------------------- |
| Focused tests          | passed | 20 passed, 0 failed |
| Scoped static wrappers | passed | check/lint/fmt stdout bytes: 303/349/298 |
| Package tests          | passed | 1,208 passed, 0 failed, 0 ignored |
| Fitness                | passed | `quality:gate` exited 0 |
| Consumer               | bounded update complete | `--client users` added; order unchanged; full runtime suite not run |

### Follow-up gate delta

| Gate | Result |
| --- | --- |
| Named stale tests | PASS — 1/0 each |
| Repo-wide tests | EXPECTED SANDBOX RED — 4,513 passed / 2 failed / 19 ignored; only the two browser-spawn permission cases remain |
| Scoped check/lint/fmt | PASS — non-empty `stdout.bytes=303/349/298` |
| Lock integrity | PASS — SHA-256 remains `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |

Hosted attempt 1 ran the PostgreSQL suite to 71 passed / 1 failed but timed out on the initial Rename
row before the first instrumentation placement, so it emitted no structured marker. The one commit
is being amended to install immediately after page load and diagnose both row assertions.

### Instrumentation gate delta

| Gate | Result |
| --- | --- |
| Focused source-contract test | PASS — 1 passed / 0 failed |
| Full focused module test | EXPECTED SANDBOX RED — 23 passed / 2 failed; only the known executable permission cases |
| Scoped check/lint/fmt | PASS — non-empty `stdout.bytes=303/349/298` |
| Quality/architecture | PASS — `quality:gate` exited 0 |
| Lock integrity | PASS — SHA-256 remains `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |

## Open Questions

The hosted payload must decide the cause. Any result pointing at Fresh island hydration or the query
provider is a rescope stop; inferred causes are not accepted.

## 2026-09-02 convergence handoff

Current `main` `77ad823dcb1874ccfc8964b4679ad92a3a145e0b` is merged into the evaluated
`377811da8` head. The generated MCP carrier was resolved from `main` and regenerated; the
non-generated `packages/fresh/deno.json` conflict preserves both `main`'s navigation surface and the
branch's query-hydration browser-test registration. Of 57 branch-touched non-generated package
files, 51 are byte-identical and six moved solely through intervening `main` commits. Therefore the
old formal PASS does not carry wholesale and the converged head requires fresh evaluation. No
runtime/browser/E2E gate is run in this convergence slice.

Post-merge carrier checks, package checks, Fresh/SDK lint+fmt, focused tests (CLI 106, Fresh 12, SDK
2), and `quality:gate` are green. The exact CLI lint/fmt wrapper commands remain red with exit 2
because root configuration excludes the CLI package; a clean `origin/main` worktree reproduces the
same zero-finding coverage refusal. Fresh partial-navigation commits `102ef8a10` and `556690a99`
are opt-in coordinator/transport changes and do not touch the byte-identical query provider,
showcase island, query hooks, or optimistic helper, so they are not a plausible render-propagation
repair.

## Drift and Debt

- Drift: the named help test was already green at the follow-up baseline because it loosely checked
  the flag and description separately; the expectation was tightened to the complete rendered
  option line as requested. No scope expansion resulted.
- Debt: no new or deepened doctrine debt identified.

## Commits

- See the PR commit list and the per-slice evidence comment after push.

## 2026-09-02 width-stable help-test follow-up

The sole branch-owned converged-head failure was confirmed as Cliffy help wrapping. `COLUMNS=40`
does not affect Cliffy because it reads `Deno.consoleSize()`, but an explicit 40-column render
reproduced exit 1 and showed sub-word splits in the complete `--client` description. The test now
renders at a deterministic wrapped width of 80, disables colors, and normalizes whitespace on both
the actual and complete expected strings through one helper used by every sibling help assertion.

Required evidence is green: exact `ui/add` wrapper 7/0/0, full package-owned CLI suite 1,246/0/0,
structured CLI check 930 files / 8 batches / 0 failures, and `quality:gate` exit 0. `deno.lock`
remains unchanged with SHA-256
`e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`. No runtime, browser,
Aspire, Docker, E2E, or scaffold-runtime lane was run.

## 2026-09-02 Fresh query-fixture startup follow-up

Clearing the CLI help failure exposed the branch-added query-hydration browser fixture for its first
CI execution. Hosted run `33625391122` reached the generic timeout, not the child-exit branch; under
the old 100 × 50 ms implementation that proves the Vite process stayed alive through an
approximately five-second budget. The distinct form-navigation fixture did not warm this Vite root.

The query fixture now uses a 60-second monotonic deadline with 100 ms polling and deadline-bounded
fetches. Its Vite stdout/stderr are continuously drained into 16 KiB tail buffers and labeled in
both timeout and early-exit errors. `packages/fresh/src` and the #1895 form-navigation surface remain
untouched.

Required local evidence is green: Fresh check 211 files / 2 batches / 0 failures and package tests
276/0/0. Supplemental Fresh lint/fmt and `quality:gate` also exit 0. The package wrapper does not
select `_browser.ts`; local Chromium exists but `playwright-cli` does not, so no browser verdict is
claimed and `test:browser` was not run. `deno.lock` remains byte-identical with SHA-256
`e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.

## 2026-09-02 query catalog bridge and explicit hydration evidence

At converged baseline `1dd976024` (main `37452f11f`), the improved timeout exposed Vite's actual
failure: the query fixture graph reaches `packages/telemetry/src/context/w3c.ts`, whose bare
`@opentelemetry/api` import was unresolved. The query fixture now mirrors the route-binding
fixture's post-enforced catalog virtual-module pattern for that specifier only. An exact Vite launch
returned HTTP 200 with the expected markup and empty stderr; no `zod`/`catalog:` shim was needed.

The fixture's `QueryIsland` now renders query-client reachability and a button-driven interaction
counter. Before the unchanged old/fresh snapshot-age assertions, the browser test names and asserts
`freshIslandElement === "fresh-island"`, `queryClientFound === true`, `islandHydrated === true`,
and `islandInteractive === true` in both modes. It emits those observed values under the structured
`query-hydration-evidence:` marker.

Local Fresh check/test/lint/fmt and `quality:gate` are green; package tests report 276/0/0 and the
lock SHA-256 remains `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`.
The local browser task was attempted but could not launch: the CI-pinned CLI found neither branded
Chrome nor Chromium's `libnspr4.so`, yielding 0 passed / 3 failed before page navigation. Exact-head
CI must therefore provide the decisive hydration values; no local pass is claimed.

The first exact-head CI observation at branch commit `7f99cbeff` proved query-client access, the
client effect, and button-driven state change in both modes, but exposed that the initial island
marker probe assumed a `<fresh-island>` wrapper. The measured fixture response uses Fresh 2's
comment boundary `frsh:island:app:0:`. The proof now asserts that exact boundary plus the three
already-true client measurements; a second exact-head CI run is required for the final verdict.
