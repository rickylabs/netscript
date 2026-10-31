# Validation

All source type/test/lint/format verdicts use the structured repository wrappers. Private raw
logs remain outside Git; commands and observed results are recorded here and in worklog.md.

| Gate | Scope | Verdict |
| --- | --- | --- |
| run-deno-test.ts -- --allow-all --unstable-kv | installed generator + integration; shared/aggregate drift doctor; worker runtime generator and golden compiler; saga/worker adapter doctor | 64 passed, 0 failed, 0 ignored, exit 0 |
| run-deno-check.ts --file (each changed TS source/test) | 14 authored TS files, unstable KV enabled by wrapper | 0 findings, exit 0 |
| run-deno-lint.ts --config (root rules without path exclusions) --file (each) | 14 selected / 14 processed / 0 dropped | 0 findings, exit 0 |
| run-deno-fmt.ts --config (root style without path exclusions) --file (each) | 14 selected / 14 processed / 0 dropped | 0 findings, exit 0 |
| deno task quality:gate | full configured quality scan + dependency/architecture gates | exit 0 |
| audit-jsr-package.ts --root packages/cli --text | CLI publish surface | dry-run OK, inherited cardinality warnings |
| audit-jsr-package.ts --root plugins/sagas --text | saga publish surface | dry-run OK, inherited cardinality warnings |
| audit-jsr-package.ts --root plugins/workers --text | worker publish surface | dry-run OK, inherited cardinality warnings |
| run-deno-doc-lint.ts --root plugins/sagas | full export map | exit 1: 30 private-type-ref diagnostics in existing public signatures; no exports/type annotations changed |
| run-deno-doc-lint.ts --root plugins/workers | full export map | exit 1: 2 inherited private-type-ref diagnostics in unchanged packages/plugin-workers-core/src/contracts/v1/workers.contract-types.ts |
| installed no-samples commands | fresh local-source project, sagas KV + workers + triggers | install/generate/doctor all exit 0, 3 generated registries |
| run-deno-test.ts --cwd (fresh project) -- --allow-all --unstable-kv empty-startup_test.ts | actual all-three runtime startup exports; isolated KV and streams test double | 1 passed, 0 failed, 0 ignored, exit 0; resource/operation sanitizers on |
| full e2e:cli scaffold.runtime | CI only; coordinator must arm e2e-cli-gate | UNPROVEN until required CI verdict |
| Aspire starts healthy with zero definitions | actual generated AppHost using native Garnet and real streams; all three zero-size registries | PASS; healthy HTTP probes and direct health payloads, scoped cleanup; see aspire-proof.md |

The JSR audit counts its normal "Checking for slow types" banner as one warning; actual package
dry-runs report OK. No public exports, dependency versions or lockfiles changed.

## S3 CI expectation follow-up

Run 41187118118 exposed the stale package-backed doctor check title. Updating its exact expected
healthy title preserves all behavioral checks (independently reviewed). Actual fixture run:
`deno run -A packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts
--project-root <owned scratch project> --repo-root . --cli-entrypoint
packages/cli/bin/netscript-dev.ts --package-version 0.0.8` — exit 0,
PACKAGE_BACKED_PLUGIN_DOCTOR_PASS. Structured check/lint/fmt for this fixture and quality:gate
pass. The original 64-test / installed startup evidence remains applicable to unchanged source.

## Full runtime proof at f13b14c and S4 core regression follow-up

Workflow 41187600253 at f13b14c passed Postgres 120/0/0 and SQLite 113/0/0, with background
readiness, streams health and cleanup passing. Static suites passed services 8/0/0, contracts
5/0/0, plugins 18/0/0. Structured report artifacts were downloaded and checked, including ok=true.
The core shard had one stale expectation requiring deleting the last workers registry. S4
replaces it with stronger zero-map, inventory, read-only and missing-output controls. Full
plugin-check-command_test.ts: 29 passed / 0 failed / 0 ignored. Scoped check/lint/fmt and
quality:gate pass. No runtime source changed; renewed final-head CI remains required after push.
