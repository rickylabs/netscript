#!/bin/bash
W=/home/agent/projects/netscript/worktrees/007-aspire-leaf-1881-fix
T=01a064ff-4d6c-79b2-85c5-50a7c13e28e0
cd /home/agent/projects/netscript/worktrees/007-aspire
resumed=0
for i in $(seq 1 90); do
  st=$(deno task agentic:codex-status --user node --pretty 2>/dev/null | grep -B0 -A0 "$T" | awk '{print $1}' | head -1)
  dirty=$(git -C $W status --short | wc -l); head=$(git -C $W log -1 --format=%h)
  echo "$(date -u +%H:%MZ) state=$st dirty=$dirty head=$head resumed=$resumed"
  if [[ "$st" == idle* || "$st" == completed* || "$st" == stopped* ]]; then
    if [[ "$resumed" == "0" ]]; then if [[ "$dirty" == "0" && "$head" == "45e57377f" ]]; then MSG=/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix/resume-1.md; else MSG=/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix/resume-2.md; fi
      echo "idle -> resuming same thread with $MSG"
      deno task agentic:codex-resume --user node --thread-id $T --worktree $W --message-file $MSG > /home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix/resume-1.log 2>&1
      echo "resume exit=$?"; resumed=1; sleep 60; continue
    fi
    echo "thread idle with work present -> exiting for supervisor review"; exit 0
  fi
  sleep 45
done
exit 2
