# Plan

## Profile and scope

- Archetype: 6 (CLI/tooling), specifically the internal CLI E2E runtime gate.
- Overlays: none.
- Doctrine verdict: Keep; no public surface or package architecture change.
- Ceiling:
  - `packages/cli/e2e/src/application/gates/scaffold/wait-for-workers-runtime.ts`
  - one focused test under `packages/cli/e2e/tests/application/gates/`
  - this run directory

## Locked decisions

1. Model readiness as scheduler evidence AND any named runner-mode marker.
2. Keep runner markers in one named collection so another mode is a one-line addition.
3. Export only the pure marker predicate needed by the focused test; retain executable behavior behind `import.meta.main` so importing the module has no Aspire side effect.
4. Report scheduler and runner evidence independently in the terminal failure.
5. Preserve the legacy pool marker and add the exact current in-process marker.

## Open-decision sweep

- No open decisions. All behavior-changing choices are locked above.

## Commit slices

1. RED — add four semantic predicate cases using the exact current producer log shape. Proving gate: focused structured test wrapper must fail against baseline. Files: focused test only.
2. GREEN — implement the import-safe predicate and requirement-specific failure diagnostic. Proving gates: focused test, scoped check, scoped format. Files: gate module plus run evidence.

## Risk register

- Importing the executable could run Aspire during unit tests. Mitigation: guard execution with `import.meta.main` and keep the predicate pure.
- Replacing rather than broadening the legacy marker would regress pool mode. Mitigation: explicit passing fixtures for both modes.
- A loose OR could accept a runner without the scheduler. Mitigation: missing-scheduler negative case.
- Diagnostic drift could obscure the unmet requirement. Mitigation: derive missing requirements from the same predicate inputs.
- Lock/source churn from broad validation. Mitigation: only run the mandated scoped wrappers and stop if `deno.lock` changes.

## Gates

- Focused structured test wrapper over `packages/cli/e2e/tests/application/gates`.
- Scoped structured check over `packages/cli/e2e` TypeScript.
- Scoped structured format over `packages/cli/e2e` TypeScript.
- Lint only if needed; any known detached-fixture refusal will be recorded honestly and followed by focused lint.
- Full `e2e:cli`: prohibited; hosted CI owns runtime proof.
- Quality/doctrine/JSR publication gates: N/A for the nested internal E2E harness and unchanged public surface.

## Deferred scope

- Runtime lease and full scaffold runtime smoke.
- Any `plugins/workers/**` producer change.
- Related issues #1863 and #1870.
- Existing CLI E2E directory-cardinality debt.

