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
   (Sol/high). **Dispatch order 4 is TERMINAL: PLAN-EVAL cycle 2 `PASS`** against evaluated head
   `09dfb092dccf7f843b9270295047d674a8187362`, evaluator commit
   `c694cfb311d378f4796280649042c8c275c828ed`, session `b6c48f02-cb56-4dae-abfd-e46bdec05bd5`, PR
   comment `5299133651`. Cycle-1 advisory preserved bit-identical as
   `plan-eval-cycle-1-advisory.md`. Branch head is now `c694cfb31` (two run artifacts only).
   Implementation is unblocked and the leaf moves to `status:impl`.

   Two residual PLAN-EVAL findings are **open for IMPL-EVAL**, not discharged by the `PASS`:
   - **R-1** — `quality:scan` runs `--allow-read`; a live `api.github.com` owner lookup needs
     `--allow-net` (+ `--allow-env` for a token). The permission change and the fail-closed
     resolver's offline / 60-req-hr / fork-PR behaviour are unstated, including for the consumer
     copy in `agent-tools.generated.ts`. CI reaches the scanner via `deno task quality:scan`
     (`.llm/tools/gates/catalog.ts:36`), so `deno.json` governs the permission set — no workflow
     edit needed.
   - **R-2** — durable owner #1276 T3 is milestoned `Backlog / Triage`, not a numbered release. If
     the milestone check demands a numbered milestone, all seven records fail on day one. IMPL-EVAL
     must require a test pinning a `Backlog / Triage`-milestoned owner as passing.

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

**Both dispatched gates are closed and #1653 implementation is complete.** All four planned slices
landed, each with a supervisor Tier-A sign-off commit:

| Slice                                                    | Implementation head | Sign-off commit |
| -------------------------------------------------------- | ------------------- | --------------- |
| S1 registration + fail-closed resolver                   | `586b55135`         | `3c3985289`     |
| S2 `public-any` / `public-export-unresolved` enforcement | `f869a5bfe`         | `f9acdb426`     |
| S3 consumer asset + JSR/debt evidence                    | `2977c8333`         | `83f7a1847`     |
| S4 consumer portability restoration + final gates        | `71c264458`         | `2d5e4f5ae`     |

Leaf head `2d5e4f5ae`, local = remote, worktree clean, PR #1653 draft at `status:impl`.

The leaf is parked awaiting the **coordinator's IMPL-EVAL grant**. IMPL-EVAL is a formal gate
needing a fresh separate opposite-family session on the reset dispatch route; this lane does not
launch it. Readiness flip, `status:ready-merge`, PR-body box ticking, merge, and publication are all
coordinator-owned.

DoD stands at 10/12 truthfully tickable rows. The two open rows were Slice 4 Tier-A review (closed
by `2d5e4f5ae`) and IMPL-EVAL (open).

## Carried into IMPL-EVAL

- **`explicit-any` vs `public-any` overlap** — the broad line-level classifier and the export-graph
  rule now coexist. Locked plan behaviour that PLAN-EVAL passed, but confirm each violation is
  reported once with the intended attribution.
- **`D-12` import-specifier trade-off** — `.llm/tools/quality/scan-code-quality.ts` must keep the
  inline `jsr:@std/path@^1` specifier because it ships to consumers via `agent-tools.generated.ts`.
  A future lint pass over `.llm/tools/**` will want to "fix" it again; it must not. The binding
  `test` gate is what protects this.
- **Workers JSR baseline** — accepted exact-20 `private-type-ref`, owned by #1655 in 0.0.8, strict
  no-increase, and never to be claimed green.
- **Receipt head convention** — slice receipts attest the pre-commit parent, matching what IMPL-EVAL
  already accepted on #1644.
