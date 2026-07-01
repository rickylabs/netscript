# Plan: Wave 6 — `@netscript/cli` A6-v1 → A6-v2 promotion

## Run Metadata

| Field     | Value |
| --------- | ----- |
| Run ID    | `feat-package-quality-wave6-cli--research` |
| Branch    | `feat/package-quality-wave6-cli` (PR #43) |
| Phase     | `plan` |
| Target    | `packages/cli` (the final wave — last package) |
| Archetype | **A6 — cli-tooling** |
| Consumes  | Phase T `catalog:` baseline, Phase A Aspire 13.4 pins, Phase P published alpha fixture |

## Archetype

**A6 (cli-tooling) v2.** Kernel = horizontal (role folders: `domain/`, `services/`, `io/`); surfaces
(public / maintainer / local) = vertical (feature folders). The research confirms the existing
`packages/cli/src/{kernel,public,maintainer,local}/` is **architecturally correct for A6** — the
target is a *bounded set of moves*, not a rewrite. This run closes AP-1 ("Restructure") as a planned
7-slice promotion.

## Current Doctrine Verdict

`packages/cli` carries open **AP-1 (Restructure)**. Research verdict: AP-1 is **valid but bounded** —
the CLI is a fast-evolved A6-v1, not broken. `deno check packages/cli` is clean; zero `console.*`
leaks; no file >384 LOC. Promotion = the moves in the target tree + 14 standards violations (V-1..V-14)
resolved.

## Axioms in Play

| Axiom | Why |
| ----- | --- |
| A3 (wrap, don't reinvent) | Deploy adapters wrap `Aspire.Hosting.{Kubernetes,ContainerApps,AWS,Azure}`; command registry wraps Cliffy `Command` (LD-2). |
| A1 (single responsibility / file-size) | Split the two 384-LOC files (R-2) before they cross cap. |
| A6 layering (F-CLI-3/F-CLI-4) | No surface↔surface imports; kernel never imports surfaces. |
| A13 (explicit drift) | `research-realized.md` (LD-5) logs impl-vs-research divergence. |

## Goal

Promote `@netscript/cli` to A6-v2: a clean kernel/surface tree, a typed command registry replacing the
hand-wired `public-command-tree.ts` chain (V-1/F-CLI-27), a `DeployTargetPort` seam removing the
`DeployTargetKey` literal-union lock-in (V-9), bounded scaffold improvements, Aspire 13.4 GA shape
adoption, and `packages/cli/docs/standards.md`. Close AP-1. The CLI ships **last** (after Phase P
publishes everything else) so the production `netscript init` is validated against the JSR registry.

## Scope

7 slices (0–6), each ≤ 1 PR / 1 OpenHands session. Critical path **0 → 2 → 3 → 4 → 6**; slices 1
(docs) and 5 (Aspire) run parallel.

| Slice | Title | Core change |
| ----- | ----- | ----------- |
| 0 | Prep / workspace hygiene | `e2e/` becomes a real workspace member (R-5, root `deno.json` one-liner); consume Phase T `catalog:` baseline; aspire-barrel dry-run already fixed upstream (T0). **Fold in the post-#44 freshness bump** (`tailwindcss`/`@tailwindcss/vite` → ^4.3.1, `@preact/signals` → 2.9.2) so the catalog is at-latest before `feat/package-quality` reaches `main`. |
| 1 | Standards doc (parallel) | Author `packages/cli/docs/standards.md` (§S.1–S.7); catalogue V-1..V-14 as the closing checklist. |
| 2 | **Command registry + DeployTargetPort** (load-bearing) | Concrete `CliCommandRegistry` over Cliffy `Command` (LD-2) closing V-1/F-CLI-27; `DeployTargetPort` + `DeployTargetRegistryPort` (LD-3 writers under `maintainer/features/codegen/`); fix `DeployTargetKey` union (V-9). |
| 3 | Surface refactor / moves | Execute the bounded target-tree moves; split the two 384-LOC files (R-2); enforce F-CLI-3/F-CLI-4. |
| 4 | Scaffold improvements | E.2.1–E.2.10 bounded improvements; assert against the **Phase P published fixture** (`scaffold.published.runtime`). |
| 5 | Aspire 13.4 GA shape — **verify-only / inherited** (parallel) | The `apphost.mts` + `.aspire/modules/*.mts` + `tsconfig.apphost.json` GA migration **already landed in #44 (R6, `677d5405`+`a50d73f`)** to self-green `scaffold.runtime`. This slice no longer *performs* that migration — it **verifies** the inherited shape, mirrors the pinned schema URL (V-14/R-3), and wires `WithProcessCommand()` flag-off (LD-4). Net-new work collapses to schema mirror + flag-off seam. |
| 6 | Verify + close AP-1 | Full A6 gate sweep; `research-realized.md` (LD-5); AP-1 verdict entry. |

## Non-Scope

- Publishing `@netscript/cli` to JSR — withheld by design (decision #7); ships after this wave.
- The toolchain version bumps themselves — owned by the upgrade run (PR #44). This wave **consumes**
  the 13.4 pins; it does not set them in `scaffold-versions.ts` (LD-8).
- New deploy targets (k8s/container/cloud) — only the **port + seam** is built; concrete adapters are
  future waves. `WindowsServiceDeployTarget` is the one concrete adapter (existing behavior).

## Hidden Scope

- **Slice 2 is load-bearing** (R-11/R-15): if the command registry doesn't close V-1, the hand-wired
  tree becomes a permanent hotspot. Slice 2 may only land with a **green `scaffold.runtime` rerun
  (41/41)** — the PR template blocks merge without it.
- `e2e/` is not currently a true workspace member (R-5) — a one-line root `deno.json` fix in slice 0
  is a prerequisite for the published-fixture e2e in slice 4.
- ~~The apphost GA realignment (slice 5) edits `scaffold-files.ts`/`scaffold-aspire.ts` apphost paths —
  owned here, not by the upgrade run (LD-8 boundary).~~ **SUPERSEDED:** R6 in #44 performed the
  apphost realignment to make `scaffold.runtime` self-green; this wave inherits it (see LD-8 update +
  drift D-W6-1). Slice 5 is now verify-only on the apphost path.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| LD-1 | The 5 maintainer open questions in research §"Open questions" are answered before slice 0 lands; defaults below. | Research gate. |
| LD-2 | `CliCommandRegistry` is **concrete** to Cliffy `Command`, not generic. | KISS/YAGNI (maintainer decision #2). |
| LD-3 | Per-step scaffold writers live under `maintainer/features/codegen/`. | Research rec; satisfies F-CLI-3 (no surface↔surface import) (decision #3). |
| LD-4 | Aspire dashboard commands (`WithProcessCommand`) are **wired but feature-flag-disabled** in the joint slice 5. | Seam without runtime commitment (decision #4). |
| LD-5 | Impl-realized divergence is logged in a **separate `research-realized.md`**, keeping `research.md` immutable. | Doc-drift mitigation R-12 (decision #5). |
| LD-6 | Aspire path consumed = **decoupled default** (13.4 GA pins from Phase A); coupled fallback only if upgrade run reports preview. | Mirrors upgrade LD-6/LD-7 (decision #6). |
| LD-7 | `@netscript/cli` is **not published** in Phase P; ships last. | Production scaffold tested against published deps first (decision #7). |
| LD-8 | ~~This wave owns `scaffold-files.ts` + `scaffold-aspire.ts` apphost-path migration~~; the upgrade run owns `scaffold-versions.ts` + CI pin. **AMENDED (D-W6-1):** the apphost-path migration was pulled forward into #44/R6 to self-green `scaffold.runtime`; this wave now **verifies** the inherited shape rather than performing it. The upgrade run still owns `scaffold-versions.ts` + CI pin. | Single-file ownership preserved; the realignment moved to the program that needed it green. |

## Open-Decision Sweep

The 5 maintainer questions (research §Open questions) — each resolvable with a safe default:

| Decision | Status | Default if unanswered |
| -------- | ------ | --------------------- |
| Q1 `local/` surface kept or folded? | safe to defer | Keep `local/` (research test-ratio 25% justifies it). |
| Q2 `DeployTargetKey` union → port timing | must resolve now | Slice 2 (it is the load-bearing seam). Resolved: slice 2. |
| Q3 standards doc owner (lead vs generator) | safe to defer | Generator drafts, lead owns `.md` (per process constraint). |
| Q4 which 384-LOC files split | safe to defer | `ui/registry.ts`, `scaffold/writers/write-app-files.ts` (research-named). |
| Q5 schema-URL mirror location | safe to defer | `packages/cli/assets/schema/` (slice 5.3). |

> Only Q2 is "must resolve now" and it is resolved (slice 2). No deferred decision forces rework →
> Plan-Gate satisfiable.

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| R-11/R-15 (slice 2 load-bearing; hand-wired tree hotspot) | Slice 2 must close V-1 + land only with green `scaffold.runtime` 41/41 (PR-template gate). |
| R-1 (aspire barrel dry-run false positive) | Fixed upstream in Phase T (T0); not a CLI blocker. |
| R-2 (6 files 320–384 LOC) | Soft lint-fitness warning (slice 3.6); split the two cap-approaching files (slice 3.4/3.5). |
| R-3 (V-14 pinned schema URL) | Mirror schema locally (slice 5.3). |
| R-4 (`public/` test ratio 9.2%) | Add 4 in-memory-port unit tests (slice 2.5). |
| R-5 (`e2e/` not a workspace member) | One-line root `deno.json` fix (slice 0.1). |
| R-12 (doc drift research↔impl) | `research-realized.md` (LD-5, slice 6.4). |

## Anti-Patterns

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-1 (Restructure) | open, **closed by this wave** | 7-slice bounded promotion; verdict entry slice 6.5. |
| F-CLI-27 (hand-wired command tree) | V-1 | Closed by the typed registry (slice 2). |

## Fitness Gates

Universal F-1..F-18 (F-14 console-log = n/a, already zero) + A6-specific F-CLI-1..F-CLI-31. Load-bearing:

| Gate | Required | Evidence |
| ---- | -------- | -------- |
| F-CLI-3 (no surface↔surface import) | yes | writers under `maintainer/features/codegen/` (LD-3); layer lint clean. |
| F-CLI-4 (kernel never imports surfaces) | yes | dependency-cruiser / layer check green. |
| F-CLI-27 (no hand-wired command tree) | yes | registry replaces `public-command-tree.ts` (slice 2). |
| F-1 (file-size <500) | yes | two 384-LOC files split (slice 3). |
| F-6 (publishability) | yes (deferred publish) | `deno publish --dry-run` green; actual publish withheld (LD-7). |
| E2E `scaffold.runtime` | yes | 41/41 rerun gates slice 2 merge. |
| E2E `scaffold.published.runtime` | yes (slice 4) | asserts against Phase P alpha fixture. |

## Arch-Debt Implications

- AP-1 → **closed** at slice 6.5 (verdict entry).
- V-9 `DeployTargetKey` lock-in → resolved (slice 2); remove the debt row.
- Any carve-out inherited from Phase T (`service`/`plugin`) is upgrade-run debt, not CLI debt.

## Commit Slices

| # | Slice | Proves | Gate | Files (indicative) |
| - | ----- | ------ | ---- | ------------------ |
| 0.1 | `e2e/` workspace member | published-fixture e2e can run | E2E | root `deno.json` |
| 0.2 | consume `catalog:` baseline | CLI resolves via catalog | E-3 | `packages/cli/deno.json` |
| 1.x | standards.md + V-checklist | standards exist; V-1..V-14 tracked | docs | `packages/cli/docs/standards.md` |
| 2.1 | `CliCommandRegistry` (concrete) | V-1/F-CLI-27 closed | F-CLI-27 | `kernel/.../command-registry.ts`, replace `public-command-tree.ts` |
| 2.2 | `DeployTargetPort`+`RegistryPort` | V-9 union removed | F-CLI-3 | `kernel/domain/deploy/*`, `maintainer/features/codegen/*` |
| 2.5 | 4 in-memory-port unit tests | `public/` ratio ↑ | F-test | `public/**/*_test.ts` |
| 2.G | `scaffold.runtime` rerun | 41/41 green (merge gate) | E2E | — |
| 3.x | target-tree moves + split 2 files | layering clean; F-1 | F-CLI-3/4, F-1 | `src/**` moves |
| 4.x | scaffold improvements E.2.1–E.2.10 | published fixture green | E2E published | `scaffold/**` |
| 5.x | Aspire 13.4 GA apphost shape verification + schema mirror + flag-off cmds | inherited apphost.mts shape verified; 13.4 e2e | F-CLI, E2E | `assets/schema/*` + the `WithProcessCommand()` flag-off seam |
| 6.x | full gate sweep + `research-realized.md` + AP-1 verdict | AP-1 closed | all | `arch-debt.md`, `research-realized.md` |

(11 slice-groups, well under the <30 cap.)

## Validation Plan

| Order | Gate | Command | Expected |
| ----- | ---- | ------- | -------- |
| 1 | check | `deno task check:packages` (+cli slice) `--unstable-kv` | 0 |
| 2 | lint/layer | `deno task lint` + layer check | 0; F-CLI-3/4 clean |
| 3 | fmt | `deno task fmt --check` | clean |
| 4 | test | `deno task test` (incl. new port tests) | green |
| 5 | arch | `deno task arch:check` | green |
| 6 | publish | `deno publish --dry-run packages/cli` | green (publish withheld) |
| 7 | e2e runtime | `e2e:cli scaffold.runtime` | 41/41 (slice 2 merge gate) |
| 8 | e2e published | `e2e:cli scaffold.published.runtime` | green (slice 4) |

## Dependencies

- **Phase T + remediation R1–R6** (PR #44, **MERGED `733388f`** into `feat/package-quality`):
  `catalog:` baseline + aspire-barrel fix (slice 0) **and** the Aspire 13.4 GA AppHost shape
  (`apphost.mts` + `.aspire/modules/*.mts` + `tsconfig.apphost.json`) — inherited by slice 5 (D-W6-1).
  Rebase base for this wave: `733388f`.
- **Phase P**: published alpha.0 fixture (slice 4 `scaffold.published.runtime`). Run right after the
  load-bearing slice 2 lands green so slice 4 exercises the real published `netscript init`.
- External: Aspire 13.4 GA (LD-6); Cliffy `Command` API (LD-2).

## Drift Watch

- If Phase A reports Aspire 13.4 still preview → slice 5 consumes coupled fallback; log it.
- If a target-tree move changes a public export path → log (affects published surface).
- Impl-vs-research divergence → `research-realized.md` (LD-5), do not edit `research.md`.
