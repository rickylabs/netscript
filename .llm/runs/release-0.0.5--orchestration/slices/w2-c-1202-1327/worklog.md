# W2-C worklog

## Design

### Public surface

- CLI verbs: `netscript db migrate` (create + apply) and existing `netscript db deploy` (apply
  only).
- Database script result: explicit created/applied migration names and verified state.
- E2E receipt: per-start redacted endpoint identity, health result, structured-log correlation, and
  trace id.

### Domain vocabulary

- `MigrationArtifact`: migration directory/name created by this invocation.
- `AppliedMigration`: migration recorded by the target database.
- `MigrationExecutionResult`: exit classification plus separate created/applied sets.
- `EndpointIdentity`: redacted resource name, host, port, and database name.
- `EndpointAllocationReceipt`: one AppHost allocation's Postgres/users/health/telemetry proof.

### Ports

- Prisma process runner (existing injectable spawn seam).
- Filesystem migration inventory.
- Applied-migration state query/inspection at generated DB workspace boundary.
- Aspire resource/telemetry inspection through existing CLI E2E command executor.

### Constants

- Operation verbs remain the existing `DbOperation` finite union.
- Migration state table: `_prisma_migrations`.
- Receipt version and two allocation labels are named constants in the E2E fixture.

### Commit slices

See `plan.md`; five ordered slices are locked.

### Deferred scope

Owner-machine collision identity and three-pass observation for #1202; broad doctrine debt.

### Contributor path

Start at `packages/cli/src/public/features/db/db-group.ts`, follow `migrate` or `deploy` into the
shared operation runner, then inspect the generated database task under
`packages/cli/src/kernel/templates/database/`. Runtime evidence lives with scaffold database gates.

## Plan gate

`PLAN-EVAL: inherited PASS` — the separately evaluated milestone orchestration plan locks this
cluster, issue boundary, route, and gates. The slice brief resolves the remaining semantic choices;
the supervisor must not launch its own evaluator session.

## Evidence

| Phase           | Command / artifact                                                                                                                                                                                         | Exit | Result                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---: | ------------------------------------------------------------------------ |
| Baseline        | direct git status/revision                                                                                                                                                                                 |    0 | clean; HEAD equals `origin/main` at `c383b2e84`                          |
| Issues          | live `gh issue view` for #1202/#1327                                                                                                                                                                       |    0 | acceptance and partial-close boundary reverified                         |
| RED             | `deno test --no-lock --allow-all packages/database/tests/migrate-artifacts_test.ts packages/cli/src/kernel/templates/aspire/pristine-scaffold-ports_test.ts`                                               |    1 | expected TS2305: `runMigrationWithArtifacts` contract is not implemented |
| S2 focused      | `deno test --no-lock --allow-all packages/database/tests/migrate-artifacts_test.ts packages/database/tests/migrate-retry_test.ts packages/cli/src/kernel/templates/aspire/pristine-scaffold-ports_test.ts` |    0 | 6 tests / 14 steps passed                                                |
| S3/S4 check     | targeted `deno check --no-lock --unstable-kv` over new migration/endpoint fixtures and gate builders                                                                                                       |    0 | all modules checked                                                      |
| S3/S4 tests     | focused CLI operation runner + runtime gate/registry suites                                                                                                                                                |    0 | 31 tests then 29 tests passed                                            |
| Scoped check    | database + CLI wrappers with `--deno-arg --no-lock`                                                                                                                                                        |    0 | 22 and 816 files; zero diagnostics                                       |
| Scoped lint     | database + CLI wrappers                                                                                                                                                                                    |    0 | zero diagnostics                                                         |
| Scoped format   | database + CLI wrappers after formatting six owned files                                                                                                                                                   |    0 | zero findings                                                            |
| Framework law   | `deno task quality:gate`                                                                                                                                                                                   |    0 | quality scan and doctrine gate passed; no new allowances                 |
| Doctrine        | `deno task arch:check`                                                                                                                                                                                     |    0 | passed with pre-existing warnings only                                   |
| Database docs   | `deno task doc:lint --root packages/database --pretty`                                                                                                                                                     |    0 | combined total 0                                                         |
| Publish surface | `deno task publish:dry-run`                                                                                                                                                                                |    0 | `Success Dry run complete`                                               |

## Slice 1 reconcile

- #1327 remains open with all acceptance rows unchecked; draft PR #1393 carries `Closes #1327`.
- #1202 remains open and is referenced only. Its owner-observational rows are not claimed.
- No new review/evaluator comments were present at slice start.

