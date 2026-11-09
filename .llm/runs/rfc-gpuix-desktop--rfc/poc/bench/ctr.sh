#!/usr/bin/env bash
# Run a command inside the GPUIX bench image with an Xvfb display.
# Usage: ctr.sh [--name NAME] [--cpus N] <workdir> <command...>
# The worktree is bind-mounted at its identical path (remote dind sees the same FS).
set -euo pipefail
NAME="gpuix-eval-$(date +%s%N | tail -c 7)"; CPUS=""
while [[ "${1:-}" == --* ]]; do
  case "$1" in
    --name) NAME="gpuix-eval-$2"; shift 2 ;;
    --cpus) CPUS="--cpus=$2"; shift 2 ;;
    *) echo "unknown flag $1" >&2; exit 2 ;;
  esac
done
WORKDIR="$1"; shift
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
HOME_DIR="$ROOT/.llm/tmp/ctr-home"
export DOCKER_HOST="${DOCKER_HOST:-tcp://netscript-dind:2375}"
exec docker run --rm --name "$NAME" --label owner=gpuix-eval $CPUS \
  --init --shm-size=4g --user 1000:1000 \
  -v "$ROOT:$ROOT" -w "$WORKDIR" \
  -e HOME="$HOME_DIR" -e DENO_DIR="$HOME_DIR/deno" -e BUN_INSTALL_CACHE_DIR="$HOME_DIR/bun-cache" \
  -e npm_config_cache="$HOME_DIR/npm-cache" -e NO_COLOR=1 -e NETSCRIPT_BENCH -e NETSCRIPT_BENCH_RATE -e NETSCRIPT_BENCH_PROFILE -e NETSCRIPT_SCHEME -e NETSCRIPT_PATH \
  -e NETSCRIPT_STACK -e NETSCRIPT_STACK_DIR -e NETSCRIPT_STACK_ONLINE -e READY_TRIES -e NETSCRIPT_UI -e NETSCRIPT_LIVE_BUDGET_MS \
  gpuix-eval-bench:1 bash -c '
    mkdir -p /tmp/xdg && chmod 700 /tmp/xdg
    Xvfb :99 -screen 0 1440x900x24 -nolisten tcp >/tmp/xvfb.log 2>&1 &
    for i in $(seq 1 50); do [ -e /tmp/.X11-unix/X99 ] && break; sleep 0.1; done
    export DISPLAY=:99
    eval "$(dbus-launch --sh-syntax 2>/dev/null)" || true
    exec "$@"' bash "$@"
