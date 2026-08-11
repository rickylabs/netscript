# Research — #1447 `Services[].Env` never reaches the generated service resource

Baseline: `2256a67bf` (`origin/main`, 2026-08-11). Worktree `/home/codex/repos/ns-1447-aspire-env`.

## Re-baseline of the carried-in supervisor research

The run brief carried two findings from the supervisor. Both re-verified against `2256a67bf`:

1. **`ServiceEntry` has no environment field at all.** `packages/aspire/config.ts:161-173` declares
   `ServiceEntry` with `Runtime`, `Entrypoint`, `Workdir`, `HealthCheckPath` (plus the shared
   `BaseEntry` / `ReferenceEntry` / `HostPortEntry` fields). The Zod shape at `config.ts:459-467`
   matches. **Confirmed.**
2. **The plugin entry already carries `Environment`.** `packages/aspire/config.ts:221-222`
   (interface) and `:505` (Zod). **Confirmed.**

Both statements needed one correction of emphasis, recorded here because it changes the fix:

- The issue title says the value is "dropped". It is not dropped by the generator — it never
  survives parsing. `AppSettingsZod` is a plain `z.object`, so Zod **strips** the unknown `Env` key
  in `parseAppSettings` (`config.ts:801`). By the time `generateRegisterServices` runs, the key does
  not exist on the entry. `generate-register-services.ts` reads `.Env` zero times, and no code path
  anywhere in the repo reads `Services[].Env`.
- Consequence: a schema-only fix is insufficient and a generator-only fix is impossible. The fix
  must cross both seams (contract → generator), which is the same seam pair as the #952 host-port
  defect (see `packages/cli/src/kernel/templates/aspire/pristine-scaffold-ports_test.ts`, whose
  module docstring records that unit tests on either side of that seam both passed while the defect
  shipped). This run adds the same style of cross-seam regression guard.

## Findings the plan depends on

### F1 — Where the generator would apply it

`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts:47-141`
emits one Pass-1 block per service. The emission order inside a block is:

1. `resolvePermissions(...)`, `resolveWorkspacePath(...)`
2. `builder.addExecutable(...)` + `.withHttpEndpoint({ env: 'PORT' })`
3. `withHttpHealthCheck(...)` (unless `HealthCheckPath === false`)
4. **OTel** — `buildOtelEnvVars(name, config.Version, 'executable')` looped into `withEnvironment`,
   then `withOtlpExporter(...)`
5. **Database** — `databaseProviderEnv` loop, then `DATABASE_URL` (+ the engine-specific
   `databaseEnvKey`), then `withReference` / `waitFor`
6. `services.set(name, resource)`

Service-discovery variables (`services__<ref>__http__0`) are written later still, by
`wireServiceReferences(...)` in the template asset
(`packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-services-1.ts.template:64-87`),
which the AppHost calls after plugins exist.

### F2 — The plugin generator already solved this, one file over

`generate-register-plugins.ts:100-105` emits, for a plugin with `Environment`:

```ts
const configuredEnvironment = { 'NETSCRIPT_AUTH_BACKEND': 'kv-oauth' };
for (const [key, value] of Object.entries(configuredEnvironment)) {
  await resource.withEnvironment(key, value);
}
```

It is emitted **before** the OTel block (`:124-135`) and before the database block (`:138-168`). So
the shipped plugin precedence is already **declared first, generated last** — i.e. generated
infrastructure/telemetry values win a key collision, because Aspire's `withEnvironment` is
last-write-wins per key. The services fix inherits that rule rather than inventing a second one.

### F3 — The naming split is real and both spellings have a claim

- `Environment` is the shipped, documented name: it is in the Zod schema, therefore in the generated
  `appsettings.schema.json` (`packages/aspire/schema.ts` derives the JSON Schema from
  `AppSettingsSchema`), it is read by
  `packages/cli/src/kernel/adapters/service/workspace-mutator.ts:181-197`
  (`preservePluginEnvironment`) and written by
  `packages/cli/src/public/features/plugins/auth/auth-config.ts:191-207`.
- `Env` is what #1447's consumer wrote and what the issue's acceptance criteria name. It is
  currently silently stripped, which is the worst of both worlds: no error, no effect.

The repo already has a precedent for exactly this shape — `HostPortEntry` (`config.ts:124-146`)
carries `HostPort` plus a `@deprecated` `Port` alias read only when `HostPort` is absent, resolved
by a one-function module (`register/render-http-endpoint.ts:25-27`, `resolveHostPort`) and
documented in a dedicated `packages/aspire/README.md` section ("Host ports").

### F4 — Fields are duplicated per interface in `config.ts`, not extracted

