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
