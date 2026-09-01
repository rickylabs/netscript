## Summary

Prevents readiness fixture app blocks generated in isolation from re-declaring the host module's
positional `app_<n>` bindings. The regression uses real generator output and requires the injected
module to type-check, so partial suffix renames cannot pass.

## Scope

- Archetype / area: CLI-owned E2E harness / Aspire readiness fixture
- Closes #1898

## Slices

- [x] RED: realistic generated one-app host reproduces duplicate fixture bindings — `ad53835ee0b10d23274ae687ffbbc03cd39357a5`
- [ ] GREEN: fixture-specific block namespace — pending

## RED / GREEN

- RED SHA: `ad53835ee0b10d23274ae687ffbbc03cd39357a5`
- GREEN SHA: pending
- RED evidence: exit 1; passed 4, failed 1, unique failures 1; duplicates `app_0_workdir`, `app_0`, `app_0_otel`

## Validation

- Focused gates tests: pending GREEN (RED exit 1 as expected)
- Scoped check: pending
- Scoped format: pending
- Focused lint: pending
- Full `deno task e2e:cli`: NOT RUN — prohibited by the leaf brief; no runtime lease

## Ceiling

```text
packages/cli/e2e/src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts
packages/cli/e2e/tests/application/gates/prepare-readiness-fixture_test.ts
.llm/runs/fix-readiness-fixture-app-identifier-collision--1898/**
```

`generate-register-apps.ts`, `listener-unreachable-fixture.ts`, `REPORT_DEADLINE_MS`, and
`deno.lock` are unchanged.

## Harness

- Run dir: `.llm/runs/fix-readiness-fixture-app-identifier-collision--1898/`
- Phase: impl
- Do not merge until mandatory IMPL-EVAL and supervisor acceptance mirroring are complete.

## Drift / Debt

- None. Existing `scaffold-runtime-a8-f16-1333` debt is not touched or deepened.

## Definition of Done

- [ ] Real generated host has no duplicate fixture `const` declaration.
- [ ] Injected module type-checks with every suffixed identifier renamed consistently.
- [ ] Both fixture resource names remain registered and reinjection fails closed.
- [ ] Focused wrapper gates pass with `deno.lock` unchanged.
- [ ] Supervisor mirrors issue acceptance and hosted runtime evidence.
