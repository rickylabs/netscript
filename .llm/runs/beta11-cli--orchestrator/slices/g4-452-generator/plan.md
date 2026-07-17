# Plan: first-party `deno desktop` Aspire generator (#452, folds #375)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g4-452-generator` |
| Branch | `feat/desktop-frontend-452-generator` |
| Phase | `plan` |
| Target | `packages/cli` Aspire generator + public `packages/aspire` config/types |
| Archetype | `6 — CLI / Tooling` (folds the smaller Archetype 2 contract concern) |
| Scope overlays | `none` |

## Archetype

Archetype 6 is the larger applicable shape because the user-visible behavior is generated Aspire
tooling and scaffold output. The `@netscript/aspire` contract edit is the smaller Archetype 2
integration concern and remains in its existing canonical `config.ts` → `types.ts` alias surface;
this run adds no port, adapter, folder, command, or composition seam.

## Current Doctrine Verdict

- `@netscript/cli`: **Restructure** — existing monolith debt remains; this focused generator file
  is already under the kernel template adapter role and must not deepen package-shape debt.
- `@netscript/aspire`: **Keep** — public contract stays canonical in `config.ts`; `types.ts` aliases
  it. The known dedicated-Deno-AppHost API gap remains an existing `DEBT_ACCEPTED` entry.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Lock `AppType`/`AppEntry` before generator behavior. |
| A2 | Published config uses explicit, consumer-readable types and defaults. |
| A6 | Extend the existing block-builder pattern; do not create a speculative framework. |
| A7 | Emit the upstream `deno desktop --backend cef` contract and use existing Aspire primitives. |
| A8 | Keep type/schema, generator, and semantic tests in their existing role files. |
| A9 | Archetype 6 governs the generated-tooling change. |
| A11 | Name the downstream extension axis as `PackageTaskName`. |
| A14 | Acceptance findings become semantic tests and named gates. |

## Goal

Generate an opt-in `desktop` Aspire executable that runs a Fresh-aware predev task with the proven
CEF flag, receives service discovery without an exposed Aspire endpoint, and exposes a stable
native-package task hook for #456, while leaving every non-desktop scaffold unchanged.

## Scope

- Extend public `AppType` and `AppTypeSchema` with `'desktop'`.
- Extend `AppEntry`/`AppEntrySchema` with `PackageTaskName?: string`.
- Resolve omitted `Enabled` to false for desktop and true for existing variants.
- Add an explicit fourth desktop dispatch and a `buildDesktopBlock()` beside `buildTauriBlock()`.
- Launch `TaskName ?? 'desktop:predev'` with forwarded `--backend cef` arguments.
- Emit server-side discovery for desktop service and plugin references.
- Suppress `withHttpEndpoint`, `PORT`, and Vite discovery for desktop even if `Port` is supplied.
- Add semantic schema/type/generator tests and a literal desktop consumer fixture.
- Prove existing `app`/`tauri`/`task` behavior remains stable; run full scaffold runtime smoke at
  merge-readiness, not during each edit loop.

## Non-Scope

- #456 native-format invocation, target matrix, compression, output naming, release server,
  bsdiff, Ed25519 envelopes, or Windows manual-update UX.
- #841 auto-update SDK behavior and #457 install/update e2e.
- Generating a desktop entry in the default scaffold; desktop remains opt-in configuration.
- A dedicated CommunityToolkit Deno Aspire resource API (not available in current TS AppHost).
- Release cuts, JSR publication, tags, canaries, merges, or milestone closure.

## Hidden Scope

- Update schema metadata descriptions and type tests, not only the string union.
- Keep generated endpoint logic type-aware so a configured desktop `Port` cannot regress the
  no-endpoint invariant.
- Test conditional defaults at the schema boundary and explicit opt-in again in generated source.
- Preserve the package-task hook through parsing so #456 can consume config rather than scrape
  generated strings.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | `desktop` is an explicit fourth branch, never the catch-all. | Unknown variants must not silently become task resources; the closed union and readable dispatch stay coherent. |
