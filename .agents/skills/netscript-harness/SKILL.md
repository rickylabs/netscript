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
[`workflow/lane-policy.md`](../../../.llm/harness/workflow/lane-policy.md). Three rules are hard:
**generator-session ≠ evaluator-session**, **generator vendor family ≠ evaluator vendor family**,
and the **slice review gate** (no implementation lane self-certifies). Workload tier, role, route,
and fallbacks are recorded in the run dir's `supervisor.md`/`drift.md`.

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

| Concept                 | Meaning                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **9-phase model**       | Bootstrap → Research → Plan & Design → Plan-Gate → Implement → Gate → Evaluate → Release → Close.                                                                              |
| **PLAN-EVAL**           | Conditional pre-implementation pass for complex/decision-heavy work; hard stop when selected.                                                                                  |
| **IMPL-EVAL**           | Mandatory final pass after implementation unless the owner explicitly waives it.                                                                                               |
| **Routing matrix**      | Five workload tiers and four coordinator tiers with role-specific routes; single source `workflow/lane-policy.md`.                                                             |
| **Slice review gate**   | Tier-A supervisor substantively reviews each landed slice before the sign-off commit; no lane self-certifies (A1).                                                             |
| **Supervisor identity** | Every run dir carries `supervisor.md` (model, session, host, paths, branch, baseline, lanes).                                                                                  |
| **Plan-Gate**           | Checklist (`gates/plan-gate.md`) that PLAN-EVAL enforces.                                                                                                                      |
| **Archetype**           | Package/plugin shape profile from `archetypes/ARCHETYPE-*.md`.                                                                                                                 |
| **Scope overlay**       | `SCOPE-frontend.md`, `SCOPE-service.md`, `SCOPE-docs.md`.                                                                                                                      |
| **Seed run**            | Planning-only run shape (`workflow/seed-run.md`): discovery → roadmap → owner-ratified one-shot GitHub filing. Use when the deliverable is a board (epics + issues), not code. |
| **Milestone cluster**   | Release run shape (`workflow/milestone-run.md`): Step 0 intake/cleanup/DAG → four topic orchestrators → direct-to-main leaves → canaries/stable cut.                           |
| **Run artifact**        | File in `.llm/runs/<run-id>/` that preserves state across sessions.                                                                                                            |
| **Debt**                | Recorded in `.llm/harness/debt/arch-debt.md`.                                                                                                                                  |

For a **supervisor run** (two or more capability-scoped phase groups), also read
`.llm/harness/workflow/supervisor.md` and `.llm/harness/workflow/escalation.md`, and track the
groups in `phase-registry.md`.

For a **release milestone**, use the milestone-cluster route instead: read
`workflow/milestone-run.md` and `agent-milestone-orchestrator`. Do not apply the generic supervisor
integration branch. Create the intake, inventory, DAG, cluster-state, and generated status
artifacts; Step 0 must validate before any implementation or evaluation lane starts.

For OpenHands or local-agent handoffs during a run, also read
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
8. **For complex/decision-heavy work, run PLAN-EVAL in a separate session before implementation;
   otherwise record a justified `PLAN-EVAL: N/A`.**
9. Implement one commit slice at a time; push + comment on the draft PR (the commit trail) and keep
   `worklog.md`/`context-pack.md` current after each.
10. Run gates; record results in `worklog.md`.
11. **Run IMPL-EVAL (separate session) unless the owner explicitly waives it.**
12. Close: update `context-pack.md`, `arch-debt.md`, and promote lessons if warranted.

When the opening diff is docs-only, proactively apply `ci:skip-e2e` to the draft PR and also apply
`ci:skip-scaffold` when scaffold-static is not applicable. Use `ci:full` as the escape hatch when
the docs-only change must exercise the full CI surface. Record the selection in the opening phase
comment so the evaluator can verify that the cheap lane is intentional.

## Human Review Surface

Keep user-facing plans, issues, PRs, benchmark reports, and handoffs compact. Lead with the
decision, measured evidence, total footprint, risk, and next action. Link raw evidence instead of
copying run machinery or phase ledgers into the review surface. If the original goal is not obvious
on one screen, consolidate and simplify before asking for coordination or review.

## Agent Delegation Contract

