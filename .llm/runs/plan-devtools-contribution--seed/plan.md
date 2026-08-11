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

Locked at stage E from the corpus and the eight design packs. Each is normative in
`docs/architecture/rfc/rfc-0002-devtools-contribution.md`; the section reference is the authority.

| ID | Decision | Rationale | RFC § |
| -- | -------- | --------- | ----- |
| **L1** | DevTools is a **separate first-party host process** — CLI-generated root, own Vite process, own port, loopback-bound — not an app-mounted mode and not a `@netscript/fresh` subpath | A Vite-injection mount is **unavailable** (zero `transformIndexHtml` repo-wide, no scaffold `index.html`); an app-mounted tree inherits the full-reload watcher and page-module rewriting; a `fresh` subpath inherits the unresolved A3/A4 archetype dispute and a package already carrying a **Restructure** verdict | §5, §13.1 |
| **L2** | **No production DevTools tier**, enforced by **two independent** mechanisms — structural absence from the app build graph *and* a fail-safe `!== 'development'` runtime refusal | Upstream ships devtools into production builds **with client auth disabled**; TanStack distrusted a single signal because hosting providers set build command/mode inconsistently | §5 |
| **L3** | Contributions are a **sibling `{ family: 'devtools', major: 1 }` payload on a family-neutral envelope**; the envelope validates **no** payload — only the registered family schema does | AP-3 guard. Keeps the #890 dependency **reversible** rather than structural | §6 |
| **L4** | **#890's pointer axis wins** the three-seam contest; #427 folds in as the family definition; **#734 closes** as superseded | It is the only merged, owner-arbitrated layer, and #427's thinness law *agrees* with it | §4, §6 |
| **L5** | **Host-owned closed zone vocabulary** (Medusa's actual model), not plugin-minted zones (Strapi's) | Makes name collision impossible by construction and avoids a two-phase register/bootstrap lifecycle | §6, §7 |
| **L6** | **Ordering** = host-curated anchors first, then clamped `(order, mountId, id)`; out-of-range `order` is a **generate-time error** | Net-new design: no surveyed system solved ordering. Tab order is host product data, not plugin load order | §6 |
| **L7** | **v1 kinds = `panel` + `link` + `diagnostic`** (the last a pure reuse of the shipped `plugin doctor` `extraChecks` seam). No `DevToolsContribution` union | Each retained kind names a **real first-party consumer**; a union covering nine candidates is AP-3 | §7 |
| **L8** | **Read-only by default.** Mutating actions are staged, not shipped in v1 | Auth propagation is blocked on the RFC-A chain; a mutation surface drags in an unbounded audit story | §7, §8 |
| **L9** | **Host-owned, enumerated, deny-by-default read contract**, served same-origin; MCP composed **in-process** (read-kind only), never exposed over HTTP; one-directional SSE; no WebSocket, no MessagePort | No URL-shaped input exists anywhere → the confused-deputy shape is structurally removed. One-directional SSE forecloses the TanStack `install-devtools` class | §8 |
| **L10** | **Aspire / Scalar / DevTools boundary** as an evidence-backed table, with **#400's three acceptance lines adopted verbatim as normative gates** | The thesis is correct and already operationalized; deep-link grammars were verified from Aspire's own `.razor` sources | §11 |
| **L11** | Packages: `packages/plugin-devtools-core` (**Archetype 2**) + `plugins/devtools` (**Archetype 5**), with the A2→A3 trigger written down | The core reads through ports and emits a registry; it owns no supervised state **in v1**, so gate F-13 does not apply yet | §13.1 |
| **L12** | **Registry writes are transactional** — stage → `deno check` a `*.check.ts` importing every referenced module → atomic swap or rollback; deterministic empty emissions | Argued from the **shipped defect class** (non-transactional per-target writes, existence-only verification, two divergent generators, a regex "AstExtractor", registries leaking on remove), not from deference to #890 | §10 |
| **L13** | **Adding the new roots to `deno.json`'s `arch:check` is a named slice (W1-a)** | `arch:check` gates 16 of 36 live units; without this line every gate claim in the RFC is decorative | §13.3 |
| **L14** | **Declines carry their cited antecedent**: sandboxing, signing, per-contribution RBAC, capability grammars, host semver load-gates, module federation, and #890's parked T1/T2 iframe tiers — **closed here, not inherited** | Each is a cost of *untrusted third-party code in a long-lived RBAC-governed production-data surface* — a condition DevTools does not satisfy | §9, §12 |

## Open-Decision Sweep

The charter's twelve questions, seeded as the run's decision docket. Each must resolve to a **locked
decision** (with cited evidence) or to a **numbered owner fork** in the stage-H decision brief before
stage G. Per `gates/plan-gate.md`, any decision that would force rework if deferred **must** be
resolved before the Plan-Gate — "safe to defer" is a claim the evaluator is entitled to reject.

**All twelve charter questions are closed at stage E.** None remains open in the "safe to defer"
sense — each resolved either to a locked decision above or to a numbered owner fork in RFC §15. The
distinction matters for `gates/plan-gate.md`: a fork is an owner decision with a **recommendation and
a stated cost of deferral**, not an unmade decision.

