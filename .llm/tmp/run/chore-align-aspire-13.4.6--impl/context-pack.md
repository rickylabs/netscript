# Context Pack - Aspire-core 13.4.6 alignment

## Current State

- Branch: `chore/align-aspire-13.4.6`.
- Goal A: align Aspire-core pins to `13.4.6`.
- Goal B verdict: deferred. Current Aspire docs say CommunityToolkit Deno and SQLite hosting APIs are
  not available for TypeScript AppHost in the required form.
- Final E2E: not green in this WSL session. Two attempts failed at `database.init` because Aspire
  could not bind `https://127.0.0.1:18891`; generated config did restore `13.4.6`.
- Pre-existing dirty files: `.llm/tmp/run/openhands/**/request.md` line-ending drift. Do not stage.

## Files Changed Intentionally

- `.github/toolchain.env`
- `.github/workflows/e2e-cli.yml`
- `.github/workflows/e2e-cli-prod.yml`
- `.github/workflows/e2e-cli-prod-local.yml`
- `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`
- `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts`
- `packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts`
- `docs/site/how-to/deploy-local-aspire.md`
- `docs/site/explanation/aspire.md`
- `.llm/harness/debt/arch-debt.md`
- `.llm/tmp/run/chore-align-aspire-13.4.6--impl/*`

## Next Steps

1. Run scoped check/lint/fmt gates.
2. Run focused Aspire config tests.
3. Run final version sweeps and record classifications.
4. Run `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` last.
5. Commit, append `commits.md`, push explicit refspec, open PR.
