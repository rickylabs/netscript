use harness

**PLAN-EVAL cycle 5**, NetScript 0.0.5 milestone plan. Same session; generator is Claude · Opus 5 ·
high.

## Scope — one finding

Cycle 4 left exactly one blocker: four F-manifest rows named a closing event that can occur while
the issue stays acceptance-incomplete. Those four rows are rewritten in `plan.md` § v4.3's manifest
table, with the reasoning in § `## v4.4 — the closure rows are now outcome-qualified`.

**Evaluate exactly that, plus anything the edit broke.** Do not re-verify what cycles 3 and 4
already marked `FIXED`: the scope arithmetic, #1169's and #1126's moves, #1004's rule, #1379's
option (b), the trace timestamps and evaluated-through marker, `research.md`'s re-baseline, W3's
sub-order, the nine-issue move receipt, the phase-registry Plan row, or the superseding-table
mechanics. The Plan-Gate subject remains owner-ratified: milestone-level clusters, waves, canaries,
preconditions, closure. Per-group slice tables live in group briefs and take their own PLAN-EVAL.

Worktree `/home/codex/repos/ns005-planeval-v4`, read-only, current HEAD. Do not enter `ns005-w2a`,
`ns005-w2b` or `ns005-w2c` — live Codex sessions own them, and W2-A is mid-runtime-gate.

## What to check

For each of **#1090, #1166, #1197, #1208 Phase 2**, compare the manifest row against the **live**
issue body (`gh issue view <n> --json body`):

1. Does the row's closing event now require **every** acceptance row the issue lists — not a
   superset that is unreachable, and not a subset that closes early?
2. Is the admissible evidence sufficient to demonstrate that event, and does it name the specific
   artifact rather than a category?
3. Is the non-occurrence disposition complete — is there a state in which the row neither closes nor
   moves? #1208 Phase 2 is the one that failed this in cycle 4; check the other three did not
   acquire the same defect.
4. For #1197 specifically: the issue offers **alternatives** ("non-zero usage **or** the MCP server
   is not installed by default"; "flows through the gated path **or** the gate is removed"). Does
   the row preserve those as genuine alternatives, or has it hardened one branch into a requirement
   the issue does not impose?

Then: do the four untouched rows (#1004, #1333, #1338, #1343) still hold, and did the edit introduce
any inconsistency with the receipt, the phase registry, or the group table?

## Output

Write to `.llm/runs/release-0.0.5--orchestration/plan-eval-v44.md` and print it. Verdict line, a
four-row disposition table, then any surviving or new finding with evidence and the concrete change.
Verdict is exactly `PASS` or `FAIL_PLAN`.

No praise, no hedging. Four cycles of real findings means this plan has been worth evaluating; it
does not mean a fifth finding must exist. If these four rows are now truthful and nothing broke, say
`PASS` and name what you checked.