| D2 | Emit a separate `deno task <Prebuild ?? 'build'>` executable and make the desktop executable wait for its successful completion with `waitForCompletion`; desktop dev argv is `['task', TaskName ?? 'desktop:predev', '--backend', 'cef']`. | Encodes a real Fresh build-before-window relationship, matches Aspire 13.4's completion dependency API, preserves the POC predev seam, and guarantees the CLI flag rather than ignored config. Deno 2.9.3 verification shows no task-level `--` separator is required. |
| D3 | Desktop omitted `Enabled` parses as false and generated desktop code gates on `=== true`. | Defense at both public config and emitted AppHost boundaries keeps headless/CI opt-in. Existing variants retain their true default and `!== false` guard. |
| D4 | Desktop ignores `Port` and never calls `withHttpEndpoint`. | `deno desktop` owns a random `127.0.0.1` `DENO_SERVE_ADDRESS`; `PORT` is not the listener. |
| D5 | Desktop service/plugin references receive only `services__<name>__http__0`. | Server-side Fresh discovery is needed; Vite aliases are an `app` concern and no endpoint is exported by desktop. |
| D6 | `PackageTaskName?: string` is the #456 hook; `desktop:package` is the downstream default convention. | Separates dev launch from reproducible native packaging and gives #456 a typed stable seam without implementing its pipeline early. |
| D7 | No new helper file or port. | Existing type/schema and block-builder files are the smallest justified extension; a new abstraction would be speculative AP-9 debt. |
| D8 | Dedicated desktop tests join the existing app generator suite, with semantic fragment assertions rather than full snapshots. | Mirrors repository test shape and avoids AP-18. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact `PackageTaskName` invocation/output contract | safe to defer | #452 preserves the task name; #456 owns native-format arguments and artifacts. |
| Native target/format/compression matrix | safe to defer | Explicit #456 scope. |
| Future dedicated Aspire Deno API | safe to defer | Existing debt entry; `addExecutable()` is current authority. |
| Whether `Port` is removed from desktop at the type level | safe to defer | Avoid a breaking discriminated-union rewrite; generator behavior enforces no endpoint now. |
| Predev task definition authoring | resolved now | The configured app owns the launch task; the generator separately invokes `Prebuild ?? 'build'` and waits for successful completion before starting it. No default scaffold desktop entry is created. |

