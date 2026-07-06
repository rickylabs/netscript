# Context Pack

Issue #347 S11 scope is CI/CD template generation plus Aspire deployment state/secret hardening. The branch is `feat/347-deploy-s11` at baseline `37e6818c4f7871d7d6f051c90e9734ec45fb4566`.

Key facts:

- Workflow templates do not exist in the CLI asset manifest yet.
- Scaffold root generation in `packages/cli/src/kernel/application/scaffold/plan-init.ts` is the planned emission point.
- Aspire CLI `deploy` supports `--clear-cache`; Aspire docs say cache files under `~/.aspire/deployments/{AppHostSha}/{environment}.json` may contain plaintext secrets and `--clear-cache` does not save prompted values.
- Current shipped deploy targets in issue scope are Deno Deploy, compose/docker via Aspire, and bare-metal compile/service.

Planned implementation:

1. Add three `.github/workflows/*.yml` templates as CLI assets and emit them during init.
2. Adjust Aspire compose/docker deploy behavior so generated CI can use `--clear-cache`, `--non-interactive`, and explicit `--environment`.
3. Update generated README/site docs with CI workflow usage and dev -> staging -> prod promotion.
4. Run focused tests, scoped wrappers, `deno task arch:check`, full `deno task check`, and full `deno task test`. Do not run `deno task e2e:cli` in this implementation slice; supervisor merge-readiness owns `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.

Plan-Gate status: first PLAN-EVAL returned `FAIL_PLAN`; plan gate set updated; second PLAN-EVAL returned `PASS`. Implementation may proceed.
