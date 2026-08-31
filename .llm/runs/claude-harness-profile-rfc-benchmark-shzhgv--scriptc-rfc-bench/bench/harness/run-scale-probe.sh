#!/usr/bin/env bash
# Owner-review follow-up: rerun the scale-relevant queue series with the system sampler attached.
# Subjects A (deno) and B (scriptc) short workload at c=1,16,64; D added at c=64 for the native
# floor. Output: results/raw/scale_<subject>_c<k>.jsonl (series) + sys_<subject>_c<k>.jsonl.
set -uo pipefail
RUN=".llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench"
RUNNER="$RUN/bench/harness/run-series.ts"
SAMPLER="$RUN/bench/harness/system-sampler.ts"
FAILED=0

probe() { # subject concurrency
  local s=$1 c=$2
  echo "=== $(date -u +%H:%M:%S) scale-probe $s c=$c"
  deno run --allow-all "$SAMPLER" \
    --out "results/raw/sys_${s}_c${c}.jsonl" --interval 100 \
    --match task-scriptc-native --match task-rust-native --match "tasks/task-deno.ts" &
  local sampler_pid=$!
  sleep 0.4
  deno run --allow-all --unstable-kv "$RUNNER" \
    --subject "$s" --workload short --mode queue --concurrency "$c" \
    --warmup 20 --measure 300 --out "results/raw/scale_${s}_c${c}.jsonl" 2>/dev/null | tail -1
  local rc=${PIPESTATUS[0]}
  kill -TERM "$sampler_pid" 2>/dev/null; wait "$sampler_pid" 2>/dev/null
  if [ "$rc" -ne 0 ]; then echo "SCALE PROBE FAILED: $s c=$c"; FAILED=1; fi
}

for c in 1 16 64; do
  probe A-deno "$c"
  probe B-scriptc "$c"
done
probe D-rust 64

echo "=== scale probes done (failed=$FAILED) $(date -u +%H:%M:%S)"
exit "$FAILED"
