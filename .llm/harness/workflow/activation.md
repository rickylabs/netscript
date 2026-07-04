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
7. Read `gates/plan-gate.md` and `evaluator/plan-protocol.md`. The Plan-Gate is a hard stop before
   any implementation slice.
8. Instantiate or update the run artifacts from `templates/`.
9. For a **supervisor / multi-group run** (two or more phase groups), also read
   `workflow/supervisor.md` and `workflow/escalation.md`, and instantiate `phase-registry.md` from
   `templates/`.

## Run ID

`<run-id>` is the current branch name with `/` replaced by `-`, followed by `--<suffix>`.

Example:

```text
doc/harness-doctrine-refactor -> doc-harness-doctrine-refactor--harness-v2-plan
```

## Profile Field

Old harness prompts used `profile: package`, `profile: frontend`, and similar task categories.
Treat that field as an intent hint. The effective run profile is:

- the selected `ARCHETYPE-*` file for package/plugin subjects, plus
- zero or more `SCOPE-*` overlays.

For docs-only harness work, use `SCOPE-docs.md` and any archetype profiles the docs must describe.

## Mandatory Artifacts

Every run directory contains:

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
