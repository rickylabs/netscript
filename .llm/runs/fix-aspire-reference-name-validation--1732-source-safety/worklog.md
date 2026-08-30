# Worklog: #1732 background reference-name validation / source safety

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-aspire-reference-name-validation--1732-source-safety` |
| Branch         | `fix/aspire-reference-name-validation`                     |
| Archetype      | `6 — CLI / Tooling` (dominant surface)                     |
| Scope overlays | none                                                       |

## Design

Design is locked for PLAN-EVAL. Implementation remains blocked until a separately dispatched
opposite-family evaluator returns `PASS`.

### Public Surface

- `parseAppSettings` configuration acceptance contract (observable public behavior).
- Generated `registerBackgroundProcessors` AppHost helper source.

### Domain Vocabulary

- Aspire resource name — a name accepted by Aspire 13.4.6's default resource policy.
- Reference kind — `ServiceReferences` or `PluginReferences`.
- Processor name — key under `BackgroundProcessors`.

### Ports

- None planned.

### Rule ownership

- `ASPIRE_RESOURCE_NAME_PATTERN` and canonical rule text are planned in the package-private
  `packages/aspire/src/domain/aspire-resource-name.ts` module.
- `packages/aspire/constants.ts` and the package export map remain unchanged; the grammar is an
  internal parsing invariant, not a new JSR API.

### Commit Slices

Plan artifacts → separately certified PLAN-EVAL → visible RED test commit → source-safe emission →
grammar lock → final static evidence. No implementation slice starts before PLAN-EVAL `PASS`.

### Deferred Scope

- All runtime and neighboring issue scope listed in the brief remains deferred.

### Contributor Path

Focused semantic RED tests → `JSON.stringify` at every name/reference literal emission while
retaining `safeIdentifier` → exact private grammar at the config boundary → final static gates.

## Progress Log

| Date       | Slice    | Step               | Notes                                                                                                                                                          |
| ---------- | -------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | research | compatibility gate | Exact Aspire grammar rejects currently scaffoldable `a--b`, `a-`, and over-64 names; stopped before implementation.                                            |
| 2026-08-30 | plan     | owner decision     | Locked source-safe emission first, then exact config grammar; approved observable fail-fast correction.                                                        |
| 2026-08-30 | plan     | published surface  | Moved the planned rule from exported `constants.ts` to a private `src/domain` module after correcting the JSR-surface analysis.                                |
| 2026-08-30 | plan     | baseline           | Doc-lint exits 1 on existing private-type refs; JSR audit exits 1 on four existing module-tag failures plus one slow-types warning. Neither is reported green. |

## Decisions

| Decision          | Reason                          | Source                                                                                                                             |
| ----------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Source safety     | `JSON.stringify` first          | The grammar was documentation/source-derived and not executed against Aspire; escaping remains protective if the grammar is loose. |
| Compatibility     | deliberate fail-fast correction | `a--b`, `a-`, and over-64 names are observably rejected earlier but are not runnable Aspire names today.                           |
| Published surface | private rule module             | Avoid a permanent JSR export for an internal parsing invariant; keep `./constants` unchanged.                                      |
| PLAN-EVAL         | `pending`                       | Owner will dispatch a separate opposite-family evaluator; this lane does not launch, simulate, or certify it.                      |

## Gate Results

| Gate                                                          | Exit | Result                                                                                      |
| ------------------------------------------------------------- | ---: | ------------------------------------------------------------------------------------------- |
| `deno task doc:lint --root packages/aspire --pretty` baseline |    1 | RED BASELINE — zero missing JSDoc/combined errors; existing private-type-reference findings |
| `audit-jsr-package.ts --root packages/aspire --text` baseline |    1 | RED BASELINE — four existing F-JSR-2 failures, one F-JSR-7 warning; dry-run OK              |
| Root `deno task test`                                         |    — | **NOT FIRED** by owner instruction; no false green substituted                              |
| Implementation gates                                          |    — | NOT RUN; no source or tests changed                                                         |

## Handoff Notes

- PLAN-EVAL is pending and is the only authorized next action; the owner dispatches it separately.
- Aspire grammar was **not executed against Aspire in this leaf**. The source/docs-derived rule is
  protected by load-bearing literal escaping in the implementation order.
- Final published plan head: the commit containing this worklog, resolved by branch `HEAD` after
  publication; its exact immutable SHA is copied into the PR `[PHASE: PLAN]` comment and final
  handoff because a Git commit cannot contain its own object ID.
