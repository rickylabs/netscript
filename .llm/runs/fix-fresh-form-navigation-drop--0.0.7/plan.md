# Plan: make client collection navigation unrepresentable

## Run Metadata

| Field           | Value                                                                             |
| --------------- | --------------------------------------------------------------------------------- |
| Run ID          | `fix-fresh-form-navigation-drop--0.0.7`                                           |
| Branch          | `fix/fresh-form-navigation-drop`                                                  |
| Phase           | `plan` (S1 artifact-only)                                                         |
| Target          | `@netscript/fresh/form` published collection strategy                             |
| Base commit     | `dea44991120a2c5da96a89df0f68d69c455c035e`                                        |
| Re-baseline ref | `origin/main` @ `eaea940bea4c19593b97b9895b09f512039f4e13`; owned paths unchanged |
| Archetype       | `4 — Public DSL / Builder`                                                        |
| Scope overlays  | `frontend`                                                                        |

## Archetype

`packages/fresh` is explicitly assigned Archetype 4 by the current doctrine. This leaf changes a
caller-facing definition type in the managed-form DSL. It adds no runtime owner, adapter, port,
builder method, or extension axis.

## Current Doctrine Verdict

`packages/fresh`: **Keep** — preserve per-concern builders and route contracts. The change remains
inside the existing form concern. Existing Fresh compatibility and form migration debt is neither
deepened nor closed.

## Axioms in Play

| Axiom | Why it matters                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------- |
| A1    | The published strategy type must encode the valid mode/navigation combinations first.             |
| A2    | A caller-visible option must describe behavior the selected mode can execute.                     |
| A9    | The existing Archetype-4 form definition surface stays cohesive; no new seam is invented.         |
| A14   | Compile-time witnesses, scoped static gates, JSR checks, and surface drift preserve the contract. |

## Goal

Prevent TypeScript consumers from expressing `navigation` alongside `mode: 'client'`, eliminating
the silent acceptance/drop without pretending that a client-owned collection update performs a
document submission.

## Locked Product Path Ceiling

S2 may modify exactly these product/test paths:

1. `packages/fresh/src/application/form/_internal/runtime-types.ts`
2. `packages/fresh/src/application/form/components/form.test.tsx`

Run artifacts under `.llm/runs/fix-fresh-form-navigation-drop--0.0.7/` remain writable as harness
evidence. No other product, test, docs, generated, release-baseline, lock, workflow, or package path
is authorized. If implementation needs another path, stop and report for supervisor rescope before
editing it.

## Scope

- Replace the published `FormCollectionStrategy` interface with an explicitly documented
  discriminated union.
- Client branch: `mode: 'client'`, `navigation?: never`.
- Server/hybrid branch: `mode: 'server' | 'hybrid'`, optional caller-facing navigation policy.
- Preserve existing optional `partial` and deprecated `clientNav` fields in both branches.
- Add colocated compile-time witnesses that reject the invalid client/document combination and
  accept the supported client, server, and hybrid shapes.
- Preserve `applyCollectionStrategy()` runtime behavior byte-for-byte.

## Non-Scope

- No resolution-before-gate behavior change and no new diagnostic/runtime throw.
- No narrowing of `partial` or `clientNav` for client mode.
- No browser/unit runtime execution in S1; S2 gate execution follows supervisor disposition.
- No dependency/version/lock change.
- No scaffold, CLI, E2E, Aspire, service, Docker, or browser-runtime work.
- No MCP corpus generation, release baseline update, or site-reference edit without explicit
  supervisor rescope.
- No PR creation, PLAN-EVAL, IMPL-EVAL, merge, or release action in this S1 session.

## Hidden Scope

- The interface-to-type-alias change is a potentially breaking published TypeScript change and must
  be labeled/reviewed as such downstream.
- The normalized MCP export corpus will become stale, the release public-surface signature will
  move, and the site reference currently says `interface`. These are scope discoveries outside the
  ceiling, not incidental files to regenerate.
- A type-only rejection needs a checked negative witness (for example `@ts-expect-error`) so future
  widening fails the check rather than silently compiling.

## Locked Decisions

