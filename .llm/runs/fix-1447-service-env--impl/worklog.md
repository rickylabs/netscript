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
### Slice 1 — RED (`21cf655f5`)

`packages/cli/.../tests/service-environment_test.ts`. Starts at the appsettings text, parses with
the real parser, asserts on generated output.

| Gate | Result |
| --- | --- |
| `deno test --allow-all --unstable-kv <file>` | **FAIL** — `0 passed (3 steps) | 2 failed (7 steps)`, exit 1 |
| same, with type-checking | **FAIL** — `TS2339: Property 'Env' does not exist on type 'ServiceEntry'` |

The 3 already-passing steps are determinism, "no declared environment emits nothing", and the
existing plugin `Environment` path — kept so slices 2–3 cannot regress them.

Reconcile note: #1447 read live (`gh issue view 1447`); labels `status:plan` on the issue, PR #1449
opened draft with `status:impl`, milestone 0.0.6, `Closes #1447` in the body. No new comments on
#1447 since the run brief. No plan readjustment.

### Slice 2 — contract (`Environment` + deprecated `Env` on both entries)

`packages/aspire/config.ts` — private `EnvironmentFields` Zod shape spread into `ServiceEntryZod`
and `PluginEntryZod`; interface members declared inline on `ServiceEntry` and `PluginEntry` (no new
exported symbol, so the `deno doc`-generated reference tables are unaffected).
`packages/aspire/tests/config_test.ts` — 5 new steps: service `Environment`, service `Env` alias,
plugin `Env` alias, and a non-string value rejected.

| Gate | Result |
| --- | --- |
| `deno test --allow-all --unstable-kv packages/aspire` | **PASS** — `19 passed (72 steps) | 0 failed` |

### Slice 3 — generator (shared resolver, services emission, plugins routed through it)

New `register/resolve-resource-environment.ts` (`resolveResourceEnvironment` +
`renderDeclaredEnvironmentLines`). Services emit the declared block after the health probe and
**before** OTel/database. The plugin generator's inline `entry.Environment` read is replaced by the
same renderer, so both kinds emit byte-identical shapes and the existing plugin assertion in
`generators-service-plugin_test.ts` is untouched and still green.

| Gate | Result |
| --- | --- |
| `deno test --allow-all --unstable-kv packages/cli` | **PASS** — `718 passed (505 steps) | 0 failed (1m31s)`, exit 0 |
| `run-deno-check.ts --root packages/cli` | **PASS** — 837 files, 0 occurrences, exit 0 |
| `run-deno-lint.ts --root packages/cli` | **PASS** — 837 files, 0 occurrences, exit 0 |
| `run-deno-check.ts --root packages/aspire` | **PASS** — 45 files, 0 occurrences |
| `run-deno-fmt.ts --root packages/cli` / `--root packages/aspire` | **PASS** — 0 findings |

Slice review (Tier-A): generated block inspected by eye for a service declaring `Env` — the block
sits after `withHttpHealthCheck` and before `buildOtelEnvVars`, binds `configuredEnvironment`, and
loops `withEnvironment`. `deno.lock` unchanged.

Reconcile note: no new issue/PR comments; no drift beyond the entries already recorded.

### Slice 4 — executing runtime test

`tests/service-environment-runtime_test.ts`. Writes the generated `register-services.mts` to a temp
dir beside doubles for its two relative value imports (`../.aspire/modules/aspire.mts`,
`./_aspire-compat.mts`), imports it, runs `registerServices(...)` against a recording builder, and
reduces the recorded `withEnvironment` calls last-write-wins. Then spawns a real `deno` process with
the resolved map and asserts the child reads the declared values back out of its own environment.

Why executed rather than string-matched: the precedence rule is a claim about `withEnvironment`
being last-write-wins. A test comparing string offsets would keep passing if that stopped being
true; this one fails.

| Gate | Result |
| --- | --- |
| `deno test --allow-all --unstable-kv .../helpers/tests/` | **PASS** — `22 passed (188 steps) | 0 failed` |
| `run-deno-fmt.ts --root packages/cli` | **PASS** — 838 files, 0 findings |
| `run-deno-lint.ts --root packages/cli` | **PASS** — 838 files, 0 occurrences |

Slice review (Tier-A): no `any`, no casts — the dynamic import is narrowed by an `in`-based type
guard; temp dirs removed in a `finally` after the module graph resolves.

Reconcile note: no new issue/PR comments; no plan readjustment.

### Slice 5 — E2E: declared environment on the consumer path, verified on the live AppHost

Two gates plus a shared contract module, so the fixture and the verifier cannot drift apart:

- `service-env-contract.ts` — the declared entries and the deliberately stale `DATABASE_URL`.
- `configure-service-env.ts` (`runtime.service-env-fixture`) — writes `Env` (the deprecated
  spelling, because that is what #1447 reported) into the scaffolded `appsettings.json`, runs
  `netscript generate aspire` **twice**, asserts the whole `aspire/.helpers` directory is
  byte-identical across the two runs, and asserts the declared pairs reached the generated helper.
  Nothing under `aspire/.helpers/**` is hand-edited.
- `service-env-evidence.ts` + `verify-service-env.ts` (`behavior.service-env`) — reads the live
  topology via `aspire describe --format Json`, asserts the running resource carries the declared
  entries, that `DATABASE_URL` is the allocated value and not the declared stale one, and that the
  resource is not in a terminal state (the #1447 symptom: `Finished` within a second).
- `service-env-evidence_test.ts` — 9 cases pinning the gate's failure modes (record- and
  array-shaped environment, DCP-suffixed instance id, missing entries, inverted precedence,
  terminal state as string and as object, absent resource, non-JSON output).

**Ordering correction found during the slice review.** The fixture was first placed beside the
other pre-start fixtures. That is wrong: `generate aspire` rewrites *every* helper, and both
`runtime.flow-b-fixture` and `runtime.readiness-fixture` hand-patch a generated helper — running
after them would have silently erased their patches and broken unrelated gates. Moved to
immediately after `runtime.aspire-restore`, which also puts the generated environment block under
the `generated.*` check/lint/fmt gates. The invariant is now asserted in `suite-registry_test.ts`
rather than left to placement.

| Gate | Result |
| --- | --- |
| `deno test --allow-all --unstable-kv packages/cli/e2e` | **PASS** — `183 passed | 0 failed (20s)` |
| `run-deno-check.ts --root packages/cli` | **PASS** — 843 files, 0 occurrences |
| `run-deno-lint.ts --root packages/cli` | **PASS** — 843 files, 0 occurrences |
| `run-deno-fmt.ts --root packages/cli` | **PASS** — 843 files, 0 findings |
| fixture script smoke (arg validation, bad mode, missing service, patch step) | **PASS** — each path fails with its own message; the patched `appsettings.json` carries the declared `Env` |

Reconcile note: no new issue/PR comments. `plan.md` slice 5 amended in effect by the ordering
correction above; recorded here rather than as drift because it is a placement decision inside the
slice, not a divergence from the plan's intent.
