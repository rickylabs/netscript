# Supervisor identity — release 0.0.8 milestone run

- **Coordinator:** claude-opus-5-5, effort xhigh. Launched by the owner through the `/swarm` brief on #2103 (owner-approved 2026-10-08 and 2026-10-09). Profile: milestone-coordinator (harness, pinned by the dispatcher).
- **Tracking issue:** #2103. It is a reference-only umbrella and never takes a closing keyword.
- **Milestone:** 0.0.8 (milestone 25). Baseline main `39cb712b631a0922e0674f40e75224cffcc70549` (2026-10-09).
- **Lanes:** `docs`, `internals`, `fixes`, `features` are logical lane roles held inside the coordinator session, with no separate orchestrator sessions, to stay within the shared fleet cap.

## Owner mandate (verbatim rules this run enforces)
1. **Golden rules**, in order, in every brief, PR and review:
   1. The idiomatic NetScript way: MCP `find_guidance` with an intent, then `search_docs`, then docs/site, before writing anything.
   2. SOLID.
   3. Performance.
   4. Repo doctrine (AGENTS.md and its skills, including netscript-pr for the PR and close gates).
   5. The phone and web app are interfaces, never a backend: background work runs in workers, sagas and triggers under a service identity (owner, 2026-10-09).
2. **Acceptance:** never weaken it, and never tick an unproven box to meet a date.
3. **Routing** (owner override of matrix defaults):
   - coordinator: claude-opus-5-5 xhigh;
   - implementers: claude-opus-5-5 high, with `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS=2` and `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`;
   - every PLAN-EVAL, IMPL-EVAL and PR review: gpt-6.1-sol high via Codex (cross-family).
4. **Capacity:** at most 2 implementers at a time (fleet builder cap shared with three cockpit epics).
5. **Order:** C3 first, in topological waves, never one big fan-out. One PR per leaf, directly against main, each independently mergeable. EIS path F31 → F32 → F33 → F30 (already merged before this run).
6. **Draft PR first:** every leaf opens its draft PR before writing code (owner, 19:20Z).
7. **Merge only when all hold:**
   - CI is green on the exact head;
   - the Sol verdict is MERGE at that same head;
   - every review thread is resolved;
   - the local quality-gate output is pasted in the PR.
   Closing keywords only for fully completed issues.
8. **No publication by agents:** the owner cuts canaries and releases. The coordinator posts what a canary would contain, from first-parent merge history.
9. **Process safety:** never kill processes by pattern, and never print tokens or secrets.
10. **Run record:** this run is committed under `.llm/runs/` by explicit owner decision (2026-10-09 19:25Z), an exception to harness#692. The append-only event stream stays outside the repo; this directory is its sanitized, validated projection.

## Decisions log
- 2026-10-09 18:34Z: launched. Step 0 first: nothing is built before PLAN-EVAL.
- 18:55Z: the owner approved admitting the 13 same-day issues, and #2111 under the same approval. All moved into 0.0.8 before freeze.
- 19:00Z: Step 0 audit closures posted.
  - #2025 closed as a duplicate of #1999.
  - #2021 narrowed.
  - #1383 remainder defined.
  - The #2034/#2069 closure was re-audited and is sound.
- 19:03Z: the four bounded-scope decisions were written on their issues:
  - #2033 moved to 0.0.9;
  - #2010 split into RFC #2112;
  - #1362 split into child #2113;
  - #1367 takes branch B, with follow-up #2114.
- 19:14Z: wave 1 dispatched (#2065, #1383) after PLAN-EVAL round 2 confirmed the pair.
- 19:18Z: **PLAN-EVAL APPROVED** (round 3). Verdicts are in `receipts/plan-eval-{1,2,3}.md`.
- 19:20Z: owner correction applied: draft PR first. Wave-1 draft PRs are #2116 and #2117.
- 19:25Z: owner decision: commit this run directory, with its own draft PR.
- **Open owner decision:** #1386 browser topology. Recommended option A (BFF). It blocks waves 6, 7 and 9 only.
