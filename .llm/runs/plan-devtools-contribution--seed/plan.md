# Plan: NetScript DevTools Contribution Architecture RFC

> **Stage A skeleton.** Locked decisions, the risk register, the cross-epic DAG, the milestone train,
> and the gate matrix are produced at **stage E (plan lock)** once the stage-B corpus and stage-D
> design packs exist. What is locked at bootstrap is the run's shape, scope boundary, and the
> **open-decision docket** below — the twelve charter questions, each of which must land in
> `Locked Decisions` or in a numbered owner fork before stage G.

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `plan-devtools-contribution--seed` |
| Branch | `plan/devtools-contribution` |
| Phase | `bootstrap` → `research` |
| Target | RFC / docs (`docs/architecture/rfc/`) — **planning only, no source** |
| Archetype | Described, not built: `ARCHETYPE-5` (plugin) for the proposed DevTools plugin surface, plus the host-package archetype selected at stage E for the DevTools host |
| Scope overlays | `SCOPE-docs.md` (the changeset is docs) + `SCOPE-frontend.md` (the subject is a frontend host) |
| Run shape | Seed run — `workflow/seed-run.md` stages A–I |

## Goal

Produce a canonical, evidence-backed RFC that decides **how plugins contribute developer-facing
surfaces to NetScript**: what the DevTools host is, how its contribution family is versioned,
discovered, and generated, which contribution kinds exist, what data plane and trust model back
them, and how the result is built, shipped, and diagnosed — together with the board plan (draft epic,
issues, DAG, milestone proposal, supersession map for the old dashboard) needed to implement it.

The primary deliverable is **architecture and contribution mechanics**. Visually modernizing epic
#400 is explicitly *not* the deliverable (charter § Boundaries).

## Scope

- A canonical RFC under `docs/architecture/rfc/` with diagrams, normative contracts, API examples,
  explicit alternatives, threat model, lifecycle, failure behavior, package ownership, frontend host
  split, and an implementation roadmap.
- A cited current-state matrix and a primary-source market/competitor architecture study.
- A five-surface frontend contribution map (below) with dependencies and proven non-overlap.
- A DevTools host/contribution-family design pack with worked plugin examples and contributor DX.
- A design/UX evidence pack incorporating the mandatory GLM 5.2 pass, with per-finding dispositions.
- A file-level and issue-level supersession map for the existing dashboard epic/issues/PRs.
- Draft epic + one-file-per-issue set, milestone proposal, dependency DAG, agent briefs, and a
  committed one-shot filing manifest — **draft text only**.
- An owner decision brief enumerating every genuine fork.

## Non-Scope

- **Any framework/product source implementation.** No change under `packages/**`, `plugins/**`, or
  `apps/**` in this run.
- **Any board mutation** — issues, epics, milestones, repo labels, other PRs — before the owner
  ratifies the decision brief in-turn.
- **Merging this RFC.** A seed run never merges itself.
- Reopening PR #1446's backend decisions, or inventing a second SDK extension mechanism alongside
  PR #1390.
- Duplicating Aspire's resource/process/log/trace/metric/health UI or Scalar's API reference UI.

## Hidden Scope

- The **supersession map is load-bearing**, not a courtesy: #400's board is live, and an RFC that
  proposes a DevTools host without reconciling the existing dashboard epic leaves two competing
  architectures on the board.
- **Deduplication against live GitHub state** before any issue draft enters the filing manifest.
- The RFC must decide **what becomes a separate follow-up RFC** (Fresh UI contribution, generic Vite
  contribution, deployment/remote DevTools) with consumed contracts, entry criteria, and an owning
  implementation dependency — a vague "deferred" is a plan failure per the charter.

## The five frontend contribution surfaces (mandatory framing)

The plan models these as related but **distinct seams** and decides dependency and ownership for
each. Collapsing them into one vague `frontend` axis is a plan failure.

