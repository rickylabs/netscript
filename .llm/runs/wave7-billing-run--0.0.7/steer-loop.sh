R=/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/wave7-billing-run--0.0.7
W=/home/agent/projects/netscript/wave7-billing
cd /home/agent/projects/netscript/worktrees/007-aspire
alive() { ps -eo args | grep -cE "^/[^ ]*deno run .*opencode-run\.ts"; }
for i in $(seq 1 900); do
  if [ "$(alive)" = 0 ]; then
    echo "$(date -u +%H:%M:%SZ) idle -> steer-4"
    setsid nohup deno task agentic:opencode --message "$(cat $R/steer-4.md)" \
      --model openrouter/z-ai/glm-5.3-flash --variant max --cwd $W \
      --session ses_f953b4ae2ffe77TVWQQYTutRlv \
      --require-mcp netscript --require-mcp aspire \
      --receipt .netscript/agent/opencode-receipt.jsonl \
      -f $R/CONSTRUCTION-REFERENCE.md -f $R/steer-3.md \
      > $R/logs/turn-4.log 2>&1 < /dev/null &
    echo dispatched; exit 0
  fi
  sleep 45
done
