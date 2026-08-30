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


---

# AMENDMENT — this supersedes the head and scope above

The head named earlier in this brief is stale. Evaluate **content head `b01ffcd8`**, evidence head
**`1539e81f`**. What changed since:

1. **`origin/main` was merged in** at `952cc106` (#1748's merge commit, verified `MERGED` on GitHub).
   `git merge --no-ff`, **zero conflicts**. A rebase was deliberately refused — six append-only
   receipt archives and seven review/verdict artifacts cite content-head SHAs that a rebase rewrites.
2. **The shared-asset cascade was regenerated from tooling** (`gen:agent-docs-prose`,
   `gen:assets-barrel`, `gen:mcp-export-corpus`, `gen:publish-assets`) — five machine-generated
   carriers, none hand-edited. This was required because the branch edits
   `docs/site/reference/contracts/index.md` and `packages/contracts/README.md`, both corpus inputs.
3. **All eight contracted receipts recut at `attempt 11`.**

## Two CI reds preceded this state — both branch-owned, both now repaired

- **`JSR tagline length`**: the contracts tagline was 271 B against a 250 B cap. `main` measured
  **235 B and green**, so it was this branch's. Repaired to **246 B**.
- **`Agent docs corpus freshness`**: `prose.json.gz` / `provenance.json` stale. `main` at `f8b4f804`
  measured **`fresh:true`**, so also entirely branch-owned. Repaired by the regeneration above.

**Neither gate is in the contracted eight-receipt set.** Both are green at base and branch-sensitive.
That is now the third and fourth instance of the D-27 class on this leaf.

## A defect in the supervisor's own evidence — verify the fix, and do not trust the archive

The **attempt-10** `public-doc-lint` receipt was **defective**: `argv` was the bare 3-element catalog
form `["deno","doc","--lint"]`, which exits 1 in **7 ms** with *"the following required arguments were
not provided: <source_file>"* — a **usage error recorded as a gate failure**. It was missed because
that gate is *expected* to fail, so `exit 1` looked correct.

It is retained unchanged in `receipts/frozen-75b78220/` as the record of the defect. **Do not read it
as evidence.** Verify the **attempt-11** receipt carries the plan's **19-element** argv (`plan.md:233`)
at a plausible duration, and apply the same argv/duration check to every receipt you inspect — an
`exitCode` alone cannot distinguish a real gate result from a broken invocation.

## What to verify at `b01ffcd8`

- `public-doc-lint` **12 findings with the exact R-1 set** (set identity, not count). Supervisor
  measured identical; re-derive it.
- The shared-asset carriers are **fresh**: `check:agent-docs-prose`, `check:assets-barrel`,
  `check:mcp-export-corpus`, `check:publish-assets`, `docs:tagline:check`, `docs:exports-drift`.
  Note `check:assets-barrel` necessarily fails while carriers are uncommitted — it is `gen && git diff
  --exit-code` — so run it against the committed tree.
- All eight receipts `gitHead == actualGitHead` at `b01ffcd8`; **six** archives byte-intact and
  append-only; `deno.lock` byte-unchanged.
- The merge introduced no product regression: the whole-main merge and full regeneration must not have
  moved contracts/SDK behaviour.
- **The G-1 anchored pin still goes red** under perturbation B2 plus the dead decoy. Session
  `b247bef9` did **not** get to this probe, so it is genuinely unverified at any recent head.

## Inherited measurements — from session `b247bef9`, at the older content head `75b78220`

Carried so you do not re-derive them; **re-verify anything you intend to rely on**, since the head has
moved:

- tagline **246 B**, `over=0`, judged faithful to the `NetScript-owned procedure metadata` claim with
  nothing material lost;
- `git diff 9ab779ce..75b78220 -- . ':!.llm/runs'` = `packages/contracts/README.md` only, **+3/−3**;
- `public-doc-lint` **12 = 12** with the exact R-1 set;
- five archives verified append-only via `git log --diff-filter=MD` (empty on each);
- package suites **94/94**, `quality:gate` exit 0, `docs:exports-drift` PASS, workspace and per-member
  `publish --dry-run` all green.

Its root `test` run was **killed mid-flight** and its **G-1 decoy probe never ran** — both are open.

## Rulings

1. **Does the terminal `PASS` carry forward to `b01ffcd8`?** Plainly yes or no.
2. **Is the repaired tagline acceptable** as the published JSR description, and faithful to the claim?
3. **Should `docs-tagline` and `agent-docs-prose` join the contracted receipt set?** Two
   consumer-facing defects reached a ready-flip through eight passing contracted gates.
4. **Did the whole-main merge or the asset regeneration change anything a consumer sees?**

Hard boundaries unchanged: do not fix, do not merge, do not relabel, do not flip ready, do not restore
a closing keyword — including on `PASS`. Merge authority is the coordinator's.


---

# AMENDMENT 2 — supersedes everything above, including Amendment 1

Evaluate **content head `d5f3bf4c`**, evidence head **`dbd3eafa`**. Verify all three agree with
`origin/feat/sdk-procedure-meta` and PR #1731 `headRefOid` yourself.

## Why two prior currency sessions were stopped

`main` advanced twice mid-cycle. Session `b247bef9` was stopped at `75b78220`, session `a103dbb6` at
`b01ffcd8` — both **before committing a verdict**, because certifying a superseded head is worse than
no verdict. Neither stop reflects anything wrong with those sessions.

## What changed since the terminal `PASS`

The terminal all-slices `PASS` (session `8d9946e6`) certified content heads `42874803` / `2863d29e` /
`9ab779ce`. Since then, and **only** this:

1. **A one-paragraph README repair** — the contracts JSR tagline was 271 B against a 250 B cap
   (branch-introduced: `main` measured 235 B green). Now **246 B**.
2. **Two `--no-ff` merges of `main`** — `952cc106` (#1748) then `a5520e70` (#1755). Rebase was refused
   both times: seven append-only receipt archives and eight review/verdict artifacts cite content-head
   SHAs a rebase rewrites.
3. **One cascade regeneration at the final base** — `gen:agent-docs-prose`, `gen:assets-barrel`,
   `gen:mcp-export-corpus`, `gen:publish-assets`. The second merge **conflicted in four generated
   carriers**; generated files were never hand-merged — main's side was taken, then all four
   generators re-run so tooling output is authoritative.
4. **Receipts recut at `attempt 12`.**

**No product source changed** beyond that README paragraph. Verify that claim:
`git diff 9ab779ce..d5f3bf4c -- packages plugins ':!packages/cli/src/kernel/assets' ':!packages/mcp/src/*.generated.ts'`
should show the README and nothing else of substance.

## Read receipts by argv and duration, not exitCode

The **attempt-10** `public-doc-lint` receipt was defective: bare 3-element catalog argv, `exit 1` in
**7 ms** from a *usage error*. It was missed because that gate is expected to fail. It is retained
unchanged in `receipts/frozen-75b78220/` as the record of the defect — **not** as evidence. The
attempt-12 receipt carries the plan's **19-element** argv (`plan.md:233`) at **178 ms**. Apply this
check to every receipt you inspect.

## Verify at `d5f3bf4c`

- `public-doc-lint` **12 findings, exact R-1 set**. Supervisor re-baselined against the **new** main
  `a5520e70`: head 12, main 12, set identical. Re-derive it.
- Carrier freshness: `check:agent-docs-prose`, `check:assets-barrel`, `check:mcp-export-corpus`,
  `check:publish-assets`, `docs:tagline:check`, `docs:exports-drift`. Note `check:assets-barrel` is
  `gen && git diff --exit-code`, so it necessarily fails against an uncommitted tree — run it clean.
- All eight receipts `gitHead == actualGitHead`; **seven** archives byte-intact and append-only;
  `deno.lock` byte-unchanged.
- **The G-1 anchored pin must still go red** under perturbation B2 plus the dead decoy. **No session
  has completed this probe recently** — `b247bef9` never reached it and `a103dbb6` was stopped. Treat
  it as unverified.
- Two whole-main merges plus a full regeneration must not have changed contracts/SDK behaviour.

## CI context you should not misread

At the previous head `1539e81f`, `ci` reported `failure` — but the job breakdown was `quality`
**success**, `check-test` **success**, and the sole red was **`close-gate` → "Referenced issue
acceptance gate"**. That gate fails because the PR carries `Closes #1466` while the acceptance mirror
has not run, and the mirror requires `status:ready-merge`. It is an **ordering artifact of the close
sequence, not a code defect**. Do not treat it as a substantive failure.

## Rulings

1. **Does the terminal `PASS` carry forward to `d5f3bf4c`?** Plainly yes or no.
2. **Is the repaired tagline** acceptable as the published JSR description and faithful to the
   `NetScript-owned procedure metadata` claim?
3. **Should `docs-tagline` and `agent-docs-prose` join the contracted receipt set?** Two
   consumer-facing defects reached a ready-flip through eight passing contracted gates.
4. **Did either main merge or the regeneration change anything a consumer sees?**

Boundaries unchanged: do not fix, merge, relabel, flip ready, or restore a closing keyword — including
on `PASS`.
