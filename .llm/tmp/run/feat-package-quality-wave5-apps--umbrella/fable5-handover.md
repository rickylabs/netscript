# Fable 5 Handover — Wave 5 (Apps Layer) RESEARCH + PLAN & DESIGN

> **Audience:** Claude Fable 5, acting as the **Wave 5 generator** (RESEARCH + PLAN & DESIGN only —
> **no implementation**). This file is the curated entry point. All mechanical measurement, the
> reconcile, and the re-baseline are **already done** (by the supervisor, on cheaper tokens) so you
> can spend yours on architectural judgment and complex decisions only.
>
> **State as of handover:** Wave 4 is **merged to the track** (closeout PR #16 → `f0e1441`, all
> sub-waves 4a/4b/4c/4d IMPL-EVAL PASS). The track is **reconciled into this umbrella** (`dfab7a4`,
> clean merge). The 4 app units are **re-baselined against the merged surface** (§0.5 in
> `research.md`, `wave5-doclint.json`, `wave5-rebaseline.json`). PR #17 (umbrella → track) is the
> tracking PR.

---

## 0. Your mandate (verbatim intent, from the user)

1. **RESEARCH + PLAN & DESIGN only.** Do **not** implement package code. Sub-wave generators
   (separate sessions) implement under their own PLAN-EVAL/IMPL-EVAL.
2. **This is a RE-ARCHITECTURE wave, not fine-tuning.** Application-layer package quality must
   **meet, ideally exceed**, the plugin-tier (Wave 3/4) bar, and make NetScript cohere **as a
   whole** — harmonized API, no legacy/dead code, no shims.
3. **RFC 14 unified-platform: seam-readiness without implementing.** Protect the `sdk`
   `createServiceClient` `Transport` seam and the `fresh` `defineFreshApp` §10 extension points so
   unified mode never forces a breaking alpha change. **Do not build unified mode.**
4. **State-of-the-art docs rewrite of ALL READMEs + docs/ folders** — structure, diagrams, feature
   presentation. **DROP "what it is not" sections.** Study market leaders (TanStack, Medusa,
   Prisma, Hono) for structure and voice.
5. **Own PR #17 completeness** — DX, API, semantics, features, harmonization, future-proofing.
6. **Strengthen `RELEASE-PROGRAM.md`** for full production readiness; progressive per-package JSR
   publishing is post-Wave-5 work.

---

## 1. Read order (read only what the slice needs)

**Umbrella run dir** (`.llm/tmp/run/feat-package-quality-wave5-apps--umbrella/`):
1. `context-pack.md` — the map (status, scope, throughlines, gate sets, process boundaries).
2. `research.md` — the architect's pass. **§0.5 is the live re-baseline** (read it first).
3. `split-strategy.md` — the proposed `service→sdk→fresh-ui→fresh(5d-1..6)` cut.
4. `drift.md` — re-baseline + reconcile drift, carried-in caveats.

**Doctrine / harness:**
5. **Live doctrine:** `docs/architecture/doctrine/` + `docs/architecture/{STANDARDS,PUBLIC-SURFACE-PATTERNS,DOCS-STRUCTURE}.md`.
   ⚠️ The `.llm/research/architecture-doctrine-docs-v2/` path in CLAUDE.md/RELEASE-PROGRAM.md does
   **not** exist in this worktree — use `docs/architecture/`.
6. `.llm/harness/archetypes/ARCHETYPE-{3,4}-*.md` + `SCOPE-*` + `gates/archetype-gate-matrix.md`
   (gates F-1, F-3, F-5, F-6, F-7, F-10, F-11, F-13, F-16, F-18, **F-19**).
7. `.llm/harness/lessons/*` — esp. `validation.md` (the combined-vs-barrel doc-lint trap).

**RFC corpus** (consumer evidence at **test-app root** `.resources/rfcs/frontend/`, NOT this
worktree): README → 04 → 03 → 12 → 05 → 17 → 16 → 15 → 13 → 14 → 06/07.
RFC 14 = seam obligations only (unimplemented). RFC 17 v3 = the realized TanStack-SDK thesis.

**Consumer proof:** `apps/playground` (the rewrite — keep it compiling); `apps/frontend` (old).

---

## 2. The re-baseline (already measured — do NOT re-run the full sweep)

Authoritative, measured at `dfab7a4` (`wave5-doclint.json`). **Combined doc-lint over all `exports`
entrypoints is ground truth.**

| Pkg | eps | dry-run | `deno check --unstable-kv` | doc-lint (combined) | ptr / ret / jsdoc | barrel-only mod.ts | tests |
|-----|----:|---------|----------------------------|--------------------:|-------------------|-------------------:|------:|
| `service`  | 1  | **FAIL** | ✅ PASS | **23**  | 14 / 8 / 1   | 23  | 0  |
| `sdk`      | 12 | **FAIL** | ✅ PASS | **29**  | 9 / 2 / 18   | 20  | 0  |
| `fresh-ui` | 2  | **FAIL** | ✅ PASS | **0**   | 0 / 0 / 0    | 0   | 8  |
| `fresh`    | 12 | **FAIL** | ✅ PASS | **276** | 115 / 4 / 157| 23  | 12 |

