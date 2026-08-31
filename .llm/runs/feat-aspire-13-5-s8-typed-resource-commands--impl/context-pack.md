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

## D-210 convergence state

- Owner authorized convergence, not repair: exact replay target is
  `origin/main` `6c195acaf3f7e650c4235fc3fbc51232e210e7a4`.
- Old head `bc838a0b3b9ba50f4ed6cf68aa29c9e4892b07f3` contained exactly 13 commits over
  `8a925764276b25ef7cef484db273604f44557cef`.
- Rebase completed with no conflicts. Rebased product/evidence head before the D-210 ledger is
  `0cd04b0438c682915d4d9d0a45db2dd7d7f40c52`.
- All 13 range-diff mappings are `=`. All 20 non-generated changed `packages/` blobs are identical
  old-to-new; zero product blobs changed. Asset regeneration produced no delta.
- Combined CLI/E2E check passed 905 files; exact changed-file lint/fmt passed 19/19 after the
  fail-closed workspace-exclusion attempts; focused tests passed 98/98; Aspire parity reported
  checked 812 / fail 0; `quality:gate` exited 0.
- PLAN-EVAL is N/A for the owner-specified mechanical replay. No evaluator was self-dispatched.
  The supervisor decides whether the byte-identity evidence carries the existing IMPL-EVAL.
- No runtime, Aspire, Docker, AppHost, E2E runtime suite, product repair, S9/S10 operation, or safety
  tag movement occurred.

## D-216 seed repair state

- Resume head is the converged branch head `d1c6d8b54fdb02f4d913f0c269aea2be4a5dfce0`; exact main
  parent for the S8 comparison is `6c195acaf3f7e650c4235fc3fbc51232e210e7a4`.
- Workflow artifacts `9766882209` (run `33415203923`) and `9764891299` (run `33404324013`) were
  digest-verified. Each ZIP contains only the scaffold runtime JSON report. Both that report and
  the exact job log omit Prisma `code` and `meta`; D-07 persisted only the first three actionable
  stderr lines. Do not invent a Prisma classification from the truncated text.
- Confirmed S8-owned cause: the typed command replaced the old executable's live Aspire resource
  injection with a static `builder.Configuration` connection-string lookup. Aspire 13.5.3's
  primary source and TypeScript PostgreSQL fixture identify
  `connectionStringExpression().getValueAsync()` as the allocated-resource path.
- Repair contract: generated infrastructure owns a late-bound resolver per non-SQLite database;
  typed migrate/seed/reset resolve it at execution and pass the exact result into the child env.
  No public package export, package metadata, dependency, cast, `any`, suppression, or architecture
  debt changed.
- RED regression failed before the fix; focused GREEN is 34/34. Scoped check/lint/fmt,
  `quality:gate`, and repo-wide check are green. No Aspire, Docker, AppHost, or runtime E2E command
  ran. The supervisor, not this implementation session, owns any delta IMPL-EVAL.

## D-224 actionable-stderr state

- Resume baseline was the clean local/remote head `f29a0b265b435e4c4fd53079b4e8c27c4d34bc3f`.
- The generated runtime edge now retains 32 actionable lines as an 8-line head plus 24-line tail.
  Total persisted UTF-8 detail is capped at 16 KiB; the derived 511-byte line allowance preserves
  both ends of oversized lines and favors their tail.
- The first actionable line remains `message`; VT stripping still precedes `Task ` filtering; the
  `actionableStderr` result contract is unchanged and additive.
- RED failed against the old bound; final focused typed-command tests are 55/55. Scoped
  check/lint/fmt, `quality:gate`, and repo-wide check are green (`failedBatches: 0`).
- Only the run-tool source template, its focused test, its generated embedded-barrel entry, and
  harness evidence changed. No runtime, Aspire, Docker, AppHost, E2E, seed-path, PR lifecycle/base,
  label, S9, or S10 action occurred.
- The supervisor, not this implementation session, owns the required bounded delta IMPL-EVAL after
  push.
