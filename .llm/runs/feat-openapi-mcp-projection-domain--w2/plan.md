# Plan: OMB S4 OpenAPI projection domain

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-projection-domain--w2` |
| Branch | `feat/openapi-mcp-projection-domain` |
| Phase | `plan` (locked; implementation authorized by milestone waiver) |
| Target | `packages/mcp` |
| Archetype | `2 — Integration` (package-level governing column; this slice is its pure domain kernel) |
| Scope overlays | none |

## Archetype

The ratified RFC classifies `packages/mcp` as Archetype 2 because the complete feature is bounded
flows behind ports/adapters. S4 deliberately implements only the pure domain kernel: no I/O, ports,
adapters, tool registry changes, or runtime lifecycle. The full Archetype-2 gate column still
governs this package slice.

## Current Doctrine Verdict

Doctrine file 10 predates `packages/mcp` and has no package row. The active package-specific verdict
is debt `MCP-A6-V2-SHAPE`: retain the owner-locked horizontal protocol-engine shape until the later
CLI integration reassessment. This slice neither updates nor deepens that entry.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | The `./openapi-projection` contract and documented types precede implementation details. |
| A6/A7 | Projection helpers encode NetScript identity/schema policy and use platform primitives only. |
| A8 | Each index/identity/ladder/view file has one reason to change. |
| A9 | The package remains Archetype 2; the slice does not invent a second package shape. |
| A11 | Canonical identity is one closed policy, not a strategy abstraction. |
| A14 | Public fixtures, doc-lint, JSR dry-run, quality scan, and architecture checks preserve the contract. |

## Goal

Publish and test a pure OpenAPI projection submodule that indexes operations, resolves one canonical
identity or refuses ambiguity, selects deterministic summaries, and derives request/success/error
schema views exclusively from the operation's declared OpenAPI data.

## Scope

- Add the documented `@netscript/mcp/openapi-projection` entrypoint.
- Add pure operation-index, canonical-identity, description-ladder, and schema-view domain modules.
- Add per-rung fixtures, case-variant/duplicate ambiguity fixtures, and the exact committed real
  no-DB generated spec fixture.
- Add tests proving the three live acceptance gates and internal-ref bounded behavior.
- Update the MCP README only for the new domain subpath; the server still exposes 14 tools.

## Non-Scope

- Service endpoint discovery, filesystem manifests, HTTP fetching, ports, adapters, MCP flows, tool
  registry changes, curl generation, execution policy, or activation surfaces (S5/S6 and later).
- DB scaffold re-measurement or a guessed oRPC common-error family. A later contradicting proof is
  handled by the epic-level D8 rescope.
- Changes to `deno.lock`, dependencies, generated CLI assets, or debt `MCP-A6-V2-SHAPE`.

## Hidden Scope

- Relocate the existing command-domain triplet under `src/domain/command/`, updating only internal
  imports while preserving all package-root exports. This offsets the new `openapi/` concept folder
  and brings `src/domain` from 13 immediate children to the F-16 cap of 12 instead of deepening the
  baseline warning.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | One new `./openapi-projection` subpath; no default-surface additions. | Curated surface and independently doc-lintable module. |
| D2 | Index every supported path-method pair in source order and preserve the raw operation/document as readonly data. | Deterministic, pure, adequate for later flows. |
| D3 | Resolution is case-sensitive exact id first, exact uppercase `METHOD path` second. Multiple exact hits refuse; fuzzy comparison only returns suggestions. | Implements S-2 without alias execution. |
| D4 | An indexed operation's canonical id is its operation id when present, otherwise its exact method-path identity. | Keeps non-preset specs addressable without fabricating dotted ids. |
| D5 | Ladder order is operation `summary`, first sentence of operation `description`, humanized operation id, then method/path synthesis. Rung provenance is not public. | S-22 and canonical design §4. |
| D6 | Errors are the exact projected non-2xx/default response map; none means `{}`. Common compaction is allowed only for two or more byte-for-byte equal non-empty projected error schemas and retains their status codes. | Lossless detection; never infers the unmeasured DB envelope. |
| D7 | Local `#/...` refs expand with a depth/cycle guard; unresolved/external refs remain visible. | Pure, bounded, and honest. |
| D8 | JSON object inputs are treated structurally with guards; no OpenAPI parser dependency. | P2's observed subset is small and zero-dependency is required. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact common DB envelope shape | safe to defer | No attributable DB proof; response-derived maps remain correct. |
| Whole-result byte ceiling | safe to defer | S8 owns central truncation; P2 records current absence. |
| Public functions versus classes | resolved now | Pure named functions + readonly discriminated unions. |
| Invalid-document handling | resolved now | Ignore non-operation path members; throw only for non-object top-level input. |
| Supported methods | resolved now | Closed standard HTTP method constant, lowercase OpenAPI keys, uppercase identities. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Fuzzy lookup accidentally resolves | Separate exact-resolution and suggestion code paths; ambiguity fixtures. |
| Schema view hallucinates error envelope | Exact no-DB fixture asserts deep equality with `{}` for all three operations. |
| `$ref` recursion loops | Depth counter plus active-ref set; preserve the ref on refusal. |
| Public surface creates slow types/private refs | Explicit annotations and exported types; full-entrypoint doc-lint and raw dry-run. |
| Fixture ceases to be the measured spec | Preserve exact 3657-byte source and assert operation ids/no-summary/error results. |
| Domain cardinality deepens | Land the command-domain regroup before adding `openapi/`. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Four focused modules and four focused tests; keep every file below gate thresholds. |
| AP-2/AP-9 | risk | No generic parser/helper layer or configurable strategy abstraction. |
| AP-11/AP-25 | risk | No Deno, fetch, filesystem, env, process, clock, or module-load effects. |
| AP-14 | risk | No upstream re-export and no oRPC/OpenAPI runtime dependency. |
| AP-16/AP-22 | risk | Named `domain/openapi` and `domain/command` folders; no internal barrel. |
| AP-19 | N/A | New projection code needs no permission. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-5 | yes | focused file review, `quality:gate`, `doc:lint` |
| F-6/F-7 | yes | package raw publish dry-run + structured JSR audit + zero doc diagnostics |
| F-8/F-9 | yes | existing config/README unchanged for permissions; architecture gate |
| F-10..F-12 | yes | focused tests and `quality:gate` |
| F-14..F-19 | yes | `quality:gate`, scoped wrappers, public consumer import test |
| Runtime/Aspire | N/A | Pure domain code has no runtime or external resource. |
| Consumer import | yes | tests import `../openapi-projection.ts`; `deno check` all entrypoints |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `MCP-A6-V2-SHAPE` | none | Horizontal package shape remains; no CLI-surface reassessment. |
| `src/domain` cardinality warning | resolve locally | Mechanical command regroup offsets the new OpenAPI concept folder. |

