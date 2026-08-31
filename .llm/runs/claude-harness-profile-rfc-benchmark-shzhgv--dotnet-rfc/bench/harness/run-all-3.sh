#!/usr/bin/env bash
# Run-3 protocol: C# subjects through the dotnet adapter dispatch path + probes.
set -uo pipefail
RUN=".llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--dotnet-rfc"
RUNNER="$RUN/bench/harness/run-series.ts"
FAILED=0
series() { # subject workload mode concurrency measure
  local s=$1 w=$2 m=$3 c=$4 n=$5
  local out="results/raw/${s}_${w}_${m}_c${c}.jsonl"
  if [ -f "$RUN/$out" ]; then echo "skip $out"; return; fi
  echo "=== $(date -u +%H:%M:%S) $s $w $m c=$c"
  deno run --allow-all --unstable-kv "$RUNNER" \
    --subject "$s" --workload "$w" --mode "$m" --concurrency "$c" \
    --warmup 20 --measure "$n" --out "$out" 2>/dev/null | tail -1
  if [ ${PIPESTATUS[0]} -ne 0 ]; then echo "SERIES FAILED: $s $w $m c=$c"; FAILED=1; fi
}
# Queue mode (interleaved subjects per level)
for s in H2-dotnet-fd H3-dotnet-aot H3x-executable-control; do series "$s" short queue 1 300; done
series H1-dotnet-run short queue 1 100
for s in H2-dotnet-fd H3-dotnet-aot H3x-executable-control; do series "$s" short queue 16 300; done
for s in H2-dotnet-fd H3-dotnet-aot; do series "$s" long queue 1 300; done
# Direct mode
for s in H2-dotnet-fd H3-dotnet-aot; do series "$s" short direct 1 300; series "$s" long direct 1 300; done
echo "=== $(date -u +%H:%M:%S) rss-probe"
deno run --allow-all "$RUN/bench/harness/rss-probe.ts" --spawns 30 --out results/raw/rss-probe.jsonl | tail -1
echo "=== run-3 done (failed=$FAILED) $(date -u +%H:%M:%S)"
exit "$FAILED"
