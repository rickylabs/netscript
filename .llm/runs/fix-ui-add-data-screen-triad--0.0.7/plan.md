# Plan: #1357 `ui:add` data-screen triad

## Run Metadata

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| Run ID         | `fix-ui-add-data-screen-triad--0.0.7`                           |
| Branch         | `fix/ui-add-data-screen-triad`                                  |
| Phase          | `plan` — S1 hard stop                                           |
| Target         | `packages/cli` public command + application generator + CLI E2E |
| Archetype      | `6 — CLI / Tooling`                                             |
| Scope overlays | `frontend`                                                      |

## Archetype

`packages/cli` is Archetype 6 because it ships the executable command and scaffolding workflow. The
frontend overlay applies because its artifact contract is a Fresh page/island/loader slice. The
design preserves the existing horizontal kernel + vertical public feature split; it adds no package,
adapter, registry, composition root, or extension axis.

## Current Doctrine Verdict

`packages/cli`: **Keep — preserve the Archetype-6 kernel/surface split**
(`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`).

## Axioms in Play

| Axiom | Why it matters                                                                            |
| ----- | ----------------------------------------------------------------------------------------- |
| A1    | Lock the generated roles, input, output, and errors before implementation.                |
| A2    | `ui:add` must honestly refuse when it cannot bind real data.                              |
| A6    | Use the existing application module and port; add no speculative base class/helper layer. |
| A8    | Keep command parsing, emission planning, and E2E proof in their existing concern files.   |
| A10   | Preserve the public CLI composition root and #1356 app-root resolver.                     |
| A11   | Query binding is a bounded convention, not a new registry/extension axis.                 |
| A14   | Semantic goldens and generated-consumer type-checks prove behavior.                       |

## Goal

Make `netscript ui:add page <path> --island` emit the four honest roles it advertises—a typed page
using `appRoutes`, a cache-first loader bound to a generated query factory, a route-local
`QueryIsland`/`useIslandQuery` island seeded with both loader data and `initialDataUpdatedAt`, and a
`router.ts` registration—while making every data-bound invocation fail before writes when no exact
binding exists.

## Scope

- Replace the page `--island` counter/empty object with a real data-bound triad and router update.
- Make `ui:add island <Name> --query` issue the same real factory query.
- Add application-level planning/preflight semantics for `force` and `dryRun`.
- Put both generated island modes under the route-tree `routes/**/(_islands)/` convention.
- Complete `UiAddCommandInput` with `dryRun`; keep #1356's actual `app` shape unchanged.
- Add semantic positive/negative goldens and a help-to-emission-role contract.
- Add a `scaffold.runtime` gate definition that runs the command after `init --service` has emitted
  its canonical route-local factory and lets the existing generated-workspace check type-check the
  result.

## Non-Scope

- #1354: no new generator verb/minimal flag, route-contract sidecar, named procedure selection,
  `withResource`, `(_components)`, form, partial, stream, state extension, ownership comments,
  app-owned registry composition, content-compare/idempotent rerun, or manifest-derived route verb.
- #1355: no change to `service add --with-client`, query factory generation, query keys,
  invalidation, client placement, or multi-service selector.
- #1360: no edits to either canonical showcase island/loader asset and no migration note.
- #1333/#1090/#1102/#1197: no shipped example modernization, adoption box, MCP, or discovery work.
- No docs/corpus edits. The generated-corpus how-to and three other known-stale public descriptions
  are explicitly deferred under D17 and recorded in `drift.md` for supervisor-owned follow-up.
- No `packages/fresh`/`packages/sdk` source changes, public `packages/cli/mod.ts` export change,
  dependency/version change, generated shared-carrier regeneration, or `deno.lock` change.

## Hidden Scope

- `router.ts` is an existing-file mutation and therefore one of the planned generated-file roles.
- The no-binding check must complete query-factory discovery, supported-list-dialect detection,
  route-key validation, target collision checks, and router insertion validation before the first
  `createDir`/`writeFile` call.