## Commit Slices

| # | Slice | Proving gate | Files |
| --- | --- | --- | --- |
| 1 | Preserve domain cardinality and publish the index contract | command tests, operation-index tests, scoped check | move `src/domain/command-*.ts` → `src/domain/command/`; update imports; add `openapi-projection.ts`, `src/domain/openapi/operation-index.ts`, `tests/operation-index_test.ts`; update `deno.json`, README, run artifacts |
| 2 | Enforce exact canonical identity and ambiguity refusal | `tests/canonical-identity_test.ts` | add `src/domain/openapi/canonical-identity.ts`, ambiguity fixtures/test; update entrypoint/run artifacts |
| 3 | Prove all four description rungs including the measured real scaffold | `tests/description-ladder_test.ts` | add `src/domain/openapi/description-ladder.ts`, per-rung fixtures, exact `no-db-generated-openapi.json`; update entrypoint/run artifacts |
| 4 | Derive bounded request/response/error views without invention | `tests/schema-views_test.ts` + all MCP tests | add `src/domain/openapi/schema-views.ts`, declared-error/ref fixtures, tests; update entrypoint/run artifacts |
| 5 | Produce merge-readiness evidence | required wrapper/quality/doc/JSR commands | run artifacts only unless a diagnostic requires a correction within Slices 1–4 |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Focused semantic | `deno test packages/mcp/tests/*projection*_test.ts packages/mcp/tests/operation-index_test.ts packages/mcp/tests/canonical-identity_test.ts packages/mcp/tests/description-ladder_test.ts packages/mcp/tests/schema-views_test.ts` (existing paths only) | exit 0 |
| 2 | Package tests | `deno task test` from `packages/mcp` | exit 0 |
| 3 | Scoped check | `.llm/tools/run-deno-check.ts --root packages/mcp --ext ts,tsx` | PASS |
| 4 | Scoped lint | `.llm/tools/run-deno-lint.ts --root packages/mcp --ext ts,tsx` | PASS, no new ignores |
| 5 | Scoped format | `.llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx` | PASS |
| 6 | Framework quality | `deno task quality:gate` | exit 0 |
| 7 | Docs | `deno task doc:lint --root packages/mcp --pretty` | 0 diagnostics across 3 entrypoints |
| 8 | JSR fitness | `audit-jsr-package.ts --root packages/mcp --text` | no introduced finding; cardinality no worse and preferably resolved |
| 9 | Publish | `deno task publish:dry-run` from `packages/mcp` | exit 0, no slow-type diagnostic, intended file list |
| 10 | Lock hygiene | raw `git diff origin/main -- deno.lock` | empty |

## Dependencies

- Hard input: committed P2 verdict and no-DB evidence/raw spec.
- No new runtime or development dependency.

## Drift Watch

- Any operation-level summary in the real fixture, any non-2xx response in it, any ref, a new I/O
  need, a DB-envelope assumption, or a required edit outside `packages/mcp` and this run directory.
