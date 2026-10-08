#!/usr/bin/env bash
# Consume only observed state/conclusion; never turn an API error into a child failure.
set -uo pipefail
if [[ "${E2E_STATE:-}" == success && "${E2E_CONCLUSION:-}" == success ]]; then
  printf '%s\n' 'Canary publish complete; pinned production E2E succeeded; a later step failed'
  exit 0
fi
if [[ "${E2E_STATE:-}" == failure ]]; then
  case "${E2E_CONCLUSION:-}" in
    failure|cancelled|timed_out|action_required|startup_failure|stale|neutral|skipped)
      printf 'Canary publish complete; pinned production E2E concluded %s\n' "$E2E_CONCLUSION"
      exit 0 ;;
  esac
fi
printf '%s\n' 'Canary publish complete; pinned production E2E observation unknown'
