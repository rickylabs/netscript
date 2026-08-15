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

**#1542 / PR #1656 is READY and awaiting the coordinator's merge decision. Nothing is running in the
internals lane.**

| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| PR head        | `b80794470cd175ad89d27c06a764ab1d032d3d9f` (local = remote = PR)                         |
| State          | `OPEN`, `draft=false`, **`MERGEABLE/CLEAN`**                                             |
| Labels         | `type:fix`, `status:ready-merge`, `area:tooling`, `impl-eval:skip` — one `status:` label |
| CI             | terminal, 64 checks: **11 SUCCESS / 53 SKIPPED / 0 failures**, all at this head          |
| Review threads | 0 total / 0 unanswered                                                                   |
| Body / issue   | PR 11 checked / 0 unchecked; issue #1542 3 checked / 0 unchecked                         |

Gate lineage: plan `da76d9d84` → PLAN-EVAL cycle 1 `PASS` (`3b95a004f`) → slices `dbbedde34`,
`a7e9ee0d5`, `0147e238f` with supervisor sign-offs `a258bcc8c`, `4ae309d57`, `2c4881fd7` → IMPL-EVAL
`PASS` at evaluated head `2c4881fd7` (`addba1ab9`) → disposition record `b80794470`. The delta from
the evaluated head is run artifacts only; no product source moved after evaluation.

This lane does not merge. `openhands-dispatch-claim-and-refusal` remains queued and undispatched.

## Queued internals follow-up — L-2 (needs a coordinator scope decision)

Root `deno.json` `lint.exclude` contains `.llm/`, so `deno lint` silently drops every `.llm` tooling
file; in a mixed wrapper batch the false-green guard cannot fire, so a `lint` receipt can read exit
0 over files Deno never opened. Evidence: `deno lint .llm/tools/quality/check-root-coverage.ts` →
`error: No target files found`; 2034-file baseline vs 2036-file receipt selection; a pure-`.llm`
selection exits 2 refusing the false green. Pre-existing and unchanged from base `473e8d75b`;
deliberately **not** folded into #1656, whose two new files lint clean outside the excluded path at
zero findings. It is the same coverage-versus-compliance defect #1542 just fixed, one level up.

## Open follow-ups from #1653 (neither blocks anything)

- **Double attribution** — a publicly reachable `any` is reported by both `explicit-any` and
  `public-any` at the same `file:line`. No effect on `ok`, budget, or `allowCount`. Suggested
  #1276/#1378 follow-up.
- **Silent unknown-flag handling** — a typo'd `--max-allow` leaves `maxAllow` undefined and disables
  the ceiling. Pre-existing at base, not a regression; committed tasks spell the flag correctly.

## Standing lessons from this run

- Baseline `acceptance-evidence` blocks must be **replaced, not appended** — the mirror concatenates
  body + all comments, so a stale block turns every box into a duplicate/not-yet-done error. This
  cost #1653 a `FAIL_FIX`.
- `mirror-acceptance-evidence.ts --dry-run` proves nothing without `status:ready-merge`; its label
  guard skips validation. Execute `acceptanceCheckboxes` + `parseAcceptanceEvidence` +
  `validateEvidenceMapping` directly against live body, comments, and issue bodies.
- `.llm/tools/quality/scan-code-quality.ts` must keep the inline `jsr:@std/path@^1` specifier — it
  ships to consumers via `agent-tools.generated.ts`. A future lint pass will want to "fix" it; the
  binding `test` gate is what protects it (drift `D-12`).
- Never `deno fmt` across a directory containing `receipts/`; never attest an object outside branch
  history; a command that did not fire is NOT FIRED, and an empty-selection wrapper exit is a
  refusal, not a green.
- Never pipe an agent launch into a filter, and prove a session's non-existence before relaunching.
- Prove process ownership from `/proc/<pid>/exe` excluding self; parse structured output rather than
  pattern-matching text.
