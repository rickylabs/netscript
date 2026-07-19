# Context pack — plan-deploy-plugin--seed

Resumable summary. Read `supervisor.md` first (identity, pipeline, overrides), then this.

## State (2026-07-19)

**Corpus at revision r2** — generator stage complete AND Sol adversarial integrated. Branch
`plan/deploy-plugin` (worktree `/home/codex/repos/wt-deploy-plugin-seed`), baseline `290c68ef`,
all work pushed with explicit refspec (`git push origin HEAD:plan/deploy-plugin`). No PR, no
issue/label/milestone mutation (kickoff stop-lines). Owner authorized (in-turn, 2026-07-19):
Codex adversarial → integrate valid findings → Kimi K3 doc-story.

Commit trail: `d7879e68` bootstrap → `fed30572` research corpus → `bcec7e53` DP-0..2 →
`a178d31a` DP-3..5 → `96b6c47b` DP-6..8 → `f360deca` plan lock → `7facbd05` adversarial brief →
`9ed2eeab` Sol findings (Codex thread, id in `codex-thread-ids.md`) → r2 integration commit.

## Pipeline position

1. ✅ Generator (Fable 5 · xhigh) — full seed corpus.
2. ✅ Sol xhigh constructive adversarial (`adversarial-sol.md`, SF-1…SF-16) — **all 16 accepted**
   (`adversarial-sol-triage.md`), integrated as r2.
3. ▶ **Kimi K3 doc-driven story** — dispatch via `deno task agentic:opencode` (OpenCode +
   OpenRouter; K3 slug passed explicitly — drift D-4; brief = `kimi-doc-story-brief.md`).
   Deliverable: `doc-story-kimi.md` forecasting the public docs as if W3 shipped; DX seams the
   docs cannot explain are reported as findings, not fixed in prose.
4. Then: generator integrates Kimi findings (r3 if needed) → owner decisions OF-1…OF-8 →
   (owner extension, 2026-07-18 evening, recorded in supervisor memory) terminal deliverable =
   PR on this branch + filed epic & sub-issues (all Backlog/Triage) + supersession closes —
   **supervisor-coordinated AFTER the full pipeline; still forbidden to this session until
   then**.

## Artifact map

- `research/` — six cited corpus files + `research.md` synthesis.
- `design/canonical/DP-0…DP-8` (r2) — concept/laws L-1…L-7 + three-tier goal frame; family
  graph R-GRAPH-1…5 r2 (no leaf imports, no adapter-to-adapter imports, descriptor
  composition); deploy-core (eight-op port with pure `plan`/`emit`+provenance/`up --prebuilt`;
  structural `CapabilityRef` verdicts per target-variant; user-declared `DeploymentCell`s with
  `suggestedCells`; empty duplicate-rejecting registry; two-phase config loader); adapter cards
  per variant; plugin+host (protocol-valid tooling manifest, mount-children CLI + async
  bootstrap, doctor-as-data, per-target permission profiles); wrapping map; migration map
  (compat handlers for legacy verbs; unknown-target error = the one documented behavior
  change); contribution matrix; scaffold stories (one compute variant per story).
- `plan.md` (r2) — LD-1…12 locked, OF-1…8 (OF-3/OF-5 re-resolved per SF-4/SF-9), **29-child
  `DPB-n` board**, risks, gates, §10 pass status.
- `adversarial-brief.md` / `adversarial-sol.md` / `adversarial-sol-triage.md` — stage-2 record.

## Standing constraints

Stop-lines verbatim in `kickoff.md` (drafts only; no product code; push `HEAD:plan/deploy-plugin`
only; HARD STOPs on release/milestone actions). Board filing waits for the full pipeline + owner
coordination. Evaluator lanes open-models-only; generator ≠ evaluator. One Codex sender per
worktree — steer the existing thread (`codex-thread-ids.md`), never a rival send.
