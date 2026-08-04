# Drift — fix-windows-node-modules-materialization--1246

## Recorded deviations

### D6 composed PLAN-EVAL waiver

- **Plan expectation:** harness normally requires a separate formal PLAN-EVAL session.
- **Actual:** the owner explicitly ruled “Per milestone ruling D6: no local PLAN-EVAL.”
- **Disposition:** `COMPOSED_WAIVER`; evaluation composes draft→ready augmentation, OpenHands, and
  orchestrator pre-merge review. Recorded before source implementation.
- **Scope impact:** none.

## Open drift

### Verifier identity source

- **Plan risk note:** derive package identity from the local package's `package.json`.
- **Actual:** parse the primary Deno `.deno/<encoded-name>@<version>[_peer...]` directory, then
  require a matching shared-cache version directory.
- **Reason:** a corrupt materialization may omit `package.json` itself; requiring local metadata
  would skip the exact package the detector must report. The parser handles scoped names and peer
  suffixes, while cache existence prevents unmatched directories from counting as verification.
- **Scope impact:** none; detection is stricter and the fail-closed law is unchanged.

### Deno cache bookkeeping exclusion

- **Plan expectation:** every shared-cache regular file should exist in the local package copy.
- **Actual:** the first full runtime smoke proved Deno adds `.scripts-warned-*` lifecycle bookkeeping
  to cache package roots without materializing it. The verifier now excludes exactly that Deno-owned
  marker prefix and continues comparing all package-owned dotfiles and regular files.
- **Evidence:** initial `scaffold.runtime` reached the generated Fresh dev boundary and failed only
  on `msgpackr-extract@3.0.4/.scripts-warned-*`; executable fixtures now include the marker while
  still failing for a missing real Babel file.
- **Scope impact:** no acceptance reduction; removes a false positive discovered by consumer proof.
