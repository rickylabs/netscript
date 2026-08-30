#!/usr/bin/env bash
# Off-host Phase-B runtime proof (D-68). Requires a `workflow`-scoped GitHub credential.
# Usage: bash .llm/runs/research-aspire-13.5-adoption--0.0.7/tools/dispatch-runtime-proof.sh
set -euo pipefail
REPO=rickylabs/netscript; REF=ci/aspire-13-5-runtime-proof; TAG=aspire-13-5-runtime-proof
cd "$(git rev-parse --show-toplevel)"
SHA=$(git rev-parse "$TAG")
echo "pushing $TAG ($SHA) -> $REF"
git push origin "$SHA:refs/heads/$REF"
gh workflow run e2e-cli.yml --repo "$REPO" --ref "$REF"
sleep 20
RUN=$(gh run list --repo "$REPO" --workflow e2e-cli.yml --branch "$REF" --limit 1 --json databaseId --jq '.[0].databaseId')
echo "run id: $RUN  (evidence-only receipt for S9/S10 Phase B; not a merge-head verdict)"
gh run watch "$RUN" --repo "$REPO" --exit-status || true
gh run view "$RUN" --repo "$REPO" --json jobs --jq '.jobs[] | "\(.name): \(.conclusion)"'
echo "download receipts: gh run download $RUN --repo $REPO -n e2e-cli-scaffold-runtime-report -D .llm/tmp/runtime-proof-$RUN"
