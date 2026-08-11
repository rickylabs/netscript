# Phase Registry: plan-devtools-contribution--seed

> **Adapted shape, recorded deliberately.** `templates/phase-registry.md` maps *capability-scoped
> phase groups* (one branch + worktree + nested run + sub-PR each) for a supervisor run that lands
> code. This is a **planning-only seed run**: it has one branch and one draft PR, and its parallel
> structure is the seed-run **stage** contract A–I plus the stage-D topic fan-out. The registry below
> tracks those stages and topics. The charter requires a `phase-registry.md`; this is it, honestly
> shaped to the run rather than cargo-culted.

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `plan-devtools-contribution--seed` |
| Branch | `plan/devtools-contribution` (single branch — no integration branch) |
| Base branch | `main` @ `2256a67bf` |
| Draft PR | _(filled at stage A completion)_ |

## Status Legend

| Status | Meaning |
| --- | --- |
| `planned` | In the map, not started |
| `active` | In progress in this session or a dispatched lane |
| `evaluating` | Handed to a separate evaluator session |
| `done` | Landed + committed + supervisor-reviewed |
| `blocked` | Waiting on a dependency or an owner decision |

## Stage registry

| Stage | Contract (produce → proof) | Lane | Status |
| --- | --- | --- | --- |
| **A — Bootstrap** | `supervisor.md` + run dir + draft PR + charter read-back → opening PR comment | Opus 5 · high (this session) | `active` |
| **B — Discovery corpus** | Multi-surface deep search across repo source, docs, and external/market solutions; structured per-topic outputs; drift-candidate ledger → committed corpus, every claim cited | Opus 5 · high + `claude_workflow` (Opus 5 · low) with `workflow.js` committed before execution | `planned` |
| **C — Synthesis** | Supervisor reads the **full** corpus; synthesis naming deep-dive topics + resolutions of delegated decisions → committed `research.md` | Opus 5 · high | `planned` |
| **D — Deep-dive packs** | One focused sub-agent per topic; each returns `proposal` + `epic-and-issues` (draft text only) + `agent-briefs` + `open-questions` → committed `design/<topic>/` | Fable 5 · medium (`deep_analysis`) | `planned` |
| **D2 — Design/UX pass** | Mandatory major-UI/UX design route + optional vision-evidence lane → `design/ux-evidence/` with per-finding dispositions | GLM 5.2 · xhigh (`major_ui_ux_design`); Kimi K3 vision conditional | `planned` |
| **E — Plan lock + RFC** | Canonical RFC + integrated `plan.md`: locked decisions, numbered owner-fork sweep, cross-epic DAG, milestone train, risk register, gate matrix → PR body refreshed + stage comment | Opus 5 · high | `planned` |
| **F — Adversarial** | Unoriented review of the locked plan on a model distinct from every authoring lane; severity-tagged findings → findings file + per-finding disposition + fix commits | distinct-model reviewer, then Opus 5 · high | `planned` |
| **G — PLAN-EVAL** | Separate-session verdict of record → `plan-eval.md` = `PASS`. **Hard stop**: no stage H before PASS | Codex · GPT-5.6 Sol · high, fresh daemon-attached session, own worktree | `planned` |
| **H — Ratify + file** | Owner decision brief (numbered forks) → owner picks → one-shot filing from a committed manifest → `FILING-LOG.md` + supersession map | owner, then Opus 5 · high | `blocked` (owner gate) |
| **I — Handoff** | Implementation lanes launched from GitHub + the design packs, not this run's chat history; per-epic briefs carry `use harness` + a `## SKILL` chapter | Opus 5 · high | `planned` |

## Stage-D topic fan-out (provisional)

Topics are **finalized at stage C** from the corpus, not guessed at bootstrap. The provisional set
below maps the charter's twelve questions onto focused packs so the fan-out is reviewable early; it
will be amended in place when stage C lands.

| Topic | Charter questions covered | Status |
| --- | --- | --- |
| `T1-host-shape` — DevTools as plugin/resource/host vs app-mounted mode; local/deployed/remote behavior | Q1 | `planned` |
| `T2-contribution-family` — envelope/versioning, identity, discovery, generated registry, capabilities, negotiation, ordering, collisions, quarantine, budgets, lifecycle | Q2 | `planned` |
| `T3-contribution-kinds` — the kind catalogue and each kind's contract + real first-party consumer | Q3 | `planned` |
| `T4-boundaries` — production admin vs developer diagnostics; Aspire / Scalar / DevTools ownership | Q4, Q5 | `planned` |
| `T5-data-plane` — typed contracts, SDK consumption, context, live updates, caching, auth propagation, streaming, OTel correlation | Q6 | `planned` |
| `T6-trust-model` — security tiers, RBAC, origin/CSRF, local-only defaults, production enablement, secrets, plugin trust, isolation, audit | Q7 | `planned` |
| `T7-build-dev` — Fresh/Vite integration, HMR, islands, resolution, registry transactions, install/update/remove, `plugin dev`, doctor; Vite-contribution prerequisite-or-deferred | Q8, surface #3 | `planned` |
| `T8-information-architecture` — non-generic IA, worked first-party examples, full state matrix | Q9 | `planned` |
| `T9-supersession` — file-level and issue-level map for #400 and children | Q10 | `planned` |
| `T10-packaging-and-roadmap` — packages/plugins, archetypes, API sketches, journeys, threat model, observability, a11y, responsive, testing, browser/release gates, implementation DAG | Q11 | `planned` |
| `T11-staged-rfcs` — which seams become follow-up RFCs, with consumed contracts, entry criteria, owning dependency | Q12 | `planned` |

## Summary Table

| Stage | Status | Depends on | Output |
| --- | --- | --- | --- |
| A | `active` | — | `supervisor.md`, run dir, draft PR |
| B | `planned` | A | corpus + citations |
| C | `planned` | B | `research.md` |
| D / D2 | `planned` | C | `design/**` |
| E | `planned` | D, D2 | RFC + locked `plan.md` |
| F | `planned` | E | findings + triage |
| G | `planned` | F | `plan-eval.md` = `PASS` |
| H | `blocked` | G + **owner ratification** | `FILING-LOG.md` |
| I | `planned` | H | implementation briefs |
