# Benchmark results — Graft structural tier, Opus 5 (medium) probes

Run: workflow `wf_f33ba4bf-839`, 2026-08-25. 18 agents (12 probes + 6 judges), 0 errors,
18.3 min total, 1.157M subagent tokens. Raw data: `benchmark-raw.json` (full answers, judge
verdicts, per-probe metrics).

## Protocol recap

6 supervisor-verified tasks × {baseline, graft}; one Opus 5 medium subagent per cell, sequential;
per-probe **output**-token deltas from workflow `budget.spent()`; self-reported tool-call counts
and wall time; blind pairwise judging (deterministic A/B alternation) by Opus 5 medium judges with
read-only repo access and the ground-truth keys.

## Per-task metrics

| Task | Condition | Out-tokens | Tool calls | Wall (s) | Judge score | Winner |
| ---- | --------- | ---------- | ---------- | -------- | ----------- | ------ |
| T1 contribution abstracts | baseline | 3,164 | 6 | 10 | 9.5 | tie |
| | graft | 1,772 | 4 | 10 | 9.5 | |
| T2 queue KV isolation | baseline | 4,811 | 9 | 32 | 9.5 | baseline |
| | graft | 4,447 | 11 | 42 | 9.0 | |
| T3 rename blast radius | baseline | 3,344 | 7 | 22 | 9.0 | baseline |
| | graft | 2,934 | 8 | 31 | 8.5 | |
| T4 plugin→CLI chain | baseline | 13,110 | 20 | 124 | 9.0 | baseline |
| | graft | 8,371 | 19 | 66 | 8.0 | |
| T5 dialog showModal | baseline | 2,410 | 7 | 11 | 9.5 | tie |
| | graft | 2,788 | 8 | 23 | 9.5 | |
| T6 trace propagation | baseline | 6,043 | 10 | 36 | 9.5 | baseline |
| | graft | 7,948 | 25 | 76 | 8.5 | |

## Aggregate

| Metric | Baseline | Graft | Delta |
| ------ | -------- | ----- | ----- |
| Output tokens | 32,882 | 28,260 | **−14.1%** |
| Tool calls | 59 | 75 | **+27.1%** |
| Wall time | 235 s | 248 s | **+5.5%** |
| Mean judge score | 9.33 | 8.83 | **−0.5** |
| Quality wins | 4 | 0 | 2 ties |

## Reading

- **Token win is real but modest** and driven by enumerable/structured tasks (T1 −44%, T4 −36%):
  `graft grep`/`skeleton` replace multi-file reads with compact symbol hits. On tracing tasks
  (T5, T6) graft **cost more**: agents queried the graph *and then* re-verified with reads.
- **No efficiency win otherwise**: more tool calls, slightly slower. The graph adds a query layer
  without removing the verification layer.
- **Quality regressed slightly and consistently** (never won a judgment). Judge-verified failure
  modes in graft answers: overstated KV delivery semantics (T2), a wrong dispatch-target
  conflation (T4), an overstated propagation chain (T6) — the pattern is trusting graph output
  semantics where the graph only encodes lexical/structural facts.
- **Upstream claims (−42% tokens / −46% tool calls / −60% time) did not reproduce** on this repo
  at the structural tier with Opus 5 medium probes.

## Limitations

- Structural tier only — no `GRAFT_API_KEY`, so `graft build --deep` enrichment untested; the
  upstream claims target the enriched graph and cold agent sessions.
- Output tokens only; per-agent input/context tokens not separable from the workflow aggregate.
  Tool-call counts (+27%) suggest input-side savings are unlikely, but it is unmeasured.
- N=1 per cell (12 probes); margins on quality are 0.5–1.5 points; directionally consistent
  (4 wins + 2 ties for baseline) but not statistically strong.
- Judge model shares family with probes (Anthropic); ground-truth keys mitigate family bias.
- Observed and neutralized: graft query output injects an instruction asking the agent to report
  "tokens saved" to the user — undesirable in agent pipelines.
