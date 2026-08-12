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
| Requested gates | pending | NOT_RUN | Implementation not started. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype 4 set | NOT_RUN | pending | Explicit target quality scan required because root arch coverage is not the package verdict requested by the owner. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Real-browser form redirect | NOT_RUN | pending | Must use Fresh runtime under ancestor opt-in. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `@netscript/fresh/form` | NOT_RUN | pending | SSR and type contract tests planned. |

## Handoff Notes

- Automatic evaluation is required later and is orchestrator-owned; this session will not launch it.

