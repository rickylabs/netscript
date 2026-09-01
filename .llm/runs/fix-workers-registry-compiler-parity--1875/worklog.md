# Worklog: workers registry compiler parity

> **LIVE DEFECT FOUND:** the current compiler drops five normalized `JobConfig` keys from generated
> definitions: `description`, `schedule`, `permissions`, `metadata`, and `retention`. This slice will
> emit each key explicitly without recreating any schema default or constraint.

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-workers-registry-compiler-parity--1875` |
| Branch | `fix/workers-registry-compiler-parity` |
| Archetype | `5 - Plugin Package` |
| Scope overlays | `none` |

## Design

### Public Surface

- No exported signature or entrypoint changes.
- Existing `compileWorkersRegistry()` continues to emit `RegisterJobInput` definitions.

### Domain Vocabulary

- `JobConfigSchema` — core-owned normalized job configuration contract and parity-key authority.
- emitted job definition — compiler-authored `RegisterJobInput` object whose keys must cover the
  schema contract.

### Ports

- `ProjectFiles` — existing filesystem seam used by the deterministic compiler test; no new port.

### Constants

- No new finite vocabulary. Expected parity keys are deliberately derived from the schema rather
  than declared as a constant list.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove and repair schema → emitted-output parity | Focused structured test plus plugin check/lint/fmt and quality gates | `plugins/workers/src/cli/registry-compiler.ts`, `plugins/workers/tests/cli/registry-compiler-golden_test.ts`, run artifacts |

### Deferred Scope

- Runtime/scaffold/E2E coverage — explicitly prohibited for this bounded slice.
- Broader workers plugin Refactor verdict — separately owned doctrine debt.

### Contributor Path

Add a field to the core-owned `JobConfigZodSchema`; the registry compiler parity test will fail and
name the missing emitted key until `createLocalJobDefinition()` covers it.

## PLAN-EVAL

`PLAN-EVAL: N/A` — this is a small mechanical repair with a complete issue contract, one locked
directional invariant, explicit exclusions, a one-slice file set, and prescribed gates. There are no
material architecture, sequencing, or trade-off decisions requiring adversarial plan advice.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | bootstrap | research/design | Re-baselined at `82a2527e2`; confirmed five live omitted keys. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Schema keys are a required subset of emitted keys. | This is the issue's required direction and permits legitimate compiler-only fields. | issue #1875 |
| Missing optional keys emit as `undefined`. | Shape parity without duplicated policy/defaults. | core schema + thin-plugin doctrine |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| `rtk` is unavailable on this host despite repo guidance. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Focused test/check/lint/fmt | Structured wrappers | NOT_RUN | Run after implementation. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Quality/doctrine + JSR audit | NOT_RUN | Planned commands | Run after focused gates. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime/Aspire/Docker/E2E | N/A | Owner's explicit gate boundary | Must not run locally. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Generated registry source | NOT_RUN | Focused golden/parity test | Test is the bounded consumer proof. |

## Handoff Notes

- Inspect the schema-key derivation first; it must contain no field-name list and no constraints.
- Confirm the five live omissions are visible in both source and golden output.
