# Context Pack — plan-process-manager--seed

**Run:** seed run (planning-only, drafts-only until owner ratifies Stage H).
**Subject:** Deno-native + NetScript-native process manager (pup/pm2 concept, 2026 SOTA) shipped
as a NetScript plugin (core + adapters), CLI + Deno-Desktop admin console, covering the bare-metal
deployment target of epic #327.
**Branch:** `plan/process-manager` · worktree `.llm/tmp/wt-process-manager` · baseline `317e4b50`.
**Charter:** `charter.md` (authoritative). **Supervisor:** `supervisor.md`.

## Stage status

- A Bootstrap: ✅ (commit `37bcffdc`, draft PR #504).
- B Discovery corpus: ✅ — workflow `wf_8ef59eb5-cd6`, 8/8 topics, corpus in `research/`, index in
  `research.md`, 25 drift candidates + 36 open questions in `research/stage-b-ledger.md`.
- C Synthesis: ✅ — full-corpus read + synthesis appended to `research.md` §C1–C7: mode-split
  hybrid architecture (library engine / OS supervisor of record / control-plane service as sibling
  unit), 13 resolved decisions S1–S13, 7 owner-forks OF-1..7, 25/25 ledger drift candidates
  triaged (drift.md entry 4), 36/36 open questions routed, 5 Stage-D packs named (D1–D5).
- D Design packs: ✅ — 5 Opus 4.8 sub-agents authored `research/design/d1..d5-*.md` (Σ2873 lines,
  fully cited); Tier-A supervisor read all five in full (slice review gate A1) — verdict: compliant,
  high quality. Review caveats → worklog Stage-D section: 7 cross-pack reconciliation items for
  Stage E, headlined by the REAL D3↔D5 target-key conflict (resolve per D3: no new key, implement
  behind `linux-service`/`windows-service`), state-vocabulary + restart-default unification, and
  drift entry 5 (`resolveTargetConfig` key/member mismatch). 39 candidate slices total
  (11+7+7+8+6); 34 residual questions carried.
- E Plan lock: ✅ — supervisor-authored `plan.md`: E1–E16 resolved decisions (headline E1: no new
  target key, per D3), OF-1..9 owner-fork sweep, 39 candidates → **PM-0..PM-35** (32 milestone-1 +
  4 deferred after Stage-F count fix; `v1-min` floor = 21), milestone train re-derived from the
  LIVE board (#327 = 0.0.1-stable confirmed via WSL gh; #400 beta.6; #E1/#E6 beta.8; beta.7 = 28
  open → OF-9), risk register R1–R10, gate matrix, Stage-H one-shot filing plan. 4 residual
  questions remain (plan §9).
- F Adversarial: ✅ — Tier-D Codex blocked (`usageLimitExceeded`, drift 6) → recorded fallback
  OpenHands **qwen-3.7-max** on PR #504. **Verdict PASS** (comment #issuecomment-4891678877): 18
  findings, 0 blockers / 4 major / 14 minor. Triage in `stage-f-adversarial.md`: 13 accepted +
  fixed in plan.md, 2 rejected w/ rationale, 3 notes. Headline fix (F-3): **E5 extraction
  re-homed to `packages/deploy-core`** (ARCHETYPE-7's anticipated package; pm-core depends on it;
  CLI re-exports; F-DEPLOY promotion in PM-20). Also: E4 enumerates the 18-route table (F-2),
  PM-1 gains the workers-core `WorkerTaskPermissions` re-export precursor (F-4), OF-9 is a hard
  fork (F-17), counts corrected 32+4/21 (F-7).
- G PLAN-EVAL: ✅ **PASS, first cycle** — OpenHands minimax-M3 (comment #issuecomment-4892134973;
  `plan-eval.md` committed by the evaluator, `2062a536`, verified clean: 1 file, no lock churn).
  All 8 Plan-Gate boxes checked; evaluator's independent open-decision sweep clean; citation
  spot-checks confirmed; Stage-F fix landings verified.
- H Ratify + file: **pending (owner) — the run is parked here.** Owner decision brief = OF-1..9
  (plan.md §3; posted on #504). Zero board mutation until in-turn ratification (approval does NOT
  survive compaction — re-surface, never route around). Then one-shot filing per plan.md §10
  (labels→milestones→epic→36 children→#345 re-scope + 2×#400 comments→FILING-LOG.md).
- I Handoff: pending (after H) — per-epic briefs from GitHub + design packs, `use harness` +
  `## SKILL` chapter.

## Resume notes

- Push with explicit refspec `HEAD:refs/heads/plan/process-manager` (worktree upstream is
  origin/main — landmine).
- `gh` only via WSL (`wsl -u codex bash -lc "cd /tmp && gh ... --repo rickylabs/netscript"`),
  bodies via `--body-file` on `/mnt/c/...` paths.
- Prior deployment research: extracted to `context/prior-deployment-architecture-spec.md` +
  `context/prior-decision-gap-tracker.md` (from branch `research/deployment-aggregation`);
  `servy-assessment.md` was never committed there — MODERNIZE verdict survives in #327's body.
- Full workflow result JSON (if needed):
  `C:\Users\chaut\AppData\Local\Temp\claude\C--Dev-repos-netscript-framework\1e66850d-1c97-4549-b3fb-16e8a34fbc77\tasks\wr28svbvy.output`.
