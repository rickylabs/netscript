# Research — feat-openapi-mcp-projection-domain--w2

## Re-baseline

- Carried-in sources: live issue `#1130`, ratified RFC PR `#1123`, canonical design
  `.llm/runs/plan-openapi-mcp-plugin--seed/design/canonical/03-projection-and-naming.md`, and the
  committed P2 proof package.
- Re-derived against `origin/main` at `2c8865e8c4ec60ef080276d327fc75ab32c0cb85` on 2026-08-04.
- Branch `feat/openapi-mcp-projection-domain` is exactly at that baseline and began clean.
- The live board remains authoritative: issue `#1130` is open, milestone `0.0.5`, with three
  unchecked acceptance gates; RFC `#1123` is merged and names this work as OMB-4.

## Required proof consumption

The implementation consumes, rather than repeats, these committed measurements:

- `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P2-verdict.md`
- `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/evidence/P2-no-db.json`
- `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/evidence/P2-no-db-live-spec.json`

The no-database document is an attributable 3657-byte OpenAPI 3.1.1 spec with three dotted
operation ids (`v1.health.list`, `v1.health.updateStatus`, `v1.health.health.check`). Discovery rows
measured 73/89/88 compact UTF-8 bytes. It has no local, external, or unresolved refs. It declares
only `200` responses, so every measured errors view is exactly `{}` (2 bytes). A schema property
named `summary` exists, but no operation-level `summary` exists; the real generated fixture must
therefore fire description-ladder rung 3, not rung 1. The DB branch remains blocked by the separate
permission defect and is not re-measured or inferred here.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `packages/mcp` already uses the owner-locked horizontal domain/application/infrastructure shape; this slice adds pure domain code only. | `rg --files packages/mcp/src` and debt `MCP-A6-V2-SHAPE` |
| 2 | The public package currently has `.` and `./cli` entrypoints; both are doc-lint clean. | `packages/mcp/deno.json`; `deno task doc:lint --root packages/mcp --pretty` → 0 diagnostics |
| 3 | A dedicated `./openapi-projection` subpath is the smallest readable public surface; it avoids inflating the already broad default `mod.ts`. | doctrine 02 subpath rule; current `deno doc packages/mcp/mod.ts` |
| 4 | `src/domain` already has 13 immediate children, above the F-16 cap of 12. Adding an `openapi/` concept folder without a small regroup would deepen the violation. | `audit-jsr-package.ts --root packages/mcp --text` warning |
| 5 | The three command-domain files form one existing coherent concept and have a stable top-level public API, so relocating them under `src/domain/command/` can create cardinality headroom without changing exports. | imports of `command-catalog-port.ts`, `command-executor-port.ts`, `command-policy.ts` |
| 6 | Canonical resolution can be pure: exact operation id first, then exact normalized `METHOD path`; case-insensitive and substring comparison may only populate suggestions. | RFC canonical design §2; issue `#1130` Scope |
| 7 | Response-derived errors must select only declared non-2xx/default responses. No absent response family is synthesized. | P2 verdict + evidence `non2xx: []`, `commonErrorEnvelopeInferred: false` |
| 8 | Internal ref expansion can be bounded without I/O; external/unresolved refs are preserved because the projection cannot fetch. | canonical design §3; P2 references evidence |

## jsr-audit surface scan

- Current metadata: valid `@netscript/mcp@0.0.4`, 93-character description, Apache-2.0, two
  existing entrypoints, explicit publish include/exclude rules.
- Baseline `deno task doc:lint --root packages/mcp --pretty`: 0 diagnostics across both entrypoints.
- Baseline package `deno task publish:dry-run`: exit 0 and an intentional file list; the raw output
  contains the banner “Checking for slow types” but no slow-type diagnostic. The fitness helper
  overcounts that banner as one warning, so raw dry-run output remains the authority.
- Planned risks: a new entrypoint without `@module`; undocumented public symbols; inferred return
  types; accidental test-fixture publication; self-referential bare imports. Mitigations are
  explicit JSDoc and return annotations, a relative-import entrypoint, the existing publish
  exclusions, full-export doc-lint, package JSR audit, and package publish dry-run.

## Open questions

- None that force rework. The measured no-DB branch defines the current error contract. A later DB
  proof that demonstrates a different common-envelope shape is an epic-level rescope under ruling
  D8, not license to invent that shape in this slice.
