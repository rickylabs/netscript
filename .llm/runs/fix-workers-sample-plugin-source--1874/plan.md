# Plan: official workers sample plugin source (#1874)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-workers-sample-plugin-source--1874` |
| Branch | `fix/workers-sample-plugin-source` |
| Phase | `plan` |
| Target | `plugins/workers` |
| Archetype | `5 - Plugin Package` |
| Scope overlays | none |

## Archetype

Archetype 5 applies because the defect is in the first-party workers plugin's thin CLI/scaffold
wiring. No core contract or public surface changes.

## Current Doctrine Verdict

`plugins/workers` is `Refactor`: complete connector thinness and the jobs/worker contribution
split. This repair preserves that direction by declaring plugin ownership at the authored config
boundary rather than weakening host discovery.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | The generated configuration must be explicit at its published/user-facing boundary. |
| A11 | `source` names the local/plugin extension axis. |
| A14 | A regeneration regression test preserves the discovery invariant. |

## Goal

Make the official sample configuration self-consistent across scaffold authoring and config-aware
registry regeneration without weakening D6.

## Scope

- Add `source: 'plugin'` to the plugin-owned `create-user-settings` sample declaration.
- Add one focused test covering official sample authoring followed by config-aware regeneration.

## Non-Scope

- D6 matching or diagnostics.
- Runtime, Aspire, Docker, or local `e2e:cli` proof.
- Existing workers public-surface debt and unrelated authored samples.

## Hidden Scope

- Harness artifacts required by the activated workflow are tracked separately from the two product
  files; they do not expand product behavior.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Fix the sample producer with explicit `source: 'plugin'`. | Discovery is correctly enforcing an ownership invariant. |
| D2 | Exercise the real writer and config-aware generator in the regression. | Pins the exact scaffold-to-regeneration boundary that failed. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Source ownership | resolved now | The entrypoint is under `plugins/workers/jobs`. |
| Test location | resolved now | Extend the existing runtime registry generator test. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Test only checks text, not regeneration | Import the authored module and pass its normalized workers config into generation. |
| Unrelated sample mismatch remains | Scan every authored plugin-path entrypoint before implementation. |
| Validation mutates dependencies | Compare `deno.lock` to baseline after all gates. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11 | avoid | Keep discovery explicit and side-effect-free; do not weaken D6. |
| AP-14 | avoid | Reuse the core workers config schema; define no plugin-local contract. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Static wrappers | yes | Focused check/test/lint/fmt all pass. |
| F-3/F-5/F-11/F-15 | yes | `quality:gate` / architecture fitness remains green. |
| F-6/F-7 | unchanged | JSR surface scan shows no export/doc/publish-shape change; known #1655 debt unaffected. |
| Runtime/consumer | hosted-only | Owner explicitly assigned D6 runtime proof to PR #1872's hosted lane. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `plugins/workers — doctrine verdict Refactor` | none | No layering or folder-shape change. |
| `workers-private-type-ref-1655` | none | No public-surface change. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused regression | structured test wrapper on `runtime-registry-generator_test.ts` | pass |
| 2 | plugin check | structured check wrapper rooted at `plugins/workers` | pass |
| 3 | plugin lint | structured lint wrapper rooted at `plugins/workers` | pass |
| 4 | owned fmt | structured fmt wrapper on the two product files | pass |
| 5 | quality/doctrine | `deno task quality:gate` | pass |
| 6 | lock hygiene | raw git diff for `deno.lock` | no movement |

## Dependencies

- Base commit `898d3aada` from PR #1872.

## Drift Watch

- Any need to change D6 or more than the two planned product files.
- Any additional authored plugin-path entrypoint missing explicit plugin source.
