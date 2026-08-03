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

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| SQLite-only service permission augmentation | Fixes real libsql consumer without broadening other commands. | plan D1; generator inspection |
| Semantic generated output plus live scaffold | Locks the emitter and proves real runtime behavior. | issue acceptance; AP-18 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Formal local PLAN-EVAL composed by milestone protocol | minor/authorized | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| scoped check/lint/fmt | planned | NOT_RUN | Slice 2. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| quality/architecture/JSR | NOT_RUN | planned commands | Slice 2/3. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| SQLite RED/GREEN | NOT_RUN | real scaffold artefacts | Serialized slot confirmed free. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| generated service argv | NOT_RUN | focused semantic test | RED first. |

## Handoff Notes

- Review the emitted `deno run` argv predicate, cross-engine non-FFI assertions, populated Aspire
  health reports, and `P2-db.json` before accepting the five issue boxes.

