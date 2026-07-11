# Context Pack: `@netscript/ai/skills`

## Run Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `feat-246-skill-loader--codex` |
| Branch         | `feat/246-skill-loader-port`   |
| Current phase  | evaluate                       |
| Archetype      | `2 - Integration`              |
| Scope overlays | none                           |

## Current State

Issue #246 is implemented and all requested gates are green. PLAN-EVAL was owner-waived; the branch
is ready for push and separate-session IMPL-EVAL.

## Completed

- Blessed parser, summary/full disclosure split, tag and optional semantic matching.
- Injected caller-fed in-memory source with no core I/O.
- Five focused tests and README/subpath documentation.
- Scoped check/lint/fmt, 94 package tests, zero-finding doctrine check, raw doc-lint, publish
  dry-run.

## Next Steps

1. Commit final evidence and push the requested branch.
2. Orchestrator runs separate IMPL-EVAL.

## Key Decisions

| Decision                          | Source     | Notes                                                                         |
| --------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Strict blessed frontmatter subset | plan D2    | No YAML production dependency.                                                |
| Summary-only matching             | plan D1/D4 | Preserves progressive disclosure.                                             |
| Structural embedding view         | drift      | Existing `EmbeddingProviderPort` satisfies it without unrelated type leakage. |

## Files Changed

| Path                                       | Status  | Notes                                                   |
| ------------------------------------------ | ------- | ------------------------------------------------------- |
| `.llm/runs/feat-246-skill-loader--codex/*` | new     | Harness plan/design/gate evidence.                      |
| `packages/ai/src/skills/**`                | new     | Domain, application policy, adapter, public entrypoint. |
| `packages/ai/src/ports/skill-loader.ts`    | changed | New no-op compatibility surface.                        |
| `packages/ai/tests/skills_test.ts`         | new     | Parser/disclosure/trigger tests.                        |
| `packages/ai/deno.json`, `README.md`       | changed | Subpath/check mapping and usage.                        |

## Gates

| Gate family | Current status | Evidence                                                    |
| ----------- | -------------- | ----------------------------------------------------------- |
| Static      | PASS           | scoped check/lint/fmt; package tests 94/94                  |
| Fitness     | PASS           | doctrine zero findings; raw doc-lint clean; publish success |
| Runtime     | N/A            | effect-free in-memory behavior only                         |
| Consumer    | PASS           | root/subpath checks and runtime suite                       |

## Drift and Debt

- Drift: owner-waived PLAN-EVAL; old path mapping; F-16 entrypoint move; structural embedding view.
- Debt: none created or deepened.

## Commits

- `c67e0121` — progressive skill loading and triggers.
- No PR by explicit user instruction.
