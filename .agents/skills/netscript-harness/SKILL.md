---
name: netscript-harness
description: >
  Operating model for NetScript harness v2 runs. Use whenever the user says
  "use harness", references a harness run, asks about archetype/profile
  selection, run artifacts, resource aggregation, commit tracking, evaluator
  protocol, rescoping, or where a lesson/doctrine update should live.
---

# NetScript Harness v2 — Orchestration Skill

This skill coordinates harness-mode runs. The authoritative harness docs live under `.llm/harness/`;
this skill tells you what to load and in what order.

## When to Use

- The user says `use harness` or asks for a harnessed run.
- Selecting archetypes, scope overlays, or gate sets.
- Tracking run artifacts, commits, or drift.
- Understanding evaluator protocol (PLAN-EVAL or IMPL-EVAL).
- Deciding where a lesson or doctrine update should live.

## When Not to Use

- For package/plugin architecture decisions — use `netscript-doctrine`.
- For JSR readiness audits — use `jsr-audit`.
- For frontend/framework-specific questions — use `deno-fresh` or the relevant domain skill.

## Key Concepts

| Concept           | Meaning                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------- |
| **8-phase model** | Bootstrap → Research → Plan & Design → Plan-Gate → Implement → Gate → Evaluate → Close. |
| **PLAN-EVAL**     | First evaluator pass, before implementation. Hard stop.                                 |
| **IMPL-EVAL**     | Final evaluator pass, after implementation.                                             |
| **Plan-Gate**     | Checklist (`gates/plan-gate.md`) that PLAN-EVAL enforces.                               |
| **Archetype**     | Package/plugin shape profile from `archetypes/ARCHETYPE-*.md`.                          |
| **Scope overlay** | `SCOPE-frontend.md`, `SCOPE-service.md`, `SCOPE-docs.md`.                               |
| **Run artifact**  | File in `.llm/tmp/run/<run-id>/` that preserves state across sessions.                  |
| **Debt**          | Recorded in `.llm/harness/debt/arch-debt.md`.                                           |

## Workflow

1. Read `workflow/activation.md` and `workflow/run-loop.md`.
2. If resuming, read `.llm/tmp/run/<run-id>/context-pack.md`.
3. Identify the target surface and select archetype + overlays.
4. Read `gates/archetype-gate-matrix.md` and `gates/plan-gate.md`.
5. Scaffold run artifacts from `templates/`.
6. Produce `research.md`, then `plan.md` with locked decisions.
7. Record Design checkpoint in `worklog.md`.
8. **Run PLAN-EVAL (separate session). No implementation before PASS.**
9. Implement one commit slice at a time; append `commits.md` after each.
10. Run gates; record results in `worklog.md`.
11. **Run IMPL-EVAL (separate session).**
12. Close: update `context-pack.md`, `arch-debt.md`, and promote lessons if warranted.

## Common Pitfalls

- **Skipping Plan & Design** — The Plan-Gate is a hard stop. Implementation before PLAN-EVAL `PASS`
  is a process failure.
- **Self-evaluation** — The evaluator must be a separate session. The generator does not
  self-certify.
- **Carried-in plans as ground truth** — Re-baseline against current `main` before locking the plan.
- **Monolithic commits** — Commit by slice, not by monolith. Each slice has its own gate.
- **Raw root CLI noise as a verdict** — Package-quality check/lint/fmt evidence should use the
  scoped wrappers `.llm/tools/run-deno-check.ts`, `.llm/tools/run-deno-lint.ts`, and
  `.llm/tools/run-deno-fmt.ts`. They select explicit roots, file extensions, and excludes, then emit
  compact structured output. Raw root `deno fmt --check` over Markdown, generated targets, or legacy
  line-ending drift is not a package-quality verdict source unless the plan explicitly owns
  repo-wide formatting.

## Run Artifacts

Run artifacts live under `.llm/tmp/run/<run-id>/` and use templates from `.llm/harness/templates/`.

| File                | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `research.md`       | deep findings, re-baseline of carried-in plans              |
| `plan.md`           | approved scope, archetype, gates, debt implications         |
| `implement.md`      | generator prompt when needed                                |
| `worklog.md`        | implementation evidence and gate results                    |
| `plan-eval.md`      | PLAN-EVAL verdict (separate session, before implementation) |
| `evaluate.md`       | IMPL-EVAL verdict (separate session, after implementation)  |
| `context-pack.md`   | resumable summary                                           |
| `drift.md`          | append-only drift log                                       |
| `commits.md`        | append-only commit list                                     |
| `phase-registry.md` | supervisor runs only: phase-group map + live status         |

