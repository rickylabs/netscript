# Worklog: managed collection navigation type contract

## Run Metadata

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Run ID         | `fix-fresh-form-navigation-drop--0.0.7`    |
| Branch         | `fix/fresh-form-navigation-drop`           |
| Base commit    | `dea44991120a2c5da96a89df0f68d69c455c035e` |
| Archetype      | `4 — Public DSL / Builder`                 |
| Scope overlays | `frontend`                                 |
| Current phase  | S1 research/plan; stop before PLAN-EVAL    |

## Design

### Public Surface

- `FormCollectionStrategy` remains the exported name from `@netscript/fresh/form`, but changes from
  an interface accepting every mode/navigation cross-product to a discriminated type alias.
- Client branch: `mode: 'client'` with `navigation?: never`.
- Server/hybrid branch: `mode: 'server' | 'hybrid'` with optional `navigation`.
- `FormCollectionStrategyMode`, `FormNavigationMode`, `applyCollectionStrategy()`, and all runtime
  return shapes retain their names and runtime behavior.
- JSR consequence: potentially breaking TypeScript surface change. The Deno-doc signature and kind
  move, so both the MCP export corpus and release surface hash move.

### Domain Vocabulary

- `client` collection mode — the browser/client code owns the collection update; no form submission
  navigation is promised by this mode.
- `server` collection mode — a form intent submission owns the update and may select client or
  document navigation.
- `hybrid` collection mode — server submission metadata remains available alongside client
  enhancement and may select client or document navigation.
- `navigation` — policy for a managed form submission, not a generic client-side state-transition
  setting.

### Ports

- None. Fresh is an existing framework dependency, and this type-only contract change introduces no
  replaceable collaborator or IO seam.

### Constants

- No new constants. Existing finite string unions already name the modes; duplicating them as
  runtime constants would enlarge the surface without need.

### Validation Rules

1. `{ mode: 'client', navigation: ... }` must fail type checking for either navigation value.
2. `{ mode: 'client' }` remains valid.
3. Server and hybrid strategies remain valid with omitted, client, or document navigation.
4. Existing legacy `partial` and `clientNav` acceptance is unchanged in all modes.
5. `applyCollectionStrategy()` runtime source is unchanged.

### Commit Slices

| # | Slice                                                                                  | Gate                                                                                              | Files                                              |
| - | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1 | S1 locks the type decision, breaking-surface consequence, ceiling, and exact baselines | Artifact review; static base measurements; lock/status verification                               | `research.md`, `plan.md`, `worklog.md`             |
| 2 | S2 encodes the union and compile-time contract witnesses                               | Scoped check/lint/fmt; `./form` doc-lint zero; package JSR/dry-run; quality/doctrine non-increase | `runtime-types.ts`, `form.test.tsx`, run artifacts |

### Deferred Scope

- Client-mode `partial`/`clientNav` narrowing — adjacent compatibility decision, not #1609.
- MCP corpus regeneration, release baseline update, and docs reference correction — discovered
  cross-package/docs work for supervisor ownership or explicit rescope.
- Any runtime diagnostic for JavaScript/untyped consumers — route (2) is a published TypeScript
  contract fix.

### Contributor Path

Future collection strategy changes start at `src/application/form/_internal/runtime-types.ts`,
follow the public re-export through `runtime/types.ts` and `form/mod.ts`, prove accepted/rejected
shapes in the colocated component test, then inspect Deno-doc/MCP/release surface drift before
changing runtime mapping in `components/enhancement.tsx`.

## Progress Log

| Time       | Slice | Step               | Notes                                                                                                              |
| ---------- | ----- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 2026-08-31 | S1    | bootstrap          | Activated harness and required doctrine/Fresh/Deno/PR/JSR/tooling skills; no evaluator launched.                   |
| 2026-08-31 | S1    | re-baseline        | Branch base is `dea4499`; newer local main changes only Fresh AI runtime, not owned form paths.                    |
| 2026-08-31 | S1    | surface inspection | `deno doc` confirmed `FormCollectionStrategy` is published only from `./form`, currently at runtime-types line 89. |
| 2026-08-31 | S1    | design decision    | Locked type narrowing because client ownership has no package-owned document-submission path.                      |
| 2026-08-31 | S1    | contract audit     | No test asserts silent drop; exact mode-client early return occurs once in the form concern.                       |
| 2026-08-31 | S1    | scope discovery    | MCP generated corpus, release surface baseline, and site reference will move outside the ceiling; do not absorb.   |
| 2026-08-31 | S1    | baseline           | Measured allowed static package gates; recorded exact existing reds/non-increase contracts.                        |

## Decisions

| Decision                           | Reason                                                                                                                          | Source                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Narrow type, do not move resolver  | Client mode owns a non-submitting update; an `f-client-nav` fallback does not implement document navigation for that operation. | Current code plus Fresh transport semantics |
| Inline discriminated union         | Correlates mode with navigation without a new public/helper type or private-type doc leak.                                      | Doctrine A1/A2; Archetype 4                 |
| Preserve runtime and legacy fields | Smallest behaviorally truthful fix; avoids unrelated compatibility break.                                                       | Issue boundary and current early return     |
| Report generated/reference churn   | Those files are outside `packages/fresh` and the locked leaf ownership.                                                         | Independence constraint                     |
| Do not rule on PLAN-EVAL           | The supervisor owns disposition.                                                                                                | S1 brief                                    |

