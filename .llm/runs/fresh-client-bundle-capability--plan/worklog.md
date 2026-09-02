# Worklog: deterministic Fresh client-bundle capability

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fresh-client-bundle-capability--plan` |
| Branch | `test/fresh-client-bundle-capability` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- No published export changes.
- Test entry points: default Fresh package suite plus existing `test:browser` task.

### Domain Vocabulary

- **Locked Vite command** — fixture process resolved from the exact workspace alias under the root
  lock with registry access disabled.
- **Deferred boundary state ledger** — ordered unique fixture states observed inside the named
  Fresh partial.
- **Swap count** — state-ledger transitions (`states.length - 1`), not DOM mutation count.
- **Partial request evidence** — intercepted request URL/status for the configured endpoint.

### Ports

- `Deno.Command` — existing process edge for Vite fixture builds/servers.
- `playwright-cli` — existing CI-owned browser driver edge; no new dependency or abstraction.
- Playwright request routing and page evaluation — existing browser observation seams.

### Constants

- `LOCKED_VITE_PREFIX` — `run`, `--frozen`, `--cached-only`, `-A`, `vite`.
- `DEFER_BROWSER_SESSION` — stable Playwright session name for the new fixture.
- `DEFER_BOUNDARY_NAME` — stable partial/semantic boundary name shared by fixture and test.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Lock research/design and open the draft PR. | PLAN-EVAL | run-dir artifacts |
| 1 | Prove exact locked client-bundle build without test-time registry resolution. | Targeted wrapper test after deterministic install | Vite test helper, bundle test, run artifacts |
| 2 | Prove direct policy pairs plus real request/exactly-one boundary swap. | Package test + CI browser gate | Fresh tests/fixtures/task, run artifacts |
| 3 | Record final scoped gates and independent verdict. | Full gate set + IMPL-EVAL | run artifacts |

### Deferred Scope

- CLI E2E and new browser infrastructure — current package lane is sufficient.
- Route inference — coordinated separately under #1610.
- Product source fixes — none planned; any discovered need triggers rescope.

### Contributor Path

To add another Fresh browser contract, copy the fixture-app + `*_browser.ts` pattern, import the
shared locked Vite/browser test runtime, give the test a unique Playwright session, and add the file
to `test:browser`. Keep pure decisions in the default suite and reserve Playwright for behavior that
requires hydration/client navigation.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02T12:22:08Z | 0 | Research | Re-baselined both issues and current `origin/main`; #1557's missing-browser premise is superseded. |
| 2026-09-02T12:22:08Z | 0 | Determinism probe | Locked `--frozen --cached-only` Vite build passed in 3.9s from the Deno cache already prepared by installation; the empty `NPM_CONFIG_CACHE` did not enforce a cold Deno cache. |
| 2026-09-02T12:22:08Z | 0 | Browser baseline | Existing local browser task is blocked by absent `playwright-cli`; CI already provisions it. |
| 2026-09-02T12:22:08Z | 0 | Design checkpoint | Package-level real-browser design locked; PLAN-EVAL selected as a hard stop. |
| 2026-09-02T16:48:46Z | 0 | Supervisor resume | PLAN-EVAL waived for this test-only leaf; committed the plan contract unchanged as `1e54fa598`. |
| 2026-09-02T16:48:46Z | 1 | RED | Focused `deno check --unstable-kv` failed on the deliberately missing locked Vite/browser fixture modules and incomplete fixture types. |
| 2026-09-02T16:48:46Z | 1 | GREEN | Added locked `--frozen --cached-only` workspace Vite helper; targeted bundle/policy wrapper passed 10/10 from the installation-prepared Deno cache without test-time registry resolution. |
| 2026-09-02T16:48:46Z | 2 | GREEN | Added direct hit/miss policy pairs and a package Playwright fixture that intercepts the partial request, counts one semantic named-boundary swap, and plants a rejected double-swap control. |
| 2026-09-02T16:48:46Z | 3 | Local gates | Fresh check/lint/fmt, 278 package tests, and repository `quality:gate` passed; browser execution remains CI-owned because this host has no `playwright-cli`. |
| 2026-09-02T17:07:49Z | 2 | CI RED | Provisioned browser receipt passed both existing tests but timed out before the new fallback appeared; the source page lacked the matching outer Fresh partial needed for client navigation. |
| 2026-09-02T17:07:49Z | 2 | CI fix | Wrapped both fixture pages in the same `defer-navigation-page` partial; scoped check/lint/fmt and all 278 Fresh tests remain green. |
| 2026-09-02T17:27:19Z | 2 | CI RED 2 | The rerun still timed out; direct partial probing exposed HTTP 500 from the fixture's underspecified OpenTelemetry stub (`span.setAttribute` absent). |
| 2026-09-02T17:27:19Z | 2 | CI fix 2 | Reused the established locked catalog resolver for real `@opentelemetry/api`; `/deferred?fresh-partial=true` now returns 200 with both named partials and fallback. Locked client/SSR build and all scoped gates pass. |
| 2026-09-02T17:40:43Z | 3 | CI GREEN | Provisioned `fresh-browser` receipt passed all 3 tests in 40.115s, including the cache-miss request/exactly-one named-boundary regression in 13s. |
| 2026-09-02T17:57:48Z | 1 | F1 correction | Removed inert `NPM_CONFIG_CACHE` plumbing. Scoped bundle wrapper passed 1/1 in 3.972s using exact locked Vite under `--frozen --cached-only`; CI `deno install` supplies the cache, and a cold Deno cache fails loudly. Code commit `49c889897279e2079c4abbb47f7c471a4a53abce`. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Implement #1557 in this leaf | Current package browser gate can observe the full criterion without new infrastructure. | issue #1557 re-triage; current tree |
| Keep CLI E2E untouched | Its Chrome dump-DOM probe cannot execute client navigation. | issue #1557; plan D1 |
| Use lock + cached-only Vite alias | Exact dependency already exists; this removes runtime registry resolution. | issue #1601; deterministic probe |
| Require endpoint interception and semantic swap ledger | Bundle strings cannot prove a request or exactly-one behavior. | #1459 criterion; plan D3/D4 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| #1557 original premise is obsolete because browser capability landed after filing. | significant | yes |
| Local browser driver is absent although CI provisions it. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline | `git rev-parse HEAD origin/main` | PASS | Both `37452f11...`; clean except staged run dir. |
| Locked Vite probe | `deno run --frozen --cached-only -A vite build ...` after deterministic installation | PASS | Exact Vite 7.2.2 from the prewarmed Deno cache; no registry fallback at test time; cold Deno cache fails loudly. |
| Local browser baseline | `deno task --cwd packages/fresh test:browser` | FAIL (environment) | `playwright-cli` not found; product assertions did not run. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype/overlay selection | PASS | doctrine verdict + Archetype 4 + frontend overlay | Test-only slice preserves Keep verdict. |
| PLAN-EVAL | WAIVED | Supervisor resume directive | Test-only leaf; `plan.md` remains the unchanged contract. |
| Quality/doctrine | PASS | `deno task quality:gate` | Exit 0; no quality findings or doctrine failures. Existing warnings remain, with no new catalog warning after mirroring the established fixture resolver. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Focused RED | PASS | Focused `deno check --unstable-kv` | Failed before helpers existed on the intended missing-module/type boundary. |
| Targeted GREEN | PASS | `run-deno-test.ts` over bundle + defer policy tests | 10 passed, 0 failed; 4.355s. |
| F1 scoped bundle rerun | PASS | `run-deno-test.ts -- --allow-all packages/fresh/tests/defer-island-client-bundle_test.ts` | 1 passed, 0 failed; 3.972s after removing inert `NPM_CONFIG_CACHE`. |
| Fresh package test | PASS | `deno task --cwd packages/fresh test` | 278 passed, 0 failed. |
| Structured Fresh test | PASS | `run-deno-test.ts -- --allow-all packages/fresh` | 278 passed, 0 failed; 8.107s. |
| Fresh check | PASS | `run-deno-check.ts --root packages/fresh --ext ts,tsx` | 213 files, 2 batches, `deno check --unstable-kv`, zero findings. |
| Fresh lint | PASS | `run-deno-lint.ts --root packages/fresh --ext ts,tsx` | 213 files, zero findings. |
| Fresh format | PASS | `run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | 213 files, zero findings. |
| Browser navigation | BLOCKED_LOCAL | `deno task --cwd packages/fresh test:browser` | All three modules type-checked, then all three tests failed only because `playwright-cli` is absent. CI provisions the pinned driver and Chromium. |
| Browser navigation attempt 1 | FAIL_RED | CI run `33657607942`, job `100340132927` | Existing tests passed 2/2; new fixture timed out waiting for fallback because no source partial matched the destination page shell. Matching outer partial added; rerun pending. |
| Browser navigation attempt 2 | FAIL_RED | CI run `33659232209`, job `100345670859` | Existing tests passed 2/2; fixture route returned HTTP 500 because its telemetry stub did not implement the builder span. Replaced with locked catalog resolution; rerun pending. |
| Browser navigation attempt 3 | PASS | CI run `33661237994`, job `100352148188`, request `fe6e014c…` | Receipt outcome PASS, exit 0, 3 passed/0 failed; new defer regression passed in 13s. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Published Fresh surface | N/A | No export/published-source change | Tests excluded from publish. |

