# Research — fix-1054-ai-tool-lifecycle--codex

## Re-baseline

- Carried-in source: issue #1054 assignment and supervisor reproduction.
- Re-derived against `main` at `a629acc2b65d0aabca1292d14dc792c4406312a3` on 2026-08-02.
- Published canary reproduction exits 1 because the remote CLI dynamically executes the newly
  scaffolded app module and cannot resolve its bare `@netscript/ai/tools` import.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Selection executes app-owned modules through `await import()` | `ai-registry-compiler.ts` selector |
| 2 | `ProjectFiles.readTextFile` already exists; no package/plugin port change is needed | `packages/plugin/src/cli/adapters/project-files.ts` |
| 3 | The real tool stub exports an initialized `defineAiTool` chain; skill-loader exports only a factory | tool and mcp-tool stubs |
| 4 | `skill-loader.ts` remains explicitly excluded in both target declarations | compiler and `scaffold.runtime.json` |

## jsr-audit surface scan

- Surface scanned: `plugins/ai/deno.json` exports and remote CLI execution path.
- Risk: local dry-run cannot prove an HTTPS entrypoint can execute app modules with bare imports.
  The fix must remove execution during selection; local CLI reproduction plus post-publish prod E2E
  are the appropriate consumer proofs. No version or export change is planned.

## Open questions

- None. The owner locked the source-shape discriminator and exact acceptance gates.
