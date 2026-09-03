# PLAN-EVAL (Cycle 2) — fix-agentic-sender-lease-recovery--1751

- Plan evaluator session: OpenRouter `qwen/qwen3.8-flash` max, 2026-08-31 (coordinator-designated
  override, same route as cycle 1; requested lane remains native Fable 5 medium per `plan.md` D10 —
  transport note, not a plan defect)
- Evaluated head: `c13da3e239b136e465d7aeb7116a803aefa7d6f9`; base `main` @
  `5197e70b716eafb82fbb12ddb9a910c248ddb86a`
- Cycle-1 record: `plan-eval.md` (FAIL_PLAN, F1–F5). This pass is a focused re-check of the F1–F4
  amendments plus the no-weakening check, not a full re-derivation. Prior verdicts on exit-code
  propagation, RED-before-GREEN, and gate audit stand — the amendments did not touch them.
- Inputs read: `plan.md`, `research.md`, the `76c24d9e2..c13da3e23` diff for both, the `worklog.md`
  slice table, `gates/plan-gate.md`, `evaluator/plan-protocol.md`, and the live wiring source under
  `.llm/tools/agentic/runtime/`.

## F1 — repair-command wiring path (cycle 1 HIGH)

**Resolved substantively; one artifact-consistency residual (R1).**

- D11 locks option (a): extend `RUNTIME_COMMANDS` with `'repair-sender-lease'`, following the
  `repair-codex-remote` `plan`/`apply` precedent, with `runtime/planner.ts` logic and
  `runtime/cli/agentic-runtime.ts` dispatch wiring. The cycle-1 fork (union path vs CLI-local
  parse) no longer exists.
- The precedent claim is real, not just asserted — verified against the tree at the evaluated head:
  - `contract.ts:3-6` `RUNTIME_COMMANDS`; `:11-18` `LEGAL_COMMAND_MODES['repair-codex-remote'] =
    ['plan','apply']`; `:19-21` `RuntimeCommandMode<K>` auto-maps any non-doctor/status kind to
    plan/apply; `:158-161` union payload `{ worktree, sessionId? }` — exactly the D5 target shape
    (canonical `--worktree`; `--dry-run` maps to `plan` per `agentic-runtime.ts:104`).
  - `planner.ts:241-247`: the precedent case adds one action with
    `effect: command.mode === 'apply' ? 'process' : 'none'`.
  - `agentic-runtime.ts:96-110` parses `repair <target>` and `:138-158` dispatches the guarded
    repair ahead of the generic controller; the `commandId` construction (`:54`) and `usage()`
    (`:21`) branch at the same site. The new subcommand slots into this exact shape.
  - `contract_test.ts:128` asserts a fixed fixture list **exactly equal** to `[...RUNTIME_COMMANDS]`
    — it forces contract+test to change together and is the regression net cycle 1 identified. The
    vocabulary test (`:77-96`) asserts uniqueness only, so a new `ACTION_KINDS` entry is admitted
    inside the already-declared `contract.ts`; the mode-policy loop (`:131-142`) accepts a
    plan/apply kind automatically.
  - No consumer outside the declared set requires edits: `controller.ts` branches only on
    `doctor`/`status`/`rollback` (`:43-46,:194`) — there is no exhaustive command-kind switch beyond
    the declared files. The wiring path is therefore manifest-complete as declared.
- Intended File Manifest: `runtime/contract.ts`, `runtime/contract_test.ts`, `runtime/planner.ts`,
  `runtime/planner_test.ts`, and the `runtime/cli/agentic-runtime.ts` dispatch site are all now
  declared. The "manifest breach or parser rework" hazard is closed.
