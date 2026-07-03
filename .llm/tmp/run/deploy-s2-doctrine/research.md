# Research — deploy-s2-doctrine (#338 [Deploy-S2])

Slice: Deployment target-adapter archetype doctrine entry. Phase 0 of deployment epic #327.
Author: Claude Opus 4.8 (RESEARCH+PLAN only; no doctrine content authored here — that is the
Implement phase after PLAN-EVAL PASS).

## Re-baseline

- Carried-in source: deployment architecture spec + decision-gap tracker in
  `.claude/worktrees/deployment-research/.llm/tmp/run/epic-deployment-aggregation/`
  (`deployment-architecture-spec.md` §7 "Doctrine impact", item 1).
- Re-derived against `origin/main` @ `cf1ac47b` (worktree branch `feat/deploy-s2-doctrine`).
- #337's config contract has landed on branch `feat/deploy-s1-targets-config` (PR **#352**, OPEN):
  `packages/config/src/domain/schemas/deploy-schema.ts` now exports `DeployTargetBaseSchema`
  (shared base raw-shape), `WindowsDeployTargetSchema` (base spread + Servy fields), and
  `DeployConfigSchema` (`targets.windows` only). Adapter slices #339+ compose the base by spread.
- What changed vs the carried-in spec: nothing material to the doctrine framing. The spec's
  "clean break" (D5) and "OsServicePort" seam are confirmed by the landed #337 shape (base +
  member composition, no back-compat alias, `docker` sub-block carried under the base for later
  migration to the docker/compose target).

## Findings

| #  | Finding                                                                                                                                                                                                     | How to verify |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1  | Doctrine archetypes live in `docs/architecture/doctrine/06-archetypes.md`; six archetypes (1 Small Contract … 6 CLI/Tooling), each with "Minimum shape" + "Doctrine for this archetype" + a checklist. Append-only. | `06-archetypes.md` |
| 2  | The archetype file has stable anchors this slice edits: `## Archetype 6 — CLI / Tooling Package`, `## How to choose` (numbered decision order), `## Archetype assignments for current packages` (table), `## Archetype checklist for review`. | `06-archetypes.md` §headings |
| 3  | Governing axiom is **A9** ("Archetype drives package shape"). The "How to choose" rule: if two archetypes apply, pick the larger and fold the smaller in; do not split a package across two. | `06-archetypes.md` L232–247; doctrine skill axiom table |
| 4  | The deploy feature today lives **inside** `packages/cli` (`src/public/features/deploy/deploy-group.ts`), Archetype 6. The epic generalizes `WindowsServicePort` → `OsServicePort` (servy + systemd adapters) and adds cloud adapters wrapping `aspire publish/deploy`. | spec §3.1, §5.1 |
| 5  | The per-target **adapter contract** is a uniform op set: `plan/emit`, `up`, `down`, `status`, `logs`, `rollback`, `secrets`. Aspire-driven adapters delegate `up/plan` to the Aspire CLI; direct adapters (windows/linux/deno-deploy) implement natively. | spec §4 (adapter contract line), §3.1 |
| 6  | The command surface must stay a **thin router** (plugin-thinness / core-centralization law): no target-specific business logic in the command layer; convention-bearing primitives (health, OTEL, secrets, rollback) live in a core, not per-target. | spec §3.1, §7 item 5; MEMORY plugin-thinness law |
| 7  | Per-target **tiers**: Tier 1 = Deno Deploy, deno-compile bare-metal (linux/windows), Docker/Compose; Tier 2 = k8s, Azure (ACA/AppService/AKS), GCP Cloud Run, Koyeb, DO/Render; Tier 3 (track) = Vercel/CF Workers/AWS Lambda (no first-party Deno runtime). | spec §4 target table |
| 8  | SERVY verdict = **MODERNIZE** (upstream healthy; rot is NetScript-side: no Linux, doc/code drift, no rollback/multi-instance, weak secrets, dead docker/script config, `deno:2.5` pin). Bare-metal artifact = `deno compile` single binary (ADOPT). | spec §5, servy-assessment |
| 9  | `arch:check` = `deno run --allow-read .llm/tools/fitness/check-doctrine.ts` (the doctrine fitness lint). This is the doctrine-lint gate for the slice. | `deno.json` L42 |
| 10 | The harness archetype gate matrix (`.llm/harness/gates/archetype-gate-matrix.md`) has columns Arch 1–6 and an "Archetype-specific Gates" section reserving the `F-<AREA>-*` namespace (e.g. `F-CLI-*`) for archetype-specific gates. Future archetypes "may publish their own gate IDs in the same namespace pattern (`F-SVC-*`, `F-PLG-*`)". | gate-matrix.md L36–44 |
| 11 | arch-debt.md uses `## <package> — <finding>` headers. Line ~379 already records `packages/cli — AP-1` restructure debt naming **"command registry/deploy target seams"** — the eventual OsServicePort extraction ties into that existing entry. | `arch-debt.md` |
| 12 | Harness archetype selection is mirrored in `.llm/harness/archetypes/README.md` (decision-order table + one `ARCHETYPE-N-*.md` file per archetype). A new archetype needs a matching `ARCHETYPE-7-*.md` + a README row + a gate-matrix column. | README.md L11–20 |

