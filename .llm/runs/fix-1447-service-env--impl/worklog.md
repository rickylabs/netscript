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
  Declared in the resolver module, used by both register generators. Not a config-contract type; it
  exists so the resolver does not depend on which entry kind it was handed.

### Ports

None. The resolver is a pure function over plain data; the generators already own their template
rendering port (`renderTemplateAssetSync`).

### Constants

- `DECLARED_ENVIRONMENT_CONST` — the identifier the generated block binds (`configuredEnvironment`),
  already used by the plugin generator; kept as the shared literal so services and plugins emit the
  same shape.
- E2E: `GATE.RUNTIME_SERVICE_ENV_FIXTURE = 'runtime.service-env-fixture'`,
  `GATE.BEHAVIOR_SERVICE_ENV = 'behavior.service-env'`. Service resource name and env keys are
  passed as gate arguments, never hardcoded in the generator.

### Commit slices

See `plan.md` § Commit slices (6 slices). Each slice: gate → Tier-A review → sign-off commit → push
→ PR phase comment → worklog/context-pack update.

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

| Gate                                         | Result                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| `deno test --allow-all --unstable-kv <file>` | **FAIL** — `0 passed (3 steps)                                            |
| same, with type-checking                     | **FAIL** — `TS2339: Property 'Env' does not exist on type 'ServiceEntry'` |

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

| Gate                                                  | Result                           |
| ----------------------------------------------------- | -------------------------------- |
| `deno test --allow-all --unstable-kv packages/aspire` | **PASS** — `19 passed (72 steps) |

### Slice 3 — generator (shared resolver, services emission, plugins routed through it)

New `register/resolve-resource-environment.ts` (`resolveResourceEnvironment` +
`renderDeclaredEnvironmentLines`). Services emit the declared block after the health probe and
**before** OTel/database. The plugin generator's inline `entry.Environment` read is replaced by the
same renderer, so both kinds emit byte-identical shapes and the existing plugin assertion in
`generators-service-plugin_test.ts` is untouched and still green.

| Gate                                                             | Result                                      |
| ---------------------------------------------------------------- | ------------------------------------------- |
| `deno test --allow-all --unstable-kv packages/cli`               | **PASS** — `718 passed (505 steps)          |
| `run-deno-check.ts --root packages/cli`                          | **PASS** — 837 files, 0 occurrences, exit 0 |
| `run-deno-lint.ts --root packages/cli`                           | **PASS** — 837 files, 0 occurrences, exit 0 |
| `run-deno-check.ts --root packages/aspire`                       | **PASS** — 45 files, 0 occurrences          |
| `run-deno-fmt.ts --root packages/cli` / `--root packages/aspire` | **PASS** — 0 findings                       |

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

| Gate                                                     | Result                              |
| -------------------------------------------------------- | ----------------------------------- |
| `deno test --allow-all --unstable-kv .../helpers/tests/` | **PASS** — `22 passed (188 steps)   |
| `run-deno-fmt.ts --root packages/cli`                    | **PASS** — 838 files, 0 findings    |
| `run-deno-lint.ts --root packages/cli`                   | **PASS** — 838 files, 0 occurrences |

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
  array-shaped environment, DCP-suffixed instance id, missing entries, inverted precedence, terminal
  state as string and as object, absent resource, non-JSON output).

**Ordering correction found during the slice review.** The fixture was first placed beside the other
pre-start fixtures. That is wrong: `generate aspire` rewrites _every_ helper, and both
`runtime.flow-b-fixture` and `runtime.readiness-fixture` hand-patch a generated helper — running
after them would have silently erased their patches and broken unrelated gates. Moved to immediately
after `runtime.aspire-restore`, which also puts the generated environment block under the
`generated.*` check/lint/fmt gates. The invariant is now asserted in `suite-registry_test.ts` rather
than left to placement.

