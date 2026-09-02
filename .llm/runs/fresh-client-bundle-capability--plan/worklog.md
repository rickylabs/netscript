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
| 1 | Prove deterministic locked client-bundle build. | Targeted wrapper test/cold npm cache | Vite test helper, bundle test, run artifacts |
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
| 2026-09-02T12:22:08Z | 0 | Determinism probe | Locked `--frozen --cached-only` Vite build passed with an empty `NPM_CONFIG_CACHE` in 3.9s. |
| 2026-09-02T12:22:08Z | 0 | Browser baseline | Existing local browser task is blocked by absent `playwright-cli`; CI already provisions it. |
| 2026-09-02T12:22:08Z | 0 | Design checkpoint | Package-level real-browser design locked; PLAN-EVAL selected as a hard stop. |
| 2026-09-02T16:48:46Z | 0 | Supervisor resume | PLAN-EVAL waived for this test-only leaf; committed the plan contract unchanged as `1e54fa598`. |
| 2026-09-02T16:48:46Z | 1 | RED | Focused `deno check --unstable-kv` failed on the deliberately missing locked Vite/browser fixture modules and incomplete fixture types. |
| 2026-09-02T16:48:46Z | 1 | GREEN | Added locked `--frozen --cached-only` workspace Vite helper; targeted bundle/policy wrapper passed 10/10 with a fresh empty npm cache. |
| 2026-09-02T16:48:46Z | 2 | GREEN | Added direct hit/miss policy pairs and a package Playwright fixture that intercepts the partial request, counts one semantic named-boundary swap, and plants a rejected double-swap control. |
| 2026-09-02T16:48:46Z | 3 | Local gates | Fresh check/lint/fmt, 278 package tests, and repository `quality:gate` passed; browser execution remains CI-owned because this host has no `playwright-cli`. |
| 2026-09-02T17:07:49Z | 2 | CI RED | Provisioned browser receipt passed both existing tests but timed out before the new fallback appeared; the source page lacked the matching outer Fresh partial needed for client navigation. |
| 2026-09-02T17:07:49Z | 2 | CI fix | Wrapped both fixture pages in the same `defer-navigation-page` partial; scoped check/lint/fmt and all 278 Fresh tests remain green. |

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
| Locked Vite probe | `deno run --frozen --cached-only -A vite build ...` with empty npm cache | PASS | Vite 7.2.2; 45 client/188 SSR modules. |
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
| Fresh package test | PASS | `deno task --cwd packages/fresh test` | 278 passed, 0 failed. |
| Structured Fresh test | PASS | `run-deno-test.ts -- --allow-all packages/fresh` | 278 passed, 0 failed; 8.107s. |
| Fresh check | PASS | `run-deno-check.ts --root packages/fresh --ext ts,tsx` | 213 files, 2 batches, `deno check --unstable-kv`, zero findings. |
| Fresh lint | PASS | `run-deno-lint.ts --root packages/fresh --ext ts,tsx` | 213 files, zero findings. |
| Fresh format | PASS | `run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | 213 files, zero findings. |
| Browser navigation | BLOCKED_LOCAL | `deno task --cwd packages/fresh test:browser` | All three modules type-checked, then all three tests failed only because `playwright-cli` is absent. CI provisions the pinned driver and Chromium. |
| Browser navigation attempt 1 | FAIL_RED | CI run `33657607942`, job `100340132927` | Existing tests passed 2/2; new fixture timed out waiting for fallback because no source partial matched the destination page shell. Matching outer partial added; rerun pending. |

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

## Reconcile Notes

- Slice 0: issues #1601/#1557 remain open; PR #1940 references both until CI browser evidence exists.
  Supervisor-provided taxonomy superseded the original p2 brief: `priority:p1`, `status:impl-eval`.
- Slices 1–3: no route-inference, CLI E2E, root lock/config, workflow, dependency, or published-surface
  changes. Browser behavior cannot be claimed complete until the provisioned CI gate reports.

## Handoff Notes

- Await the provisioned Fresh browser CI receipt and independent IMPL-EVAL. Keep `Refs #1601 #1557`
  unless every close-gated acceptance item is evidenced.