## #305 coordination (MUST — recorded state + fit)

- **#305 [S4] Architecture Doctrine revamp** — state **OPEN**, labels `type:docs` `area:tooling`
  `priority:p1` `rfc`, parent epic #301. **No in-flight PR/branch** (searched
  `archetype OR 305 OR doctrine`, all=merged/unrelated). So #305 is still at RFC/issue stage —
  there is **no live branch collision**; coordination is forward-looking (write to be absorbed).
- #305's blueprint **renumbers and restructures** the whole doctrine `01..10-*.md` into a new
  ~12-file layout (`00-constitution`, `04-folders-and-layering`, `06-package-graph-and-plugin-thinness`
  (NEW), `11-fitness-registry`, `appendix/verdicts.generated.md`, …). Key #305 principles that
  bind my entry:
  1. **Separate constitution (durable prose) from live state (generated).** → my archetype entry
     must be durable archetype prose with **no frozen verdict tables** and **no dead
     `../phase-0-research/*` citations** (which #305 is purging).
  2. **Fitness registry = single source of truth** that both prose and `check-*.ts` read; every
     principle earns its place only with a **named, testable gate.** → back the deployment
     archetype with named gate IDs (`F-DEPLOY-*`) so the entry slots straight into #305's registry.
  3. **Seed new-area gates as `reviewed`, not `gated`, until the packages exist** (#305 does exactly
     this for its own new ch06 gate, "encode the LAW not the current package list"). → the
     deployment packages are **future-wave** (#339–#343 not built yet), so seed `F-DEPLOY-*` as
     `reviewed`.
- **Fit / stance:** add "Archetype 7 — Deployment Target Adapter" to the **current**
  `06-archetypes.md` (append-only), written so #305's revamp absorbs it verbatim into the new
  archetype chapter and its gate rows into `11-fitness-registry`. Record a cross-reference note so
  #305 does not drop it during the renumber. This **extends** #305's structure (a new archetype +
  named gates it will registry-ize) rather than conflicting with it. #338 does not touch the files
  #305 renumbers other than the append to `06-archetypes.md`.

## Doctrine framing question (for the plan to lock / PLAN-EVAL to ratify)

The deployment target-adapter is a **cross-package composite**: an Integration-shaped
port + adapters core (Archetype 2 — `OsServicePort`/cloud-adapter + servy/systemd/aspire adapters)
consumed by a thin CLI router (Archetype 6). Two viable doctrine shapes:

- **(A) New named "Archetype 7 — Deployment Target Adapter"** that explicitly *composes* A2's
  port/adapter seam and A6's thin-router law (folds, does not duplicate). Pro: the epic calls it an
  archetype; the four adapter slices #339/#340/#342/#343 get **one** named conformance target; it is
  foundational and repeated. Con: archetypes are nominally "package shape" (A9) and this spans two
  packages — mild tension, resolved by stating the composite explicitly.
- **(B) A specialization sub-section** under Archetype 2 ("Integration — deployment target
  adapter subtype") plus a note under Archetype 6. Pro: strict A9 fidelity. Con: splits the pattern
  across two doctrine locations; no single conformance anchor for the adapter slices.

Recommendation: **(A)**, framed as a deployment specialization that composes A2 + A6. Locked in
plan; flagged in the open-decision sweep for PLAN-EVAL ratification (it is a doctrine-shape
judgment the evaluator should confirm, not a blocker).

## jsr-audit surface scan

- N/A for this wave — it is a **doctrine + harness-docs** change (`docs/architecture/doctrine/`,
  `.llm/harness/`). No `packages/*` public surface, no `mod.ts`, no exports change. State recorded
  per template.

## Open questions

- Archetype (A) vs (B) shape — recommendation (A); PLAN-EVAL to ratify. (Non-blocking.)
- Exact `F-DEPLOY-*` gate count/wording — plan proposes `F-DEPLOY-1` (7-op adapter contract) and
  `F-DEPLOY-2` (no target business logic in command surface / thin-router). Seeded `reviewed`.
  PLAN-EVAL may adjust IDs to align with #305's registry naming.
- Whether the archetype prose should name a future `deploy-core` package explicitly or stay
  package-agnostic (encode the LAW, per #305). Plan: stay package-agnostic; name only the seam
  (`OsServicePort`, cloud-adapter) and the op contract.
