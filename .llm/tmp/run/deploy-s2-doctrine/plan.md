# Plan: Deployment target-adapter archetype doctrine entry (#338 [Deploy-S2])

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `deploy-s2-doctrine`                             |
| Branch         | `feat/deploy-s2-doctrine` (off `origin/main` cf1ac47b) |
| Phase          | `plan` (planning-only; Implement after PLAN-EVAL PASS) |
| Target         | `docs` — `docs/architecture/doctrine/` + `.llm/harness/` |
| Archetype      | Authors a **new** archetype (proposed **Archetype 7 — Deployment Target Adapter**) |
| Scope overlays | `SCOPE-docs.md` (doctrine-facing docs)          |

## Archetype

This slice **authors** doctrine; it does not build a package, so the run itself has no package
archetype — it uses `SCOPE-docs.md`. The doctrine entry it defines is a **new Archetype 7 —
Deployment Target Adapter**, framed as a deployment specialization that **composes** existing
archetypes rather than duplicating them:

- **Archetype 2 (Integration)** supplies the port/adapter seam: a package-owned `OsServicePort`
  (bare-metal: servy + systemd adapters) and cloud adapters (docker/compose/k8s/aca wrapping
  `aspire publish`/`aspire deploy`/`aspire do`; deno-deploy wrapping `deno deploy`).
- **Archetype 6 (CLI/Tooling)** supplies the thin-router presentation: `netscript deploy <target>
  <verb>` parses input and routes to an adapter; **no** target-specific business logic in the
  command surface.

Justification against the doctrine skill / A9: A9 says archetype drives package shape and "pick the
larger, fold the smaller." Archetype 7 is the *larger, named* pattern that folds A2 and A6 for the
deployment domain, giving the four adapter slices (#339 systemd, #340 deno-deploy, #342 docker/
compose, #343 aca — per epic) a single named conformance target. The alternative (B: a subtype under
A2 + a note under A6) is recorded in the Open-Decision Sweep for PLAN-EVAL ratification.

## Current Doctrine Verdict