Lane assignments and model bindings are configuration. Operational execution tiers still describe
how work is launched, while workload tiers and role bindings are defined once in
[`workflow/lane-policy.md`](../../../.llm/harness/workflow/lane-policy.md). Do not restate lane
routing here — defer to that file. The items below are the parts of the contract that hold as
**invariants** regardless of which lane implements:

- **Generator ≠ evaluator (hard invariant).** The session that generates a plan or an implementation
  is never the session that evaluates it. Which model implements is configurable per run and
  recorded in `supervisor.md`/`drift.md`; the session separation is not.
- **Slice review gate (A1, hard invariant).** After any implementation lane lands a slice and its
  automated gates pass, the Tier-A supervisor substantively reviews the slice content before the
  sign-off commit — and the sign-off commit is the supervisor's, not the implementer's. This holds
  for every implementation tier (B Opus sub-agents, C Workflow-generated slices, D WSL Codex); no
  lane self-certifies. See `workflow/lane-policy.md` for the rule and `workflow/run-loop.md` for the
  step placement.
- **Evaluator route binding.** Select the evaluator from the workload tier and phase in
  `workflow/lane-policy.md`, skip candidates from the selected generator's vendor family, and record
  the complete route in the run. PLAN-EVAL is risk-selected. Re-steer the same evaluator and obey
  the tier-specific round/notification policy; do not substitute a global retry rule.
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

- **Skipping a selected Plan-Gate** — for complex/decision-heavy work, implementation before
  PLAN-EVAL `PASS` is a process failure. Small/mechanical work records `PLAN-EVAL: N/A` first.
- **Self-evaluation** — The evaluator must be a separate session. The generator does not
  self-certify.
- **Wrong evaluator route** — select from the workload tier and phase, preserve separate sessions,
  and skip same-vendor-family candidates. Apply the provider order Claude → Codex → Google →
  OpenCode Go → Ollama → OpenRouter only among capabilities for the selected logical model. Paid
  routes require a fresh expense decision. Record every fallback and requested/observed identity.
- **Self-certifying a slice** — a green automated gate is not a sign-off. The Tier-A supervisor must
  substantively review the slice before the sign-off commit, for every implementation lane
  (`workflow/lane-policy.md` invariant 2). No lane self-certifies.
- **Treating lanes as dogma** — the "Claude coordinates / OpenHands evaluates / Codex implements"
  fixed-lane assertion is retired. Lanes are configuration; consult `workflow/lane-policy.md` and
  honor the run's recorded lane assignments/overrides in `supervisor.md`/`drift.md`.
- **False attached-agent claims** — for Tier-D slices, a Claude `codex:*` skill/helper is not a WSL
  Codex daemon thread. Require daemon status plus thread id before claiming the user can see or
  steer the subagent from phone/Desktop.
- **Carried-in plans as ground truth** — Re-baseline against current `main` before locking the plan.
- **Monolithic commits** — Commit by slice, not by monolith. Each slice has its own gate.
- **Raw root CLI noise as a verdict** — Package-quality check/lint/fmt evidence must come from the
  scoped wrappers, not raw root `deno fmt --check` over Markdown, generated targets, or legacy
  line-ending drift (which is not a package-quality verdict source unless the plan explicitly owns
  repo-wide formatting). The wrapper invocations and verdict rules live in
  `.agents/skills/netscript-tools`.
