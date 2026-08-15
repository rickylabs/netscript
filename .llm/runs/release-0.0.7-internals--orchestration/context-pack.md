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

**Internals has shipped three leaves; the fourth is active.**

| Leaf                                         | State                                                         |
| -------------------------------------------- | ------------------------------------------------------------- |
| #1644 `harness-evidence-and-verdict-tooling` | merged `dd472102d` — #1561/#1563/#1621 shipped                |
| #1653 `quality-scan-allowance-rail`          | merged `473e8d75b` — #1378/#1545 shipped                      |
| #1656 `quality-scan-root-coverage`           | merged `7737d8903` — #1542 CLOSED/COMPLETED, `status:shipped` |
| **`openhands-dispatch-claim-and-refusal`**   | **ACTIVE** — bootstrap/research/plan, stops at the plan gate  |

Live `main` = `7737d8903bb2925c3fcefbda362168fe297eebd4` — the new immutable base. Its post-merge
workflow set is **terminal and clean**: run `31871224548` (`ci`) COMPLETED/SUCCESS, and across all 8
runs at that exact SHA there are **0 pending, 0 failed**. No further main polling is required.

### Active leaf identity

- Worktree `/home/codex/repos/netscript-007-openhands-dispatch`
- Branch `fix/openhands-dispatch-claim-and-refusal` @ `7737d8903`, **no upstream**
- Codex thread `01a00443-abab-7261-8905-74ed71467929`, `openai · gpt-5.6-sol · medium`, route
  matched
- Steering: `codex exec resume 01a00443-abab-7261-8905-74ed71467929 -- "<follow-up>"`
- Draft PR **#1658** `fix(agentic): bind OpenHands dispatch claims and refusals` @ **`cea999d18`**
  (repaired plan head after rescope), `type:fix`/`area:tooling`/`status:research`, milestone `0.0.7`
- Run dir
  `.llm/runs/release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal/`
- Closes exactly **#1611** (p1, dispatch helper must emit phase/head and acquire the existing claim)
  and **#1613** (p2, report refused OpenHands commands to their author; align generation retry)

### Frozen contract (outer bound, to be narrowed in the plan)

Archetype `6-cli-tooling`, no overlays. Four surfaces:
`.github/scripts/openhands-comment-trigger.mjs`, `.github/workflows/openhands-agent.yml`,
`.github/workflows/openhands-phase-eval.yml`, `.llm/tools/agentic/lib/agentic-lib.ts`. Proving
gates: `check`, `test`, `quality-job`. **JSR audit not applicable** — no publishable surface in
contract.

**Not this leaf's to take:** Aspire, Docker, browser/desktop, E2E, or the global expensive-gate
lease. And uniquely here: the leaf may **read** the OpenHands workflows but must not **fire** them —
no dispatch, no evaluator trigger, manual or by label.

### Current state — four leaves shipped; wave 2 leaf active

| Leaf                                         | State                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| #1644 `harness-evidence-and-verdict-tooling` | merged `dd472102d` — #1561/#1563/#1621 shipped                              |
| #1653 `quality-scan-allowance-rail`          | merged `473e8d75b` — #1378/#1545 shipped                                    |
| #1656 `quality-scan-root-coverage`           | merged `7737d8903` — #1542 shipped                                          |
| #1658 `openhands-dispatch-claim-and-refusal` | merged **`05fc3132b`** — #1611/#1613 CLOSED/COMPLETED, all `status:shipped` |
| **`package-gate-honesty`**                   | **ACTIVE** — bootstrap/research/plan, stops at the plan gate                |

Live `main` = `05fc3132b6800a85eb6152691a961b658962571b` — the new immutable base. Waves 0 and 1 are
complete.

### Active leaf identity

- Worktree `/home/codex/repos/netscript-007-package-gate`
- Branch `fix/package-gate-honesty` @ `05fc3132b`, **no upstream**
- Codex thread `01a004ec-86a6-7c21-8886-81c09de099f5`, `openai · gpt-5.6-sol · medium`, route
  matched
- Steering: `codex exec resume 01a004ec-86a6-7c21-8886-81c09de099f5 -- "<follow-up>"`
- Run dir `.llm/runs/release-0.0.7-internals--orchestration/slices/package-gate-honesty/`
- Closes exactly **#1604** (prescribed `--cwd packages/cli test` always red), **#1618** (`deno fmt`
  cannot verify `packages/mcp`), **#1622** (`closeScoreGap` pinned by no test)

### ⚠ This leaf's contract includes the global expensive gate

`provingGates` contain **`scaffold.runtime`** (aspire + docker + postgres), serialized cluster-wide
at one holder. The leaf is forbidden from running it — now or at implementation — without the
coordinator granting the mutex through this lane. It must plan for it and **ask, not take**.

