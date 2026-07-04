# Drift — roadmap re-forecast

Append-only. Record the moment reality diverges from plan/docs/doctrine.

- 2026-07-04 (minor, tooling): Bash-tool heredoc writes to the shared scratchpad fail silently in
  this session; a stale `phase-research.md` from the V3 run got posted as PR #392's RESEARCH
  comment. Both comments patched via `gh api -X PATCH`. Mitigation: all GitHub body files are now
  written via PowerShell here-strings with unique `rf-*` names and verified (`Get-Item`) before
  posting.
- 2026-07-04 (significant, plan-level — owner-directed, post-PLAN-EVAL): owner ratifications R1–R4
  landed AFTER the PLAN-EVAL APPROVED verdict and amend the evaluated forecast: R1 bench #302
  demoted from hard stable gate to post-stable fast-follow (stable theme/ETA reworked; #302
  milestone stable→Backlog); R4 stable deploy gate pinned to bare-metal systemd + `deno compile`
  (was an open Deno-Deploy-vs-bare-metal question; #394 reprioritized bare-metal-first). R2/R3
  confirm the forecast as submitted (distinct beta.5; beta.3 = eis-chat dogfood bar). Q5
  (Prisma-Next #313) remains unanswered → recorded as assumed-deferred, not built into the critical
  path. All folded into `roadmap-0.0.1.md` §§1–6; PLAN-EVAL was not re-run (amendments are
  owner-directed strategic inputs, the class the eval explicitly deferred to the owner).
- 2026-07-04 (minor, environment): harness V3 (epic #389, PR #390) merged to main (`eeaff336`)
  after the forecast was written; roadmap updated to cite the merged doctrine (new §6) and to mark
  #389's remaining beta.5 scope as epic close-out + adoption rather than implementation.
