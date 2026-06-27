# Research - Aspire-core 13.4.6 alignment and CommunityToolkit Deno/SQLite review

## Scope

- Surface: `packages/cli` scaffold constants/templates plus CI/toolchain pins and Aspire docs.
- Archetype: 6 - CLI/tooling. This slice changes scaffold constants and generated AppHost config,
  not the CLI command vocabulary or public TypeScript exports.
- Goal A is guaranteed: align first-party Aspire CLI/SDK and `Aspire.Hosting.*` integration pins to
  13.4.6.
- Goal B is conditional: re-enable CommunityToolkit Deno/SQLite hosting only if the TypeScript
  AppHost integration is clean and provable.

## Pre-flight baseline

- Branch: `chore/align-aspire-13.4.6`.
- `HEAD`: `0273d10c7417353b1d94f8efe44fbd90c6a8f795`.
- `origin/main`: `0273d10c7417353b1d94f8efe44fbd90c6a8f795`.
- No upstream was configured for the branch.
- Existing dirty files are only `.llm/tmp/run/openhands/**/request.md` line-ending drift. They are
  unrelated and must remain unstaged.

## Goal A findings

- `.github/toolchain.env` still pinned the OpenHands/bootstrap Aspire CLI to `13.4.0` and SDK to
  `13.4.4`.
- GitHub E2E workflows pinned the Aspire CLI to `13.4.4`; `e2e-cli-prod-local.yml` also had the same
  Aspire-core pin and was included because it is part of the same CI toolchain family.
- `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` pinned `ASPIRE_SDK` to
  `13.4.4`.
- `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts` pinned
  `Aspire.Hosting.PostgreSQL`, `Aspire.Hosting.MySql`, `Aspire.Hosting.SqlServer`, and
  `Aspire.Hosting.Redis` to `13.4.4`.
- `generate-aspire-config.ts` already references `SCAFFOLD_VERSIONS` and
  `SCAFFOLD_ASPIRE_INTEGRATIONS`; no hardcoded Aspire-core `13.4.4` literal remained there.
- `generate-aspire-config_test.ts` asserted the generated DB integration package versions as
  `13.4.4`.
- `docs/site/how-to/deploy-local-aspire.md` and `docs/site/explanation/aspire.md` contained
  generated `aspire.config.json` examples with Aspire-core `13.4.4`.
- No checked-in `my-app/aspire/aspire.config.json` fixture exists in this worktree.

## Aspire CLI and integration version evidence

- Local `aspire --version`: `13.4.6+87fe259e4fc244c599019a7b1304c85a1488f248`.
- `aspire integration search postgres`: `Aspire.Hosting.PostgreSQL` version `13.4.6`.
- `aspire integration search mysql`: `Aspire.Hosting.MySql` version `13.4.6`.
- `aspire integration search sqlserver`: `Aspire.Hosting.SqlServer` version `13.4.6`.
- `aspire integration search redis`: `Aspire.Hosting.Redis` version `13.4.6`.
- `aspire docs get whats-new-in-aspire-134` confirms TypeScript AppHosts are GA in Aspire 13.4 and
  generated SDK modules moved under `.aspire/modules/`.

## Goal B findings

- The workaround lives in:
  - `SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT` in
    `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts`.
  - `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template`.
  - Generated helper/register files that import `_aspire-compat.mjs`.
  - Register generators that create Deno resources with `builder.addExecutable(...)` instead of
    CommunityToolkit `addDenoApp(...)` or `addDenoTask(...)`.
- `generate-aspire-config.ts` documents the original reason: the CommunityToolkit Deno NuGet had
  `[AspireExport]` APIs, but Aspire 13.2 skipped external NuGet exports for TypeScript AppHost SDK
  generation, producing dead imports.
- Current Aspire docs still block a clean re-enable:
  - `aspire docs get deno-integration` states that TypeScript AppHost support for the Deno hosting
    integration is not yet available.
  - The same doc states that `CommunityToolkit.Aspire.Hosting.Deno` does not currently expose
    `addDenoApp` or `addDenoTask` APIs in the TypeScript SDK.
  - `aspire integration search deno` reports `CommunityToolkit.Aspire.Hosting.Deno` version
    `13.4.0`.
- SQLite is also not cleanly re-enableable in a TypeScript AppHost:
  - `aspire docs get get-started-with-the-sqlite-integrations` states the SQLite hosting
    integration is C#-only and TypeScript AppHost has no `addSqlite` API.
  - `aspire docs get set-up-sqlite-in-the-apphost` says TypeScript AppHost should use
    `builder.addConnectionString(...)` with a parameter for SQLite file references.
  - `aspire integration search sqlite` reports `CommunityToolkit.Aspire.Hosting.Sqlite` version
    `13.4.0`.

## Decision

Goal B is deferred. The correct CommunityToolkit line for Aspire 13.4 is `13.4.0`, but the Deno and
SQLite hosting integrations still lack the required TypeScript AppHost APIs. Re-enabling them would
not be a small swap; it would require a dedicated design for generated TypeScript SDK availability,
SQLite parameter/connection-string modeling, and scaffold.runtime proof. Goal A proceeds
independently.
