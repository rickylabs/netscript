#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

readonly repo='/home/codex/repos/netscript-db-rfc'
readonly branch='docs/database-architecture-rfc'
readonly run_dir="$repo/.llm/runs/docs-database-architecture-rfc--prisma-8-rfc"
readonly prompt="$run_dir/briefs/fable-final-evaluator.md"
readonly output_dir="$repo/.llm/tmp/final-fable-evaluator"
readonly deno_bin='/home/codex/.deno/bin/deno'

export HOME='/home/codex'
export PATH='/home/codex/.local/bin:/home/codex/.deno/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

mkdir -p "$output_dir"
readonly launched_at="$(date --iso-8601=seconds)"
readonly log_path="$output_dir/$launched_at.stream-json.log"
readonly status_path="$output_dir/latest-status.json"

exec > >(tee -a "$log_path") 2>&1

write_status() {
  local exit_code="$?"
  local head='unavailable'
  local remote_head='unavailable'
  head="$(git -C "$repo" rev-parse HEAD 2>/dev/null || printf unavailable)"
  remote_head="$(git -C "$repo" ls-remote origin "refs/heads/$branch" 2>/dev/null | awk '{print $1}' || printf unavailable)"
  local completed_at
  completed_at="$(date --iso-8601=seconds)"
  local temporary_status="$status_path.tmp"
  printf '{"launchedAt":"%s","completedAt":"%s","exitCode":%s,"head":"%s","remoteHead":"%s","log":"%s"}\n' \
    "$launched_at" "$completed_at" "$exit_code" "$head" "$remote_head" "$log_path" > "$temporary_status"
  mv "$temporary_status" "$status_path"
  printf 'final-fable launcher exit=%s head=%s remote=%s log=%s\n' \
    "$exit_code" "$head" "$remote_head" "$log_path"
}
trap write_status EXIT

cd "$repo"

if [[ "$(git branch --show-current)" != "$branch" ]]; then
  printf 'refusing launch: expected branch %s, found %s\n' "$branch" "$(git branch --show-current)" >&2
  exit 20
fi

if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  printf 'refusing launch: worktree is not clean\n' >&2
  git status --short >&2
  exit 21
fi

git fetch --quiet origin "refs/heads/$branch"
local_head="$(git rev-parse HEAD)"
remote_head="$(git rev-parse FETCH_HEAD)"

if [[ "$local_head" != "$remote_head" ]]; then
  if git merge-base --is-ancestor "$local_head" "$remote_head"; then
    git merge --ff-only "$remote_head"
  else
    printf 'refusing launch: local and remote branch are diverged or local is unpushed\n' >&2
    exit 22
  fi
fi

printf 'launching final evaluator at %s from commit %s\n' "$launched_at" "$(git rev-parse HEAD)"

"$deno_bin" run -A .llm/tools/agentic/claude/claude-print.ts \
  --model claude-fable-5 \
  --effort high \
  --prompt "$prompt"

if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  printf 'evaluator returned with an uncommitted worktree\n' >&2
  git status --short >&2
  exit 30
fi

readonly final_head="$(git rev-parse HEAD)"
readonly pushed_head="$(git ls-remote origin "refs/heads/$branch" | awk '{print $1}')"
if [[ "$final_head" != "$pushed_head" ]]; then
  printf 'evaluator did not push final HEAD: local=%s remote=%s\n' "$final_head" "$pushed_head" >&2
  exit 31
fi

if [[ ! -s "$run_dir/evaluate.md" ]]; then
  printf 'evaluator did not create a non-empty evaluate.md\n' >&2
  exit 32
fi

printf 'final Fable gate completed and pushed at %s\n' "$final_head"
