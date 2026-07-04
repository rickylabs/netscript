# Phase Registry: plan-roadmap-expansion (A→G delegation flow)

Planning-only supervisor run. The "groups" here are the owner-specified delegation stages from
`specs/00-mission-and-flow.md`, not implementation phase groups — no framework code is produced in
this run. One branch (`plan/roadmap-expansion`), one draft PR (#397), all artifacts under this run
dir.

## Run Metadata

| Field              | Value                          |
| ------------------ | ------------------------------ |
| Supervisor run ID  | `plan-roadmap-expansion--seed` |
| Integration branch | `plan/roadmap-expansion`       |
| Base branch        | `main`                         |
| Draft PR           | #397 (stays draft; owner ratifies + cuts) |

## Stage map (model/lane law: B=Sonnet 5, D=Opus 4.8, F1=WSL Codex, G=OpenHands minimax M3; Fable never fans out)

| Stage | What                                                                 | Lane                         | Status  | Evidence |
| ----- | -------------------------------------------------------------------- | ---------------------------- | ------- | -------- |
| A     | Supervisor bootstrap: charter + specs read, run/PR verified          | Fable 5 (this session)       | done    | PR #397 comment 4883200883 |
| B     | Deep-search corpus: B1 matrix / B2 analysis / B3 research / B4 context, one sub-folder per topic | 5 concurrent Sonnet 5 agents | done    | 75 files committed 3d70ff5a; 9 drift candidates in drift.md |
| C     | Fable analysis of the B corpus                                        | Fable 5                      | done    | drift.md + FABLE-STAGE-C-SYNTHESIS.md (both delegated decisions provisionally resolved); commit b7964509 |
| D     | Per-topic deep-dive design proposals (real designs, not surveys)      | Opus 4.8 agents (A / B / E / CD — C+D combined) | active | 4 agents launched, writing to design/&lt;topic&gt;/ |
| E     | Decide + lock design; write `research.md`, `plan.md`, `## Design`; resolve D-NSONE + grouped-trace flow; epics/sub-issues/DAG/briefs drafted | Fable 5 | planned | — |
| F1    | Adversarial validation of the locked design                          | WSL Codex (daemon-attached)  | planned | — |
| F2    | Fix/adjust from adversarial findings                                  | Fable 5                      | planned | — |
| G     | PLAN-EVAL (hard stop — nothing is "ready" before PASS)                | OpenHands, minimax M3, separate session | planned | — |

## Deliverables checklist (from specs/00 §Deliverables)

- [ ] `research.md` + `plan.md` (locked decisions, archetypes, gates, debt) + `## Design`
- [ ] Epic drafts: NEW `telemetry-revamp`, NEW `dev-dashboard`, rescope `#232` (C+D), rescope `#327` (E) — sub-issues, acceptance criteria, milestones, netscript-pr labels, dependency DAG (draft text only; NO GitHub mutations until owner ratifies)
- [ ] Per-slice agent briefs (lane/model routing + `## SKILL` chapter each)
- [ ] Open-decision register (D-NSONE + telemetry grouped-trace flow resolutions + any new forks → owner)
- [ ] `plan-eval.md` = PASS

## Hard boundaries (standing)

- No issue/PR/label/milestone mutation until owner ratifies.
- No framework/plugin code in this run.
- Decisions beyond the delegated set, or touching locked positioning/invariants → back to the owner.
- PR #397 stays draft; push after every stage with explicit refspec; PR comment + body checklist updated per stage.

## Base-Sync Log

| Date       | Base sha merged | Result | Notes                          |
| ---------- | --------------- | ------ | ------------------------------ |
| 2026-07-04 | eeaff336 (main) | clean  | seed branch cut from main + 2 seed commits |