## Slice 2 reconcile

- `db migrate` no longer selects deploy from URI/CI state; a distinct existing `db deploy` remains.
- Success now requires a new `migration.sql` directory plus green `prisma migrate status`; output
  prints created/applied sets independently.
- A headless failure or zero-with-no-artifact names the interactive `netscript db migrate --name`
  command and returns non-zero.
- No issue scope or taxonomy adjustment is required; external CI comments are pending.

## Slice 3/4 reconcile

- Found and fixed the existing `--name` forwarding mismatch (`NETSCRIPT_PRISMA_NAME` writer versus
  `PRISMA_MIGRATION_NAME` reader); TTY identity now crosses the resident AppHost request explicitly.
- The runtime suite now creates headless and PTY-backed schema-change migrations, asserts files and
  created/applied output, runs deploy-only/no-change controls, and inspects applied state via
  status.
- The existing two-start sequence now captures both topologies and requires changed Postgres
  allocation, matching users `DATABASE_URL`, healthy JSON, and a shared structured-log/trace id.
- #1202 remains partial: this is code-owned two-start evidence, not the owner Windows observation or
  three full clean passes.

## Expensive gate

EXPENSIVE-GATE-REQUEST

## Fourth serialized runtime verdict — 2026-08-09

The fourth grant was consumed by exactly one runtime invocation at head `720299cb3`. The endpoint
authority comparison passed and reached health receipt validation, where the gate failed on a second
validator-shape mismatch. There was no retry or code repair.

| Step                  | Exact command / artifact                                                                                                                          | Raw exit | Full verdict                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------: | ----------------------------------------------------------------------------------------------------------------------------------- |
| Preflight leak check  | `deno task agentic:leak-check -- --slice-dir .llm/runs/release-0.0.5--orchestration/slices/w2-c-1202-1327 --worktree /home/codex/repos/ns005-w2c` |        0 | No W2-C-owned or unknown survivor. Known foreign `redis-jfgcbtaf`, owned by `/home/codex/repos/w6-review-desk`, was left untouched. |
| Serialized suite      | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`                                                                                |        1 | `Summary: passed=61 failed=1`; `cleanup.aspire-stop` passed.                                                                        |
| Postflight leak check | same command as preflight                                                                                                                         |        0 | Artifact proves no W2-C-owned or unknown survivor; only the same untouched foreign container remains. No teardown needed.           |
| Review threads        | `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1393 --pretty`                                                               |        0 | `review-threads PASS rickylabs/netscript#1393 threads=0 unanswered=0`                                                               |

### Four decisive gates in the same run

- `database.migration-artifacts` — **PASSED**, 42,401 ms.
- `runtime.capture-db-allocation-first` — **PASSED**, 491 ms.
- `runtime.capture-db-allocation-second` — **PASSED**, 653 ms.
- `behavior.live-db-endpoint` — **FAILED**, 239 ms. Structural endpoint comparison completed, then
  health validation rejected HTTP 200 JSON containing top-level `status: "healthy"` and a database
  check shaped as `{ "name": "database", "healthy": true, "latency": 5 }`. The validator currently
  requires the check to contain `status: "healthy"`, so it stopped before querying structured logs
  and OTEL traces.

This run does not prove the correlated telemetry receipt and therefore does not satisfy all four
#1202 rows. They remain unticked. The serialized token is released with a failing verdict; no blind
retry or implementation repair occurred.

## Health-contract validator repair — pass 5 request

The fourth failure was traced to the producer rather than patched from the observed payload alone.
`packages/service/src/primitives/health.ts` defines and serializes `HealthResponse`: overall
`HealthStatus`, with checks shaped as `{ name, healthy, message?, latency? }`. Generated services
reach that `/health` handler through `defineService`; there is no per-check `status` field.

The fourth-pass HTTP response is checked in verbatim as a fast fixture. A negative fixture retains
top-level `status: "healthy"` while setting the database check to `healthy: false`, proving the
matcher must inspect the documented per-check boolean and cannot widen into an aggregate-only pass.
The matcher accepts only the two names produced by `defineService`: `database` for a single client
and `database:<provider>` for the configured client in a multi-database context.

