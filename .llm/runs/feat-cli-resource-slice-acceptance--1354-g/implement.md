# Implementation Prompt: Slice G consumer guidance and hosted acceptance hook

Implement only locked Slice G from the upstream #1354 plan.

## Required Reading

1. `.llm/harness/workflow/run-loop.md`
2. `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`
3. `.llm/harness/gates/archetype-gate-matrix.md`
4. `.llm/runs/feat-cli-resource-slice-acceptance--1354-g/plan.md`
5. `.llm/runs/feat-cli-resource-slice-acceptance--1354-g/context-pack.md`

## First Act: Design Checkpoint

The filled `## Design` section in `worklog.md` is the implementation contract.

## Operating Rules

- Touch exactly the eight amended product files; harness artifacts do not count toward that ceiling.
- Do not run Aspire, Docker, browser, or `deno task e2e:cli` locally.
- Do not edit `main`, `deno.lock`, #1664-owned service-query/add-ui surfaces, or Slice F's command-tree test.
- Stop if captured stdout or runtime reachability needs another product file.
- Use structured wrappers for check/test/lint/fmt evidence.
- Commit, push to `feat/cli-resource-slice-acceptance`, and open a non-draft PR based on `feat/cli-resource-slice-activate` with the owner-specified metadata.

## Handoff Requirements

- `worklog.md` records exact exit codes/counts and the hosted runtime prohibition.
- `context-pack.md` is resumable.
- The PR body names both gate IDs, composition position, `RUNTIME_GATES` reachability, rendered guidance, and A/E/F stacked-diff visibility.
- Hosted runtime remains an explicit CI/evaluator requirement.

## Blocked State — 2026-09-03

The full CLI unit suite materializes the new rerun gate in the existing runner success-path test. Its fake executor returns empty stdout, so the required skip-only assertion fails. The exact owner stop rule applies: correcting the fixture needs `packages/cli/e2e/tests/application/runner/suite-runner_test.ts`, an eighth product file. Do not continue, weaken the assertion, commit, push, or open the PR until the plan/file ceiling authorizes that path.

## Rescope Resolution — 2026-09-03

PR #1891 amended the ceiling to 8 and enumerated the runner test as item 8. The owner authorized resumption: update only the nominal-success fake's stdout for `generate resource`, retain the existing suite, and finish the author-lane gates and PR handoff.
