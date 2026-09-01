# Drift log — test-fresh-partial-nav-browser--1590-s2

## 2026-09-01 — tooling availability (minor)

The workspace-required `rtk` executable is absent on this worker. Focused native Git/filesystem
commands were used instead. No behavior, scope, or evidence semantics changed.

## 2026-09-01 — full export doc-lint baseline differs from locked plan (significant)

The structured full-export doc-lint reports 45 diagnostics in existing builder/query/route/streams
source. The navigation entrypoint is clean (0 private-type-ref, 0 missing-JSDoc), and this slice
does not change `packages/fresh/src/**`. The locked plan expected the package doc-lint to be clean,
but fixing these diagnostics would violate the proof-only source prohibition. No source change was
made; the supervisor must classify the baseline evidence for merge readiness.

## 2026-09-01 — browser proof files enter the JSR publish set (significant)

The locked plan states that tests/fixtures match the existing publish exclusions. The actual
`packages/fresh/deno.json` filter includes `**/*.ts`/`**/*.tsx` and does not exclude
`tests/fixtures/**` or `tests/form-navigation_browser.ts`. The raw publish dry-run lists all four new
fixture files plus the modified browser evidence file.

Changing `packages/fresh/deno.json` solely to add publish exclusions is outside the explicitly
conditional sixth slot (“only if the existing explicit browser task needs adjustment”). The browser
task already works and needs no adjustment. The implementation lane therefore did not widen scope.
Supervisor decision is required: authorize a reviewed publish-filter change/rescope, or explicitly
accept the proof files in the package publish set. This drift blocks a clean claim that the planned
JSR/published-file gate passed as written.
