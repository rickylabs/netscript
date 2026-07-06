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
- E Plan lock: in progress — supervisor authors `plan.md`: consolidated slice DAG from the 39
  candidates, numbered owner-fork sweep (OF-1..7 + key residual questions), milestone train
  re-derived vs live board (MUST fetch #327 live body/milestone — absent from
  `context/adjacent-issues.jsonl`), risk register (constraints 21–25 + deno-desktop experimental +
  cgroups asymmetry), gate matrix, PR #504 body refresh.
- F Adversarial: pending.
- G PLAN-EVAL: pending (hard stop).
- H Ratify + file: pending (owner).
- I Handoff: pending.

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
