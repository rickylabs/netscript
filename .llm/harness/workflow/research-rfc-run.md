# Research/RFC Run — Technology Evaluation → Verdict → RFC

Operating protocol for **research/RFC runs** — evaluation-only harness runs that take an external
technology proposal ("should NetScript integrate X?") from zero to a **verdict-bearing research
corpus**: an evidence-grade codebase baseline, a primary-source external dossier, a compatibility
matrix against every backend/runtime NetScript must preserve, an ecosystem projection onto
NetScript's own surfaces, and — only when the verdict is positive — an RFC plus any enabling issue
drafts. Like a seed run, a research/RFC run is **drafts-only until owner ratification**; unlike a
seed run, its deliverable is a *decision*, not a board.

> **Provenance.** Promoted from `copilot-evaluate-proposal-and-documentation--glidemq-rfc`
> (GlideMQ evaluation, 2026-07-09), which produced a conditional-positive verdict, a three-track
> RFC, and a benchmark-prerequisite issue draft. As with `seed-run.md`, this file freezes the
> **stage contracts**, not the exemplar's folder tree.

## When to use

The owner brings an external library/technology/architecture proposal and asks for an evaluation
whose outcome is unknown in advance ("either a clear explanation of why it doesn't fit, or a
complete RFC"). Triggers: a candidate dependency, a competing architecture, a "we could replace our
X with Y" idea. **Do not** use it when integration is already decided (that's run-loop planning) or
when the deliverable is a board (that's a seed run). A ratified positive RFC typically *feeds* a
seed run or run-loop issues; the two shapes chain, they don't merge.

## Run layout

Run dir `.llm/runs/<run-id>/` with the standard mandatory artifacts (`supervisor.md` first, then
`research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`) plus the shape-specific
artifact classes:

- `research/` — the evidence corpus, free-form layout; the exemplar used four numbered files
  (internal baseline / external dossier / compatibility matrix / ecosystem mapping).
- `rfc-<subject>.md` — only if the verdict is positive; carries its DRAFT/pending-ratification
  status in the header.
- `issue-draft-*.md` — enabling issues (prerequisites the RFC depends on), taxonomy-complete
  (labels + milestone per the netscript-pr skill) but **never filed by the run itself**.

## Stage contracts

### A — Activation & framing

Write `supervisor.md` (lane table, blocked-eval overrides). Extract the proposal's **explicit
deliverables** into the run checklist — owners often embed side-deliverables inside the prose
(the exemplar carried three: RFC-or-rejection, a benchmark issue, and this workflow doc). Missing
one is a contract failure.

### B — Internal baseline (parallel with C)

Map every NetScript surface the candidate touches, with verified paths/exports: the ports it would
sit behind, the adapters it would coexist with, the plugins that consume the seam, the doctrine
constraints (archetype, thinness, wrap-don't-reinvent), and any **precedent** for the integration
shape (the exemplar's key find: the sagas Garnet list-transport proves the
"portable floor + capable ceiling" adapter policy). Delegate to a Tier-B explore agent, but the
supervisor re-verifies load-bearing claims by direct inspection before they enter `research.md`.

### C — External dossier (parallel with B)

Primary sources only: the candidate's repo docs, source layout, package manifest, changelog,
examples, ecosystem repos. Required axes — value proposition and mechanism; full API surface;
**server/runtime hard requirements** (the compatibility pivot); AI/domain-specific primitives;
observability; license, maturity, release cadence, **bus factor**, fork/vendoring risks. If the
docs site is unreachable from the sandbox, find the source-of-truth markdown in the repo (docs
sites are usually generated) and record the mapping in `research.md`. Save the dossier into
`research/` — sub-agent output is otherwise lost with the session.

### D — Compatibility matrix (the verdict pivot)

Cross B×C: for **every** backend/runtime NetScript supports, a per-cell verdict (full / degraded /
hard blocker) with cited primary evidence. Verify the two or three pivotal cells independently of
the sub-agents (the exemplar: Garnet's missing FUNCTION+Streams, Deno NAPI uncertainty — each
double-checked against upstream docs before becoming findings). This stage decides the verdict
shape: a hard blocker on a must-keep backend converts "replace" proposals into "adapter or reject".

### E — Ecosystem projection

Feature-by-feature mapping of the candidate onto NetScript surfaces, each row classified:
**A** adapter concern (free with integration), **P** port-level concept NetScript should own
regardless of backend, **R** design reference only. The P and R rows are the run's durable value —
they survive even a negative verdict, and they connect the evaluation to open epics/issues (cite
issue numbers).

### F — Verdict & RFC

`research.md` states numbered, independently-verifiable findings + open questions (each marked
safe-to-defer or must-resolve). The verdict must be explicit: fit / no-fit / **conditional** (with
named gates — the exemplar gated on a runtime spike and a benchmark baseline). Positive verdict →
RFC with: summary, motivation, the *non-fit half* (what the candidate must not become), design with
preservation guarantees for existing backends, risk register with containment (e.g. "no candidate
type on a public surface"), phasing **with kill-switches**, alternatives considered, and the open
questions carried to PLAN-EVAL.

### G — Side deliverables & workflow review

Author any issue drafts the RFC depends on (drafts-only, taxonomy-complete). If the run followed a
shape not yet codified under `workflow/`, document it there (this file is that step for the
exemplar).

### H — Close

Update `worklog.md`, `context-pack.md`, `drift.md` (record blocked evaluator launches and
unreachable sources). Hand off: the RFC's next step is a **separate-session PLAN-EVAL** treating
the RFC as the plan under review, then owner ratification, then seed-run or run-loop issues.

## Invariants

- **Drafts-only.** The run files no issues, opens no non-run PRs, adds no dependencies. Ratification
  gates everything downstream.
- **Generator ≠ evaluator.** The run that authored the RFC never certifies it; the RFC header names
  its pending-PLAN-EVAL status, and blocked evaluator launches are recorded per `lane-policy.md`.
- **Primary sources or it didn't happen.** Marketing claims are checked against the candidate's own
  internal docs (the exemplar caught README-claimed Deno support contradicted by the project's
  HANDOVER.md) and upstream third-party docs for backend capabilities.
- **Preservation is explicit.** The RFC must state, backend by backend, what remains unchanged.
- **Findings are falsifiable.** Every finding in `research.md` names its source so a reviewer can
  re-verify it without the session.
