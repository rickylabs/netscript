use harness

# #1466 repair slice — bounded SDK/doctest + adapter-boundary repair, then recut receipts

You are a **new** implementation thread for the `sdk-procedure-meta` leaf (PR #1731, issue #1466),
dispatched by topic orchestrator `topic-features-0.0.7`. The previous thread on this leaf is parked
and is never resumed. Slice 1 is already built, committed and pushed. **You are not writing slice 1
again.** You are performing one bounded repair on top of it and re-cutting its evidence.

## SKILL

Read `AGENTS.md`, then the task-relevant parts of:

- `.agents/skills/netscript-harness/SKILL.md` — slice discipline, Tier-A stops, commit trail, the
  rule that no lane self-certifies.
- `.agents/skills/netscript-doctrine/SKILL.md` — **Archetype 2**, layering, and specifically
  **AP-14 "Re-exporting upstream packages"** (`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:104-106`).
- `.agents/skills/netscript-tools/SKILL.md` — structured wrappers, `.llm/tools/gates/run-gate.ts`
  durable receipts, lock hygiene.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` + `.agents/skills/jsr-audit/SKILL.md` — the
  publish bar; both `packages/contracts` and `packages/sdk` are publishable.
- `.agents/skills/netscript-pr/SKILL.md` — the per-slice structured PR comment format.
- The leaf's own `plan.md` in the run dir — **this is the contract you are held to.** It passed
  PLAN-EVAL cycle 2 at `1df5ff3e4`. Read A-1…A-8 and the eight-receipt table before you touch code.

## Identity — verify before touching anything

| Field | Value |
| --- | --- |
| Host | NAS agent plane. Read `/home/agent/AGENTS.md` first. |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1731` |
| Branch | `feat/sdk-procedure-meta` (**no upstream by design** — I unset it deliberately) |
| Expected HEAD | `f9056f8793acbc1d95d3a10a82b875645be2637d` |
| Base | `21d516224fe35e92957f0998ee848bbf2024eda0` |
| Run dir | `.llm/runs/feat-sdk-procedure-meta--1466/` |
| PR | #1731, OPEN draft, head == local == remote == `f9056f879` |
| Push rule | explicit refspec only: `git push origin HEAD:refs/heads/feat/sdk-procedure-meta` |

Confirm `HEAD` equals `f9056f879` and the tree is clean before starting.

**Path warning.** Every `/home/codex/...` path inside the committed receipts and older run prose is
**historical** — it is the pre-migration host. Do not try to read those paths, do not "fix" them in
the frozen receipts, and do not treat their absence as a defect. Your worktree is the NAS path above.

## Base reconciliation — already done, do not rebase

I measured it: `21d516224..origin/main` (`13878a80a`) is **3 commits**, and
`git log 21d51622..origin/main -- packages/contracts packages/sdk` is **empty**, as is the
corresponding diff. The base drift is provably inert for this slice's surface. **Do not rebase and do
not merge `main`.** Holding the base fixed is what keeps the pre-repair red receipts and the recut
receipts comparable. If you believe a rebase is required, stop and report — do not do it.

## The three red receipts are deliberate evidence

`receipts/` currently holds eight receipts cut at content head `c9a391811`, five PASS and **three
terminal FAIL**: `check`, `test`, `public-doc-lint`. They were committed on purpose during the host
migration so the red evidence survived. They are **append-only**. You never edit, delete, or
overwrite them in place, and you never restate them as green.

## Scope — exactly four items, in order

### R-A — the SDK doctest guard (fixes `check` and `test`, one root cause)

`packages/sdk/tests/readme-doctest_test.ts:47`:

```ts
type BaseMeta = typeof baseContract['~orpc']['meta'];
type _EmptyBaseMetaSlotPreserved = Assert<Equal<BaseMeta, Record<never, never>>>;
```

That guard encodes the **pre-#1466** fact "the metadata slot is empty". #1466 deliberately changes it
to `NetScriptProcedureMeta & Record<never, never>`. The guard is therefore correctly red and the
repair is to re-pin it, not to delete or loosen it.

Requirements:

- Re-pin it to the **exact** position-4 type the plan commits to (A-item T-2), referenced through the
  package's **public entrypoint** — `@netscript/contracts`' `BaseContractMeta` — not by restating the
  intersection inline and not by importing an internal path.
- It must still be able to fail. `extends`, `unknown`, `any`, or dropping the `Equal<>` pin all turn a
  guard into decoration; this lane has rejected that class twice. Keep `Equal<>`.
- Prove it can fail: temporarily invert it locally, confirm `deno check` reds, revert. Report that you
  did this.
- `_BaseMetaIsNotAny` at `:46` stays as-is.
- I checked: `packages/sdk/README.md` carries no mirrored `BaseMeta` snippet, so this is test-only. If
  you find otherwise, move both in lockstep and say so.

Both the `check` and `test` receipts fail on this single `TS2344` at
`readme-doctest_test.ts:47:43`. One fix should clear both. If it clears only one, that is a finding —
report it.

### R-B — the adapter boundary, measured against the base, not against zero

I measured `public-doc-lint` with the **exact contracted 16-entrypoint argv** from
`plan.md` row 5, on both heads:

| Head | `private-type-ref` findings |
| --- | --- |
| `origin/main` `13878a80a` | **12** |
| slice head `f9056f879` | **14** |

**So `public-doc-lint` is already red on `main` itself.** The PASS receipt `plan.md` contracts was
never satisfiable by this leaf, and `drift.md` D-1's framing — that the slice broke doc lint — is
wrong. Correct it in `drift.md` with these two measurements as evidence.

Your target is therefore **not** a PASS receipt. It is: **the slice's incremental doc-lint cost is
≤ 0 relative to the base.** The whole +2 delta is one symbol. At base, `baseContract` was annotated
`ReturnType<typeof oc.errors<…>>` and cost one finding (`references private type 'oc'`). Slice 1
replaced it with an explicit `ContractBuilder<…>` annotation, which costs three:
`ContractBuilder`, `Schema`, and `BaseContractErrors`.

- `BaseContractErrors` is the cheap one and the one you should fix first: it is a **NetScript-owned**
  alias declared `export type` in `contract-primitives.ts:101` but simply absent from
  `packages/contracts/src/public/mod.ts`. Exporting it is additive, is not AP-14 (the alias is ours;
  `BaseContractRoute` already establishes that naming oRPC builder types in a NetScript-owned alias
  is the accepted public builder surface), and should clear **three** findings — the one new, plus the
  two the base already carries from `BaseContractRoute`/`BaseContractOutputRoute`. Give it real JSDoc.
  Then **verify** it does not itself introduce a fresh `private-type-ref` for `MergedErrorMap`; if it
  does, that is the finding and you report it rather than chasing it further.
- `ContractBuilder` and `Schema` are upstream oRPC types. **Do not re-export them** — that is AP-14.
  If you can reach delta ≤ 0 without them, stop there.
- Hard constraints, all from the approved plan: no type assertion of any form, no `any`, generic
  position 3 stays exactly `BaseContractErrors`, position 4 stays exactly the pinned
  `NetScriptProcedureMeta & Record<never, never>`, and the #1350 error-channel guarantee is untouched.
  If the only way to reduce the delta violates one of these, **do not do it** — report the residual.
- Re-run the committed assertion-budget scanner after your edits and report the measured numbers. A
  baseline that no longer matches is a **finding to report, not a number to adjust**.

Anything outside `baseContract`'s own annotation — `QueryClient`, `StreamsInstrumentation`,
`CrudRoute`, `AnySchema` — is **pre-existing baseline and out of bounds**. Do not touch it.

### R-C — recut the receipts at the exact repaired head

1. **Archive first, in its own commit.** `git mv` the eight current receipts into
   `receipts/frozen-c9a391811/`, unchanged. The commit message must say they are terminal evidence
   for the pre-repair head `c9a391811`, preserved append-only, and not current proof.
2. **Then commit the repair** (R-A + R-B) so there is a single, immutable content head.
3. **Then recut all eight** at that content head, into the exact paths, `gateId`s and `--id` values
   named in `plan.md`'s receipt table, via `.llm/tools/gates/run-gate.ts`, with `--attempt 2`.
   `gitHead == actualGitHead` for every one; **never** `--allow-git-head-mismatch`. Recut all eight,
   not only the three that were red — five PASS receipts cut at a superseded head are not evidence
   for the new head.
4. Recompute sufficiency yourself over the **eight explicitly named files**, never a glob. Repeated
   `gateId`s score duplicate/contradictory → INSUFFICIENT.
5. Re-run the supplemental per-package JSR audit for `packages/contracts` (you changed its public
   export surface) and record it as supplemental, explicitly outside the named eight.

`public-doc-lint` is expected to remain **FAIL**. That is fine and it is the honest result. Record it
as a terminal FAIL receipt with the base-vs-head finding-count comparison beside it, and say plainly
that the residual is the repository baseline, not this slice. Do not weaken, rename, scope down, or
omit the gate to manufacture a green.

### R-D — land the evidence, then STOP

Update `worklog.md`, `context-pack.md` and `drift.md` (D-1 corrected, plus a new entry for the base
reconciliation and one for the receipt archive/recut), push with the explicit refspec, and post a
structured slice PR comment on #1731 with the content head, the eight receipt outcomes, the doc-lint
base-vs-head numbers, and your sufficiency computation. **Then stop and report to me.** Tier-A review
is mine and IMPL-EVAL is a separate session; neither is yours to run or to pre-empt.

**Land what exists before you stop.** If you run out of room, commit and push what is built and say
what is unfinished — a red gate is still a deliverable, and uncommitted work is invisible to review.
This leaf has lost two threads at exactly the commit boundary.

## Prohibitions

Do not merge, publish, flip the PR ready, close or file issues, relabel, change the milestone, mutate
#1348 or any central cluster state, rebase, force-push, or push to `main`. Do not take an
expensive-gate lease or run `scaffold.runtime`, `fresh-browser`, Aspire, or Docker. Do not touch any
sibling worktree or another lane's branch. Preserve lock hygiene — no `deno.lock` churn without a
reviewed need, never delete a lock, never `deno cache --reload`. Do not edit the frozen receipts. Do
not start slice 2 (the SDK-side declaration propagation); this repair closes slice 1 only.

## Report back

HEAD confirmed at `f9056f879` and tree clean; the R-A fix with its can-it-fail proof; the R-B change
with base-vs-head doc-lint finding counts and the re-measured assertion baselines; the archive commit
SHA, the content commit SHA, and the recut receipt outcomes with `gitHead == actualGitHead` shown; your
sufficiency verdict over the named eight; the pushed head; the PR comment URL; and anything you found
that contradicts this brief. Then stop.
