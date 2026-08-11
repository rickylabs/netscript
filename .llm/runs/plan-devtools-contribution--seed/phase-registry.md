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
| Draft PR | [#1450](https://github.com/rickylabs/netscript/pull/1450) — draft, `Backlog / Triage`, `status:research` |
| Bootstrap commit | `ccc4c0a70` |

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
| **A — Bootstrap** | `supervisor.md` + run dir + draft PR + charter read-back → opening PR comment | Opus 5 · high (this session) | `done` — commit `ccc4c0a70`, PR #1450, [comment](https://github.com/rickylabs/netscript/pull/1450#issuecomment-5251257498) |
| **B — Discovery corpus** | Multi-surface deep search across repo source, docs, and external/market solutions; structured per-topic outputs; drift-candidate ledger → committed corpus, every claim cited | Opus 5 · high + `claude_workflow` (Opus 5 · low) with `workflow.js` committed before execution | `active` |
| **C — Synthesis** | Supervisor reads the **full** corpus; synthesis naming deep-dive topics + resolutions of delegated decisions → committed `research.md` | Opus 5 · high | `planned` |
| **D — Deep-dive packs** | One focused sub-agent per topic; each returns `proposal` + `epic-and-issues` (draft text only) + `agent-briefs` + `open-questions` → committed `design/<topic>/` | Fable 5 · medium (`deep_analysis`) | `planned` |
| **D2 — Design/UX pass** | Mandatory major-UI/UX route + optional vision-evidence lane → `design/ux-evidence/` with per-finding dispositions | GLM 5.2 · xhigh — **`major_ui_ux_adversarial_review`**, not `major_ui_ux_design` (see note); Kimi K3 vision conditional | `planned` — **sequenced after the stage-E RFC draft** |
| **E — Plan lock + RFC** | Canonical RFC + integrated `plan.md`: locked decisions, numbered owner-fork sweep, cross-epic DAG, milestone train, risk register, gate matrix → PR body refreshed + stage comment | Opus 5 · high | `planned` |
| **F — Adversarial** | Unoriented review of the locked plan on a model distinct from every authoring lane; severity-tagged findings → findings file + per-finding disposition + fix commits | distinct-model reviewer, then Opus 5 · high | `planned` |
| **G — PLAN-EVAL** | Separate-session verdict of record → `plan-eval.md` = `PASS`. **Hard stop**: no stage H before PASS | Codex · GPT-5.6 Sol · high, fresh daemon-attached session, own worktree | `planned` |
| **H — Ratify + file** | Owner decision brief (numbered forks) → owner picks → one-shot filing from a committed manifest → `FILING-LOG.md` + supersession map | owner, then Opus 5 · high | `blocked` (owner gate) |
| **I — Handoff** | Implementation lanes launched from GitHub + the design packs, not this run's chat history; per-epic briefs carry `use harness` + a `## SKILL` chapter | Opus 5 · high | `planned` |

### Stage-D2 lane correction, recorded 2026-08-11

`lane-policy.md` offers two GLM routes for major UI/UX work: `major_ui_ux_design` when GLM **leads**
the design, and `major_ui_ux_adversarial_review` as the **minimum when another lane leads**. In this
run the design is led by the Opus supervisor and the Fable stage-D packs, so the correct binding is
**`major_ui_ux_adversarial_review`**. Recording this rather than defaulting to the lead route, since
the charter names both and the distinction changes what the pass is for.

Consequence: the pass is sequenced **after** the stage-E RFC draft exists — an adversarial design
review needs a design to review. Running it at stage D against research notes would produce
generic advice and would misrepresent the lane. The transport caveat (tools + streaming, **no
reasoning trace**) is pre-registered as `drift.md` D-3 so no downstream artifact can cite it as
reasoning evidence.

## Stage-D topic fan-out — **finalized at stage C**

Eleven provisional topics collapsed to **eight** after the full-corpus read: `T4-boundaries` closed
outright (charter Q4 answered by #1446's decision sentence, Q5 answered by the fetched Aspire
`.razor` deep-link evidence — both become *constraints* carried into T1/T8, not open topics), and
`T11-staged-rfcs` folded into `T8`. `T10-packaging-and-roadmap` (Q11) is **not** a topic: it is the
integration output the supervisor assembles at stage E from every pack.

| Topic | Charter Qs | Lane | Status |
| --- | --- | --- | --- |
| `T1-host-shape` | Q1 | Fable 5 · medium | `active` |
| `T2-contribution-family` | Q2 | Fable 5 · medium | `active` |
| `T3-contribution-kinds` | Q3 | Fable 5 · medium | `active` |
| `T5-data-plane` | Q6 | Fable 5 · medium | `active` |
| `T6-trust-model` | Q7 | Fable 5 · medium | `active` |
| `T7-build-dev` | Q8 + surface #3 | Fable 5 · medium | `active` |
| `T8-ia-and-staging` | Q9, Q12 | Fable 5 · medium | `active` |
| `T9-supersession` | Q10 | Fable 5 · medium | `active` |

<details>
<summary>Superseded provisional set (kept for provenance)</summary>

The bootstrap-time guess mapped the twelve charter questions onto eleven topics: `T1-host-shape`,
`T2-contribution-family`, `T3-contribution-kinds`, `T4-boundaries`, `T5-data-plane`,
`T6-trust-model`, `T7-build-dev`, `T8-information-architecture`, `T9-supersession`,
`T10-packaging-and-roadmap`, `T11-staged-rfcs`. Amended above once the corpus showed which questions
the evidence had already closed.

</details>

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
| A | `done` | — | `supervisor.md`, run dir, draft PR #1450 |
| B | `active` | A | corpus + citations |
| C | `planned` | B | `research.md` |
| D / D2 | `planned` | C | `design/**` |
| E | `planned` | D, D2 | RFC + locked `plan.md` |
| F | `planned` | E | findings + triage |
| G | `planned` | F | `plan-eval.md` = `PASS` |
| H | `blocked` | G + **owner ratification** | `FILING-LOG.md` |
| I | `planned` | H | implementation briefs |
