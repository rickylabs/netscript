use harness

## SKILL

- netscript-harness — run lifecycle, slice review gate, evaluator separation (you never
  self-certify).
- netscript-tools — this slice IS repo tooling (`.llm/tools/agentic/teardown/*`):
  leak-check/teardown semantics, ownership by path containment, receipts, configured
  `deno task lint`, `gen:assets-barrel` (agent-tools corpus embeds `.llm/tools` docs).
- netscript-doctrine — no `any`/casts/lint-ignores; IO at the edge, pure classification testable
  with fixtures.
- netscript-pr — draft PR, labels, `Closes`, commit-trail comments.
- aspire — 13.5 lifecycle facts (S2 V6/V7 receipts: orphan auto-clean by `aspire ps`/`stop`,
  `stop --force --apphost` deletes persistent resources, backchannel socket pruning, DCP helper exit
  timing); **no AppHost start, no host CLI change** (no runtime lease in this phase).

## Context

You are the GPT-5.6 Sol implementation agent for **S7 of the Aspire 13.5 epic** (#1712): **#1719 —
[aspire-13-5 S7] Teardown/leak-check on 13.5: orphan cleanup, `stop --force`, descendant tracking**.
Will close #1429. Supervisor: the Fable 5 session.

### Your worktree / branch — STACKED ON S3

- Worktree: `/home/codex/repos/netscript-aspire-13-5-s7` (native ext4; work ONLY here)
- Branch: `fix/aspire-13-5-s7-teardown-leak-check`, based on **S3's head `fe4f496bd`**
  (`test/aspire-13-5-s3-fixture-recapture`, phase A IMPL-EVAL PASS) because S7 consumes the 13.5.3
  `aspire ps` fixture S3 added. No upstream — push only with
  `git push origin HEAD:refs/heads/fix/aspire-13-5-s7-teardown-leak-check`. Draft PR **base
  `test/aspire-13-5-s3-fixture-recapture`**; the supervisor retargets after S3 merges. Never touch
  S3's commits.
- Run dir you own: `.llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/` (`supervisor.md` from
  `.llm/harness/templates/supervisor.md`, `worklog.md` with `## Design`, `context-pack.md`,
  `drift.md`).

### Required reading (in order)

1. Issue #1719 (scope, boundaries, acceptance) and #1429 (the orphaned `aspire-managed` descendants
   leak-check misses), epic #1712.
2. `AGENTS.md` "Resource hygiene" (leak-check/teardown contract: foreign/unknown-owner entries are
   reported and never mutated; `--apply` only on positively proven ownership; `--owned-root` path
   containment).
3. S2 receipts on `origin/test/aspire-13-5-s2-runtime-verification`
   `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/`: `02-v6-*` (orphan cleanup),
   `02-v7-*` (`stop --force`), `02-v5-aspire-ps-final.json`, `run-resources.json`, and the S2
   leak-check receipt — these are the 13.5.3 lifecycle facts you encode.
4. `.llm/tools/agentic/teardown/{probes,ownership,teardown,leak-check}.ts` (+ tests),
   `__fixtures__/aspire-ps-13.4.6.json`, `aspire-ps-13.5.3.json`, `docker-inspect-13.4.6.json`,
   `.llm/tools/CLEANUP-PLAYBOOK.md`; `MCP_COMMAND` guard (never touch `aspire agent mcp`).

### Phase split (no lease in this dispatch)

- **Phase A (now):** process-tree classification that includes re-parented (PPID 1) descendants
  matched by DCP labels / `--apphost` argv / socket path; `--force-persistent` gate behind
  `--apply` + proven ownership; post-stop confirmation probe (wait for DCP helper exit per S2 V6
  timing) — all unit-tested with fixtures (13.4.6 + 13.5.3) and synthetic process-table snapshots;
  playbook update; barrel regen.
- **Phase B (lease-backed, same PR):** the #1429 live reproduction receipt (kill CLI → leak-check
  reports → `teardown --apply` removes only owned resources) and the foreign-AppHost re-test. Do not
  attempt now.

## Slices (commit in order; RED-first)

1. **RED fixture for #1429.** A process-table snapshot fixture
   (`__fixtures__/process-tree-13.5.3-orphaned.json`, synthetic but shaped from the S2 V6 receipt —
   say so in the README) where the CLI is gone and `aspire-managed` descendants sit at PPID 1; a
   leak-check test that currently FAILS to report them (receipt via `run-gate`).
2. **Descendant tracking (#1429).** `probes.ts`/`ownership.ts`: classify re-parented descendants by
   DCP label / `--apphost` argv / socket path containment; the `MCP_COMMAND` guard test stays green;
   foreign-worktree AppHost stays _reported, never owned_ (existing invariant re-tested against both
   ps fixtures).
3. **`--force-persistent`.** `teardown.ts`: after the scoped `aspire stop`, run
   `aspire stop --force --apphost <exact>` only under `--apply --force-persistent` AND proven
   ownership; dry-run prints the exact argv; tests for allowed/refused arms. Never emit `--all`.
4. **Post-stop confirmation.** Probe loop bounded by the S2 V6 timing (cite the receipt) waiting for
   DCP helper exit before declaring clean; tests with synthetic snapshots (exits in time / never
   exits → reported, not killed).
5. **Playbook + regen + gates.** `.llm/tools/CLEANUP-PLAYBOOK.md` 13.5 section;
   `gen:assets-barrel` + `check:assets-barrel`; configured `deno task lint`, scoped wrappers on
   `.llm/tools/agentic/teardown`, `quality:scan`, `arch:check`, teardown unit suite (both fixtures).
   Draft the `#1429` closing-evidence text and the phase-B receipt procedure in the run dir.

## Boundaries

- No E2E cleanup gate change (S10), no host-wide `aspire stop --all` ever, no runtime start, no
  pins, no `packages/`/`plugins/` source, no skills/docs beyond the playbook, no S3 commit edits.

## Draft PR and receipts

- After commit 1: draft PR (base `test/aspire-13-5-s3-fixture-recapture`), title
  `fix(tooling): 13.5 teardown/leak-check — orphaned descendants, stop --force, post-stop confirmation (S7)`;
  body per `.github/pull_request_template.md`, `## Scope` = `Closes #1719`, `Closes #1429`,
  `Part of #1712`; labels `type:fix`, `epic:aspire-13-5`, `area:tooling`, `area:aspire`,
  `priority:p1`, `status:impl`; milestone `0.0.7`. State the S3 stacking and the phase-B lease
  dependency.
- Push with the explicit refspec after every commit; per-commit PR comment with scope, SHA, gate
  evidence; push lines in `worklog.md`.

## Stop conditions

- Final non-empty line exactly `DONE` (plain text, no table, nothing after) when slices 1–5 are
  pushed, the draft PR carries the commit trail, gates green locally, run-dir artifacts committed.
  You do not mark ready and do not self-certify.
- Otherwise final non-empty line exactly `BLOCKED: <exact reason and evidence path>` (plain text).
