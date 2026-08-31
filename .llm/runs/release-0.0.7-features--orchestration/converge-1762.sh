#!/usr/bin/env bash
# Prepared, NOT executed. Runs only after Docs #1798 merges, so #1762 takes exactly
# one final carrier integration instead of two. Does not mutate the head until then.
set -euo pipefail
LEAF=/home/agent/projects/netscript/worktrees/007-leaf-1387
R=.llm/runs/feat-service-principal-procedure-policy--1387/receipts
cd "$LEAF"

PRE=$(git rev-parse HEAD)
git fetch -q origin main
MAIN=$(git rev-parse origin/main)
echo "pre=$PRE main=$MAIN"

MB=$(git merge-base HEAD origin/main)
echo "--- intersection (expect generated carriers only) ---"
comm -12 <(git diff --name-only "$MB" origin/main | sort) <(git diff --name-only "$MB" HEAD | sort)

git merge --no-ff --no-commit origin/main || true
for f in $(git diff --name-only --diff-filter=U); do
  git checkout --theirs "$f"; git add "$f"
done
test -z "$(git diff --name-only --diff-filter=U)" || { echo "UNRESOLVED CONFLICTS"; exit 1; }

# Regenerate the full cascade in dependency order; never hand-merge generated output.
for t in gen:agent-docs-prose gen:assets-barrel gen:mcp-export-corpus gen:publish-assets; do
  deno task "$t" >/dev/null
done
git add -A
git commit -q -m "Merge origin/main (final pre-merge integration); regenerate derivative carriers"
POST=$(git rev-parse HEAD)

echo "--- PROOF: no product source changed by the integration ---"
git diff --stat "$PRE".."$POST" -- packages plugins ':!*generated*' ':!*.gz' templates | tail -3
echo "(any docs/site file listed must be proved identical to origin/main below)"
for f in $(git diff --name-only "$PRE".."$POST" -- docs); do
  if diff <(git show "HEAD:$f") <(git show "origin/main:$f") >/dev/null; then
    echo "  OK  $f identical to main (main's own content arriving)"
  else
    echo "  !!  $f DIFFERS from main -- investigate before proceeding"; exit 1
  fi
done

# Recut every contracted gate at the single final head.
G(){ deno run --allow-all .llm/tools/gates/run-gate.ts --gate "$1" --id "$2" --output "$R/$3.json" ${4:+-- $4} \
     | tail -1 | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d["gateId"].ljust(20),d["outcome"],d["gitHead"][:9],"bytes="+str(d["stdout"]["bytes"]))'; }
INC='^packages/(contracts|service|plugin|mcp|sdk)/'
G check   1387-final-check   check   "--include $INC"
G lint    1387-final-lint    lint    "--include $INC"
G fmt-check 1387-final-fmt   fmt-check "--include $INC"
G test    1387-final-test    test    "packages/service/tests packages/plugin/tests packages/mcp/tests packages/contracts/tests packages/sdk/tests"
G exports-drift 1387-final-exports-drift exports-drift
G mcp-export-corpus 1387-final-corpus mcp-export-corpus
G quality-gate 1387-final-quality quality-gate
G publish-dry-run 1387-final-publish publish-dry-run
G assets-barrel 1387-final-barrel assets-barrel
G agent-docs-prose 1387-final-prose agent-docs-prose
G docs-tagline 1387-final-tagline docs-tagline
G publish-assets 1387-final-pubassets publish-assets
G doc-lint 1387-final-doclint service-doc-lint "--root packages/service"   # --root is REQUIRED; omitting it yields a 454ms usage-error FAIL

sha256sum deno.lock
echo "NEXT: recompute evidence-set at the single head, commit, push, then rerun CI + live-label close-gate."
