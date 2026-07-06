# Context Pack

Issue #347 S11 scope is CI/CD template generation plus Aspire deployment state/secret hardening. The branch is `feat/347-deploy-s11` at baseline `37e6818c4f7871d7d6f051c90e9734ec45fb4566`.

Key facts:

- Workflow templates do not exist in the CLI asset manifest yet.
- Scaffold root generation in `packages/cli/src/kernel/application/scaffold/plan-init.ts` is the planned emission point.
- Aspire CLI `deploy` supports `--clear-cache`; Aspire docs say cache files under `~/.aspire/deployments/{AppHostSha}/{environment}.json` may contain plaintext secrets and `--clear-cache` does not save prompted values.
- Current shipped deploy targets in issue scope are Deno Deploy, compose/docker via Aspire, and bare-metal compile/service.

Planned implementation:

1. Add three `.github/workflows/*.yml` templates as CLI assets and emit them during init. Done:
   default Aspire-backed init emits Compose/GHCR, Deno Deploy, and bare-metal workflows;
   `--no-aspire` omits the Aspire-dependent Compose/GHCR workflow.
2. Adjust Aspire compose/docker deploy behavior so generated CI can use `--clear-cache`,
   `--non-interactive`, and explicit `--environment`. Done: router flags are generic and
   the Aspire adapter forwards supported args.
3. Update generated README/site docs with CI workflow usage and dev -> staging -> prod promotion.
   Done, including the plaintext `~/.aspire/deployments` warning and CI non-persistence guidance.
4. Run focused tests, scoped wrappers, `deno task arch:check`, full `deno task check`, and full
   `deno task test`. Done. `deno task e2e:cli` was not run in this implementation slice; supervisor
   merge-readiness owns `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.

Plan-Gate status: first PLAN-EVAL returned `FAIL_PLAN`; plan gate set updated; second PLAN-EVAL returned `PASS`. Implementation may proceed.

Final validation:

- Focused deploy/scaffold/generator tests: 30 passed.
- `rtk proxy deno task --cwd packages/cli test`: 311 passed, 0 failed.
- `run-deno-doc-lint --root packages/cli`: 0 errors.
- `rtk proxy deno task publish:dry-run`: passed.
- `rtk proxy deno task check`: 2102 selected files, 18 batches, 0 occurrences.
- `rtk proxy deno task test`: 1527 passed, 0 failed, 12 ignored.
- `rtk proxy deno task arch:check`: exit 0; existing warnings only.