- **Scoped wrappers as a full quality verdict** — the scoped check/lint/fmt wrappers pass code
  containing `any` and honor inline `// deno-lint-ignore no-explicit-any`, so a green wrapper run
  does NOT prove doctrine/jsr compliance. For any slice touching `packages/**` or `plugins/**`, the
  Tier-A slice review MUST additionally run `deno task quality:scan` (fails on `any`+casting and
  host-side hardcoded plugin names — the two classes that reached `main` in #745) and
  `deno task arch:check` (doctrine fitness), plus the jsr-audit skill for package/plugin waves. A
  new `// deno-lint-ignore` or `as unknown as` introduced to green a wrapper is a review-blocking
  finding, not a pass. Reviewing on wrappers alone is the exact hole that let #745 merge.

## Run Artifacts

Run artifacts live under `.llm/runs/<run-id>/` and use templates from `.llm/harness/templates/`.

They are intentionally committed cross-agent context, including the identity, worktree-path,
receipt, and resumable-state records needed to continue or audit a run. Do not strip, untrack,
redact, or block a PR merely because its scoped run directory contains those records. Secrets and
tokens are forbidden in run artifacts. Retention is owner-controlled: after a stable release the
owner may select run directories for cleanup and may preserve selected runs across milestones; no
agent may perform that cleanup pre-release or infer a deletion set without the owner's instruction.

`<run-id>` is the current branch name with `/` replaced by `-`, followed by `--<suffix>`.

| File                | Purpose                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `supervisor.md`     | supervisor identity (model, session, host, paths, branch, baseline, lanes) — written at run start |
| `research.md`       | deep findings, re-baseline of carried-in plans                                                    |
| `plan.md`           | approved scope, archetype, gates, debt implications                                               |
| `implement.md`      | generator prompt when needed                                                                      |
| `worklog.md`        | implementation evidence and gate results                                                          |
| `plan-eval.md`      | PLAN-EVAL verdict (separate session, before implementation)                                       |
| `evaluate.md`       | IMPL-EVAL verdict (separate session, after implementation)                                        |
| `context-pack.md`   | resumable summary                                                                                 |
| `drift.md`          | append-only drift log                                                                             |
| `phase-registry.md` | supervisor runs only: phase-group map + live status                                               |

There is no `commits.md` — the draft-PR commit list + per-slice PR comments are the commit trail.
Keep `worklog.md` + `context-pack.md` current as part of every slice. Supervisor runs additionally
keep `phase-registry.md`, `final-pr-handoff.md`, and an `escalations/` folder; brief each group
agent with `templates/agent-briefing.md`.

Milestone clusters additionally keep `milestone-intake.json`, `milestone-inventory.json`,
`milestone-dependency-dag.json`, `milestone-cluster-state.json`, generated `milestone-status.md`,
`cut-trace.md`, and `receipts/`. Run `harness:milestone:render` after every state transition and
`harness:milestone:validate` before dispatch or release-captain activation. New milestone clusters
use schema-v2 `reporting` and the hourly/event-driven owner-facing contract in
`workflow/milestone-reporting.md`; its generated report is also the pace/intervention surface.

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

There are **two** separate-session evaluator phases. Both use the workload tier's typed route from
`workflow/lane-policy.md`, and both must differ from the generator by session and vendor family.
Provider fallback is capability- and allowance-aware; no lane may self-certify.

**PLAN-EVAL** (before implementation):

- Runs only for genuinely complex or decision-heavy work; quick fixes record `PLAN-EVAL: N/A`.
- Runs in a separate session on the evaluator lane selected from `workflow/lane-policy.md`.
- Reads `evaluator/plan-protocol.md` + `gates/plan-gate.md`.
- Reads `research.md`, `plan.md`, and the `## Design` section.
- Writes `plan-eval.md`.
- Emits `PASS` or `FAIL_PLAN`.
- Follow the selected tier's PLAN-EVAL repair and escalation policy.

**IMPL-EVAL** (final pass, after implementation):

- Runs in a separate session on the evaluator lane selected from `workflow/lane-policy.md`.
- Generator writes `worklog.md`, `context-pack.md`, and `drift.md`.
- Evaluator reads `.llm/harness/evaluator/protocol.md`, the plan, worklog, context pack, drift, the
  draft-PR commit list + per-slice PR comments (the commit trail), selected archetype, overlays, and
  gate docs.
- Evaluator writes `evaluate.md` with `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.
- Re-steer the same evaluator and follow the selected tier's IMPL-EVAL maximum and
  owner-notification point. Documentation is capped at two rounds.

## Commit Trail

When a run requires commits, the draft PR's commit list + per-slice PR comments **are** the commit
trail — there is no `commits.md`. Per slice:

1. commit by implementation slice (message names what the slice proves, not what it contains),
2. push the branch,
3. comment on the draft PR with slice scope, commit hash, and gate/test evidence,
4. update `worklog.md` + `context-pack.md` as part of the same slice (a slice whose commit does not
   touch the run dir is incomplete),
5. continue to the next slice.

The draft PR is opened in the same session as the first commit, so its commit list is live and
reviewable from mobile without cloning or diffing.

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
  -> deliverable is a board (epics/issues/milestones from a major feature, refactor, replan,
     or triage)? read workflow/seed-run.md — drafts only until owner ratification
  -> deliverable is a release milestone landed through multiple PRs? read workflow/milestone-run.md
     — Step 0 sweep/cleanup/DAG, four topic orchestrators, direct-to-main leaves
  -> deliverable is code for a single scoped change? stay on run-loop.md (a seed run here is
     ceremony)
  -> package/plugin? select ARCHETYPE-* and load netscript-doctrine
  -> frontend/service/docs? apply SCOPE-* overlay
  -> two or more phase groups? read workflow/supervisor.md + escalation.md, keep phase-registry.md
  -> read gate matrix + plan-gate.md
  -> complex/decision-heavy plan or genuine need for adversarial advice? run PLAN-EVAL (separate session); otherwise record PLAN-EVAL: N/A
  -> supervised? assign lanes per workflow/lane-policy.md (generator != evaluator session)
  -> slice landed + gates green? Tier-A supervisor reviews before the sign-off commit
  -> OpenHands/local/cloud handoff? read workflow/agent-handoff.md
  -> update run artifacts while working
  -> commit slice? push + comment on the draft PR (the commit trail); keep worklog/context-pack current
  -> discovered violation not fixed? update arch-debt.md
  -> evaluator is separate session
```

## Reference Files

| File                                            | Load when                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `.llm/harness/workflow/activation.md`           | Every harness run                                                               |
| `.llm/harness/workflow/run-loop.md`             | Every harness run                                                               |
| `.llm/harness/workflow/lane-policy.md`          | Lane assignment + model bindings                                                |
| `.llm/harness/workflow/doc-audit.md`            | Matrix-routed whole-changeset documentation audit and polish                    |
| `.llm/harness/workflow/supervisor.md`           | Multi-group supervisor runs                                                     |
| `.llm/harness/workflow/seed-run.md`             | Planning-only board-seeding runs (discovery → roadmap → owner-ratified filing)  |
| `.llm/harness/workflow/milestone-run.md`        | Release milestone clusters from Step 0 through stable cut                       |
| `.llm/harness/workflow/milestone-reporting.md`  | Required coordinator status shape, cadence, ETA, scope, and orchestrator matrix |
| `.llm/harness/gates/plan-gate.md`               | Plan-Gate checklist                                                             |
| `.llm/harness/evaluator/plan-protocol.md`       | PLAN-EVAL instructions                                                          |
| `.llm/harness/evaluator/protocol.md`            | IMPL-EVAL instructions                                                          |
| `.llm/harness/evaluator/verdict-definitions.md` | Verdict meanings                                                                |
| `.llm/harness/gates/archetype-gate-matrix.md`   | Gate selection                                                                  |
| `.llm/harness/archetypes/README.md`             | Archetype selection                                                             |
| `.llm/harness/templates/`                       | Run artifact scaffolding                                                        |
| `.llm/harness/debt/arch-debt.md`                | Debt registry                                                                   |

## Checklist

- [ ] `workflow/activation.md` and `workflow/run-loop.md` were read.
- [ ] Run dir has `supervisor.md` (supervisor identity + lane table) written at run start.
- [ ] Archetype and overlays are selected and justified.
- [ ] Lane assignments follow `workflow/lane-policy.md`, or the override is recorded in
      `supervisor.md`/`drift.md`.
- [ ] Plan-Gate checklist (`gates/plan-gate.md`) was reviewed.
- [ ] PLAN-EVAL returned `PASS` before implementation when selected, or a justified `PLAN-EVAL: N/A`
      was recorded first.
- [ ] Any PLAN-EVAL used the workload-tier route and recorded any fallback.
- [ ] Tier-D (WSL Codex) slices recorded daemon-managed proof, thread id, worktree, and steering
      command.
- [ ] The slice review gate was performed (Tier-A substantive review) before each sign-off commit;
      no lane self-certified.
- [ ] Each implementation slice was committed, pushed, and commented on the draft PR.
- [ ] IMPL-EVAL is a separate session from the generator.
- [ ] IMPL-EVAL used the workload-tier route and recorded any blocked or fallback launch.
