# Worklog — Agentic Workflow Doctrine V3

Run dir: `.llm/runs/feat-agentic-workflow-doctrine-v3--v3/` · Supervisor: see `supervisor.md`.

## 2026-07-04 — Bootstrap

- Skills loaded: `netscript-harness`, `netscript-pr` (+ `activation.md`, `run-loop.md` read).
- Located the doctrine proposal the owner referenced: **#306 "[S5] Harness + skills revamp"**
  (lane-policy, gate hardening, stale profile deletion, skill/tool hygiene). Adjacent: #305
  (Architecture Doctrine revamp — framework doctrine, separate scope), #387 (false-closed
  acceptance guardrail — folded into V3 stage-label/DoD design).
- Baseline: worktree `.llm/tmp/wt-harness-v3` on `feat/agentic-workflow-doctrine-v3` @ `1b42ba88`.
- Key bootstrap finding: `.llm/tmp/` is git-excluded → v2 run dirs (`.llm/tmp/run/`) are
  unreviewable from GitHub/mobile. V3 dogfoods tracked run dirs under `.llm/runs/` (drift.md D1).
- Epic **#389** created (`type:umbrella`, `epic:harness-v3` [new label], `area:tooling`,
  `priority:p1`, milestone `0.0.1-stable`). Draft PR **#390** opened at start with DoD + run-dir
  path + `status:research` stage label.
- Push path note: Windows worktree has no working credential helper in this session → pushes go
  bundle → WSL clone (`netscript-206-registry`) → `git push origin <local>:refs/heads/<branch>`
  (explicit refspec per upstream-tracking landmine).
- G1 research launched: R1 (Opus, repo inventory: skills/tools/harness staleness, commits.md +
  `.llm/tmp/run` blast radius) and R2 (Opus, GitHub-state: #306/#305/#387 threads, labels.yml
  status taxonomy fit, PR practice audit, epic naming reality).
- Supervisor pre-reads while G1 runs: `gates/plan-gate.md`, `workflow/supervisor.md`,
  `codex-wsl-remote` launch model + agentic-suite table.

## 2026-07-04 — Research complete

- R2 (GitHub-state) + R1 (repo inventory) both returned; folded into `research.md`.
- Key premise correction (R1): `.llm/harness/profiles/{sagas,triggers}` already absent → #306's
  12-file delete is a no-op, dropped from scope. `.llm/runs/` already exists → run-dir move is a
  text/template repath.
