use harness

# Slice brief — #1580 regenerate the stale `packages/fresh-ui` private lock

**Codex · GPT-5.6 Sol · low** (`light_implementation`). **P0 release blocker.** The diagnosis and the
exact expected delta are already established — implement and prove. Do not re-diagnose.

| Field | Value |
| --- | --- |
| Issue | **#1580** (`priority:p0`) |
| Worktree | `/home/codex/repos/ns006-1580` |
| Branch | `fix/1580-fresh-ui-private-lock` |
| Base | **`main@db1d79c68`** — current main, already checked out |
| Deno | **repo-pinned 2.9.5** — confirm `deno --version` before starting |

## SKILL

- `netscript-deno-toolchain` — **read first.** Lock semantics; why a lock is generated, never edited.
- `netscript-tools`, `netscript-pr`.

## The defect

`packages/fresh-ui` keeps its **own private lock** (`packages/fresh-ui/deno.lock`) and runs frozen
against it (`packages/fresh-ui/deno.json:42`, task `check`, `--lock=deno.lock --frozen`).

#1558 added a direct `@fresh/plugin-vite@^1.1.2` dependency to `packages/fresh`. The fresh-ui private
lock was never regenerated, so it is stale and its frozen check fails.

**Reproduced by the orchestrator at `db1d79c68`:**

- `deno task check` in `packages/fresh-ui` → **`failedBatches: 2`** of 2. Stale, as claimed.
- The canonical `deno task lock:update` (`deno.json:43`) generates **exactly one line**:
  ```
  + "jsr:@fresh/plugin-vite@^1.1.2",
  ```
  `git diff --numstat` → **`1  0`**. **No other movement.**

This is the **same root-cause class** as root-lock PR #1572, in a different lock file. It is a
**separate** PR: **do not touch the root `deno.lock`**, and do not rebase onto or otherwise disturb
#1572's branch — its evaluated head must not move.

## What to do

1. Run the **canonical** task from `packages/fresh-ui`:
   ```bash
   deno task lock:update
   ```
   **Generated, never hand-edited.** Do not delete the lock, do not `deno cache --reload`, and do not
   edit `deno.lock` in any editor.
2. **Confirm the delta is exactly the expected one line** — `+ "jsr:@fresh/plugin-vite@^1.1.2",`,
   numstat `1 0`, in `packages/fresh-ui/deno.lock` only.
   **If your delta differs in any way, stop and report.** A larger delta means unrelated dependency
   movement, which must not land in a p0 lock correction.
3. **Prove the private frozen check now passes:**
   ```bash
   cd packages/fresh-ui && deno task check
   ```
   It must report `failedBatches: 0`. Paste the output.
4. **Prove second-run byte stability.** Record `sha256sum packages/fresh-ui/deno.lock`, run the
   private `check` (and `deno task test` if it is part of the package's gate set) **a second time**,
   then record the hash again. **The two hashes must be identical**, and `git status --porcelain` must
   be empty. Paste both hashes — a byte hash, not "the diff looked empty".
5. **Prove the workflow gate is green** — the `fresh-ui-quality` workflow is what this unblocks.
   Run whatever local equivalent that workflow invokes and paste the result.

## Commit trail

Open a **draft PR against `main`** in the same session as your first commit. Title:
`fix(fresh-ui): regenerate the stale private lock for the plugin-vite dependency`.
Body per `netscript-pr`, with **`Closes #1580`** in `## Scope` — this PR *does* fully resolve #1580,
unlike the root-lock PR whose acceptance depends on a post-merge canary.

Include your pasted evidence: the one-line delta, `failedBatches: 0`, and both sha256 hashes.
**Do not emit an `acceptance-evidence` block with an empty entry list** (#1561). Map #1580's real
boxes with `box-index` entries.

Labels `type:fix`, `area:fresh-ui`, `priority:p0`, `status:impl`, milestone `0.0.6`.
Push by explicit refspec; post a `[PHASE: IMPL]` comment with commit hash and gate output.

## Evaluation

**PLAN-EVAL: N/A** — a one-line deterministic derived-lock correction with the delta already measured.

**IMPL-EVAL: skipped via the documented escape hatch.** The orchestrator applies the `impl-eval:skip`
label; the dispatcher records an attributed skip. This is the owner-authorized path for a one-line
deterministic lock regeneration — **you do not flip the PR to ready**, and you do not trigger any
evaluation yourself. No manual OpenHands.

## Reporting contract

Report: the exact numstat, the added line verbatim, `failedBatches` before and after, both sha256
hashes, the workflow-gate result, and **anything that surprised you**. A delta that is not exactly one
line is a **stop-and-report**, not something to reconcile by editing the lock.

Merge is the orchestrator's.
