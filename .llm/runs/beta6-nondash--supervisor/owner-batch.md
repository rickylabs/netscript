# Owner Batch — beta6-nondash--supervisor

Decisions and confirmations reserved for the owner. Appended as the run progresses; surfaced in
the morning summary.

## 1. Close #389 (epic: Agentic Workflow Doctrine V3) — recommend CLOSE after #306 lands

Verified 2026-07-06 against main + GitHub: design/dogfood PR **#390** merged (squash `eeaff336`,
IMPL-EVAL PASS, all 13 slices S0–S10 + A1/A2), finalize **#398** merged, closeout **#396** merged.
The epic's only remaining live thread is its "Adopts: #306" link — #306 (S5 harness/skills revamp)
is an active slice of this run. Epic law: no closing keyword; owner closes by hand.
**Recommendation:** close #389 when the #306 slice PR merges.

## 2. Codex quota exhaustion (drift D5) — FYI + confirm reroute

Wave-1 Tier-D slices (TEL-T3 #404, TEL-T4 #405, AI-494 #494) hit the Codex usage limit at launch
(resets 2026-07-07 03:52). Rerouted to Tier B Opus 4.8 high worktree sub-agents under blocked-lane
handling (precedent: V3 #390 topology). #463, #511 and wave-2 Tier-D slices held for Codex
post-reset. Mobile-visibility for the rerouted slices is via draft PRs only (no Codex threads).

## 3. Phantom FAI handles in issue bodies (drift D1) — approve body edits

#464 cites FAI-5/6/8 and #463 cites FAI-8/FAI-14; none exist as issues. Effective #464 deps
re-derived = {#494, #463, #257, #258, #379} (PLAN-EVAL independently confirmed). Recommend a
one-pass body edit on #463/#464 replacing phantom handles with real issue refs.

## 4. Wave 1 complete (5/5 draft PRs) — re-confirm merge grant + merge order (post-compaction)

All five wave-1 slices are impl-done, Tier-A A1 PASS, on draft PRs from base `a1669f60`:

| PR | Issue | Slice | Closes |
| --- | --- | --- | --- |
| #549 | #306 | PROG-306 harness/skills revamp (doctrine-06 reconcile + gotchas) | Closes #306 |
| #550 | #257 | AI-257 mcp-ui-widget island | Closes #257 |
| #558 | #494 | AI-494 per-turn generation options + reasoning | Closes #494 |
| #559 | #405 | TEL-T4 W3C hardening + triggers parenting bugfix | Closes #405 |
| #560 | #404 | TEL-T3 thin-vs-SDK provider adapters + enabled-decouple | Closes #404 |

**Two asks:**
- (a) The charter (line 58) grants merge-on-green for slice PRs, but this supervisor turn is a
  **compaction continuation**, so per standing practice I am holding at *prep-to-green + surface*
  rather than autonomously merging. Please re-confirm the merge-on-green grant carries into this
  session, or say you'll cut the merges yourself.
- (b) **Merge order** must honor charter line 67 (#463 upstream of #257/#379): #463 (FAI-7, still
  Codex-blocked, not yet implemented) should merge before #550 (#257). #550 is technically
  independent (verified A1 — no import coupling) so it *can* merge standalone, but I'll keep it
  draft until #463 lands unless you clear it. Telemetry T3/T4 (#560/#559) are mutually parallel —
  whichever merges second rebases (D-2). Neither epic gate (T8 #409, #464) is in this wave.

Finalization (adversarial WSL Codex review → one IMPL-EVAL each) is gated on the Codex quota reset
(07-07 03:52); nothing is merge-ready before then regardless.
