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