| ID | Decision                                                               | Rationale                                                                                                                                                                |
| -- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1 | Choose issue route (2): narrow the type.                               | Client mode owns an in-browser collection update and has no package-owned document-submission operation; route (1) would attach fallback metadata and misstate behavior. |
| D2 | Use a discriminated union keyed by `mode`.                             | This is the smallest TypeScript shape that correlates client ownership with forbidden navigation.                                                                        |
| D3 | Preserve server/hybrid navigation behavior and all runtime code.       | Those modes already resolve document/client navigation correctly; #1609 is type-contract scope.                                                                          |
| D4 | Preserve `partial` and `clientNav` on the client branch for this leaf. | Narrowing additional silently ignored legacy fields would enlarge the breaking surface beyond the issue.                                                                 |
| D5 | Treat the change as potentially breaking.                              | A previously accepted consumer object will fail to type-check, and the published declaration kind/signature moves.                                                       |
| D6 | Do not absorb generated/reference churn.                               | MCP, release baseline, and site docs are outside `packages/fresh` ownership and the locked ceiling.                                                                      |
| D7 | PLAN-EVAL is pending supervisor disposition.                           | The brief explicitly reserves the ruling to the supervisor and orders this session to stop after S1 push.                                                                |

## Open-Decision Sweep

| Decision                                        | Status                      | Notes                                                                        |
| ----------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| Behavior fix vs type fix                        | resolved now                | Type fix (D1).                                                               |
| Union branch fields                             | resolved now                | Only `navigation` becomes impossible in client mode.                         |
| Runtime implementation                          | resolved now                | No runtime change.                                                           |
| Test location                                   | resolved now                | Existing colocated `form.test.tsx`, inside ceiling.                          |
| Generated MCP corpus owner                      | safe to defer to supervisor | Reported as cross-package scope discovery; cannot be committed by this leaf. |
| Release surface baseline/docs reference owner   | safe to defer to supervisor | Same boundary as MCP corpus churn.                                           |
| Later narrowing of client `partial`/`clientNav` | safe to defer               | Separate compatibility decision, not required for #1609.                     |
| PLAN-EVAL verdict                               | must resolve before S2      | Supervisor/evaluator decision; this session does not rule.                   |

## Commit Slices

| # | Slice                               | What it proves                                                                                                         | Gate                                                                                                                               | Files                                                |
| - | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1 | S1 research/plan artifacts          | Decision, ceiling, risks, and exact baseline contracts are reviewable before code.                                     | Artifact diff, lock hash, clean scoped static baselines                                                                            | Three files in this run directory only               |
| 2 | S2 published discriminated strategy | Client navigation is unrepresentable while server/hybrid navigation remains accepted, with no runtime behavior change. | Negative/positive compile-time witnesses; scoped check/lint/fmt; form doc-lint; package JSR/dry-run; quality/doctrine non-increase | The two locked product/test paths plus run artifacts |

## Risk Register

| Risk                                                            | Mitigation                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Consumer source break is understated as a bug fix.              | State potentially breaking type change in plan, handoff, later PR metadata, and surface-diff evidence. |
| Union accidentally rejects valid server/hybrid strategies.      | Positive compile-time witnesses cover document/client navigation on both non-client modes.             |
| Union leaks a private helper type and dirties form doc-lint.    | Prefer an inline exported union and hold `./form` to zero diagnostics.                                 |
| Runtime behavior changes despite a type-only decision.          | Product diff ceiling plus explicit no-change review of `enhancement.tsx`.                              |
| Existing package reds are promised green.                       | Exact non-increase contracts below; form entrypoint alone stays green.                                 |
| Corpus/reference churn is silently committed outside ownership. | Do not run mutating generators; report stale check and exact paths to supervisor.                      |
| Lock changes during static gates.                               | Compare SHA-256 to `edfa0c24…82d989d1820c`; any movement is a hard stop.                               |

## Anti-Patterns to Resolve or Avoid

| AP                                      | Status     | Plan                                                                                 |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| AP-9 premature abstraction              | risk       | One closed discriminated union; no registry, helper, or typestate framework.         |
| AP-15 implementation-shaped public name | avoided    | Preserve caller vocabulary `mode` and `navigation`; raw Fresh attrs remain internal. |
| AP-22 useless barrel                    | unaffected | Keep current re-export chain; add no barrel.                                         |
| AP-25 side effect in non-edge file      | avoided    | Type/test-only change; no runtime effect.                                            |

## Measured Base Gate Contracts

All measurements are at `dea44991120a2c5da96a89df0f68d69c455c035e`. These are S2 contracts, not
promises that pre-existing package debt becomes green.

