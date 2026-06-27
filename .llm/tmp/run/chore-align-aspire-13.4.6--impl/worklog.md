# Worklog - Aspire-core 13.4.6 alignment

## Design

- Public surface: no new exported TypeScript symbols or CLI commands.
- Domain vocabulary: Aspire-core pins are first-party Aspire CLI/SDK and `Aspire.Hosting.*`
  integrations; CommunityToolkit pins are separate and excluded from Goal A.
- Ports/adapters: unchanged.
- Constants: `SCAFFOLD_VERSIONS.ASPIRE_SDK`,
  `SCAFFOLD_ASPIRE_INTEGRATIONS.{POSTGRES,MYSQL,MSSQL,REDIS}`, and CI/toolchain Aspire CLI pins.
- Generated outputs: TypeScript AppHost `aspire.config.json` SDK and package versions.
- Commit slice: one scoped implementation commit plus harness artifacts and debt entry.
- Deferred scope: CommunityToolkit Deno/SQLite TypeScript AppHost re-enable.
- Contributor path: future scaffold version changes should update scaffold constants first, then
  generated-config tests and docs/examples that show generated `aspire.config.json`.

## Commands and Evidence

| Step | Command | Result |
| --- | --- | --- |
| Pre-flight | `git fetch origin main` | pass; `HEAD` equals `origin/main` at `0273d10c7417353b1d94f8efe44fbd90c6a8f795` |
| Pre-flight | `git status --short --branch` | pass; only pre-existing OpenHands `request.md` line-ending drift |
| Research | `aspire --version` | pass; `13.4.6+87fe259e4fc244c599019a7b1304c85a1488f248` |
| Research | `aspire docs search deno` / `aspire docs get deno-integration` | pass; Deno CommunityToolkit TS AppHost APIs still unavailable |
| Research | `aspire integration search deno` | pass; `CommunityToolkit.Aspire.Hosting.Deno` is `13.4.0` |
| Research | `aspire docs get get-started-with-the-sqlite-integrations` / `set-up-sqlite-in-the-apphost` | pass; SQLite hosting is C#-only for AppHost APIs |
| Research | `aspire integration search sqlite` | pass; `CommunityToolkit.Aspire.Hosting.Sqlite` is `13.4.0` |
| Research | `aspire integration search postgres/mysql/sqlserver/redis` | pass; Aspire-core integrations are `13.4.6` |

## Version Sweep

- `rtk grep -n "13\.4\.4" . --glob '!**/node_modules/**' --glob '!**/.git/**'`:
  zero matches. No Aspire-core `13.4.4` literal remains.
- `rtk grep -n "13\.4\.0" . --glob '!**/node_modules/**' --glob '!**/.git/**'`:
  two matches, both intentional CommunityToolkit-version-line constants:
  `SCAFFOLD_VERSIONS.ASPIRE_HOSTING_DENO` and
  `SCAFFOLD_VERSIONS.ASPIRE_HOSTING_SQLITE`.

## Gate Results

| Gate | Command | Result |
| --- | --- | --- |
| Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | pass; 524 files selected, 0 diagnostics |
| Lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` | nonzero wrapper result, but report had 0 lint occurrences; root `deno.json` excludes `packages/cli/` from lint |
| Lint focused | `deno lint --no-config packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts` | pass; checked 3 touched CLI TS files |
| Fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | nonzero wrapper result, but report had 0 findings; root `deno.json` excludes `packages/cli/` from fmt |
| Fmt scoped docs/CI check | `deno fmt --check --permit-no-files ...` on touched CLI/docs/CI files | nonzero due broad pre-existing markdown/YAML formatter drift in touched docs/workflows; no mutating broad formatting applied |
| Unit tests | `deno test --allow-all packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts packages/cli/src/kernel/constants/version-drift_test.ts` | pass; 2 tests, 2 steps passed |
| Scaffold version stability | `deno task check:scaffold-versions` | pass; 10 scaffold pins stable |
| E2E attempt 1 | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | fail; exit 1, passed=10 failed=1, `database.init` failed to bind `https://127.0.0.1:18891`; generated config restored Aspire SDK/package `13.4.6` |
| E2E attempt 2 | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | fail; exit 1, passed=10 failed=1, same `database.init` fixed-port bind failure on `https://127.0.0.1:18891`; `ss` and `aspire ps` showed no WSL listener/AppHost after cleanup |
