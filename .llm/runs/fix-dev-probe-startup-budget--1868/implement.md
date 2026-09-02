use harness

# Leaf brief — #1868 · the dev probe counts dependency verification against its HTTP budget

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1868`
- Branch: `fix/dev-probe-startup-budget` @ **`82a2527e2`** (exact `main`)
- Run dir: `.llm/runs/fix-dev-probe-startup-budget--1868/`
- Push: explicit refspec — `git push origin HEAD:refs/heads/fix/dev-probe-startup-budget`
- Closes exactly **#1868**. Priority **p1**.

## SKILL

Harness workflow per `.agents/skills/netscript-harness` + `.llm/harness/`. Also
`.agents/skills/netscript-cli` (E2E gate surface), `.agents/skills/netscript-tools` (structured
wrappers are the verdict source), `.agents/skills/netscript-pr`.

## Read the issue in full first

`gh issue view 1868`. Do not re-derive the diagnosis; it is measured and recorded there.

Summary: `behavior.project-boundary-dev` starts a **60 s** deadline before launching the whole
generated `dev` chain. That chain runs dependency closure and an O(files) node-modules verification
before Vite starts. On NAS storage a retained fixture walked 638 packages / 42,053 files, the
verifier consumed the entire budget, the child was still running, Vite never started — and the probe
reported `Fresh dev server failed: fetch failed`, misclassifying slow preflight as a server failure.
Historic good receipts finish in 13.6–27.2 s, so this is host load, not a product defect.

This is **not** #1601 (that is a registry/materialization failure); same defect family only.

## Required change

1. Replace the magic total-chain deadline with a **named** host-tolerant startup budget of **at least
   the established 180 s tier**. Name the constant; do not leave a bare literal.
2. **Preserve immediate failure when the child exits** — a real crash must still fail promptly with
   its actual exit status, not wait out the new, longer budget. This is the property most at risk
   from simply raising a number, so make it explicit and test it.
3. **Report truthfully.** A startup/preflight timeout must be distinguishable in the output from a
   Fresh server failure. The current message actively misleads; that is half the cost of this defect.
4. Preferred if it stays bounded: separate **dependency-preflight timing** from **Vite HTTP
   readiness**, so the two phases have their own budgets and their own messages.

**Out of scope — do not absorb:** verifier optimization or memoization, and any change to the
dependency-closure implementation itself. If you conclude the repair needs either, stop and report.

## RED → GREEN

1. **RED, tests only, zero product files**: a focused regression that reproduces the slow-preflight
   case **without sleeping for the full production timeout** — inject a slow preflight via a seam or
   a fake clock. A test that actually waits 180 s is not acceptable.
2. **GREEN**: the budget/reporting change.
3. Record both SHAs and observed RED counts in `worklog.md`.

Tests must cover: slow preflight no longer consumes the HTTP readiness budget; a child exit still
fails promptly with its real status; and the timeout message distinguishes preflight from server
failure.

## Ceiling

The probe and its test, plus the run dir. Confirm the exact paths from the issue's evidence section
before editing, and report before touching anything else. **Do not** modify `deno.lock`; if it moves,
stop and report. **Do not** run `deno task e2e:cli` — no runtime lease; hosted CI owns that.

## PR — required on your FIRST commit

Open the PR as a **draft as soon as your first commit exists**, not at the end. Coordinator
requirement: this leaf must be visible from its first commit.

Labels `type:test, area:cli, area:tooling, gate:e2e, priority:p1, orchestrator:fixes, ci:full`,
milestone `0.0.7`, body containing **`Closes #1868`** verbatim, plus the acceptance checklist from the
issue left **unticked** — the supervisor mirrors acceptance; never hand-tick.

Report the RED/GREEN SHAs, the PR number, and gate exit codes. Do not mark ready-for-review or merge.
