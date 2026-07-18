#!/usr/bin/env bash
# Launch the beta.10 CLI + stabilization orchestrator:
# Fable 5 low · Remote Control ON · bypassPermissions · autonomous.
# Started under tmux (daemon-attached native-WSL pattern). Runs in the worktree.
cd /home/codex/repos/netscript-beta10-cli || exit 1
exec claude \
  --remote-control \
  --remote-control-session-name-prefix beta10-cli \
  --permission-mode bypassPermissions \
  --model claude-fable-5 \
  --effort low \
  -n beta10-cli-orchestrator \
  "use harness. Read .llm/runs/beta10-cli--orchestrator/kickoff.md and follow it verbatim as your operating brief for this entire session. It defines your identity (Fable 5 low orchestrator), scope (beta.10 CLI coverage + stabilization; dashboard is OUT of scope), and how to operate (drive all sub-agents through the .llm/tools/agentic suite; hold merge/publish for owner sign-off). Begin now with its First actions."