| Gate                                                                         | Result                                                                                                     |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `deno test --allow-all --unstable-kv packages/cli/e2e`                       | **PASS** — `183 passed                                                                                     |
| `run-deno-check.ts --root packages/cli`                                      | **PASS** — 843 files, 0 occurrences                                                                        |
| `run-deno-lint.ts --root packages/cli`                                       | **PASS** — 843 files, 0 occurrences                                                                        |
| `run-deno-fmt.ts --root packages/cli`                                        | **PASS** — 843 files, 0 findings                                                                           |
| fixture script smoke (arg validation, bad mode, missing service, patch step) | **PASS** — each path fails with its own message; the patched `appsettings.json` carries the declared `Env` |

Reconcile note: no new issue/PR comments. `plan.md` slice 5 amended in effect by the ordering
correction above; recorded here rather than as drift because it is a placement decision inside the
slice, not a divergence from the plan's intent.

### Slice 6 — documentation and the repo-wide quality gates

`packages/aspire/README.md` gains a **Resource environment** section next to the existing "Host
ports" section it is modelled on: the canonical `Environment` name, the deprecated `Env` alias, and
a table of who wins each key with the reason (allocated vs. authored), including `PORT` as the case
Aspire owns outright.

| Gate                                          | Result                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rtk proxy deno task quality:scan`            | **PASS** — `"ok":true`, 0 findings, 7 pre-existing allowances (none added)                                                                        |
| `rtk proxy deno task arch:check`              | **PASS** — exit 0, no `FAIL=` entries, no aspire findings                                                                                         |
| `deno task docs:readme:check`                 | **PASS for the touched package** — 1/36 non-conformant is the pre-existing `packages/bench/README.md` missing `## Install`, untouched by this run |
| `run-deno-doc-lint.ts --root packages/aspire` | **PASS** — `totalErrors: 0`                                                                                                                       |

Slice review (Tier-A): the added contract members are optional, explicitly typed, and JSDoc'd; the
doc-lint surface is unchanged in error count; no new exported symbol, so the `deno doc`-generated
reference tables need no regeneration.

---

## IMPL-EVAL cycle 1 — `FAIL_FIX` follow-up slices

`evaluate.md` (opposite-family Codex/Sol xhigh, head `dbd7cd9d1`) returned `FAIL_FIX` with F1–F5.
Slices 7–10 below address them. Each is committed, pushed, and commented on #1449 separately.

### Slice 7 — F4 (no-deepen): the #1447 gate surface moves behind one bounded subdirectory

The finding: debt `scaffold-runtime-a8-f16-1333` says the scaffold runtime registry and gate
directory must be split "before the next scaffold runtime gate or probe is added", and this PR is
that next gate — it grew `runtime-gates.ts` 906 → 943 lines and the gate directory 43 → 48 direct
children while reporting no deepened debt.

Fixed in the shape the debt entry's own **Gate** line prescribes (role-named module + bounded
subdirectory), rather than by re-authorizing the growth:

- `runtime-gates.ts` restored byte-for-byte to its baseline content (`git checkout 2256a67bf --`),
  so it is **906 lines again** — the two gate declarations and the `SCAFFOLDED_SERVICE_RESOURCE`
  constant are gone from it, and `behavior.service-health` keeps its original literal argument.
- New `gates/scaffold/service-env/service-env-gates.ts` declares both #1447 gates and is registered
  by `scaffold-capability-gates.ts`. Suite ordering is unaffected: `resolveSuite` orders by the id
  lists in `capability-suites.ts`, and the catalog only has to contain the gate.
- The five #1447 gate files moved into `gates/scaffold/service-env/` via `git mv`, so the scaffold
  gate directory is **44 direct children** (baseline 43 + this one subdirectory) instead of 48.

| Gate                                                       | Result                                             |
| ---------------------------------------------------------- | -------------------------------------------------- |
| `deno test --allow-all --unstable-kv packages/cli`         | **PASS** — exit 0, `729 passed (510 steps)`        |
| `run-deno-check.ts --root packages/cli/e2e --ext ts`       | **PASS** — 155 files, 0 occurrences, exit 0        |
| `run-deno-lint.ts --root packages/cli --ext ts,tsx`        | **PASS** — 844 files, 0 occurrences, exit 0        |
| `run-deno-fmt.ts --root packages/cli --ext ts,tsx`         | **PASS** — 844 files, 0 findings, exit 0           |

