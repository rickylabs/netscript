# Worklog — fix-1447-service-env--impl

## Design

### Public surface

- `packages/aspire/config.ts` — `ServiceEntry.Environment`, `ServiceEntry.Env` (deprecated),
  `PluginEntry.Env` (deprecated); `PluginEntry.Environment` already exists and is unchanged in
  meaning. Zod: a module-private `EnvironmentFields` shape spread into `ServiceEntryZod` and
  `PluginEntryZod`, mirroring the existing private `HostPortFields`.
- No new exported symbol in `packages/aspire` (F4) — the `deno doc`-generated reference tables are
  unaffected.
- `packages/cli` internal: `resolveResourceEnvironment(entry)` in
  `src/kernel/templates/aspire/helpers/register/resolve-resource-environment.ts`.

### Domain vocabulary

- `ResourceEnvironmentEntry` — the structural parameter type of the resolver
  (`{ Environment?: Readonly<Record<string,string>>; Env?: Readonly<Record<string,string>> }`).
  Declared in the resolver module, used by both register generators. Not a config-contract type;
  it exists so the resolver does not depend on which entry kind it was handed.

### Ports

None. The resolver is a pure function over plain data; the generators already own their template
rendering port (`renderTemplateAssetSync`).

### Constants

- `DECLARED_ENVIRONMENT_CONST` — the identifier the generated block binds
  (`configuredEnvironment`), already used by the plugin generator; kept as the shared literal so
  services and plugins emit the same shape.
- E2E: `GATE.RUNTIME_SERVICE_ENV_FIXTURE = 'runtime.service-env-fixture'`,
  `GATE.BEHAVIOR_SERVICE_ENV = 'behavior.service-env'`. Service resource name and env keys are
  passed as gate arguments, never hardcoded in the generator.

### Commit slices

See `plan.md` § Commit slices (6 slices). Each slice: gate → Tier-A review → sign-off commit →
push → PR phase comment → worklog/context-pack update.

### Deferred scope

`AppEntry` / `BackgroundProcessorEntry` environment fields; removal of the `Env` alias;
`preservePluginEnvironment` reconciliation. See `plan.md` § Deferred scope.

### Contributor path

A contributor adding "declared config X reaches resource Y" support reads
`resolve-resource-environment.ts` (how an aliased config field is resolved once),
`generate-register-services.ts` (where in the Pass-1 block it is emitted, and therefore what wins),
and `tests/service-environment_test.ts` (what must be asserted: value, target resource, precedence
both directions, determinism).

---

## Slice log

<!-- appended per slice -->
