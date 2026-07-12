# #711 host lifecycle CLI — implementation worklog

## Identity and preflight

- Lane: WSL Codex implementation agent under beta-9 orchestrator `09e5ae68`.
- Worktree: `/home/codex/repos/ns-b9-711`; branch: `feat/711-host-lifecycle-cli`.
- Baseline verified before edits: `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d`.
- PLAN-EVAL: owner-waived (carried drift D1) by the slice brief. This worklog plan is the authorized replacement checkpoint.
- Archetype: 6 (CLI/tooling). No frontend/service overlay. Package public surface, generated scaffold behavior, DB wiring, and Aspire helper generation are in scope.

## Design and plan

Contract-first decisions:

1. Extend host plugin lifecycle without changing the plugin package manifest contract: `plugin new` registers by default with an opt-out; installed-name update resolves and re-pins through host-owned configuration; custom item dispatch loads the installed plugin CLI/scaffolder and regenerates registries.
2. Add DB lifecycle verbs around the existing `DbWorkspaceResolver`, `DatabaseWorkspaceMutator`, and Aspire-wrapped operation runner. JSON list output is a stable machine-readable array. Removal is configuration-first, with purge explicitly controlling workspace deletion.
3. Extend `DbOperation` only for apply/validation/resolve operations and keep their execution behind the existing Aspire runner. Resolve requires exactly one of `--applied` or `--rolled-back` plus a migration identifier.
4. Add focused unit/command tests and CLI E2E coverage source for the new verbs. The orchestrator, not this lane, runs `scaffold.runtime`/`e2e:cli`.

Commit slices:

1. Plugin lifecycle symmetry — registration-on-new, installed-name re-pin/update, item scaffolding dispatch, registry regeneration; prove with focused CLI tests plus scoped check/lint.
2. Database lifecycle symmetry — list/remove/deploy/validate/resolve and mutation consistency; prove with focused DB tests plus scoped check/lint.
3. Acceptance/E2E coverage and final evidence — add command-level E2E cases, run allowed targeted tests and wrappers, record honest evidence, commit and push.

Risks and mitigations:

- Generated plugins may expose differing CLI shapes: use the existing plugin dispatch/loader seam and return actionable usage errors.
- Re-pin resolution is registry-sensitive: use the repository JSR resolver port and existing workspace mutator semantics; never hand-roll registry requests.
- Multiple DB config keys may share one engine workspace: only purge a workspace when no remaining datasource uses it.
- Appsettings primary/tool references can dangle after removal: mutation updates or clears them before regenerating Aspire artifacts.

Deferred scope / decision:

- Dashboard-panel manifest contribution axis (context item 4): **split to a dedicated framework issue**. It changes the `@netscript/plugin` contribution model and dashboard extension contract, so implementing it inside this CLI lifecycle slice would mix Archetype 6 host work with a separate framework extension-axis design. This slice does not implement it.
- Full scaffold runtime E2E execution is explicitly reserved for the orchestrator. Coverage code will be added; results remain unproven here until that gate runs.

## Evidence

### Slice 1 — plugin lifecycle symmetry

- `plugin new` command test proves default registration inserts `./plugins/<name>/mod.ts` into `netscript.config.ts`.
- `plugin update <installed-name>` now re-enters the verified install pipeline with confirmation skipped, overwrite enabled, and the validator-selected latest stable descriptor; plugin-owned scaffold runs before registry regeneration.
- `plugin <custom> add <item>` is normalized at the binary edge, calls the generated plugin's typed CLI adapter with `add`, and regenerates host registries.
- Focused test command (shared with DB slice below): exit 0, 5 files / 19 test steps passed.
- Public CLI help smoke: exit 0 for `plugin new --help` and `plugin update --help`; `--register` shows default `true`.

The full generated-project/scaffold runtime acceptance remains unproven in this lane because the brief reserves `e2e:cli` and `scaffold.runtime` execution for the orchestrator.

### Slice 2 — database lifecycle symmetry and gates

- `db list [--json]` projects every discovered datasource as `configKey`, `engine`, `databaseName`, `enabled`, and `migrationState` (`unknown` until an operation probes Prisma; disabled targets report `disabled`).
- `db remove <configKey> [--purge]` repairs `PrimaryDatabase` and tool database references, removes the workspace member and files only when the engine workspace is no longer shared, then regenerates Aspire config/helpers.
- `db deploy`, `db validate`, and both `db resolve` modes are registered and flow through the existing Aspire operation runner. Generated database tasks map deploy to Prisma `migrate deploy`, validate to Prisma `validate`, and resolve to Prisma `migrate resolve` with the migration name.
- Targeted tests: `deno test --allow-all` over plugin-new, CLI normalization, DB mutation, database generators, and operation runner — exit 0; 5 files / 19 steps passed.
- Scoped wrapper check over `packages/cli/src`: completed with no diagnostics (exit 0).
- Scoped wrapper lint over `packages/cli/src`: exit 0, 511 files, 0 findings.
- Scoped wrapper format over `packages/cli/src --ignore-line-endings`: exit 0, 511 files, 0 findings.
- Public CLI DB help smoke: exit 0 and lists `list`, `remove`, `deploy`, `validate`, and `resolve`.
- `scaffold.runtime` coverage source now schedules `db list --json`, `db validate`, and `db deploy`; targeted `deno check --unstable-kv` of the E2E gate/ID files exits 0. The gate itself was not run here.
- `deno.lock`: unchanged.

### Unproven acceptance / orchestrator handoff

- No live JSR stale-version update was executed; unit/type evidence proves the latest-stable validator/install path is selected, but registry/network behavior remains for orchestrator E2E.
- No live Prisma datasource was deployed/validated/resolved; task generation and Aspire runner routing are covered, while runtime application remains for orchestrator `scaffold.runtime`.
- The orchestrator must run the prohibited full CLI E2E gate and record its result before merge readiness.

## Drift

- D1 (carried): PLAN-EVAL owner-waived; concise plan recorded above before implementation.
- D2: dashboard-panel contribution axis split recommended as a separate framework issue; no framework-axis code in this slice.
