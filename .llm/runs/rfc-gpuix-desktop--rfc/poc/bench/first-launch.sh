#!/usr/bin/env bash
# First launch vs warm launch of the shipped binary, inside one fresh container
# (empty /tmp: no deno-compile cache, no app data). Prints spawn→first window and
# spawn→data-backed frame (NETSCRIPT_READY), then what the first launch left in /tmp.
# Usage (inside bench/ctr.sh): bench/first-launch.sh <binary>
set -uo pipefail
BIN="$1"
now() { date +%s%3N; }
launch() { # <label> <profile>
  local t0 win="" ready="" pid
  t0=$(now)
  if [[ "$BIN" == *webview* ]]; then   # webview host takes its profile from the environment
    NETSCRIPT_BENCH=1 NETSCRIPT_BENCH_RATE=0 NETSCRIPT_BENCH_PROFILE="$2" "$BIN" > "/tmp/$1.log" 2>&1 &
  else
    NETSCRIPT_BENCH=1 NETSCRIPT_BENCH_RATE=0 "$BIN" --profile="$2" > "/tmp/$1.log" 2>&1 &
  fi
  pid=$!
  for _ in $(seq 1 600); do
    [[ -z "$win" ]] && xdotool search --name '^NetScript' >/dev/null 2>&1 && win=$(( $(now) - t0 ))
    [[ -z "$ready" ]] && grep -q NETSCRIPT_READY "/tmp/$1.log" && ready=$(( $(now) - t0 ))
    [[ -n "$win" && -n "$ready" ]] && break
    sleep 0.01
  done
  echo "$1: window ${win:-?} ms · data-backed frame ${ready:-?} ms"
  kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; sleep 1
}
launch first /tmp/profile-first
echo "after first launch, /tmp contains:"; du -sh /tmp/deno-compile-* 2>/dev/null | sed 's/^/  /'
launch warm-fresh-profile /tmp/profile-second
launch warm-same-profile /tmp/profile-first