## Commit Receipts

| Slice | Commit | Remote receipt |
| --- | --- | --- |
| Plan | `1e54fa598b7a58d9a2155d2fb162653c646d25bf` | Explicit refspec pushed to `origin/test/fresh-client-bundle-capability`; PR #1940 opened non-draft. |
| Implementation | `e912c414d2da72711e36bbb5daa1d933c3c19d8b` | Head SHA after RED/GREEN and all local gates; explicit-refspec push receipt follows in the PR lifecycle record. |
| CI RED fix | `1e1f374a29d7edd0c9cdcd5e3e3fbb2b631f1aeb` | Head SHA after adding the matching outer navigation partial; explicit-refspec rerun push follows. |
| CI RED fix 2 | `9148054f8cc33a41c53e69a88d42ad89da8f1b84` | Head SHA after replacing the incomplete telemetry stub; explicit-refspec rerun push follows. |
| F1 code correction | `49c889897279e2079c4abbb47f7c471a4a53abce` | Removed inert npm-cache override; scoped bundle test passed 1/1 before the artifact correction commit. |

## Reconcile Notes

- Slice 0: issues #1601/#1557 remain open; PR #1940 references both until CI browser evidence exists.
  Supervisor-provided taxonomy superseded the original p2 brief: `priority:p1`, `status:impl-eval`.
- Slices 1–3: no route-inference, CLI E2E, root lock/config, workflow, dependency, or published-surface
  changes. Browser behavior cannot be claimed complete until the provisioned CI gate reports.

## Handoff Notes

- Provisioned Fresh browser CI is green. Await independent IMPL-EVAL and close-gate reconciliation;
  keep `Refs #1601 #1557` unless every close-gated acceptance item is evidenced.
