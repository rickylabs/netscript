# 00 — Mission & Delegation Flow (AUTHORITATIVE)

> **This is the authoritative file. Fable 5 strictly follows it for the entire run.**
> Use Claude's **overnight built-in system**: promote this file (plus the per-topic specs) into the
> authoritative run charter you obey for many hours, and **leverage memory** across wake cycles so
> context is never re-derived or lost. If reality diverges from these specs, record it in
> `drift.md` — do not silently re-summarize or drop owner intent.

## Mission

Plan the **roadmap expansion**: integrate five owner-backlog features (some new, some rescoping
existing epics) into the Road-to-0.0.1-stable program. Produce a fully-designed, PLAN-EVAL-passed
roadmap — new epics, sub-issues with acceptance criteria, milestone map, dependency DAG, and
per-slice agent briefs — **ready for owner ratification**. No GitHub mutations and no framework code
until the owner ratifies.

The five topics each have their own spec. **Read every topic spec in full. Preserve the owner's
original bullets verbatim — do not dilute, summarize away, or re-order priorities.**

- `specs/topic-A-dashboard.md` — NetScript Dev Dashboard (killer feature, ships as a PLUGIN)
- `specs/topic-B-telemetry.md` — Telemetry production-grade revamp
- `specs/topic-C-tutorials.md` — Complete tutorial rewrites (exercise-first, real project)
- `specs/topic-D-positioning-docs.md` — Per-feature storytelling / positioning docs
- `specs/topic-E-desktop-deploy.md` — Deno-desktop + unified single-process deployment

Shared context (read before the topics):
- `specs/01-ratified-decisions.md` — milestone train + every owner decision + prior ratifications + locked positioning
- `specs/02-eis-chat-reference.md` — the eis-chat repo is the WORKING REFERENCE for A/B/C/D/E; exact paths per topic

## Delegation flow (owner-specified — execute in this order)

**A) Fable 5 supervisor** — run under **`use harness`** + every relevant skill
(`netscript-harness`, `netscript-doctrine`, `netscript-cli`, `netscript-pr`,
`netscript-deno-toolchain`, `deno-fresh`, domain skills). **Ensure every sub-agent fills its
contract strictly** — no skipped skills, no self-certification, no dropped owner intent.

**B) Claude Workflow — Sonnet 5 (high effort)** — a long-running deep-search workflow over **every
single topic, codebase(s), and feature**. Sonnet 5 high is chosen deliberately: it is extremely
efficient for long-running tasks that need breadth and diligence but **not extreme deep thinking**,
at much lower cost than Opus/Fable. The workflow **breaks each output stream into a sub-folder per
topic/feature**. Output contract (see "B output contract" below): B1 matrix, B2 analysis, B3
research, B4 context.

**C) Back to Fable** — analysis of the B corpus.

**D) Targeted Claude Opus 4.8 agents** — one per topic (or per hard sub-topic). Deep-dive to
**expertise level** and produce a **real, concrete design proposal** (not a survey). These are the
"think hard" agents; B fed them the breadth, they supply the depth.

**E) Back to Fable** — decide, complement, **lock the design**, and **write the harness run docs**
(`research.md`, `plan.md` with locked decisions, `## Design`, `phase-registry.md`).

**F1) Adversarial validation — WSL Codex** — unoriented adversarial review of the locked design
(hunt for wrong assumptions, missed dependencies, unsound seams). Daemon-attached, mobile-visible.

**F2) Back to Fable** — complement / fix / adjust from the adversarial findings.

**G) OpenHands PLAN-EVAL** — separate session, minimax M3 (or record blocked launch). Hard stop:
no implementation is planned as "ready" until PLAN-EVAL returns `PASS`.

> Model/lane law: **B = Sonnet 5 workflow. D = Opus 4.8 agents. F1 = WSL Codex. G = OpenHands.**
> Fable 5 = supervisor only — **never fan Fable 5 out across a workflow** (priciest model).
> Framework/plugin implementation, when it eventually happens, is **WSL Codex** slices with a
> separate-session OpenHands IMPL-EVAL — never a Claude workflow, never Fable writing code. Docs
> authoring (C/D) MAY use Opus workflows, OpenHands-validated (generator ≠ certifier).

## B output contract (Sonnet 5 workflow → these run-dir folders)

The workflow writes into the scaffolded run-dir folders, **one sub-folder per topic/feature**:

- **B1 → `matrix/<topic>/`** — a matrix per topic of **all useful external resources** (upstream
  docs, competitor teardowns, RFCs, prior art) **plus an index into B2**.
- **B2 → `analysis/<topic>/`** — a **complete, exhaustive analysis** covering all sub-topics /
  features with every detail found (codebase surface, existing seams, gaps, constraints).
- **B3 → `research/<topic>/`** — **deep external-source search aggregated into `.md`**, in the same
  spirit as eis-chat's own resources folder (`.agents/skills/*/references/`, `resources/`). Primary
  docs distilled to durable extracts.
- **B4 → `context/<topic>/`** — **any other output useful to Fable** (diagrams, snippets, notes,
  open questions) that does not fit B1–B3.

Each Bx folder gets a `README.md` (already seeded) stating its contract; the workflow fills the
per-topic sub-folders under it.

## Deliverables (for owner ratification)

1. `research.md` + `plan.md` (locked decisions, archetypes, gates, debt) + `## Design`.
2. New epics `telemetry-revamp` + `dev-dashboard`; rescopes of `#232` (C+D) and `#327` (E); each
   with sub-issues, acceptance criteria, milestone, netscript-pr taxonomy labels, and the dependency
   DAG from `specs/01`.
3. Per-slice agent briefs (lane/model routing + a `## SKILL` chapter each).
4. Open-decision register: resolutions + rationale for the delegated decisions (D-NSONE, telemetry
   flow) and any new forks surfaced.
5. `plan-eval.md` = `PASS`.

## Hard boundaries

- No issue/PR/label/milestone mutation until the owner ratifies the roadmap.
- No framework/plugin code in this run — this is planning only.
- Decisions beyond the DELEGATED set (`specs/01` §Delegated), or anything touching locked
  positioning/invariants, go back to the owner.
- Every sub-agent runs a skill-first activation; skipping the matching skill is the #1 eval failure.