| Gate                                | Base measurement                                                                                           | S2 contract                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Scoped check                        | PASS; 200 files, 2 batches, 0 occurrences                                                                  | PASS, 0 occurrences                                                                              |
| Scoped lint                         | PASS; 200/200 processed, 0 findings                                                                        | PASS, 0 findings                                                                                 |
| Scoped format                       | PASS; 200/200 processed, 0 findings                                                                        | PASS, 0 findings                                                                                 |
| Full Fresh doc-lint                 | RED; 45 diagnostics = 28 `private-type-ref` + 17 `missing-jsdoc`                                           | Exact non-increase: ≤45 total, ≤28 private refs, ≤17 missing docs; no new path                   |
| `./form` doc-lint sub-entrypoint    | PASS; 0 diagnostics                                                                                        | PASS, 0 diagnostics                                                                              |
| Code-quality scan, `packages/fresh` | PASS; 0 findings, 0 allowances                                                                             | PASS; 0 findings, 0 allowances                                                                   |
| Doctrine fitness, `packages/fresh`  | Exit 0 with 3 WARN + 1 INFO: two F-1 oversized files, one F-16 cardinality, missing architecture doc info  | Exact non-increase; no new warning/info and no finding in owned form paths                       |
| JSR audit                           | Exit 0; 2 WARN (F-DOCT-5 cardinality and audit slow-types banner), 16 exports, 166 publish files, 38 tests | Exact non-increase; `./form` surface remains documented; report type change                      |
| Package publish dry-run             | PASS; `Success Dry run complete`                                                                           | PASS; no new slow-type/error and intended file list only                                         |
| Runtime/browser tests               | NOT RUN in S1 by constraint                                                                                | Required only after supervisor authorizes S2; use focused package test wrapper, no service lease |
| MCP corpus check                    | NOT RUN; cross-package surface outside S1 ceiling                                                          | Expected to report stale after type change; report, do not regenerate                            |

## Fitness Gates

| Gate                                                     | Required                         | Expected evidence                                                                |
| -------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| F-1/F-3/F-5/F-10/F-11/F-12/F-14/F-15/F-16/F-17/F-18/F-19 | yes                              | Scoped wrappers plus package doctrine exact non-increase; no owned-path findings |
| F-6 JSR publishability                                   | yes                              | Package audit and dry-run; potentially breaking type consequence named           |
| F-7 documentation                                        | yes                              | `./form` stays at zero; full package stays within exact 45-diagnostic ceiling    |
| Frontend browser gate                                    | N/A for this type-only narrowing | Runtime and rendered behavior do not change; no browser lease is authorized      |
| Consumer contract                                        | yes                              | Negative/positive compile-time witnesses and package check                       |

## Arch-Debt Implications

| Entry                                                | Action        | Notes                                                              |
| ---------------------------------------------------- | ------------- | ------------------------------------------------------------------ |
| Existing `packages/fresh` compatibility/form entries | none          | This leaf neither deepens nor closes them.                         |
| Existing package doc/doctrine baseline               | none          | Record exact non-increase; do not create debt for untouched paths. |
| New debt                                             | none expected | Any need for a new allowance/debt entry is a stop/rescope signal.  |

## Validation Plan

| Order | Gate              | Command or check                                                                                            | Expected result                                                        |
| ----- | ----------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1     | Type contract     | Focused checked negative/positive witnesses in `form.test.tsx` through the structured check wrapper         | Client+navigation rejected; supported shapes compile                   |
| 2     | Scoped static     | `run-deno-check/lint/fmt` with `--root packages/fresh --ext ts,tsx`                                         | Zero findings                                                          |
| 3     | Form docs         | `deno task doc:lint --root packages/fresh --pretty`                                                         | `./form` zero; full package exact non-increase from 45                 |
| 4     | Quality/doctrine  | Package-root quality scan and doctrine checker                                                              | 0 quality findings; no increase from 3 WARN/1 INFO                     |
| 5     | JSR               | Package audit and `deno task --cwd packages/fresh publish:dry-run`                                          | Exit 0; no new warning/error; breaking surface named                   |
| 6     | Surface discovery | Read-only MCP corpus check and release surface diff only if supervisor authorizes cross-package diagnostics | Expected stale/moved signature is reported; no generated/baseline edit |
| 7     | Lock/status       | SHA-256 and raw git status/diff                                                                             | Lock remains `edfa0c24…82d989d1820c`; only ceiling/run files changed   |

## Dependencies

- Existing Fresh 2.3.3 and TypeScript/Deno declaration semantics only. No dependency change.

## Drift Watch

- Any implementation need outside the two locked product/test files.
- Any evidence that client mode submits through a package-owned path after all.
- Any new doc-lint, quality, doctrine, JSR, or lock finding.
- Any request to regenerate MCP/reference/release surfaces inside this leaf without supervisor
  rescope.