No unresolved decision would force rework inside the two planned slices.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Zod transform produces a slow/private public type. | Keep `AppEntrySchema: AspireSchema<AppEntry>` explicit; run full doc-lint, dry-run, audit, and consumer compile in S1. |
| Conditional default changes existing variants. | Add table-driven schema tests for omitted/explicit enablement across all four types. |
| Common endpoint block accidentally exposes desktop. | Make endpoint condition explicit and test with a desktop fixture that intentionally includes `Port`. |
| CEF is asserted only in comments/config. | Test exact generated argv contains separate `'--backend', 'cef'` tokens. |
| Predev name alone does not prove `_fresh/` build. | Generate a distinct build executable plus `waitForCompletion` relationship and assert both resources and their dependency in S2; full native packaging execution remains #456/#457. |
| Hook name drifts before #456 begins. | Public type/schema test plus PR body calls out `PackageTaskName` as the downstream contract. |
| Default scaffold output changes unintentionally. | Existing generator tests plus `scaffold.runtime` merge-readiness smoke; no edit to `generate-appsettings.ts`. |
| Existing CLI/JSR debt makes broad gates red. | Record exact baseline attribution; no new allowance, `any`, lint ignore, or cast. New/deepened debt is a fail. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep additions focused; do not create a new monolith or giant test snapshot. |
| AP-2 | risk | Emit upstream CLI/Aspire primitives directly; no renaming helper. |
| AP-9 | risk | Extend sibling block builders instead of abstracting four small variants. |
| AP-14 | clear target | No upstream re-export. |
| AP-18 | risk | Assert semantic generated fragments and absence invariants. |
| AP-19 | clear target | No new runtime permission; document that packaging external tools remain #456. |
| AP-24 | accepted existing shape | The requested closed app-type dispatch is domain branching, not implementation-adapter selection; no registry introduced. |
| AP-25 | clear target | Generator performs no new side effect; it emits source only. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-10 | yes | Source/test file size remains within applicable thresholds; focused tests. |
| F-2/F-3/F-4 | yes | `arch:check` plus manual no-helper/no-layer/no-inheritance review. |
| F-5/F-7 | yes | `deno task doc:lint --root packages/aspire --pretty`; public symbols documented. |
| F-6 | yes | Aspire publish dry-run and JSR fitness audit, no slow-type warning. |
| F-8/F-9/F-11/F-12/F-15/F-16/F-17/F-18/F-19 | yes | `arch:check`, scoped wrappers, and structural review; no new folder/export/permission/naming issue. |
| F-CLI-1…31 | yes where applicable | `PENDING_SCRIPT` with manual structural evidence backed by `arch:check`; no command/composition/port changes. |
| quality | yes per slice | `deno task quality:scan` and `deno task arch:check`; zero new `any`, cast, ignore, or coupling finding. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| CommunityToolkit Deno/SQLite TypeScript AppHost re-enable deferred | none | Existing `addExecutable()` workaround is used, not deepened. |
| `@netscript/cli` Restructure verdict | none | No folder or public command shape change. |
| `@netscript/aspire` public schema historical debt | verify | Current entry is superseded; S1 must remain doc-lint/dry-run clean or fail rather than reopen silently. |
| New G4 debt | none expected | Any new/deepened violation blocks the slice unless separately accepted by the supervisor/owner. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Aspire contract tests | `deno test --allow-all packages/aspire/tests/config_test.ts packages/aspire/tests/types_test.ts` | Four variants accepted; desktop default false; hook preserved. |
| 2 | Consumer compile | `deno check --unstable-kv packages/cli/src/kernel/templates/aspire/helpers/tests/generators-test-support.ts` | Literal `AppEntry` desktop fixture compiles through `@netscript/aspire/types`. |
| 3 | Generator semantics | `deno test --allow-all packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts` | All existing tests plus every #452 acceptance assertion pass. |
| 4 | Scoped check/lint/fmt | `.llm/tools/run-deno-{check,lint,fmt}.ts` over owned Aspire and CLI helper roots, `--ext ts,tsx` | Exit 0 with structured evidence. |
| 5 | JSR doc surface | `deno task doc:lint --root packages/aspire --pretty` | Zero diagnostics across all export entries. |
| 6 | JSR fitness | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/aspire --text` | Metadata, exports, docs, ESM, and slow-type rubric pass. |
| 7 | Publish dry-run | from `packages/aspire`: `deno publish --dry-run --allow-dirty` | Exit 0; intended file list; no slow types. |
| 8 | Code quality | `deno task quality:scan` then `deno task arch:check` | Exit 0 or exact pre-existing baseline only; no new/deepened finding. |
| 9 | Non-desktop regression | existing app/tauri/task generator assertions and `deno task e2e:cli` at merge-readiness | Non-desktop output remains stable. |
| 10 | Aspire scaffold runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | One-pass exit 0; required because Aspire helper generation changes. |

## Dependencies

- Upstream facts and POC evidence recorded in #375.
- Integration branch `feat/desktop-frontend`; downstream #456 consumes S1's package-task hook.
- Formal evaluator and opposite-family reviews are supervisor-owned and must be separate sessions.

## Deferred Scope

- Native format packaging, signing, manifests, patches, updater wiring, and platform install e2e are
  deferred to #456/#841/#457 by the owner-ratified Option-A issue bodies.
- Graph/snapshot packaging remains #834/#825 (beta.14), not G4 debt.
- Default scaffold UI/flag for creating a desktop entry is not requested; users opt in through
  `AppEntry.Type: 'desktop'` and `Enabled: true`.

## Drift Watch

- A missing or differently named Deno task contract discovered during implementation.
- Aspire SDK requiring `waitForCompletion` rather than the POC predev task pattern.
- #456 requesting a richer hook than a package task name.
- Any change to `origin/feat/desktop-frontend`, issue #452/#456 amendments, or public Aspire export
  map before implementation begins.
- Any gate that shows the existing broad debt baseline has changed.
