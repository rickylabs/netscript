# Plan: OMB S9 activation surfaces and migration fixture

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-activation-s9--1135` |
| Branch | `feat/openapi-mcp-activation-s9` |
| Phase | `plan` |
| Target | `packages/mcp` plus CLI scaffold/agent-init consumers |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Archetype

Use the owner-selected Archetype-2 column. The MCP package integrates telemetry, project-health,
and OpenAPI service boundaries behind injected ports. This slice extends bounded presentation
values and consumer activation fixtures without adding a new port, adapter, or public export.

## Current Doctrine Verdict

`packages/mcp` is not present in the older package census in doctrine file 10. New code is held to
the Archetype-2 gates and no existing debt is deepened. The CLI census remains `Restructure`, but
this slice only changes its existing scaffold and agent-init seams.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | Activation wording must be direct at the published agent boundary. |
| A6 | Reuse existing flow/result seams; add no generic helper. |
| A8 | Fixtures stay beside the behavior they prove. |
| A14 | Byte-level and migration tests are the acceptance contract. |

## Goal

Make the curl decision point visible in all three activation surfaces and prove exact-version host
migration from prior-release configuration to the current 21-tool server.

## Scope

- Add one initialize-instructions sentence naming `list_service_operations` and
  `get_operation_schema` before hand-rolled curl requests.
- Add one behavioral line to scaffolded app-scoped `AGENTS.md`.
- Add bounded `get_operation_schema` pointers to endpoint-shaped `get_recent_errors` groups and
  non-passing doctor findings.
- Add byte fixtures for all three surfaces.
- Add an S-18 prior-release `.mcp.json` fixture proving the old exact pin persists until `agent init`
  rewrites it, after which a restarted host resolves the current 21-tool surface.

## Non-Scope

- No auto-invocation, execution tool, receipt requirement, docs rewrite, or new MCP server.
- No claim that existing projects upgrade without re-init and host restart.
- No export-map or dependency changes.

## Hidden Scope

- Preserve unrelated `.mcp.json` servers and top-level keys during migration.
- Keep output schemas exact: pointer fields must be added to tool contracts before flow values.
- Avoid `deno.lock` churn; the opening queue entry is user-owned and excluded from commits.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use a stable `operationSchemaHint` string on endpoint-shaped values. | Byte-addressable, bounded, schema-valid, and easy for consumers to display. |
| D2 | Add the pointer to every recent-error group and every non-pass doctor finding/family failure. | These are the places with an actionable HTTP/service symptom; pass-only noise is avoided. |
| D3 | Migration fixture starts with a literal prior-release exact pin and models restart by resolving tools from the rewritten pin only after re-init. | Proves the S-18 causal path without network or registry dependence. |
| D4 | Keep zero-install language out of existing-project assertions. | Canonical rev-2 design limits zero-install to new scaffolds. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Receipt evidence class | safe to defer | Fork F4 / later field wave, explicitly outside #1135. |
| Exact prior released version literal | must resolve now — resolved | Use the release immediately preceding `NETSCRIPT_RELEASE_VERSION`; fixture asserts it differs. |
| Export changes | safe to defer | None required by the accepted surface. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Schema rejects new pointer fields | Contract-first schema change plus focused MCP tests. |
| Doctor pointer becomes noisy | Attach only to warn/fail findings and family-failure fallback. |
| Fixture proves rewrite but not tool availability | Resolve the post-reinit exact pin to the in-tree server and assert all 21 names including the triad. |
| Historical 14 count leaks into current instructions | Byte fixture asserts tool names, not stale counts. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-6 | risk | Do not create a generic hint helper; use one named constant if shared. |
| AP-11 | clear target | No module-load IO or hidden environment reads. |
| AP-19 | clear target | No permission change. |
| AP-25 | clear target | Filesystem behavior stays in existing agent-init adapter tests. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-19 (Archetype-2 applicable set) | yes | `quality:gate`, scoped wrappers, manual diff audit |
| F-5/F-7 | yes | `doc:lint --root packages/mcp` |
| F-6 | yes | package-local `deno publish --dry-run --allow-dirty` |
| Consumer import/runtime | yes | focused MCP + CLI tests and `scaffold.runtime` |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| none | none | No new or deepened doctrine violation planned. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused tests | MCP activation tests + CLI app/agent-init tests | byte and migration fixtures pass |
| 2 | scoped static | check/lint/fmt wrappers over `packages/mcp` and owned CLI files | PASS with selected files > 0 |
| 3 | quality | `deno task quality:gate` | PASS, no new ignores/casts |
| 4 | JSR | doc-lint + `packages/mcp` publish dry-run | zero diagnostics / dry-run success |
| 5 | scaffold consumer | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | SUCCESS, not skipped |

## Drift Watch

- A tool count other than 21, any export change, inability to model exact-pin migration locally, or
  required scope beyond the two acceptance boxes must be logged before continuing.

