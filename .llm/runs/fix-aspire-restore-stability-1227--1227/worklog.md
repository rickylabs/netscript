# Worklog — #1227 reopened restore stability

## Design

- Public surface: no user-facing API; workflow artifact and existing `quickstart.walk` gate behavior.
- Domain vocabulary: restore cancellation signature, diagnostic log artifact, finite retry budget,
  exact pinned package cache, consecutive-run proof.
- Ports: existing `AspireCommandRunner` remains the subprocess seam; GitHub Actions artifact/cache
  actions remain workflow adapters.
- Constants: retry count/signature and exact Aspire version/cache keys must be named once.
- Commit slices: diagnostic capture → evidence-driven mitigation → repeated proof.
- Deferred: upstream Aspire fix.
- Contributor path: quickstart orchestration lives in `aspire-walk.ts`; workflow proof lives in
  `e2e-cli-prod.yml`; policy tests mirror both contracts.

## Progress

- 2026-08-05: re-baselined issue comment, PR #1297, failed run 30961102523, and artifact 8913213616.
- D6 owner ruling composes evaluation; no local PLAN-EVAL was spawned.
- 2026-08-05: local logs for the same signature identify bundled NuGet restore, before containers.
  Both cloud evidence runs missed the v1 cache and ended before Actions could save it.
- 2026-08-05: S2 adds a prerequisite cache-population job with five exact package assertions and a
  two-attempt predicate restricted to exit 6 plus both preparation-cancellation markers.
- 2026-08-05: proof run 30962998528: cache seed saved 170,799,714 bytes; dependent job restored a
  163 MB hit; Quickstart Aspire step passed in 22.58s. Later step 7 found a pre-existing assertion
  mismatch, corrected without weakening `scaffold.runtime` database-health coverage.
- 2026-08-05: final-head proof run 30963671830 passed all seven Quickstart steps; Aspire restore
  and start completed in 19.87s (consecutive proof 1/3).
- 2026-08-05: run 30964226683 reset the proof count. Step 4 remained green in 21.36s, but the
  database operation AppHost then spent 300s in `BundleNuGetService` restoring the same four
  packages before `aspire start` exit 2. The captured child log proves this is the same upstream
  restore class at a second Quickstart AppHost boundary, before any database product operation.
- 2026-08-05: S4 replaces the database gate's unbounded inline sequence with a 120s-per-command
  wrapper. It sets Aspire's internal start bound to 90s and retries only the two production restore
  surfaces (exit 6 cancellation with both preparation markers, or exit 2 start timeout with the
  AppHost-log marker). Product failures remain single-attempt and distinctly classified.
