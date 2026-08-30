# Research — test-scaffold-dynamic-route-gate--1616

## Re-baseline

- Carried-in source: issue #1616 and `implement.md`.
- Re-derived against `main` @ `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` on 2026-08-30.
- Status: in progress; issue claims are not treated as evidence until re-executed against this tree.

## Findings

Research findings will be committed as the next slice after the named grep, emission sites,
generator path, E2E suite composition, and #1576 runtime mechanism are re-derived.

## jsr-audit surface scan

- Surface scanned: pending plan scope decision.
- Slow-type / surface risks: pending; expected to be N/A if the change remains E2E-only and leaves
  `mod.ts`, export maps, JSDoc, and generated consumer APIs unchanged.

## Open questions

- Whether the dynamic route belongs to the product scaffold or an E2E-owned fixture.
- Which suite owns compile-time, runtime path binding, and `makeHref` round-trip assertions.
- Whether the exact #1576 failure can be reproduced without the serialized runtime lease.
