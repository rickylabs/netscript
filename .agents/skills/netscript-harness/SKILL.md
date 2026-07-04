---
name: netscript-harness
description: >
  Operating model for NetScript harness runs. Use whenever the user says
  "use harness", references a harness run, asks about archetype/profile
  selection, run artifacts, resource aggregation, commit tracking, evaluator
  protocol, rescoping, or where a lesson/doctrine update should live.
---

# NetScript Harness (V3) — Orchestration Skill

This skill coordinates harness-mode runs. The authoritative harness docs live under `.llm/harness/`;
this skill tells you what to load and in what order.

Agent lanes and their model bindings are configuration, not dogma — the single source of truth is
[`workflow/lane-policy.md`](../../../.llm/harness/workflow/lane-policy.md). Only two rules are hard:
**generator-session ≠ evaluator-session**, and the **slice review gate** (no implementation lane
self-certifies). Everything else is a per-run lane assignment recorded in the run dir's
`supervisor.md`/`drift.md`.

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
| **Tiered lanes**  | Agent lanes A–E with named model bindings; single source `workflow/lane-policy.md`.     |
| **Slice review gate** | Tier-A supervisor substantively reviews each landed slice before the sign-off commit; no lane self-certifies (A1). |
| **Supervisor identity** | Every run dir carries `supervisor.md` (model, session, host, paths, branch, baseline, lanes). |
| **Plan-Gate**     | Checklist (`gates/plan-gate.md`) that PLAN-EVAL enforces.                               |
| **Archetype**     | Package/plugin shape profile from `archetypes/ARCHETYPE-*.md`.                          |
| **Scope overlay** | `SCOPE-frontend.md`, `SCOPE-service.md`, `SCOPE-docs.md`.                               |
| **Run artifact**  | File in `.llm/runs/<run-id>/` that preserves state across sessions.                     |
| **Debt**          | Recorded in `.llm/harness/debt/arch-debt.md`.                                           |

For a **supervisor run** (two or more capability-scoped phase groups), also read
`.llm/harness/workflow/supervisor.md` and `.llm/harness/workflow/escalation.md`, and track the
groups in `phase-registry.md`.

For OpenHands, Copilot, Augment, or local-agent handoffs during a run, also read
`.llm/harness/workflow/agent-handoff.md` and `.agents/skills/openhands-handoff/SKILL.md`.

## Workflow

The user may still write `profile: package`, `profile: docs`, or similar. In V3 that field is an
intent hint, not the final profile.

| User hint                  | V3 selection                                                |
| -------------------------- | ----------------------------------------------------------- |
| `package`                  | identify `ARCHETYPE-1` through `ARCHETYPE-6`                |
| `plugin`                   | normally `ARCHETYPE-5`, unless sibling packages also change |
| `frontend`                 | affected archetype(s) plus `SCOPE-frontend.md`              |
| `service`                  | affected archetype(s) plus `SCOPE-service.md`               |
| `docs` or `knowledge-base` | `SCOPE-docs.md` plus any described archetypes               |

1. Read `workflow/activation.md` and `workflow/run-loop.md`.
2. If resuming, read `.llm/runs/<run-id>/context-pack.md`.
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

## Agent Delegation Contract

Lane assignments and model bindings are configuration. The tiered A–E model, the selection rules
(source slices → Tier D, batch/parallel → Tier C with committed `workflow.js`, research/doc prose →
Tier B), and the named model bindings are defined once in
[`workflow/lane-policy.md`](../../../.llm/harness/workflow/lane-policy.md). Do not restate lane
routing here — defer to that file. The items below are the parts of the contract that hold as
**invariants** regardless of which lane implements:

- **Generator ≠ evaluator (hard invariant).** The session that generates a plan or an
  implementation is never the session that evaluates it. Which model implements is configurable per
  run and recorded in `supervisor.md`/`drift.md`; the session separation is not.
- **Slice review gate (A1, hard invariant).** After any implementation lane lands a slice and its
  automated gates pass, the Tier-A supervisor substantively reviews the slice content before the
  sign-off commit — and the sign-off commit is the supervisor's, not the implementer's. This holds
  for every implementation tier (B Opus sub-agents, C Workflow-generated slices, D WSL Codex); no
  lane self-certifies. See `workflow/lane-policy.md` for the rule and `workflow/run-loop.md` for the
  step placement.
- **Evaluator model bindings.** PLAN-EVAL runs OpenHands minimax-M3; IMPL-EVAL runs OpenHands
  qwen-3.7-max — each unless the run artifact explicitly records why that launch path is
  unavailable. The two-failure eval loop is unchanged.
- **Tier-D mobile-visibility proof.** A Tier-D (WSL Codex) implementation slice is launched only via
  skills + `.llm/tools/agentic/` (never ad-hoc `wsl.exe`), and only when the run artifacts include
  the WSL worktree path, concrete Codex thread id, daemon-managed `remote-control` proof, and the
  follow-up steering command for that same thread. Without those, record the launch as
  failed/not-attached. Claude helpers (`codex:rescue`, `codex:codex-rescue`, `codex-companion.mjs`,
  internal `general-purpose` agents) are local tool surfaces, not daemon-attached Codex threads.
- **Per-slice trackability.** Every implementation slice is independently trackable: branch/worktree
  identity, agent/thread identity, files touched, tests run, commit hash, push status, and PR
  comment/status. Each slice commits, pushes, and comments on the draft PR before the next slice is
  considered complete (the draft-PR commit list + per-slice PR comments are the commit trail).
