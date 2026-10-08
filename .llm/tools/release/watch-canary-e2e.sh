#!/usr/bin/env bash
# Observe only the dispatched child. A watcher process exit is never its verdict.
set -uo pipefail
run_id="${1:-}"
if [[ ! "$run_id" =~ ^[0-9]+$ || -z "${GITHUB_OUTPUT:-}" ]]; then
  echo 'Canary observation requires a numeric child ID and GITHUB_OUTPUT.' >&2
  exit 1
fi
finish() {
  printf 'state=%s\nconclusion=%s\n' "$1" "$2" >> "$GITHUB_OUTPUT" || exit 1
  exit "$3"
}
delay=1
for ((attempt=1; attempt<=5; attempt++)); do
  gh run watch "$run_id" --exit-status || true
  if observation="$(gh run view "$run_id" --json status,conclusion --jq '[.status, .conclusion // ""] | @tsv')"; then
    status="${observation%%$'\t'*}"
    conclusion="${observation#*$'\t'}"
    if [[ "$observation" == *$'\t'* && "$conclusion" != *$'\t'* && "$observation" != *$'\n'* && "$status" == completed ]]; then
      case "$conclusion" in
        success) finish success success 0 ;;
        failure|cancelled|timed_out|action_required|startup_failure|stale|neutral|skipped)
          finish failure "$conclusion" 1 ;;
      esac
    fi
  fi
  if ((attempt < 5)); then
    sleep "$delay" || finish unknown '' 1
    ((delay=delay*2))
    ((delay>8)) && delay=8
  fi
done
echo 'Canary child terminal conclusion is unknown after bounded observation retries.' >&2
finish unknown '' 1
