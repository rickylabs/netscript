# Context Pack — plan-process-manager--seed

**Run:** seed run (planning-only, drafts-only until owner ratifies Stage H).
**Subject:** Deno-native + NetScript-native process manager (pup/pm2 concept, 2026 SOTA) shipped
as a NetScript plugin (core + adapters), CLI + Deno-Desktop admin console, covering the bare-metal
deployment target of epic #327.
**Branch:** `plan/process-manager` · worktree `.llm/tmp/wt-process-manager` · baseline `317e4b50`.
**Charter:** `charter.md` (authoritative). **Supervisor:** `supervisor.md`.

## Stage status

- A Bootstrap: in progress (this commit).
- B Discovery corpus: pending.
- C Synthesis: pending.
- D Design packs: pending.
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
- Prior deployment research: branch `research/deployment-aggregation`,
  `.llm/tmp/run/epic-deployment-aggregation/{deployment-architecture-spec,servy-assessment,decision-gap-tracker}.md`.
