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
| Aspire starts healthy with zero definitions | requires actual AppHost runtime evidence | UNPROVEN; focused API startup is not Aspire evidence |

The JSR audit counts its normal "Checking for slow types" banner as one warning; actual package
dry-runs report OK. No public exports, dependency versions or lockfiles changed.