- **Residual R1 (mandatory before the Slice 4 commit):** the amendment did **not** touch
  `worklog.md` (`git diff 76c24d9e2 c13da3e23 -- worklog.md` is empty), so the Slice 4 files row
  still omits the four wiring files, and `plan.md`'s Open-Decision Sweep row claims they are "now
  declared in the Intended File Manifest **and Slice 4**" — a false-done statement against the
  artifact it describes. Because the binding constraint (manifest: "No file outside this list is
  intended") is complete and D11 names the files explicitly, no decision is missing and no rework
  is forced; the sweep sentence itself enumerates exactly the intended final state. This is
  record-keeping, not a plan gap, so it does not re-fail the Commit-slices box — but the worklog
  row and the sweep claim must be reconciled before Slice 4 commits, and logged in `drift.md`.

## F2 — probe provenance for absence evidence (cycle 1 HIGH)

**Resolved at the decision level; one wording residual (R3).**

- D2 now conjoins the three-signal requirement with: "the rollout inventory or thread daemon probed
  must be bound to the record's own session provenance … an unestablishable or mismatched home
  yields `indeterminate`, never `stale`." Truth-table row 2 requires the same bound provenance for
  both absence claims; row 3 explicitly routes "unestablishable or mismatched provenance for either
  absence claim" to `indeterminate`; the closing note makes absence against a default/unbound
  inventory or daemon `indeterminate` — and D2's clause is blanket, so it also governs row 1's
  `not_loaded`/`absent` thread cells.
- Re-ran the cycle-1 scenario against the amended rules: lease-owner PID dead + a follow-on writer
  still driving the thread from an isolated profile home. A bound probe observes
  `active`/`working` → preserve (D3). An unbound default-home probe returns `not_loaded`/`absent` →
  the row-2 conjunction is no longer satisfiable → `indeterminate`. `stale` is unreachable from
  either branch. The false-positive eviction hole is closed in the fail-closed direction.
- Implementability checked so the fix does not smuggle in a new open decision: the record
  (`sender-ownership.ts:8-17`) still stores no code-home field, so binding is established either
  dynamically at repair time (session-id lookup across default plus worktree-materialized profile
  candidates) or persisted at activation. Both routes live inside already-declared files
  (`sender-ownership.ts`, `local-sender-ownership-adapter.ts`, `launch-codex-slice.ts`, plus D1's
  typed evidence), the locked classifier rule holds under either, and records whose provenance is
  unestablishable — including all pre-existing ones — classify `indeterminate`, the conservative
  direction D3's rationale explicitly prefers. Cycle 1's conditional requirement ("declare the
  schema/parser consequences" only *if* the record must store provenance) is not triggered as a
  plan-blocking obligation: storing is optional, and either choice stays manifest-clean.
- **Residual R3 (minor):** cycle-1 fix 2 asked for the rule "(and the Risk Register)"; no
  profile-home row was added. The hazard is now enforced structurally by the classifier rather than
  in prose — a stronger position than a register line — so this is register completeness, not a
  safety gap.

## F3 — #1774 anchor (cycle 1 MINOR)

**Resolved in the authoritative places; leftover wording folded into R2.**

- Verified independently rather than trusting the amended text:
  `git merge-base --is-ancestor a3ddcbb59 5197e70b716eafb82fbb12ddb9a910c248ddb86a` succeeds
  (`a3ddcbb59` = PR #1775, shipped 2026-08-30, in the base), and `agentic:runtime` with
  `--allow-write --allow-env` is present in the base `deno.json` — so "no `deno.json` edit" holds
  against current main, exactly as R13 now states.
- `research.md` R13, the README manifest line, and the "Explicitly not edited" line are re-anchored
  to the shipped state.
- **Residual R2 (wording):** five spots still describe #1774 as in flight — D5's rationale
  ("#1774-conflicted `deno.json`"), the Scope final bullet ("reconciling #1774's concurrent edit"),
  the Risk Register "#1774 conflicts" row, Dependencies ("#1774 reconciliation before the README
  slice"), and `worklog.md` Slice 7 ("reconcile #1774"). None changes a conclusion; fold into the
  same worklog/drift cleanup as R1.

## F4 — receipt carries both evidence passes (cycle 1 NOTE)

**Resolved.** D7 now stores all three evidence summaries "from both the original detection pass and
the apply-time re-observation pass, each with its own timestamps", so the accepted residual
re-observation→CAS window is reconstructable from the persisted re-observed states, not just
timestamps. D6's ordering (token re-read, full probe repeat, `authorized` receipt atomically before
CAS, `evicted` finalize after) is unchanged.

## Weakening check (D2/D3/D8/D9)

Diffed the amended tables against the cycle-1 evaluated head: **D3, D8, and D9 are byte-identical**
to the versions that passed cycle-1 adversarial review. D2 changed only by adding a conjunction
(provenance binding required) and the truth-table catch-all only by widening `indeterminate`
coverage — both strictly tighten `stale` reachability; no non-evictable condition in D3 lost an
item, and the pure-function/typed-evidence/CAS-token enforcement is untouched. D11 adds wiring with
no eviction-semantics change. No fix traded a correctness hole for a new one.

## Checklist delta (focused, cycle-1 → cycle-2)

| Plan-Gate item | Cycle 1 | Cycle 2 | Basis |
| --- | --- | --- | --- |
| Research present and current | FAIL | PASS | R13 re-anchored; ancestor verified in `git`. |
| Decisions locked | FAIL | PASS | D11 locks the wiring path; D2/truth table lock provenance binding. |
| Open-decision sweep | FAIL | PASS | Both rework-forcing decisions now flagged and resolved; remaining deferrals individually justified. |
| Commit slices | FAIL | PASS (with R1) | Slices enumerated, ordered (7 < 30), each names proof + gate + files; Slice 4's worklog row is stale versus the plan's own D11/manifest — mandatory pre-Slice-4 correction, no decision gap. |
| Risk register | PASS | PASS (with R3) | Profile-home row still absent; hazard closed structurally in the classifier instead. |
| Gate set selected | PASS | PASS | Untouched by amendments; contract_test equality remains the F1 wiring net. |
| Deferred scope explicit | PASS | PASS | Untouched. |
| jsr-audit (pkg/plugin) | N/A | N/A | No `packages/**`/`plugins/**` surface. |

## Verdict

`PASS` — implementation may begin. Both cycle-1 HIGH findings are closed and verified against the
tree, not against the plan's self-description: D11's precedent claim matches the actual
`repair-codex-remote` wiring shape exactly (contract list + plan/apply mode map + union payload +
planner action case + CLI special-case dispatch + exact-equality fixture), and the amended D2
makes the isolated-profile false-positive `stale` unreachable while leaving D3/D8/D9 untouched.
The residuals are run-artifact record-keeping, made explicit here so they do not travel as hidden
drift:

- **R1 (mandatory before the Slice 4 commit):** update the `worklog.md` Slice 4 files row to
  include `runtime/contract.ts`, `runtime/planner.ts`, `runtime/contract_test.ts`, and
  `runtime/planner_test.ts`, and correct the `plan.md` Open-Decision Sweep sentence until then;
  log the correction in `drift.md`.
- **R2 (wording):** re-anchor the five remaining "#1774 in flight" phrasings (D5 rationale, Scope
  bullet, Risk Register row, Dependencies, worklog Slice 7) to the shipped state, in the same edit.
- **R3 (optional):** add the isolated-CODEX_HOME profile-home row to the Risk Register.

If R1 is not landed when Slice 4 opens, IMPL-EVAL should treat it as manifest-consistent but
slice-record-inconsistent drift and require the worklog correction — not a plan reopening.

## Notes

- Read-only pass: no sender record, thread, rollout, daemon, or process was inspected or mutated,
  and no file was modified except this artifact.
- The worktree carries the local-only uncommitted `models.ts` line permitting this evaluator's
  dispatch identity (same as cycle 1); excluded from the verdict per the coordinator's dispatch
  note.
- Identity record: requested D10 lane was native Fable 5 medium; the coordinator explicitly routed
  this OpenRouter `qwen/qwen3.8-flash` max session for both cycles. Recorded per protocol; not a
  plan defect.

VERDICT: PASS
