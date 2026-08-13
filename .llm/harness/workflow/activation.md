# Activation

Harness mode activates when the user says `use harness` or explicitly asks for a harness run.

## Required Bootstrap

1. Read this file.
2. Read `workflow/run-loop.md`.
3. Read `.llm/runs/<run-id>/context-pack.md` when resuming an existing run.
4. Identify the target surface:
   - package or plugin: select a doctrine archetype.
   - app, service, docs, or infrastructure: select any affected package/plugin archetypes, then
     apply the relevant scope overlay.
5. Read `archetypes/README.md` and the chosen profile (including its **Design Checkpoint
   Expectations** and **Concept of Done** sections).
6. Read `gates/archetype-gate-matrix.md`.
7. Read `gates/plan-gate.md` and `evaluator/plan-protocol.md`. Select PLAN-EVAL only for
   complex/decision-heavy work or genuine adversarial planning need; otherwise record a justified
   `PLAN-EVAL: N/A`. A selected Plan-Gate is a hard stop before implementation.
8. Instantiate or update the run artifacts from `templates/`.
9. For a **supervisor / multi-group run** (two or more phase groups), also read
   `workflow/supervisor.md` and `workflow/escalation.md`, and instantiate `phase-registry.md` from
   `templates/`.
10. For a **seed run** (planning-only: the deliverable is a GitHub board — epics, milestones,
    issues, design packs — not code), read `workflow/seed-run.md` and follow its stage contracts
    A–I. Seed runs are drafts-only until owner ratification.
11. For a **milestone-cluster run** (the deliverable is a release milestone landed through several
    direct-to-`main` PRs and a cut), read `workflow/milestone-run.md` and
    `agent-milestone-orchestrator`. Instantiate its five milestone artifacts and pass Step 0 before
    dispatch. This route replaces the generic supervisor integration-branch mechanics for release
    milestones.

## Run ID

`<run-id>` is the current branch name with `/` replaced by `-`, followed by `--<suffix>`.

Example:

```text
doc/harness-doctrine-refactor -> doc-harness-doctrine-refactor--harness-v2-plan
```

## Profile Field

Old harness prompts used `profile: package`, `profile: frontend`, and similar task categories. Treat
that field as an intent hint. The effective run profile is:

- the selected `ARCHETYPE-*` file for package/plugin subjects, plus
- zero or more `SCOPE-*` overlays.

For docs-only harness work, use `SCOPE-docs.md` and any archetype profiles the docs must describe.

## Mandatory Artifacts

Every run directory contains:

- `supervisor.md` (supervisor identity + lane table, from `templates/supervisor.md`) — written at
  run start; a run dir without it is not activated (`workflow/lane-policy.md` § Supervisor identity)
- `research.md`
- `plan.md`
- `worklog.md` (must include a `## Design` section before implementation)
- `context-pack.md`
- `drift.md`

There is no `commits.md` — the draft-PR commit list + per-slice PR comments are the commit trail.
`implement.md` is used when the run phase needs it. `plan-eval.md` (PLAN-EVAL) and `evaluate.md`
(IMPL-EVAL) are the two evaluator verdicts; each is written in a separate session.

Supervisor (multi-group) runs additionally contain `phase-registry.md` (from
`templates/phase-registry.md`), `final-pr-handoff.md`, and an `escalations/` folder; brief each
group agent with `templates/agent-briefing.md`. See `workflow/supervisor.md`.

Milestone clusters instead contain `milestone-intake.json`, `milestone-inventory.json`,
`milestone-dependency-dag.json`, `milestone-cluster-state.json`, generated `milestone-status.md`,
`cut-trace.md`, and `receipts/`. Their leaf PRs target `main`; do not create a generic supervisor
integration branch.
