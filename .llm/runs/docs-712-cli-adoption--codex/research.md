# Research — docs-712-cli-adoption--codex

## Re-baseline

- Carried-in source: issue slice brief.
- Re-derived against `main` at `d2015073717a02e78052cca5a886f285873c601a` on 2026-07-12.
- The trigger parser already accepts `job`; the webhook tutorial already uses `add webhook`, while
  file-watch and scheduled tutorials still hand-author definitions.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Workers `add job` emits `workers/jobs/<id>.ts`, but the stub has no Zod payload schema. | `plugins/workers/src/adapter/resources/job/job.stub.ts` |
| 2 | Workers `add task` emits runtime-specific task files and is absent from docs/site. | `plugins/workers/src/cli/commands.ts`; grep docs/site |
| 3 | Triggers expose `add webhook`, `add file-watch`, and `add scheduled`; `--job` is parsed for webhook and scheduled inputs. | `plugins/triggers/src/cli/commands.ts`; `plugins/triggers/src/adapter/resources/input.ts` |
| 4 | Saga `add saga` emits definition and config files with a normal handler but no `.compensate(...)` skeleton. | `plugins/sagas/src/adapter/resources/saga/saga.stub.ts` |
| 5 | Auth README documents nonexistent `plugin add`; current public docs use `plugin install`. | `plugins/auth/README.md`; `docs/site/how-to/add-a-plugin.md` |

## jsr-audit surface scan

- Surface scanned: generated userland source only; no package export, dependency, or version changes.
- Slow-type / surface risks: none introduced. Generated files retain explicit definition/result
  types and use existing exported core APIs.

## Open questions

- None. Command spellings and flags are resolved from current CLI source.
