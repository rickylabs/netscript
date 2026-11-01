# Plan & Design — READY FOR REVIEW

Feature tier, dispatcher leaf profile. Tools-side generation/import/publication flow; Archetype 6 concerns, no published package.

## Locked decisions

1. Reuse public component/registry types and code-owned token identity validation. The tool takes a complete input snapshot and derives inventory; no component spec fork. An identity-only alias table handles established differing names. Unknown visual registry items fail, unmatched contracts are reported as deferred.
2. Generate deterministic structural component sets (anatomy, scoped data-attribute axes, full Cartesian variants, token-role binding nodes), and HTML Code Connect source. Visual restyling stays S6. Preserve complete contract metadata without asserting planned values are implemented in Utility.
3. Validate complete inputs and generated bundle before filesystem effects or native import. Import uses an isolated owned page, preflight native variable identities, rollback on runtime failure and inspect native structure/bindings on export. Never edit existing designed libraries.
4. Node URLs come from a real import receipt; source generation refuses fabricated/missing/duplicate node identities. Publishing is an explicit documented owner command, never automatic.
5. Independent read-only owner-selected Claude Opus 5.5/high performs PLAN-EVAL and IMPL-EVAL in separate sessions, with same-session resume across each pass's rounds. No inference from mock tests to live editor acceptance.

## Slices

1. Contracts, inventory/token joins, deterministic generation and negative-control fixtures: `tools/figma-component-library/src/{contract,validate-contract,inventory,token-bindings,generate,validate-library}.ts`, tests and run evidence. Gate: structured scoped static/test wrappers; independent slice review.
2. Native import/export, separate plugin entry/build, Code Connect publication, CLI and docs, explicit CI workflow. Gate: complete unit CI wrappers/build, existing figma CI, release preflight, docs accuracy, applicable quality/architecture, full CLI E2E attempt; independent IMPL-EVAL.

## Risks and mitigation

- Naming drift: strict identity joins, stale aliases fail, current inventory coverage test.
- Unbounded variants: finite per-set/whole-library limits fail before effects.
- Figma partial writes: whole-bundle/native-variable preflight, isolated staging page and rollback.
- Stale/tampered bundle or receipt: semantic regeneration comparison and native structural audit.
- Active S3: no edits to S3 or token/plugin-owned source, coverage reconciliation explicitly remains due after merge.

## Open decisions

None requiring implementation rework. Live host plan limits/fonts/publication permissions are safe to defer as explicit UNPROVEN native acceptance.

## Gates

Structured scoped check/test/lint/fmt; generation round trip and coverage/malformed negative controls; separate browser plugin bundle; code quality and architecture scan; existing figma CI; release preflight/docs accuracy; full CLI E2E attempt (environment failures recorded UNPROVEN); independent review. New dedicated CI checks the tool because root wrappers exclude tools.

## Deferred scope / debt

#2418/#2412 retain S3-dependent inventory reconciliation, native editor/MCP and publication acceptance. #2559 owns token/preset/plugin surface; #2574 guidance; #2573 S7; #2453 separate dispatch; S6 owns visual restyling. No new architectural debt planned.
