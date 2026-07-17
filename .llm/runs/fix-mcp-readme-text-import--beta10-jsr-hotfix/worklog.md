# Worklog: registry-safe MCP README embedding

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-readme-text-import--beta10-jsr-hotfix` |
| Branch | `fix/mcp-readme-text-import` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- `@netscript/mcp/cli` behavior is unchanged; the default embedded docs corpus still exposes the package README.
- No new package export or CLI command is introduced.

### Domain Vocabulary

- `ImportAttributeFinding` — a publishable source location containing registry-unsafe `with { type: ... }` syntax.
- generated publish asset — checked-in TypeScript constant derived from README, schema, or package metadata.

### Ports

- None. The generator is maintainer tooling and the runtime consumes plain constants.

### Constants

- `MCP_PACKAGE_README` — exact `packages/mcp/README.md` content.
- package release versions — exact owning `deno.json` version values.
- CLI schema constant — exact config schema data needed by scaffold output.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Harness bootstrap and design | separate PLAN-EVAL | run artifacts |
| 2 | Generated publish assets and surface sweep | freshness green/red; focused package tests/checks | generator, tasks, generated files, consumers |
| 3 | Registry-failing preflight and corrected guidance | scanner tests; preflight green/red; skill sync | release scanner/tests, release + JSR skills |
| 4 | Final evidence and evaluator handoff | required gates; separate IMPL-EVAL | run artifacts and PR comments |

### Deferred Scope

- Release retry and production JSR E2E — post-merge release-owner operation.

### Contributor Path

Update the source README/schema/package metadata, run the publish-assets generation task, and commit the resulting `*.generated.ts`; the freshness and release-preflight tasks reject drift or import attributes.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-17 | 1 | research/design | Re-baselined at `a5adb706`; implementation remains blocked on PLAN-EVAL. |
| 2026-07-17 | 1 | PLAN-EVAL | Separate local Qwen session `f03ae1dd-da69-406a-b725-f3bf391255a8` returned `PASS`. |
| 2026-07-17 | 2 | implement | Added deterministic publish-asset generation; MCP, CLI, and six plugin surfaces consume generated constants instead of publishable import attributes. |
| 2026-07-17 | 2 | negative proof | Seeded stale plugin metadata made `check:publish-assets` exit 1; regeneration restored a green exit 0. |
| 2026-07-17 | 2 | review | Supervisor reviewed generated source fidelity, consumer import paths, publish include coverage, and excluded test/verifier attributes; no scope gap found. |
| 2026-07-17 | 2 | reconcile | #808 is closed and remains a non-closing `Refs #808`; PR #810 is draft with `status:impl`; no new reviewer comments required adjustment. |
| 2026-07-17 | 3 | implement | Release preflight now rejects `with { type: ... }` syntax in publish-rule-filtered source and recommends generated constants for import-meta reads. |
| 2026-07-17 | 3 | negative proof | Explicit seeded JSON attribute made the preflight CLI exit 1 with file/line evidence; the fixed full tree exits 0 with zero findings. |
| 2026-07-17 | 3 | guidance | Corrected release and JSR-audit guidance in `.agents` and `.claude`; mirror sync and hook lock check pass. |
| 2026-07-17 | 3 | review | Supervisor reviewed lexical stripping against strings/comments/templates, line attribution, publish-rule reuse, failure output, and mirror parity; no suppression or false-green path introduced. |
| 2026-07-17 | 3 | reconcile | PR #810 remains draft and correctly references closed #808 without auto-close; no new comments or issue state require scope changes. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Generated constants only | Registry rejects import attributes that local dry-run accepts. | user evidence + publish-workspace comment |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| none | minor | n/a |

## Gate Results

### Slice 2 — generated publish assets and sweep

| Gate | Result | Evidence |
| --- | --- | --- |
| MCP check | PASS | `packages/mcp: deno task check` exit 0; wrapper-parsed log has 0 diagnostics |
| MCP tests | PASS | 45 passed, 0 failed |
| CLI check | PASS | `packages/cli: deno task check` exit 0 |
| plugin checks | PASS | `deno task check` exit 0 for ai/auth/sagas/streams/triggers/workers |
| freshness | PASS | `deno task check:publish-assets` exit 0 |
| freshness negative proof | PASS | seeded `PLUGIN_PACKAGE_VERSION = "seeded-stale-value"` produced exit 1 naming the stale generated file; regenerated tree returned green |
| changed source fmt/lint wrappers | PASS | 20 selected files, 0 failed batches/findings; generated output separately `deno fmt --check` clean |
| changed-file quality scan | PASS | 19 scanned files, 0 findings, 0 allowances |
| JSR audit | PASS with baseline tool note | MCP dry-run OK; helper reported only its known banner false-positive for “Checking for slow types” |
| MCP publish dry-run | PASS | `@netscript/mcp@0.0.1-beta.10` dry-run complete; generated README asset included |
| architecture | PASS | `deno task arch:check` exit 0; baseline warnings only, no failures |

### Slice 3 — release preflight and guidance

| Gate | Result | Evidence |
| --- | --- | --- |
| scanner tests | PASS | 7 passed, 0 failed; includes syntax seed and inert-region coverage |
| fixed-tree preflight | PASS | text reads, import attributes, file URL conversions, and self-imports all report zero findings |
| preflight negative proof | PASS | `.llm/tmp/seed-import-attribute.ts:1` produced `import-attributes — FAIL`, exit 1 |
| release/JSR skill sync | PASS | `deno task agentic:check-claude` reports 17 skills / 21 mirrored files synchronized; lock unchanged |
| focused wrapper fmt/lint | PASS | 3 release-tool TS files selected; 0 failed batches/findings |

## Handoff Notes

- Evaluator should compare `MCP_PACKAGE_README` to `packages/mcp/README.md`, inspect both negative proofs, and confirm remaining raw attributes are excluded tests/verifiers or inert generated template content rather than publishable syntax.