- **Green-gate merge bar.** Merge, publish, or release gates require all relevant tests green with
  required features intact. For catalog-related work, do not delete, skip, de-catalog, or bypass
  tests unless the evaluator verdict explicitly classifies the test as stale/irrelevant and the PR
  comment records the rationale.
- **Blocked-lane handling.** If an evaluator or implementation launch path is blocked, record the
  missing launch mechanism in `worklog.md`/`drift.md`, then proceed only with an owner-authorized
  fallback lane recorded in `supervisor.md`/`drift.md`.

## Common Pitfalls

- **Skipping Plan & Design** — The Plan-Gate is a hard stop. Implementation before PLAN-EVAL `PASS`
  is a process failure.
- **Self-evaluation** — The evaluator must be a separate session. The generator does not
  self-certify.
- **Wrong evaluator surface** — Claude internal subagents are not PLAN-EVAL or IMPL-EVAL. Use
  OpenHands with the required model, or record a blocked launch. The generator session may never
  evaluate its own output.
- **Self-certifying a slice** — a green automated gate is not a sign-off. The Tier-A supervisor must
  substantively review the slice before the sign-off commit, for every implementation lane
  (`workflow/lane-policy.md` invariant 2). No lane self-certifies.
- **Treating lanes as dogma** — the "Claude coordinates / OpenHands evaluates / Codex implements"
  fixed-lane assertion is retired. Lanes are configuration; consult `workflow/lane-policy.md` and
  honor the run's recorded lane assignments/overrides in `supervisor.md`/`drift.md`.
- **False attached-agent claims** — for Tier-D slices, a Claude `codex:*` skill/helper is not a WSL
  Codex daemon thread. Require daemon status plus thread id before claiming the user can see or steer
  the subagent from phone/Desktop.
- **Carried-in plans as ground truth** — Re-baseline against current `main` before locking the plan.
- **Monolithic commits** — Commit by slice, not by monolith. Each slice has its own gate.
- **Raw root CLI noise as a verdict** — Package-quality check/lint/fmt evidence must come from the
  scoped wrappers, not raw root `deno fmt --check` over Markdown, generated targets, or legacy
  line-ending drift (which is not a package-quality verdict source unless the plan explicitly owns
  repo-wide formatting). The wrapper invocations and verdict rules live in
  `.agents/skills/netscript-tools`.

## Run Artifacts

Run artifacts live under `.llm/runs/<run-id>/` and use templates from `.llm/harness/templates/`.

`<run-id>` is the current branch name with `/` replaced by `-`, followed by `--<suffix>`.

| File                | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `supervisor.md`     | supervisor identity (model, session, host, paths, branch, baseline, lanes) — written at run start |
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

## `.llm/runs` Path Caveat

Some search/index tools may skip or lag on freshly written `.llm/runs/` run dirs (the same caveat
that applied to the old `.llm/tmp/run/` location). Verify run paths with a direct filesystem listing
when needed:

```powershell
dir /s /b ".llm\runs\<id>" 2>&1
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

- Runs in OpenHands with minimax M3 unless blocked and recorded.
- Reads `evaluator/plan-protocol.md` + `gates/plan-gate.md`.
- Reads `research.md`, `plan.md`, and the `## Design` section.
- Writes `plan-eval.md`.
- Emits `PASS` or `FAIL_PLAN`.
- Two `FAIL_PLAN` cycles, then escalate.

**IMPL-EVAL** (final pass, after implementation):

- Runs in OpenHands with qwen 3.7 max unless blocked and recorded.
- Generator writes `worklog.md`, `context-pack.md`, `drift.md`, and `commits.md`.
- Evaluator reads `.llm/harness/evaluator/protocol.md`, the plan, worklog, context pack, drift,
  commits, selected archetype, overlays, and gate docs.
- Evaluator writes `evaluate.md` with `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.
- Eval loop limit is two failures before escalation.

## Commit Tracking

When a run requires commits:

1. commit by implementation slice,
2. push the branch,
3. comment on the PR with slice scope, commit hash, and test evidence,
4. append `.llm/runs/<run-id>/commits.md`,
5. update `context-pack.md`,
6. continue to the next slice.

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
| Package/plugin doctrine navigation            | `.claude/skills/netscript-doctrine/` |
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
  -> supervised? assign lanes per workflow/lane-policy.md (generator != evaluator session)
  -> slice landed + gates green? Tier-A supervisor reviews before the sign-off commit
  -> OpenHands/local/cloud handoff? read workflow/agent-handoff.md
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
| `.llm/harness/workflow/lane-policy.md`          | Lane assignment + model bindings |
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
- [ ] Run dir has `supervisor.md` (supervisor identity + lane table) written at run start.
- [ ] Archetype and overlays are selected and justified.
- [ ] Lane assignments follow `workflow/lane-policy.md`, or the override is recorded in
      `supervisor.md`/`drift.md`.
- [ ] Plan-Gate checklist (`gates/plan-gate.md`) was reviewed.
- [ ] PLAN-EVAL returned `PASS` before any implementation slice.
- [ ] PLAN-EVAL used OpenHands/minimax M3, or the blocked launch was recorded.
- [ ] Tier-D (WSL Codex) slices recorded daemon-managed proof, thread id, worktree, and steering
      command.
- [ ] The slice review gate was performed (Tier-A substantive review) before each sign-off commit;
      no lane self-certified.
- [ ] Each implementation slice was committed, pushed, and commented on the draft PR.
- [ ] IMPL-EVAL is a separate session from the generator.
- [ ] IMPL-EVAL used OpenHands/qwen 3.7 max, or the blocked launch was recorded.
