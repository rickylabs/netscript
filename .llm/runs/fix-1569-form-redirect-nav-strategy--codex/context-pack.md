# Context Pack: managed form redirect navigation strategy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1569-form-redirect-nav-strategy--codex` |
| Branch | `fix/1569-form-redirect-nav-strategy` |
| Current phase | `impl complete; automatic evaluation pending` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Implementation and the review follow-up are complete. Draft PR `#1600` remains intentionally draft
at `status:impl`; the real-browser assertion is now wired into the required CI `check-test` lane.

## Completed

- Read requested skills, harness workflow, Archetype 4, frontend overlay, doctrine, JSR audit, PR
  rules, and Playwright CLI guidance.
- Verified plain Preact omits boolean false while real Fresh SSR emits the literal string false.
- Located Fresh client lookup at `@fresh/core@2.3.3/src/runtime/client/partials.ts:41-45`.
- Selected public `{ navigation: 'client' | 'document' }` strategy.
- Added the public strategy, resolver, managed Form integration, compatibility bridge, and docs.
- Added SSR/resolver/collection coverage and a real Fresh/Vite/Chromium browser test.
- Proved validation errors preserve the page-global sentinel under inherited client navigation.
- Proved successful document-strategy POST redirects replace the document without reviver errors.
- Passed check, lint, format, 231 package tests, browser test, quality gate, explicit Fresh target
  scan, publish dry run, and the repository doc-lint wrapper.
- Closed the review discovery gap with Option 1: CI installs the pinned Playwright CLI in runner
  temp, provisions its matching Chromium revision, then explicitly invokes
  `deno task --cwd packages/fresh test:browser`.
- Confirmed `deno.lock` remains unchanged because the CI-only runtime install adds no Deno workspace
  dependency.

## In Progress

- Automatic label-driven evaluation, owned by the orchestrator.

## Next Steps

1. Leave the draft PR for the orchestrator-owned automatic evaluation lifecycle.
2. Do not launch an evaluator locally or transition the PR out of draft from this lane.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Literal false transport mapping | Fresh reviver + SSR hooks | Actual Fresh accepts boolean false, but literal output is robust outside its SSR hook too. |
| Default omission | existing behavior | Preserves inherited body opt-in. |
| No local evaluation | owner directive | Automatic lifecycle only. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/fresh/src/application/form/**` | modified | Public strategy, resolver, Form integration, docs, tests. |
| `packages/fresh/tests/form-navigation_browser.ts` | new | Real-browser contract test. |
| `packages/fresh/tests/fixtures/form-navigation-browser/**` | new | Fresh/Vite fixture with inherited body client navigation. |
| `packages/fresh/deno.json` | modified | Explicit browser-test task. |
| `.github/workflows/ci.yml` | modified | Required `check-test` lane provisions Chromium and invokes the explicit browser task. |
| `.llm/runs/fix-1569-form-redirect-nav-strategy--codex/*` | modified | Harness evidence and handoff. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pass | 192-file check/lint/fmt; package tests 231/231 |
| Fitness | pass | quality gate exit 0; explicit Fresh scan has no findings |
| Runtime/browser | pass + CI-wired | real Fresh/Vite/Chromium: 1 passed, 0 failed; required `check-test` invocation added |
| Consumer | pass | named SSR contracts, exported type check, publish dry run |

## Open Questions

- Separate-session automatic evaluation has not yet run; owner explicitly reserves it to the
  orchestrator.

## Drift and Debt

- Drift: actual Fresh SSR makes boolean false sufficient; issue wording was plain-Preact-specific.
- Debt: none created.
- Baseline: doc lint reports 44 existing package findings, but the form entrypoint reports zero.

## Commits

- See the draft PR's commit list + per-slice PR comments.
- `a7d470509` — harness bootstrap.
