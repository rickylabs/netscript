# Research — ci-mcp-export-corpus-gate--1920

## Re-baseline

- Carried-in source: issue #1920 implementation brief and supervisor dispatch.
- Re-derived against `origin/main` @ `ec848e6b0334ec8fcd2bc66ba009305d35367b01` on 2026-09-02.
- `HEAD` and `origin/main` both resolve to the dispatched SHA; the branch was clean before work.
- The workflow and classifier retain the shape described by the dispatch; no rescope is required.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `mcp-export-corpus` already maps to `deno task check:mcp-export-corpus` in the gate catalog. | `.llm/tools/gates/catalog.ts` |
| 2 | The `quality` job invokes sibling corpus gates through `run-gate.ts`, with stable IDs and receipts under `.llm/tmp/gate-receipts/quality/`. | `.github/workflows/ci.yml` |
| 3 | No CI workflow currently invokes the `mcp-export-corpus` gate. | `rg -n 'mcp-export-corpus' .github/workflows` |
| 4 | The generator reads root/package manifests, discovers every published package/plugin export target, and runs `deno doc --json` over those entrypoints. | `.llm/tools/docs/generate-export-surface-corpus.ts` |
| 5 | Package/plugin source paths set `needs_deno`; nested Deno configs/locks, root Deno config, the CI workflow, and TypeScript generator tooling also set `needs_deno`. Unknown paths fail open toward all gates. | `.github/scripts/ci-classify-changes.ts` |
| 6 | `quality` starts on non-draft PRs and `RUN_DENO` is true on classifier failure or `needs_deno=true`; the new step must use the same `RUN_DENO` condition as Deno-backed sibling freshness gates. | `.github/workflows/ci.yml` |
| 7 | `packages/mcp` is currently classified as Archetype 2 with a `Keep` verdict; this slice changes only its generator-owned internal corpus, not its public/API architecture. | doctrine files 06 and 10 |

## jsr-audit surface scan

- N/A: no package export, manifest, documentation contract, dependency, or hand-authored package
  implementation changes. The generated internal MCP corpus mirrors existing published surfaces.

## Open questions

- None before implementation. A pristine-`DENO_DIR` mismatch is a hard stop and returns the slice
  to the supervisor rather than becoming an implementation decision.
