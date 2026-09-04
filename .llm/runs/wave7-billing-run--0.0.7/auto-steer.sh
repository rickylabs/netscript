R=/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/wave7-billing-run--0.0.7
W=/home/agent/projects/netscript/wave7-billing
cd $W
for i in $(seq 1 900); do
  n=$(pgrep -f "opencode.*glm-5.3-flash" | wc -l)
  if [ "$n" = 0 ]; then
    echo "$(date -u +%H:%M:%SZ) turn ended -> product-owner steer"
    setsid nohup ~/.opencode/bin/opencode run "$(cat $R/steer-2.md)" -c \
      -m openrouter/z-ai/glm-5.3-flash --variant max \
      -f $R/PRODUCT-DEFINITION.md -f $R/ENVIRONMENT.md -f $R/beat-this.md \
      > $R/logs/turn-2.log 2>&1 &
    echo "dispatched"; exit 0
  fi
  sleep 60
done