## Drift

| Drift                                                                                                        | Severity                                       | Logged in drift.md                                               |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------- |
| Issue names stale `resolveFormEnhancementProps`; live target is `applyCollectionStrategy` at lines 42/49–51. | minor, already carried in brief and reverified | N/A; one of the three authorized S1 artifacts only               |
| Local `origin/main` is one commit ahead of branch base, but owned paths are unchanged.                       | minor                                          | N/A; recorded in all S1 artifacts                                |
| Type narrowing necessarily stales MCP/release/docs surfaces outside leaf ownership.                          | significant scope discovery                    | N/A; report to supervisor rather than create extra artifact/path |

## Gate Results

All base results below were measured at `dea44991120a2c5da96a89df0f68d69c455c035e`. Existing reds
are exact non-increase contracts.

### Static Gates

| Gate                     | Command or check                                                                                    | Result       | Notes                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Check                    | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS         | 200 files, 2 batches, 0 occurrences.                                                                 |
| Lint                     | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx`  | PASS         | 200/200 processed, 0 findings.                                                                       |
| Format                   | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx`   | PASS         | 200/200 processed, 0 findings.                                                                       |
| Full package doc-lint    | `deno task doc:lint --root packages/fresh --pretty`                                                 | RED baseline | Exit 1; exactly 45 = 28 private refs + 17 missing docs. Untouched builders/query/route/streams only. |
| Form entrypoint doc-lint | same structured report, `./src/application/form/mod.ts` row                                         | PASS         | 0 diagnostics; must remain 0.                                                                        |
| Package publish dry-run  | `deno task --cwd packages/fresh publish:dry-run`                                                    | PASS         | Exit 0; `Success Dry run complete`.                                                                  |

### Fitness Gates

| Gate                   | Result                      | Evidence                                                            | Notes                                                                                                                             |
| ---------------------- | --------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Code-quality scan      | PASS                        | `scan-code-quality.ts --root packages/fresh --max-allow 7 --pretty` | 0 findings, 0 allowances.                                                                                                         |
| Doctrine package check | PASS with baseline notices  | `check-doctrine.ts --root packages/fresh`                           | Exit 0; exactly 3 WARN + 1 INFO: two unrelated oversized files, one AI folder cardinality warning, missing architecture-doc info. |
| JSR audit              | PASS with baseline warnings | `audit-jsr-package.ts --root packages/fresh --text`                 | Exit 0; 16 exports, 166 files, 38 tests, 2 WARN. Audit reports slow-type banner; authoritative dry-run is green.                  |
| Lock hygiene           | PASS                        | `sha256sum deno.lock`                                               | `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.                                                               |

### Runtime Gates

| Gate                       | Result           | Evidence      | Notes                                                             |
| -------------------------- | ---------------- | ------------- | ----------------------------------------------------------------- |
| Unit/browser/runtime       | NOT RUN          | S1 constraint | Static, package-level, read-only commands only; no runtime lease. |
| Scaffold/CLI/Aspire/Docker | N/A / prohibited | S1 constraint | No command in these families was run.                             |

### Consumer Gates

| Consumer                                    | Result          | Evidence                                                                   | Notes                                                                          |
| ------------------------------------------- | --------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `@netscript/fresh/form` current declaration | INSPECTED       | `deno doc packages/fresh/src/application/form/mod.ts`                      | Current interface accepts optional navigation on every mode.                   |
| Existing silent-drop test contract          | ABSENT          | Focused form test/source search                                            | Server/document behavior is tested; client/drop combination is not.            |
| MCP export corpus                           | SCOPE DISCOVERY | Generator normalizes declaration kind/signature from `deno doc --json`     | Will move after S2; do not regenerate outside ceiling.                         |
| Release surface baseline                    | SCOPE DISCOVERY | Existing `FormCollectionStrategy` signature hash in `public-surfaces.json` | Will move and should classify the narrowing; do not update in this leaf.       |
| Site reference                              | SCOPE DISCOVERY | `docs/site/reference/fresh/index.md:379`                                   | Currently labels symbol `interface`; alias change needs another owner/rescope. |

## PLAN-EVAL Status

Pending supervisor disposition. This session generated the plan and cannot evaluate it. No
`plan-eval.md` was created, no evaluator was launched, and no implementation is authorized by this
worklog.

## Handoff Notes

- Review the design-decision conclusion and locked ceiling first.
- Confirm the supervisor accepts the potentially breaking type-alias route and decides who owns
  MCP/release/docs surface churn.
- If S2 is authorized, implementation must not begin until the supervisor's PLAN-EVAL disposition is
  recorded through the proper separate-session process.
- S1 stops after its artifact-only commit and explicit-refspec push. No PR is opened.
