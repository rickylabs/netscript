# docs-accuracy — beta.12 grouped fix

Issues: #965, #971, #972
Branch: `docs/accuracy-and-discoverability`
Milestone: 0.0.1-beta.12
Lane: light_implementation (Codex · OpenAI · gpt-5.6-sol · low)

## The three issues

- **#965** — `defineSaga` is documented as taking an object (`{ name, initialState, handler }`)
  but implemented as a fluent builder (`defineSaga(id).durability().state().on().build()`).
  Documented snippets do not compile.
- **#971** — task-oriented pages surface the general-purpose construction ahead of the
  first-class helper, so readers write the clumsy version. Four independent agent reviews used
  none of `withResource`, `useLiveQuery`, `ui:add`, `cloud-run`, `@netscript/sdk/collections`,
  `query-client`, the cache engine, or the Scalar/OpenAPI surface.
- **#972** — no compact map of what each CLI command mutates and what it regenerates; blast
  radius requires source reading.

## Shared-cause hypothesis

All three are the same defect at different altitudes: **the documentation is written from what a
reader already knows rather than from what the framework actually exposes.** #965 is drift between
a documented signature and the implemented one; #971 is drift between the documented path and the
first-class path; #972 is an absent mapping between a command and the declarations/artefacts it
touches. The root fix is a mechanism that keeps documented surface tied to real exports — a doc
test that type-checks documented snippets, a preferred-path convention on task pages, and a
generated command→artefact map — not three independent edits.

## Why this gates round two

Until these land, round two of the agent experiment measures the documentation a second time
instead of measuring the framework.

## Implementation state — 2026-07-31

- Added a preferred-path table to the cross-area recipe index.
- Added a compact CLI source-of-truth → generated-artifacts → runtime-consumers map with explicit
  preview support.
- Added `deno task docs:accuracy`, which checks the saga function contract, forbids the stale
  object form in public saga pages, requires all eight first-class routes, and requires eighteen
  mutating CLI families in the map.
- Fails-before observed, then all focused gates passed.
- Pending: separate-session IMPL-EVAL, commit/push verification, PR reconciliation.
