# Plan: relocate the Flow-B workers resource anchor

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-flow-b-fixture-plugin-marker--1863` |
| Branch | `fix/flow-b-fixture-plugin-marker` |
| Phase | `plan` |
| Target | `packages/cli/e2e` fixture |
| Archetype | `6 — CLI / Tooling` (parent package; nested E2E workspace is not a published doctrine root) |
| Scope overlays | `none` |

## Archetype

Archetype 6 is the smallest fit because this is the end-to-end harness for a shipped CLI/scaffold
flow. The nested E2E workspace is explicitly excluded from doctrine-root gating, so public-surface
and JSR gates are N/A for this fixture-only leaf.

## Current Doctrine Verdict

`packages/cli`: **Keep** — preserve the Archetype-6 kernel/surface split. This leaf does not change
that split or any published surface.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A6 | The range locator is justified as the pure test seam for a non-trivial generated-code invariant. |
| A14 | Focused semantic tests preserve both acceptance and loud rejection behavior. |

## Goal

Make `runtime.flow-b-fixture` locate the generated workers resource by executable code identity,
independent of positional order and human-readable comments, without weakening absence/malformed
failure behavior.

## Product Path Ceiling

- `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts`
- One focused locator beside the fixture, if required for a pure test seam.
- Focused tests under `packages/cli/e2e/tests/application/gates/`.
- This run directory.

Anything under generator source/tests, any #1858-owned file, `deno.lock`, or unrelated runtime code
requires explicit rescope.

## Non-Scope

- Generator marker changes or sibling-generator normalization.
- #1858 Garnet/listener-readiness work.
- Hosted/runtime verification (`netscript init`, `e2e:cli`, Aspire, Docker).
- Published package or dependency changes.

## Hidden Scope

- The locator must reject missing, truncated, duplicated, or reversed workers anchors rather than
  returning a broad or guessed range.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Start on the unique `builder.addExecutable(...workers-api...)` declaration. | It names the generated resource semantically and does not depend on plugin order or comments. |
| D2 | End after the unique `plugins.set(...workers-api..., resource)` statement. | It proves the resource is registered and prevents a truncated declaration from being accepted as a usable block. |
| D3 | Fail on zero or multiple anchors and on invalid ordering. | Ambiguity or malformed output must remain a loud fixture failure. |
| D4 | Defer a generator-family marker-format guard. | It belongs at the generator source and crosses the explicit generator rescope boundary. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Whether to normalize sibling generator comments | safe to defer | Source behavior is unrelated to the fixture blocker and explicitly outside the ceiling. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A regex matches a different plugin or a pass-2 reference block. | Require the literal workers name in both creation and registration code, the `resource` binding, uniqueness, and ordering. |
| The predicate accepts only the opening line of a malformed block. | Require the matching `plugins.set` terminator before returning a range. |
| Tests become formatted-string snapshots. | Use minimal semantic generated-code fixtures, not whole-file snapshots (avoid AP-18). |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | risk | Keep the helper policy-specific: it validates a workers resource range rather than renaming `indexOf`. |
| AP-18 | risk | Assert the selected semantic range and thrown errors using compact representative source. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-10 test shape | yes | Focused `_test.ts` stays below doctrine limits and covers accept/reject behavior. |
| F-19 scoped runners | yes | Structured test/check/lint/fmt wrappers scoped to the CLI E2E paths. |
| Parent package quality/doctrine | proportionate static check | No new forbidden constructs; `quality:scan`/`arch:check` where the scoped tooling permits. |
| JSR/public surface | no | Nested fixture only; exports and publish shape unchanged. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Generator marker-family inconsistency | none | Record as bounded drift, not architecture debt; source rescope is owner-controlled. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | Structured focused test wrapper on the new locator test | Both required cases fail before production code exists. |
| 2 | GREEN | Same focused wrapper | All cases pass. |
| 3 | Static | Scoped structured check/lint/fmt wrappers | PASS. |
| 4 | Lock hygiene | Compare `deno.lock` with baseline | Byte-identical. |

## Drift Watch

- Any need to edit generator files, #1858-owned files, dependencies, or runtime infrastructure.

PLAN-EVAL: **N/A** — this is a small mechanical defect with owner-locked scope, acceptance,
semantic anchor class, and validation constraints; no architecture or sequencing decision remains.
