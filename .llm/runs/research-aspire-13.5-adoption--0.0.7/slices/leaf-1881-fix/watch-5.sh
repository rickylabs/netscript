W=/home/agent/projects/netscript/worktrees/007-aspire-leaf-1881-fix
cd /home/agent/projects/netscript/worktrees/007-aspire
for i in $(seq 1 100); do
  st=$(deno task agentic:codex-status --user node --pretty 2>/dev/null | grep 01a064ff | awk '{print $1}')
  echo "$(date -u +%H:%MZ) state=$st head=$(git -C $W rev-parse --short HEAD) dirty=$(git -C $W status --short | wc -l)"
  [ "$st" != "working" ] && [ $i -gt 1 ] && exit 0
  sleep 45
done
