# Worklog — #659 remove legacy Aspire

## Design

- **Archetype:** Archetype 6 (CLI/tooling), with the docs scope overlay. `packages/cli` owns the
  public and maintainer `init` commands and scaffold generation flow.
- **Public surface impact:** remove `--legacy-aspire` from both init commands and remove
  `legacyAspire` from the init/scaffold option contracts. The only supported Aspire scaffold is the
  TypeScript AppHost; passing the removed flag must be rejected by Cliffy as unknown.
- **Domain vocabulary:** no new types or constants. Delete the obsolete legacy discriminator and
  C#-only paths/constants/assets.
- **Ports:** unchanged. This removal does not introduce an external dependency or test seam.
- **Constants:** delete C#-only directory, filename, asset, and default-path constants; retain
  dotnet-related constants used by the supported Garnet executable arm or task runtimes.
- **Commit slices:** one bounded removal slice: CLI contracts, scaffold implementation/assets/tests,
  generated README, and named docs sweep. Gates: zero-hit acceptance grep; scoped CLI check/lint;
  CLI scaffold tests; docs verify. Files are limited to those reached by the legacy flag/path and
  the issue's named docs.
- **Deferred scope:** C# or dotnet references outside `packages/cli` and the named docs are out of
  scope unless needed to satisfy compilation. Full `scaffold.runtime` is explicitly delegated to PR
  CI by the owner.
- **Contributor path:** `public/features/init` and `maintainer/features/init` define parsing;
  `kernel/application/scaffold` plans/renders the single TS shape; `kernel/templates` owns generated
  workspace text and assets.

## Plan

1. Remove the legacy option and propagate a single TS AppHost contract through init planning,
   rendering, output, and tests.
2. Delete C#-only templates, embedding entries, constants, and rendering tests/code.
3. Remove legacy framing from generated README and the five acceptance docs.
4. Verify the erp-sync chapter 3 row against task-runtime implementation and retain it only if the
   dotnet executor remains supported.
5. Run all owner-specified gates, record exact evidence, commit, and push without opening a PR.

Locked decisions: no compatibility shim; no deprecated hidden option; no C# asset retention. The
existing TS AppHost behavior and its fixed app port remain authoritative. Open decisions: none.

Risks and mitigations: generated embedded assets can drift from source templates (regenerate using
the repository task); stale test fixtures can keep the deleted option structurally alive (full
`legacyAspire` reference sweep); dotnet text can represent the independent Garnet/task-runtime
features (classify each reference instead of deleting by keyword).

PLAN-EVAL is owner-waived per the slice brief (carried drift D1). No new architecture debt is
introduced; this narrows a pre-beta public surface and deletes an obsolete branch.

## Research evidence

- Base preflight: `955b4abf639522c7da50bd15d20c6e999acb808f` — PASS.
- Issue #659 read from `rickylabs/netscript`; its Scope and Acceptance sections match the brief.
- Polyglot verdict: **retain erp-sync chapter 3 dotnet row**. The executor remains implemented by
  `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts` via
  `DotNetRuntimeAdapter`, with domain/config types and argv-builder tests covering `dotnet run`.
- Doctrine: Archetype 6; this is a deletion from CLI presentation/domain/scaffold behavior, with no
  new layering, ports, exports, helpers, or debt.

## Validation evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Acceptance grep | PASS | `grep -rniE 'legacy-aspire\|C# AppHost' packages/cli docs/site` returned zero hits. |
| Removed flag behavior | PASS | Public CLI invocation with `--legacy-aspire` exited 2 with `Unknown option "--legacy-aspire"`. |
| Scoped CLI check | PASS | `run-deno-check.ts --root packages/cli --ext ts,tsx`: 600 files, 5 batches, 0 failures/occurrences. |
| Scoped CLI lint | PASS | `run-deno-lint.ts --root packages/cli --ext ts,tsx`: 600 files, 3 batches, 0 findings. |
| Scoped CLI format | PASS | `run-deno-fmt.ts --root packages/cli --ext ts,tsx`: 600 files, 3 batches, 0 findings. |
| CLI/scaffold tests | PASS | `deno task --cwd packages/cli test`: 329 passed (401 steps), 0 failed. |
| Docs verify | PASS | `deno task verify` from `docs/site`: build succeeded; 23,450 internal links across 169 pages resolve; 27 caveat markers resolve. |
| Patch hygiene | PASS | `git diff --check` clean; asset barrel regenerated; unrelated Fresh UI regeneration removed. `deno.lock` unchanged. |

The named storefront, erp-sync deploy, and live-dashboard tutorial files contained no matching
legacy AppHost notes at this baseline and therefore required no edit. The erp-sync chapter 3
single-file dotnet task row remains because the executor is still supported (research verdict
above). Full `scaffold.runtime` was not run, per owner direction; PR CI owns that live verdict.

Post-slice reconcile: issue #659 remains open; this implementation agent opened no PR and made no
GitHub metadata changes, per the brief. Scope remained within the locked removal slice; no drift or
architecture debt was discovered.
