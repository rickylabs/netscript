use harness

# Renewed exact-head IMPL-EVAL currency — #1466, PR #1731 after the tagline repair

You are a **fresh, separate** `formal_impl_evaluation` session (Claude **Fable 5 · medium**, native
opposite-family per `lane-policy.md:46`). You did not author this and you must not fix it.

**This is a currency renewal, not a re-evaluation from scratch.** A terminal `PASS` already exists for
this leaf; a single-line docs repair moved the content head out from under it. Your job is to decide
whether that verdict still holds at the new head, and to say so at a head a coordinator can merge.

## Where to work

Your **own detached worktree** — do not touch `/home/agent/projects/netscript/worktrees/007-leaf-1731`
(D-19). Establish the head yourself from live git and GitHub; do not trust a SHA in this brief.

## What happened

The prior terminal `PASS` (session `8d9946e6`, appended to `evaluate.md`) certified evidence head
`e34505f1` and content heads `42874803` (S1), `2863d29e` (S2), `9ab779ce` (S3). It was **correct and
is not being reopened**.

After the ready-flip, CI run `33311482503` job `99257258418` (`quality`) failed on step
**`JSR tagline length`**: `packages/contracts/README.md` was **271 B against a 250 B cap**. Measured
attribution — `origin/main` `13878a80a` runs the same gate at **over=0** with a **235 B** tagline, so
slice 1's insertion of `NetScript-owned procedure metadata, ` is what took it over. Branch-introduced
and consumer-facing: that paragraph becomes the JSR package description, so 21 bytes over means the
registry truncates it.

**Note the evidence-set gap** — `docs-tagline` is **not** among the plan's contracted eight receipts,
is green at base, and is branch-sensitive. That is the D-27 class the leaf already recorded once: a
gate the set was structurally unable to see.

**Repair** (content head `75b78220`, one file, one paragraph): trimmed to **246 B** by removing only
stylistic words (`The`, `-backed`, `handlers`, `typed`), preserving every semantic element of `main`'s
tagline **plus** the `NetScript-owned procedure metadata` ownership claim that slice 1 added.

All eight contracted receipts were re-cut at `75b78220` (`attempt 10`), and the slice-3 set archived
append-only to `receipts/frozen-9ab779ce/` — the fifth archive.

## What to verify — bounded to what the repair could have affected, plus the standing invariants

1. **The tagline itself.** `deno task docs:tagline:check` → `over=0`. Measure the byte length yourself
   and confirm it is ≤250. Confirm the **contract claim survived**: the tagline must still state
   NetScript ownership of procedure metadata. If you judge the trim lost something material, say so —
   that is the one substantive risk in this change.
2. **Nothing else moved.** `git diff 9ab779ce..75b78220` must be exactly the one README paragraph.
   Verify no product, test, receipt, or archive byte changed.
3. **The standing invariants still hold at `75b78220`:** `public-doc-lint` **12 with the exact R-1
   set** (set identity, not count); `docs:exports-drift` exit 0; package suites; root `test` a real
   PASS with no `SKIPPED`; all eight receipts `gitHead == actualGitHead` at the content head; five
   archives byte-intact and append-only; `deno.lock` byte-unchanged.
4. **Publish surface.** The tagline feeds the JSR description, so re-run the per-member
   `deno publish --dry-run` and confirm nothing about the published surface changed.
5. **Spot-check that the prior PASS still stands.** You need not redo its seven S2 mutations, but do
   confirm the G-1 anchored pin still goes red under the decoy forgery at this head — a cheap check
   that the tree is the one that was evaluated.

## What to rule

1. **Does the terminal `PASS` carry forward to `75b78220`?** Yes or no, plainly. If yes, this leaf is
   merge-ready on evidence and you should say so at an exact head.
2. **Is the repaired tagline acceptable** as the package's published description — both under the cap
   and faithful to the contract claim?
3. **Should `docs-tagline` join the contracted receipt set** for future leaves, given it caught a
   branch-introduced consumer-facing defect that eight contracted gates missed?

## Deliverable

**Append** to `evaluate.md` — never rewrite a predecessor's section; three evaluators have appended so
far. Record immutable identity, what you re-measured, your rulings, findings if any, and a verdict.
Commit **evidence-only** and push by explicit refspec. Report your head.

## Hard boundaries

- **Do not fix anything.** Findings with required actions; revert any perturbation and prove the tree
  clean.
- No merge, ready-flip, relabel, milestone change, issue close, acceptance-box ticking, or PR body
  edit — **including on `PASS`**. Merge authority is the coordinator's, exercised after the milestone
  pre-merge gate.
- No `e2e:cli`, Aspire, Docker, or browser gates; no runtime lease is held.
- Do not edit product code, tests, receipts, archives, `plan.md`, `supervisor.md`, or any predecessor
  verdict. Do not touch `deno.lock`.
