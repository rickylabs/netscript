# Plan: sqlite-backed E2E runtime tier (#1158)

## Run Metadata

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| Run ID         | `test-e2e-sqlite-runtime-tier--1158`              |
| Branch         | `test/e2e-sqlite-runtime-tier-1158`               |
| Phase          | `plan`                                            |
| Target         | `packages/cli` (+ `packages/cli/e2e`, `.github/`) |
| Archetype      | `6 - CLI / Tooling`                               |
| Scope overlays | `SCOPE-service.md`                                |

## Archetype

**Archetype 6 (CLI / Tooling)** — the subject is `@netscript/cli`, which ships a binary and command
flows; the E2E harness under `packages/cli/e2e` is part of that package. Archetype 2 concerns (the
Aspire register-generators are an adapter over an external orchestrator) are folded inside, per "if
two archetypes apply, choose the larger one." `SCOPE-service.md` applies because S1 changes how
Aspire service/background/app resources are registered and S7 exercises a live AppHost.

## Current Doctrine Verdict

`@netscript/cli` — Archetype 6, 38,436 LOC, **Restructure**. Headline action: split `pipeline.ts`
(1,869) and `official-plugin-copier.ts` (1,203); apply the Archetype-6 layout
(`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:45`). **Not in scope here** — this
run adds a test tier and a narrowly-scoped generator fix; it must not grow those files.

## Axioms in Play

| Axiom | Why it matters                                                                                                                |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- |
| `A7`  | IO stays at the runtime edge. The `NETSCRIPT_CACHE_MODE` / `docker info` probe lives in `_aspire-compat.mts`, not generators. |
| `A11` | Generators are pure string builders. S1 adds a permission branch to generators — it must stay pure and table-driven.          |
| `A1`  | Finite domain vocabularies are constants with derived unions — the new suite id and cache axis follow `SCAFFOLD`/`DATABASE`.  |

## Goal

Add an **additive** `scaffold.runtime.sqlite` E2E suite that proves the full generated-project
runtime path (scaffold → plugins → DB init/generate/seed → Aspire start → behavior gates) with **no
Docker containers at all**, and wire it into CI as a cheap tier — while `scaffold.runtime` remains
the postgres-backed merge-readiness bar, unchanged.

## Scope

- `packages/cli/src/kernel/templates/aspire/helpers/register/**` — extend the #1191 sqlite
  `--allow-ffi` permission fix from services to apps, background processors, and plugin services.
- `packages/cli/e2e/src/domain/**` — `RunOptions.cache`, `SCAFFOLD.RUNTIME_SQLITE`,
  `SCAFFOLD_TITLE.RUNTIME_SQLITE`.
- `packages/cli/e2e/src/presentation/cli/options/run-options.ts` — `--cache` / `--no-cache` parse.
- `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts` — `scaffold.init` forwards the
  cache decision.
- `packages/cli/e2e/suites/scaffold/capability-suites.ts` — per-suite `defaults`, new suite entry.
- `packages/cli/e2e/src/adapters/commands/docker-resource-cleaner.ts` — tolerate absent Docker.
- `.github/workflows/e2e-cli.yml`, `.github/scripts/ci-classify-changes.ts` — new
  `scaffold-runtime-sqlite` job + `run_runtime_sqlite` classifier output + lane-visibility.

## Non-Scope

