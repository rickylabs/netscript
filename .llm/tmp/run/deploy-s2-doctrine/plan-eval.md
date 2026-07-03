**[PHASE: PLAN-EVAL] [VERDICT: PASS_PLAN]**

Run: `deploy-s2-doctrine` — slice #338 [Deploy-S2] of deployment epic #327. Evaluator session
separate from plan author. Reasoning: HIGH. This is a **plan gate**, not an impl review — no code is
expected to exist. Verdict: **PASS_PLAN** with four required, non-blocking Implement-phase fixes
(F1–F4) recorded below. The A-vs-B doctrine-shape choice is **ratified as (A)**, conditioned on F2.

## Checklist results

| Check | Result | Evidence / note |
| ----- | ------ | --------------- |
| Research current | PASS | Re-baselined to `origin/main` cf1ac47b; #337/PR#352 landed shape (`DeployTargetBaseSchema` + `WindowsDeployTargetSchema`) confirmed; #305 confirmed OPEN/RFC with no in-flight branch. |
| Anchors verified against real `06-archetypes.md` | PASS | I read the file: `## Archetype 6 — CLI / Tooling Package` (L191), `## How to choose` numbered 1–6 (L234–242), `## Archetype assignments for current packages` (L249), `## Archetype checklist for review` (L273) all present. Insert-after-6 / before How-to-choose is a clean fit; no renumber collision (1..6 → append 7). |
| Decisions locked | PASS | D1–D8 each carry a decision + rationale; unambiguous. |
| Open-decision sweep complete | PASS | 4-row table; all resolved or safe-to-defer; explicit "no decision marked must-resolve-now". A-vs-B correctly routed to PLAN-EVAL (it is a doctrine-shape judgment, an evaluator call). |
| Commit-slice list (<30; each names proof + gate + files) | PASS | 3 slices (doctrine / harness-3-surface / debt), each with Proves + Files + Gate. Well under 30. |
| Risk register | PASS | Risk Register + Risks + Drift Watch cover #305 orphaning, 3-surface drift, over-abstraction, gate-seed-as-gated. |
| Correct gate SET for a doctrine slice | PASS (with F4 wording fix) | Set = arch:check + docs fmt:check + 3-surface manual consistency + validate-claude-surface N/A. Set is right; the *evidence claim* for arch:check is overstated — see F4. |
| `validate-claude-surface.ts` N/A verified | PASS | Slice edits `docs/` + `.llm/harness/` only. `.llm/harness/` is NOT `.claude/`; no Claude-surface file is implied. N/A is correct. |
| Deferred scope explicit | PASS | Non-Scope covers: no impl, no `deploy-schema.ts` edit (#337 owns it), no doctrine renumber (#305 owns it), no `.claude/` change, no labels/umbrella. |
| #305 coordination stance | PASS | No live branch → no collision now; absorbable durable prose; gates seeded `reviewed` not `gated`; no frozen tables; no dead `../phase-0-research/*` citations; inline #305 cross-ref note; orthogonal to #305's package-*graph* chapter (this is package *shape*). |
| F-DEPLOY-* namespace fit | PASS | Gate-matrix reserves the `F-<AREA>-*` pattern and cites `F-SVC-*`/`F-PLG-*`; precedent `F-CLI-1…31` documented in the archetype file. `F-DEPLOY-*` conforms. |

## A-vs-B ratification — RATIFY (A)

**Ratified: (A) new named "Archetype 7 — Deployment Target Adapter" that composes A2 + A6.**

Reasoning weighed both sides honestly:

- Counter-argument for (B): the doctrine defines an archetype as a *per-package* selector ("every
  `packages/*`/`plugins/*` package picks the smallest archetype that fits"), and it already models
  specializations as **subtypes**, not new top-level archetypes — `sagas` is listed as
  "3 — Runtime/Behavior with state-machine specialization", and the gate-matrix uses `subtype` rows
  (F-13). That precedent leans toward (B).
- Decisive argument for (A): unlike `sagas` (one package), the deployment pattern is a genuine
  **cross-package composite** — an A2-shaped `OsServicePort`/cloud-adapter core consumed by an A6
  thin CLI router. Neither A2 nor A6 alone captures it, so a B-style subtype would fragment the
  pattern across two doctrine locations with **no single conformance anchor** for the four adapter
  slices (#339/#340/#342/#343). The epic itself names it an archetype, and it is foundational and
  repeated. One named conformance target has real operational value and is the cheaper long-run
  doctrine.

Condition on the ratification (folded into F2): (A) must be framed as a **named composite pattern**,
not as a 7th entry in the "pick the smallest that fits" *package* selector that a single package
would choose over its true shape. The plan already does this well (D1 + the Archetype section
"composes A2+A6, folds not duplicates"; Hidden Scope: "a deploy adapter that is only a CLI flow with
no port stays A6; Archetype 7 applies when the port/adapter seam + multi-target routing exist"). The
only place this can leak is the assignments table — see F2.

## Required fixes (Implement phase; recorded, non-blocking to the plan gate)

**F1 — Update the archetype count sentence.** `06-archetypes.md` L8–9 reads "This page defines
**six** archetypes". Adding Archetype 7 makes that stale. Slice 1's file list omits this edit.
`check-doctrine.ts` does **not** parse this markdown, so nothing will auto-catch it — add "seven"
(and the intro/​list count) to Slice 1 explicitly.

**F2 — Resolve the assignments-table vs D7 tension.** Scope + the anchors table say Slice 1 adds a
"deploy target-adapter row" to `## Archetype assignments for current packages`, but D7 says stay
package-agnostic and no `deploy-core` package exists yet (deploy currently lives *inside*
`packages/cli`, which is Archetype 6). Adding a row naming a non-existent package contradicts both
D7 and the table's "current packages" scope. Resolve by either (a) omitting the assignments row for
this slice, or (b) adding a clearly-marked **future/pending** row (e.g. "future `deploy-core` → 7
(not yet extracted; today folded in `cli`)"). Do **not** relabel `cli` off Archetype 6. This is the
one internal contradiction in the plan and must be settled before Slice 1.

**F3 — Add Arch 7 to BOTH gate-matrix tables.** `archetype-gate-matrix.md` has two Arch-1..6 column
tables: `## Fitness Gates` (L15) **and** `## Other Gate Families` (L47). The plan's anchors table
names only the Fitness Gates table for the new Arch 7 column. To make the "three-surface
consistency" gate actually true, add an Arch 7 column to **both** tables (or state explicitly that
Other Gate Families inherits Arch 6's row for Arch 7). Otherwise the second table silently omits
Archetype 7.

**F4 — Correct the `arch:check` evidence claim.** Verified: `deno task arch:check` = `deno task
deps:check && check-doctrine.ts --root <each of ~16 auth/plugin package roots>`. `check-doctrine.ts`
walks a **package's TS source** (mod.ts, abstract classes, folder cardinality, casts) — it does
**not** read `06-archetypes.md` and **cannot** detect "dead links / AP-F ref breaks" in the doctrine
markdown. So the Fitness-Gates row claiming arch:check "runs clean after the append — no dead links,
no AP/F ref break introduced" **overstates** what the gate proves; running it is a regression sanity
that is simply *unaffected* by this markdown edit (and can even flake on the `deps:check` network
step, unrelated to the slice). The gate SET is still correct, but re-word the expected evidence: the
real proof for the doctrine/harness markdown is **`fmt:check` (scoped) + the manual three-surface
consistency read**; arch:check is only a "did not regress the evaluated packages" check.

## Confirmations (good as written)

- Anchors: all four `06-archetypes.md` anchors present and correctly targeted; append fits 1..6
  without renumber. Verified by direct read.
- Decision-order step 7 guard correctly prevents a plain-CLI deploy flow from mis-selecting 7 over 6
  (port + multi-target routing is the trigger).
- #305: no live branch (research search corroborated) → no merge collision now; forward-absorb
  stance, `reviewed`-seeded gates, no frozen tables, no dead citations, cross-ref note — all sound
  and consistent with #305's "encode the LAW, seed reviewed until packages exist" model.
- `validate-claude-surface.ts` N/A is correct — no `.claude/` file is touched or implied.
- Debt slice cross-links the existing `packages/cli — AP-1` "command registry/deploy target seams"
  entry rather than duplicating; closing gate = `F-DEPLOY-1/2` promoted `reviewed→gated`. Correct.

## Verdict

**PASS_PLAN.** The plan is executable, correctly scoped, gate-set-correct, and coordinates soundly
with #305. Doctrine-shape choice **(A)** is ratified. F1–F4 are precise Implement-phase fixes (one
genuine internal contradiction in F2, three consistency/accuracy corrections) that do not block the
plan gate — apply them during Implement and verify via `fmt:check` + the three-surface consistency
read.
