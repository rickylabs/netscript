#!/usr/bin/env bash
# Rebuild the off-host proof descendant with S10's Phase-B fix and redispatch e2e-cli.yml.
# Usage: rebuild-proof-with-s10-fix.sh <new-s10-head-sha>
set -euo pipefail
NEW=${1:?new S10 head sha}
PW=/home/agent/projects/netscript/worktrees/007-aspire-proof-try
S1=ee379457e87bf0f02ab6a9851c4d2b7fe1d06f35
cd "$PW"
git fetch -q origin test/aspire-13-5-s10-e2e-gate-upgrades
git merge-base --is-ancestor a46ea16d0 "$NEW" || { echo "NEW is not a descendant of a46ea16d0"; exit 2; }
test -z "$(git status --short)" || { echo "proof worktree dirty"; exit 2; }
git fetch -q origin ci/aspire-13-5-runtime-proof; git checkout -q FETCH_HEAD
# apply only S10 commits (a46ea16d0..NEW) whose patch is not already on the proof head
TODO=$(git cherry HEAD "$NEW" a46ea16d0 | awk '/^\+/{print $2}'); test -n "$TODO" || { echo "nothing new to apply"; exit 4; }
git cherry-pick $TODO
# workflow tree must remain byte-identical to S1
test -z "$(git diff "$S1" HEAD -- .github/workflows)" || { echo "workflow tree drifted"; exit 3; }
HEAD_SHA=$(git rev-parse HEAD)
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates/aspire-structured-evidence_test.ts
git tag -f aspire-13-5-runtime-proof "$HEAD_SHA" >/dev/null
git push origin "$HEAD_SHA":refs/heads/ci/aspire-13-5-runtime-proof
gh workflow run e2e-cli.yml --repo rickylabs/netscript --ref ci/aspire-13-5-runtime-proof
sleep 8
gh run list --repo rickylabs/netscript --workflow e2e-cli.yml -L 3 --json databaseId,headSha,createdAt,status,event \
  --jq ".[] | select(.headSha==\"$HEAD_SHA\") | \"RUN \(.databaseId) \(.event) \(.status) sha=\(.headSha[0:9]) \(.createdAt)\""
echo "PROOF_HEAD=$HEAD_SHA"