- `--dry-run` returns/prints the exact planned file set (including `router.ts`) and performs no IO.
- `--force` applies to web-scaffold targets and the owned router insertion, not only registry
  copies.
- A generated-consumer gate must be ordered after the existing `service add --with-client` gate and
  explicitly selected into `RUNTIME_GATES`; definition without selection is not a delivered gate.
- Help and emitted files need one shared role vocabulary so prose cannot claim an absent role. The
  test must render the real command help surface, not compare a constant to itself.

## Locked Product Path Ceiling

S2 may change **only** these product/test paths. Any additional path is a rescope and requires a
drift entry, an amended ceiling, and a new separate PLAN-EVAL before editing it.

1. `packages/cli/src/kernel/application/ui/web-scaffold.ts`
2. `packages/cli/src/kernel/application/ui/web-scaffold_test.ts`
3. `packages/cli/src/public/features/ui/add/add-ui-command.ts`
4. `packages/cli/src/public/features/ui/add/add-ui-command_test.ts`
5. `packages/cli/src/public/features/ui/add/add-ui-input.ts`
6. `packages/cli/src/public/features/ui/ui-app-root-command_test.ts`
7. `packages/cli/e2e/src/domain/cli-surface.ts`
8. `packages/cli/e2e/src/application/gates/scaffold/ui-data-screen-gates.ts` (new)
9. `packages/cli/e2e/src/application/gates/scaffold/scaffold-capability-gates.ts`
10. `packages/cli/e2e/tests/application/gates/scaffold/ui-data-screen-gates_test.ts` (new)
11. `packages/cli/e2e/tests/presentation/suite-registry_test.ts`
12. `packages/cli/e2e/suites/scaffold/capability-suites.ts`

