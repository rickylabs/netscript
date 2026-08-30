use harness

# #1466 cycle 4 — IMPL-EVAL `FAIL_FIX` repair, bounded to F-1…F-5

**You are a new thread.** The cycle-1→3 author thread `01a0515c` was lost when the host agent plane
restarted; it is not resumable and is not being resumed. You inherit its work through the branch, not
through its context. Everything you need is here or in the repo.

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1731` |
| Branch | `feat/sdk-procedure-meta`, PR **#1731**, OPEN draft |
| Start head | `74483f028102ea4f2afd463aab167a983378c666` — local == `origin` == PR head, clean |
| Product content head you inherit | `235482767` (cycles 1–3); `fc81e652` added evidence; `74483f02` added the evaluator's verdict |
| Base | `21d516224` — **do not rebase**, do not revert, do not force-push |

`74483f02` is evaluator-authored and **evidence-only**: it adds
`.llm/runs/feat-sdk-procedure-meta--1466/evaluate.md` and nothing else. Read that file first — it is
your specification. Do not edit it. It is another session's record; append your response to
`worklog.md`, never into `evaluate.md`.

## SKILL

`netscript-doctrine` (doctrine 04 on published values), `netscript-harness` (receipt/evidence rules).
No new skill reading beyond those.

## Standing state you must not re-litigate

The evaluator issued three rulings. **None is reopened by this cycle.**

- **R-1** — the two terminal FAIL receipts (`public-doc-lint`, root `test`) are **non-blocking**.
  `public-doc-lint` is baseline-red on `main` at **12** findings and the leaf is delta-0 (D-23). Root
  `test` fails only `hybrid-launcher_test.ts`, a proven host-zombie baseline (D-26). **Do not retry
  root `test`** — it cannot move on this host, and no product change in this PR may target that
  infrastructure. Both stay as honest terminal FAIL receipts.
- **R-2** — an exported unfrozen `commonErrorMap` is **not acceptable as published**. This is F-1.
- **R-3** — `docs:exports-drift` is accepted as **named supplemental evidence** for slice 1. It is
  **not** a plan amendment and you do not add it to the contracted eight-receipt set. Adding it to
  `.llm/tools/gates/catalog.ts` is a coordinator follow-up and is **out of your scope**.

The plan is PLAN-EVAL-approved. You do not amend it. A gate that stays red for a proven external
cause is a finding you report, not a number you adjust.

## Scope — five findings, then recut. Nothing else.

### F-1 (high) — withdraw the published mutable singleton

The value `commonErrorMap` is exported from the public root while being a plain unfrozen object whose
nested entries back **every** base route's error map; mutating one entry rewrites the error map of
every contract in the workspace at runtime. `Readonly<>` stops a TypeScript consumer and stops no
JavaScript one. It was published to clear a doc-lint finding, not for a stated consumer need — which
is the wrong reason to widen a public surface.

Apply exactly the evaluator's prescribed fix:

1. `packages/contracts/src/application/contract-primitives.ts:123` — rewrite the alias from
   `MergedErrorMap<Record<never, never>, typeof commonErrorMap>` to
   `MergedErrorMap<Record<never, never>, CommonErrorMap>`. The alias then references the public
   **type**, so the doc-lint finding that motivated publishing the value does not return.
2. `packages/contracts/src/public/mod.ts:5` — **remove the `commonErrorMap` value export**. Keep the
   `CommonErrorMap` type export and keep `BaseContractErrors`.
3. `docs/site/reference/contracts/index.md:58` — delete the `commonErrorMap` row. Keep row 59
   (`CommonErrorMap`). Update row 29's signature text to the new alias spelling.
4. Re-run `deno task docs:exports-drift` — it must exit **0**.

Do **not** freeze the value as an alternative. Freezing is the doctrine-04 route only if a consumer
need is stated, and none is; withdrawal is the ruled fix. Do not re-export `ContractBuilder`,
`Schema`, or any other upstream type to compensate (AP-14, unchanged from cycle 1).

**The binding constraint on this edit:** `public-doc-lint` must still report exactly **12** findings
and the finding **set** must remain identical to the R-1 record in `evaluate.md`. Measure it, do not
assume it. If withdrawal moves the count or the set, stop and report — do not restore the value
export to make a number come out right.

### F-2 (medium) — pin the real initializer, and correct D-5

The inference probe rebuilds the contracted expression rather than observing `baseContract`'s actual
initializer. The evaluator proved the hole: changing the real initializer at
`contract-primitives.ts:159` to `oc.$meta<Record<never, never>>({})` — annotation unchanged — leaves
the fixture, the SDK doctest **and the inference probe** all at exit 0. Impact is bounded (under
`isolatedDeclarations` the annotation is the published declaration and the runtime value is `{}`
either way, so nothing consumer-visible changes), but source drift between the initializer and L2 is
guarded by nothing.

1. In `packages/contracts/tests/assertion-budget_test.ts` — which already reads that file as stripped
   text via `stripCommentsAndStrings` — add an assertion that the stripped source of
   `src/application/contract-primitives.ts` contains the exact initializer
   `oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` **exactly once**. Match the file's
   existing style; do not restructure the budget table.
2. Demonstrate it fails on perturbation (change the initializer, show the red, revert) and record the
   observed failure text in `worklog.md`.
3. Amend **D-5** in `.llm/runs/feat-sdk-procedure-meta--1466/drift.md`: it currently claims the probe
   "now supplies the independent T-2 pin". State honestly what the probe does pin (the alias spelling
   against oRPC's inference for the contracted expression — the T-2 requirement as PLAN-EVAL worded
   it) and what it does not (the divergent-initializer case, now covered by the text pin above).

### F-3 (low) — state why a test reaches into `src/`

`packages/contracts/tests/procedure-meta-inference_test.ts:7` imports `commonErrorMap` from
`../src/application/contract-primitives.ts`. After F-1 the value is private again and that internal
import is the **only** route to the real value — which is acceptable for a *test* that needs the real
value (L5 governs fixtures), but it must be stated. Add a one-line header comment saying exactly
that. Do not switch it to the public import; after F-1 there is no public import to switch to.

### F-4 (low) — the `BaseContract` row is stale

`docs/site/reference/contracts/index.md:28` documents
`type BaseContract = ReturnType<typeof oc.errors>`. `deno doc --filter BaseContract` reports
`typeof baseContract`. Update the row's signature text to what `deno doc` actually reports. The drift
tool is name-only and will not catch this, which is why it is being fixed by hand.

### F-5 (low) — the run dir is missing `supervisor.md`

`.llm/runs/feat-sdk-procedure-meta--1466/` has no `supervisor.md`, which `activation.md:57` requires.
Create it from `.llm/harness/templates/supervisor.md` carrying: the lane table for this leaf; Codex
author thread `01a0515c` (cycles 1–3, lost to host restart) and **your** thread id (cycle 4); and both
evaluator sessions — PLAN-EVAL and the IMPL-EVAL session `00ec0e55-66cd-4cd2-814e-bc5975afeab3`
(Claude Fable 5 · medium, worktree `/home/agent/projects/netscript/worktrees/ns1466-impleval`).

## Then: archive, recut, land, stop

1. **Archive before recutting.** Move the current eight `*-final.json` receipts into a new
   `receipts/frozen-235482767/` directory alongside the existing `frozen-c9a391811`. The archive is
   **append-only** — never overwrite or delete a frozen set.
2. **Recut all eight contracted receipts at your new content head**, exact-head, through
   `.llm/tools/gates/run-gate.ts`. Every receipt must satisfy `gitHead == actualGitHead` at the
   **content** head, not at a later evidence commit. Name the eight explicitly; never a glob.
3. **Supplemental evidence at the same head**, recorded under `audit/`:
   `deno task docs:exports-drift` (must be exit 0) and `deno test --allow-all packages/contracts`
   (expect 15 passed + your new assertion). Also re-record the `public-doc-lint` finding set so the
   12-and-identical claim is verifiable, not asserted.
4. Recompute sufficiency over the explicitly named eight-receipt set. It will remain `INSUFFICIENT`
   because of the two R-1 reds. **That is the correct and expected answer** — report it, do not
   engineer around it.
5. Update `worklog.md` with a cycle-4 section: what each finding's fix was, the perturbation evidence
   for F-2, the before/after doc-lint numbers, and the recut receipt head.
6. Commit, push, and **stop**. Report your head.

## Hard boundaries

No rebase, no revert, no force-push, no root-`test` retry, no `scaffold.runtime`, no `fresh-browser`.
No plan amendment, no gate-catalog edit, no change to the contracted receipt set. No merge, no
ready-flip, no label change (the stale `status:plan` on #1731 is the coordinator's to fix, not
yours), no milestone change, no issue close, no `#1348` or cluster-state mutation. Do not edit
`evaluate.md` or any frozen receipt set. Do not touch any sibling worktree.

Land what exists. A failing pinned baseline is a finding to report, not a number to adjust.
