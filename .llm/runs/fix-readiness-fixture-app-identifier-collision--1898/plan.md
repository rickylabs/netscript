# Plan: fixture app identifier collision

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-readiness-fixture-app-identifier-collision--1898` |
| Branch | `fix/readiness-fixture-app-identifier-collision` |
| Phase | `plan` |
| Target | `packages/cli/e2e` readiness fixture injection |
| Archetype | `6 — CLI / Tooling` (CLI-owned E2E harness) |
| Scope overlays | `none` |

## Archetype

Archetype 6 applies through ownership by `@netscript/cli`; doctrine explicitly excludes the nested
E2E workspace as an independent published doctrine root. This is a semantic harness regression fix,
not a public CLI architecture change.

## Current Doctrine Verdict

`packages/cli`: **Keep** — preserve the Archetype-6 kernel/surface split. This slice does not alter
that split or any published surface.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A6 | A small namespace helper is justified by a stable, non-trivial generated-code invariant. |
| A14 | Real generator output plus a compile assertion becomes the fitness function for injection. |

## Goal

Inject readiness fixture app blocks into a realistic generated host module without duplicate or
dangling identifiers, while preserving resource registrations and fail-closed idempotency.

## Scope

- Add RED coverage over a one-app host produced by the real generator.
- Give every fixture block identifier a fixture-specific namespace at identifier boundaries.
- Record RED/GREEN commits and focused wrapper verdicts in the run artifacts and draft PR.

## Non-Scope

- No change to `generate-register-apps.ts` or its positional naming.
- No runtime lease, full `e2e:cli`, listener deadline, listener fixture, dependency, or lock change.
- No acceptance checkbox mirroring; the supervisor owns that step.

## Hidden Scope

- Rename suffixed bindings such as `_workdir` and `_otel`, not only the resource binding.
- Type-check the emitted module against typed local stubs so a partial rename cannot pass.
- Preserve both resource names and second-injection failure behavior.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Rewrite each sliced fixture block from its generated root binding to `readiness_fixture_app_<n>` at identifier boundaries. | The prefix cannot overlap the host generator's `app_<n>` namespace and covers every derived suffix consistently. |
| D2 | Keep the rewrite block-local, after slicing. | It avoids host-count coupling and leaves the shared generator contract untouched. |
| D3 | Compile the actual injected module in a temporary matching directory layout with typed dependency stubs. | This proves syntax and binding consistency without requiring Aspire runtime or network access. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Fixture namespace spelling | resolved now | `readiness_fixture_app_<n>` is disjoint from generator-produced `app_<n>`. |
| Host-count offset | safe to defer/reject | We intentionally avoid the weaker count-coupled design. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Partial replacement leaves an undeclared suffixed identifier. | Identifier-boundary replacement plus `deno check` of the emitted module. |
| Replacement mutates strings or unrelated identifiers. | Replace only the known generated root identifier at JavaScript identifier boundaries inside its sliced block. |
| Regression test becomes a hand-authored snapshot. | Generate the host and fixture content with the real generator and assert semantics. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-18 | risk | Assert declarations, registrations, and compilation rather than a giant string snapshot. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Focused E2E tests | yes | Structured test wrapper exit 0 after an observed RED failure. |
| Scoped check | yes | Structured check wrapper exit 0. |
| Scoped format | yes | Structured format wrapper exit 0. |
| Focused lint | yes | Structured lint wrapper over the touched test/source directory; root e2e lint refusal recorded separately if encountered. |
| F-CLI-1…31 / doctrine | manual N/A | No CLI package architecture or published source surface changes; nested E2E harness is excluded as a doctrine root. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `scaffold-runtime-a8-f16-1333` | none | This slice neither adds a runtime gate nor grows the recorded registry/gate directory. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | Structured test wrapper focused on `prepare-readiness-fixture_test.ts` | exactly one new failing test before product change |
| 2 | Tests | Structured test wrapper over `packages/cli/e2e/tests/application/gates` | exit 0 |
| 3 | Check | Structured check wrapper over `packages/cli/e2e` | exit 0 |
| 4 | Format | Structured format wrapper over `packages/cli/e2e` | exit 0 |
| 5 | Lint | Structured lint wrapper over touched gate paths | exit 0 |

## Dependencies

- Existing real generator and Deno executable only; no new dependencies.

## Drift Watch

- Any need to change the generator, lockfile, ceiling, or runtime deadline stops or rescopes the run.

## Deferred Scope

- Hosted `scaffold.runtime` tiers require the contended runtime lane and are intentionally left to
  the supervisor; this leaf must not run them.
