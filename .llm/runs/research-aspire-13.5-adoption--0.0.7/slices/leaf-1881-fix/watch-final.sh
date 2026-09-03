#!/bin/bash
S=/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix
cd /home/agent/projects/netscript/worktrees/007-aspire
for i in $(seq 1 60); do
  v=$([ -f $S/impl-eval-verdict.md ] && head -1 $S/impl-eval-verdict.md)
  alive=$(ps -eo args | grep -c "[o]penrouter-run.ts")
  q=$(gh pr checks 1975 2>/dev/null | grep -E "^(quality|check-test|code-quality|close-gate)\s" | awk '{print $1"="$2}' | tr '\n' ' ')
  echo "$(date -u +%H:%MZ) alive=$alive verdict=[$v] $q"
  pend=$(echo "$q" | grep -c pending)
  fail=$(echo "$q" | grep -c "=fail")
  if [ -n "$v" ] && { [ "$pend" = 0 ] || [ "$fail" != 0 ]; }; then exit 0; fi
  [ "$alive" = 0 ] && [ -z "$v" ] && exit 3
  sleep 60
done