Append `commits.md` immediately after every commit. Supervisor runs additionally keep
`phase-registry.md`, `final-pr-handoff.md`, and an `escalations/` folder; brief each group agent
with `templates/agent-briefing.md`.

## `.llm/tmp` Path Caveat

Some search/index tools may skip or lag on `.llm/tmp/`. Verify run paths with a direct filesystem
listing when needed:

```powershell
dir /s /b ".llm\tmp\run\<id>" 2>&1
```

## Resource Aggregation

When external docs or examples matter:

1. check `.resources/deps-docs/`,
2. check `.llm/tmp/docs/`,
3. fetch official/primary docs with available docs tooling,
4. save useful extracts to `.llm/tmp/docs/<source>-<topic>.md`,
5. cite the extract in the run artifact.

## Evaluator Separation

There are **two** separate-session evaluator passes.

**PLAN-EVAL** (before implementation):

- Reads `evaluator/plan-protocol.md` + `gates/plan-gate.md`.
- Reads `research.md`, `plan.md`, and the `## Design` section.
- Writes `plan-eval.md`.
- Emits `PASS` or `FAIL_PLAN`.
- Two `FAIL_PLAN` cycles, then escalate.

**IMPL-EVAL** (final pass, after implementation):

- Generator writes `worklog.md`, `context-pack.md`, `drift.md`, and `commits.md`.
- Evaluator reads `.llm/harness/evaluator/protocol.md`, the plan, worklog, context pack, drift,
  commits, selected archetype, overlays, and gate docs.
- Evaluator writes `evaluate.md` with `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.
- Eval loop limit is two failures before escalation.

## Commit Tracking

When a run requires commits:

1. commit by major section,
2. append `.llm/tmp/run/<run-id>/commits.md`,
3. update `context-pack.md`,
4. continue to the next section.

Commit log format:

```md
- <commit-sha>: <commit message>
```

## Rescoping

Rescope when the real work is materially larger than the approved plan or when the selected
archetype is wrong. Confirm with the user before expanding scope.

Record rescope evidence in `drift.md` with severity `significant` or `architectural`.

## Where Lessons Belong

| Content type                                  | Destination                          |
| --------------------------------------------- | ------------------------------------ |
| Generic run mechanics                         | `.llm/harness/workflow/`             |
| Archetype-specific gates or false-done states | `.llm/harness/archetypes/`           |
| Stable repeated cross-run lessons             | `.llm/harness/lessons/`              |
| Package/plugin doctrine navigation            | `.agents/skills/netscript-doctrine/` |
| Deep domain expertise                         | a focused skill                      |
| Deferred doctrine violations                  | `.llm/harness/debt/arch-debt.md`     |

## Quick Decision Tree

```text
User says "use harness"
  -> read workflow/activation.md and workflow/run-loop.md
  -> resuming? read context-pack.md
  -> package/plugin? select ARCHETYPE-* and load netscript-doctrine
  -> frontend/service/docs? apply SCOPE-* overlay
  -> two or more phase groups? read workflow/supervisor.md + escalation.md, keep phase-registry.md
  -> read gate matrix + plan-gate.md
  -> plan committed? run PLAN-EVAL (separate session); no slice before PASS
  -> update run artifacts while working
  -> commit tracking required? append commits.md after every commit
  -> discovered violation not fixed? update arch-debt.md
  -> evaluator is separate session
```

## Reference Files

| File                                            | Load when                   |
| ----------------------------------------------- | --------------------------- |
| `.llm/harness/workflow/activation.md`           | Every harness run           |
| `.llm/harness/workflow/run-loop.md`             | Every harness run           |
| `.llm/harness/workflow/supervisor.md`           | Multi-group supervisor runs |
| `.llm/harness/gates/plan-gate.md`               | Plan-Gate checklist         |
| `.llm/harness/evaluator/plan-protocol.md`       | PLAN-EVAL instructions      |
| `.llm/harness/evaluator/protocol.md`            | IMPL-EVAL instructions      |
| `.llm/harness/evaluator/verdict-definitions.md` | Verdict meanings            |
| `.llm/harness/gates/archetype-gate-matrix.md`   | Gate selection              |
| `.llm/harness/archetypes/README.md`             | Archetype selection         |
| `.llm/harness/templates/`                       | Run artifact scaffolding    |
| `.llm/harness/debt/arch-debt.md`                | Debt registry               |

## Checklist

- [ ] `workflow/activation.md` and `workflow/run-loop.md` were read.
- [ ] Archetype and overlays are selected and justified.
- [ ] Plan-Gate checklist (`gates/plan-gate.md`) was reviewed.
- [ ] PLAN-EVAL returned `PASS` before any implementation slice.
- [ ] Commits are appended to `commits.md` immediately after creation.
- [ ] IMPL-EVAL is a separate session from the generator.