Slice review (Tier-A): moves are `git mv` renames plus one import-depth correction; the only
behavioral change is where the gate definitions are constructed. Measured, not asserted:
`wc -l runtime-gates.ts` = 906 and `ls | wc -l` = 44.

### Slice 8 — F2: one authoritative test per documented category, and `PORT` refused

The finding: only `DATABASE_URL` got a declared collision; OTel, provider/engine URI, discovery and
`PORT` had none; discovery was disabled by the double; endpoint options were discarded; and the test
reduced the recorded calls itself, so it could not fail if Aspire's resolution changed.

**Generator change — `PORT` is refused, not overridden.** Every other category resolves through one
mechanism (successive `withEnvironment` calls, last write wins). `PORT` does not: Aspire injects it
from `withHttpEndpoint({ env: 'PORT' })`, so two mechanisms write that key and their relative order
is Aspire-internal. Rather than document an ordering this generator cannot observe, the declared
block now **refuses** `PORT` and names it in a generated comment (silent stripping is the #1447
failure mode, so the omission is visible where the value was written). New
`partitionDeclaredEnvironment` / `ENDPOINT_OWNED_ENVIRONMENT_KEYS` in
`resolve-resource-environment.ts`; services and plugins share it, so parity holds.

**Test change — the authority split is now explicit.** `service-environment-runtime_test.ts` states
which claim each level owns: this file asserts what the generated program *does* (which keys, which
values, in which order — always pinning order, never asserting "Aspire resolves it this way"), and
`behavior.service-env` asserts what the running process ends up with. One `it(...)` per category
from a `PRECEDENCE_CASES` table: plain ×2 (control), OTel, database URL, engine URI, provider,
discovery, `PORT`. Also fixed: `wireServiceReferences` is now executed (discovery was previously
unreachable), endpoint options are recorded (`PORT` was previously discarded), and the double
re-exports the **real** `buildOtelEnvVars` / `extractServiceReferences` /
`extractPluginReferences` from `@netscript/aspire/application` — the module the generated compat file
is a Node copy of — so OTel key names and reference extraction are the shipped ones. The remaining
compat-only stubs derive their values from the config they are handed, as the template does.

**Falsifiability, measured by mutation** (each mutation applied, run, then reverted):

| Mutation                                                                       | Result                                                                       |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `ENDPOINT_OWNED_ENVIRONMENT_KEYS = []` (stop refusing `PORT`)                   | **FAIL** — `PORT must not be assigned at all; the endpoint binding owns it`   |
| move the declared block *after* the OTel/database emission (invert precedence)  | **FAIL** — OTel, database URL, engine URI, provider cases all fail            |
| break the discovery key in the embedded generated template                      | **FAIL** — `services__reports__http__0 kept its declared literal`             |

The inverted-order mutation leaves the discovery case green, which is correct and worth naming: Pass
2 runs after all of Pass 1 regardless of where inside Pass 1 the declared block sits, so discovery is
falsified by the third mutation instead of the second. Both were run rather than assumed.

| Gate                                                    | Result                                              |
| ------------------------------------------------------- | --------------------------------------------------- |
| `deno test --allow-all --unstable-kv packages/cli`      | **PASS** — exit 0, `731 passed (520 steps)`         |
| `deno test --allow-all --unstable-kv packages/aspire`   | **PASS** — exit 0, `19 passed (72 steps)`           |
| `run-deno-check.ts --root packages/cli --ext ts,tsx`    | **PASS** — 844 files, 8 batches, 0 occurrences      |
| `run-deno-lint.ts --root packages/cli --ext ts,tsx`     | **PASS** — 844 files, 0 occurrences                 |
| `run-deno-fmt.ts --root packages/cli` / `packages/aspire` | **PASS** — 844 and 45 files, 0 findings            |
| `deno fmt --check packages/aspire/README.md`            | **PASS** after formatting the widened table          |

