# Plan: scaffold TypeScript project boundaries (#1016)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1016-scaffold-tsconfig--project-boundary` |
| Branch | `fix/1016-scaffold-tsconfig` |
| Phase | `plan` |
| Target | `packages/cli` scaffold output |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Archetype

Archetype 6 applies because `@netscript/cli` ships `netscript init` and its scaffold writers. This is a generated-product-boundary correction within the existing kernel application/template layers; no frontend feature design or service behavior is added.

## Current Doctrine Verdict

Doctrine file 10 records `@netscript/cli` as **Restructure** at its historical baseline. The debt registry records the bounded Archetype-6 promotion as closed; this slice neither expands nor deepens that historical debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | Generated configuration must be explicit and self-contained at the published boundary. |
| A6 | Two small programmatic generators encode the project-boundary policy; no generic helper is introduced. |
| A8 | Root and app configs are generated beside their corresponding `deno.json` generators. |
| A14 | Semantic tests assert the absence of `extends`, plus real consumer reproduction and runtime gates. |

## Goal

Make every newly scaffolded workspace and Fresh app terminate upward `tsconfig.json` discovery without changing Deno checking or widening editor type-check scope.

## Scope

- Add root and app tsconfig file-name constants.
- Add Tier-1 root/app JSON generators.
- Write root config from `scaffoldRoot()` and app config from `writeNormalizedAppFiles()` through existing force-aware bookkeeping.
- Update the four named scaffold/generator test surfaces and assert both configs omit `extends`.
- Re-run the parent-config database and SSR reproduction.

## Non-Scope

- No changes to Deno compiler options, dependencies, Vite config, Fresh source, Prisma behavior, Astro integration, or existing projects.
- No static template assets or generated embedded-asset modules.
- No broad editor configuration or inclusion of Deno-flavoured source in TypeScript project files.

## Hidden Scope

- File create/skip counts must include both files under force and non-force paths.
- The application config must guide Vite/esbuild TSX parsing even though its `files` set is empty.
- Vite success requires an SSR HTTP request; process startup alone is insufficient evidence.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Root content is exactly `{ "files": [] }` (pretty JSON plus newline). | Terminates upward lookup and prevents tsserver from claiming Deno source. Prototype fixes Prisma and leaves `deno task check` unchanged. |
| D2 | App content has `allowImportingTsExtensions`, `jsx: react-jsx`, `jsxImportSource: preact`, `module: ESNext`, `moduleResolution: Bundler`, `noEmit`, and `files: []`; no `extends`. | These are the smallest Vite/Fresh-compatible options proven by an SSR 200 while avoiding broad inclusion. |
| D3 | Use two Tier-1 generator modules adjacent to the existing root/app `deno.json` generators. | Keeps root/app policies discoverable without asset regeneration. |
| D4 | One implementation slice covers constants, generators, writers, and semantic tests. | The change is a single indivisible contract: generated output plus its bookkeeping and regression proof. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Config content | resolved now | Empirical prototype selected D1/D2. |
| Automated full parent-directory reproduction | safe to defer | Unit tests lock the boundary property; the real A/B is captured manually and the canonical runtime gate exercises generated output. No new e2e framework is warranted for this narrow fix. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| TypeScript editor checks Deno/Fresh source and creates first-run errors. | Use empty `files` in both configs; do not add `include`. |
| Vite loses TSX/module behavior. | App-local compiler options mirror the Vite/Fresh needs; verify an SSR HTTP 200. |
| Deno starts honoring tsconfig unexpectedly. | Compare the same generated `deno task check` before/after. |
| Force bookkeeping drifts. | Exercise in-memory writer created/skipped assertions and orchestration counts. |
| Scaffold runtime regresses elsewhere. | Run the one-pass `scaffold.runtime` gate once after scoped gates. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | avoid | Keep each generator small and single-purpose. |
| AP-6 | avoid | Add no base class or orchestration abstraction. |
| AP-18 | avoid | Parse JSON and assert semantic keys rather than relying only on snapshots. |
| AP-25 | avoid | No side effects outside existing scaffold writer edges. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-3/F-5/F-10/F-11/F-12/F-15/F-16/F-17/F-18 | yes | Scoped wrappers, semantic tests, `quality:gate`, and `arch:check`. |
| F-6/F-7/F-9 | yes | CLI JSR audit/doc-lint/publish dry-run evidence; no export or permission change expected. |
| F-CLI-1…31 | yes | `arch:check` plus manual structural review; unaffected gates reported as such. |
| Runtime/consumer | yes | Parent A/B, SSR request, generated-project check, and one-pass `scaffold.runtime`. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | No new/deepened violation; unrelated open CLI debt remains untouched. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Targeted tests | `deno test -A packages/cli/src/kernel/application/scaffold packages/cli/src/kernel/templates` | PASS; both configs present and have no `extends`. |
| 2 | Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS. |
| 3 | Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` | PASS. |
| 4 | Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | PASS. |
| 5 | Quality/doctrine | `deno task quality:gate` | PASS or attributable pre-existing debt only. |
| 6 | JSR | CLI doc-lint and publish dry-run | No newly introduced surface/slow-type failure. |
| 7 | A/B consumer | Scaffold under invalid parent; run `db generate`, `deno task check`, `deno task dev`, HTTP `/` | DB/check exit 0 and SSR HTTP 200. |
| 8 | Runtime gate | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | One-pass PASS. |

## Risks

- The full runtime gate is expensive and runs only after the implementation and scoped gates.

## Dependencies

- Existing Deno, Prisma, Vite/Fresh scaffold dependencies only; no dependency changes.

## Drift Watch

- Log if Prisma or Vite ignore an empty-file-set boundary, if Deno behavior changes, or if existing bookkeeping cannot represent the new files.
