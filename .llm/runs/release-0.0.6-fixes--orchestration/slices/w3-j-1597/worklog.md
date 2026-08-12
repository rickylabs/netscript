# Worklog — W3-J #1597

## Design

- Public surface: unchanged; this is internal CLI E2E harness behavior.
- Domain vocabulary: exact pinned version, unpublished package, named exclusion.
- Port: injected `fetch` function is the test seam for the external JSR metadata boundary.
- Constants: reserved exit code 78 and the reporter-visible exclusion message.
- Commit slices: one focused implementation slice, as locked in `plan.md`.
- Deferred: classifier changes and release operations.
- Contributor path: gate definition → availability seam → package-backed fixture → focused tests.

The design was locked from the supplied slice brief and the runner's existing skip contract before
source edits; these standalone run artifacts were materialized after the negative-control capture.

## Implementation

- Captured red-before behavior with the actual generated release constant set temporarily to
  `0.0.1597-unpublished`, then restored the generated asset.
- Added an exact-version JSR availability check for every package consumed by the fixture.
- Mapped only confirmed 404 absence to an explicit skipped verdict; retained critical behavior for
  other failures.
- Added conditional published-CLI version derivation and focused regression tests.
- Executed the unpublished and published controls through the real `CommandGate`.

## Reconcile

- Issue #1597 remains open and has three acceptance boxes.
- Resolving PR must contain `Closes #1597`, a complete evidence mapping, milestone `0.0.6`, and the
  requested namespaced labels.
- No scope or doctrine readjustment was required.

## Gates

Gate results are appended after the required validation pass; exact defect proof is in `evidence.md`.

