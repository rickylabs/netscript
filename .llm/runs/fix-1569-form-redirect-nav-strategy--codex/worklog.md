# Worklog: managed form redirect navigation strategy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1569-form-redirect-nav-strategy--codex` |
| Branch | `fix/1569-form-redirect-nav-strategy` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- `FormNavigationMode = 'client' | 'document'` — stable caller vocabulary.
- `FormNavigationStrategy` — immutable strategy object with `navigation`.
- `FormProps.strategy` and `FormEnhancementOptions.strategy` — one vocabulary for managed render
  and progressive enhancement.
- Existing `FormEnhancementOptions.clientNav` remains as a compatibility input.

### Domain Vocabulary

- `client` — Fresh handles the form request/revival.
- `document` — the browser performs document navigation; maps to literal Fresh opt-out.

### Ports

- None. Fresh/Preact are existing framework dependencies, not new replaceable collaborators.

### Constants

- No exported constant group: the two finite values are represented by the public string union.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Typed navigation contract, resolver, managed Form integration, docs, SSR/state/browser tests | focused red/green tests, requested package gates, browser run, quality/JSR gates | `application/form/**`, `packages/fresh/tests/**`, `packages/fresh/deno.json`, this run dir |

### Deferred Scope

- Redirect-response protocol changes — unnecessary unless the real-browser proof shows static
  strategy cannot meet the issue contract.
- Upstream Fresh changes — out of scope for a NetScript abstraction fix.

### Contributor Path

Add future managed-form policy fields to `FormNavigationStrategy`, resolve them in
`components/enhancement.tsx`, consume that resolver in `Form`, then extend the colocated SSR and
browser contract tests.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-12 | bootstrap | research/design | Re-baselined mechanism; recorded actual Preact vs Fresh SSR behavior. |
| 2026-08-12 | 1 | red | Named SSR contract failed because `strategy` leaked to markup instead of resolving to `f-client-nav="false"`. |
| 2026-08-12 | 1 | implement | Added public navigation vocabulary, one resolver seam, Form integration, compatibility bridge, docs, and browser fixture. |
| 2026-08-12 | 1 | browser mutation | Mapping `document` to `true` made the browser test fail after 30s with actual `true`, expected `false`; restored the resolver. |
| 2026-08-12 | 1 | green | All requested gates passed; real Fresh/Vite/Chromium test passed with inherited body client navigation. |
| 2026-08-12 | review follow-up | CI discovery | Reviewer found that the explicit browser task had no automatic invoker because its filename intentionally stayed outside Deno discovery. |
| 2026-08-12 | review follow-up | CI wiring | Chose Option 1: the required `check-test` CI lane now installs the pinned Playwright CLI + matching Chromium and invokes the package `test:browser` task explicitly. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Strategy object with navigation union | Caller intent, not transport syntax | doctrine A1/A2/A11; issue #1569 |
| Literal false mapping | Renderer-independent and reviver-exact | Fresh 2.3.3 primary source |
| PLAN-EVAL N/A | Small bounded fix; owner prohibits local evaluation | run-loop §4; slice brief |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Boolean false is sufficient in actual Fresh SSR, contrary to the unqualified issue premise | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS | 192 files; 2 batches; 0 findings. |
| Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx` | PASS | 192 files; 0 findings. Initial `no-unsafe-finally` finding in the new browser cleanup was fixed before the final run. |
| Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | PASS | 192 files; 0 findings. |
| Package tests | `deno task --cwd packages/fresh test --reporter=dot` | PASS | `ok | 231 passed | 0 failed (31s)` |
| Quality gate | `deno task quality:gate` | PASS | Exit 0. Existing warnings remain in untouched code, including forbidden sibling-owned Fresh paths. |
| Publish dry run | `deno task --cwd packages/fresh publish:dry-run` | PASS | `Success Dry run complete` |
| Documentation lint | `deno task doc:lint --root packages/fresh --pretty` | BASELINE PASS | Wrapper exits 0; form entrypoint has 0 findings. Package baseline is 44 findings in route/query/streams, outside this slice. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Explicit Fresh target quality scan | PASS | `deno task quality:scan --root packages/fresh/src --pretty` | `ok: true`, `findings: []`; one existing allowance in `application/builders/**`, which this slice did not touch. This is the package verdict; root `arch:check` alone is not. |
| Public-surface publish simulation | PASS | package `publish:dry-run` | Public form entrypoint and package export graph check successfully. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Real-browser form redirect | PASS | `deno task --cwd packages/fresh test:browser --fail-fast` | `browser: document form redirect beats inherited body client nav without runtime errors ... ok (26s)`; zero captured page/runtime errors. |
| Browser mutation sensitivity | RED as expected | same test with resolver temporarily mapped to `true` | Failed after 30s: actual `true`, expected `false`; implementation restored and green rerun completed. |
| Browser regression CI wiring | PASS / WIRED | `.github/workflows/ci.yml`, required `check-test` job | Installs `@playwright/cli@0.1.17` in runner temp, exposes its local bin through `GITHUB_PATH`, provisions the package's matching Chromium revision, then runs `deno task --cwd packages/fresh test:browser`. Exact local invocation: `ok | 1 passed | 0 failed (15s)`. The test stays outside ordinary Deno discovery so package tests do not acquire an undeclared machine-global browser prerequisite. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `@netscript/fresh/form` | PASS | named SSR/resolver/collection tests plus package check/publish dry run | Default emits no local override; document emits literal `false`; public types export cleanly. |

## Named Test Evidence

- `Form document navigation strategy renders the literal Fresh opt-out`
- `Form default navigation strategy preserves inherited client navigation`
- `resolveFormNavigationProps maps typed client and document strategies`
- `applyCollectionStrategy accepts the shared document navigation policy`
- `browser: document form redirect beats inherited body client nav without runtime errors`

Focused document red (before implementation):

```text
Form document navigation strategy renders the literal Fresh opt-out ... FAILED (8ms)
AssertionError: Expected document strategy to render the literal Fresh opt-out in <form ... strategy="[object Object]">...
FAILED | 0 passed | 1 failed | 56 filtered out (2s)
error: Test failed
```

Browser mutation red:

```text
browser: document form redirect beats inherited body client nav without runtime errors ... FAILED (30s)
AssertionError: Values are not equal.
-   true
+   false
FAILED | 0 passed | 1 failed (30s)
error: Test failed
```

## Handoff Notes

- Automatic evaluation is required later and is orchestrator-owned; this session will not launch it.
- PR `#1600` remains draft with `status:impl`; no ready-state, merge, canary, OpenHands, or local
  evaluator action was taken.
- Review finding resolution: Option 1 selected. The browser assertion is now part of the required
  CI `check-test` lane when that lane executes; it is no longer manual-only coverage.
- `deno.lock` remains unchanged; no dependency was added to the Deno workspace.
- Workflow syntax lint was not available locally (`actionlint: not installed`); the edited YAML is a
  two-step extension of the existing `check-test` step list. GitHub execution is intentionally not
  forced while the PR remains draft.
