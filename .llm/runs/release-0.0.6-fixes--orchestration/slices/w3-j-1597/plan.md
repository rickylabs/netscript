# Plan — bump-before-publish scaffold behaviour

## Profile

- Archetype: 6 — CLI/tooling, because the changed surface is the CLI scaffold E2E gate.
- Overlays: none.
- PLAN-EVAL: N/A; the owner supplied the complete contract and proof matrix.

## Locked decisions

1. Keep the gate critical. A confirmed exact-version JSR 404 exits with the runner's intentional
   exclusion code and a named message; every other failure remains red.
2. Probe every exact-version package the fixture consumes before creating the fixture project.
3. Derive the version from a published CLI entrypoint when possible; local source falls back to the
   coordinated tree version.
4. Do not suppress scaffold tiers in the classifier. They continue to cover release-cut payloads.

## Open-decision sweep

- None. All acceptance-affecting decisions are locked.

## Commit slices

1. Mechanically degrade only unpublished exact-version pins; prove with focused tests and the four
   executed registry-state controls. Files: package-backed gate/fixture, availability seam/tests,
   slice artifacts. Gates: targeted test/check/fmt, then the required root and quality gates.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Registry outage becomes a false skip | Only HTTP 404 maps to exclusion; all other responses/errors throw. |
| Fix silently disables coverage | Published-version control must execute the full fixture and pass. |
| Published CLI/tree version mismatch | Prefer the exact version parsed from the published CLI entrypoint. |
| Lock churn | Inspect both lock files before every commit; never stage them. |

## Deferred scope

- No classifier changes.
- No release publication/cut and no full serialized scaffold runtime run.
- No public CLI or JSR package-surface change.

