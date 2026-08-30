use harness

# IMPL-EVAL — #1387 Slice 7 (MCP access result contract)

You are a **separate evaluator session**, opposite family to the author (Codex authored; you are
Claude). You certify or reject; you do not fix, do not commit, do not push, do not comment on GitHub,
and do not move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, already checked out at the evidence head |
| **Content head** | `897a06cd7170ca021da1836b3cbcbf790cf97a2f` |
| **Evidence head** | `f60c851991b82834366b6d45dbe24c7b9cc9d7d8` |
| Base | `ae90bb264` |
| PR | rickylabs/netscript **#1762**, draft, `Refs #1387 — partial` |
| Plan | `.llm/runs/feat-service-principal-procedure-policy--1387/plan.md` § Slice 7; `research.md` findings 11–13 |
| Tier-A | `.llm/runs/feat-service-principal-procedure-policy--1387/tier-a-slice-7.md` |
| Receipts | `.llm/runs/feat-service-principal-procedure-policy--1387/receipts/` |

## SKILL

`netscript-harness`, `netscript-doctrine`, `netscript-tools`, `rtk`.

## What to judge

1. **Ceiling.** All five authorized files: `operation-access.ts` (new), `tool-contracts.ts`,
   `list-service-operations-flow.ts`, `get-operation-schema-flow.ts`, `openapi-projection.ts`. Plus
   the corpus carrier and the Slice 6 receipt archive move. `deno.lock` byte-identical.
2. **Bounded and credential-free, actually.** `OperationAccessSummary` must not carry credential
   values or principal data — verify by reading the type, not by trusting its name. Check it is
   genuinely a *projection* (a new, deliberately narrow type) rather than a re-export or structural
   copy of the internal `packages/service` `ProcedureAccessPolicy` shape — the plan requires MCP not
   import from `packages/service` for this.
3. **Genuinely optional, in both places.** `access?:` on both TypeScript result interfaces, **and**
   absent from both JSON-schema `outputShapes` required-field arrays. A field that's optional in one
   representation but effectively required in the other would be a real defect — check both.
4. **No population — verify by absence of logic, not by trusting the claim.** Read both flow files'
   full diffs (not just the added lines) and confirm no code path computes or assigns to `access`
   anywhere. Confirm `authNote`'s existing behavior is byte-for-byte unchanged.
5. **Constructibility proof.** `operationAccessExample: OperationAccessSummary` is claimed to be a
   real typed literal wired into the schema's `examples`. Confirm the type annotation is present and
   would actually fail to compile if the interface changed incompatibly — not `as OperationAccessSummary`
   or `unknown`.
6. **Corpus delta.** 7 654 → 7 655, claimed to be exactly the one new exported type. Verify — decode
   or diff the corpus entries directly rather than trusting the count alone; confirm no unrelated
   symbol moved.
7. **Evidence integrity.** Eight receipts, each `gitHead == actualGitHead` at the content head.
   Verify by `argv` and `durationMs`, never `exitCode` alone. Confirm Slices 1–6's archived receipt
   sets are intact and untouched, and the top level holds only Slice 7's set.

## Verdict

Return exactly one of `PASS`, `ACCEPTED_WITH_FINDINGS`, `FAIL_FIX`, `FAIL_PLAN`, naming the exact head
you certify. Findings must be concrete: file, line, what breaks. State plainly anything you could not
verify.

**Do not run `e2e:cli`, Aspire, Docker, or any browser gate.** No runtime lease is held by this lane
and none may be acquired.
