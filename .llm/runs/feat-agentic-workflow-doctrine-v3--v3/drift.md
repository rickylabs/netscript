# Drift Log — Agentic Workflow Doctrine V3

Append-only. Severity: minor | significant | architectural.

- **D1 (architectural, 2026-07-04)**: Harness v2 mandates run dirs at `.llm/tmp/run/<run-id>/`,
  but `.gitignore` excludes all of `.llm/tmp/` — run artifacts + generated `workflow.js` cannot be
  committed or reviewed from GitHub/mobile there. This run dogfoods the V3 target: tracked run dirs
  under `.llm/runs/<run-id>/`. Subject to PLAN-EVAL; v2 docs updated as part of V3 itself.
- **D2 (significant, 2026-07-04)**: `commits.md` intentionally NOT instantiated for this run —
  V3 drops it (requirement 10); the draft PR commit list + per-slice PR comments are the commit
  trail. v2 activation.md still lists it as mandatory; superseded by this run's design, pending
  PLAN-EVAL.
- **D3-lane-override (significant, 2026-07-04)**: Owner directive overrides the design §8 per-slice
  lane assignments for the implementation phase. The **supervisor stays Fable 5** (unchanged), but
  **all implementation slices S2–S8 run on Opus 4.8 sub-agents** instead of the planned Tier-D Codex
  (S2/S4/S6/S8) and Tier-C Sonnet Workflows (S3/S7), given V3's high importance and Opus's authoring
  quality on doctrine/tooling prose. **WSL Codex (Tier D) is retained ONLY as a final adversarial
  validation pass before IMPL-EVAL** (close-all-gaps sweep). This does not change the design's
  written lane-policy doctrine (S2 still documents the general Tier A–E model per §2); it is a
  run-scoped execution choice, recorded here per "drift is explicit". IMPL-EVAL remains OpenHands,
  separate session.
- **D4 (minor, 2026-07-04)**: The PLAN-EVAL evaluator's OpenHands job errored after producing its
  verdict — the PASS was posted to PR #390 (issuecomment-4881028564) but the mandatory
  `plan-eval.md` artifact never landed on the branch. The supervisor transcribed the posted verdict
  into `plan-eval.md` with a provenance note (transcription, not supervisor certification). The
  evaluator session separation is intact; only the artifact delivery failed.
- **D5-slice-review-gate (significant, 2026-07-04)**: Owner-directed scope amendment AFTER
  PLAN-EVAL PASS. The substantive per-slice supervisor review is not run-local behavior — it becomes
  **permanent, lane-agnostic harness doctrine** ("Slice review gate"): after an implementation
  sub-agent lands a slice and automated gates pass, the **Tier-A supervisor performs a substantive
  intelligence review of the slice content (correctness, coherence with already-landed slices,
  doctrine-fit, gaps/overreach) BEFORE the sign-off commit** — the commit is the supervisor's
  sign-off, not the implementer's. This holds for **every implementation lane without exception**
  (Tier B Opus sub-agents, Tier C Workflow-generated slices, Tier D WSL Codex); no lane
  self-certifies. Codified in V3 as: invariant wording in `workflow/lane-policy.md` (S2) +
  discoverable reference in the `netscript-harness` SKILL (S2) + concrete run-loop step between
  automated gates and sign-off commit in `workflow/run-loop.md` (S5). Recorded as design-v3.md
  Amendment A1; applied immediately to in-flight slices (each slice's worklog entry notes the
  review + any findings).
- **D6-A2-tools-and-llm-grade (architectural, 2026-07-04)**: Owner-directed scope amendment AFTER
  S2–S8 landed and BEFORE IMPL-EVAL dispatch. Owner identified that design §8 **under-scoped the
  `.llm/tools` work**: S6 wired mandates/aliases + `workflow/tooling.md`, and S8 pruned scratch, but
  the **deep tools refactor was never performed**. IMPL-EVAL is HELD. Two new workstreams fold in
  (recorded as design-v3.md **Amendment A2**):
  - **S9 — `.llm/tools` production-grade refactor (audit-first).** (1) AUDIT every tool under
    `.llm/tools/**` → classify keep / harden / deprecate-delete; post the classification as a PR #390
    comment (reviewable) and SendMessage the supervisor-coordinator BEFORE any destructive action;
    flag load-bearing/ambiguous delete candidates rather than guessing. (2) DELETE stale/deprecated
    tools, never deleting anything still referenced without repointing callers first. (3) HARDEN +
    HARMONIZE survivors (uniform CLI contract: flags/`--help`/exit codes, least-privilege
    `--allow-*`, structured/compact output, uniform errors); fix the three #307 debt items if in
    scope (codex-watch `--allow-env` doc, gh-token main-guard, claude-hook-log stdin-block).
    (4) RESTRUCTURE the folder into topic/domain subfolders — an S3-scale reference sweep updating
    EVERY caller (`deno.json` `agentic:*` + other aliases, all skills + `.claude` mirrors via sync
    (never hand-edit mirrors), AGENTS.md/CLAUDE.md, `.llm/harness/**`, `.github/workflows/**`);
    grep-zero stale tool paths. (5) TEST each surviving tool runs (smoke/`--help`/dry-run); existing
    tool tests pass; agentic suite resolves end-to-end. (6) UPDATE the tools registry +
    `workflow/tooling.md` + `netscript-tools` and `netscript-deno-toolchain` SKILLs to the new
    structure (map, not manual). May split into audit→execute sub-slices.
  - **S10 — `.llm/*` production-grade sweep.** Everything under `.llm/*` must be production-grade: no
    stale, no drafts, no dead/dated one-offs, no contradictions. **EXCEPTION: `.llm/runs/` is KEPT**
    as the agent-learning corpus (pruned on demand, not swept). Sweep `.llm/harness/**` and any other
    `.llm/*` for staleness/drafts/duplication and bring to grade.
  - **Sequencing:** S9 (audit→execute) → S10 → full-surface gates → **WSL Codex adversarial pass over
    the WHOLE V3 surface** (the pre-staged adversarial brief is deferred to cover S9+S10 too) →
    OpenHands IMPL-EVAL (separate session). Slices stay reviewable; material run growth noted in
    worklog. Still docs/tooling only — no `packages/`/`plugins/` source. No merge/close (owner's
    call). Authored by Opus 4.8 sub-agents under the A1 lane-agnostic review gate, same as S2–S8.
