R=/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/wave7-billing-run--0.0.7
W=/home/agent/projects/netscript/wave7-billing
cd /home/agent/projects/netscript/worktrees/007-aspire
alive() { ps -eo args | grep -cE "^/[^ ]*deno run .*opencode-run\.ts"; }
n=8
while [ $n -le 40 ]; do
  if [ "$(alive)" = 0 ]; then
    echo "$(date -u +%H:%M:%SZ) idle -> turn-$n"
    setsid nohup deno task agentic:opencode --message "$(cat $R/continue.md)" \
      --model openrouter/z-ai/glm-5.3-flash --variant max --cwd $W \
      --session ses_f953b4ae2ffe77TVWQQYTutRlv \
      --require-mcp netscript --require-mcp aspire \
      --receipt .netscript/agent/opencode-receipt.jsonl \
      -f $R/steer-6.md -f $R/CONSTRUCTION-REFERENCE.md \
      > $R/logs/turn-$n.log 2>&1 < /dev/null &
    n=$((n+1)); sleep 150
  fi
  sleep 45
done
