---
name: netscript-harness
description: >
  Operating model for NetScript harness v2 runs. Use whenever the user says
  "use harness", references a harness run, asks about archetype/profile
  selection, run artifacts, resource aggregation, commit tracking, evaluator
  protocol, rescoping, or where a lesson/doctrine update should live.
---

# NetScript Harness v2 — Orchestration Skill

This skill coordinates harness-mode runs. The authoritative harness docs live
under `.llm/harness/`; this skill tells you what to load and in what order.

## 1. Activation

The harness activates on any prompt containing `use harness` or an equivalent
request for a harnessed run.

On activation, read:

1. `.llm/harness/workflow/activation.md`
2. `.llm/harness/workflow/run-loop.md`
3. `.llm/tmp/run/<run-id>/context-pack.md` if resuming
4. `.llm/harness/archetypes/README.md`
5. selected `ARCHETYPE-*` profile and any `SCOPE-*` overlays
6. `.llm/harness/gates/archetype-gate-matrix.md`

For package/plugin work, also use `.claude/skills/netscript-doctrine/SKILL.md`.

For a **supervisor run** (two or more capability-scoped phase groups), also read
`.llm/harness/workflow/supervisor.md` and `.llm/harness/workflow/escalation.md`,
and track the groups in `phase-registry.md`.

## 2. From Prompt Profile to v2 Profile

The user may still write `profile: package`, `profile: docs`, or similar. In v2
that field is an intent hint, not the final profile.

| User hint | v2 selection |
|-----------|--------------|
| `package` | identify `ARCHETYPE-1` through `ARCHETYPE-6` |
| `plugin` | normally `ARCHETYPE-5`, unless sibling packages also change |
| `frontend` | affected archetype(s) plus `SCOPE-frontend.md` |
| `service` | affected archetype(s) plus `SCOPE-service.md` |
| `docs` or `knowledge-base` | `SCOPE-docs.md` plus any described archetypes |

If no package/plugin is touched, an overlay-only run is valid.

## 3. Run ID

`<run-id>` is the current branch name with `/` replaced by `-`, followed by
`--<suffix>`.

Example:

```text
feat/frontend-rfc-implementation -> feat-frontend-rfc-implementation--package-kv-refactor
```

## 4. Run Artifacts

Run artifacts live under `.llm/tmp/run/<run-id>/` and use templates from
`.llm/harness/templates/`.

| File | Purpose |
|------|---------|
| `plan.md` | approved scope, archetype, gates, debt implications |
| `implement.md` | generator prompt when needed |
| `worklog.md` | implementation evidence and gate results |
| `evaluate.md` | separate evaluator verdict |
| `context-pack.md` | resumable summary |
| `drift.md` | append-only drift log |
| `commits.md` | append-only commit list |
| `phase-registry.md` | supervisor runs only: phase-group map + live status (template) |

Append `commits.md` immediately after every commit. Supervisor runs additionally
keep `phase-registry.md`, `final-pr-handoff.md`, and an `escalations/` folder;
brief each group agent with `templates/agent-briefing.md`.

## 5. `.llm/tmp` Path Caveat

Some search/index tools may skip or lag on `.llm/tmp/`. Verify run paths with a
direct filesystem listing when needed:

```powershell
dir /s /b ".llm\tmp\run\<id>" 2>&1
```

## 6. Resource Aggregation

When external docs or examples matter:

1. check `.resources/deps-docs/`,
2. check `.llm/tmp/docs/`,
3. fetch official/primary docs with available docs tooling,
4. save useful extracts to `.llm/tmp/docs/<source>-<topic>.md`,
5. cite the extract in the run artifact.

## 7. Evaluator Separation

The evaluator must be a separate session.

- Generator writes `worklog.md`, `context-pack.md`, `drift.md`, and
  `commits.md`.
- Evaluator reads `.llm/harness/evaluator/protocol.md`, the plan, worklog,
  context pack, drift, commits, selected archetype, overlays, and gate docs.
- Evaluator writes `evaluate.md` with `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or
  `FAIL_DEBT`.
- Eval loop limit is two failures before escalation.

## 8. Commit Tracking

When a run requires commits:

1. commit by major section,
2. append `.llm/tmp/run/<run-id>/commits.md`,
3. update `context-pack.md`,
4. continue to the next section.

Commit log format:

```md
- <commit-sha>: <commit message>
```

## 9. Rescoping

Rescope when the real work is materially larger than the approved plan or when
the selected archetype is wrong. Confirm with the user before expanding scope.

Record rescope evidence in `drift.md` with severity `significant` or
`architectural`.

## 10. Where Lessons Belong

| Content type | Destination |
|--------------|-------------|
| Generic run mechanics | `.llm/harness/workflow/` |
| Archetype-specific gates or false-done states | `.llm/harness/archetypes/` |
| Stable repeated cross-run lessons | `.llm/harness/lessons/` |
| Package/plugin doctrine navigation | `.claude/skills/netscript-doctrine/` |
| Deep domain expertise | a focused skill |
| Deferred doctrine violations | `.llm/harness/debt/arch-debt.md` |

## Quick Decision Tree

```text
User says "use harness"
  -> read workflow/activation.md and workflow/run-loop.md
  -> resuming? read context-pack.md
  -> package/plugin? select ARCHETYPE-* and load netscript-doctrine
  -> frontend/service/docs? apply SCOPE-* overlay
  -> two or more phase groups? read workflow/supervisor.md + escalation.md, keep phase-registry.md
  -> read gate matrix
  -> update run artifacts while working
  -> commit tracking required? append commits.md after every commit
  -> discovered violation not fixed? update arch-debt.md
  -> evaluator is separate session
```
