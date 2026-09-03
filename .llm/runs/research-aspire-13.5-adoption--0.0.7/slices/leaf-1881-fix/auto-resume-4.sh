#!/bin/bash
S=/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix
W=/home/agent/projects/netscript/worktrees/007-aspire-leaf-1881-fix
T=01a064ff-4d6c-79b2-85c5-50a7c13e28e0
cd /home/agent/projects/netscript/worktrees/007-aspire
resumed=0
for i in $(seq 1 80); do
  st=$(deno task agentic:codex-status --user node --pretty 2>/dev/null | grep $T | awk '{print $1}')
  head=$(git -C $W rev-parse --short HEAD)
  echo "$(date -u +%H:%MZ) state=$st head=$head resumed=$resumed"
  if [ "$st" != "working" ]; then
    if [ $resumed = 0 ]; then
      resumed=1
      setsid nohup deno task agentic:codex-resume --user node --thread-id $T --worktree $W --message-file $S/resume-4.md > $S/resume-4.log 2>&1 &
      sleep 60; continue
    fi
    echo "second idle -> exit"; exit 0
  fi
  sleep 30
done
