# Context Pack — graft-harness-bench

**State:** S5 (verdict) — awaiting owner merge decision on PR #1697.

- Branch `claude/graft-integration-benchmark-wgvfw1`, baseline `c73d361`, draft PR #1697.
- Landed: S1 scaffolding (`5a37248`), S2 Graft skill integration (`d64cec2`), S3 benchmark
  workflow (`a633e3b`), S4 results (`benchmark-results.md` + `benchmark-raw.json`), S5 verdict PR
  comment.
- Benchmark outcome (Opus 5 medium, structural graph): graft −14% output tokens but +27% tool
  calls, +6% wall, judge quality 8.83 vs 9.33 with zero graft wins. Supervisor recommendation:
  do not merge as-is; owner decides (options in verdict comment: close, merge as opt-in skill, or
  re-benchmark the `--deep` tier with a key).
- If owner says merge: flip DoD boxes, `status:ready-merge`. If close: close PR #1697 unmerged;
  no repo cleanup needed beyond the branch (graft/ is local-only).
- Standing: send_later check-in trig_015syijxyyhPBj88bXKvGuY9 (cancel when PR settled).
