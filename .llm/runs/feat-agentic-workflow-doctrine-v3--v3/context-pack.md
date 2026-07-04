# Context Pack — Agentic Workflow Doctrine V3

**Mission**: codify harness V3 — tiered agent model (Fable supervisor / Opus research /
Sonnet-5 Workflows batch / WSL Codex impl), adopt #306's proposed doctrine, draft-PR-on-start with
stage labels, tracked run dirs, epic/sub-issue standard, drop commits.md, prune stale
skills/tools/harness docs, make `.llm/tools` wrappers mandatory. Everything reviewable from
GitHub + mobile without cloning.

**State**: **CLOSED / MERGED (2026-07-04).** PLAN-EVAL PASS + IMPL-EVAL PASS (both OpenHands, separate
sessions; `plan-eval.md` / `impl-eval.md`). All slices S1–S10 + Amendments A1/A2 + WSL Codex
adversarial pass delivered under the D3 lane override (implementation = Opus 4.8 sub-agents; Fable 5
supervised) with the A1 lane-agnostic slice-review gate on every slice.

- PR #390 **MERGED** — squash `eeaff336` on `main`; run branch `feat/agentic-workflow-doctrine-v3`
  (base `1b42ba88`) deleted at merge. Main-drift reconciled by merge `266c0f74` (main @ `78eda7f0` /
  #395). main-push `ci` on `eeaff336` GREEN (quality / check-test / deps-report).
- Doctrine issue: #306 (adopted) · related: #305 (boundary, framework doctrine), #387 (closure
  guardrail, folded into V3 close-gate)
- Epic: **#389 left OPEN** (umbrella — no closing keyword; V3 = one delivered slice of road-to-stable)
- Slice map (all DONE): S1 research+design · S2 lane-policy · S3 run-dir move · S4 drop commits.md ·
  S5 GitHub-surface/#387 · S6 tooling mandates+aliases · S7 scrub+frontmatter+fitness-gates ·
  S8 residue+folds+ARCHETYPE-5 · **S9 `.llm/tools` prod-grade refactor** (audit→harden→delete-28→
  restructure into topic subfolders) · **S10 `.llm/*` prod-grade sweep** (`.llm/runs/` KEPT).
- Drift resolved/captured: D1 tracked run dirs · D2 no commits.md · D3 Opus-impl lane · D4/D9
  eval-transcribe · D5 A1 review gate · D6-A2 tools+`.llm/*` scope · D7/D7b/D7c/D7d + D8 out-of-surface
  #305/#307 follow-ups · D10 closeout branch. **No open in-surface action items.**

**Status**: run complete — no resume needed. Historical corpus only (kept under `.llm/runs/`).
