# Context pack — S8 #1720

- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s8`
- Branch: `feat/aspire-13-5-s8-typed-resource-commands`
- Stack base: S6 `564d465cc6b6af5518f959f3ad53beb422590da1`
- Draft PR base: `feat/aspire-13-5-s6-health-checks`
- Issues: closes #1720 and #863; part of #1712 (never close the epic)
- Locked decision: D-6, `excludeFromMcp()` controls MCP exposure only; never emit `withHidden()`
- Phase A was static; the supervisor-authorized Phase-B lease permitted one `scaffold.runtime` pass
- D-19 command prefix: `/home/agent/.local/bin/mise exec --`; restore only
- D-39 host facts (re-proven 2026-08-30T09:27Z): inotify instances limit 1024; Docker
  client/server 28.5.2 at `tcp://netscript-dind:2375`; PID 1 is `tini` with zero zombies; lifecycle
  and watch tests are trustworthy. Any restore/watch/test red is a real finding.
- The only runtime-phase limitation is the remote-DinD topology recorded in D-42/D-43 (bind mounts
  and loopback endpoints); Phase A remains static independently of that limitation.
- Push command: `git push origin HEAD:refs/heads/feat/aspire-13-5-s8-typed-resource-commands`
- Required evaluator: separate Fable 5 IMPL-EVAL; implementation agent cannot certify the result
- Phase-B one-pass verdict: exit 1, passed=26 failed=1 skipped=0 at
  `generated.quality-negative`; `runtime.typed-db-phase-b` was not reached. Cleanup and leak-check
  proved `aspire ps = []`, empty Docker containers/volumes, and zero run-owned survivors.
- Coordinator proof run 33330455111 / job 99308020561 later reached `database.seed` and exposed an
  S8 observability defect: ANSI task banners masked actionable stderr. The static RED/GREEN repair
  strips terminal controls before banner matching and persists bounded actionable stderr. No seed
  diagnostic or runtime was run here; the supervisor owns the one later lease-backed diagnostic.

Primary code surfaces are the db-cli-mode and register-tools generators/templates, Aspire runtime
asset templates, database Aspire command executor/operation runner and their tests, and the CLI
scaffold E2E runtime gate modules. Package/framework boundaries outside `packages/cli` are excluded.

## D-122 reconstruction state

- Rebased the exact 10-commit S8 range onto `origin/main` at
  `65cd8a07787504b5ed94408510d4ab85260bc21a`, then cleanly rebased the complete reconstructed
  13-commit branch when `origin/main` advanced to
  `8a925764276b25ef7cef484db273604f44557cef`.
- Coordinator resolution retained main's D-101 listener architecture and test, adding only S8's
  byte-identical `createTypedDbPhaseBGate()` plus `resolve`.
- Generated barrel delta is committed as `19e139cbb`; formatter-only S8 test normalization is
  committed as `da963027b` after the final-main rebase.
- Validated product head before the evidence-only reconstruction ledger:
  `da963027b431af536cf6c5f5d08e3623f5797ca1`.
- Combined CLI/E2E structured check, exact changed-file lint/fmt, 98 focused tests, quality gate,
  asset-barrel check, and Aspire parity are green. The earlier unrelated missing relative import
  was corrected by the later `origin/main`; S8 made no repair for it.
- No runtime or evaluator rerun occurred. The evidence-only final head was pushed with a fresh
  exact-SHA force-with-lease and read back from the remote branch.
