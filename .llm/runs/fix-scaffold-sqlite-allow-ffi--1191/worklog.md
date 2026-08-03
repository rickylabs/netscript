# Worklog: generated SQLite/libsql service `--allow-ffi`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-sqlite-allow-ffi--1191` |
| Branch | `fix/scaffold-sqlite-allow-ffi` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Design

### Public Surface

- Existing `netscript init --db sqlite --service` scaffold output; no exported API changes.
- Existing generated `.helpers/register-services.mts` `deno run` argv.

### Domain Vocabulary

- `DbEngineChoice` — existing finite engine axis: none, postgres, mysql, mssql, sqlite.
- `NetScriptConfig.PrimaryDatabase` / `DatabaseEntry.Engine` — generated runtime selection seam.
- Service permission set — emitted Deno flags before the service entrypoint.

### Ports

- No new port. The pure generator already receives/configures the needed runtime config.

### Constants

- Existing engine literal `Sqlite` and permission literal `--allow-ffi`; no new shared constant is
  justified for one emission site plus its semantic test.

### Archetype-6 Structural Inventory

- Spine abstracts and type parameters: unchanged (`CliCommand<Input, Result>`, `CliCommandGroup`,
  `CliRoot`, `UseCase<Input, Result>`, `Registry<TKey, TValue>`).
- Layer-2 abstracts: none introduced or changed.
- Vertical feature catalog: existing scaffold/init → Aspire helper generation; no folder changes.
- Extension axes/registries: existing DB engine registry unchanged.
- Ports: command, filesystem, process, templates, prompts, and output ports unchanged.
- Composition: existing public/maintainer composition unchanged and remains declarative.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Lock research/design and open the draft PR surface. | milestone PLAN-EVAL composition waiver recorded | run artifacts; PR body |
| 2 | Prove RED and emit SQLite-only service FFI with semantic cross-engine test. | real RED; focused Deno test; scoped wrappers; `quality:gate` | service generator/test; worklog/context |
| 3 | Prove GREEN, append P2 evidence, publish audit, and close resource hygiene. | live Aspire artefacts; P2 JSON; doc/publish gates; leak check | proof evidence; run artifacts; PR/epic comments |

### Deferred Scope

- S4/S6 contract changes — orchestrator-owned after the P2 impact assessment.
- Full milestone `scaffold.runtime` lane — serialized/owned by #1184 unless explicitly handed over;
  this slice performs its required focused live scaffold/AppHost proof.

### Contributor Path

To add a future engine-specific Deno permission, update the existing service command-builder engine
predicate and extend the cross-engine semantic permission table in its focused generator test.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | 1 | bootstrap | Issue #1191 read; clean baseline equals origin/main; AppHost slot free. |
| 2026-08-04 | 1 | plan-gate | `composed per milestone-run.md (orchestrator waiver)`; plan locked before implementation. |
| 2026-08-04 | 2 | prerequisite | First start exposed missing generated Prisma/Zod output; stopped exact AppHost, then ran documented DB init/generate/seed. Not counted as target RED. |
| 2026-08-04 | 2 | RED runtime | Unmodified generator: `users` Finished, exit 1, Unhealthy with populated report; console log names `NotCapable` and required `--allow-ffi`. |
| 2026-08-04 | 2 | RED test | Focused generated-output test exited 1 only on the SQLite permission row: expected one FFI flag, observed zero. |
| 2026-08-04 | 2 | implementation | Added the primary database engine to the internal generator options and applied the required FFI flag to the selected default/explicit service permission set with de-duplication. |
| 2026-08-04 | 2 | focused GREEN | Generator suite passed 32 steps; none/Postgres/MySQL/MSSQL emit zero FFI, SQLite emits one, including explicit-permission de-duplication. |
| 2026-08-04 | 3 | GREEN runtime | Same scaffold regenerated: actual argv contains FFI; `users` Running/Healthy with populated healthy report; HTTP health 200; OpenAPI and OTEL artefacts captured. |
| 2026-08-04 | 3 | P2 | Wrote `P2-db.json` from the live 32,414-byte DB spec and posted S4/S6 impact assessment on epic #1126. |
| 2026-08-04 | 3 | exact stop | Exact AppHost stop; `aspire ps` empty; service PID exited immediately and DCP controller exited after bounded wait. |
| 2026-08-04 | 3 | final gates | Helper suite, scoped wrappers, quality gate, doc lint, publish dry-run, and leak check all passed. Leak check reported only foreign resources, left untouched. |
| 2026-08-04 | 2/3 | sign-off | Substantive diff review passed; implementation/evidence commit `c795d6f8f` recorded. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| SQLite-only service permission augmentation | Fixes real libsql consumer without broadening other commands. | plan D1; generator inspection |
| Semantic generated output plus live scaffold | Locks the emitter and proves real runtime behavior. | issue acceptance; AP-18 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Formal local PLAN-EVAL composed by milestone protocol | minor/authorized | yes |
| Mandated P2 script emits stale no-DB classifier prose | significant/deferred | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| focused helper suite | `deno test -A --unstable-kv packages/cli/src/kernel/templates/aspire/helpers/tests` | PASS | 18 tests, 164 steps. |
| scoped check/lint/fmt | `.llm/tools/run-deno-{check,lint,fmt}.ts --root packages/cli/src/kernel/templates/aspire/helpers --ext ts,tsx` | PASS | 22 files; zero findings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| framework quality | PASS | `deno task quality:gate` | Quality scan, architecture, and dependency gates exit 0; baseline warnings only. |
| public docs | PASS | `deno task doc:lint --root packages/cli --pretty` | Three entrypoints; zero findings. |
| package publish | PASS | `packages/cli: deno task publish:dry-run` | Publish simulation succeeds; existing dynamic-import warnings only. |
| resource hygiene | PASS | `deno task agentic:leak-check -- --slice-dir ... --worktree ...` | Aspire/Docker probes OK; no slice-owned survivors; foreign containers left untouched. |
| full `scaffold.runtime` | NOT_RUN (serialized ownership) | #1184 owns the milestone slot | Focused real scaffold/AppHost owner verification is complete; no overlapping run was started. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| SQLite RED | PASS | `proofs/red-runtime.json` | Real local-source scaffold after DB init/generate/seed; missing-FFI cause isolated. |
| SQLite GREEN | PASS | `proofs/green-runtime.json` | Running + Healthy; populated report; HTTP 200; OTEL records. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| generated service argv | PASS | focused test: 32 steps | RED exit 1 before fix; GREEN after fix; five-engine audit. |
| P2 DB branch | PASS with classifier finding | `../test-openapi-mcp-wave0-proofs--wave0/proofs/evidence/P2-db.json` | Measurement complete; stale hardcoded no-DB classifier recorded as drift. |

## Handoff Notes

- Review the emitted `deno run` argv predicate, cross-engine non-FFI assertions, populated Aspire
  health reports, and `P2-db.json` before accepting the five issue boxes.
