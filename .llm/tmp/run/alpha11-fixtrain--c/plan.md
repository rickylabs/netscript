# Plan: alpha.11 Slice C — interactive init + cache feature

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `alpha11-fixtrain--c` |
| Branch | `feat/cli-cache-interactive-alpha11-c` |
| Phase | `implement` |
| Target | `packages/cli`, `packages/aspire` schema |
| Archetype | `6 - CLI/Tooling` |
| Scope overlays | `none` |

## Archetype

Archetype 6 applies because the slice changes the user-run `netscript init` command and generated
scaffold output.

## Current Doctrine Verdict

`@netscript/cli` verdict is Restructure; this slice does not attempt the broad CLI restructure and
keeps new files within the existing vertical `public/features/init` shape.

## Goal

Add public `init` flags `--cache` and `--cache-backend`, restore interactive init prompting for
missing values, and scaffold Redis/Garnet/Deno KV cache config without changing Slice D docs.

## Scope

- Add cache backend contract and defaults.
- Prompt for missing init values only when not `--ci`, not `--yes`, and stdin is a terminal.
- Emit cache appsettings and TS AppHost infrastructure from the same resolved init options.
- Cover defaults, interactive prompt resolution, and backend-specific emission with tests.

## Non-Scope

- CLI reference docs authoring; Slice D owns tutorial/reference reconciliation.
- Managed Deno KV runtime/container support; record as debt.
- Maintainer/local-source `netscript-dev init` surface.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| LD-1 | Default cache is enabled with Redis backend. | User contract and alpha.11 runtime target. |
| LD-2 | Reuse existing cache env names instead of `CACHE_URL`. | Scan found existing `CACHE_PROVIDER`, `CACHE_MODE`, `GARNET_URI`/`REDIS_URI`, `DENO_KV_PATH`. |
| LD-3 | Keep prompting in `public/features/init` and consume `PromptPort`. | First real consumer of dormant port; avoids direct Cliffy dependency in the command action. |
| LD-4 | Extend `@netscript/aspire` schema to accept `DenoKv`. | Generated appsettings must parse through the existing Aspire schema. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Doc lint | `deno doc --lint packages/cli/mod.ts` | PASS |
| 2 | Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS |
| 3 | Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx --batch-size 1000` | PASS |
| 4 | Scoped fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts --batch-size 1000` | PASS |
| 5 | Unit tests | focused init, appsettings, register-infrastructure, Aspire schema tests | PASS |
| 6 | E2E | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS before PR |