**Totals: 328 doc-lint / 138 private-type-ref / all 4 dry-run RED / all 4 `deno check` PASS.**
Identical headline to the pre-merge baseline (apps layer untouched by Wave 4). What changed: all 4
now type-check clean against the merged plugin surface + blessed lock.

**What you still measure (per sub-wave, at MEASURE-FIRST):** exact slow-type counts per unit
(dry-run summary phrasing was inconsistent on the sweep — exit code RED is the gate fact), and
**per-cluster** doc-lint for the `fresh` internal split (the 276 must be apportioned to decide the
5d cut). The supervisor sweep gives you the totals; you allocate them.

---

## 3. The three architect throughlines (your real work)

1. **Surface encapsulation** — kill the **138 `private-type-ref`** leaks. Each is a *decision*:
   export the type (widens surface — weigh F-16 cardinality) **or** change the signature to a
   public type. **Do not blanket-export.** `fresh` owns 115 of the 138.
2. **Forward-compatible seams (RFC 14, unimplemented)** — design `sdk` `createServiceClient`
   `Transport` + `fresh` `defineFreshApp` §10 extension points so unified mode is additive. Plus
   cross-package integration: sdk↔fresh (query/streams), fresh↔fresh-ui (forms).
3. **CLI-readiness (Wave 6 next)** — stable, documented, tested `fresh-ui/registry/manifest`,
   `defineFreshApp`/`definePage` presets, `define-service` preset, `createQueryFactories`, and
   `./testing` harnesses, so starter commands compete with create-next-app / TanStack Start.

---

## 4. The split (proposal — confirm at each Plan Gate)

`service (5a) → sdk (5b) → fresh-ui (5c) → fresh (5d, splits 5d-1..5d-6)`, dependency-ordered.
`fresh` is the long pole (57% LOC, 84% doc-lint, multi-archetype). The exact `fresh` cut is decided
at its Plan Gate from **your** per-cluster MEASURE-FIRST doc-lint budget — `split-strategy.md` §5d
is a recommendation, not law. Umbrella merges to track **once**, at full Wave 5 completeness.

---

## 5. Hard constraints (preserve verbatim)

- **No implementation in this session.** RESEARCH + PLAN & DESIGN artifacts only.
- **Generator ≠ PLAN-EVAL ≠ IMPL-EVAL** — each is a separate session. Evaluator ≠ generator.
- **Never delete lock files/caches; never `deno cache --reload` without approval.** The blessed
  track lock (otel 1.40→1.28 + esbuild/preact/loader) is intentional — do not "fix" it.
- **Targeted `deno check` must pass `--unstable-kv`.**
- **Tooling:** use `.llm/tools/run-deno-check.ts` (the removed `parse-deno-check-errors.ts` is gone).
  Root `check`/`lint`/`fmt:check` are scoped and **exclude** Wave 5 app packages — a clean root
  check does NOT cover these units; run per-package `deno check --unstable-kv` over entrypoints.
- **doc-lint ground truth = COMBINED run over all entrypoints**, AND run full-barrel `mod.ts`
  independently (the 4c `SagaCorrelation` merged-graph trap).
- **`@netscript/ui-primitives` is RFC-deferred — do NOT create it.**
- **Zero-consumer rule** — grep `apps/playground` / `services` / `packages` before any removal; no
  shims in alpha, but no silent playground breakage.
- **Drift is explicit** — record every plan deviation + rename in the sub-wave `drift.md`.
- **Docs:** DROP "what it is not" sections; study TanStack/Medusa/Prisma/Hono for structure.

---

## 6. Platform gotchas (so you don't burn tokens rediscovering them)

- **RTK stale git cache** — spawn git via `deno eval 'new Deno.Command("git",{args:[...]}).outputSync()'`
  to bypass it; verify pushes with `git ls-remote`.
- **rtk-filtered `deno check`/`deno doc` is NOT a verdict source** — spawn `deno` directly via
  `Deno.Command` inside a `.ts` script to get raw output + exit codes (see `measure-doclint.ts`).
- **OpenHands `<!-- openhands-agent-summary -->` PR comment can be STALE** — the verdict source is
  the committed `evaluate.md`, not the rendered PR comment.
- **`gh` is not on PATH** — use the GitHub MCP for PR/issue ops.

---

## 7. Where you start

The supervisor stops at unblock + re-baseline + this handover. **Your first action** is to open
sub-wave **5a (service)**: fork `feat/package-quality-wave5-apps-5a-service` off the umbrella head
(`dfab7a4`), create its worktree + nested run dir (`feat-package-quality-wave5-apps--5a-service`),
run 5a MEASURE-FIRST, and produce its RESEARCH + PLAN & DESIGN for a separate PLAN-EVAL session.
`service` is the calibration unit (smallest; greenfield metadata + 8 slow-types + 2 over-cap +
README-from-zero + tests-from-zero).
