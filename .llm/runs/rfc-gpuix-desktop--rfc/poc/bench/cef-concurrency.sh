#!/usr/bin/env bash
# Concurrent-start probe for the Deno Desktop CEF build: launch N instances at once and record
# each instance's NETSCRIPT_READY line (or a timeout). Runs inside bench/ctr.sh.
# Usage: bench/cef-concurrency.sh <out-log> [trials-of-2=3] [budget-seconds=120]
set -uo pipefail
OUT="$1"; TRIALS="${2:-3}"; BUDGET="${3:-120}"
: > "$OUT"
run_trial() { # <label> <instances>
  local label="$1" n="$2" pids=() i
  echo "== $label: $n instances launched together" >> "$OUT"
  for i in $(seq 1 "$n"); do
    NETSCRIPT_BENCH=1 NETSCRIPT_BENCH_RATE=0 NETSCRIPT_BENCH_PROFILE="/tmp/cc-$label-$i" \
      setsid build/netscript-cef/netscript-cef > "/tmp/cc-$label-$i.log" 2>&1 &
    pids+=("$!")
  done
  for _ in $(seq 1 "$BUDGET"); do
    local ready=0
    for i in $(seq 1 "$n"); do grep -q NETSCRIPT_READY "/tmp/cc-$label-$i.log" && ready=$((ready + 1)); done
    [[ "$ready" == "$n" ]] && break
    sleep 1
  done
  for i in $(seq 1 "$n"); do
    echo "instance $i: $(grep -o 'NETSCRIPT_READY.*' "/tmp/cc-$label-$i.log" || echo "not ready after ${BUDGET} s")" >> "$OUT"
  done
  for pid in "${pids[@]}"; do kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null; done
  sleep 4
}
for t in $(seq 1 "$TRIALS"); do run_trial "pair-$t" 2; done
run_trial "four" 4
cat "$OUT"