| Phase            | Command                                                                                                                                                                                                                               | Raw exit | Result                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------: | ------------------------------------------------------------------- |
| Contract RED     | `deno test --no-lock --allow-all packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts`                                                                                                                            |        1 | `matchesDatabaseHealthContract` did not exist                       |
| Focused green    | `deno test --no-lock --allow-all packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts packages/cli/e2e/tests/presentation/suite-registry_test.ts` |        0 | 30 passed, 0 failed                                                 |
| Scoped check     | CLI E2E wrapper with `--deno-arg --no-lock`                                                                                                                                                                                           |        0 | 135 files, zero diagnostics                                         |
| Scoped lint      | CLI E2E wrapper                                                                                                                                                                                                                       |        0 | 135 files, zero diagnostics                                         |
| Scoped format    | CLI E2E wrapper                                                                                                                                                                                                                       |        0 | 135 files, zero findings                                            |
| Framework law    | `deno task quality:gate`                                                                                                                                                                                                              |        0 | quality scan and doctrine checks passed; pre-existing warnings only |
| Doctrine fitness | `deno task arch:check`                                                                                                                                                                                                                |        0 | passed; pre-existing warnings only                                  |

### #1202 row 2 — persisting mechanism

The mechanism is eager `getEndpoint("tcp")` materialization: resolving the endpoint and writing that
string into generated `DATABASE_URL` serializes one AppHost allocation into the generated service
environment. The RED-first guard forbids that output and requires lazy
`resource.withEnvironment('DATABASE_URL', infrastructure.primaryDatabase)` binding, plus reference
and readiness edges, so Aspire resolves the current allocation on each start.

`scaffold.runtime` was not run because W2-B holds the serialized token. Rows 1, 3, and 4 remain
unproven until `behavior.live-db-endpoint` completes endpoint, health, structured-log, and OTEL
receipt validation in a granted pass.

EXPENSIVE-GATE-REQUEST

- All required non-runtime gates are green at commit `84c753c20` plus formatter-only pending diff.
- Requested command: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- The supervisor will run leak-check before/after and will not start until the orchestrator grants
  the serialized token.

## Serialized runtime verdict — 2026-08-09

Token grant received from the milestone orchestrator. The required command was run exactly once;
there was no retry.

| Step                  | Exact command / artifact                                                                                                                          | Raw exit | Full verdict                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preflight leak check  | `deno task agentic:leak-check -- --slice-dir .llm/runs/release-0.0.5--orchestration/slices/w2-c-1202-1327 --worktree /home/codex/repos/ns005-w2c` |        0 | No W2-C-owned or unknown survivor. One foreign stale container, `redis-jfgcbtaf` (`48c4411…`), belongs to `/home/codex/repos/w6-review-desk`; left untouched. |
| Serialized suite      | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`                                                                                |        0 | `Summary: passed=76 failed=0`; all 76 selected gates passed, including `cleanup.aspire-stop`. One pass only.                                                  |
| Postflight leak check | same command as preflight                                                                                                                         |        0 | Artefact inspection again found no W2-C-owned or unknown survivor and the same untouched foreign container only. No teardown was needed.                      |
| Review threads        | `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1393 --pretty`                                                               |        0 | `review-threads PASS rickylabs/netscript#1393 threads=0 unanswered=0`                                                                                         |

### Coverage finding after the run

The green 76-gate verdict did **not** execute the four W2-C acceptance gates because the built-in
suite's explicit allowlist omitted their registered IDs:

- `database.migration-artifacts`
- `runtime.capture-db-allocation-first`
- `runtime.capture-db-allocation-second`
- `behavior.live-db-endpoint`

The allowlist is now repaired and a registry test proves those four gates resolve in the Postgres
runtime suite and remain excluded from the SQLite tier. Focused follow-up evidence on the repaired
selector:

| Command                                                                   | Raw exit | Result                                                              |
| ------------------------------------------------------------------------- | -------: | ------------------------------------------------------------------- |
| `deno test -A packages/cli/e2e/tests/presentation/suite-registry_test.ts` |        0 | 16 passed, 0 failed                                                 |
| scoped check over `packages/cli/e2e` with `--no-lock`                     |        0 | 134 files, zero diagnostics                                         |
| scoped lint over `packages/cli/e2e`                                       |        0 | 134 files, zero diagnostics                                         |
| scoped format over `packages/cli/e2e`                                     |        0 | 134 files, zero findings                                            |
| `deno task quality:gate`                                                  |        0 | quality scan and doctrine checks passed; pre-existing warnings only |

No second serialized run was attempted. The four acceptance gates therefore remain missing runtime
evidence and require a fresh orchestrator-authorized pass after this evidence commit. The serialized
token is released with that limitation stated explicitly.

### Scope classification: `--name` forwarding

