# Context pack — 0.0.7 internals topic

Resumable state as of the 2026-08-15 reset, first turn of the Opus 5/high topic controller.

## Authority and identity

- Role `topic-internals-0.0.7`, one of exactly four topic orchestrators under Codex coordinator
  `codex-root-0.0.7` (session `019ffaa3-32ae-7b02-92a5-d7ae146d8cbd`, worktree
  `/home/codex/repos/netscript-547-lffix`).
- Active controller: native Claude session `f7691917-0be2-4bcd-8839-43d3fc809c34`, bridge
  `cse_01HqFtKQtyJcHBEn1MghQdFX`, `claude-opus-5` / high, Remote Control attached. Full identity
  evidence is in `supervisor.md`.
- Legacy Codex topic thread `019ffcc0-e1b5-74f0-96eb-cdeb298d6b17` is parked, idle, and preserved.
  Never resume it as a topic controller.
- Central authority lives in
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`. Read
  `briefs/reset-gates/dispatch.json` after the central state; it supersedes every pre-reset route
  table. **Do not mutate central cluster state.**
- This lane may not merge, publish, mark ready, relabel, close issues, change milestone scope, or
  acquire the release-writer lease.

## Immutable baseline

`origin/main` = `01e0960494c95ce56eb35892c211a095eb13e6ed`, verified live and equal to both the
dispatch base and `milestone-cluster-state.json` `currentMainSha`.

## Wave 0 leaves (both draft, both parked on a formal gate)

1. **#1644 `harness-evidence-and-verdict-tooling`** — issues #1561 + #1563 + #1621; worktree
   `/home/codex/repos/netscript-007-harness-evidence`; branch
   `fix/harness-evidence-and-verdict-tooling`; Codex thread `019ffcc9-97ba-7770-a890-a1ebd80ec793`
   (Sol/medium, parked). **Dispatch order 1 is TERMINAL: IMPL-EVAL `PASS`** against evaluated head
   `4d9fb196765cbf1a6bc7eaa7c18ec82b237ab89f` (implementation parent
   `634b257ea1afcedb2d7f1da486d8c9e9432a2a86`), evaluator commit
   `d6e6a6788cd38127f822d192f37557106dad4ebc`, session `1afc9054-cc28-48a8-9fc4-86ae2e3bb28d`. PR
   left draft at `status:impl`. **Head moved**: the branch/PR head is now `d6e6a6788`, whose only
   delta over the evaluated head is the evaluator's `evaluate.md`. Any merge-readiness step must
   reconcile that delta explicitly, since the verdict names `4d9fb1967`, not the current head.
   Remaining steps (draft→ready, green CI, DoD/acceptance mirror, `status:ready-merge`) are
   coordinator-owned.
2. **#1653 `quality-scan-allowance-rail`** — issues #1378 + #1545, inseparable; worktree
   `/home/codex/repos/netscript-007-quality-rail`; branch `chore/quality-scan-allowance-rail`; head
   `09dfb092dccf7f843b9270295047d674a8187362`; Codex thread `019ffcc9-97d6-7602-bb7d-582ecc92b069`
   (Sol/high, parked). `status:plan-eval`. All four prior `FAIL_PLAN` blockers were
   coordinator-resolved on 2026-08-13T23:53Z; that verdict is advisory only. **PLAN-EVAL cycle 2
   (dispatch order 4) is LIVE** — session `b6c48f02-cb56-4dae-abfd-e46bdec05bd5`, Opus 5/medium,
   Remote Control `https://claude.ai/code/session_01Et9Y4vPf8i9ZMTwiqykvXr`. Do not resume
   implementation or open another gate until it is terminal.

Same-thread steering commands are in `worklog.md` and each leaf's `codex-thread-ids.md`. Never fire
a second `send-message-v2` at a leaf worktree; resume the recorded thread.

## Evidence rules that bit this lane

- **CI is not an evidence source at either head.** Every check on both draft PRs is `SKIPPED`
  because `ci.yml` guards on `draft == false`. Use the structured receipts under each leaf's
  `receipts/`, not the check rollup.
- **Receipts attest the implementation parent, by design.** `4d9fb1967` is an evidence-only child;
  its receipts record `gitHead` `634b257ea…`. Do not demand a self-referencing receipt.
- The launcher never proved Codex Remote Control for the leaf threads; the recorded app-server
  threads are the steering surface. Do not claim mobile-visible Codex Remote Control for them.

## Evaluator queue rule (owner correction, coordinator head `168715e27`)

Evaluator queues are serial **per topic**, not globally. Internals runs at most one gate at a time;
other topics may evaluate concurrently. Order 1 is closed, so order 4 is this lane's single active
gate.

## Next action

Dispatch order 4 (#1653 PLAN-EVAL cycle 2) is live and not yet terminal. Do not resume leaf
implementation and do not open another gate until it returns `PASS` or `FAIL_PLAN`. On terminal:
journal the verdict, evaluated head, evaluator commit, and PR comment id here and in `worklog.md`,
then report to the coordinator. A `FAIL_PLAN` is cycle 2 of the two-failure limit — a third cycle
requires escalation, not another mechanical relaunch.
