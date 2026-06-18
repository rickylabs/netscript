# Research — Claude-Native Agentic System Hardening

## Re-baseline

- Base branch: `origin/feat/package-quality` at `d1a5f212`.
- Upstream `origin/main` is `531f2b46`, the PR #49 S2 quality-lane merge.
- The existing S2 coordinator checkout had unrelated dirty supervisor artifacts, so this run uses a
  clean sibling worktree on `plan/agentic-system-claude-native-hardening`.

## Findings

- `AGENTS.md` is the current cross-agent bootstrap. No tracked `CLAUDE.md` existed on the S2 branch.
- `.agents/skills/` is the only tracked skill source. No tracked `.claude/skills/` mirror existed.
- The tracked skill README still listed `aspire` as missing even though `.agents/skills/aspire`
  exists.
- `codex-wsl-remote` had correct mobile-visible `send-message-v2` guidance, but its app-server
  config text did not include the newer medium reasoning defaults.
- Claude Code v2.1 CLI supports the native surfaces this run depends on: `--bg`, effort flags,
  `remote-control`, `agents --json`, project `.claude/settings.json`, hooks, and project skills.
- Official Claude Code docs define `CLAUDE.md` memory, `.claude/skills`, project settings, hooks,
  remote control, and subagents as first-class surfaces.
- Official Claude Code model docs describe `opusplan` as a hybrid planning/execution mode and
  Ultracode as a session-only setting that applies xhigh reasoning plus dynamic workflows for
  substantive tasks. That is useful for supervisor planning, but it is explicitly high-cost and
  should not replace the repo's WSL Codex implementation lane.
- The PLAN-EVAL review for PR #50 returned PASS and flagged two required follow-ups for the next
  slice: add `--no-lock` to hook commands and make Claude smoke evidence environment-aware.

## Open Questions

- Live Claude remote-control parity should remain gated behind an explicit smoke run. This branch
  adds the tooling but does not claim replacement of WSL Codex implementation sessions.
- OpenHands PLAN-EVAL/IMPL-EVAL still requires the GitHub Actions trigger path after the draft PR is
  opened.
- Claude workflow adoption still needs a live supervisor smoke before it can be promoted from policy
  to an automated harness command.
