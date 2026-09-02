# Plan: workers registry compiler parity

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-workers-registry-compiler-parity--1875` |
| Branch | `fix/workers-registry-compiler-parity` |
| Phase | `plan` |
| Target | `plugins/workers` |
| Archetype | `5 - Plugin Package` |
| Scope overlays | `none` |

## Archetype

Archetype 5 applies because this is first-party `plugins/workers` wiring. The repair preserves the
thinness law: core continues to own `JobConfig` and every validation/default rule; the plugin only
emits the complete core-owned shape and tests parity against the core schema.

## Current Doctrine Verdict

`plugins/workers`: **Refactor** — complete connector thinness and the jobs/worker contribution
split. This bounded repair neither attempts nor deepens that broader refactor.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The core-owned `JobConfig` contract controls the emitted shape. |
| A9 | The plugin stays Archetype 5 thin glue rather than becoming a second contract owner. |
| A14 | A schema-derived parity test becomes the fitness function preventing silent policy loss. |

## Goal

Make schema-to-emitted-output parity fail loudly whenever `JobConfig` gains a key the registry
compiler does not emit, while repairing the five live omissions without duplicating validation.

## Scope

- Add the missing optional keys to the emitted local job definition with explicit `undefined`
  values.
- Extend the existing registry compiler golden test with a schema-derived subset assertion.
- Maintain harness artifacts and focused gate evidence.

## Non-Scope

- No changes to validation rules, defaults, schema ownership, or public exports.
- No changes to `generate-runtime-registries.ts`, `runtime-registry-generator.ts`, or
  `official-sample-configuration.ts`.
- No local runtime, Aspire, Docker, or `e2e:cli` validation.
- No remediation of existing plugin doctrine or JSR debt.

## Hidden Scope

- The golden source must change because five currently omitted keys are a live defect.
- The parity assertion must tolerate compiler-only `RegisterJobInput` keys such as
  `executionType`; only schema → emitted output is required.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Read keys from `JobConfigSchema` after a runtime `z.ZodObject` guard. | Uses the public core contract value without exporting new internals or casting around types. |
| D2 | Compare schema keys as a subset of keys parsed from the emitted `createLocalJobDefinition` object. | Enforces the required direction while allowing legitimate compiler-only fields. |
| D3 | Emit absent optional fields as explicit `undefined`. | Preserves shape parity without inventing defaults, constraints, or user policy. |
| D4 | Keep the assertion beside the byte-golden test. | Reuses the existing deterministic output fixture and avoids a second compiler harness. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| How to derive expected fields | resolved now | `JobConfigSchema` runtime Zod shape. |
| How to treat compiler-only keys | resolved now | Schema keys must be a subset of emitted keys. |
| Whether to redesign compiler inputs | safe to defer | Outside #1875; no redesign is needed for the parity gate. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Test accidentally hand-lists today's contract | Derive all expected keys from the schema's `.shape`. |
| Test duplicates schema validation/defaults | Assert keys only; do not parse values or repeat constraints. |
| Regex observes another object | Bound extraction to the emitted `createLocalJobDefinition` return block and fail if absent. |
| Unrelated concurrent work is touched | Inspect status/diff and enforce the three explicit file exclusions. |
| Lock churn | Compare `deno.lock` before/after every validation pass. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-14 | risk | Import and inspect the core-owned contract; never redefine it. |
| AP-1 | risk | Extend the existing focused test rather than adding a parallel test harness. |
| AP-25 | avoided | No new effects or runtime infrastructure. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-3 | yes | `deno task arch:check` through `quality:gate`. |
| F-5/F-6/F-7 | reviewed | No public-surface change; focused JSR audit confirms no new publish risk. |
| F-10 | yes | Focused structured test wrapper. |
| F-19 | yes | Structured check/test/lint/fmt wrappers with non-empty selections. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `plugins/workers — doctrine verdict Refactor` | none | This repair does not alter the broader folder-shape debt. |
| `workers-private-type-ref-1655` | none | No public export or documentation surface changes. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Focused test | Structured test wrapper on `registry-compiler-golden_test.ts` | PASS |
| 2 | Plugin check | Structured check wrapper rooted at `plugins/workers` | PASS |
| 3 | Plugin lint | Structured lint wrapper rooted at `plugins/workers` | PASS |
| 4 | Plugin format | Structured fmt wrapper rooted at `plugins/workers`, TS/TSX only | PASS |
| 5 | Quality/doctrine | `deno task quality:gate` | PASS |
| 6 | JSR audit | Package audit helper for `plugins/workers` | No new finding attributable to this slice |
| 7 | Lock hygiene | `git diff --exit-code -- deno.lock` | PASS |

## Dependencies

- `@netscript/plugin-workers-core/config` supplies the core-owned schema value.
- Zod is already a plugin dependency through the workspace catalog.

## Drift Watch

- Any need to modify a prohibited coordination file or redesign the core contract requires rescope.
- Any additional current schema key missing from output must be reported as a live defect.
