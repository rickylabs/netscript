# Plan: published JSDoc internal-codename cleanup

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `docs-1554-codenames--leaf` |
| Branch | `docs/1554-jsdoc-internal-codenames` |
| Phase | `impl` |
| Target | Published JSDoc and matching reference pages |
| Archetype | `3 - Runtime / Behavior` for both touched packages |
| Scope overlays | `docs` |

## Archetype

Both plugin core packages own long-running saga/trigger behavior and therefore use Archetype 3.
`packages/cli` is Archetype 6, but its only raw match is an executable generated-file template and
is excluded by the owner boundary, so CLI source will not be changed.

## Current Doctrine Verdict

The historical doctrine table classifies the predecessor saga/trigger runtime packages as
Archetype 3 (`@netscript/sagas` Refactor, `@netscript/triggers` Restructure). This slice neither
changes shape nor deepens those verdicts. A1/A2/A14 and F-5/F-7/F-19 govern the published text.

## Goal

Replace every internal planning codename in published JSDoc with consumer-actionable truth, align
reference symbol summaries to authoritative `deno doc`, and add a negative JSDoc-only policy test.

## Scope

- Correct 26 JSDoc tokens in `plugin-triggers-core` and `plugin-sagas-core`.
- Preserve lowercase public durability values where naming them is useful.
- Align the trigger/saga reference tables where affected summaries are present.
- Add one focused regression test that scans JSDoc blocks under publishable source roots.
- Record exact found/fixed/remaining counts and deliberate exclusions.

## Non-Scope

- Runtime behavior, exports, types, signatures, symbol names, or lowercase durability values.
- Executable strings, including Zod descriptions and CLI generated-file templates.
- `.llm/tools/release/**`, `.llm/tools/docs/**`, MCP agent-docs generation, E2E/scaffold gates.

## Hidden Scope

- Multi-entrypoint saga docs under `./ports` and `./stores`, not only root `mod.ts`.
- The regression test must distinguish comment prose from TypeScript generic identifiers.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Source JSDoc changes precede reference-page changes. | `deno doc` is the reference authority. |
| D2 | Scan only `/** ... */` blocks in non-generated source TypeScript. | Prevents generic-signature and executable-string false positives. |
| D3 | Replace codenames with mechanisms and public lowercase durability values. | Says what each symbol is without inventing capability. |
| D4 | Leave non-comment matches untouched and report them. | Executable-statement changes are a hard stop. |
| D5 | PLAN-EVAL is N/A. | The live issue and owner brief already lock contract, boundaries, sequencing, acceptance, and gates. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Replacement wording | Resolved now | Derived from `deno doc`, surrounding types, and runtime implementation. |
| CLI raw match | Safe to defer | Requires executable template mutation outside this slice's authorization. |
| Saga schema-description raw match | Safe to defer | Requires executable schema mutation outside this slice's authorization. |
| Wider internal-language taxonomy | Safe to defer | This regression locks the measured `Group X`/`Tn` class; a broader classifier would inflate into its own tool. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Blanket `T1` replacement corrupts generics | Parse JSDoc blocks only; inspect all raw hits before edits. |
| Wording invents runtime capability | Derive summaries from exported unions, interfaces, constants, and actual processor behavior. |
| Reference page drifts from source | Generate `deno doc --json` and compare affected symbol summaries. |
| Formatting rewrites comments | Run scoped formatter, then repeat census and reread all changed JSDoc. |
| Gate mutates `deno.lock` | Inspect against baseline after gates; do not accept lock churn. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-9 | Risk | Avoid speculative generalized wording tooling; keep a focused policy test. |
| AP-18 | Risk | Assert semantic finding locations/counts rather than snapshotting generated docs. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-5/F-7 | Yes | Full-export `doc:lint`, `deno doc --json`, reference comparison. |
| F-6 | Review only | JSR audit confirms no surface/type/file-list change; owner gates do not request dry-run. |
| F-19 | Yes | Scoped check/lint/fmt wrappers for each touched package. |
| A14 regression | Yes | Focused negative policy test and repo tests. |
| Framework quality | Yes | `quality:gate`. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| None | none | Comment truth and focused test create no architectural debt. |

## Validation Plan

The commands and expected outcomes are exactly those in the owner gate table, plus the focused
regression test, `quality:scan`/`arch:check` required by harness, and final raw/comment censuses.

## Dependencies

- PR #1541 is already merged in the exact baseline.
- Mandatory IMPL-EVAL is a fresh opposite-family session owned by the orchestrator after handoff.

## Drift Watch

- Any executable-statement diff under `packages/**` is a hard stop.
- Any source/reference summary mismatch is a failed gate.
- Any codename that cannot be described confidently is left unchanged and logged.
