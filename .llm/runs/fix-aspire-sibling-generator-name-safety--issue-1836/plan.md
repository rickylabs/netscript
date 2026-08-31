# Plan: #1836 sibling register-generator source safety

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-aspire-sibling-generator-name-safety--issue-1836` |
| Branch | `fix/aspire-sibling-generator-name-safety` |
| Phase | `plan` |
| Target | `packages/cli` Aspire helper generators |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Archetype

Archetype 6 applies because `@netscript/cli` owns user-run scaffolding and generated AppHost source.
No second archetype or scope overlay is needed. The change stays in the existing horizontal kernel
template feature and does not alter the public/maintainer command surfaces.

## Current Doctrine Verdict

`packages/cli`: **Keep** — preserve the Archetype-6 kernel/surface split.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1 | The generated-source contract and hostile-input tests are defined before implementation. |
| A2 | Structural ordinal bindings are simpler than a growing reserved-word filter. |
| A7 | Native `JSON.stringify` is the source-literal primitive; no escaping helper is needed. |
| A14 | Tests parse emitted modules and are mutation-proven rather than snapshot-only. |

## Goal

Make reserved-word identifiers, normalized-name collisions, and user-string literal breakage
structurally impossible in the apps, plugins, tools, and infrastructure register generators while
preserving resource-name string arguments and behavior for well-formed inputs.

## Scope

- Add hostile-input contract tests for all four generators.
- Parse-check each generated module with Deno lint; string assertions are supplementary only.
- Replace every user-derived binding with stable per-generator ordinal bindings.
- Emit every user-supplied source string through `JSON.stringify` and remove raw user text from
  generated comments.
- Prove both safeguards by mutation and run the owner-selected static/repository gates.

## Non-Scope

- `generate-register-background.ts`; PR #1747 owns that generator.
- Config grammar or resource-name rejection; arbitrary direct-generator strings must remain safe.
- Aspire, Docker, AppHost, CLI E2E, or other runtime execution.
- Public exports, JSDoc, dependency versions, lifecycle labels, and evaluator dispatch.

## Hidden Scope

- Apps' remote endpoint binding and service-discovery keys.
- Plugins' two-pass service/plugin reference bindings plus environment and health-path literals.
- Infrastructure's database/cache cross-kind binding collisions, parameter names, data paths,
  database names, image tags, tool versions, readiness keys, and primary-resource lookups.
- Generated comments that currently contain unescaped user text.
- Asset-barrel verification because the generators render checked-in template assets.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Use `app_<n>`, `plugin_ref_<pass>_<entry>_<ref>`, `tool_<n>`, `db_<n>`, and `cache_<n>`-style bindings. | User text never enters identifier positions; reserved words and normalization collisions become impossible. |
| D2 | Use `JSON.stringify(value)` inline at every emitted user-string site. | Mirrors #1747 and uses the platform primitive without inventing an escaping abstraction. |
| D3 | Remove user text from generated comments or render only JSON-encoded text where a comment remains valuable. | Comments are also source positions and raw newlines can escape them. |
| D4 | Parse with `deno lint --no-config` and exclude only non-semantic rules that reject intentional generated scaffolding. | The parser fails loudly on invalid JavaScript without requiring runtime imports or Aspire. |
| D5 | Keep resource-name arguments and map keys byte-for-byte equivalent after parsing. | Only identifiers/literal encoding change; well-formed generated behavior stays stable. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Prefix spelling | safe to defer | Exact prefix text is private generated implementation; ordinal structure is locked. |
| Dynamic import versus parse-only lint | resolved now | Deno lint is selected because the owner explicitly accepts parse/type-check evidence and runtime is forbidden. |
| New shared escaping helper | resolved now | Rejected under A7; use `JSON.stringify` directly, matching #1747. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| A raw interpolation site is missed. | Exercise every string-bearing entry field and audit every interpolation in the four files. |
| Tests pass by matching strings while emitted code is invalid. | Write each output to a temp `.mts` file and invoke Deno lint. |
| Ordinals change well-formed resource identity. | Assert resource-name literals remain encoded from the original strings; identifiers alone change. |
| Generated assets or lock state drift. | Run the assets-barrel check and compare `deno.lock` to the baseline; do not regenerate unless the check requires it. |
| Mutation work leaks into the final tree. | Apply bounded mutations one mechanism at a time, capture failures, restore with explicit patches, then inspect the final diff. |
| A focused file list misses an existing downstream generated-output contract. | Run the entire Aspire helper-generator test directory before any implementation handoff or green claim. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-18 | existing risk | Use semantic parse checks; avoid giant snapshots. |
| AP-2 | risk | Do not add a wrapper around `JSON.stringify`. |
| AP-9 | risk | Keep the repair local to the four generators; add no speculative abstraction. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-10 / AP-18 | yes | Focused hostile-input tests parse emitted modules and fail under both mutations. |
| F-19 | yes | Scoped structured check/lint/fmt wrappers cover every changed TypeScript file. |
| F-CLI family | yes | `deno task arch:check`; unchanged structural rules reported by the existing gate. |
| Code quality | yes | `deno task quality:scan` returns zero new findings; no `any`, casts, or lint ignores added. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `.llm/harness/debt/arch-debt.md` | none | The slice neither creates nor deepens architecture debt. Existing CLI pending-script entries remain unchanged. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | RED focused tests | Structured test wrapper on the new source-safety test | Nonzero; all four generators expose invalid emitted source. |
| 2 | Focused tests | Structured test wrapper on Aspire helper generator tests | Exit 0. |
| 3 | Directory consumer contract | Exact directory command plus structured wrapper on `helpers/tests/` | Exit 0; zero failed files/steps/results. |
| 4 | Scoped check | `run-deno-check.ts --unstable-kv` on changed TypeScript files/root | Exit 0, no failed batches. |
| 5 | Scoped lint | `run-deno-lint.ts` on changed TypeScript files/root | Exit 0, no findings/drops. |
| 6 | Scoped format | `run-deno-fmt.ts` on changed TypeScript files/root | Exit 0, no findings/drops. |
| 7 | Mutation proof | Revert ordinals, then escaping, and rerun the focused contract test | Nonzero for each mutant; all four generator cases fail. |
| 8 | Root check | `deno task check` | Exit 0; `failedBatches: 0`. |
| 9 | Quality | `deno task quality:scan` | Exit 0. |
| 10 | Architecture | `deno task arch:check` | Exit 0. |
| 11 | Assets | `deno task check:assets-barrel` | Exit 0; no regeneration required. |

## Risks

- The infrastructure generator has the widest string surface; the test matrix must cover each
  database/cache mode that emits a distinct field.
- Existing generator files exceed modern size preferences; this repair will not expand architecture
  scope by restructuring them.

## Dependencies

- Deno parser/linter only. No Aspire, Docker, network runtime, or new package dependency.

## Drift Watch

- Live `main` advancement, generated asset changes, lockfile changes, or newly discovered string
  fields are recorded before continuing.