`HealthCheckPath` is declared three times (`ServiceEntry`, `AppEntry`, `PluginEntry`) with the same
JSDoc; shared Zod shapes are module-private consts (`BaseEntryFields`, `ReferenceFields`,
`HostPortFields`). Only `HostPortEntry` is an exported shared interface, and it is re-exported in
`packages/aspire/types.ts:31,51` and listed in the generated `docs/site/reference/aspire/index.md`
symbol tables. Adding a new **exported** interface therefore also means a docs-reference row;
declaring the fields inline on the two entries that need them does not, and matches the
`HealthCheckPath` precedent.

### F5 — What the generated helper actually needs at runtime

`generate-register-services-1.ts.template` imports:

- `../.aspire/modules/aspire.mts` (`SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS`) — one value
  import, `OtlpProtocol`; the builder type is `import type` and erases.
- `./_aspire-compat.mts` — `buildOtelEnvVars`, `buildDatabaseUriEnvKey`,
  `buildDatabaseProviderEnvVars`, `buildSqliteDatabaseUrl`, `resolvePermissions`,
  `resolveWorkspacePath`, `extractServiceReferences`, `extractPluginReferences`.
- `./register-infrastructure.mts` — `import type` only, erases.

Both value imports are **relative paths**, so the generated module can be executed in a temp
directory against local stubs with no import map and no network. That makes an executing test
(rather than a string-matching test) cheap, and it is the only way to observe the _resulting_ env
map — string assertions cannot prove last-write-wins ordering actually resolves the way the
precedence rule claims.

### F6 — The E2E surface for the runtime leg

- Gate ids: `packages/cli/e2e/src/domain/cli-surface.ts` (`GATE`).
- Gate definitions: `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`.
- Suite ordering: `packages/cli/e2e/suites/scaffold/capability-suites.ts:61-152`. The ordered list
  has pre-start fixture gates (`RUNTIME_AUTH_SMOKE_ENV`, `RUNTIME_FLOW_B_FIXTURE`,
  `RUNTIME_READINESS_FIXTURE`) immediately before `RUNTIME_ASPIRE_START`, and behavior gates
  (`BEHAVIOR_SERVICE_HEALTH` at `:117`) after the AppHost is up. `POSTGRES_ONLY_RUNTIME_GATES`
  (`:144-150`) removes provider-specific gates from the SQLite tier.
- `prepare-readiness-fixture.ts` is the model for a pre-start fixture gate; `cli(context, ...)` in
  `gate-factory.ts:17-29` is how a gate re-invokes the local CLI.
- Suite composition is asserted by `packages/cli/e2e/tests/presentation/suite-registry_test.ts` and
  `packages/cli/e2e/tests/application/builders/runtime-gates_test.ts`.

### F7 — Determinism

`JSON.stringify` of the parsed entry preserves `JSON.parse` key order, which is stable for a fixed
`appsettings.json`, so byte-identical regeneration already holds for the plugin path. Nothing in the
services path introduces nondeterminism (no timestamps, no `Math.random`, no Map iteration over a
non-insertion-ordered source). The run still asserts it explicitly, twice-generate + byte-compare,
because the acceptance contract names it.

## jsr-audit surface scan

- `packages/aspire` is a published package. The change adds two optional properties to two exported
  interfaces and two optional Zod fields. No new exported symbol, no new subpath, no inferred (slow)
  type — every added member is explicitly typed `Readonly<Record<string, string>>`.
- `packages/cli` is published but the touched modules (`src/kernel/templates/aspire/helpers/**`) are
  internal (not re-exported from the package barrel); the new resolver module stays internal.
- `appsettings.schema.json` for consumers is derived at runtime from the Zod schema
  (`packages/aspire/schema.ts`), so editor validation/autocomplete picks the new keys up with no
  checked-in artifact to regenerate.

## Open questions closed by the plan

| Question                                                                                 | Resolution                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One name or two?                                                                         | Two, with one canonical: `Environment` canonical, `Env` a `@deprecated` alias, on **both** `ServiceEntry` and `PluginEntry`. See `plan.md` D1.                                              |
| May a declared entry override a generated one?                                           | No. Declared first, generated last, last-write-wins. See `plan.md` D2.                                                                                                                      |
| Where does alias resolution live?                                                        | A CLI-internal resolver module beside `render-http-endpoint.ts`, mirroring `resolveHostPort`. See `plan.md` D3.                                                                             |
| How is "a running service observes it" proven without owning the `scaffold.runtime` run? | Two legs: an executing test over the generated helper + a real subprocess (this session), and an E2E behavior gate over the live AppHost resource (the supervisor's run). See `plan.md` D4. |
