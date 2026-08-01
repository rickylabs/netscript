# Research — fix-1009-release-publish-arg-separator--codex

## Re-baseline

- Carried-in source: issue #1009 scope and supervisor reproduction in the task prompt.
- Re-derived against `main` @ `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01.
- What changed vs the carried-in version: nothing; the stated narrow cause and AC4 sweep match the
  checked-out baseline.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The documented `deno task release:publish -- ...` form forwards a literal `--`, which `github-release.ts` rejects. | Run `deno task release:publish -- v0.0.9 --message "probe" --dry-run`; baseline output ends at `parseArgs` with `Unknown argument: --`. |
| 2 | `cut.ts`, `canary.ts`, `publish-readiness.ts`, `verify-canary-pair.ts`, and `surface-diff.ts` already ignore bare `--`. | Focused `rg` of their argument loops. |
| 3 | `release:preflight` is task-wired and its parser rejects bare `--`; `run-publish-dry-run.ts` uses `Deno.args.includes` and is inert to it. | `deno.json:95`; `preflight-text-imports.ts:625-637`; `run-publish-dry-run.ts`. |
| 4 | `jsr-provision-packages.ts`, `jsr-set-package-settings.ts`, and `run-publish.ts` are not direct `deno task` entry points. | Root `deno.json` task wiring survey. |
| 5 | The existing unknown-flag/missing-value unit test must remain strict. | `github-release_test.ts` test named `parseArgs: unknown flag and missing value are rejected`. |

## jsr-audit surface scan (package/plugin waves)

- N/A: the owned surface is `.llm/tools/release/`; no package/plugin export, manifest, or JSDoc
  surface changes.

## Open questions

- None. Test shape is locked: derive `argv` from every `Usage:` command in the source header for
  `release:publish`, plus an entry-point subprocess test for `release:preflight -- --file ...`.