The frozen surface is also unusually loose (duplicate entries, wildcard `packages/*`), so the plan
must narrow it with per-path justification and name what it deliberately will not touch.

### Blocking coordinator action

The leaf stops after `plan.md` with its PLAN-EVAL judgement; that gate is the coordinator's to
grant.

### Remaining internals queue after this leaf

wave 2 `reference-export-drift-gate` (#1296) — `package-gate-honesty` is now active; wave 3
`jsdoc-example-compile-gate` (#1533) and `leak-check-process-descendants` (#1429); wave 4
`fresh-defer-test-capability` (#1557/#1601).

## Coordinator rulings 2026-08-15T16:38:58Z (decisions 2-6 resolved; 1 stays owner-only)

Authoritative statement is the decision table in `supervisor.md`. Resumable summary:

- **#1663 `package-gate-honesty`** stays parked at immutable `194e22a3d`. Its third/final PLAN-EVAL
  is the **sole owner-only** decision. **Do not relaunch, resume, mutate, or re-review it.**
- **#1666 `reference-export-drift-gate`** is the active leaf and executes now:
  1. Scope amendment **SA-1** authorizes exactly one tenth implementation path,
     `.llm/tools/docs/check-exports-drift_test.ts`, **test-only** — persistent fail-closed refusal
     coverage is load-bearing and must not be left to non-persistent one-off probes. SA-1 is
     committed and explicitly pushed **before** implementation.
  2. `fresh-browser` is **N/A / waived**. `NOT_RUN` evidence is preserved; **no runtime lease.**
  3. After SA-1 receives fresh Tier-A, exactly **one** PLAN-EVAL cycle 1 runs over the amended
     immutable head — native **Fable 5 / medium / Remote Control**, separate session,
     **artifact-only** (writes `plan-eval.md` and nothing else).
  4. On `PASS`, resume the **preserved original Codex author** through the plan's serial slices,
     each followed by a fresh Tier-A gate.
- **#1666 sequences before #1533.** **Superseded in part:** PLAN-EVAL B1 found three more defective
  files, so #1533's gate would go red on **four**. #1666 as currently scoped does not clear that
  red. See open decision 7.
- **L-2 is deferred until #1663 is terminal** (overlapping `deno.json` / lint-wrapper surface). It
  does not block #1666.

Central `leaf-contracts.json` still freezes nine `fileSurfaces` for this leaf. It is
coordinator-owned; this lane does **not** edit it. SA-1 is the leaf-local record of the tenth path,
and the central reconciliation is reported upstream — see `drift.md`.

## Queued internals follow-up — L-2 (DEFERRED until #1663 is terminal)

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

## PLAN-EVAL cycle 1 outcome — `FAIL_PLAN` (2026-08-15T16:52Z)

Head `a3f6b87b5`; evaluator commit `5d229e0f3` (artifact-only, pushed, PR left draft at
`status:plan`). **Cycle 1 of 2 spent; cycle 2 unlaunched.** The leaf is parked at `5d229e0f3`.

**B1, independently confirmed by this lane.** Beyond `paginated-query.ts:6`, three more shipped
Contracts JSDoc examples import from a non-exporting root:

| File | Symbols | Root resolution |
| ---- | ------- | --------------- |
| `packages/contracts/src/application/transform-helpers.ts:6` | `createTransformer` | exit 1 |
| `packages/contracts/schemas/filters.ts:6` | `FilterConditionSchema`, `buildPrismaWhere` | exit 1 |
| `packages/contracts/schemas/pagination.ts:6` | `PaginationInputSchema`, `createPaginatedOutput` | exit 1 |

Measured with `deno doc --no-lock --filter <symbol> packages/contracts/mod.ts`, raw exit unpiped;
each symbol resolves from `./query` or `./transform`. `baseContract` returns exit 0, so
`contract-primitives.ts` is correct as claimed. All four defective files ship —
`publish.include` carries `src/**/*.ts` and `schemas/**/*.ts`. `schemas/pagination.ts:8`
additionally uses `baseContract` without importing it, so fixing the specifier alone leaves that
example uncopyable.

Why it blocks the **plan**: `research.md` F3/F4 and `plan.md` D8 record acceptance row 1 as
baseline-satisfied apart from one file (false), the three files sit **outside** the frozen surface,
and `plan.md` locks `Closes #1296` — so merging as scoped would auto-close an issue whose row 1 is
still unmet in three published files. That is a scope decision, not an author decision.

**Do not launch cycle 2 before decision 7 is answered** — an unchanged scope reproduces B1 and
spends the last granted cycle for nothing.