The `NETSCRIPT_PRISMA_NAME` → `PRISMA_MIGRATION_NAME` correction is necessary for #1327, not an
adjacent repair. `db migrate --name` is the actionable artifact-creation path required by the issue;
without forwarding the name through the resident AppHost, the requested named migration cannot be
created and verified.

## Tier-A review remediation — test preservation

Tier-A found that the slice had replaced, rather than extended, `operation-runner-helpers_test.ts`.
Restored both unchanged behavioral tests for `isNoRunningAppHostOutput` alongside the new
`buildDbCliEnv` regression test. This preserves the documented diagnostic-prefix behavior and the
negative substring-quotation trap for live code.

The reviewer granted one fresh serialized pass after this restoration commit. Focused and runtime
evidence follow in the next evidence commit; no resources are started before the focused test.

### Restoration evidence

| Command                                                                                                      | Raw exit | Result                                                                                               |
| ------------------------------------------------------------------------------------------------------------ | -------: | ---------------------------------------------------------------------------------------------------- |
| `deno test --no-lock --allow-all packages/cli/src/kernel/adapters/database/operation-runner-helpers_test.ts` |        0 | 3 passed, 0 failed; both restored AppHost diagnostic cases and the migration environment case passed |

Restoration commit `e28efad9e` was pushed before the focused suite and before resource startup, as
required by Tier-A.

## Second serialized runtime verdict — 2026-08-09

Tier-A granted one additional pass at the repaired selector head. The command was run exactly once;
after failure there was no retry and no implementation repair.

| Step                  | Exact command / artifact                                                                                                                          | Raw exit | Full verdict                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------: | ------------------------------------------------------------------------------------------------------------------------------------- |
| Preflight leak check  | `deno task agentic:leak-check -- --slice-dir .llm/runs/release-0.0.5--orchestration/slices/w2-c-1202-1327 --worktree /home/codex/repos/ns005-w2c` |        0 | No W2-C-owned or unknown survivor. Known foreign `redis-jfgcbtaf` belongs to `/home/codex/repos/w6-review-desk`; left untouched.      |
| Serialized suite      | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`                                                                                |        1 | `Summary: passed=33 failed=1`; `database.migration-artifacts` executed and failed after 23,799 ms. `cleanup.aspire-stop` then passed. |
| Postflight leak check | same command as preflight                                                                                                                         |        0 | Artefact proves no W2-C-owned or unknown survivor; only the same untouched foreign container remains. No teardown needed.             |
| Review threads        | `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1393 --pretty`                                                               |        0 | `review-threads PASS rickylabs/netscript#1393 threads=0 unanswered=0`                                                                 |

### Decisive gate execution

- `database.migration-artifacts` — **FAILED**. Its headless case completed. The PTY case
  successfully created and applied `20260808222008_w2_tty`, then `defaultPrismaSpawn` accessed
  `output.stderr` even though PTY mode configured stderr as inherited. Deno raised
  `TypeError: Cannot get 'stderr': 'stderr' is not piped` at `migrate.ts:153`.
- `runtime.capture-db-allocation-first` — **NOT EXECUTED** because the suite stopped at the failed
  migration gate.
- `runtime.capture-db-allocation-second` — **NOT EXECUTED** for the same reason.
- `behavior.live-db-endpoint` — **NOT EXECUTED** for the same reason.

The serialized token is released with a failing verdict. Per the grant, no blind retry or repair was
started in this turn.

## Third serialized grant — PTY spawn repair

Tier-A identified the failure as an inherited-stream getter bug and granted one fresh pass at the
fixed head.

| Phase          | Command                                                                                                                           | Raw exit | Result                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------: | --------------------------------------------------------------------------------------------------- |
| Contract RED   | `deno test --no-lock --allow-all packages/database/tests/migrate-retry_test.ts`                                                   |        1 | `defaultPrismaSpawn` was not exported to the new unit seam                                          |
| Behavioral RED | same command after adding only the injectable output runner                                                                       |        1 | interactive test reproduced `TypeError: Cannot get 'stderr': 'stderr' is not piped` at `migrate.ts` |
| Focused green  | `deno test --no-lock --allow-all packages/database/tests/migrate-retry_test.ts packages/database/tests/migrate-artifacts_test.ts` |        0 | 5 tests / 10 steps passed                                                                           |
| Scoped check   | database wrapper with `--deno-arg --no-lock`                                                                                      |        0 | 22 files, zero diagnostics                                                                          |
| Scoped lint    | database wrapper                                                                                                                  |        0 | 22 files, zero diagnostics                                                                          |
| Scoped format  | database wrapper                                                                                                                  |        0 | 22 files, zero findings                                                                             |
| Framework law  | `deno task quality:gate`                                                                                                          |        0 | quality scan and doctrine gate passed; pre-existing warnings only                                   |

