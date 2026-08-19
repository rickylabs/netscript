#!/usr/bin/env bash
set -uo pipefail
RUN=".llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--golang-rfc"
RUNNER="$RUN/bench/harness/run-series.ts"
FAILED=0
series() {
  local w=$1 m=$2 c=$3
  local out="results/raw/G1-go_${w}_${m}_c${c}.jsonl"
  echo "=== $(date -u +%H:%M:%S) G1-go $w $m c=$c"
  deno run --allow-all --unstable-kv "$RUNNER" \
    --subject G1-go --workload "$w" --mode "$m" --concurrency "$c" \
    --warmup 20 --measure 300 --out "$out" 2>/dev/null | tail -1
  if [ ${PIPESTATUS[0]} -ne 0 ]; then echo "FAILED: $w $m c=$c"; FAILED=1; fi
}
series short queue 1; series short queue 16; series long queue 1
series short direct 1; series long direct 1
echo "=== rss-probe"; deno run --allow-all "$RUN/bench/harness/rss-probe.ts" --spawns 30 --out results/raw/rss-probe.jsonl | tail -1
echo "=== boundary"; deno run --allow-read --allow-write --allow-ffi "$RUN/bench/harness/run-boundary-go.ts" | tail -1
echo "=== run-4 done (failed=$FAILED)"; exit "$FAILED"
