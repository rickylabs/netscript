# Plan — fix #785 workers health-check execution

## Profile and verdict

- Primary archetype: 5 — Plugin Package, because the failing processor is first-party `plugins/workers` wiring over core worker contracts.
- Scope overlay: service, because the defect occurs in an Aspire-hosted background processor.
- Secondary archetype: 6 — CLI/Tooling only if the framework scaffold generator proves to emit the invalid contract.
- Current doctrine verdicts: `plugins/workers` Refactor; `@netscript/cli` Restructure. No structural remediation is in scope.

## Locked decisions

1. Preserve the public job-definition shape; fix path interpretation at the narrowest framework layer that owns it.
2. Use `@std/path`/URL primitives for filesystem normalization where needed; do not introduce a bespoke path abstraction.
3. Add a regression test at the resolver/registry layer that reproduces the exact generated entrypoint convention.
4. Do not weaken the E2E assertion or alter the health-check handler to hide resolution failure.
5. Keep `health-check` as the ordinary default generated job. Exercise Flow-B through a separately scaffolded job using the generic workers CLI and configured jobs directory.

## Open-decision sweep

- Must resolve now: whether product generation or worker resolution violates the entrypoint contract. Runtime logs decide ownership.
- Safe to defer: unrelated worker/plugin doctrine refactors already tracked by the doctrine verdict.
- Safe to defer: JSR metadata/docs work because the public surface and publish file set are unchanged.

## Commit slices

1. Bootstrap harness evidence and diagnostic reproduction. Gate: issue evidence plus captured Aspire worker logs. Files: this run directory only.
2. Correct framework entrypoint behavior and add a focused regression. Gate: focused Deno test plus scoped check/lint/fmt.
3. Separate the Flow-B callback through the generic workers CLI and preserve rich runtime definitions. Gate: compiler golden plus focused fixture validation.
4. Prove merge-readiness and hand off for evaluation. Gates: `quality:gate` and full `scaffold.runtime --cleanup --format pretty`; files: run evidence and PR metadata only.

## Risk register

- Path changes could break absolute, URL, plugin, or jobsDir-relative entrypoints. Mitigation: retain those cases and test the newly failing project-root-relative case.
- A fixture-only edit could make the test green without fixing real consumers. Mitigation: implementation must land in framework source, not the behavior assertion.
- A health-check-specific exception could preserve the defect for other jobs or custom jobs directories. Mitigation: resolver tests use arbitrary job names and a custom configured jobs directory; the E2E fixture adds its callback through the generic CLI.
- Full runtime smoke can leave processes/containers on diagnostic failure. Mitigation: diagnostic run is stopped explicitly; acceptance uses `--cleanup`.

## Required gates

- Focused regression test at the failing layer.
- Scoped check, lint, and fmt wrappers for owned TypeScript.
- `deno task quality:gate` (quality scan plus doctrine fitness).
- Runtime log review and full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Separate opposite-family IMPL-EVAL after handoff.

## Deferred scope

- No worker architecture restructure, dependency bump, export redesign, or E2E weakening.
- No issue closure or `status:ready-merge`; evaluator/supervisor owns those transitions.
