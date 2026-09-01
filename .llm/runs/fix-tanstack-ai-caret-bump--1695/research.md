# Research — fix-tanstack-ai-caret-bump--1695

## Re-baseline

- Carried-in source: `/home/agent/tanstack-ai-caret-bump-brief.md` and issue #1695.
- Branch baseline: `65cd8a07787504b5ed94408510d4ab85260bc21a`.
- Re-derived against `origin/main` @ `0e93a6c0574eb557b1322a4298cee3f7adbeafa2`
  on 2026-08-31 without merging it.
- What changed vs the carried-in version:
  - The brief's example core target (`0.48.0`) is no longer current. The repo authority reports
    `0.52.0` plus matching current provider-family releases.
  - `origin/main` adds an OpenAI Responses model-options mapper and tests under `packages/ai`; these
    are inspected now and will be integrated exactly once at final freeze.
  - The launcher's run ID is `fix-tanstack-ai-caret-bump--1695`, which supersedes the stale `deps-`
    path in the brief.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The branch is exactly `deps/tanstack-ai-caret-bump` at the requested base, and its merge-base with current `origin/main` is that base. | `git branch --show-current`; `git rev-parse HEAD`; `git merge-base HEAD origin/main` |
| 2 | Current stable targets are core `0.52.0`, Anthropic `0.18.3`, MCP `0.3.8`, and OpenAI `0.22.3`. | Authoritative `deno task deps:latest --filter '@tanstack/ai*'`, raw output in `worklog.md` |
| 3 | `ai-preact` is also behind, but it belongs to `packages/fresh`; issue #1695 explicitly locks the coherent family in `packages/ai` to the four named packages. | `packages/fresh/deno.json`; issue brief |
| 4 | The only direct static TanStack imports are in the `packages/ai` anti-corruption adapters; MCP uses the root and `/stdio` subpaths through structural dynamic imports. | `rg -n '(@tanstack/ai|ai-anthropic|ai-mcp|ai-openai)' packages/ai` |
| 5 | New-core `deno doc` retains `chat`, `EventType`, `AnyTextAdapter`, `StreamChunk`, `AnyTool`, `ContentPart`, `JSONSchema`, `ModelMessage`, and `ToolCall`. The `chat` generic signature expanded but the keys used by NetScript remain supported. | `deno doc --filter <symbol> npm:@tanstack/ai@0.52.0` (captured RC 0 for exported symbols) |
| 6 | Old/new `deno doc` signatures for `openaiCompatible`, `anthropicText`, and `createAnthropicChat` are identical at the call-site level. | `deno doc --filter <symbol> npm:<package>@<old/new>` (captured RC 0) |
| 7 | Upstream changelogs contain breaking changes elsewhere in the workspace and Anthropic catalog removals in `0.16.0`; NetScript's used `claude-sonnet-4-5` / `claude-haiku-4-5` IDs are not among the removals. Core `0.48.0` changes AG-UI wire metadata while explicitly retaining in-process `chat()` extras, which is NetScript's path. | Current TanStack/ai checkout under `.llm/tmp/tanstack-ai-upstream-1695`; `packages/*/CHANGELOG.md`; NetScript model-ID `rg` audit |
| 8 | Standalone `deno doc npm:@tanstack/ai-mcp@0.3.8/stdio` returns RC 1 while resolving an MCP SDK declaration. Because NetScript dynamically imports and structurally narrows this subpath, the decisive checks are the upgraded package type-check/tests and runtime MCP tests. | Captured `deno doc` output and final package gates |
| 9 | Current JSR baseline is publishable (`publish:dry-run` RC 0), but already reports three unanalyzable dynamic-import warnings. The fitness audit returns RC 0 with existing `src/ports` cardinality and slow-type warnings. The structured doc-lint wrapper returns RC 1 on existing per-entrypoint private-type-ref diagnostics despite a zero combined summary. | Baseline commands and captured RCs in `worklog.md` |
| 10 | Current `origin/main` differs under `packages/ai` only in the OpenAI-compatible adapter and two tests; it does not change `packages/ai/deno.json`. | `git diff 65cd8a077..origin/main -- packages/ai` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: all 13 `packages/ai/deno.json` exports, metadata, publish include/exclude list,
  `deno publish --dry-run`, structured doc lint, and the repo JSR fitness audit.
- Planned public surface: unchanged. The four TanStack packages remain internal adapter dependencies;
  no upstream type is intentionally exported.
- Slow-type / surface risks: the existing baseline described in finding 9 must not worsen. Final
  evidence will compare the same commands after the bump and after the one `origin/main` merge.
- Metadata: scoped name, version, description, license, exports, README, and publish file list are
  present. No CommonJS or new public entrypoint is planned.

## Open questions

- None that force rework. Whether a source adaptation is needed is resolved deterministically by
  the upgraded check/test surface; any such adaptation stays inside the existing TanStack adapter
  boundary.