| # | Charter question | Outcome | Where |
| - | ---------------- | ------- | ----- |
| Q1 | DevTools shape + local/production/remote behavior | **LOCKED** — L1, L2 | RFC §5 |
| Q2 | Envelope, versioning, identity, discovery, registry, negotiation, ordering, collision, quarantine, budgets, lifecycle | **LOCKED** — L3, L5, L6, L12; **fork F-1** (the #890 dependency) and **F-3** (manifest schema-evolution precondition) | RFC §6 |
| Q3 | Contribution kinds and contracts | **LOCKED** — L7, L8. Full 14-row evaluation covering every charter candidate; four rejected with reasons, five staged | RFC §7 |
| Q4 | Production/admin management vs developer diagnostics | **ANSWERED BY EVIDENCE, not decided by us** — #1446's decision sentence plus the market separation verdict. Recorded as a *constraint* | RFC §4, §12 |
| Q5 | Aspire / Scalar / DevTools ownership boundary | **LOCKED** — L10, as an evidence-backed table including **which capabilities are actually deep-linkable** | RFC §11 |
| Q6 | Data plane | **LOCKED** — L9. Auth propagation carried as a **blocking sequencing dependency**, not hand-waved | RFC §8 |
| Q7 | Security / trust tiers | **LOCKED** — L14, plus two normative invariants each with the test that proves it. Top threats labelled **UNPROVEN** where no gate exists yet | RFC §9 |
| Q8 | Build/dev mechanics + the Vite-contribution verdict | **LOCKED** — L12; dev-loop verdict given; generic Vite contribution **deferred with real entry criteria** (**fork F-15**) | RFC §10 |
| Q9 | Information architecture + the full state matrix | **LOCKED** — L10. Two honest degradations modelled (`plugins/streams` has no oRPC surface; filtered Aspire views are not deep-linkable) | RFC §11 |
| Q10 | Dashboard board supersession map | **DRAFTED** — full issue- and file-level map; **forks F-9…F-13**. Zero board mutation | `design/T9-supersession/`, RFC §15.2 |
| Q11 | Packages, archetypes, API sketches, threat model, gates, DAG | **LOCKED** — L11, L13; jsr-audit rubric applied to the **planned** surface | RFC §13, §14 |
| Q12 | Which seams become follow-up RFCs | **LOCKED** — each with consumed contracts, entry criteria, and an owning dependency; Scalar contribution **declined**, not vaguely deferred (**forks F-14…F-17**) | RFC §11, §15.3 |

### Would any deferral force rework?

`gates/plan-gate.md` fails a plan if a deferred decision would force rework. Audited explicitly:

- **F-1 (#890 dependency)** — the highest-risk fork, and it is **deliberately reversible**: the
  payload schema, host descriptor, and ordering rule are identical under every option, so the choice
  only becomes binding when the first emitter slice merges. Deferring it does **not** force rework
  before that point.
- **F-3 (manifest schema-evolution precondition)** — must land **before** any manifest-visible
  pointer, and is sequenced that way in W1. Deferring the *pointer* is safe; deferring the
  *precondition* while shipping the pointer is not, which is why they are ordered.
- **F-5 (zone-vocabulary ownership)** and **F-6 (ordering)** — both would force rework if deferred,
  which is why both are **locked now** (L5, L6) rather than escalated.
- Everything else in §15 is a scope or board decision whose deferral costs schedule, not rework.

## Risk Register

Risks are stated with their mitigation **and** whether the mitigation currently exists. "Named gate,
not yet built" is an honest state; "mitigated" without a gate would not be.

| # | Risk | Mitigation | Exists today? |
| - | ---- | ---------- | ------------- |
| R1 | **#890's spine never lands**, stranding a DevTools family that assumed it | Sibling family on a spine this lane builds first; the choice stays reversible until the first emitter slice merges (fork F-1) | **Yes** — a design property, not a future gate |
| R2 | **Arbitrary write** via a contribution's filesystem target — `resolveTarget` has no containment assertion; inert only while first-party | Normative containment invariant + its test (slice W1-c) | **No** — named gate, not built. Labelled UNPROVEN in RFC §9 |
| R3 | **Generator subprocess runs whole-filesystem** (bare `--allow-read`/`--allow-write`, drift D-7) | Scope the spawn (slice W1-c) | **No** — named gate. Mitigant that *does* exist: no `--allow-net`/`--allow-env`, so default-deny blocks exfiltration |
| R4 | **DevTools reaches production** — upstream ships it with auth disabled, and `/design` already ships ungated in-repo | Two independent exclusion mechanisms + e2e (slice W3-b) | **No** — named gate. `/design` recorded as fork F-20, filed separately |
| R5 | **Manifest pointer hard-rejects on older CLIs** (drift D-6; #890's claim is false) | Schema-evolution precondition slice sequenced first (fork F-3, slice W1-d) | **No** — and this is also a live defect in **#890/#922's own plan**, escalated |
| R6 | **Auth propagation blocked** — `createServiceClient` cannot send `Authorization`/`x-api-key`; the RFC-A chain includes an **unfiled** metadata child | Staged panel set: principal-less v1 → credentialed v2 → automation v3 | **Partly** — the staging is a decision; the unblocking is outside this run's control |
| R7 | **Unverified host assumptions** — package-shipped island specifiers; a second route/island root in one Vite process | Two disposable W0 probes, sequenced **first** and deliberately cheap | **No** — but they gate the slices that depend on them |
| R8 | **Speculative kinds accrete** back into a union | Every kind needs a named first-party consumer; AP-3/AP-24 guards; the rejected list is written into the RFC so it cannot creep back silently | **Yes** — a review checklist |
| R9 | **The board fragments further** — three seams already claimed one axis, two epics claim the same panels | L4 + forks F-9…F-13; #922's children explicitly **untouched** | **Yes** — as a drafted map; binding only on ratification |
| R10 | **Gate claims are decorative** — `arch:check` covers 16 of 36 units | Adding the new roots is a named slice (L13, W1-a) | **No** — named slice |
| R11 | **`plugins/streams` has no oRPC contract surface**, so a provenance panel has nothing to read | Modelled as a permanently degraded state in the §11 state matrix, not hidden | **Yes** — a design property |

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
