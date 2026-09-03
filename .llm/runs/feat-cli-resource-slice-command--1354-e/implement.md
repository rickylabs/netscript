# Implementation Prompt: Slice E — unregistered resource command

## SKILL

- `netscript-harness` — slice discipline, artifacts, and evidence.
- `netscript-cli` — CLI command composition and public command conventions.
- `netscript-doctrine` — Archetype 6 layering and fitness gates.
- `netscript-tools` — structured validation and lock hygiene.

Use harness. Read the locked source plan, this run's research/plan/worklog, Archetype 6, the CLI and
doctrine skills, and the existing resource planner/renderer/reconcilers before editing.

Implement exactly these five product files:

1. `generate-resource-input.ts`
2. `generate-resource.ts`
3. `generate-resource_test.ts`
4. `generate-resource-command.ts`
5. `generate-resource-command_test.ts`

Do not edit `public-command-dependencies.ts` or register the command. Do not copy #1664 selection
logic. Preserve the injected resolver integration point for Slice A. Prove D3 through the command,
including idempotent rerun, dry-run conflict, owned-only force, and byte-identical pre-apply failures.

## Result

The implementation owns exactly the five authorized files under
`public/features/generate/resource/`. The command is deliberately absent from the public command
tree and dependency root. `--client` is forwarded unchanged to the injected
`ResourceClientResolver`; Slice A (#1950) supplies `client-selector.ts` as that dependency when
Slice F registers the command.

## Validation Evidence

| Gate | Exit | Exact result |
| --- | ---: | --- |
| structured CLI check | 0 | 960 files, 8 batches, 0 failed batches, 0 diagnostics |
| focused resource tests | 0 | 12 passed, 0 failed, 0 ignored |
| scoped CLI lint | 0 | 5/5 files processed, 0 findings |
| scoped CLI format | 0 | 5/5 files processed, 0 findings |
| package-owned CLI tests | 0 | 1,658 passed, 0 failed, 0 ignored |
| `arch:check` | 0 | all roots `FAIL=0`; CLI baseline `WARN=60 INFO=1` |
| `quality:gate` | 0 | 37/37 workspace members covered, 35 publishable, 0 coverage errors; doctrine `FAIL=0` |
| `docs:readme-fences` | 0 | 36 READMEs, 168 fences, 73 checked, 7 expected type errors |
| `docs:jsdoc-examples` | 0 | 359 checked, 0 failures; deferred `unboundName=116`, `typeError=14` |
| CLI JSR audit | 0 | 960 files, 254 test files, dry-run OK, 20 baseline warnings |
| workspace publish dry-run | 0 | dry run completed successfully |
| corpus regeneration | 0 | 35 packages, 273 subpaths, 7,841 symbols |
| `check:mcp-export-corpus` | 0 | same corpus census; no generated diff |
| formal IMPL-EVAL | 0 | `PASS`; native opposite-family Claude Opus 5 session |

The lint/fmt wrappers used `.llm/tmp/slice-e-deno.json`, which reproduces the repository lint and
format rules without the root config's intentional `packages/cli/` exclusion. Coverage therefore
proved all five files rather than accepting a vacuous dropped-file result.

The user-listed focused gates plus the base-sensitive package, JSR, publish, and corpus gates were
refreshed after rebasing onto `origin/main` at `9a191bdda`. Scoped lint/fmt were rerun after the last
product edits; the final rebase added only `packages/cli/CHANGELOG.md` from main.
The initial unqualified corpus generation invocation exited 1 because its clean-read-set guard
correctly detected the five intentionally uncommitted product files; the documented
`--allow-dirty` regeneration shown in the table exited 0, and the subsequent check proved no
carrier delta.