| # | Surface | Current owner | This RFC's job |
| - | ------- | ------------- | -------------- |
| 1 | **Userland frontend code** — routes/islands/nav/theme/zones (Medusa-zone-inspired) | RFC #890 (merged), epic #922 | Consume; state the boundary against DevTools |
| 2 | **Fresh UI registry / component / style-dictionary contributions** | `packages/fresh-ui` + its CLI commands | Decide whether a contribution mechanism extends the existing commands safely, or becomes a staged follow-up RFC |
| 3 | **Vite plugin contributions** | unowned | Deferred **unless** this RFC proves a minimal safe contract — ordering, trust, build determinism, local/JSR resolution, failure containment must be explicit either way |
| 4 | **DevTools contributions** | **unowned — this RFC** | The primary subject: a first-class host/family for developer-facing routes, panels, inspectors, visualizers, actions, commands, diagnostics, navigation, deep-links |
| 5 | **SDK contributions** | RFC #1390 / issue #1348 | Consume; do not duplicate |

## Locked Decisions

_Stage E output. Nothing is locked at bootstrap — the corpus does not exist yet._

| ID | Decision | Rationale | Evidence |
| -- | -------- | --------- | -------- |
| — | — | — | — |

## Open-Decision Sweep

The charter's twelve questions, seeded as the run's decision docket. Each must resolve to a **locked
decision** (with cited evidence) or to a **numbered owner fork** in the stage-H decision brief before
stage G. Per `gates/plan-gate.md`, any decision that would force rework if deferred **must** be
resolved before the Plan-Gate — "safe to defer" is a claim the evaluator is entitled to reject.

