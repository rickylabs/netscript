# Research: published workers-api duplicate dependency-age flag

The carried diagnosis was re-baselined against the branch. In
`prepare-flow-b-fixture.ts`, published mode replaces the full `deno run` prefix and injects
`--minimum-dependency-age=0`. A beta.7 generated workers block can already contain that argument
after its config pair, producing two occurrences. The e2e test layer has no focused fixture-rewrite
test today.

Scope is internal e2e fixture preparation only. No public/export-map or product scaffold surface
changes, so JSR audit and architecture debt are N/A.