Slice review (Tier-A): no `any`/cast/suppression added; the refusal list is a typed
`readonly string[]` over `RESOURCE_DEFAULTS.PortEnvVar`, not a literal; README now documents the rule
per category with `PORT`'s different rule and its reason called out separately.

### Slice 9 — F1 + F3: process-level observation, discovered identity, explicit health

The findings: the gate proved only that the resource *model* held the values (`aspire describe`), it
accepted a missing state and every non-terminal state, and both the fixture and the verifier were
handed the literal `users`.

**F1a — process-level evidence.** New `process-evidence.ts` reads `/proc/<pid>/environ`, which the
kernel writes at exec time from the environment the parent handed over. A process is bound to a
resource by two independent facts: its `/proc/<pid>/cwd` is the workdir the generated registration
passed to `addExecutable`, **and** its own environment carries `OTEL_SERVICE_NAME` equal to the
resource name — a value the AppHost injects, so a hand-started `deno run` in the same directory does
not qualify. `requireResourceProcesses` fails when nothing is identified and reports the counts
(`examined`, `workdirMatches`, `identified`), so "nothing ran there" and "something ran there but was
not the resource" are different messages instead of an empty loop. Linux-only, and it throws by name
on any other platform rather than degrading — the CLI E2E suites run on `ubuntu-latest` in CI and
under WSL locally.

**F1b — explicit healthy state.** The verifier now runs `aspire wait <resource> --status healthy
--timeout 180` first, for every discovered subject: the AppHost's own verdict, not a state-string
denylist. The describe state check became an **allowlist** (`Running`/`Healthy`); `Starting`,
`Waiting`, `Stopped`, `Unhealthy` and unknown spellings now fail. Healthiness is proven before
anything reads the topology, so a still-starting resource is reported as a timing failure rather than
as a precedence one.

**F3 — discovery, and a negative discovery test.** New `discover-service-subjects.ts` reads the
generated `appsettings.json`: the fixture asks it which service to declare on (deterministic, enabled
only), the verifier asks it which services *did* declare. No gate takes a service name any more, and
`runtime-gates.ts` keeps its original literal for the pre-existing `behavior.service-health` gate
rather than acquiring a shared constant. `discoverDeclaringSubjects` **throws** when nothing declares
an environment, and `collectProcessFailures` **throws** on an empty case list; the verifier also
refuses a case list that does not cover all three rules. Every per-category expectation is derived
from the same topology on both sides, so there is no handoff file to fall out of date.

**Executed evidence** (each run, not asserted):

| Check                                                                        | Result                                                                                 |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `deno test .../service-env/`                                                 | **PASS** — 36 tests, 0 failed                                                           |
| real `/proc` read: child spawned with a cwd + injected identity, then scanned | **PASS** — the scan found the child by pid and read `NETSCRIPT_E2E_SERVICE_MODE=http` out of the kernel's record |
| mutation: `identifiesResource` made unconditional                            | **FAIL** — 2 tests, including the real-`/proc` one (the resource-identity half is load-bearing) |
| fixture smoke on a synthetic project + stub CLI rendering the real generator  | **PASS** — discovered `users`, wrote all 8 category keys, added the self-reference, refused `PORT` |
| fixture negative: generator applies nothing                                  | **FAIL** — `regenerated helpers do not apply declared Services.users.Env entries: …`    |
| fixture negative: generator applies the refused `PORT`                        | **FAIL** — `PORT was applied with the declared value 59147; PORT was dropped without saying so` |
| fixture negative: non-deterministic generator                                | **FAIL** — `regeneration is not deterministic — … register-services.mts`                |
| verifier negative: project where nothing declares env                        | **FAIL, exit 1** — `refuses to pass by matching nothing` (before `aspire` is invoked)   |

