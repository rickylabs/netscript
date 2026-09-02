use harness

# IMPL-EVAL request: S8 typed db-cli-mode resource commands

Evaluate draft PR #1754 in a fresh Fable 5 session. This is evaluator work only: do not implement
product changes, run Phase-B runtime commands, start an AppHost, create containers, mark the PR
ready, or replace the implementation agents evidence with an unsupported summary.

## Scope and authority

- Repository: `rickylabs/netscript`
- Branch: `feat/aspire-13-5-s8-typed-resource-commands`
- Stack base: `feat/aspire-13-5-s6-health-checks` at `564d465c`
- Implementation head: `5b6f8a0a8b89803ec10fbb13600fc7427ddc9260`
- Run: `.llm/runs/feat-aspire-13-5-s8-typed-resource-commands--impl/`
- Issues: #1720 and #863; epic context #1712; locked decision D-6
- Phase A is static. Phase-B live receipts remain unchecked and require separate supervisor
  coordination because the remote-DinD topology is recorded in D-42/D-43.

Read the issue bodies, full base-to-head diff, `research.md`, `plan.md`, `context-pack.md`,
`drift.md`, `member-table.md`, `worklog.md`, receipts, and the six PR slice comments. Treat D-39 as
authoritative: inotify is 1024, PID 1 is `tini`, zombies are zero, and restore/watch/lifecycle reds
are real findings. Do not apply the superseded inotify-128 or zombie classification.

Challenge especially:

1. typed `migrate`/`seed`/`reset` emission, typed timeout/confirm arguments, `{ success, message }`
   results, and confirmation before any reset mutation or process/connection IO;
2. exact D-6 ownership: `.excludeFromMcp()` only on generated `<db>-cli` resources, no
   `withHidden()`, and no user-facing resource exclusion;
3. complete removal of `PROCESS_COMMANDS_FLAG` and the Aspire 13.4 compatibility seam from raw and
   generated tool-registration output;
4. exact running-AppHost path detection, resident typed routing, standalone fallback, and
   `aspire wait` exits 17/18 mapping to resource- and timeout-specific actionable messages;
5. A7/A11 placement of IO in emitted runtime/adapters rather than generators, with no new `any`,
   casts, or lint suppressions;
6. D-19 restored Aspire 13.5.3 signatures/hashes and consumer compile, including drift D-03;
7. the unregistered Phase-B verifier and typed-command-first runtime gate: confirm Phase A cannot
   execute the verifier and the legacy restart remains only a fallback;
8. static gate sufficiency, lock hygiene, generated-asset freshness, PR draft/base/body/labels, and
   truthful separation between completed Phase A and pending live Phase B.

Clean-HEAD receipts tied to `5b6f8a0a` record 42 focused tests plus configured lint, quality,
architecture, and asset-barrel PASS. `scaffold.plugins` passed 17/17 before the commit. No runtime
suite or live Phase-B command was run.

## Required output

Write the authoritative evaluation to
`.llm/runs/feat-aspire-13-5-s8-typed-resource-commands--impl/impl-eval.md` using the harness verdict
vocabulary: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`. Include concrete file/line findings,
separate blockers from advisories, and explicitly state which conclusions are Phase-A-only.

Commit/push only the evaluator artifact and post one structured PR comment beginning
`[PHASE: IMPL-EVAL]` with the matching machine verdict line. The evaluator must not mutate product
code, generated assets, `deno.lock`, issue bodies, PR readiness, or unrelated run artifacts.