The fix reads `output.code` and returns immediately for interactive commands. Only the
non-interactive branch reads, mirrors, and decodes piped stderr. `runCommandWithTimeout` is
explicitly documented as reachable only for non-interactive commands with piped stderr.

### #1202 scope reconcile

The orchestrator withdrew the inherited owner-machine boundary after re-reading the issue and
measuring the host. PR #1393 now closes #1202 as well as #1327. The four #1202 acceptance rows are
not claimed from this focused test; they await the named runtime gates in the third serialized pass.

## Third serialized runtime verdict — 2026-08-09

The command was run exactly once at fixed head `f70a19b3f`. There was no retry or post-failure
implementation repair.

| Step                  | Exact command / artifact                                                                                                                          | Raw exit | Full verdict                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------: | --------------------------------------------------------------------------------------------------------- |
| Preflight leak check  | `deno task agentic:leak-check -- --slice-dir .llm/runs/release-0.0.5--orchestration/slices/w2-c-1202-1327 --worktree /home/codex/repos/ns005-w2c` |        0 | No W2-C-owned or unknown survivor; known foreign `redis-jfgcbtaf` left untouched.                         |
| Serialized suite      | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`                                                                                |        1 | `Summary: passed=61 failed=1`; `cleanup.aspire-stop` passed.                                              |
| Postflight leak check | same command as preflight                                                                                                                         |        0 | No W2-C-owned or unknown survivor; only the same untouched foreign container remains. No teardown needed. |

### Four decisive gates

- `database.migration-artifacts` — **PASSED**, 42,808 ms.
- `runtime.capture-db-allocation-first` — **PASSED**, 394 ms.
- `runtime.capture-db-allocation-second` — **PASSED**, 836 ms.
- `behavior.live-db-endpoint` — **FAILED**, 210 ms. The receipt comparison reported live Postgres
  `postgres://localhost:45103` and users `Host=localhost;Port=45103;…`, then rejected them because
  the assertion searched only for URL-style `:45103`. It failed before completing the
  health/structured-log/OTEL receipt.

The actual first-allocation values carry the same host port, and the preceding
`behavior.service-health` gate passed in 29,899 ms, but silence after the authority assertion is not
telemetry evidence. Therefore `behavior.live-db-endpoint` and the four #1202 acceptance rows remain
unticked. The serialized token is released with a failing verdict.

## Live-endpoint validator repair — pass 4 request

The third-pass failure was localized to the evidence validator. It compared the live Postgres URL
port with a URL-shaped substring in the users connection string, even though Aspire supplied the
users value in Npgsql keyword form. The repaired comparator explicitly parses the two supported
dialects (URL and semicolon key/value), compares numeric ports, and fails with side-specific source
values when either port cannot be parsed. A deliberately mismatched-port test proves the validator
still goes RED rather than finding a coincidental substring elsewhere in a payload.

| Phase            | Command                                                                                                                                                                                                                               | Raw exit | Result                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------: | ------------------------------------------------------------------- |
| Contract RED     | `deno test --no-lock --allow-all packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts`                                                                                                                            |        1 | `compareDatabaseEndpointPorts` did not exist                        |
| Focused green    | `deno test --no-lock --allow-all packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts packages/cli/e2e/tests/presentation/suite-registry_test.ts` |        0 | 28 passed, 0 failed                                                 |
| Scoped check     | CLI E2E wrapper with `--deno-arg --no-lock`                                                                                                                                                                                           |        0 | 135 files, zero diagnostics                                         |
| Scoped lint      | CLI E2E wrapper                                                                                                                                                                                                                       |        0 | 135 files, zero diagnostics                                         |
| Scoped format    | CLI E2E wrapper                                                                                                                                                                                                                       |        0 | 135 files, zero findings                                            |
| Framework law    | `deno task quality:gate`                                                                                                                                                                                                              |        0 | quality scan and doctrine checks passed; pre-existing warnings only |
| Doctrine fitness | `deno task arch:check`                                                                                                                                                                                                                |        0 | passed; pre-existing warnings only                                  |

`scaffold.runtime` was not run: W2-A holds the serialized token. The four gates are not claimed
green from focused evidence, and the #1202 rows remain unticked pending one complete granted pass.

EXPENSIVE-GATE-REQUEST
