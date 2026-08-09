use harness

**PLAN-EVAL cycle 4**, NetScript 0.0.5 milestone plan. Same session; the generator is still Claude ·
Opus 5 · high.

## Scope — narrow, and deliberately so

Cycle 3 found three items. All three are repaired in `plan.md` §
`# v4.3 — the superseding F
manifest and the corrected receipt (2026-08-09)` and in
`phase-registry.md`. **Evaluate exactly those three plus anything the repair itself broke.** Do not
re-verify what cycle 3 already marked `FIXED` — scope arithmetic, #1169's move, #1004's rule,
#1379's option (b), the trace timestamps and evaluated-through marker, `research.md`'s re-baseline,
W3's sub-order — unless the v4.3 edit touched it.

The Plan-Gate subject remains owner-ratified as scoped in cycle 3's prompt: milestone-level
clusters, waves, canaries, preconditions, closure. Per-group slice tables live in group briefs and
take their own PLAN-EVAL. Not a finding.

Worktree `/home/codex/repos/ns005-planeval-v4`, read-only, at the current HEAD. Do not enter
`ns005-w2a`, `ns005-w2b` or `ns005-w2c`. `git fetch` first.

## The three items

1. **The superseding F manifest** (`plan.md` § v4.3). Does it contain exactly #1004, #1090, #1166,
   #1197, #1208 Phase 2, #1333, #1338, #1343 — and not #1126, #1169 or #1202? Does **every** row
   name a real adjudicator, the event, admissible evidence, and the non-occurrence disposition? Is
   assigning #1208 Phase 2 to the repo owner (a scope question) and everything else to the
   orchestrator (evidence questions) a defensible split, or does any other row hide a scope decision
   the orchestrator should not be making? Does `phase-registry.md` stage F now point at v4.3 rather
   than the superseded v4.1 table, and is that table clearly marked as not-to-be-used?
2. **The milestone-move receipt.** Is it now the exact nine — seven inbound (#1373, #1356, #1375,
   #1376, #1359, #1343, #1379), two outbound (#1126, #1169) — with the count, the enumeration and
   the `MISMATCH` comparison all using those same nine IDs, in **both** `plan.md` § v4.3 and
   `phase-registry.md`? Verify against live milestones that nine is the complete set of moves the
   plan implies; if a tenth move is implied anywhere, name it.
3. **The phase-registry Plan row.** Does it now report the owner-ratified resolution and the current
   cycle state rather than an open escalation?

Then: **did the v4.3 edit break anything?** Check for a contradiction between the v4.1 table, the
v4.2 prose and the v4.3 manifest that a reader executing stage F could still trip over.

## Output

Write to `.llm/runs/release-0.0.5--orchestration/plan-eval-v43.md` and print it. Verdict line, a
three-item disposition table, then any surviving or new finding with evidence and the concrete
change. Verdict is exactly `PASS` or `FAIL_PLAN`.

No praise, no hedging. If these three are fixed and nothing broke, say `PASS` and name what you
checked. If something is still wrong, say so plainly — three cycles of real findings is a reason to
keep going, not a reason to wave it through.