| Gate                                                    | Result                                         |
| ------------------------------------------------------- | ---------------------------------------------- |
| `deno test --allow-all --unstable-kv packages/cli`      | **PASS** — exit 0, `758 passed (520 steps)`    |
| `run-deno-check.ts --root packages/cli --ext ts,tsx`    | **PASS** — 848 files, 8 batches, 0 occurrences |
| `run-deno-lint.ts --root packages/cli --ext ts,tsx`     | **PASS** — 848 files, 0 occurrences            |
| `run-deno-fmt.ts --root packages/cli --ext ts,tsx`      | **PASS** — 848 files, 0 findings               |

**Known limit, stated rather than hidden.** The process-evidence leg needs `/proc`, so the
`behavior.service-env` gate is Linux-only and says so loudly on other platforms. The suites already
run Linux-only in CI; no fallback was added because a fallback here would be a check that cannot
fail.

Slice review (Tier-A): no `any`, no casts, no suppressions; all JSON reading goes through `isRecord`
guards with typed throws. The one deliberate oddity is the fixture adding a **self**
`ServiceReferences` entry when the discovered subject references nothing — recorded in the module doc:
skipping the service-discovery category would have left a documented rule untested on the live path.

### Slice 10 — F4 records + F5 reconciliation, measured rather than asserted

**Archetype (F4).** `plan.md` recorded A4 for `packages/cli`; the governing profile is
`ARCHETYPE-6-cli-tooling.md`. Corrected in place with the correction called out rather than
overwritten, and the A6 gate evidence table added — including the two A6-specific gates that actually
bite here, F-CLI-2 (500-LOC hard cap) and F-CLI-25/F-16 (≤ 12 children).

