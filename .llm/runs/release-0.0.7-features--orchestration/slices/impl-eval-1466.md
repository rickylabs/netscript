use harness

# IMPL-EVAL — #1466 / PR #1731, `NetScriptProcedureMeta` slice 1

You are the **formal IMPL-EVAL** for this leaf: a fresh, separate, opposite-family session. The
generator is Codex (`gpt-5.6-sol`, thread `01a0515c`); you are Claude Fable 5 · medium on the
`formal_impl_evaluation` lane. You did not write any of this and you do not fix it — you rule on it.

## SKILL

Read `AGENTS.md`, then:

- `.llm/harness/evaluator/protocol.md` — **your protocol**; it defines the verdict vocabulary.
- `.agents/skills/netscript-harness/SKILL.md` — evaluator separation, receipts, commit trail.
- `.agents/skills/netscript-doctrine/SKILL.md` — Archetype 2, layering, and **AP-14
  "Re-exporting upstream packages"** (`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:104-106`).
- `.agents/skills/jsr-audit/SKILL.md` + `.agents/skills/netscript-deno-toolchain/SKILL.md` — the
  publish bar; both packages are publishable.
- `rfcs/0001-sdk-client-contributions.md` stage 1b boundary.

## Identity

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/ns1466-impleval` — **detached at the head below, deliberately not the author's worktree** |
| Head under evaluation | `fc81e652019c9cebf9bdc7958414082473b3b06d` (local == remote == PR head) |
| Base | `21d516224fe35e92957f0998ee848bbf2024eda0` |
| `main` | `13878a80a50c55b9662099fed64555f2310ae4a3` |
| PR | #1731, OPEN draft |
| Run dir | `.llm/runs/feat-sdk-procedure-meta--1466/` |
| Your output | `evaluate.md` in that run dir — commit it, push it, and post the structured PR comment |

Verdict vocabulary: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, `FAIL_DEBT`. Two failures then escalate.

Do not write into the author's worktree `/home/agent/projects/netscript/worktrees/007-leaf-1731` —
cross-owner contamination is a recorded defect in this run (D-19).

## What to evaluate against

`plan.md` is the contract, as amended by A-1…A-8 and PLAN-EVAL cycle 2 `PASS` (`1df5ff3e4`). Read
`research.md`, `plan.md`, `plan-eval.md`, `worklog.md`, `drift.md`, `context-pack.md`, the PR's commit
list and its per-slice comments. #1466 acceptance has six points; points 2, 3 and 4 are the ones that
have historically been faked in this lane.

## Three rulings this gate exists to make

These are not defects handed to you — they are decisions the implementation lane is not permitted to
make for itself.

**R-1 — do two terminal FAIL receipts block this slice?** Sufficiency is honestly `INSUFFICIENT`.
Both reds have proven external causes:

- `public-doc-lint` — I ran the plan's exact 16-entrypoint argv on both heads: `main` = **12**
  findings, this head = **12**. The gate is **baseline-red on `main`**, so the contracted PASS was
  never satisfiable by any change this leaf could make. Incremental cost is **0**.
- root `test` — 4,248 passed, **1** failed: `.llm/tools/agentic/claude/hybrid-launcher_test.ts`. This
  host has **7,733 PID-1-owned zombies**, and that test checks liveness at `:167` with
  `Deno.kill(descendantPid, 0)` — which **succeeds on a zombie**, because a zombie holds its PID
  until reaped. A correctly-exited descendant therefore still reads as alive. The assertion cannot
  pass on this host at any code state. The leaf's diff touches **zero** files under `.llm/tools`.

Verify both for yourself — re-run the doc-lint argv on this head and on `main`, and read
`hybrid-launcher_test.ts:160-180`. Do not take my numbers on faith; that is the point of this gate.

**R-2 — is `commonErrorMap` an acceptable public surface?** It is now an exported **mutable
singleton** backing every contract in the workspace. `Readonly<>` stops TypeScript consumers; nothing
stops a JavaScript one. It was published to clear a `private-type-ref` finding, not for a stated
consumer need. It is documented as read-only-by-contract rather than changed. Rule on it.

**R-3 — should `docs-exports-drift` join the contracted gate set?** The plan contracts
`public-doc-lint`, which is baseline-red and cannot signal a regression by construction, while
`deno task docs:exports-drift` is **green on `main`**, detects this leaf's public-surface growth
exactly, and is **absent** from the set. It was red on every head of this branch from the first
content commit until cycle 3 and nobody saw it, because the evidence set could not. It is now green
(CI run `33299010706`) and captured as supplemental evidence. Adding it to the set was **proposed,
not applied** — the plan is PLAN-EVAL-approved and neither the supervisor nor the implementer amends
it. Rule.

## Verify the substance, not the paperwork

The findings this lane keeps catching are guards that cannot fail. Two are directly in scope:

1. **The exactness probe.** `packages/contracts/tests/procedure-meta-inference_test.ts` exists
   because the earlier guard was a tautology: `baseContract` is annotated
   `ContractBuilder<…, BaseContractMeta>` and upstream declares `'~orpc': ContractBuilderDef<…,
   TMeta>`, so `Equal<typeof baseContract['~orpc']['meta'], BaseContractMeta>` compared the
   annotation to itself. I proved it with a probe where an annotation of `Meta1` over an initializer
   producing `Meta2` type-checks at exit 0. **Confirm the replacement is genuinely non-tautological**
   — that nothing annotates `inferredBaseContract` — and **make it fail**: perturb the expected type,
   observe the `TS2344`, restore. A probe you did not break is a probe you did not verify.
2. **The same tautology may remain elsewhere.**
   `packages/contracts/tests/type-fixtures/procedure-meta_type.ts` still carries
   `_BaseMetaRemainsExact`, `_InputOutputRouteMetaRemainsExact`, `_OutputRouteMetaRemainsExact` and
   two `…ErrorsRemainExact` assertions that read annotation-derived types on both sides. I judged
   them redundant-but-harmless once the inference probe exists. **Test that judgement** rather than
   inheriting it.

Then the acceptance points that carry real risk:

- **Point 2 — error literals preserved end to end.** `CommonErrorMap`'s `data` fields were widened
  from `typeof <zodSchema>` to `ContractObjectSchema<T, T>`. Does the #1350 repair still hold through
  `safe()` and `isDefinedError`? My reading is that the doctest pins error data against
  `ContractSchemaOutput<typeof NotFoundErrorSchema>` — the exported schema, independent of
  `CommonErrorMap` — so it would have gone red had the output types moved. Check it.
- **Point 3 — no casts or `any` at the metadata boundary.** The assertion-budget test is the
  mechanical guard. Re-run its committed scanner and confirm the pinned baselines are what it
  measures, not what was copied into the plan.
- **Point 4 — fixtures exercise real exports.** The inference probe deliberately imports
  `commonErrorMap` from the **internal** application module because inference needs the real value.
  Is that acceptable, or does it weaken the real-exports requirement?
- **Point 5 — public docs explain ownership and compatibility.** Six symbols now documented in
  `docs/site/reference/contracts/index.md`. Is each ownership and compatibility rule accurate, or
  merely present?

## Also worth your attention

Four content heads and three repair cycles sit under this PR, and the receipt set was recut at each
(`frozen-c9a391811/` holds the append-only originals, including three deliberate reds). Confirm the
attempt-4 set attests the **current** content head and that no superseded receipt is being counted.
The base is 3 commits behind `main`; I measured that drift as inert for this surface
(`git log 21d51622..origin/main -- packages/contracts packages/sdk` is empty) and no rebase was done.
Check that reasoning.

## Prohibitions

Do not implement, fix, or "just correct" anything — a substantive finding returns to the author, not
to your editor. Do not merge, publish, flip the PR ready, relabel, change the milestone, close or
file issues, mutate `#1348` or central cluster state, take an expensive-gate lease, or run
`scaffold.runtime` / `fresh-browser` / Aspire / Docker. Do not run additional root-`test` retries:
that red is a ruled host baseline, and retrying burns gate time without moving it. Do not touch the
author's worktree. Preserve lock hygiene.

## Deliverable

`evaluate.md` with an explicit verdict, R-1/R-2/R-3 each ruled with file/line evidence, and every
acceptance point addressed. Rule on everything routed to you and hand nothing back as a question —
the previous PLAN-EVAL set that standard here, and it is the reason this leaf is in the state it is.
Commit, push, post the structured `[PHASE: IMPL-EVAL] [VERDICT: …]` PR comment, and stop.