| # | Decision | Status | Notes |
| - | -------- | ------ | ----- |
| Q1 | DevTools shape: separate first-party plugin/resource/host, app-mounted mode, or composed combination — with unambiguous local-dev, deployed-production, and remote-exposure behavior | must resolve now | Everything else keys off this; deferring it forces rework of every other answer |
| Q2 | Contribution envelope/family versioning, identity, discovery, generated registry, host capabilities, compatibility negotiation, ordering, collision policy, quarantine, budgets, removal/update | must resolve now | Reuse #890's pattern where sound; do not copy its app payload |
| Q3 | Contribution kinds and their contracts (pages/routes, zones/panels, inspectors, visualizers, actions/commands, diagnostics/data sources, navigation, external deep-links, optional setup) | must resolve now | Each retained kind needs a **real first-party consumer** and defined host behavior — a speculative union is a plan failure |
| Q4 | Separation of production/admin management from developer diagnostics | must resolve now | Runtime automation admin console stays a userland app contribution; DevTools consumes the same typed contracts without duplicating the console |
| Q5 | Ownership boundaries: Aspire owns resource/process/logs/traces/metrics/health; Scalar owns API schema/reference/try-it; DevTools owns framework-only state, contribution wiring, contract provenance, generated-surface drift, runtime-domain journeys, safe framework actions | must resolve now | Deep-link outward; never clone upstream UIs |
| Q6 | Data plane: typed contracts, SDK extensions, server/client context, live updates, caching, auth/principal propagation, streaming, OTel correlation — without arbitrary service URLs or a confused-deputy proxy | must resolve now | Depends on E2 (#1446) and E3 (#1390) |
| Q7 | Security/trust tiers: read-only default, write/action capabilities, CSRF/origin, auth + RBAC, local-only defaults, production enablement, secrets, plugin trust, isolation, auditability | must resolve now | No isolation/security claim without an executable gate or citation |
| Q8 | Build/dev mechanics: Fresh/Vite integration, HMR, island registration, source maps, package/local resolution, generated-registry transactions, plugin install/update/remove, `plugin dev`, doctor diagnostics — and whether a generic Vite-contribution RFC is prerequisite or explicitly deferred | must resolve now | Ties to surface #3 |
| Q9 | Information architecture grounded in NetScript's seams, with worked first-party examples (workers, sagas, triggers, streams, contracts/SDK, plugin registry, generated artifacts, runtime automation) and loading/empty/degraded/incompatible/unauthorized/failure states | must resolve now | Must be non-generic; happy-path screenshots alone fail this |
| Q10 | Dashboard board reconciliation: file-level and issue-level supersession map (`KEEP`/`AMEND`/`FOLD`/`SUPERSEDE`/`CLOSE-LATER`) for #400 and every relevant child/PR | must resolve now | Draft only; no board mutation before ratification |
| Q11 | Packages/plugins and doctrine archetypes, public API sketches, contributor journeys, threat model, observability, accessibility, responsive behavior, testing, browser gates, release gates, implementation DAG of small coherent PR slices | must resolve now | Feeds the filing manifest and agent briefs |
| Q12 | Which seams become separate follow-up RFCs (Fresh UI contribution, generic Vite contribution, deployment/remote DevTools, other) — each with consumed contracts, entry criteria, and an owning implementation dependency | must resolve now | A vague deferral is a plan failure per the charter |

## Risk Register

_Stage E output._

| Risk | Mitigation |
| ---- | ---------- |
| — | — |

## Validation Plan

The gate set for a **docs/RFC changeset**, derived from the repo's real configuration rather than
assumed. Full evidence tables land in `worklog.md`; wrapper invocations are owned by
`.agents/skills/netscript-tools` and not restated here.

**Correction recorded at stage B.** An earlier draft of this table listed "scoped `deno fmt` over the
changed docs + run dir" as the format gate. That is **not** a gate in this repo: `deno.json`'s
`fmt.include` is `packages/**` and `plugins/**` `.ts`/`.tsx` only, so `deno task fmt:check` never
inspects Markdown. Forcing the scoped wrapper at a Markdown root produces findings that no repo gate
asks for — and, worse, would rewrite the verbatim upstream artifacts saved under
`research/sources/`, corrupting the very evidence the citations point at. Those files are evidence
and are excluded from formatting by intent.

| Order | Gate | Command or check | Expected |
| ----- | ---- | ---------------- | -------- |
| 1 | Internal doc links + code-span paths | `deno task docs:links` **scoped** via `--root docs/architecture/rfc` (the default roots are `.llm/harness` + `docs/architecture/doctrine` and do not cover a new RFC dir) | PASS |
| 2 | Docs accuracy / discoverability | `deno task docs:accuracy` | PASS |
| 3 | CI `quality` job | fires on the PR via `needs_docs` once the changeset touches `docs/**` | PASS |
| 4 | Citation gate | every load-bearing claim traces to `path:line`, a `deno doc` surface, a saved artifact, or a URL | PASS (manual, evaluator-checkable) |
| 5 | Live-board dedup | every issue draft checked against live GitHub before entering the filing manifest | PASS (manual) |
| 6 | Planned-surface `jsr-audit` | rubric applied to the RFC's **proposed** public API sketches | PASS / documented risk |
| 7 | PLAN-EVAL | Codex GPT-5.6 Sol high, separate session, against an immutable commit | `PASS` |

`deno task check` / `test` / `lint` / `fmt:check` / `arch:check` / `quality:scan` / `e2e:cli` are
**N/A**: the changeset contains no TypeScript and no `packages/**` or `plugins/**` source. This is
why the PR carries the docs-only CI labels.

**OpenHands docs-accuracy gate — no conflict.** `.github/workflows/docs-openhands-eval.yml`
dispatches only on `pull_request: [ready_for_review]` (plus an owner `/docs-eval rerun` comment).
This PR stays **draft** for the entire run, so that workflow never dispatches and the charter's "do
not use OpenHands" boundary is satisfied structurally — not by a label suppressing a gate. No
`docs-eval:skip` is applied, because none is needed.

## Dependencies

- **PR #1446** (runtime-versioned automation) — its P-6 DevTools dependency and its management,
  audit/history, convergence, and OTel contracts. Backend decisions closed.
- **PR #1390 / issue #1348** (typed SDK client contributions) — the client/data-access mechanism.
- **RFC #890 / epic #922** (frontend contribution layer) — the versioned envelope + generated
  registry pattern, and the userland `app` family boundary.
- **Epic #400** and its children — the board this RFC must reconcile.

## Drift Watch

- `origin/main` moving under the run (baseline `2256a67bf`) — record, do not rebase.
- PR #1446 or #1390 head changing after their claims are consumed.
- Live board state changing between dedup and filing.
- Any lane substitution away from the routes recorded in `supervisor.md`.