The run directory is outside this product ceiling and remains writable for harness evidence.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                                                                                                                                                                           | Rationale                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | #1357 is the minimal mode of the existing `ui:add`, not a second generator.                                                                                                                                                                                                                                                                                        | Preserves #1354's broader resource-slice ownership.                                                                                                                                            |
| D2  | Data-bound modes first consider conventional app-local `lib/<service>.ts` modules generated by `service add --with-client`: exactly one binds, multiple fail. If none exists, exactly one canonical route-local query module emitted by `init --service` may bind; zero/multiple fallbacks fail. Every candidate must expose the canonical `...Queries.list` seam. | An explicit client should win over the bundled teaching example, while a pristine scaffold must satisfy runtime acceptance. No selector exists; guessing among peers would absorb #1354/#1355. |
| D3  | The binder supports the two existing generated `list` input dialects only: persistent CRUD and memory. Unsupported/custom client modules fail with the prerequisite/candidate diagnostic.                                                                                                                                                                          | Delivers a working scaffolded-project path without arbitrary contract introspection.                                                                                                           |
| D4  | The zero-binding error names `netscript service add --name <service> --with-client`; ambiguous/unsupported errors list candidates and state that one conventional generated client is required.                                                                                                                                                                    | Satisfies the prerequisite-verb acceptance and keeps the failure actionable.                                                                                                                   |
| D5  | Binding discovery, input-dialect recognition, route validation, all target collision checks, and router insertion validation happen before any filesystem mutation.                                                                                                                                                                                                | Acceptance item 8 requires a real no-write precondition, not cleanup.                                                                                                                          |
| D6  | `--dry-run` completes the same plan/preflight and returns/prints planned paths without `createDir`/`writeFile`; `--force` authorizes replacement of planned web files and a recognized owned router registration only.                                                                                                                                             | Matches CLI semantics without taking #1354's content-compare rerun scope.                                                                                                                      |
| D7  | Both `ui:add page <path>` modes use `router.ts`/`appRoutes` registration: the plain non-island page emits only the static page plus registration, while `--island` emits the data-screen roles plus registration. Page files never declare inline `createRouteReference` calls.                                                                                    | States the non-island path and meets #1357's typed-route boundary while leaving manifest-derived generation to #1354.                                                                          |
| D8  | Canonical placement is route-tree `routes/**/(_islands)/`: page islands use their route directory; standalone islands use `routes/(_islands)/`.                                                                                                                                                                                                                    | One documented convention works even though standalone syntax has no route argument.                                                                                                           |
| D9  | Existing top-level `islands/` and already generated route-local files remain supported and untouched; there is no migration or automatic move. Only future `ui:add island` output changes location.                                                                                                                                                                | Avoids destructive migration and preserves scaffolded-app compatibility.                                                                                                                       |
| D10 | A data island receives `input`, `initialData`, and `cachedAt`; it calls `useIslandQuery` with factory `.clientKey(input)`, factory query behavior, `initialData`, and `initialDataUpdatedAt: cachedAt`, inside `QueryIsland`. The Fresh option is optional (`?: number`), but this generator contract always wires it when seeding data.                           | The existing optional Fresh API is enough; #1360 is not a landing dependency.                                                                                                                  |
| D11 | The loader calls `createNetScriptQueryClient`, factory `.queryOptions(input)`, and `fetchQuery`, then returns the real result and `cachedAt`. The minimal island renders contract-derived output as formatted data, not a counter.                                                                                                                                 | Establishes actual cache-first fetch/render behavior without stealing #1354's component layer.                                                                                                 |
| D12 | #1360 retains both canonical showcase variants and the migration note. #1357 only emits correct new files by construction.                                                                                                                                                                                                                                         | Parallel ownership is explicit and non-overlapping.                                                                                                                                            |
| D13 | `UiGeneratedFile` gains a semantic role and help consumes `UI_DATA_SCREEN_FILE_ROLES`. The contract test renders the real `ui:add` command help, extracts its advertised roles, and independently compares them with the actual planned output role set; it does not compare the shared constant to itself.                                                        | Couples the user-visible command surface to emission instead of creating an illusory constant-to-constant check.                                                                               |
| D14 | The negative golden feeds the semantic validator the old counter-only/empty-loader shapes and must fail; the positive golden checks imports/calls/props, role set, route registration, and absence of the two placeholders.                                                                                                                                        | Prevents regression without a brittle giant text snapshot (AP-18).                                                                                                                             |
| D15 | `app` remains exactly the existing optional string passed to `requireUiAppRoot`; only `dryRun?: boolean` is added to `UiAddCommandInput`.                                                                                                                                                                                                                          | Confirms and consumes #1356 rather than re-fixing it.                                                                                                                                          |
| D16 | The runtime E2E is defined and selected in S2, but the author never runs it. It remains REQUIRED / supervisor-coordinated / `NOT_RUN` here.                                                                                                                                                                                                                        | The cluster-wide runtime lease remains required. D-42/D-43 were resolved before S2D, so the gate is queued on lease availability rather than blocked by DinD topology.                         |
| D17 | No shared generated carrier is regenerated in-leaf. A stale cascade check is a stop-and-report supervisor handoff.                                                                                                                                                                                                                                                 | Preserves ownership and avoids cross-leaf generated churn.                                                                                                                                     |

## Open-Decision Sweep

| Decision                                             | Status        | Notes                                                                                                           |
| ---------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| #1354 consolidation boundary                         | Resolved      | D1–D3; no second verb or rich slice features.                                                                   |
| Can #1357 meet `initialDataUpdatedAt` without #1360? | Resolved      | Yes; D10–D12, existing `IslandQueryOptions` surface.                                                            |
| Actual #1356 `app` shape                             | Resolved      | D15; optional string, existing resolver unchanged.                                                              |
| Island convention and compatibility                  | Resolved      | D8–D9.                                                                                                          |
| No-binding transaction boundary                      | Resolved      | D4–D6.                                                                                                          |
| Golden/help seam                                     | Resolved      | D13–D14.                                                                                                        |
| Multiple services/procedures                         | Safe to defer | Prefer one explicit app client over the init example, but fail peer ambiguity; selector belongs to #1354/#1355. |
| Manifest-derived route regeneration                  | Safe to defer | #1354; #1357 centralizes registration in `router.ts`/`appRoutes`.                                               |
| Rich data presentation                               | Safe to defer | Minimal typed JSON/data rendering proves real data; `(_components)` belongs to #1354.                           |

