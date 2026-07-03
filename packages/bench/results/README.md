# Bench results (committed)

This directory holds the **light, committed** outputs of bench runs. The heavy
raw per-turn traces are written to `.llm/tmp/bench/<run-id>/` (gitignored) — only
scored summaries live here.

- `history/*.json` — one scored `RunSummary` per run, timestamped and immutable.
- `latest.json` — a copy of the most recent scored `RunSummary`.
- `summary.md` — the human-readable Markdown view of the latest run.

## Reading a result

Every summary carries its `RunManifest`: the pinned model, Claude Code version,
framework/Deno/lockfile versions, seed, and weight preset. Two runs are only
comparable when those pins match. A summary flagged `fake` is a pipeline proof
from the fake driver, **not** a benchmark result; a `provisional` composite
excludes the rubric axis (Slice 1) and is directional only.

No result files are committed yet — the first real run lands with the live
`bench:self` path in Slice 1b.
