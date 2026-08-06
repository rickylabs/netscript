# Context Pack: Zod npm alignment

## Run Metadata

| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| Run ID         | `fix-zod-v4-npm-alignment-1295--1295`       |
| Branch         | `fix/zod-v4-npm-alignment-1295`             |
| Current phase  | `implement`                                 |
| Archetype      | cross-cutting manifests + Archetype 6 guard |
| Scope overlays | none                                        |

## Current State

The branch is integrated with `canary/0.0.5-canary.14@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`.
Formal Qwen IMPL-EVAL session `f516aada-2a74-4dad-821e-b20963fe2983` returned `FAIL_FIX` against
product head `9f5ef7dcb55668a6649c5451266908ad8e29b15c`: npm Zod exposed 70 new `private-type-ref`
diagnostics and the detached Fresh streams fixture could not resolve `catalog:zod`. Repair commit
`b29879e9468d4c154bc67beb1cbe430984f8290c` keeps concrete Zod schemas private for composition and
publishes package-owned structural validators. The exact 19-root comparison is now at or below
canary.14 for every root, `check:streams-types` is green through a fixture-owned npm catalog and is
a root CI dependency, and the rescoped two-instance Zod boundary is unchanged.

## Next Steps

1. Preserve draft PR #1315 at `status:impl`. At evidence head
   `91bc68099285b2c322fd895c25bca34ec3c0c99b`, GitHub reported 13 terminal `skipped` checks,
   including core and scaffold lane visibility; no green current-SHA train verdict is claimed.
2. Hand off for a fresh orchestrator-owned Qwen IMPL-EVAL session.

## Key Decisions

| Decision                     | Source                            | Notes                                                                           |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| root npm catalog             | plan D1                           | one Zod version home                                                            |
| D6 composed evaluation       | owner rule                        | no duplicate local evaluator                                                    |
| public structural validators | evaluator finding 1 / doctrine A2 | preserve concrete Zod only behind package-owned public contracts                |
| detached fixture catalog     | evaluator finding 2               | a foreign config owns the catalog it activates; root CI invokes the member gate |

## Drift and Debt

- Drift: evaluator-found doc-lint and detached-consumer regressions are repaired and recorded in
  `drift.md`.
- Debt: the doc-lint wrapper exit-code trap and emitted-sample full-root-catalog limitation remain
  recorded tool limitations; this product repair does not broaden into those tools. Publication is
  blocked externally by #1312.

## Commits

- `b29879e9468d4c154bc67beb1cbe430984f8290c` — portable public schema contracts and detached Fresh
  fixture/root-CI repair.
- See draft PR #1315 for the inherited implementation commits and this handoff's evidence commit.