## Generated-Derivative Cascade

Derived from the named tooling rather than guessed:

| Checker                             | Base      | Expected movement                                                                                       | S2 rule                                                                  |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `deno task check:agent-docs-prose`  | exit 0    | Stays green because the locked ceiling writes no agent-docs prose or generated-corpus member.           | Run read-only check; stale result stops the leaf.                        |
| `deno task check:assets-barrel`     | `NOT_RUN` | Expected stable/green because the locked ceiling writes no asset, manifest, or generated-corpus member. | Do not run: it writes before diffing. Supervisor handoff only if needed. |
| `deno task check:publish-assets`    | exit 0    | Stays green because the locked ceiling writes no publish asset or generated-corpus member.              | Run `--check` task; never regenerate.                                    |
| `deno task check:mcp-export-corpus` | exit 0    | Stays green because the locked ceiling writes no MCP export or generated-corpus member.                 | Run check; stale corpus is stop-and-report.                              |

## Risk Register

| Risk                                                            | Mitigation                                                                                                                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text mutation corrupts `router.ts` or duplicates a route key.   | Validate one recognized `appRoutes` anchor and no conflicting route/property before planning writes; golden exact mutation cases and forced rerun cases.                   |
| A custom client is mistaken for the canonical query factory.    | Search only the two owned generation locations, require a narrow recognized export/import signature and supported `list` dialect, and fail closed.                         |
| Sequential IO partially writes after an unrelated disk failure. | This leaf guarantees no writes for validation/precondition failures; general transactional filesystem rollback is outside acceptance and would require a new port/rescope. |
| Help drifts from generated artifacts again.                     | Real rendered-help versus independently planned result-set test (D13).                                                                                                     |
| Base-red lint/fmt is accidentally reported green.               | Preserve measured failures; use valid split-scope wrapper commands and compare against base.                                                                               |
| Runtime proof cannot boot on this host.                         | Define/select the gate, do not run it; supervisor coordinates the lease/host.                                                                                              |
| Shared derived corpora become stale.                            | Stop and report; do not regenerate shared assets in leaf.                                                                                                                  |

## Anti-Patterns to Resolve or Avoid

| AP         | Status             | Plan                                                                                                                     |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| AP-1 / F-1 | risk               | Keep `web-scaffold.ts` application logic ≤250 LOC; if it cannot fit inside the locked ceiling, rescope before splitting. |
| AP-6       | avoid              | No orchestration in spine abstracts and no new base class.                                                               |
| AP-18      | existing test risk | Semantic role/contract goldens, not a monolithic generated text snapshot.                                                |
| AP-21      | avoid              | Preserve `public/features/ui/add` vertical slice and kernel application placement.                                       |
| AP-23      | avoid              | No composition-root changes.                                                                                             |
| AP-25      | avoid              | All generator IO remains through `FileSystemPort`; no direct `Deno.*` in product logic.                                  |

## Fitness Gates

| Gate            | Required | Expected evidence                                                                        |
| --------------- | -------- | ---------------------------------------------------------------------------------------- |
| F-1 / F-CLI-1/2 | yes      | LOC/path scan and structured lint/check over changed files.                              |
| F-15            | yes      | Whole `packages/cli` and nested `packages/cli/e2e` tests plus generated consumer gate.   |
| F-CLI-12/13     | yes      | Source inspection/tests prove all IO uses `FileSystemPort` and no new process execution. |
| F-CLI-16/17     | yes      | Existing thin command shape and command tests.                                           |
| F-CLI-23        | yes      | Collision/force/dry-run/preflight tests.                                                 |
| F-CLI-24/31     | yes      | Asset/extension checks unchanged; no new key/registry.                                   |
| SCOPE-frontend  | yes      | Generated app command + type-check gate; runtime execution is supervisor-coordinated.    |

