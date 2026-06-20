## Design

- Surface: `.github/workflows/e2e-cli.yml` deferred CLI E2E workflow only.
- Archetype: N/A, CI/tooling infra slice; no package or plugin surface is introduced.
- Public surface: GitHub Actions jobs `scaffold-static` and `scaffold-runtime`.
- Domain vocabulary: Deno 2.8.3, .NET 10.0.x, Aspire CLI 13.4.x, scaffold static suites, scaffold runtime suite.
- Ports: GitHub Actions setup actions, `dotnet tool install`, local Deno CLI E2E runner, Docker-backed Aspire runtime.
- Commit slices:
  1. Validate local runtime/static suites and align workflow runtime setup to .NET 10 + Aspire CLI 13.4.x.
- Deferred scope: no package changes, no version pin changes outside workflow setup, no PR comment/merge.

## Evidence

| Check | Result | Notes |
| --- | --- | --- |
| Local toolchain | PASS | `deno 2.8.3`; `dotnet 10.0.109`; `aspire 13.4.4+ccc566c5ab3285c9beb8f38ede34734bb477c029`; Docker `29.1.3`. |
| `deno install` | PASS | Exit 0; Deno warned that npm build scripts are ignored without `nodeModulesDir`. |
| `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS | `Summary: passed=41 failed=0`. |
| `deno task e2e:cli run scaffold.service --format pretty` | PASS | `Summary: passed=4 failed=0`. |
| `deno task e2e:cli run scaffold.contracts --format pretty` | PASS | `Summary: passed=4 failed=0`. |
| `deno task e2e:cli run scaffold.plugins --format pretty` | PASS | `Summary: passed=9 failed=0`. |
| `aspire.dev/install.sh --version 13.4.4 --install-path <scratch>/bin --skip-path` | FAIL as expected | The official install script still 404s for `aspire-cli-linux-x64-13.4.4.tar.gz`; not used in the workflow. |
| `dotnet tool install Aspire.Cli --tool-path <scratch>/bin --version 13.4.4` | PASS | Isolated install succeeded; `<scratch>/bin/aspire --version` returned `13.4.4+ccc566c5ab3285c9beb8f38ede34734bb477c029`; 13.4 prefix guard passed. |

## Workflow Change

- Runtime job now uses `actions/setup-dotnet@v4` with `dotnet-version: "10.0.x"`.
- Runtime job installs `Aspire.Cli` through `dotnet tool install` into `$HOME/.aspire/bin` with `ASPIRE_CLI_VERSION: "13.4.4"`.
- Runtime job adds `$HOME/.aspire/bin` to `GITHUB_PATH` and preflights `aspire --version` with a `13.4.*` guard.

## Final Summary

Validated locally: full scaffold runtime and all requested Deno-only scaffold suites are green on the local toolchain.

Needs CI confirmation: GitHub Actions `ubuntu-latest` execution of the updated `scaffold-runtime` job, especially .NET 10 setup plus `dotnet tool install Aspire.Cli --version 13.4.4`.

## Push Evidence

| Commit | Push | Notes |
| --- | --- | --- |
| `207c1112` | PASS | `git push origin HEAD:refs/heads/ci/e2e-cli-gate` advanced branch `66b8476c..207c1112`. |
