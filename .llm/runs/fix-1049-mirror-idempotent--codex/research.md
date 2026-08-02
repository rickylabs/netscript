# Research

## Baseline

The requested branch is clean at `8b69d78f0`. This is a repository-tooling validation fix, so no
package/plugin archetype or scope overlay applies.

## Confirmed findings

- `validateEvidenceMapping()` recognizes only unchecked checkbox text. Checked boxes and unknown
  boxes therefore take the same error path.
- `mirror-acceptance-evidence.ts` builds changes only from unchecked boxes and mapping entries.
  Keeping the returned mapping limited to unchecked boxes makes already-checked evidence a no-op.
- Existing tests encode the erroneous rejection and old error wording.

## Open questions

None. The requested behavior and implementation shape resolve all load-bearing decisions.