## Arch-Debt Implications

| Entry                                                   | Action        | Notes                                                                                    |
| ------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| CLI missing `CliCommandGroup` / legacy spine signatures | none          | Pre-existing doctrine mismatch; no spine touch.                                          |
| `ScaffoldCommand` has one concrete                      | none          | Pre-existing R-BASE-L2 mismatch; this functional leaf does not expand it.                |
| Package-local lint/fmt task path bug                    | none          | Measured base-red tooling debt; use root wrappers in split scopes and report separately. |
| New debt                                                | none expected | A ceiling breach, new port/axis, or unsupported generic binder requires rescope.         |

## Commit Slices

| #   | Slice                                                                                                                     | Gate                                                                                            | Files              |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------ |
| S1  | Research, doctrine/design checkpoint, locked ceiling, measured baselines                                                  | harness artifact inspection; clean diff; lock hash                                              | run directory only |
| S2A | Contract-first planner/preflight, four-role data screen, one island convention, force/dry-run semantics, semantic goldens | whole CLI test/check; split scoped check/lint/fmt                                               | ceiling 1–2        |
| S2B | Public options/help/result reporting and help↔role negative seam                                                          | whole CLI test/check; command tests                                                             | ceiling 3–6        |
| S2C | Generated-consumer gate definition and explicit `scaffold.runtime` selection                                              | whole E2E check/test; emitted-samples                                                           | ceiling 7–12       |
| S2D | Merge-readiness evidence and supervisor runtime handoff                                                                   | quality/arch/JSR/publish/cascade checks; runtime remains supervisor `NOT_RUN` until coordinated | run artifacts only |

No S2 slice starts before a separate PLAN-EVAL writes `PASS` for this S1 commit.

## Validation Plan and Measured Base

All pass/fail values below were measured at exact base `de57fab0`; `NOT_RUN` values are deliberate.

