# Context pack — topic-docs-0.0.7

**Lane status: ACTIVE — shipping.** This file was previously and wrongly marked
`EXHAUSTED / PARKED` with "no docs-lane issues open"; that was stale by an entire work programme.
Reconciled against live GitHub on 2026-08-31.

## Anchor facts

| Fact | Value |
| --- | --- |
| Current `main` | `584caa03f474de36b2d6e62e7162ab410c6ccb59` (merged #1798) |
| Supervisor | native Claude Opus 5 · high |
| Topic branch | `orchestrator/release-0.0.7-docs` — push by explicit refspec only |
| Authoritative queue | every open item labelled `orchestrator:docs` — **10 issues + 11 PRs** live |
| Merge authority | primary milestone coordinator merges; this supervisor **never** merges |
| Ownership labelling | `orchestrator:docs` is applied **when the leaf PR is opened** (in the `gh pr create` call), never at finalization — deferring it hides in-flight leaves from every orchestrator-keyed audit. `status:` transitions remain supervisor-owned. |
| Evaluator route (post-#1792) | OpenRouter · **GLM 5.3 Flash** · `max` for IMPL-EVAL; **Qwen 3.8 Flash** · `max` for PLAN-EVAL when warranted. **No DeepSeek for new dispatches.** Existing DeepSeek receipts remain valid and are never re-run. |
| Evaluator transport | `deno task agentic:claude-openrouter` → `.llm/tools/agentic/claude/openrouter-run.ts`. **Must be launched from a tree containing #1792**, because `claude-print.ts`'s guard reads `OPEN_EVALUATOR_MODEL_IDS` from the *checked-out* tree; launching from a pre-#1792 PR head yields a false `evaluator model request denied`. |

## Shipped this programme

`#1794` (5 packages) → `#1790` → **#1796** (`plugin-ai-core`, main `6bb27e46a`) → **#1798**
(`plugin-streams-core`, main `584caa03f`). Umbrella **#1777** stays open until all slices land.

## Ordered shared-corpus seam — the core sequencing constraint

Every `docs:exports-drift` slice mutates the **same four derived artifacts**
(`.llm/assets/agent-docs/{prose.json.gz,provenance.json}`,
`packages/cli/src/kernel/assets/agent-docs.generated.ts`,
`packages/mcp/src/publish-assets.generated.ts`) **and** the same
`AUTHORITATIVE_MAPPING` array. They therefore conflict pairwise and **must merge serially**.

**Convergence recipe (do not deviate):**

1. Reset the branch to current `main`.
2. Restore *only* the PR's own source: its docs page + its run directory.
3. **Take `check-exports-drift.ts` from current `main` and insert only this PR's own mapping block.**
   Never restore that file wholesale from the PR — its pre-merge copy will silently **drop rows that
   landed meanwhile**. A dropped row still type-checks and passes every docs gate, because removing a
   row only *reduces* what is policed. Assert every previously-merged row is still present afterwards.
4. Regenerate in order: `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`.
   Never hand-merge — one artifact is a gzip binary.
5. Verify `provenance.json.sourceCommit` is a true ancestor of the new head.
6. Verify the docs page is **byte-identical** to the evaluated head — that is what lets an existing
   IMPL-EVAL PASS carry forward without a re-run.
7. Hygiene: `git diff --check $(git merge-base origin/main HEAD) HEAD`.

## Two methodology errors to not repeat

- **`git diff --check` run bare after committing is a no-op** (working tree vs index) and returns 0.
  It concealed real trailing-blank-line violations on #1798/#1800/#1803/#1806/#1818 and produced two
  false "clean" claims in handed packets. Always use the base-relative form above. CI does **not**
  enforce this; the coordinator's premerge audit does.
- **`gh run rerun` replays the same commit** and cannot pick up a repaired base. Close/reopen also
  proved unreliable (it races the merge-ref recompute). The only reliable way to get a current-base
  `check-test` is to **converge onto current main and push a new head**.

## Live queue — reconciled from GitHub

### Merge packets handed, awaiting coordinator

| PR | Closes | Exact head | State |
| --- | --- | --- | --- |
| **#1800** | #1799 | `e122495cb7c0c61ea965e93323ea446d2be3aa79` | CLEAN, all checks pass, mapping 22 rows |
| **#1806** | #1804 | `b89a242a737b992a651511a42a6d81f215b067f2` | CLEAN, all checks pass, GLM PASS carried forward |

### Evaluated PASS, needs convergence onto post-merge main

| PR | Closes | Head | Evaluator |
| --- | --- | --- | --- |
| #1803 | #1801 | `842ee3ede` (DIRTY) | GLM 5.3 Flash max — PASS, 56-symbol gap set-equal |
| #1808 | #1807 | `eafc1bba4` (DIRTY) | GLM 5.3 Flash max — PASS, 270 symbols / gap 157, root+public+builders 0-missing |

### Converged, awaiting evaluation

| PR | Closes | Head |
| --- | --- | --- |
| #1811 | #1809 | `6d5516422` |
| #1813 | #1812 | `e937b11b6` |
| #1816 | #1815 | `97d0801af` |
| #1818 | #1817 | `f09cb03d6` — also has 3 pending whitespace fixes |

### Outside-0.0.7 intake (converged, no milestone — they close no 0.0.7 issue)

| PR | Head | State |
| --- | --- | --- |
| #1522 | `49b1c1390` | CLEAN — DevTools RFC closeout; add-only + current-safe FILING-LOG/context merge |
| #1640 | `d63a95e9a` | CLEAN — Prisma 8 RFC; was 55 commits behind, converged, 44 files byte-identical |

### Newly assigned, not yet started

- **#1756** (`303be12ea`, DIRTY) — JSDoc `@example` compile gate for issue **#1533**. Has its own
  worktree `007-leaf-1533` and a recorded PLAN-EVAL. Reuses #1374's landed machinery
  (`snippet-compiler`/`snippet-policy`/`snippet-workspace` are directly reusable; only a JSDoc-block
  sibling extractor plus symbol-injection and the import-specifier rule are new).
- **#1533** (`status:triage`) — the issue behind #1756.
- **#1777** — umbrella; keep open until every slice merges.

## Known recurring hazards

- **Label race**: an external automation repeatedly flips `status:ready-merge` → `status:impl-eval`
  mid-run, which makes `close-gate` skip the acceptance mirror. Re-check the live label immediately
  before relying on any CI run's label read. Has recurred 5+ times.
- **Worktree contention**: converging in the same worktree an evaluation is using re-points the tree
  under the evaluator. Both #1806 and #1808 evaluators had to self-rescue into detached checkouts.
  **Allocate a separate worktree per concurrent evaluation** (`007-conv-*`, `007-eval-*`).
- **Codex `acceptance-evidence` backtick drop**: implementers repeatedly strip the leading backtick
  from the first identifier in a `box:` string, which breaks the exact-match mirror. Verify box text
  character-for-character against the issue before promoting.

## Exact next actions

1. On merge of #1800 → converge **#1803** onto the new main (mapping cumulative + strip its 4 blank
   lines), recut CI, hand packet. Its PASS carries forward.
2. Then **#1808** (PASS already held) — same recipe.
3. Then evaluate **#1811 → #1813 → #1816 → #1818** on GLM 5.3 Flash max, each converged first so the
   evaluation runs against the head that will actually merge.
4. **#1522** and **#1640** are converged and green — hand as packets when the coordinator wants them.
5. Then **#1756/#1533**.
