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
- D Design packs: in progress — Tier B (Opus 4.8) sub-agents author D1–D5 per §C6; drafts only,
  zero board mutation; packs land in `research/design/`, issue-draft skeletons in `drafts/`.
- E Plan lock: pending.
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
