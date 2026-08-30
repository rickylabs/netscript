use harness

# IMPL-EVAL — #1387 Slice 2 (typed service context surface)

You are a **separate evaluator session**, opposite family to the author (Codex authored; you are
Claude). You certify or reject; you do not fix, do not commit, do not push, do not comment on GitHub,
and do not move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, already checked out at the evidence head |
| **Content head** | `f9b32b4f7a029d9226584b9c170eb44357e10fdb` |
| **Evidence head** | `be22d4b6a91623b35273db4ce9a0ab28c5b748b6` |
| Base | `5ae8270ce` |
| PR | rickylabs/netscript **#1762**, draft, `Refs #1387 — partial` |
| Plan | `.llm/runs/feat-service-principal-procedure-policy--1387/plan.md` § Slice 2 |
| Tier-A | `.llm/runs/feat-service-principal-procedure-policy--1387/tier-a-slice-2.md` |
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

1. **Ceiling.** Ten files are authorized: the nine original Slice 2 files plus
   `packages/service/src/builder/service-builder-impl.ts`, added by owner ruling (**D-4**, the same
   already-ratified shape as PLAN-EVAL's F-3). Permitted carriers: the run artifacts and the
   regenerated `export-surface-corpus.generated.ts` under the ceiling exemption. Anything else is a
   breach.
2. **Signature/generic-only.** Slice 2 changes *types*. Verify runtime composition really is deferred
   — in particular that `buildRpcContext`'s body, `wireRpc` and `registerRpcPath` gained no
   behaviour. A type-only diff that smuggles in runtime logic is the failure this check exists for.
3. **The ruled scope, met.** Class and stored factory parameterized; generic preserved through every
   fluent return; `withContext<TNext>()` widens. Judge whether the *published* surface actually
   behaves that way, not whether the diff looks plausible.
4. **LD-3.** `@netscript/service` owns `Principal` / `ServiceHandlerContext`; `@netscript/plugin`
   re-exports. Verify by gate, not by reading imports.
5. **Evidence integrity.** Every receipt must satisfy `gitHead == actualGitHead` at the content head.
   **Verify each by `argv` and `durationMs`, never by `exitCode` alone** — this lane has twice been
   burned by a receipt that exited 1 from a usage error in 7 ms and looked like a legitimate red. The
   converse also holds: a *short* duration is not proof of a replay, because `deno task check` caches
   (the 532 ms `check` here is warm; its stdout shows 198 files selected) while `publish:dry-run` does
   not. Confirm Slice 1's receipts under `receipts/slice-1-2ddd6048/` are intact and that sufficiency
   was computed over the Slice 2 named set only.
6. **The supervisor's own findings.** Tier-A raises F-1 (pre-existing 500-line WARN widened 530→542)
   and F-2 (service docs page is entrypoints-only, so drift passing ≠ prose coverage), and a tooling
   gap: `docs:exports-drift` and `check:mcp-export-corpus` have no gate-catalog entry, so neither can
   produce a durable receipt even though the plan contracts the corpus at every slice. Rule on
   whether each is correctly classified as non-blocking.

## Provenance you must weigh

The Codex author terminated **without `task_complete`**, while polling a reviewer it had dispatched
outside its brief. The supervisor committed the author's uncommitted work unchanged and then ran
Tier-A. The supervisor's claim is that the only non-author edit is a run-artifact routing label. Check
that claim against the diff. An author that never self-certified is a reason for *more* scrutiny of
the content, not less.

## Verdict

Return exactly one of `PASS`, `ACCEPTED_WITH_FINDINGS`, `FAIL_FIX`, `FAIL_PLAN`, and name the exact
head you are certifying. Findings must be concrete: file, line, and what breaks. If you cannot verify
something, say so plainly rather than passing it — an unverified claim recorded as verified is worse
than a stated gap.

**Do not run `e2e:cli`, Aspire, Docker, or any browser gate.** No runtime lease is held by this lane
and none may be acquired; a reachable DinD sandbox is not authorization.
