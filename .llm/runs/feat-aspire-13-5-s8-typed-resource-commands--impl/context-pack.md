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
  injection with a static `builder.Configuration` connection-string lookup. D-216 correctly
  selected `connectionStringExpression()` as the allocated-resource path but copied the C#
  `GetValueAsync` spelling; D-227 established that the TypeScript member is `getValue()`.
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

## D-227 generated-helper compile state

- Resume baseline is the clean branch head `bbf866d59bf74d55614583898bb632d2ab223b1e`.
- Full local probe capture established the exact line-144 throw: `generated check did not recover
  after quality probes`; the emitted diagnostic is TS2339 because TypeScript
  `ReferenceExpression` has `getValue()`, not `getValueAsync()`.
- Against the complete restored SDK, emitted `run-tool.mts` compiles and emitted
  `register-infrastructure.mts` fails only at the invalid member call. The leading hypothesis is
  confirmed.
- The generator now awaits `connectionStringExpression().getValue()` at command execution and
  rejects an unresolved null. Late-bound allocation semantics remain intact; the D-224 run-tool
  template is unchanged.
- New static coverage compiles both emitted helpers against the relevant restored SDK contract.
  RED was 0/1 with TS2339 before the repair; focused GREEN is 254/254. The unmodified generated
  negative-quality probe passes on a fixed, official-plugin scaffold with both cleanup exit codes
  zero.
- No runtime, AppHost start, Docker, container, or E2E runtime suite ran. The implementation session
  does not dispatch or claim IMPL-EVAL.

## D-231 graph-injected command state

- Resume baseline is the clean local/remote head
  `a2b227941160bd993b0468cea2a0e12cebc63013`.
- Run `33447847678` proves `ReferenceExpression.getValue()` is only compile-valid in this context:
  it dispatches `Aspire.Hosting.ApplicationModel/getValue`, which the live AppHost rejects as an
  unknown capability. The 13.5.3 command context has no connection-string accessor.
- Container typed commands now stage their operation and start the existing `<db>-cli` executable.
  Its graph annotations inject `DATABASE_URL` and the provider variable from the allocated resource
  through `withEnvironment`, `withReference`, and `waitFor`.
- The emitted runner writes an atomic result using D-224's bounded detail. The callback reads that
  record before its generic nonzero-start fallback, preserving the decisive failure text.
- External keeps `getConnectionString(...)`; SQLite keeps its `file:./...` URL. No `getValue`,
  `getValueAsync`, guessed capability, cast, `any`, or lint suppression is emitted.
- New coverage was RED at the baseline (30 passed / 6 failed) and statically requires graph
  injection while excluding callback capability calls. Final focused helpers pass 256/256; scoped
  check/lint/fmt, `quality:gate`, and repo-wide check are green with `failedBatches: 0`.
- Clean product/harness head `6b0bcfe1daefe8c65be5cd36dc99f8c6fe3133a0` passes
  `check:assets-barrel` diff-clean.
- No Aspire, Docker, AppHost, `e2e:cli`, runtime suite, PR lifecycle/base/label change, or evaluator
  dispatch occurred. CI remains the runtime authority.

## D-235 shared diagnostic budget state

- Resume baseline is `e4464e9f49b4595b0d0edd74bc978d774e30e4a0`. Its generator-authored
  `evaluate.md` was quarantined by the owner and is deleted; this implementation session does not
  create or dispatch a replacement evaluator.
- Option (a) preserves D-224's per-stream 32-line 8/24 retention and UTF-8 truncation while deriving
  the final allowance from one shared 16-KiB persisted budget. Request JSON is capped as a final
  artifact, including envelope and promoted-message duplication.
- The both-stream fixture is RED at the baseline with error/result/flattened byte totals
  32,767/33,479/32,893 and GREEN after the repair at 16,383/16,384/16,061. It retains 32 lines in
  each stream and asserts all three artifacts are at most 16 KiB.
- Failure promotion now follows observed complete-line capture order across both streams rather than
  scanning all stderr before stdout. Its generic ordering fixture was independently RED before the
  repair and GREEN after it.
- The complete static helper/runtime-builder suite passes 285/285, explicitly carrying D-224,
  D-227, D-231, D-233, and migrate-to-deploy coverage. Scoped check/lint/fmt and `quality:gate`
  exit 0; repository structured check passes 2,987 files in 25 batches. No runtime command ran.

## D-237 listener ownership state

- The actual latest CI split is Docker D-101 listener-unreachable PASS followed by typed-db phase B
  FAIL, while SQLite listener-unreachable fails before fault injection because its test-only Garnet
  health key is absent.
- An S8-free Docker control at `6c195acaf` passes the D-101 gate. Its SQLite tier never reaches that
  gate, so a current-main runtime control is still required to attribute the SQLite symptom.
- D-101's controller, fixture, readiness preparation, and verifier are blob-identical across current
  main, S8 head, and the tested merge. D-233 nevertheless changes setup indirectly by eliminating
  the old fallback restart after typed deploy success; that is recorded as reachability only.
- Typed-db phase B is conclusively S8-owned: it used a real resource stop even though D-101 records
  that stopping a persistent resource suspends health evaluation and retains the last report. The
  bounded repair uses the existing synthetic listener controller and test-only Postgres key.
- The regression was RED at 23/24 before the repair; focused tests pass 36/36 and the complete
  helper/runtime-builder set passes 286/286 afterward. Scoped check/lint/fmt and `quality:gate` exit
  0. No runtime command, evaluator dispatch, or `evaluate.md` creation occurred.
