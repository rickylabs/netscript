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

---

## #5 — Wave-1 IMPL-EVAL outcome + two live blockers (2026-07-07)

Per your "skip adversarial, launch IMPL eval": all 5 wave-1 IMPL-EVALs ran. **3 PASS → you merged:
#560 (#404), #559 (#405), #549 (#306).** Two remain:

**#558 (#494 AI-494) — re-dispatched, no action needed.** First IMPL-EVAL returned no verdict
(exhausted its budget writing a check-plan without running it, `OPENHANDS_VERDICT: NONE`).
Re-dispatched with a tightened verdict-first prompt (comment 4901284973). Watching for the verdict.

**#550 (#257 AI-257) — DECISION NEEDED.** Code is IMPL-EVAL PASS (island is sound, security-rigorous,
129/129 tests). But the `close-gate` CI (correctly) fails: issue #257 has 6 unchecked acceptance
boxes. 5 of them are backed by real A1+IMPL-EVAL evidence and I can check them honestly. The 6th —
`gate:e2e` (scaffold.runtime must cover `ui:add ai` copying `McpUiWidget` into a Fresh app) — is a
**genuinely unbuilt acceptance criterion**: the e2e suite has zero `ui:add` coverage; #257's slice
was island+manifest only. I won't falsify that box.
  - **Ask (a):** Build the `ui:add ai` scaffold.runtime e2e coverage as a small CLI/e2e-suite slice
    (WSL Codex) under #257 — **or** amend #257 to move `gate:e2e` to a follow-up issue so #257's bar
    is the 5 verified boxes. *Recommend the follow-up split* — the island is proven; ui:add scaffold
    coverage is orthogonal CLI-suite work.
  - **Note:** #550 cannot merge today regardless — charter line 67 keeps #463 (MCP pooling, not yet
    implemented) upstream of #257. So the `gate:e2e` call isn't blocking today; #550 waits on #463.

**Process fix applied:** the #550 evaluator misread the close-gate as "PR body has a closing keyword"
rather than "issue acceptance boxes checked." I hardened the re-dispatched #494 prompt with the
correct close-gate definition; folding it into the standing IMPL-EVAL template.

## #6 — #303 (S2) is materially smaller than planned (FYI, `303-audit.md` committed)
The 172a-2-SOUND seam is already fixed on main (#332); AC1 effectively met; all 4 slow-types
carve-outs are stale. Real remaining work = AC2 doc-lint (fresh-ui `./interactive` = the tentpole) +
mechanical cleanup. Rescoped to 3 slices (A/B/C). Full audit in the run dir. No action unless you
want to re-prioritize #303 into this wave.

## Batch #7 — wave-1 close-out + AI-stack unblock (2026-07-07)

- **#558 (#494) IMPL-EVAL PASS** — independently merge-ready; plan row 42 says it is disjoint (∥) from
  #463, so it is NOT gated behind the pooling primitive. Ready to merge on your go.
- **#550 (#257) close-gate PASS** — resolved via follow-up split: `gate:e2e` `ui:add` coverage was
  genuinely unbuilt, so I filed **#561** and deferred it as a non-merge-gate for the island rather than
  falsify the box. IMPL-EVAL PASS. Merge gated behind #463 (upstream-first per charter).
- **#463 (FAI-7 MCP pooling) dispatched to WSL Codex** — thread `019f3b96`, worktree
  `netscript-463-mcp`, implementing now. Its completion unblocks #257 (#550) and #379.
- **#561 filed** — new beta.6 issue: test(cli-e2e) scaffold.runtime coverage for `ui:add ai`
  (McpUiWidget), split out of #257.
- **Merge posture:** this is a post-compaction session, so I'm holding at **prep-green + surface** — I
  am not auto-merging. If you want #558 (and #550 once #463 lands) merged autonomously on green,
  re-confirm the merge-on-green grant and I'll proceed.

## Batch #8 — AI-stack W1 merged, W2 dispatched (2026-07-07)
- **W1 fully landed on main:** #494 (per-turn), #463 (MCP pool primitive), #257 (McpUiWidget island)
  all merged. You merged #550 (#257).
- **W2 dispatched to WSL Codex (both deps-clear):**
  - **#379** FA4 call-route handler (Lane D) — thread `019f3bca`, consumes the #463 pool, server-side
    allowlist + stdio fallback + OTel.
  - **#258** FB5 fresh-ui generative-ui renderer — **lane override B→D** (Opus lane budget-constrained;
    recorded in drift). Security-critical depth + whitelist guards specified as hard unit regressions;
    adversarial review before IMPL-EVAL.
- **Flow per slice:** land → A1 supervisor review → IMPL-EVAL (separate OpenHands session) → merge on
  green (grant active). I'll surface each verdict.
- **Last AI-stack gate:** #464 (e2e --mcp) dispatches once #379 + #258 merge.
- Token posture: implementation is on the WSL Codex lane (cheap); my Opus calls stay lean per your
  life-support constraint.
