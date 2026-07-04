# Drift — roadmap re-forecast

Append-only. Record the moment reality diverges from plan/docs/doctrine.

- 2026-07-04 (minor, tooling): Bash-tool heredoc writes to the shared scratchpad fail silently in
  this session; a stale `phase-research.md` from the V3 run got posted as PR #392's RESEARCH
  comment. Both comments patched via `gh api -X PATCH`. Mitigation: all GitHub body files are now
  written via PowerShell here-strings with unique `rf-*` names and verified (`Get-Item`) before
  posting.
