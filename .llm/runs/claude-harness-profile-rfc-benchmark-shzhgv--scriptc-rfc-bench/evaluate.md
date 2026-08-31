# IMPL-EVAL — claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench

**Verdict: PASS** (`OPENHANDS_VERDICT: PASS`)

| Field | Value |
| --- | --- |
| Evaluator session | OpenHands cloud run 32304295923 (separate session; generator did not self-certify) |
| Model / route | `openrouter/deepseek/deepseek-v4-flash-0731` — lane-policy relay IMPL-EVAL route (supervisor.md D-1 cloud route; dispatched by owner trigger comment after draft→ready) |
| Trusted base | 2dd1a75ef55637816b80e04462cc26fa89631b12 |
| Evaluated head | 13e212e8b27b029a9d18a311b4a893ec197b22d2 |
| Verdict provenance | PR #1678 comment (2026-08-19T21:43Z), mirrored here verbatim in substance |

## Independently verified by the evaluator

- Benchmark data recomputed from raw JSONL: 32 series, 10 240 exec records, 0 failures, ≥300
  measured per series; all RFC headline figures match (40.7% e2e, 7.4× executor-side, B≡C
  control, 17× RSS).
- Source-seam claims checked at head: `customAdapters` resolution order, `TaskRuntimeAdapterLike`,
  the three closed unions, `TaskDefinitionSchema.parse`, `createQueue` Deno-KV default,
  `--allow-all` permission default, D-4 env-shape gap — all accurate.
- Plan gate: L5 pre-registered criteria applied transparently; `PLAN-EVAL: N/A` justified (L7);
  S8 gate machine-satisfied.
- Docs gates: all local paths resolve; fmt clean; doc:lint N/A with reason; `ci:skip-*` labels
  documented.
- Close-gate hygiene: RFC Draft/0000 correct; no closing keywords; clean tree; no lock churn;
  sole open DoD box is the one this verdict closes.

## Non-blocking findings (tracked, not fixed on this head)

1. **Low — RFC tracking issue deferred.** Open the companion `rfc:` tracking issue before the
   RFC moves to Discussion. → Actioned post-verdict: tracking issue filed (see context-pack /
   PR close comment for the number).
2. **Low — wording nit.** RFC's "~57 ms" dispatch share reads 58–62 ms per subject in raw data
   (A ≈ 62 ms). Cosmetic; fold into the next RFC edit (Discussion transition), not a new head
   for this PR.

## Post-verdict head note

Commits after 13e212e are **run-artifact-only** (this file + close bookkeeping in
worklog/context-pack). Deliverable files (`rfcs/`, `bench/`, `results/`) are unchanged since the
evaluated head — verifiable via `git diff 13e212e..HEAD -- rfcs bench results`.
