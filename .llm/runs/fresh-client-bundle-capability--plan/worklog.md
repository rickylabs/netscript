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
| PLAN-EVAL | NOT_RUN | Separate Fable session pending | Hard stop before implementation. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Browser navigation | NOT_RUN | CI driver required | Will run after draft is ready. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Published Fresh surface | N/A | No export/published-source change | Tests excluded from publish. |

## Reconcile Notes

- Slice 0: issues #1601/#1557 remain open; draft PR will reference both until evidence establishes
  which closing keywords are truthful. No status/milestone drift detected (`0.0.7`, p2, Fresh).

## Handoff Notes

- PLAN-EVAL should first challenge whether the proposed observer proves exactly one semantic named
  boundary transition and whether `--cached-only` is appropriate in the default package suite.