| Order | Gate                                                                                                                                        | Base result                                                                               | S2 promise                                                                                                                                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `deno task --cwd packages/cli check`                                                                                                        | PASS, exit 0                                                                              | Required PASS.                                                                                                                                                                                                                                     |
| 2     | `deno task --cwd packages/cli test`                                                                                                         | PASS, exit 0; 832 passed (541 steps), 0 failed                                            | Required whole-package PASS.                                                                                                                                                                                                                       |
| 3     | `deno task --cwd packages/cli/e2e check`                                                                                                    | PASS, exit 0                                                                              | Required PASS.                                                                                                                                                                                                                                     |
| 4     | `deno task --cwd packages/cli/e2e test`                                                                                                     | PASS, exit 0; 168 passed, 0 failed                                                        | Required whole nested-package PASS.                                                                                                                                                                                                                |
| 4a    | `deno task --cwd docs/site verify`                                                                                                          | PASS, exit 0                                                                              | Retained as a measured S1 baseline; not required in S2 because the corrected ceiling contains no docs path.                                                                                                                                        |
| 4b    | `deno task --cwd docs/site test:source-format`                                                                                              | PASS, exit 0; 6 passed, 0 failed                                                          | Retained as a measured S1 baseline; not required in S2 because the corrected ceiling contains no docs path.                                                                                                                                        |
| 5     | root structured check over the 10 existing ceiling TS files                                                                                 | PASS, exit 0; 10 selected, 1 batch                                                        | Repeat with all changed/new TS files; required PASS.                                                                                                                                                                                               |
| 6     | root structured lint over the 10 existing mixed CLI/E2E ceiling files                                                                       | BASE RED, exit 2; partial-exclusion, 6 dropped                                            | Do not use mixed scope as green verdict; split by package/config and require full coverage.                                                                                                                                                        |
| 7     | root structured fmt over the same mixed files                                                                                               | BASE RED, exit 2; partial-exclusion, 6 dropped                                            | Same split-scope rule; no repo-wide mutating fmt.                                                                                                                                                                                                  |
| 8     | `deno task --cwd packages/cli lint` / `fmt:check`                                                                                           | BASE RED, exit 1; `.llm/tools/...` resolves under `packages/cli` and is missing           | Never promise these green; record unchanged base tooling defect.                                                                                                                                                                                   |
| 9     | `deno task --cwd packages/cli/e2e lint` / `fmt:check`                                                                                       | BASE RED, exit 1; same relative wrapper-path defect                                       | Never promise these green; use root wrappers with correct E2E scope.                                                                                                                                                                               |
| 10    | `deno task quality:gate`                                                                                                                    | PASS, exit 0                                                                              | Required PASS; warnings remain baseline-only.                                                                                                                                                                                                      |
| 11    | `deno task doc:lint --root packages/cli --pretty`                                                                                           | PASS, exit 0                                                                              | Required PASS.                                                                                                                                                                                                                                     |
| 12    | CLI JSR audit                                                                                                                               | PASS, exit 0                                                                              | Required PASS.                                                                                                                                                                                                                                     |
| 13    | `deno task --cwd packages/cli publish:dry-run`                                                                                              | PASS, exit 0                                                                              | Required PASS.                                                                                                                                                                                                                                     |
| 14    | `deno task check:emitted-samples`                                                                                                           | PASS, exit 0                                                                              | Required PASS.                                                                                                                                                                                                                                     |
| 15    | `deno task check:netscript-jsr-specifiers`                                                                                                  | PASS, exit 0                                                                              | Required PASS.                                                                                                                                                                                                                                     |
| 16    | Four-check generated-derivative cascade: `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus` | Three read-only checks PASS, exit 0; writing `check:assets-barrel` deliberately `NOT_RUN` | All four are expected stable/green specifically because the leaf writes no corpus member. Run the three read-only checks and require PASS; keep the writing assets-barrel check supervisor-owned/`NOT_RUN`. Staleness stops and reports under D17. |
| 17    | `deno task e2e:cli run scaffold.runtime --cleanup`                                                                                          | `NOT_RUN`                                                                                 | REQUIRED supervisor-coordinated gate. Author must not run: another lane owns the cluster-wide runtime lease. D-42/D-43 are resolved; queue on lease availability and never report passing without a supervisor receipt.                            |
| 18    | `git diff -- deno.lock` plus hash                                                                                                           | clean; Git blob `a1522e6...`, SHA-256 `edfa0c24...`                                       | Must remain byte-identical.                                                                                                                                                                                                                        |

For S2 lint/fmt, invoke the structured wrappers from the repository root in separate CLI-source and
CLI-E2E selections so neither nested config is silently dropped. Coverage refusal is failure even
when findings are zero. Full tests remain mandatory for both `packages/cli` and `packages/cli/e2e`;
targeted tests do not replace them.

## Risks

- The narrow binder may intentionally reject custom/multi-service apps. That is preferable to a fake
  screen and is explicitly deferred to the selector-owning issues.
- `router.ts` mutation is the highest-risk product operation; D5/D7 and goldens make it a planned,
  validated edit rather than an incidental append.

## Dependencies

- #1356: landed and consumed as-is.
- #1355: its already-existing `service add --with-client` query factory is the prerequisite seam; no
  new #1355 work is required for the canonical scaffold path.
- #1360: not a landing dependency because the Fresh option already exists; ownership remains
  separate as D12.
- #1354: remains open and owns every richer generator capability listed in Non-Scope.
- External runtime: supervisor-owned lease/host for acceptance item 11.

## Drift Watch

- Any path outside the 12-path product ceiling.
- Any docs, asset, or generated-corpus member entering the ceiling.
- Any need for a service/procedure selector, contract parser, new port, registry, dependency, or
  shared template asset.
- Any change to `packages/fresh`, `packages/sdk`, `agent-conventions.ts`, or `deno.lock`.
- Any base gate whose actual result differs from the table.
- Any generated-carrier staleness or runtime gate result claimed without a supervisor receipt.
