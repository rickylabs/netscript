# Context Pack — graft-harness-bench

**State:** S1 (scaffolding + draft PR).

- Branch `claude/graft-integration-benchmark-wgvfw1`, baseline `c73d361`.
- Goal: minimal Graft (NanoNets) CLI+skill integration; before/after benchmark with Opus 5 medium
  subagents (6 tasks × {baseline, graft}); complete benchmark + review posted as PR comment; owner
  decides merge.
- Graft v0.13.0 verified: builds this repo's structural graph in ~36s (17,861 nodes); queries work
  without an API key.
- Slices: S1 scaffolding/PR → S2 integration surface (skill canonical+mirror, ignore files) → S3
  benchmark workflow+tasks → S4 execution+results → S5 verdict PR comment.
- Overrides + limitations recorded in supervisor.md and drift.md.
