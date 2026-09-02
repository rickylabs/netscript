IMPL-EVAL evidence (run 33599996142-1), added at head e4a2a8cdb12969d71a13cc7edd9a3658738a2444:

- Fresh structured check re-derived: 211 files / 2 batches / 0 diagnostics (no divergence).
- Fresh structured lint re-derived: 211 files / 0 findings. fmt re-derived: 211 files / 0 findings.
- Navigation unit tests re-run: 9 passed / 0 failed.
- Publish dry-run re-run: exit 0; stderr contains zero `_browser`, `tests/fixtures`, or
  `form-navigation` paths; only pre-existing `tests/runtime-catalog-dependencies.ts` residual
  remains (filed #1897, not charged here).
- deno.lock byte-diff vs merge-base: empty. git diff --check: clean.
- Local `deno test --allow-all packages/fresh` NOT REPRODUCED: sandbox lacks `playwright-cli`, and
  an unrelated pre-existing `defer-island-client-bundle_test.ts` Vite/Rollup
  `npm:@opentelemetry/api` resolution failure also blocks the full local suite. Environment
  limitation, not a regression.
- Hosted `fresh-browser` at merge head c72710bae (check-test job 100149154445, run 33599242516):
  FAIL with a NEW error. The barrier-arrival repair worked (no 30 s waitForResponse timeout; the
  first held request arrives and is released), but the run-code script then throws
  `ReferenceError: MutationObserver is not defined` — the Playwright-cli evaluation sandbox does
  not expose MutationObserver. Two sibling browser tests passed; the proof fails before any
  assertion evaluates (deterministic, not flaky). Hosted Vite stderr also again shows
  "Internal server error: The signal has been aborted" for a held stale response aborted at page
  close, so drain-without-overlay is still unproven in the hosted lane.
- Close-gate FAIL at head is expected: `Refs #1590` with empty closingIssuesReferences is the
  locked partial semantics; it clears only after the hosted proof is green.

Decision points 1-8 all verified: no slice-owned packages/fresh/src edit (first-parent history
touches src only via the #1904 merge, excluded by scope); 6-file ceiling honored; overlay assertion
is absence-based with cancelled == 0 at both barriers; A→B→A uses server barriers (no raised
timeout, no tuned sleeps; the sole setTimeout is the pre-existing 50 ms waitForServer startup
poll); colon-normalized marker asserted by exact string equality; publish filter drops proof files
to zero; `Refs #1590` only.

IMPL-EVAL verdict: FAIL_FIX.

# Worklog — deterministic Fresh/Vite A → B → A browser proof

## Design

- **Public surface:** none. This slice only consumes `@netscript/fresh/navigation` through a fixture.
- **Domain vocabulary:** page A/B, `region-a`/`region-b`, `old-region`/`stale-b` barriers, arrival,
  release, EOF completion, cancellation, route event, marker key, same-document sentinel.
- **Ports:** real Fresh 2.3.3/Vite server and hosted Chromium/Playwright. The local fixture exposes
  only HTTP control endpoints for deterministic barrier state.
- **Constants:** one Playwright session id, one fixture root, two page names, two region names, and
  two barrier names.
- **Commit slice:** one proof slice touching the five planned code files. The hosted `fresh-browser`
  receipt is its acceptance gate; this implementation thread leaves Tier-A sign-off and commit to
  the supervisor.
- **Deferred scope:** no product change, router, cancellation API, dependency/version change,
  workflow/classifier edit, local Chromium, Docker, Aspire, or CLI E2E.
- **Contributor path:** add fixture behavior in `app.tsx`, expose client-only observation in
  `client.ts`, and keep all browser assertions/evidence in `form-navigation_browser.ts`.

PLAN-EVAL: `PASS` in `.llm/runs/fix-fresh-partial-nav--1590/plan-eval.md` before Slice 1/2 work.

## Implementation

- Added a Fresh app with explicit stream barriers. Each held response sends headers/a prefix, then
  waits for an HTTP release endpoint or the request abort signal. State records arrivals, releases,
  EOF completions, and stream cancellations.
- Added a real Fresh/Vite `main.ts`/`vite.config.ts` and explicit client coordinator installation.
- Added a browser scenario that first proves keyed A → B → A remounts accept matching region
  updates, then overlaps an old A region and stale B page, settles final programmatic A plus its
  current region, releases both old bodies, and asserts final route/DOM/history and zero overlay,
  abort, failure, page-error, or console evidence.
- The colon-bearing marker is fetched as raw Fresh HTML and asserted as
  `frsh:partial:colon:probe:0:colon_probe`; active remount names remain colon-free per PLAN-EVAL.
- No sleep controls ordering. Server arrival/release/completion, response completion, and animation
  frames provide the synchronization points.

## Gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Scoped Fresh check | PASS | 211 files, 2 batches, 0 diagnostics |
| Scoped Fresh lint | PASS | 211 files, 0 findings |
| Scoped Fresh format | PASS | 211 files, 0 findings |
| Navigation unit tests | PASS | 8 passed, 0 failed |
| Fresh source tests | PASS | 253 passed, 0 failed |
| Fixture handler semantics | PASS | Fresh handler emitted `colon_probe`; held B stayed incomplete until explicit release, then completed once with 0 cancellations |
| `quality:gate` | PASS | quality scan and doctrine check exit 0; no new findings |
| Full export doc lint | FAIL (baseline source) | 45 existing diagnostics; `./navigation` is 0/0 and no source changed |
| JSR package audit | PASS with warnings | exit 0; cardinality warning is existing; slow-type warning is the audit script counting the raw “Checking for slow types” banner |
| Publish dry-run | PASS with drift | raw dry-run exit 0 and no slow-type warning, but lists all five proof files in the publish set |
| Hosted `fresh-browser` | PENDING | supervisor-owned; prohibited locally |
| Lock hygiene | PENDING final diff | `deno.lock` unchanged at current review |

## Reconcile

- Slice reconcile: scope still completes #1590 only after the hosted proof passes at the exact
  committed head. PR must open with `Refs #1590`; the supervisor may add `Closes #1590` only after
  that green receipt. Publish-filter drift must be adjudicated before merge readiness.

## Repair — hosted stale-response wait

- Re-baselined the cited hosted job and the installed Fresh 2.3.3 client source before editing.
  The Vite abort emitted only when the timed-out page closed proves a held request reached the
  fixture. Both Fresh link/button paths add `fresh-partial=true`; the coordinator does not strip it
  from the network request.
- Replaced stale setup's pre-release `waitForResponse` synchronization with the fixture's explicit
  `arrived` state. Response promises are still registered before activation, but are awaited only
  after both barriers are explicitly released; `Response.finished()` and server `completed === 1`
  still prove drain-to-EOF.
- Added a stale-phase trace for every Playwright request/response URL. The assertions require two
  held requests, two held responses, and `fresh-partial=true` on every held URL, so a future request
  shape mismatch fails with the complete trace in the emitted evidence.
- Kept the 30-second Playwright timeout unchanged. Overlay absence, zero request failures, zero
  cancellations, final A state, and no late B mutation remain intact.

### Repair gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Hosted failure re-baseline | PASS | Run `33591947512`, job `100127639255`; held request abort appears only when the timed-out page is closed |
| Fresh request-shape inspection | PASS | Fresh 2.3.3 `partials.ts`: links/buttons converge on `fetchPartials()`, which sets `fresh-partial=true` |
| Coordinator rewrite inspection | PASS | `withoutPartialFlag()` mutates only a copied actual/history URL; fetch input remains unchanged |
| Focused check/lint/fmt wrappers | PASS | 1 selected file, 1 batch each, 0 diagnostics/findings |
| `quality:gate` | PASS | exit 0; repository scan has no findings, doctrine gate reports only existing warnings |
| Diff/file/lock hygiene | PASS | `git diff --check` clean; browser test remains 500 lines; `deno.lock` unchanged; no `packages/fresh/src` diff |
| Hosted `fresh-browser` repair | PENDING | Supervisor-owned exact-head run; prohibited locally |

## Repair — page-context observer and deterministic pre-close drain

- Moved the post-final `MutationObserver`, its ordered heading array, and its disconnect into
  `page.evaluate`, preserving the observation window from immediately before barrier release
  through the existing double-`requestAnimationFrame` settle.
- Added an idempotent Playwright cleanup command before session close. It releases both fixture
  barriers and waits on fixture state until each barrier is released, every arrived response has
  completed to EOF, and cancellations remain zero. The full Vite stderr abort regex remains
  unchanged and is evaluated after teardown.
- Kept the proof at its 500-line ceiling. No fixture, `packages/fresh/src`, package configuration,
  timeout, sleep, assertion, or `deno.lock` change was made.

### Local gate evidence at implementation head

| Gate | Exit | Evidence |
| --- | ---: | --- |
| Scoped Fresh check | 0 | 211 files, 2 batches, 0 diagnostics |
| Scoped Fresh lint | 0 | 211 files, 2 batches, 0 findings |
| Scoped Fresh format | 0 | 211 files, 2 batches, 0 findings |
| Fresh source tests | 0 | 254 passed, 0 failed, 0 ignored |
| Local browser proof | not run | `playwright-cli` unavailable (`command -v` exit 1) |
| Diff hygiene | 0 | `git diff --check` clean; proof file exactly 500 lines |
| Lock hygiene | 0 | SHA-256 before/after `a269308a7cfd304e04377fbd9ef81d51edf629589aa741e18d367652dcdb2bcd` |

Hosted `fresh-browser` was not run in this implementation lane and remains supervisor-owned.
No unplanned drift was found; `drift.md` only records that the prior blocking harness-context
failure is repaired locally and still awaits the hosted verdict.

## Repair — hydration-safe dynamic-name remount evidence

- Supervisor-hosted run `33618955184` / job `100211358097` at `31f4ff8a1` confirmed the observer
  and pre-close drain repairs: the scenario emitted full evidence, both barriers completed once
  with zero cancellations, overlay/errors/failures were absent, and Vite stderr was empty. The
  newly reached assertion showed all three live-DOM marker reads were `null`.
- Resolved `fresh` to JSR `@fresh/core@2.3.3` with `deno info`. Installed `reviver.ts` sets
  `SHOW_MARKERS = false`, replaces server comment markers with hidden text nodes during `_walkInner`,
  converts nested partial markers into keyed `PartialComp` VNodes in `domToVNode`, and renders
  `PartialComp` as children only. Installed `partials.ts` likewise parses response markers into a
  keyed `PartialComp`. Determination: **(a)** — nested partial markers are parser artifacts consumed
  by hydration/application, so walking the hydrated live DOM was an invalid observation.
- Replaced the live-DOM marker walk with bodies from the page's actual initial-A, B-mount, and
  A-mount responses. The exact marker assertion remains A→B→A and proves the server encoded each
  native key by dynamic name.
- Added a live behavior check: a non-attribute expando tags `#region-content` immediately before
  each name change. Both subsequent nodes must lack that tag. Ordinary reconciliation of the same
  DOM node preserves an expando; losing it proves that A→B and B→A each replaced/remounted the
  region node. B is re-tagged after its same-name update so the second comparison isolates B→A.
- The proven heading observer and pre-close drain code were not changed. The proof remains exactly
  500 lines; no source, fixture, package-config, timeout, sleep, or lock change was made.

### Local gate evidence for hydration-safe marker repair

| Gate | Exit | Evidence |
| --- | ---: | --- |
| Resolved Fresh source inspection | 0 | `@fresh/core@2.3.3`; `reviver.ts`/`partials.ts` consumption path measured |
| Fixture response-marker probe | 0 | 3 responses status 200; markers exactly region-a, region-b, region-a |
| Scoped Fresh check | 0 | 211 files, 2 batches, 0 diagnostics |
| Scoped Fresh lint | 0 | 211 files, 2 batches, 0 findings |
| Scoped Fresh format | 0 | 211 files, 2 batches, 0 findings |
| Fresh source tests | 0 | 254 passed, 0 failed, 0 ignored |
| `quality:gate` | 0 | quality scan 0 findings; doctrine check 0 failures (existing warnings only) |
| Local browser proof | not run | `playwright-cli` unavailable (`command -v` exit 1) |
| Hosted browser proof | not run here | Supervisor owns the next exact-head run |
| Diff/file hygiene | 0 | `git diff --check` clean; proof exactly 500 lines |
| Lock hygiene | 0 | SHA-256 remains `a269308a7cfd304e04377fbd9ef81d51edf629589aa741e18d367652dcdb2bcd` |

Reconcile: Slice 2 remains proof-only and `Refs #1590` until the supervisor's new hosted run proves
the changed observation at the exact pushed head. No product issue is indicated by this finding.

## 2026-09-03 — convergence onto origin/main

- Began clean at `d0bf0aebfb1dc8ccd475b240462862530505e732` and merged the fetched
  `origin/main`. The sole content conflict was
  `packages/fresh/tests/form-navigation_browser.ts`.
- Preserved all three browser scenarios and every assertion from both parents. Main's ordinary
  form-navigation and generated Form-C fixtures now use its shared `reservePort`, `runPlaywright`,
  `startLockedVite`, `stopVite`, and `waitForServer` helpers. The Slice 2 barrier-drain helper and
  piped Vite stdout/stderr evidence remain. The piped launcher now delegates to main's
  `createLockedViteCommand`, retaining capture while honoring #1940's frozen/cached-only Vite
  capability lock. #1856 introduced no runtime type adaptation for this proof.
- Reset 78 generated paths (`*.generated.ts`, `.agents/generated/**`, and the Aspire surface
  manifest) to `origin/main`, then regenerated the MCP export corpus and Aspire manifest. The
  generated outputs match `origin/main` exactly.
- The prescribed bare `deno task gen:mcp-export-corpus` exited 1 because #1867's clean-tree guard
  classifies the merge's staged package/plugin changes as dirty. Its explicit supported recovery,
  `deno task gen:mcp-export-corpus --allow-dirty`, exited 0; the subsequent check gate independently
  passed and the generated corpus remained identical to main.

### Convergence gate evidence

| Gate | Exit | Evidence |
| --- | ---: | --- |
| Fresh structured check | 0 | 217 files, 2 batches, 0 diagnostics |
| Fresh unit task | 0 | 280 passed, 0 failed |
| `check:mcp-export-corpus` | 0 | 35 packages, 273 subpaths, 7,841 symbols; hash `284917fc...` |
| `check:assets-barrel` | 0 | regeneration produced no diff |
| `check:publish-assets` | 0 | generated publish assets current |
| `check:aspire-version-parity` | 0 | 908 checked, 0 failed, 0 missing; manifest fresh |
| `docs:readme-fences` | 0 | 36 READMEs, 168 fences, 73 TS-like checked |
| `arch:check` | 0 | dependency checks and doctrine scan completed with 0 failures |
| `quality:scan` | 0 | 0 findings; 7 existing allowances |
| Browser task | not run | `playwright-cli` unavailable (`command -v` exit 1); hosted `fresh-browser` is durable |
| Lock hygiene | 0 | worktree lock equals `origin/main`, SHA-256 `6c8f90a26375dcc0cec969f01e5bfb9e474216adb10f1cfbf68df5edab6b94d6` |

- Post-commit `git diff d0bf0aebf HEAD -- packages | grep -v generated` exited 0. Of its
  non-generated paths, 165 non-conflict/non-`deno.json` trees match `origin/main` exactly; the
  `packages/fresh/deno.json` first-parent patch has the same stable patch-id as #1940, and the only
  authored resolution is `form-navigation_browser.ts`.
- Conflict-marker grep and `git diff --check` both exited 0. The three browser test names remain
  present. The pre-merge lock SHA was `e52c167e...`; the merge inherited main's `6c8f90a2...`, and
  generators/gates introduced no further lock delta.

Reconcile: this is a convergence-only merge after the recorded IMPL-EVAL PASS. No feature scope or
assertion changed; CI must re-establish the hosted `fresh-browser` verdict at the pushed merge SHA.
