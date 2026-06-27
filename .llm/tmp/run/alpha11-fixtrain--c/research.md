# Research — alpha11-fixtrain--c

## Re-baseline

- Carried-in source: user implementation brief for alpha.11 fix-train Slice C.
- Re-derived against current branch `feat/cli-cache-interactive-alpha11-c` on 2026-06-27.
- Current state: no existing `.llm/tmp/run/alpha11-fixtrain--c/` artifacts were present; work started
  from the explicit implementation-slice brief.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Public `init` already had `--ci` and `-y/--yes`, but no prompt resolution before `executeInit`. | `packages/cli/src/public/features/init/init-command.ts` |
| 2 | A dormant prompt port and Cliffy adapter existed and had no init consumer. | `packages/cli/src/kernel/ports/prompt-port.ts`, `packages/cli/src/kernel/adapters/runtime/prompt/cliffy-prompt.ts` |
| 3 | Existing cache env contract uses `CACHE_PROVIDER`, `CACHE_MODE`, provider URI keys such as `GARNET_URI`/`REDIS_URI`, and `DENO_KV_PATH`; no `CACHE_URL` convention was found in the requested scan. | `rtk rg "CACHE_URL|CACHE_|REDIS_URL" packages/sdk packages/service packages/cli/src/kernel/templates packages/cli/src/kernel/assets` |
| 4 | Aspire config schema accepted only `Redis` and `Garnet`; Deno KV appsettings needed a schema addition to parse. | `packages/aspire/config.ts` |
| 5 | The public binary owns the requested new surface; maintainer `netscript-dev init` is a separate local-source command. | `deno run -A packages/cli/bin/netscript.ts init --help` |

## jsr-audit surface scan

- Surface scanned: `deno doc --lint packages/cli/mod.ts`.
- Slow-type / surface risks: none found for this package public doc-lint target.

## Open questions

- Deno KV has no managed Aspire cache container emission in this slice; recorded as accepted debt.