- **No merge-readiness flip.** `scaffold.runtime`, bare `deno task e2e:cli`, and `full` stay
  postgres. (Owner-ratified constraint 7; issue #1158 "Constraints".)
- **No new `ci:*` labels.** The frozen three stay frozen (constraint 4).
- **No change to the default init cache backend.** `SCAFFOLD_DEFAULTS.CACHE_BACKEND` stays `redis`;
  changing it would alter every user's scaffold. The E2E opts out per-suite instead.
- **No `--cache-backend` axis on the E2E runner.** Superseded — see D3.
- **No garnet wait filtering.** Superseded — see D2.
- No doctrine `Restructure` work on `@netscript/cli` (pipeline.ts / official-plugin-copier.ts).

## Hidden Scope

Found during research; each is real work the carried-in draft did not name:

1. **The `--allow-ffi` gap (blocker).** #1191 fixed services only. Apps, background processors, and
   plugin services never receive `databaseEngine` and never get `--allow-ffi`. On sqlite they exit 1
   at startup — the tier cannot go green until S1 lands. (`research.md` finding 8.)
2. **No per-suite default options exist.** `ScaffoldCapabilitySuite` is `{id,title,gates}`;
   `createScaffoldCapabilitySuite` honours `overrides.database` only when truthy. A new suite id
   alone still runs postgres. Needs a `defaults` field merged **under** caller overrides, so
   `--db postgres` on the sqlite suite still wins. (finding 9.)
3. **The cache Docker cost is `redis`, not `garnet`.** Init's default backend is `redis` with
   `Mode: 'Container'` and no Docker-less arm; garnet arrives later from plugin-add with
   `Mode: 'Auto'`, which already has one. (findings 3–5.)
4. **`ci:skip-e2e` semantics.** It sets only `run_runtime=false`. If the sqlite job keys off
   `run_static`, `ci:skip-e2e` would stop skipping the runtime family. Resolved by E5 without new
   labels.
5. **Docker cleanup has two intolerant paths**, not one: non-zero `docker ps` _and_ a missing
   `docker` binary (`Deno.Command` rejects `NotFound`). (finding 12.)
6. **`lane-visibility`** must list the new job in `needs:` and in its summary table or CI will not
   surface it. (finding 14.)
7. **Draft PRs run no CI (#1212).** The new job cannot be proven from the draft PR; S7's local run
   is the evidence, and the CI proof arrives on `ready_for_review`. (finding 16.)

## Locked Decisions

| ID   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Rationale                                                                                                                                                                                                                                                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `D0` | **S1 first: extend the #1191 sqlite `--allow-ffi` fix to the permission-bearing generators — background processors and plugin services (services already have it).** Thread `databaseEngine` into those generators and reuse one shared permission helper. **Amended 2026-08-04 (drift D-5): apps are excluded** — `generate-register-apps.ts` launches apps via `deno task <name>`, which owns no Deno permission list, and the generated `dev` task is already `deno run --allow-all`. | Without it the sqlite tier fails at Aspire start for background processors and plugin services. Same defect class as #1191, same fix shape. Blocker, not optional. (finding 8, amended by drift D-5)                                                                                                                                            |
| `D1` | New suite id **`scaffold.runtime.sqlite`** (`SCAFFOLD.RUNTIME_SQLITE`), additive. Default `scaffold.runtime`, bare `e2e:cli`, and `full` are untouched.                                                                                                                                                                                                                                                                                                                                  | Owner-ratified constraint 1. Additive tiers are how #1155 scoped expensive jobs without changing the merge bar.                                                                                                                                                                                                                                 |
| `D2` | **Reduced-container profile = `--db sqlite` + cache disabled at init; leave `NETSCRIPT_CACHE_MODE` unset.** `runtime.wait.garnet` stays in the gate list unfiltered and the ambient Docker-capable arm supplies Garnet.                                                                                                                                                                                                                                                                  | **S7 downgrade after R-3 resolved negatively.** sqlite emits no DB resource and disabling init's cache kills the `redis` container, but the executable Garnet arm showed inconsistent cross-process KV/queue visibility. The tier therefore accepts one Garnet container while still eliminating Postgres and Redis. (findings 3–5; drift D-14) |
| `D3` | **No `CACHE_BACKEND` axis.** Add a boolean `RunOptions.cache` (default `true`) plus `--cache` / `--no-cache` on the E2E runner; `scaffold.init` forwards it.                                                                                                                                                                                                                                                                                                                             | **Corrects draft D3.** `--cache-backend deno-kv` emits `Mode: 'External'` (an `addConnectionString` resource), not `Local`, and plugin-add re-adds garnet regardless — so the axis buys nothing the boolean does not. (finding 6)                                                                                                               |
| `D4` | **Runtime waits stay as they are.** DB waits remain engine-filtered (already correct); the garnet wait is _not_ filtered.                                                                                                                                                                                                                                                                                                                                                                | **Corrects draft D4.** The garnet resource exists in both arms under the same name; filtering it would weaken the sqlite tier for no benefit and would desync `runtimeGateIds` from `runtimeResources`.                                                                                                                                         |
| `D5` | **Per-suite defaults seam.** `ScaffoldCapabilitySuite` gains `readonly defaults?: Partial<RunOptions>`, merged as `{...capability.defaults, ...overrides}` at the top of `createScaffoldCapabilitySuite`.                                                                                                                                                                                                                                                                                | The only way a suite id can pin sqlite while `--db` on the command line still wins. Caller precedence preserved. (finding 9)                                                                                                                                                                                                                    |
| `E5` | **CI: new job `scaffold-runtime-sqlite`, gated on a new classifier output `run_runtime_sqlite = ci:full ? true : (run_static && !ci:skip-e2e)`.** No new labels. Skipped-by-policy + FAIL-CLOSED pattern copied from the existing jobs; `lane-visibility` gains the job in `needs:` and in its table.                                                                                                                                                                                    | Keeps the frozen three labels (constraint 4) while giving `ci:skip-e2e` authority over **both** runtime tiers. A classifier **output** is not a label; #1155 established the capability vector as the place this logic lives. Kept as `E5` to avoid colliding with #1152's `D5`.                                                                |
| `D6` | **Merge-readiness stays postgres.** No change to `full-command.ts` or the default `database: DATABASE.POSTGRES`.                                                                                                                                                                                                                                                                                                                                                                         | Owner-ratified constraint 7; issue #1158 constraints. postgres wiring must still be proven where it can break.                                                                                                                                                                                                                                  |
| `D7` | **Provider-sensitive gates take `database` and are verified, not assumed.** The sqlite suite excludes only `behavior.service-health`; every other runtime/behavior gate remains shared with `scaffold.runtime`.                                                                                                                                                                                                                                                                          | S7 proved the users-service health implementation is product-provider-shaped: its tagged Prisma raw query fails under libSQL despite successful sqlite init/generate/seed. The Postgres merge-readiness suite retains the assertion; fixing the service health adapter is outside this tier. (drift D-15)                                       |
| `D8` | **Docker cleanup tolerates a missing Docker on both paths** — absent binary (`NotFound`) and non-zero `docker ps` — returning an empty snapshot with a warning. Removal failures for containers the run _did_ create still throw.                                                                                                                                                                                                                                                        | Constraint 6. The postgres tier keeps strict cleanup because it always has containers; the sqlite tier must not fail on an empty/absent Docker. (finding 12)                                                                                                                                                                                    |
| `D9` | **Harness-only at bootstrap.** No product code before PLAN-EVAL `PASS`.                                                                                                                                                                                                                                                                                                                                                                                                                  | Constraint 8; `run-loop.md` § 4 hard stop.                                                                                                                                                                                                                                                                                                      |

## Open-Decision Sweep

| Decision                                                                               | Status               | Notes                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact init spelling for disabling the cache (`--cache false` vs `--no-cache`)          | **must resolve now** | Resolved as: S2 verifies against the real binary and wires whichever the CLI accepts; if neither works, S2 adds the `--no-cache` negation to `init-command.ts` (2-line, additive). Either way S2 cannot land without a passing `scaffold.init` on the sqlite suite.                                |
| Whether the Garnet **executable** arm starts and preserves cross-process runtime state | **must resolve now** | **Resolved negatively in S7.** The executable stayed healthy, but repeated runs inconsistently lost registered jobs or accepted a trigger without exposing an execution. The pre-agreed downgrade drops the env pin and accepts the ambient-Docker Garnet container (still no Postgres, no Redis). |
| Whether any behavior gate asserts postgres-shaped output                               | **must resolve now** | **Resolved in S7.** Only `behavior.service-health` is provider-shaped: the generated service's tagged Prisma raw query is rejected by libSQL. It is excluded only from the sqlite capability; all other behavior assertions remain unchanged and `scaffold.runtime` retains the gate.              |
| Whether `SCAFFOLD_DEFAULTS.CACHE_BACKEND` should become `deno-kv`                      | safe to defer        | A product-default change affecting every scaffold. Out of scope; file as a follow-up issue if the sqlite tier shows the redis container is dead weight for users too.                                                                                                                              |
| Whether `Mode: 'Local'` should ever be emitted by the scaffold                         | safe to defer        | The generator arm exists but is unreachable (finding 6). Dead-code/latent-feature question for `@netscript/cli`, not for this tier.                                                                                                                                                                |
| Promoting the sqlite tier to merge-readiness                                           | safe to defer        | Explicitly out of scope per D6; revisit only after the tier has green history.                                                                                                                                                                                                                     |

> No open decision would force rework if deferred: the three "must resolve now" items are each
> resolved **within the slice that depends on them**, with the fallback pre-agreed.

## Risk Register

| Risk                                                                                                    | Mitigation                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `R-1` S1 changes emitted permissions for **every** scaffold, not just sqlite.                           | The branch is `databaseEngine === 'Sqlite'` only, mirroring the existing services helper. Unit tests assert non-sqlite output is byte-identical, plus `quality:scan` + `arch:check`.    |
| `R-2` `--cache false` is not accepted by Cliffy's `--cache [enabled:boolean]`.                          | S2 verifies against the binary first; fallback is a declared `--no-cache` negation in `init-command.ts` (additive, no default change).                                                  |
| `R-3` Garnet dotnet-tool executable fails to restore/start on CI (10s best-effort restore).             | S7 proves locally; documented downgrade = drop `NETSCRIPT_CACHE_MODE` and accept ambient-Docker garnet. Tier still drops postgres + redis.                                              |
| `R-4` A behavior gate is silently postgres-shaped and fails on sqlite.                                  | S7 is a full local run with per-gate evidence; fixes land in S7. If a gate is genuinely postgres-only it is excluded from the sqlite gate list with a recorded rationale (not deleted). |
| `R-5` Disabling init's cache leaves `PrimaryCache` unset until plugin-add runs, breaking an early gate. | `ensureSharedCache` sets `PrimaryCache ??= 'garnet'` during plugin install, which precedes every runtime gate in `RUNTIME_GATES`. S7 confirms ordering.                                 |
| `R-6` `ci:skip-e2e` regression — the new job runs when the label says skip.                             | E5 folds `!skipE2e` into the classifier output, with classifier unit tests for the `ci:full` / `ci:skip-e2e` / docs-only matrices (the #1155 test shape).                               |
| `R-7` The new job cannot be validated on the draft PR (#1212).                                          | Local S7 evidence is the gate; CI proof is captured on `ready_for_review` and recorded in the PR comment trail before merge.                                                            |
| `R-8` Two runtime tiers double the `e2e-scaffold-runtime-global` concurrency contention.                | The sqlite job gets its **own** concurrency group (`e2e-scaffold-runtime-sqlite-global`), so it never queues behind the postgres tier.                                                  |
| `R-9` Slice count / scope creep into the doctrine `Restructure` work.                                   | Non-scope is explicit; S1 adds a helper without growing `pipeline.ts` or `official-plugin-copier.ts`.                                                                                   |

## Anti-Patterns to Resolve or Avoid

| AP                                        | Status | Plan                                                                                                                                                           |
| ----------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host-side hardcoded plugin/provider names | risk   | S1's branch keys off `databaseEngine === 'Sqlite'`, an existing domain value from `DatabaseEntry['Engine']`, not a plugin name. `quality:scan` enforces.       |
| `any` + manual casting                    | risk   | New code is literal-typed constants and `readonly` interface fields. No `as unknown as`, no new `deno-lint-ignore`. A new ignore is a review-blocking finding. |
| Duplicated finite vocabulary              | new    | The sqlite suite id, title, and cache axis are constants with derived unions — no string literals at call sites.                                               |
| Two sites drifting apart                  | risk   | `runtimeGateIds` and `runtimeResources` stay in sync for engine waits; the separate sqlite capability filter is pinned to exactly `behavior.service-health`.   |

## Fitness Gates

| Gate    | Required | Expected evidence                                                                         |
| ------- | -------- | ----------------------------------------------------------------------------------------- |
| `F-1`   | yes      | `.llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`                            |
| `F-3`   | yes      | `deno task arch:check`                                                                    |
| `F-5`   | yes      | `deno task publish:dry-run` + jsr-audit rubric on `packages/cli` (S1 touches `src/**`)    |
| `F-6`   | yes      | `deno task publish:dry-run`                                                               |
| `F-9`   | yes      | S1 **is** a permission-declaration change — unit tests assert the emitted permission sets |
| `F-10`  | yes      | Per-slice unit tests named in the slice table                                             |
| `F-19`  | yes      | Scoped wrappers only (`run-deno-check/lint/fmt.ts`), never raw root `deno fmt --check`    |
| quality | yes      | `deno task quality:scan` — mandatory for any slice touching `packages/**`                 |

## Arch-Debt Implications

| Entry                                                                           | Action | Notes                                                                                                                    |
| ------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| `@netscript/cli` Restructure verdict                                            | none   | Untouched by this run; no new debt added to it.                                                                          |
| Unreachable `Mode: 'Local'` cache arm in the generator                          | create | Latent generator branch nothing emits (finding 6). Record as a debt entry at Close unless S7 finds a use for it.         |
| `SCAFFOLD_DEFAULTS.CACHE_BACKEND: 'redis'` forces a container on every scaffold | create | Not this issue's call to change, but the sqlite tier makes the cost visible. Record at Close and file a follow-up issue. |

## Validation Plan

| Order | Gate               | Command or check                                                                                  | Expected result                                                                                                                                                   |
| ----- | ------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | type-check         | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS                                                                                                                                                              |
| 2     | lint               | `.llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`                                    | PASS                                                                                                                                                              |
| 3     | format             | `.llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx`                                     | PASS                                                                                                                                                              |
| 4     | code quality       | `deno task quality:scan`                                                                          | PASS (no `any`+cast, no hardcoded plugin names)                                                                                                                   |
| 5     | doctrine fitness   | `deno task arch:check`                                                                            | PASS                                                                                                                                                              |
| 6     | unit               | `deno test packages/cli/src/kernel/templates/aspire/helpers/tests/` (S1)                          | PASS, incl. non-sqlite byte-identical assertions                                                                                                                  |
| 7     | unit               | `deno test packages/cli/e2e/` (S2–S5)                                                             | PASS                                                                                                                                                              |
| 8     | classifier unit    | `deno test .github/scripts/` (S6)                                                                 | PASS, incl. `ci:full` / `ci:skip-e2e` matrices                                                                                                                    |
| 9     | **new tier, live** | `deno task e2e:cli run scaffold.runtime.sqlite --cleanup --format pretty` (S7)                    | PASS with postgres and redis eliminated and a **net-zero** container delta (one garnet container created then removed by cleanup — amended after R-3, drift D-14) |
| 10    | regression         | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`                                | PASS — the postgres merge bar is unchanged                                                                                                                        |
| 11    | publishability     | `deno task publish:dry-run`                                                                       | PASS                                                                                                                                                              |

> Order 10 is the expensive existing gate. Per `AGENTS.md` it runs once, at merge-readiness — not
> per slice.

## Dependencies

- #1191 (closed) — sqlite `--allow-ffi` for services; S1 extends it.
- PR #1155 (merged) — the classifier capability vector S6 extends.
- PR #1212 (merged) — draft-PR CI guards S6 must preserve.
- Aspire CLI 13.4.x + .NET 10 on the runner (already installed by the existing runtime job).
- Ambient Docker-capable Garnet arm; the executable experiment was retired by D-14.

## Drift Watch

- `SCAFFOLD_DEFAULTS.CACHE_BACKEND` — if it changes, D2/D3 must be re-derived.
- `ensureSharedCache`'s hardcoded `'garnet'` key — if it becomes configurable, D2 changes.
- `shouldUseContainerCache()` / `NETSCRIPT_CACHE_MODE` — sqlite must retain the ambient
  container-backed arm unless D-14 is revisited with new cross-process evidence.
- `runtimeGateIds` / `runtimeResources` — the two must stay in agreement.
- `ci-classify-changes.ts` outputs — S6 adds one; #1155's tests must stay green.
