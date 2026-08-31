# Worklog: AI exports reference adoption

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-ai-exports-heading-and-skills--1809` |
| Branch | `docs/ai-exports-heading-and-skills` |
| Archetype | N/A — docs/tooling only |
| Scope overlays | `SCOPE-docs.md` |

## Design

### Public Surface

- Existing `@netscript/ai` export map only; no published API changes.

### Domain Vocabulary, Ports, and Constants

- No new domain types, ports, or constants. The checker receives one declarative package mapping.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Make all 13 AI entrypoints mechanically visible and regenerate consumers. | Owner-specified docs/corpus gate set | AI reference, export checker, generated corpus, run artifacts |

### Deferred Scope

- Dedicated `/skills` and other missing per-symbol prose remains out of scope and is disclosed by
  `entrypoints-only`.

### Contributor Path

Future AI exports are added to `packages/ai/deno.json`, the `## Exports` table, and the relevant
symbol section; `deno task docs:exports-drift` verifies the entrypoint contract.

## Research Evidence

- `deno doc --json` ran successfully against all 13 entrypoint modules.
- Page-wide identifier comparison found omissions in root, OpenAI-compatible, Ollama, MCP, agent,
  skills, contracts, ports, and testing; Anthropic, embeddings, OpenRouter, and tools were complete.
- `PLAN-EVAL: N/A` for the mechanical reason recorded in `plan.md`.

## Progress Log

| Date | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | 1 | Research/design | Re-baselined issue facts and selected honest entrypoint-only coverage. |
| 2026-08-31 | 1 | Implementation | Renamed the heading, added `/skills`, adopted AI into the mapping, and regenerated the corpus in the required order. |
| 2026-08-31 | 1 | Reconcile | Issue #1809 remains open at `status:impl`; scope and Acceptance text are unchanged; no reviewer comments exist. |

## Gate Results

The pre-commit validation pass returned exit 0 for every required command except
`check:assets-barrel`, whose built-in `git diff --exit-code` correctly returned 1 because the newly
generated barrel was not committed yet. The generated content itself was current. All required
gates will be rerun at the immutable final commit so the PR table reports same-head exit codes.

| Gate | Pre-commit exit |
| --- | ---: |
| `deno task docs:exports-drift` | 0 |
| `deno task --cwd docs/site check:source-format` | 0 |
| `deno task --cwd docs/site build` | 0 |
| `deno task --cwd docs/site check:links` | 0 |
| `deno task --cwd docs/site check:caveats` | 0 |
| `deno task docs:links` | 0 |
| `deno task docs:accuracy` | 0 |
| `deno task docs:snippets` | 0 |
| `deno task check:agent-docs-prose` | 0 |
| `deno task check:assets-barrel` | 1 (expected pre-commit diff verdict) |
| `deno task check:publish-assets` | 0 |
| `deno task check:mcp-export-corpus` | 0 |
| targeted generated-asset `deno check --unstable-kv` | 0 |

## Handoff Notes

- Evaluator should first compare the table to `packages/ai/deno.json`, then inspect the coverage
  reason against fresh `deno doc --json` output and the final gate table.
