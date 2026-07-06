# Context Pack — beta5-impl--supervisor

> RE-READ THIS + charter.md + phase-registry.md AFTER EVERY COMPACTION.

## Mission
Overnight full-autonomy beta.5 implementation supervision. Owner checks back morning 2026-07-07 and
expects the release cut ready (everything green; OWNER executes the cut). Merge-on-green granted
(charter.md — re-anchor from there post-compaction).

## State (update as run progresses)
- Phase: Step 1 chores wave launching. Step 0 DONE (reconciliation-map.md is the lane authority;
  Phase-0 issue edits applied: #301 #389 #306 #347 #348 bodies + #306 status:impl + #307 comment).
- Re-plan from map: #219 = validation-only (eis-chat gate closes it; primitives already merged);
  #345 parked owner-batch; #346-348 ready parallel Codex; #403 waits on #402 IMPL-EVAL.
- Chores lanes: C1 #303 Codex(doc-lint sweep+dry-run, scaffold.runtime proof) · C2 #305 Codex
  quick-win · C3 #306 Opus-high remainder · C4 #307 Codex Waves 2+4.
- Owner-batch: #305 scope-cut, #307 Wave-5 items, #345 parked confirm.
- Baseline: origin/main 1c175990. Local main = origin + 3 beta.3 artifact commits (unpushed).
- Beta.5 open issues: #219 #303 #305 #306 #307 #327(epic) #345-348 #389 #402 #403 #479.
- Known: #480/#481 bare-`ai`-alias fix merged 29b4bccd rides beta.5 cut; e2e-cli-prod intentionally
  red for beta.4 — beta.5 cut must re-prove green.

## Key mechanics
- gh ONLY via `ssh codex-wsl 'bash -lc "cd /tmp && gh ..."'` (--body-file for markdown).
- Codex slices ONLY via `.llm/tools/agentic/launch-codex-slice.ts` + codex-watch/resume/status;
  Git Bash prefix `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*"`.
- OpenHands: dispatch-openhands.ts + watch-openhands-verdict.ts (--since computed AT dispatch).
- Wake: `.llm/tools/harness/watch-run.ts <run-dir>` background; never poll.
- Routing: ROUTING-ADJUSTMENTS.md is law (Opus 4.8 high UI/complex; Codex high; docs Claude-only;
  never Fable in workflow fan-out).
- Order: Step 0 x-ref map → Step 1 chores (#303 #305 #306 #307, #389 audit) merged first →
  Step 2 features (T1 #402 → T2 #403; #219; #345-348; #479) → Step 3 eis-chat gate → release prep.