Measuring against A6 found a violation this run had introduced and nobody had flagged:
`service-environment-runtime_test.ts` was **536 lines**. Trimmed to **499** by compressing prose and
moving the per-category rationale to the README (which is where the owner's "document why per
category" requirement lives) — not accepted as debt. Every other file this branch adds or touches is
under 500; the one remaining over-cap file is `packages/aspire/config.ts`.

**Debt (F4).** Both entries are measured, not asserted:

| Entry                           | State                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scaffold-runtime-a8-f16-1333`  | **not deepened** — a stop-condition encounter note records `runtime-gates.ts` at 906 lines (byte-identical to baseline) and 44 direct children (43 + one bounded subdirectory), against the 943/48 measured in cycle 1. Stays **open**: the pre-existing over-cap registry is untouched, so the split is still owed. |
| `aspire-config-length-1447` (new) | `packages/aspire/config.ts` **812 → 855** lines against the 500-line cap. Owner, target ("before the next contract member is added"), rationale, linked run/issue/PR, and a split gate recorded. |

**History (F5).** `plan.md` § Commit slices now carries an actual-shape table: five commits for six
planned slices, with slices 2 and 3 sharing `5df14ebc8` and why (the contract change alone does not
type-check against the slice-1 test). Nothing was back-dated; the four follow-up commits are listed
with their hashes. `context-pack.md` had already recorded the 2–3 combination — the plan table was the
artifact that disagreed, and it is the one that changed. `drift.md` gains three entries: the `PORT`
rule amendment, the archetype correction with its measured consequence, and the Linux-only limit of
the process-evidence gate.

| Gate                                                  | Result                                                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `deno test --allow-all --unstable-kv packages/cli`    | **PASS** — exit 0, `758 passed (520 steps)`                                            |
| `deno test --allow-all --unstable-kv packages/aspire` | **PASS** — exit 0, `19 passed (72 steps)`                                              |
| `run-deno-check.ts --root packages/cli --ext ts,tsx`  | **PASS** — 848 files, 0 occurrences, exit 0                                            |
| `run-deno-lint.ts --root packages/cli --ext ts,tsx`   | **PASS** — 848 files, 0 occurrences, exit 0                                            |
| `run-deno-fmt.ts --root packages/cli --ext ts,tsx`    | **PASS** — 848 files, 0 findings, exit 0                                               |
| `rtk proxy deno task quality:scan`                    | **PASS** — exit 0, `"ok":true`, 0 findings, 7 pre-existing allowances (none added)      |
| `rtk proxy deno task arch:check`                      | **PASS** — exit 0, no `FAIL=` entry, no `aspire` finding                                |
| `git diff --exit-code origin/main...HEAD -- deno.lock` | **PASS** — exit 0, lock unchanged                                                      |

Slice review (Tier-A): `arch-debt.md` is not deno-fmt-clean on `main` (verified: `deno fmt --check`
exits 1 at baseline), so only the added blocks were wrapped to the repo's 100-column width; the file
was not reformatted, which would have produced unrelated churn.

## Cycle-1 finding → evidence index

| Finding                              | Where it is answered                                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| F1 — gate never proved observation   | slice 9: `aspire wait --status healthy`, `Running`/`Healthy` allowlist, `/proc/<pid>/environ` read of the AppHost-started process |
| F2 — precedence model owned by tests | slice 8: one executed test per category, real `@netscript/aspire` helpers, `wireServiceReferences` executed, endpoint options recorded, `PORT` refused; live process is the resolution authority |
| F3 — hardcoded resource              | slice 9: `discover-service-subjects.ts`; both gates take no service name; negative discovery throws and is tested     |
| F4 — debt deepened past stop condition | slice 7 (measured non-deepening) + slice 10 (stop-condition note, new aspire entry, A6 correction + gate evidence)  |
| F5 — record vs. history              | slice 10: actual slice/commit table in `plan.md`, no back-dating                                                      |

## Slice 11 — the gate command's permissions are proven, not declared

**Trigger.** The run supervisor executed the full `scaffold.runtime` at `48bee97b2`:
`62 passed; behavior.service-env FAILED; cleanup passed`, with
`NotCapable: Requires all access to /proc`. A bounded, real gate failure — the gate was registered
with a permission set nobody had verified, and it could not fail until an AppHost was running.

### The refused call, measured

Reproduced in isolation on Deno 2.9.5 before changing anything. Every `/proc` call
`process-evidence.ts` makes is refused under the shipped flags, not just one:

| Call                                | Under `--allow-read`                                        |
| ----------------------------------- | ------------------------------------------------------------ |
| `Deno.readDir('/proc')`             | `NotCapable: Requires all access to "/proc"`                 |
| `Deno.readLink('/proc/self/cwd')`   | `NotCapable: Requires all access to "/proc/self/cwd"`        |
| `Deno.readFile('/proc/self/environ')` | `NotCapable: Requires all access to "/proc/self/environ"`  |
| `Deno.realPath('/proc/self')`       | `NotCapable: Requires all access to "/proc/self"`            |

The first refusal in the gate is `Deno.realPath(workdir)` → `Deno.readDir('/proc')` at
`process-evidence.ts:106,111`. Deno gates `/proc` on `check_all` rather than on read permission,
because `/proc/<pid>/environ` would otherwise leak another process's environment — and its own
environment — to a program holding only `--allow-read`, defeating `--allow-env`.

### Why the narrow set genuinely cannot work

Measured, not assumed. Each row is a real `deno run` against the same probe:

| Permission set                                                        | `/proc` readable |
| --------------------------------------------------------------------- | ---------------- |
| `--allow-read`                                                        | no               |
| `--allow-read=/proc` (scoped to the exact path)                        | no               |
| `--allow-read --allow-env` / `--allow-sys` / `--allow-run`             | no               |
| `--allow-all --deny-write` (any `--deny-*` at all)                     | no               |
| all eight units unscoped, no `--allow-all` flag                        | **yes**          |
| `--allow-all`                                                         | **yes**          |

Leave-one-out across the eight units: dropping **any one** of read, write, net, env, run, sys, ffi,
import loses `/proc`. Scoping any one of them loses it too — including `--allow-run=aspire`, the flag
the gate already had. So the minimal sufficient set is *all eight units, unscoped*, which is the
definition of `--allow-all`. Spelling it as eight flags would grant exactly the same thing while
looking like a narrowing, so the gate carries `--allow-all` with the measurement recorded next to it.

`--allow-all` is therefore the **minimum** here, not the blunt instrument. The evidence is unchanged:
the `/proc` read is still the gate's F1 proof, still unguarded, still the only thing that separates
"the AppHost intended to pass the value" from "the process got it".

### The regression

`service-env-gates_test.ts` (new) + `gate-permission-probe.ts` (new). It does not compare the flags
to a list — a list is the same unverified claim written twice, which is the defect. It takes the
flags out of the **real gate command**, launches a real `deno run` with exactly those flags, and
makes the subprocess perform the capability the gate script performs, through the real
`scanResourceProcesses`.

Mutation-proved — each mutation applied to `service-env-gates.ts`, test run, then reverted:

| Mutation                                                 | Result                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| behavior gate back to the shipped `--allow-read --allow-run=aspire` | **FAILED** — `probe exited 1 … NotCapable: Requires all access to "/proc"` |
| fixture gate loses `--allow-write`                       | **FAILED** — `… leaves "write" ungranted`                                            |
| fixture gate loses `--allow-run=deno`                    | **FAILED** — `regenerates through a spawned deno run, which […] does not permit`      |
| fixture gate loses `--allow-env`                         | **FAILED** — `… leaves "env" ungranted`                                              |

A fourth test is the guard on the guard: `--allow-read` alone must *fail* to read `/proc`, so the
probe cannot pass vacuously. `readReport` requires a state for every expected key, so a probe that
printed `{}` fails instead of letting the assertion loops iterate zero times.

### Sibling gate `runtime.service-env-fixture`

Checked, **no change**. `configure-service-env.ts` never touches `/proc`; it reads and rewrites
`appsettings.json` and spawns `deno run … netscript generate aspire`. Its declared
`--allow-read --allow-write --allow-run=deno --allow-env` covers exactly that, which the full-suite
run corroborates — it is inside the 62 that passed. It is now covered by the regression so it cannot
acquire the same gap silently.

| Gate                                                  | Result                                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `deno test --allow-all --unstable-kv packages/cli`    | **PASS** — exit 0, `762 passed (520 steps) | 0 failed`                             |
| `deno test --allow-all --unstable-kv packages/aspire` | **PASS** — exit 0, `19 passed (72 steps) | 0 failed`                               |
| `run-deno-check.ts --root packages/cli --ext ts,tsx`  | **PASS** — exit 0, 850 files, 0 occurrences                                        |
| `run-deno-lint.ts --root packages/cli --ext ts,tsx`   | **PASS** — exit 0, 850 files, 0 occurrences                                        |
| `run-deno-fmt.ts --root packages/cli --ext ts,tsx`    | **PASS** — exit 0, 850 files, 0 findings                                           |
| `rtk proxy deno task quality:scan`                    | **PASS** — exit 0, `"ok":true`, 0 findings, 7 pre-existing allowances (none added) |
| `rtk proxy deno task arch:check`                      | **PASS** — exit 0, no `FAIL=` entry                                                |
| `git diff --exit-code origin/main...HEAD -- deno.lock` | **PASS** — exit 0, lock unchanged                                                  |

Constraints held: no `any`, no casts, no `@ts-ignore`, no suppressions, no skipped or deleted tests,
no hardcoded resource names. The probe builds its two records key-by-key against a declared return
type rather than casting an empty object, so exhaustiveness is the compiler's job.

**Slice review (Tier-A).** The `--allow-all` is load-bearing and justified in place with the
measurement, not with an assertion of convenience. Both new files are reachable: the probe from the
test, the test from `deno test`. `A6 F-CLI-2` holds — probe 108 lines, test 213 lines,
`service-env-gates.ts` 94. The `service-env/` subdirectory gains two files and stays one bounded
child of `scaffold/`, so `scaffold-runtime-a8-f16-1333` is not deepened.

**Reconcile note.** #1447 unchanged (P0, milestone 0.0.6, open); #1449 stays draft with `Closes
#1447`. No new issue/PR comments since the last sweep other than the supervisor's failure report,
which this slice answers. `scaffold.runtime` is explicitly the supervisor's to rerun at the new head.
