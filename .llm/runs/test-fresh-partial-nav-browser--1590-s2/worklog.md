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
