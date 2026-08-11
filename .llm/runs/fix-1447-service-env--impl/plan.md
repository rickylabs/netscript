# Plan — #1447 `Services[].Env`

Issue: rickylabs/netscript#1447 (P0, milestone 0.0.6). Branch `fix/1447-service-env`, baseline
`2256a67bf`. Separate PR from #1444.

## Archetype and doctrine verdict

- `packages/aspire` — **ARCHETYPE-2 (contract/data package)**: Zod schemas + plain-data interfaces,
  no I/O beyond `parseAppSettings`. The change is two optional fields on two entry interfaces.
- `packages/cli` — **ARCHETYPE-6 (CLI tooling)**, scope overlay **SCOPE-service.md**: the change is
  inside the Aspire helpers code generator and its E2E runtime gates.

  **Correction (IMPL-EVAL cycle 1, F4).** This plan originally recorded A4 for `packages/cli`. That
  was wrong: `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` is the governing profile for this
  package, and it is stricter in the two places this run touches — F-CLI-2 (hard 500-LOC cap on any
  `.ts` outside `kernel/assets/`) and F-CLI-25/F-16 (≤ 12 immediate children per directory). Both were
  re-measured against A6 after the correction; see § A6 gate evidence.
- Doctrine verdict (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`) is unchanged by
  this run. Debt: `scaffold-runtime-a8-f16-1333` is **not** deepened (measured, see its stop-condition
  note), and one new entry — `aspire-config-length-1447` — records `packages/aspire/config.ts` going
  812 → 855 lines. No existing entry is closed.

## A6 gate evidence (`packages/cli`)

The F-CLI-* gates have no dedicated script (`gates/fitness-gates.md`): they are recorded as
`PENDING_SCRIPT` with manual/structural evidence, backed by the mechanical `arch:check`.

| Gate                                    | Result                                                                                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static (`check`, `lint`, `fmt:check`)   | PASS — scoped wrappers over `packages/cli`: 848 files, 0 occurrences / 0 findings                                                                                 |
| F-CLI-2 (500-LOC hard cap)              | PASS as measured — the largest file this run adds is `service-environment-runtime_test.ts` at **499** lines; it was 536 and was trimmed rather than accepted as debt |
| F-CLI-25 / F-16 (≤ 12 children)         | PASS for the added directory — `gates/scaffold/service-env/` holds **12** files, **exactly at** the 12-child cap rather than inside it (measured at head; the remediation slices added `gate-permission-probe.ts` and `service-env-gates_test.ts` after this table first said 10). **Stop condition:** the directory is full — a thirteenth file, or a sibling directory, requires the owed `runtime-gates.ts` split first. The pre-existing over-cap scaffold directory is unchanged at 43 + 1 subdirectory       |
| F-CLI-22 (`.template` under assets)     | PASS — no template file added or moved                                                                                                                            |
| F-CLI-23 (no ≥ 20-line backtick string) | PASS — generated source is assembled line-by-line, as the neighbouring generators do                                                                              |
| F-CLI-26 (console.\* placement)         | PASS — the two gate scripts use `console.info`, matching every existing E2E gate entrypoint; no `console.log/error/warn` added                                     |
| F-CLI-16 (`Deno.*` placement)           | PENDING_SCRIPT, unchanged surface — E2E gate entrypoints under `e2e/**` call `Deno.Command`/`Deno.readDir` directly, which is the established shape of that harness (it is a test surface, not the published CLI); no `Deno.*` call was added under `src/public/**` or `src/kernel/**` |
| Mechanical `arch:check`                 | PASS — exit 0, no new failure (see worklog slice 10)                                                                                                               |
| Runtime gates (A6 §4)                   | Required and provided: `runtime.service-env-fixture` + `behavior.service-env`; the owner runs the one-pass `scaffold.runtime` suite                               |
| Consumer gates (A6 §5)                  | Required and provided: the fixture regenerates through the real CLI on the scaffolded project and byte-compares two passes                                          |

## PLAN-EVAL

`PLAN-EVAL: N/A`. The issue body supplies the contract, the reproduction, the acceptance criteria
and the gate set; the only genuinely open decisions (naming, precedence) are decided below against
existing in-repo precedent rather than against an open design space, and both are covered by tests
that would fail if the decision were reversed. Recording the reason here per `run-loop.md` §4 before
any implementation slice.

## Locked decisions

### D1 — `Environment` is canonical; `Env` is a deprecated alias; both exist on services **and** plugins

`Environment` is the shipped name (schema, generated JSON Schema, `preservePluginEnvironment`, the
auth plugin config writer). Renaming it would break every consumer that already writes it. `Env` is
what #1447 reports and what its acceptance criteria name, and today it is silently stripped by Zod —
accepted-looking, no effect.

Both names therefore exist, and the split is closed rather than left undocumented:

- `Environment?: Readonly<Record<string, string>>` — canonical, on `ServiceEntry` **and**
  `PluginEntry`.
- `Env?: Readonly<Record<string, string>>` — `@deprecated`, read **only when `Environment` is
  absent**, on `ServiceEntry` **and** `PluginEntry`.

This is the exact shape of the existing `HostPort` / `Port` pair (`config.ts:124-146`), down to the
resolver function and the README section. The alias is added to `PluginEntry` too so the two
resource shapes are byte-for-byte the same contract — that is the parity criterion, satisfied by
construction rather than by documentation of a difference.

Rejected alternatives:

- _Canonical `Env`, deprecate `Environment`_ — inverts the shipped name and forces a migration on
  every existing plugin consumer to fix a service bug.
- _Support `Env` on services only_ — leaves two spellings whose validity depends on the section,
  which is the undocumented split the brief forbids.
- _Support `Env` and reject `Environment` on services_ — same split, opposite direction.

Fields are declared inline on both interfaces rather than extracted into a new exported interface:
`HealthCheckPath` is already declared three times this way, and a new exported symbol would also
require a row in the `deno doc`-generated `docs/site/reference/aspire/index.md` tables (F4).

### D2 — Precedence: declared first, generated last; generated values win a collision

Emission order inside a service's Pass-1 block becomes:

1. `addExecutable` + endpoint + health probe
2. **declared environment** (`Environment` ?? `Env`)
3. OTel / OTLP exporter
4. database provider env, `DATABASE_URL`, engine `databaseEnvKey`, `withReference`/`waitFor`
5. (later, from `wireServiceReferences`) `services__<ref>__http__0`

Aspire's `withEnvironment` is last-write-wins per key, so a declared `DATABASE_URL`,
`OTEL_SERVICE_NAME` or `services__x__http__0` is overwritten by the generated value. Rationale:
those values are **allocated**, not authored — an endpoint URL or a container connection string is
not knowable when `appsettings.json` is written, and letting a stale literal win produces a resource
that points at nothing while the config still looks valid. This is also the precedence the shipped
plugin path already has (F2), so services and plugins do not diverge.

`PORT` is a third case and is called out separately in the docs: it is injected by Aspire's endpoint
allocation (`withHttpEndpoint({ env: 'PORT' })`), not by a generated `withEnvironment` call, so a
declared `PORT` does not control the port the process binds. Consumers pin ports with `HostPort`.

Tested in **both** directions: a non-colliding key survives to the resource; a colliding
infrastructure key is emitted and then overwritten, asserted on the _resolved env map of an executed
registration_, not on source-text order alone.

### D3 — Alias resolution lives in one CLI-internal function

`resolveResourceEnvironment(entry)` in
`packages/cli/src/kernel/templates/aspire/helpers/register/resolve-resource-environment.ts`, beside
`resolveHostPort` in `render-http-endpoint.ts`. Both the services and the plugins generator call it,
so there is exactly one place that knows `Environment` wins over `Env`, and the plugin generator's
inline `entry.Environment` read is replaced by it.

### D4 — The runtime leg has two parts, and neither is a string match

1. **Executing test (this session, in-gate).** Generate `register-services.mts` for a config with
   declared entries, write it to a temp dir with local stubs for `../.aspire/modules/aspire.mts` and
   `./_aspire-compat.mts` (both value imports are relative — F5), `import()` it, run
   `registerServices(...)` against a recording builder, and assert the **resolved** env map. Then
   spawn a real `deno` subprocess with that resolved map and assert the child process reads the
   declared values back out of its own environment — the "a running process observes it" leg.
2. **E2E behavior gate (the supervisor's `scaffold.runtime` run).** A pre-start fixture gate writes
   `Env` + a colliding `DATABASE_URL` into the scaffolded `appsettings.json` and regenerates through
   the real CLI (twice, byte-compared — the determinism criterion, proven on the consumer path); a
   behavior gate then reads the **live** AppHost via `aspire describe --format Json` and asserts the
   running service resource carries the declared values and the generated `DATABASE_URL`.

Neither leg alone proves the whole chain; together they cover config → generator → generated module
→ live resource → process environment. The seam between them (a live Aspire process's own `/proc`
environment) is not asserted by either, and that limit is stated in the PR body rather than papered
over.

## Commit slices

**Actual shape, reconciled after IMPL-EVAL cycle 1 (F5).** The table below was the plan. The branch
does **not** have one commit per row, and the record now says so rather than being back-dated:

| Planned slice                       | Actual commit                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| 1 — RED generator test              | `21cf655f5` (test-only, as planned)                                              |
| 2 — contract (`Environment`/`Env`)   | **combined into `5df14ebc8`**                                                    |
| 3 — generator + shared resolver      | **combined into `5df14ebc8`** — the contract change alone does not type-check against the slice-1 test, so the two were landed together |
| 4 — executing runtime test           | `41cf0075b`                                                                      |
| 5 — E2E fixture + behavior gate      | `fa9ba9573`                                                                      |
| 6 — docs                             | `dbd7cd9d1`                                                                      |

Five commits for six planned slices. The RED-before-implementation ordering is intact; the deviation
is that slices 2 and 3 share a commit. IMPL-EVAL cycle 1 then added four more commits:

| Follow-up slice                                        | Commit      |
| ------------------------------------------------------ | ----------- |
| 7 — F4 no-deepen restructure                           | `b7a5e55e4` |
| 8 — F2 per-category precedence + `PORT` refused        | `2297651c7` |
| 9 — F1/F3 process-level observation + discovery        | `e9d22d9b5` |
| 10 — F4 debt/archetype records + F5 record reconciliation | this commit |

| # | Slice                                                                                                                   | What it proves                                                                    | Gate                                                                                             |
| - | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1 | RED generator test (`service-environment_test.ts`), ≥2 `Services[].Env` entries, precedence, alias, parity, determinism | The defect exists at the generator seam                                           | `deno test packages/cli` **fails**                                                               |
| 2 | Contract: `Environment` + `@deprecated Env` on `ServiceEntry`/`PluginEntry` (+ `packages/aspire` tests)                 | `Env` survives parsing; alias precedence                                          | `deno test packages/aspire`                                                                      |
| 3 | Generator: `resolveResourceEnvironment` + services emission + plugins routed through it                                 | Slice-1 test goes GREEN                                                           | `deno test packages/cli`, check, lint                                                            |
| 4 | Executing runtime test (generated module + recording builder + real subprocess)                                         | A running process observes the declared value; precedence resolves as documented  | `deno test packages/cli`                                                                         |
| 5 | E2E fixture + behavior gate wired into `scaffold.runtime`                                                               | The live AppHost resource carries it; consumer-path regeneration is deterministic | `deno test packages/cli` (suite-registry expectations); the suite itself is the supervisor's run |
| 6 | Docs: `packages/aspire/README.md` "Resource environment" section                                                        | The two spellings and the precedence rule are documented, not folklore            | `deno task quality:scan`, `arch:check`                                                           |

## Risk register

| Risk                                                                                     | Mitigation                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adding `Env` to the Zod schema changes generated `appsettings.schema.json` for consumers | Additive optional field; the alias is marked deprecated in the JSON Schema description so editors steer to `Environment`                                                                                                           |
| Routing plugins through the shared resolver changes existing generated plugin output     | The resolver returns `entry.Environment ?? entry.Env`; for an entry with only `Environment` the emitted text is byte-identical. Asserted by keeping the existing plugin assertion in `generators-service-plugin_test.ts` untouched |
| A new E2E gate breaks the supervisor's `scaffold.runtime` run                            | The fixture gate fails loudly and early (pre-start) rather than mid-run; both gates are provider-neutral so they run in both tiers; suite-registry expectations updated in the same slice                                          |
| `withEnvironment` is not last-write-wins in some Aspire version                          | The executing test asserts the resolved map, so a semantics change fails the test instead of silently inverting precedence                                                                                                         |

## Debt implications

None created. One pre-existing oddity observed but **not** touched: `preservePluginEnvironment`
(`packages/cli/src/kernel/adapters/service/workspace-mutator.ts:181`) re-reads `Environment` from
raw JSON after `parseAppSettings` already parsed it, for plugins only. It is redundant for the
parsed path and has no `Env`/services counterpart. Recorded in `drift.md`; out of scope for a P0
fix.

## Deferred scope

- Backfilling `Env`/`Environment` onto `AppEntry` and `BackgroundProcessorEntry` (neither is
  reported in #1447; background processors carry `ConcurrencyEnvVar` and saga store env by different
  mechanisms).
- Removing the deprecated `Env` alias — a later major-version cleanup, same as `Port`.
- Reconciling `preservePluginEnvironment` with the parsed path.
