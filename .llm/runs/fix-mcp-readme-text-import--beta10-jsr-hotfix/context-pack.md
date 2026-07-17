# Context Pack: registry-safe MCP README embedding

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-readme-text-import--beta10-jsr-hotfix` |
| Branch | `fix/mcp-readme-text-import` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Separate-session PLAN-EVAL passed. Slices 2 and 3 are implemented and reviewed: generated constants replace publishable attributes, and release preflight plus mirrored release/JSR guidance now enforce the registry-safe rule.

## Completed

- Named skills, harness routing, relevant doctrine, release gates, existing generator, publish surface, and preflight implementation were inspected.
- Research, plan, design checkpoint, supervisor identity, and drift log were created.
- PLAN-EVAL passed in local Qwen session `f03ae1dd-da69-406a-b725-f3bf391255a8`.
- Generated publish assets, all affected consumers, and the regeneration/freshness tasks are implemented.
- MCP (45 tests), CLI, and six plugin checks pass; freshness is witnessed green and red; MCP publish dry-run and changed-file quality scan pass.
- Release scanner tests pass; full preflight is green and an explicit seeded attribute is witnessed red; skill mirror sync passes.

## In Progress

- Slice 4 final evidence and separate IMPL-EVAL.

## Next Steps

1. Commit, push, and comment slice 3.
2. Re-run final required gates on the committed tree.
3. Dispatch separate-session IMPL-EVAL and address any findings.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Generated constants are the only sanctioned bundled assets. | user + plan D1 | No import attributes in publishable source. |
| Scan actual publish rules. | existing preflight + plan D3 | Avoid test-only false failures. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-mcp-readme-text-import--beta10-jsr-hotfix/` | new | Harness planning artifacts only. |
| `.llm/tools/generate-publish-assets.ts`, `deno.json` | new/changed | Deterministic generation and freshness task. |
| `packages/mcp`, `packages/cli`, `plugins/{ai,auth,sagas,streams,triggers,workers}` | changed | Generated assets and registry-safe consumers. |
| `.llm/tools/release/preflight-text-imports.ts` + tests | changed | Publish-rule-aware import-attribute rejection and negative proof. |
| `.agents/skills`, `.claude/skills` | changed | Corrected release/JSR registry guidance, synchronized mirrors. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS | `plan-eval.md`; session `f03ae1dd-da69-406a-b725-f3bf391255a8` |
| Static | PASS for slice 2 | package checks, focused MCP tests, wrapper fmt/lint evidence |
| Fitness | PASS for slice 2 | freshness green/red, quality scan, MCP dry-run/audit, arch check |
| Runtime | N/A | no runtime protocol change planned |
| Consumer | not run | blocked by Plan-Gate |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments after the bootstrap commit.
