# Worklog: explicit UI scaffold query-client selection

## Run Metadata

| Field              | Value                                           |
| ------------------ | ----------------------------------------------- |
| Run ID             | `feat-app-service-client-wiring--1664`          |
| Branch             | `feat/app-service-client-wiring`                |
| Baseline           | `270c31d4d6e9bab24597ac8fe077227d5e98dcc7`      |
| Archetype          | `6 - CLI / Tooling` (`packages/cli`)            |
| Scope overlay      | `frontend` (generated data-screen command only) |
| Coordinator ruling | PR 1664 bounded repair for issues 1355 and 1360 |

## Design

### Public Surface

- `netscript ui:add page <path> --island --client <service>` selects a generated query client by its
  declared service identity.
- `netscript ui:add island <name> --query --client <service>` uses the same selector.
- `UiAddCommandInput.client?: string` carries the optional presentation input to the application
  resolver.
- Existing `scaffoldUiPage` and `scaffoldUiIsland` inputs gain the same optional selector without
  changing their single-client default.

### Domain Vocabulary

- **service identity** — the value declared by `export const <name>Name = '<service>'` in a
  conventional generated query-client module.
- **candidate** — a discovered query-client module containing `createQueryFactories(`.
- **selection** — exact equality between `--client` and a candidate's declared service identity.

### Ports

- `FileSystemPort` remains the only consumed seam for candidate discovery and source reads; no new
  port or adapter is introduced.

### Constants and Existing Spine

- No new finite-value constant group is needed; service identities are project-defined strings.
- Existing Archetype-6 spine remains unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`,
  `CliRoot`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>`.
- No layer-2 abstract or extension axis changes.

### Commit Slice

| # | Slice                                                                          | Proving gates                                                                                                       | Files                                                                              |
| - | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1 | Add explicit service-identity selection while preserving fail-closed discovery | focused resolver and command tests; scoped structured check/lint/fmt; `packages/cli` tests; quality gate; lock hash | six coordinator-approved source/test files plus `worklog.md` and `context-pack.md` |

### Deferred Scope

- Automatic client choice remains prohibited when more than one service identity is available.
- Gate ordering, generated-client naming, templates, contracts, and service generation are
  unchanged.
- No labels, acceptance-box edits, evaluator dispatch, or merge action are part of this slice.

### Contributor Path

Add future data-bound UI options in `add-ui-input.ts`, declare and forward them in
`add-ui-command.ts`, then keep candidate resolution in `web-scaffold.ts`; prove the CLI mapping in
`add-ui-command_test.ts` and resolver semantics in `web-scaffold_test.ts`.

## Plan Gate

`PLAN-EVAL: N/A` — the coordinator supplied a locked resolution site, exact semantics, file ceiling,
and gate contract. No architecture or sequencing decision remains open.

## Decisions

| Decision                                         | Reason                                                                                                                      | Source                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Match declared service identity, not filename    | Generated module filenames are not the contract                                                                             | Coordinator ruling                                        |
| Preserve the no-selector/single-candidate branch | Existing projects depend on byte-identical auto-discovery                                                                   | Coordinator ruling                                        |
| Use exact service-name equality                  | The CLI flag names one conventional generated service                                                                       | Existing generated-client contract                        |
| Select `users` in the hosted data-screen gate    | `users` is the init fixture and the later browser behavior target; `payments` is the added second-service isolation fixture | `scaffold-gates.ts` and `service-client-runtime-probe.ts` |

## Progress Log

| Time (UTC)           | Step                   | Notes                                                                                                                                                                                    |
| -------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-31T06:05:14Z | Bootstrap and research | Verified clean branch/remote baseline, read required skills/doctrine/harness material, inspected the bounded source and fixture ordering, and recorded the design before implementation. |
| 2026-08-31T06:34:00Z | Implementation         | Added the bounded selector, distinct resolver failures, CLI surface forwarding, focused coverage, and the `users` E2E argument without changing gate order.                              |
| 2026-08-31T07:02:00Z | Validation             | Completed focused and package tests, structured check/lint/fmt with captured non-empty stdout, fitness gates, diff hygiene, and lock-integrity proof.                                    |

## Drift

None. The standard harness pack is otherwise absent in this coordinator-owned run directory; only
the two explicitly required run artifacts are added to respect the file ceiling.

## Gate Results

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Focused resolver and command tests | PASS | 20 passed, 0 failed |
| CLI package tests | PASS | 1,208 passed, 0 failed, 0 ignored |
| Structured check (`packages/cli`) | PASS | 917 files, 8 batches, 0 diagnostics; `stdout.bytes=303` |
| Structured lint (six owned TypeScript files) | PASS | 6 processed, 0 findings; `stdout.bytes=349` |
| Structured fmt (six owned TypeScript files) | PASS | 6 processed, 0 findings; `stdout.bytes=298` |
| `quality:gate` | PASS | quality scan and architecture check exited 0 |
| Diff hygiene | PASS | `git diff --check` exited 0; only the six approved TypeScript files and two required run artifacts changed |
| Lock integrity | PASS | before/after SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |

The recursive `packages/cli` diagnostic walk was not used as the package-test verdict: it traversed
nested E2E fixture workspaces and reported 1,494 passing tests plus three unrelated failures (two
fixture executable permission failures under `/ephemeral/tmp`, and an existing suite-registry
expectation that omits `generated.deno-lint`). The package-owned source/root test boundary above is
green. A broad lint diagnostic likewise found existing findings outside the six owned files; the
scoped lint verdict is clean.

The full `scaffold.runtime` suite was not run in this bounded implementation session. Its gate order
is unchanged; the existing data-screen invocation now supplies the fixture's `users` service.

## Handoff Notes

- Inspect the no-selector/single-candidate code path first; it must retain its existing behavior.
- Formal evaluation is intentionally not dispatched by this session under the coordinator ruling.
- Local implementation and gate work is complete. The remaining handoff actions are the single
  commit, explicit-refspec push, and PR evidence comment.
