# Research — plan-devtools-contribution--seed

> **Stage A skeleton.** The re-baseline and the evidence-input register below are locked at
> bootstrap. Findings, matrices, and the market study are produced at stage B (discovery corpus) and
> synthesized here at stage C. Every finding must carry a citation: file path + line, a `deno doc`
> surface, a fetched artifact saved under the run, or an external URL. An uncited load-bearing claim
> is not a finding (`workflow/seed-run.md` § Stage B — evidence-citation gate).

## Re-baseline

| Field | Value |
| --- | --- |
| Baseline claimed by the charter | `origin/main` @ `2256a67bf` |
| Baseline verified at bootstrap | `2256a67bf` — `docs(home): complete the capability outcome story (#1442)` |
| Verification | `git fetch origin` then `git log --oneline -1 origin/main`, 2026-08-11, this worktree |
| Divergence | **None.** The charter's baseline and live `origin/main` agree. No rebase performed; no rebase permitted after this point (charter § Worktree, branch, and run shape). |

**Carried-in artifacts are evidence, not binding architecture.** Every design carried in from PR
#890, PR #1446, PR #1390, or the dashboard corpus is re-derived against this baseline at stage B
before any claim built on it is locked. Where a carried-in claim no longer holds, the divergence is
recorded in `drift.md` with severity, and the superseding fact replaces it in the matrix.

## Evidence-input register (charter § Authoritative evidence inputs)

Status values: `pending` (not yet gathered) → `gathered` (corpus written + cited) →
`re-baselined` (claims re-derived against `2256a67bf`).

### E1 — Frontend Contribution Layer (userland `app` family)

| Field | Value |
| --- | --- |
| Sources | merged RFC PR #890; epic #922; children #923–#946; committed run `.llm/runs/plan-frontend-contrib--seed/` |
| What to extract | The versioned envelope + generated-registry pattern; what it actually ratified (the userland `app` family) versus what it left open |
| Boundary | Preserve the pattern; do **not** copy its app payload into a DevTools family blindly |
| Status | `pending` |

### E2 — Runtime-Versioned Automation

| Field | Value |
| --- | --- |
| Sources | draft RFC PR #1446 @ final evaluated head `6cb79675c`; `/home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md` + its evidence corpus |
| What to extract | The **P-6 DevTools dependency**; the stable management, audit/history, convergence, and OTel contracts DevTools must consume |
| Boundary | Its backend decisions are closed. Do not reopen them. |
| Status | `pending` |

### E3 — Typed SDK client contributions

| Field | Value |
| --- | --- |
| Sources | draft RFC PR #1390; tracking issue #1348 |
| What to extract | The DevTools client/data-access dependency on the SDK extension mechanism |
| Boundary | Consume it. Inventing a second SDK extension mechanism is a plan failure. |
| Status | `pending` |

### E4 — Existing Dev Dashboard evidence

| Field | Value |
| --- | --- |
| Sources | epic #400; merged design umbrella #685; draft visual PR #780; closed prototype #506; issues #410–#432 and later dashboard-related issues; `.llm/runs/dashboard-rescope--seed/` |
| What to extract | The correct ownership thesis (see charter Q5) and every design decision worth keeping; a **file-level and issue-level supersession map** (`KEEP` / `AMEND` / `FOLD` / `SUPERSEDE` / `CLOSE-LATER`) |
| Boundary | Pre-modern-RFC dashboard design is research evidence, **not** ratified architecture |
| Status | `pending` |

### E5 — Current framework surfaces

| Field | Value |
| --- | --- |
| Sources | `packages/fresh`, `packages/fresh-ui`, plugin manifest + contribution axes, generated registries, CLI plugin generation/doctor/dev flows, Aspire contributions, telemetry contracts, MCP surfaces, Scalar links, scaffolded `/design` resources |
| Method | `deno doc` for public surfaces before broad source reads (`AGENTS.md` § Read Order); `rtk grep` for wiring |
| Status | `pending` |

### E6 — Docs, doctrine, and live board

| Field | Value |
| --- | --- |
| Sources | `docs/architecture/doctrine/**`, current docs, open issues/milestones, the Fable 5 remediation roadmap (`.llm/runs/plan-fable5-remediation-roadmap--seed/`) |
| Obligation | **Deduplicate every proposed issue against live GitHub state** before it enters the filing manifest |
| Status | `pending` |

### E7 — Primary-source market research

| Field | Value |
| --- | --- |
| Minimum comparators | Nuxt DevTools; TanStack Devtools; Vite DevTools / `vite-plugin-inspect` ecosystem; Medusa admin zones/extensions; Backstage; Directus / Strapi; Grafana plugin extensions; Aspire Dashboard; Scalar |
| Method | Primary sources (docs, source, RFCs) fetched and saved under the run per `workflow/resource-aggregation.md`; add or drop comparators when evidence shows a better analogue |
| Required separation | **developer tooling** vs **production admin consoles** vs **generic browser-extension models** — these are three different architectures and must not be averaged into one "devtools" claim |
| Status | `pending` |

## Findings

_Stage B output. Empty at bootstrap by design — findings are written only with citations._

| # | Finding | Evidence (path:line / URL / command) | Re-baselined |
| - | ------- | ------------------------------------ | ------------ |
| — | — | — | — |

## jsr-audit surface scan

**N/A at this stage with a caveat, not a waiver.** This run publishes no package: it commits an RFC
and run artifacts only. However, the RFC *proposes* package/plugin surfaces, so the `jsr-audit`
publishability rubric is applied at stage E to the **planned** public API sketches (slow types,
explicit return types, `isolatedDeclarations` compatibility, export-map shape) — this is the
`gates/plan-gate.md` requirement that the rubric be applied to the PLANNED surface before slicing.
Recorded there, not here.

## Open questions

The charter's twelve decision questions are tracked as the run's open-decision docket in `plan.md`
(§ Open-Decision Sweep), not duplicated here. Research-side questions discovered during stage B are
appended below.

- _(none yet — stage B not started)_
