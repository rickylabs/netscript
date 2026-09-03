# Plan: package-backed plugin registry generation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-package-backed-plugin-generate--0.0.7` |
| Branch | `fix/package-backed-plugin-generate` |
| Phase | `plan` |
| Target | `packages/cli` with `plugins/workers` as a consumer boundary only |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Archetype

Archetype 6 governs because the defect is in the user-run `generate plugins` command and its process/file-system adapters. Archetype 5 applies only if evidence proves the workers package generator itself is the fault; do not expand there speculatively.

## Current Doctrine Verdict

- `packages/cli`: Keep — preserve the Archetype-6 kernel/surface split.
- `plugins/workers`: Refactor — preserve thin glue over workers-core and do not deepen its known folder/doc-lint debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | An explicit `--project-root` must be a predictable published boundary. |
| A8 | Keep the command thin and the generator behavior in its existing feature adapter. |
| A10 | Preserve injected filesystem/process/root resolver seams. |
| A14 | Lock the package-backed boundary with deterministic semantic tests and hosted evidence. |

## Goal

Make the release-day package-backed doctor fixture propagate its minimum-dependency-age policy to
the nested generator through the fixture project's `deno.json`, without changing product generation
or weakening doctor.

## Scope

- Exact Canary 8 two-cwd reproduction and baseline local-source comparison.
- The existing package-backed fixture as the deterministic RED with `cwd != projectRoot`.
- A fixture-only `minimumDependencyAge: 0` repair with hard generation and registry assertions.
- Scoped, receipt-backed local gates and hosted/evaluator handoff.

## Non-Scope

- Doctor behavior changes, release refs, dependency/catalog/lock changes, workflow changes, local full scaffold runtime execution, or `.llm/tmp/pwcli/`.
- Workers runtime refactoring or pre-existing JSR documentation debt.

## Hidden Scope

- Published URL resolution differs from local-source manifest discovery.
- The hosted gate is required because `deno publish --dry-run` cannot execute the remote graph.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Treat explicit `--project-root` as authoritative; test with a distinct cwd. | This is the documented CLI contract and issue acceptance. |
| D2 | Drive RED through the existing package-backed doctor fixture and exact published CLI. | Exercises the release-day nested process boundary and preserves truthful diagnostics. |
| D3 | Repair only the fixture `deno.json`; product generator and doctor code are excluded. | Exact replay proves the explicit root is honored and the nested Deno dependency-age policy is the cause. |
| D4 | PLAN-EVAL is N/A. | This is a bounded P0 repair with canonical acceptance, ceiling, RED shape, and gate list; no architectural decision remains open. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Product root resolver vs package-backed generator cause | resolved | Both cwd values reach the package generator; nested dependency-age policy is causal. |
| Exact repair location | resolved | Dedicated E2E fixture `deno.json` only. |
| Hosted scaffold-runtime outcome | safe to defer | Cannot be run locally under the runtime lease rule; PR CI supplies it. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A local-source test accidentally exercises workspace fallback | Use a synthetic package name/manifest URL and a temp root with no local plugin workdir. |
| Cwd coupling remains hidden | Execute the regression with process cwd distinct from the project root and assert recorded cwd/argv. |
| Remote-only graph failure escapes local tests | Keep the exact published reproduction and require hosted package-backed/scaffold runtime evidence. |
| Existing debt creates unrelated reds | Record baseline debt without weakening gates; preserve lock and ceiling. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11/AP-25 | risk | Keep cwd/filesystem/process effects in injected resolver/adapters. |
| AP-18 | risk | Assert generated file path and semantic job entry, not a giant snapshot. |
| AP-24 | risk | Preserve manifest-driven registry discovery; add no plugin-name switch. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-3/F-5/F-10/F-11/F-12/F-15..F-19 | yes | `quality:gate`, scoped wrappers, structural review |
| F-6/F-7 | yes/no-increase | CLI JSR audit/publish surface review; no public export change |
| F-CLI-1..31 | yes | `arch:check` plus manual diff review for affected feature |
| Consumer/runtime | yes | focused temp-root regression locally; package-backed and scaffold runtime hosted |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| CLI doc completeness | none | No public type/JSDoc/export change planned. |
| workers Refactor/private-type-ref debt | none | Workers is consumer-only unless causal evidence demands expansion; no-increase rule applies. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | exact published CLI through the package-backed fixture before repair | Nested generator exits 1 on the 24-hour dependency-age policy and writes no registry. |
| 2 | GREEN | same published CLI through the repaired fixture | Exits 0 and verifies the registry exists and contains `package-backed-job`. |
| 3 | Static | scoped check/test/lint/fmt wrappers | Exit 0. |
| 4 | Fitness | `deno task quality:gate` | Exit 0. |
| 5 | JSR | focused CLI publishability/doc-surface audit appropriate to unchanged exports | No new/deepened finding. |
| 6 | E2E registry | e2e suite registry/unit tests if e2e changes | Exit 0. |
| 7 | Hosted | package-backed doctor and `scaffold.runtime` | Exit 0 at exact PR head. |
| 8 | Evaluation | fresh Fable 5 medium IMPL-EVAL | PASS at exact final head. |

## Drift Watch

- Any required edit outside `packages/cli/**`, unavoidable workers compiler changes, fixture contract changes, or lock/catalog drift.