- Key constraints (R2): only hard invariant = generator-session ≠ evaluator-session (#306 retires
  the OpenHands-only dogma); zero new labels needed (all 7 stages exist, OD1 resolved); native
  sub-issues unused repo-wide (OD2 → checklist standard); honor `--allow-slow-types` oRPC exception
  (#305, OD5); #305 doctrine-prose is out of bounds (OD6); #387 close-gate = acceptance-box
  verification (folded into §4 guardrail).
- All 6 open decisions resolved in design §10. Slice map finalized to 8 slices (§8) against R1's
  exact blast-radius (commits.md 13 files, `.llm/tmp/run` ~30 files, Copilot/Augment 7 files).

## Design

The V3 Design checkpoint is the dedicated artifact **`design-v3.md`** (public surface = harness spec
+ skills + tooling + GitHub process; domain vocabulary = tiers A–E + `status:` stage lifecycle;
constants = the fixed stage set + lane/model bindings; commit slices = §8 S2–S8; deferred scope =
§8 notes + ~28 unwired fitness scripts audit → #307). Every file a slice will touch traces to a
concept named in `design-v3.md` §5/§8. Ready for PLAN-EVAL (OpenHands, separate session).

## 2026-07-04 — S1 pushed + PLAN-EVAL dispatched

- S1 committed `1b025afa` (research + design), pushed to origin via bundle→WSL(206-registry)→origin.
- PR #390: RESEARCH+PLAN phase comment posted (issuecomment-4881023435); stage label advanced
  `status:research` → `status:plan-eval`.
- **PLAN-EVAL dispatched** to a SEPARATE OpenHands session (minimax-M3 requested) via
  `@openhands-agent` PR-comment trigger (issuecomment-4881027719). Evaluator will read
  plan-protocol + plan-gate + research.md + design-v3.md, write `plan-eval.md`, and comment
  `[PHASE: PLAN-EVAL] [VERDICT: …]`. **HARD STOP: no implementation slice (S2–S8) until PASS.**
- Watch-and-act: await PLAN-EVAL verdict → on PASS, file `[harness-v3 S2..S8]` sub-issues under
  #389, advance label to `status:impl`, launch S2 (Tier D Codex daemon slice) + S3/S7 (Tier C
  Workflows, workflow.js committed first). On FAIL_PLAN, revise design and re-dispatch (2 cycles).

## 2026-07-04 — PLAN-EVAL PASS → Implementation phase (lane override)

- **PLAN-EVAL verdict: PASS** (OpenHands minimax-M3, separate session; `plan-eval.md`). Zero of two
  FAIL_PLAN cycles used. Checklist all-green (research current, 5 decisions locked, 6 ODs resolved,
  slices <30, risk register, gate set, deferred scope explicit). Adversarial V3 checks all ✅.
- **Owner directive (lane override):** the **supervisor stays Fable 5** (unchanged); implementation
  of ALL slices S2–S8 runs on **Opus 4.8 sub-agents** (not the design's Tier-D Codex / Tier-C
  Workflow lanes), given V3's high importance. **WSL Codex = final adversarial validation before
  IMPL-EVAL** only. IMPL-EVAL stays OpenHands (separate session). See `supervisor.md` Phase 2.
- Delivery model: single PR **#390** carries S2–S8 as sequential commits, one PR comment per slice,
  run-dir currency (`worklog.md` + `context-pack.md`) touched every slice, reconcile note per slice.
- `#390` stage label advanced `status:plan-eval` → `status:impl`.
- Next: S2 (lane-policy + tiered model) → Opus 4.8 sub-agent, worktree `.llm/tmp/wt-harness-v3`.

## 2026-07-04 — Pre-S2 currency (commit `f220e0c2`)

- **plan-eval.md transcribed** (drift D4): the PLAN-EVAL OpenHands job errored before its artifact
  landed, but posted a PASS verdict (issuecomment-4881028564). Supervisor transcribed it faithfully
  with a provenance note (transcription, not self-certification). Session separation intact.
- **Amendment A1 recorded** (drift D5-slice-review-gate, design-v3.md top + §8 S2/S5): owner-directed
  post-PLAN-EVAL scope addition — permanent, **lane-agnostic Slice review gate** (no implementation
  lane B/C/D self-certifies; Tier-A supervisor substantively reviews before the sign-off commit).
  Codified in S2 (lane-policy invariant + SKILL ref) and S5 (run-loop step). Slice count unchanged.

## 2026-07-04 — S2 landed (lane policy + tiered model)

- **Author**: Opus 4.8 sub-agent (Tier B, D3 lane override), worktree `.llm/tmp/wt-harness-v3`.
- **Files**: NEW `.llm/harness/workflow/lane-policy.md` (single source: Tier A–E table + OD3 model
  bindings + exactly-two-invariants section incl. A1 with explicit B/C/D enumeration + selection
  rules + supervisor-identity requirement); EDITED `.agents/skills/netscript-harness/SKILL.md`
  (retire hardcoded lane dogma → defer to lane-policy; add Slice-review-gate + supervisor-identity
  rows/checklist items; re-baseline v2→V3, incl. frontmatter `v2 runs`→`runs`); regenerated mirror
  `.claude/skills/netscript-harness/SKILL.md`.
- **Supervisor review (A1 gate)**: read full diff + lane-policy.md. Two hard invariants stated
  exactly; A1 enumerates B/C/D; dogma retired everywhere except the pitfall that explicitly retires
  it. Boundary respected — `.llm/tmp/run` paths + `commits.md` refs in untouched sections left for
  S3/S4; Copilot/Augment residue left for S7/S8. One supervisor edit: frontmatter description
  `harness v2 runs` → `harness runs` (S2 re-baseline scope; left "commit tracking" for S4).
- **Gate**: `agentic:sync-claude` (SYNCED, 1 stale mirror refreshed) → `agentic:sync-claude:check`
  OK → `agentic:check-claude` OK (all surface checks green, lock unchanged). File set matches §8-S2
  scope exactly (source SKILL + mirror + new lane-policy.md; no framework source).
- **Reconcile**: no related-issue state change needed (S2 touches no issue acceptance boxes; #306
  remains open, resolved cumulatively by this PR). No new labels. Commit sha `f33141fd` (+ currency
  `dca28ee9`).

## 2026-07-04 — S3 landed (run-dir relocation)

- **Author**: Opus 4.8 sub-agent (Tier B, D3 lane override), worktree `.llm/tmp/wt-harness-v3`.
- **What**: relocated the harness run-dir convention `.llm/tmp/run/<run-id>/` (git-ignored) →
  `.llm/runs/<run-id>/` (tracked) — drift D1's root-cause fix. 15 source files repathed: harness
  `workflow/{activation,agent-handoff,commit-tracking,supervisor,retrieval-order}.md`,
  `evaluator/protocol.md`, `README.md`, `templates/{agent-briefing,implement}.md`, `AGENTS.md`,
  `.agents/rules/harness-workflow.mdc`, `.github/pull_request_template.md`, and 3 skills
  (`netscript-harness`, `netscript-pr`, `fresh-ui-horizontal`). 3 mirrors regenerated. Templates
  also gained the §3 supervisor.md-first + `workflows/<slice>-workflow.js`-before-run notes (pointing
  to `lane-policy.md`). The SKILL `.llm/tmp` Path Caveat renamed to `.llm/runs` with a legacy note.
- **Supervisor review (A1 gate)**: read the full classified grep hit list + all 15 diffs. Template
  additions correct (point to lane-policy, do not restate). Boundary respected: `commits.md` tokens
  left intact for S4 (only the co-located path repathed); Copilot/Augment residue left for S7;
  OpenHands trace-output paths (`.github/workflows/openhands-agent.yml`, `openhands-handoff` L103)
  left as a distinct live convention for the S7 agent-handoff contract; 6 `fitness/*.ts` output
  defaults left under `.llm/tmp/` (ephemeral audit scratch, source-behavior change out of S3 scope).
- **Gate**: `agentic:sync-claude` (SYNCED, 3 stale mirrors refreshed) → `agentic:sync-claude:check`
  OK. **grep-zero of stale non-legacy convention refs holds** — all residual `.llm/tmp/run` hits are
  OD4 concrete historical run-ids (`supervisor.md` L9, `lessons/*`, `debt/arch-debt.md` — evidence
  links, not the convention placeholder), the OpenHands trace convention, or the one intentional
  legacy note. `watch-run.ts`/`CONTRIBUTING.md`/`tools/README.md` were no-ops (no hardcoded base
  path).
- **Reconcile**: no related-issue state change. `commits.md` drop remains S4; watch-run.ts `--files`
  default remains S4. Commit sha recorded below.
