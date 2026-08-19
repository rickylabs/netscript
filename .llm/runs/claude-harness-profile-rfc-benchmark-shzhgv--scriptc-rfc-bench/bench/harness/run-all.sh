#!/usr/bin/env bash
# S6 orchestrator — runs every planned series as a fresh process (KV isolation), interleaving
# subjects within each (workload, concurrency) level per plan.md R2. Run from repo root.
set -uo pipefail

RUN=".llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench"
RUNNER="$RUN/bench/harness/run-series.ts"
WARMUP=20
MEASURE=300
SUBJECTS=(A-deno B-scriptc C-executable-control D-rust)
FAILED=0

series() { # subject workload mode concurrency
  local s=$1 w=$2 m=$3 c=$4
  local out="results/raw/${s}_${w}_${m}_c${c}.jsonl"
  if [ -f "$RUN/$out" ]; then echo "skip $out (exists)"; return; fi
  echo "=== $(date -u +%H:%M:%S) $s $w $m c=$c"
  deno run --allow-all --unstable-kv "$RUNNER" \
    --subject "$s" --workload "$w" --mode "$m" --concurrency "$c" \
    --warmup "$WARMUP" --measure "$MEASURE" --out "$out" 2>/dev/null | tail -1
  if [ ${PIPESTATUS[0]} -ne 0 ]; then echo "SERIES FAILED: $s $w $m c=$c"; FAILED=1; fi
}

# Queue mode: short sweep {1,4,16,64}, long {1,4}
for c in 1 4 16 64; do for s in "${SUBJECTS[@]}"; do series "$s" short queue "$c"; done; done
for c in 1 4;       do for s in "${SUBJECTS[@]}"; do series "$s" long  queue "$c"; done; done
# Direct mode (dispatch-tax isolation): c=1 both workloads
for s in "${SUBJECTS[@]}"; do series "$s" short direct 1; done
for s in "${SUBJECTS[@]}"; do series "$s" long  direct 1; done
# Cold-spawn RSS probe
echo "=== $(date -u +%H:%M:%S) rss-probe"
deno run --allow-all "$RUN/bench/harness/rss-probe.ts" --spawns 30 --out results/raw/rss-probe.jsonl | tail -1

echo "=== all series done (failed=$FAILED) $(date -u +%H:%M:%S)"
exit "$FAILED"