`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` is a frozen 2026-04 snapshot (per
#305 audit) and does not cover deployment. **N/A** for this entry — the deployment archetype is
net-new and adds no package verdict. (The eventual `deploy-core` extraction ties into the existing
`packages/cli — AP-1` "command registry/deploy target seams" debt entry; see Arch-Debt Implications.)

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A9    | Archetype drives package shape; Archetype 7 folds A2+A6 for deployment (pick-larger rule). |
| A11   | Name extension axes before abstraction — the **target** is the named extension axis; each target is an adapter behind a stable port, not a new abstraction layer. |
| A2    | Simple over easy at boundaries — one uniform 7-op adapter contract across every target. |
| A5    | Composition over inheritance — targets compose the shared base config (#337) + implement the port; no target base-class hierarchy. |
| A13   | Crash boundaries explicit — bare-metal health-gated activation + `rollback`; cloud rollback maps to platform-native mechanisms. |
| A7    | Web Platform / upstream first — wrap `aspire`/`deno compile`/`deno deploy`/`servy`, do not reinvent. |

## Goal

A doctrine-canonical **Archetype 7 — Deployment Target Adapter** entry that: (1) names the
`OsServicePort` / cloud-adapter port seam and the uniform 7-op adapter contract
(`plan/emit · up · down · status · logs · rollback · secrets`); (2) codifies the thin-CLI-router law
(no target business logic in the command surface; convention-bearing primitives — health, OTEL,
secrets, rollback — live in a core, not per-target); (3) states its gates and debt rules; (4) is
written to be absorbed by #305's doctrine revamp (durable prose, named `F-DEPLOY-*` gates seeded
`reviewed`, no frozen tables, no dead citations). Adapter slices #339–#343 must conform to it.

## Scope

- **Doctrine:** append "Archetype 7 — Deployment Target Adapter" to
  `docs/architecture/doctrine/06-archetypes.md` (Minimum shape, "Doctrine for this archetype",
  checklist rows); update the `## How to choose` decision order (add step 7) and the
  `## Archetype assignments for current packages` table (deploy target-adapter row).
- **Harness:** add `.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md`; add a decision-
  order row to `.llm/harness/archetypes/README.md`; add an **Arch 7** column +
  `F-DEPLOY-*` archetype-specific gate rows to `.llm/harness/gates/archetype-gate-matrix.md`.
- **Debt:** add an arch-debt entry recording (a) the future `deploy-core` centralization obligation
  and (b) that `F-DEPLOY-*` are seeded `reviewed` until #339+ land — with a closing gate.
- **#305 cross-reference note** inside the Archetype 7 prose so the revamp absorbs it.

## Non-Scope

- **No** implementation of `OsServicePort`, adapters, or CLI routing (Phase 1+, #339–#343).
- **No** edit to `deploy-schema.ts` — the config contract is #337 (PR #352), already landed.
- **No** renumber/restructure of the doctrine files — that is #305's job; #338 only appends.
- **No** `.claude/` config/skills/hooks/agent-orchestration changes → `validate-claude-surface.ts`
  is **N/A** (this slice touches `docs/` + `.llm/harness/`, not the Claude surface).
- **No** new labels / umbrella issue (spec §7 item 3 is a separate Phase-0 task, not this slice).

## Hidden Scope

- The harness has **three** archetype surfaces that must stay in lockstep (doctrine `06-archetypes.md`,
  `.llm/harness/archetypes/README.md` + `ARCHETYPE-N.md`, and `archetype-gate-matrix.md`). Adding an
  archetype to only one is a consistency defect the doctrine-lint / evaluator will catch.
- `06-archetypes.md` "How to choose" is a *numbered* decision order — inserting Archetype 7 means the
  new step must slot correctly relative to A6 (a deploy adapter that is *only* a CLI flow with no
  port stays A6; Archetype 7 applies when the port/adapter seam + multi-target routing exist).
- The archetype must be **package-agnostic** (encode the LAW, per #305) — name the seam and the
  contract, not a specific `deploy-core` package that does not exist yet.

## Locked Decisions

| ID  | Decision | Rationale |
| --- | -------- | --------- |
| D1  | New **Archetype 7 — Deployment Target Adapter** (composes A2 + A6), appended to `06-archetypes.md`. | Epic calls it an archetype; gives #339–#343 one named conformance target; A9 pick-larger-fold-smaller. |
| D2  | Uniform 7-op adapter contract: `plan/emit · up · down · status · logs · rollback · secrets`. | Directly from spec §4; every target implements a subset; Aspire adapters delegate `up/plan`. |
| D3  | Port seam named `OsServicePort` (bare-metal) + cloud-adapter; thin-CLI-router law is mandatory doctrine. | Spec §5.1, §3.1; plugin-thinness/core-centralization law. |
| D4  | Back the archetype with named `F-DEPLOY-1` (adapter implements the 7-op contract) and `F-DEPLOY-2` (no target business logic in command surface), seeded **`reviewed`** not `gated`. | #305 registry model; deployment packages are future-wave (#339+ unbuilt). |
| D5  | Write durable archetype prose only — no frozen verdict tables, no `../phase-0-research/*` citations; add a `#305` cross-reference note. | #305 is purging dead links + separating constitution from generated state; entry must be absorbable. |
| D6  | Convention-bearing primitives (health, OTEL, secrets, rollback) are doctrine-required to live in a **core**, not per-target. | Plugin-thinness/core-centralization law; spec §7 item 5. |
| D7  | Stay package-agnostic — name the seam + contract, not a concrete `deploy-core` package. | Encode the LAW (#305); the package does not exist yet. |
| D8  | `deploy.targets.*` clean break is **already contract-first done** by #337 (PR #352); this slice only *references* the base, does not restate the migration. | Avoid duplicating #337; spec §3.3 D5 clean break. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Archetype 7 (A) vs A2-subtype (B) shape | safe to defer to PLAN-EVAL | Recommend (A); evaluator ratifies the doctrine-shape judgment. Non-blocking. |
| `F-DEPLOY-*` exact IDs/count | safe to defer | Proposed `F-DEPLOY-1/2`; PLAN-EVAL may realign with #305's fitness-registry naming. Seeded `reviewed`. |
| Name the future `deploy-core` package in prose? | resolved now (D7) | Stay package-agnostic; name the seam only. |
| Add labels / umbrella (spec §7 item 3) | out of scope | Separate Phase-0 task, not #338. |

> No decision is marked "must resolve now" — all are resolved (locked) or safe to defer to PLAN-EVAL.

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| #305 renumber later moves/renames `06-archetypes.md`, orphaning the entry. | Write absorbable prose + inline `#305` cross-reference note; record coordination stance in research.md so #305 folds it in. No live #305 branch today → no merge conflict now. |
| Archetype added to doctrine but not to the two harness surfaces (or vice versa) → inconsistency. | Slice 2 updates all three surfaces atomically; validation runs `arch:check` + a manual three-surface consistency check. |
| Over-specifying a `deploy-core` package that does not exist yet. | D7: package-agnostic prose; name only the seam + op contract. |
| Gate seeded as `gated` would red CI against unbuilt packages. | D4: seed `F-DEPLOY-*` as `reviewed`, mirroring #305's ch06 approach. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-1 (god file / oversized) | risk (future impl) | Archetype prose mandates thin router + one-adapter-per-file; not a concern for the doctrine text itself. |
| AP-11 (premature abstraction) | avoid | A11: the *target* is the named extension axis; do not introduce a port until a 2nd adapter is foreseeable (it is — servy+systemd+cloud), so the port is justified, not premature. |
| AP (plugin-thinness violation) | avoid | D3/D6 codify the thin-router + core-centralization law as doctrine. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| `arch:check` (doctrine-lint, `check-doctrine.ts`) | yes | Runs clean after the `06-archetypes.md` append — no dead links, no AP/F ref break introduced. |
| Three-surface consistency (doctrine ↔ README ↔ gate-matrix) | yes | Manual: Archetype 7 present + coherent in all three; decision-order + assignments table updated. |
| `F-DEPLOY-1` (7-op adapter contract) | seeded `reviewed` | Defined in the new entry + gate-matrix; not enforced until #339+ land. |
| `F-DEPLOY-2` (no target business logic in command surface) | seeded `reviewed` | Defined in the new entry + gate-matrix; enforced at Phase-1 impl. |
| `validate-claude-surface.ts` | no (N/A) | Slice touches `docs/` + `.llm/harness/`, not `.claude/` — recorded N/A. |
| `deno task fmt:check` (scoped, docs) | yes | Markdown reflow clean on the edited doctrine/harness files. |

## Commit-Slice List (Implement phase — after PLAN-EVAL PASS)

Each slice is a single commit with trailers `Refs #338 #327`, committed → pushed → PR-commented,
then appended to `commits.md`.

**Slice 1 — Doctrine: Archetype 7 entry.**
- Proves: the deployment target-adapter pattern is doctrine-canonical with a named op contract +
  thin-router law + core-centralization rule + checklist.
- Files: `docs/architecture/doctrine/06-archetypes.md` (append `## Archetype 7 — Deployment Target
  Adapter` after Archetype 6; add step 7 to `## How to choose`; add a row to `## Archetype
  assignments for current packages`; add checklist rows). Includes the inline `#305` cross-ref note.
- Gate: `arch:check` clean; `fmt:check` clean; manual doctrine read.

**Slice 2 — Harness: archetype selection + gate matrix.**
- Proves: the harness can *select* and *gate* Archetype 7 (all three archetype surfaces in lockstep).
- Files: new `.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md`; `.llm/harness/archetypes/
  README.md` (decision-order row); `.llm/harness/gates/archetype-gate-matrix.md` (Arch 7 column +
  `F-DEPLOY-*` archetype-specific gate rows, seeded `reviewed`).
- Gate: three-surface consistency check; `fmt:check` clean.

**Slice 3 — Debt: deploy-core centralization + gate-seed record.**
- Proves: future adapter slices (#339–#343) have a closing gate; the `deploy-core` extraction is
  tracked against the existing `packages/cli` deploy-target-seams debt.
- Files: `.llm/harness/debt/arch-debt.md` (new `## deployment — Archetype-7 core-centralization +
  F-DEPLOY seed` entry; owner, target = Phase-1 #339+, closing gate = `F-DEPLOY-1/2` promoted
  `gated`; cross-links the existing `packages/cli — AP-1` "command registry/deploy target seams").
- Gate: debt-registry format consistency; `fmt:check` clean.

## Exact Doctrine Files + Anchors

| File | Edit | Anchor (verified present) |
| ---- | ---- | ------------------------- |
| `docs/architecture/doctrine/06-archetypes.md` | insert new section | after `## Archetype 6 — CLI / Tooling Package`, before `## How to choose` |
| `docs/architecture/doctrine/06-archetypes.md` | add decision step 7 | `## How to choose` (numbered list, currently 1–6) |
| `docs/architecture/doctrine/06-archetypes.md` | add table row | `## Archetype assignments for current packages` |
| `docs/architecture/doctrine/06-archetypes.md` | add checklist rows | `## Archetype checklist for review` |
| `.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md` | new file | — |
| `.llm/harness/archetypes/README.md` | add row | `## Decision Order` table |
| `.llm/harness/gates/archetype-gate-matrix.md` | add column + gates | `## Fitness Gates` table + `## Archetype-specific Gates` (`F-DEPLOY-*`) |
| `.llm/harness/debt/arch-debt.md` | new entry | append (`## <package> — <finding>` format) |

## #305 Coordination Stance

- #305 is OPEN at RFC stage, **no live branch** → no merge collision now. Coordination is
  forward-looking: write Archetype 7 so #305 absorbs it into the revamped archetype chapter and its
  `F-DEPLOY-*` rows into `11-fitness-registry`.
- Constraints imposed by #305 (all locked as D4/D5): durable prose, named testable gates seeded
  `reviewed`, no frozen tables, no dead `../phase-0-research/*` citations, inline cross-ref note.
- Recorded in `research.md` (#305 coordination section). PLAN-EVAL should confirm the entry does not
  conflict with #305's package-graph chapter (ch06-new) — it does not: Archetype 7 is a package
  *shape*, orthogonal to the package-*graph* law.

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Anchor pre-check | `rtk grep "## Archetype 6" docs/architecture/doctrine/06-archetypes.md` (+ How to choose, assignments) | anchors present before editing |
| 2 | Doctrine-lint | `rtk proxy deno task arch:check` | PASS — no dead links / ref breaks from the append |
| 3 | Docs fmt (scoped) | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root docs/architecture/doctrine --ext md` | clean (no reflow diff) |
| 4 | Three-surface consistency | manual: Archetype 7 in `06-archetypes.md` + `archetypes/README.md` + `gate-matrix.md`; decision-order + assignments updated | consistent |
| 5 | Claude surface | N/A (no `.claude/` change) — record N/A | N/A |
| 6 | Debt-registry format | manual: new entry matches `## <package> — <finding>` shape + has owner/target/closing gate | consistent |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `## deployment — Archetype-7 core-centralization + F-DEPLOY seed` | **create** (Slice 3) | Tracks the future `deploy-core` extraction + `F-DEPLOY-*` `reviewed→gated` promotion when #339–#343 land. Owner: deployment epic #327. Closing gate: `F-DEPLOY-1/2` promoted `gated`. |
| `packages/cli — AP-1` "command registry/deploy target seams" (existing, ~L379) | **cross-link** | The OsServicePort extraction from the CLI feature ties into this existing restructure debt; do not duplicate — reference it. |

## Risks

- See Risk Register above. Primary risk is #305 orphaning the entry — mitigated by absorbable prose +
  cross-ref note + research.md coordination record.

## Dependencies

- **#337 / PR #352** (`feat/deploy-s1-targets-config`) — the config contract the archetype references
  (`DeployTargetBaseSchema`). Landed; this slice only cites it, does not depend on merge order.
- **#305** — forward coordination only; not a blocker.
- Deployment epic **#327** — parent; this is Phase 0.

## Drift Watch

- If #305 opens an implementation branch that renumbers `06-archetypes.md` before this lands →
  rebase the append onto the new file name; log to `drift.md`.
- If PLAN-EVAL rules for shape (B) over (A) → rescope Slice 1 to a subtype under A2 + note under A6;
  log `significant` drift.
- If the adapter op set changes in a later epic decision (e.g. adds `secrets` sub-verbs) → update the
  contract in the entry; log to `drift.md`.
