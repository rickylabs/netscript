R=/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/wave7-billing-run--0.0.7
W=/home/agent/projects/netscript/wave7-billing
cd /home/agent/projects/netscript/worktrees/007-aspire
last=0
for i in $(seq 1 240); do
  alive=$(pgrep -f "opencode.*glm-5.3-flash" | wc -l)
  sz=$(stat -c %s $R/logs/turn-1.log 2>/dev/null || echo 0)
  files=$(find $W -maxdepth 3 -type f -not -path '*/.git/*' 2>/dev/null | wc -l)
  repo=$(cd $W 2>/dev/null && git log --oneline 2>/dev/null | wc -l)
  echo "$(date -u +%H:%M:%SZ) alive=$alive log=${sz}B files=$files commits=$repo"
  if [ "$alive" = 0 ] && [ $i -gt 2 ]; then echo "PROCESS GONE"; exit 0; fi
  if [ "$sz" = "$last" ] && [ $i -gt 6 ]; then echo "(log flat since last check)"; fi
  last=$sz
  sleep 120
done
