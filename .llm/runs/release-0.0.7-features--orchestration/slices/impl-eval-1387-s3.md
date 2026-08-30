use harness

# IMPL-EVAL — #1387 Slice 3 (typed context runtime composition)

You are a **separate evaluator session**, opposite family to the author (Codex authored; you are
Claude). You certify or reject; you do not fix, do not commit, do not push, do not comment on GitHub,
and do not move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, already checked out at the evidence head |
| **Content head** | `c297064aa76ca1b2b790f399adfb899e95c03920` |
| **Evidence head** | `248b2f062322106c2bf57e6ddd3d4e32e0b446d6` |
| Base | `8e1d639d2` |
| PR | rickylabs/netscript **#1762**, draft, `Refs #1387 — partial` |
| Plan | `.llm/runs/feat-service-principal-procedure-policy--1387/plan.md` § Slice 2 |
| Tier-A | `.llm/runs/feat-service-principal-procedure-policy--1387/tier-a-slice-3.md` |
| Receipts | `.llm/runs/feat-service-principal-procedure-policy--1387/receipts/` |

## SKILL

`netscript-harness`, `netscript-doctrine`, `netscript-tools`, `rtk`. Read the plan's Slice 2 section
and `drift.md` **D-3** and **D-4** before judging scope.

## The two heads are different on purpose

The **content** head is what you certify. The **evidence** head adds only harness artifacts; the
supervisor's claim is that it is product-neutral, evidenced by
`git diff --stat <content>..<evidence> -- packages plugins docs templates` being empty. **Re-run that
yourself** — do not take the claim on trust. If it is non-empty, the verdict is `FAIL_FIX` and you
should say exactly which product path moved.

## What to judge

1. **Ceiling.** Four files only: `packages/service/src/builder/service-builder-impl.ts` and the tests
   `service-builder_test.ts`, `handlers_test.ts`, `auth/builder-auth_test.ts`. `deno.lock` must be
   byte-identical to the base (`edfa0c24…`). Anything else is a breach.
2. **Non-mutation, actually proved.** The slice's whole point is that the composed context is a *fresh*
   object and the caller's factory result comes back untouched. Judge whether the tests prove that or
   merely assert the happy path. Consider what a test would look like if the implementation still
   mutated — would this suite fail?
3. **D-8 resolved in the right direction.** The published `ServiceHandlerContext.traceHeaders` is
   `Readonly<Record<string, string>>`. Verify the runtime can no longer produce an own key valued
   `undefined` — for `traceHeaders` and for `db`/`principal` too. Note the tests use `Object.hasOwn`,
   which is the only assertion that distinguishes "absent" from "present and `undefined`"; check that
   every absence claim uses it rather than a value comparison that the old defect would also pass.
4. **Behaviour only.** No public type or signature may have changed — a moved
   `mcp-export-corpus` would be the tell, and it passes unchanged. Confirm that independently.
5. **Evidence integrity.** Seven receipts, each `gitHead == actualGitHead` at the content head.
   **Verify by `argv` and `durationMs`, never by `exitCode` alone** — this lane has twice been burned
   by a receipt that exited 1 from a usage error in 7 ms and read as a legitimate red. The converse
   also holds: a short duration is not proof of replay, since `deno task check` caches while
   `publish:dry-run` does not. Confirm Slice 1 and Slice 2 sets are intact under
   `receipts/slice-1-2ddd6048/` and `receipts/slice-2-f9b32b4f/`, and that the top level holds only
   Slice 3's set.
6. **The supervisor's finding.** Tier-A raises F-1: the tests reach the **private** `buildRpcContext`
   via `as unknown as RpcContextBuilder`. Rule on whether that is acceptable coverage of an otherwise
   unobservable seam, or a defect that should have been solved differently.

## Out of scope by ruling

`TCustom` remains a **phantom** parameter on the public `ServiceBuilder` — mutually assignable across
instantiations. That is real and confirmed, and it is filed as **#1787**, not slice work: the only
file that could fix it is on Slice 2's ceiling and on no later slice, and giving the parameter a
consumer position would make it invariant, a breaking change. Do not fail this slice for it. Do say so
if you think the deferral is wrong.

## Provenance you must weigh

This slice stopped **twice** before succeeding, both times because the supervisor's brief was wrong —
first by demanding a fix its ceiling could not reach (E-2), then by offering a false binary on the
`traceHeaders` mismatch that omitted the correct third option (fixing the runtime). Both stopping
authors were right to stop. The third dispatch did the work. Judge the code on its merits; the history
is here so you do not mistake the drift entries D-7 and D-8 for defects in this content.

## Verdict

Return exactly one of `PASS`, `ACCEPTED_WITH_FINDINGS`, `FAIL_FIX`, `FAIL_PLAN`, and name the exact
head you are certifying. Findings must be concrete: file, line, and what breaks. If you cannot verify
something, say so plainly rather than passing it — an unverified claim recorded as verified is worse
than a stated gap.

**Do not run `e2e:cli`, Aspire, Docker, or any browser gate.** No runtime lease is held by this lane
and none may be acquired; a reachable DinD sandbox is not authorization.
