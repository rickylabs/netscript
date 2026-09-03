#!/bin/bash
S=/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix
cd /home/agent/projects/netscript/worktrees/007-aspire
for i in $(seq 1 100); do
  n=$(wc -l < $S/impl-eval-stream.jsonl 2>/dev/null || echo 0)
  alive=$(ps -eo args | grep -c "[o]penrouter-run.ts")
  v=$([ -f $S/impl-eval-verdict.md ] && head -1 $S/impl-eval-verdict.md)
  ci=$(gh pr checks 1975 2>/dev/null | awk '{print $2}' | sort | uniq -c | tr '\n' ' ')
  echo "$(date -u +%H:%MZ) stream=$n alive=$alive verdict=[$v] ci=[$ci]"
  [ -n "$v" ] && exit 0
  [ "$alive" = 0 ] && [ $i -gt 2 ] && exit 3
  sleep 60
done
