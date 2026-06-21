# Commits — docs-v3-ia-plan--supervisor

Append-only. One line per commit on branch `docs/v3-ia-plan`.

- 5f273355: (base) feat(auth): AS8 auth audit observability — telemetry, redaction, durable trace propagation (#103) — origin/main baseline
- fc3ee159: docs: v3 IA plan — structural overhaul to production-grade public docs (planning only)
- (WSL-only, unpushed 1cbe1875): codex panel IA findings — committed in the WSL worktree
  `/home/codex/repos/netscript-docs-v3-ia-plan`, never pushed to this branch; the findings file
  `codex-panel-findings.md` is reproduced into this branch by the hardening commit below.
- c5a6ff3d: chore(openhands): record run trace 27907934927-1 (the crashed first PLAN-EVAL; pushed onto the
  branch by the OpenHands workflow, not by the supervisor)
- 87bc455d: docs: harden v3 IA plan against unoriented adversarial panel (#105) — harness artifacts
  (worklog/drift/commits), full surface inventory (B2), tutorial proof plans (B3), hub content contracts (M6),
  open-decision sweep + 20 ordered slices + executable gate table (B1/M4/M5/M7/M8/M9). (Rebased forward onto
  c5a6ff3d during push reconcile; supersedes the pre-rebase 55be89da.)
- c6a0c453: chore(harness): reconcile commits.md with 55be89da SHA
- f3ce9538: docs: reproduce codex-panel-findings.md into branch + fix dangling SHA refs (the panel's WSL-only
  1cbe1875 was never pushed, so the findings file was absent from the branch)
- c2c38f89: chore(harness): record PLAN-EVAL re-dispatch (comment 4762426764)
- 277015d2: docs: apply PLAN-EVAL PASS bookkeeping follow-ups to v3 IA plan (#105) — PLAN-EVAL (minimax-M3, run
  27908862931) returned **PASS**; corrected surface headline to verified 31 units / 210 subpaths, reconciled 7
  per-unit counts, reclassified createJobTools, S12/§5 gate asserts 210 live, Track B SCOPE verdict mandatory
