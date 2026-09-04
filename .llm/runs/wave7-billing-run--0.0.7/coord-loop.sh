R=/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/wave7-billing-run--0.0.7
W=/home/agent/projects/netscript/wave7-billing
D=/home/agent/projects/netscript/wave7-design
cd /home/agent/projects/netscript/worktrees/007-aspire
b_alive() { ps -eo args | grep -cE "^/[^ ]*deno run .*opencode-run\.ts.*wave7-billing"; }
d_alive() { ps -eo args | grep -c "[t]encent/hy4-preview"; }
bn=10; dn=4
for i in $(seq 1 400); do
  B=$(b_alive); D_=$(d_alive)
  echo "$(date -u +%H:%M:%SZ) builder=$B design=$D_ bc=$(git -C $W log --oneline|wc -l) dc=$(git -C $D log --oneline|wc -l)"
  if [ "$B" = 0 ]; then
    setsid nohup deno task agentic:opencode --message "$(cat $R/continue.md)" --model openrouter/z-ai/glm-5.3-flash --variant max --cwd $W --session ses_f953b4ae2ffe77TVWQQYTutRlv --require-mcp netscript --require-mcp aspire --receipt .netscript/agent/opencode-receipt.jsonl -f $R/steer-9.md -f $R/CONSTRUCTION-REFERENCE.md > $R/logs/turn-$bn.log 2>&1 < /dev/null &
    echo "  -> builder turn-$bn"; bn=$((bn+1)); sleep 90
  fi
  if [ "$D_" = 0 ]; then
    (cd $D && setsid nohup deno task --config /home/agent/projects/netscript/worktrees/007-aspire/deno.json agentic:opencode --message "Continue design steer #2. Build the five components in order: DeltaChip, SemicircularGauge, SegmentedRangeControl, ComparisonAreaChart, FooterColumns. Follow the visual specs in design-critique-1.md literally. Fix the brutalist button shadows, the money formatting (\$100.00 not \$100, space before currency), and the dark-mode exception-badge token. Register everything in the gallery. Commit after each component. Report DONE vs REMAINING." --model openrouter/tencent/hy4-preview --variant max --cwd $D --require-mcp netscript --require-mcp aspire --receipt .netscript/agent/design-receipt.jsonl -f $R/design-critique-1.md -f $R/design-steer-2.md > $R/logs/design-$dn.log 2>&1 < /dev/null &)
    echo "  -> design turn-$dn"; dn=$((dn+1)); sleep 90
  fi
  sleep 60
done
