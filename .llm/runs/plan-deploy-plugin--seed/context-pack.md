# Context pack — plan-deploy-plugin--seed

Resumable summary. Read `supervisor.md` first (identity, pipeline, overrides), then this.

## State (2026-07-19)

**Corpus at revision r3 — FULL KICKOFF PIPELINE COMPLETE.** Branch `plan/deploy-plugin`
(worktree `/home/codex/repos/wt-deploy-plugin-seed`), baseline `290c68ef`, all work pushed with
explicit refspec (`git push origin HEAD:plan/deploy-plugin`). No PR, no issue/label/milestone
mutation (kickoff stop-lines). Owner authorized (in-turn, 2026-07-19): Codex adversarial →
integrate valid findings → Kimi K3.

Commit trail: `d7879e68` bootstrap → `fed30572` research corpus → `bcec7e53` DP-0..2 →
`a178d31a` DP-3..5 → `96b6c47b` DP-6..8 → `f360deca` plan lock → `7facbd05` adversarial brief →
`9ed2eeab` Sol findings (Codex thread, id in `codex-thread-ids.md`) → `80882a33` r2 integration
→ `3d086488` Kimi brief → r3 integration commit (doc-story + triage + amendments).

## Pipeline position

1. ✅ Generator (Fable 5 · xhigh) — full seed corpus.
2. ✅ Sol xhigh constructive adversarial — SF-1…SF-16 all accepted, integrated as **r2**.
3. ✅ Kimi K3 doc-story (OpenCode + OpenRouter, `moonshotai/kimi-k3`, drift D-4/D-5) —
   `doc-story-kimi.md` (docs IA + 4 forecast pages + KF-1…KF-13); all 13 accepted
   (`doc-story-kimi-triage.md`), integrated as **r3**. Key corrections: no preinstalled target
   (KF-1); `deploy-deno` declares no `emit`, flow = `plan → up` (KF-9); `baremetal` one target
   with `windows|linux` variants (KF-3); declarations vs settings vs generated-descriptor homes
   (KF-2); `--env` grammar (KF-8); `--prebuilt` manifest contract (KF-6); `cells apply` +
   selector vocabulary (KF-11); `target remove` semantics (KF-12); preview catalog (KF-10);
   verdict precedence (KF-13); grammar sketch (KF-5); stories on the locked `target add` flow
   (KF-7).
4. ▶ NEXT (supervisor/owner-coordinated — NOT this session until directed): optional formal
   PLAN-EVAL (open-model lane); owner ratification of OF-1…OF-8; then the owner-extended
   terminal deliverable — PR on this branch + filed epic & 29 `DPB-n` sub-issues (all
   Backlog/Triage) + supersession closes (#823/#824/#451/#453/#454/#455…) per the
   netscript-pr taxonomy and the board sketch in `plan.md` §5.

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
