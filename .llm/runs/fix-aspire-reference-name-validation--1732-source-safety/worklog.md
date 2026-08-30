# Worklog: #1732 background reference-name validation / source safety

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-aspire-reference-name-validation--1732-source-safety` |
| Branch         | `fix/aspire-reference-name-validation`                     |
| Archetype      | `6 — CLI / Tooling` (dominant surface)                     |
| Scope overlays | none                                                       |

## Design

Design is locked. After independently verifying the final PLAN-EVAL findings, the owner released the
plan gate with bounded F1/F2 corrections and authorized implementation; there is no cycle 3.

### Public Surface

- `parseAppSettings` configuration acceptance contract (observable public behavior).
- Generated `registerBackgroundProcessors` AppHost helper source.

### Domain Vocabulary

- Aspire resource name — a name accepted by Aspire 13.4.6's default resource policy.
- Reference kind — `ServiceReferences` or `PluginReferences`.
- Processor name — key under `BackgroundProcessors`.
- Generated binding — generator-local TypeScript identifier derived only from fixed prefixes and
  stable ordinals, never user text.

### Ports

- None planned.

### Rule ownership

- `ASPIRE_RESOURCE_NAME_PATTERN` and canonical rule text are planned in the package-private
  `packages/aspire/src/domain/aspire-resource-name.ts` module.
- `packages/aspire/constants.ts` and the package export map remain unchanged; the grammar is an
  internal parsing invariant, not a new JSR API.

### Commit Slices

Plan artifacts → owner-released PLAN-EVAL → visible RED test commit → source-safe literal and
binding emission → composed-level grammar lock → final static evidence → separately dispatched
IMPL-EVAL.

### Deferred Scope

- All runtime and neighboring issue scope listed in the brief remains deferred.

### Contributor Path

Focused semantic RED tests → `JSON.stringify` at every config-derived literal emission plus exact
ordinal-backed `bg_` / `ref_service_` / `ref_plugin_` bindings → exact private grammar at the
composed config boundary → final static gates.

## Progress Log

| Date       | Slice       | Step               | Notes                                                                                                                                                               |
| ---------- | ----------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | research    | compatibility gate | Exact Aspire grammar rejects currently scaffoldable `a--b`, `a-`, and over-64 names; stopped before implementation.                                                 |
| 2026-08-30 | plan        | owner decision     | Locked source-safe emission first, then exact config grammar; approved observable fail-fast correction.                                                             |
| 2026-08-30 | plan        | published surface  | Moved the planned rule from exported `constants.ts` to a private `src/domain` module after correcting the JSR-surface analysis.                                     |
| 2026-08-30 | plan        | baseline           | Doc-lint exits 1 on existing private-type refs; JSR audit exits 1 on four existing module-tag failures plus one slow-types warning. Neither is reported green.      |
| 2026-08-30 | plan-eval   | cycle 1 `FAIL_FIX` | Evaluator proved D1 missed reserved/invalid/shadowing identifiers and non-name literal sites; evaluated head `fddcb833ba5e49466ac942112b41bd7712aa7c17`.            |
| 2026-08-30 | plan repair | F1/F2 resolution   | Locked user-text-free ordinal bindings; unconditional entrypoint/workdir escaping; conditional concurrency-key escaping; composed-only validation.                  |
| 2026-08-30 | plan-eval   | cycle 2 `FAIL_FIX` | Owner independently confirmed the flow-B fixture anchors and U+2028 comment seam, supplied mechanical satisfying conditions, and released the gate with no cycle 3. |
| 2026-08-30 | plan repair | gate release       | Pushed the bounded amendment at `f1d7d9d8f738b4907e1c770051ee1f59abaacc4a`; evaluator verdict files stayed untouched.                                               |
| 2026-08-30 | RED         | focused tests      | Structured two-file wrapper executed 99 results: 67 passed, 32 failed. Failures expose 24 missing config rejections plus six generator source/execution seams.      |

## Decisions

| Decision          | Reason                          | Source                                                                                                                               |
| ----------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Source safety     | literals plus bindings first    | Documentation-derived grammar cannot be the only defense; config-derived literals are stringified and bindings contain no user text. |
| Identifier seam   | option (a), ordinal bindings    | Accept Aspire-valid `class`/`await`/`builder` without reserved identifiers, collisions, or generator-binding shadowing.              |
| Non-name literals | stringify all three sites       | Resolved `Entrypoint`/`Workdir` are always stringified; `ConcurrencyEnvVar` is stringified whenever emitted.                         |
| Schema placement  | composed custom validation      | Prevent validation from leaking into published JSON schema for unrelated sections.                                                   |
| Compatibility     | deliberate fail-fast correction | `a--b`, `a-`, and over-64 names are observably rejected earlier but are not runnable Aspire names today.                             |
| Published surface | private rule module             | Avoid a permanent JSR export for an internal parsing invariant; keep `./constants` unchanged.                                        |
| PLAN-EVAL         | released after cycle 2          | Owner independently verified final mechanical findings, fixed the plan contract, authorized RED, and declared no cycle 3.            |

## Gate Results

| Gate                                                          | Exit | Result                                                                                        |
| ------------------------------------------------------------- | ---: | --------------------------------------------------------------------------------------------- |
| `deno task doc:lint --root packages/aspire --pretty` baseline |    1 | RED BASELINE — zero missing JSDoc/combined errors; existing private-type-reference findings   |
| `audit-jsr-package.ts --root packages/aspire --text` baseline |    1 | RED BASELINE — four existing F-JSR-2 failures, one F-JSR-7 warning; dry-run OK                |
| Root `deno task test`                                         |    — | **NOT FIRED** by owner instruction; no false green substituted                                |
| First wrapper invocation                                      |    1 | REFUSAL — type-check stopped before TAP selection; fixed test typing and did not count as RED |
| Focused RED wrapper                                           |    1 | EXPECTED RED — 67 passed, 32 failed, 99 total, 32 unique failures                             |
| PLAN-EVAL cycle 1                                             |    — | `FAIL_FIX`; bounded plan repair authorized, implementation remains blocked                    |
| PLAN-EVAL cycle 2                                             |    — | `FAIL_FIX`; owner-verified mechanical corrections applied and gate released; no cycle 3       |

## Handoff Notes

- Visible RED is established. Slice 2 may now change only the background generator, both focused
  generator tests, the flow-B fixture, and run artifacts under the locked contract.
- Aspire grammar was **not executed against Aspire in this leaf**. The source/docs-derived rule is
  protected by load-bearing literal escaping plus user-text-free ordinal bindings in the
  implementation order.
- Plan-release head: `f1d7d9d8f738b4907e1c770051ee1f59abaacc4a` (copied from `git log`).
- The RED commit SHA is copied from `git log` into the PR slice comment after publication because a
  Git commit cannot contain its own object ID.
