# OpenHands run summary — Deno 2.8 + Aspire 13.4 upgrade RESEARCH

> **Run:** `27522478072` (PR #44, chore/deno-2.8-aspire-13.4-upgrade—research phase)
> **Model:** `openrouter/minimax/minimax-m3` (per the trigger comment)
> **Phase:** RESEARCH ONLY — no source/config edits, no version bumps, no implementation.

## Summary

Produced a complete adoption analysis for the Deno 2.8.x + Aspire 13.4.x toolchain upgrade
*without* modifying any source, config, lockfile, or `packages/` code. The single artifact is
**`research.md`** (487 lines, ~57 KB) under the run-scoped directory
`.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/`. The artifact is durable on the
branch and is the deliverable the impl phase will consume.

The research treats the two upgrades as **coupled at the type-system boundary but decoupled at
runtime** (Risk R-11), so the slice plan offers a default decoupled path (slice 0 = Deno only,
slice 1 = Aspire 13.4 GA) and a coupled fallback (slice 1b) for the case where Aspire 13.4 ships
still-preview relative to Deno 2.8.

## Changes

**Files created/modified (everything lives under the run-scoped dir):**

| File | Status | Purpose |
|---|---|---|
| `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/research.md` | filled (was skeleton) | Full deliverable: discrepancy reconciliation with prior notes + Sections A–G + end-to-end checklist |
| `/home/runner/work/_temp/openhands/27522478072-1/summary.md` | created | This run summary |

**No source/config files were touched.** The hard scope boundaries from `research-brief.md` were
honoured: no `deno.json`/`deno.jsonc`, no `*.csproj`/`global.json`, no lockfile, no `packages/`
code. No `deno cache --reload`. No `deno upgrade`. No `git commit`/`push`.

### `research.md` section structure

- **Discrepancies vs prior notes** (D-1..D-5) — re-verified claims in
  `…/master--public-release-program/notes/TOOLCHAIN-2.8.md` and `…/ASPIRE-13.4-13.5.md` and
  corrected the references to `packages/NetScript.Aspire.Hosting/` (does not exist) and the
  "committed `dotnet/AppHost/AppHost.csproj`" (it is generated, not committed).
- **Section A — Deno 2.8 adoption matrix** (18 rows). 12 adopt-now (5 already adopted and
  verified), 1 adopt-with-debt (the four `--allow-slow-types` carve-outs in
  `contracts`/`triggers`/`service`/`plugin` → 4 `DEBT_ACCEPTED` rows in `arch-debt.md`),
  3 defer (OTel exporters, `deno pack`, Lume framework detection), 1 free upgrade (TS 6.0.3).
- **Section B — Deno 2.8 legacy removal** (8 rows). 1 partial deletion (B-3: hand-rolled
  slow-type workarounds outside the four carve-outs), 4 audits (B-4 dead lint suppressions,
  B-6 `isolatedDeclarations: false` overrides, B-8 per-package `lib` duplicates, B-1 verification
  grep), 3 no-action (B-2, B-5, B-7).
- **Section C — Aspire 13.4 adoption matrix** (9 rows). 5 adopt-now (C-1, C-2, C-3 = version
  bumps in `SCAFFOLD_VERSIONS`; C-6 = `aspire logs --search` in the e2e smoke; C-7 = Aspire MCP
  docs surface), 1 adopt-with-coordination (C-5 = `WithProcessCommand()` joint with Wave 6 CLI),
  1 defer to Wave 6 (C-4 = `apphost.mts` + `.aspire/modules/` path realignment — explicitly
  flagged as owned by the CLI research, not duplicated here per the brief's overlap rule),
  1 defer to 13.5 (C-8 = `aspire doctor` Deno reporting), 1 partial (C-9 — version metadata
  is via NuGet/npm, not the docs MCP).
- **Section D — Aspire 13.4 legacy removal + 13.5 flip seam**. 8 legacy rows: 2 outright
  deletions (D.1-1, D.1-2 — both are version-pin consolidations; D.1-2 specifically removes
  the duplicated `SCAFFOLD_COMMUNITY_TOOLKIT.VERSION = '13.2.1-beta.532'` constant in
  `scaffold-aspire.ts:11`), 2 deferrals to Wave 6 (D.1-3 `.modules/`, D.1-4 `apphost.ts`),
  2 deferrals to 13.5 (D.1-6, D.1-8 — `_aspire-compat.ts` shim), 1 audit (D.1-5 — tsx +
  vscode-jsonrpc pin in `render-ts-apphost.ts:51-62`), 1 new wiring (C-5). The 13.5
  flip-seam design (D.2) mirrors the validation checklist from `microsoft/aspire#16218`
  (which we requested) — toolchain resolver, `aspire doctor` Deno line, CLI E2E
  restore/run/doctor. The single concrete 13.4 design choice that makes the 13.5 flip cheap:
  ship stubbed `# [aspire-13.5]` blocks in the 13.4 `apphost.ts` template so the 13.5 diff is
  fill-in-the-stubs, not a rewrite.
- **Section E — Coordinated validation plan.** 9 per-PR gates (E-1 `deno ci`, E-2 `deno audit`,
  E-3 `deno task check`, E-4 lint, E-5 fmt:check, E-6 test, E-7 `arch:check`, E-8
  `publish:dry-run`, E-9 per-function coverage); 3 nightly/release-only (E-10
  `e2e:cli run scaffold.runtime`, E-11 `aspire run` end-to-end with `--search`, E-12 scaffold
  version pin verification); 1 deferred to 13.5 (E-13 `aspire doctor` Deno line). E-4 also
  acts as the B-4 dead-suppression detector. E-4 is the cheap new gate. E-10 is the one that
  proves the Aspire 13.4 ↔ Deno 2.8 coupling is sane.
- **Section F — Risk register** (16 risks, R-1..R-16, with L/M/H likelihood + blast-radius +
  owner). Highest-blast: R-7 (Aspire 13.4 preview pin — guarded by E-12 + the "no preview"
  CI test), R-11 (coupled Deno+Aspire upgrade — guarded by the slice plan's single-PR coupled
  fallback), R-2 (JSR publish gate — guarded by E-8). Highest-likelihood: R-4 (carve-out scope
  in the four heavy-generic packages — guarded by the 20-symbol cap in A-12), R-6 (.NET 10 RC
  shifts — guarded by `allowPrerelease: true` already in the generator), R-7 (Aspire preview),
  R-16 (`.modules/` path drift — guarded by the single-file ownership rule in R-14). R-1, R-3,
  R-9, R-10, R-12 are deferred to S5 or post-alpha.
- **Section G — Upgrade slice plan** (5 branches; 4 default + 1 fallback).
  - **Slice 0** `chore/deno-2.8-toolchain-pin-foundation` off `feat/package-quality` —
    Deno only. Pins `v2.8.x`, adds `catalog:`, removes dead suppressions, normalizes
    `isolatedDeclarations`/`lib`, applies the 4 carve-outs with paired `arch-debt.md` rows,
    adds `deno audit`, per-function coverage, `deno task --parallel`. Pass: E-1..E-9.
  - **Slice 1** `chore/aspire-13.4-version-bump` off `feat/package-quality` — Aspire 13.4
    decoupled. Updates the 3 `SCAFFOLD_VERSIONS` constants (C-1, C-2, C-3), consolidates
    `SCAFFOLD_COMMUNITY_TOOLKIT` (D.1-2), audits `tsx`/`vscode-jsonrpc` (D.1-5), stubs the
    13.5 blocks in the apphost template (D.2), wires `aspire logs --search` (C-6). Pass:
    E-1..E-9 + E-10 + E-12. **Path realignment deferred to Wave 6.**
  - **Slice 1b** `chore/deno-2.8-aspire-13.4-coupled` — fallback when 13.4 ships preview-only.
    Combines slice 0 + slice 1 in a single PR (R-11). Pass: E-1..E-12 together.
  - **Slice 2** `chore/aspire-13.4-doctor-and-typed-commands` — joint with Wave 6 CLI.
    Wires `WithProcessCommand()` consuming the CLI typed-args schema (C-5, R-15), documents
    the Aspire MCP surface in `.agents/skills/aspire/SKILL.md` (C-7), adds the `aspire doctor`
    step (skip-when-13.4) to the e2e smoke (D.2/E-13).
  - **Slice 3** `chore/aspire-13.5-native-deno-apphost` — post-13.5 GA, **not a launch gate**.
    Deletes the `_aspire-compat.ts` shim, fills the stubbed 13.5 blocks, un-skips E-13.

  Each slice is independently mergeable; the per-PR gates E-1..E-9 are required for every
  slice, the nightly gates E-10..E-12 are required only for the Aspire-touching slices.

### Cross-reference / non-duplication

- **Wave 6 CLI research (PR #43)** owns the apphost scaffold + `deploy`/command-registry
  surface. This research explicitly **deferes to Wave 6** for: C-4 (path realignment
  `apphost.mts` + `.aspire/modules/`), C-5 (typed-args schema ownership), and the path delta
  in D.1-3 / D.1-4. The brief's hard rule — "this owns toolchain version + feature adoption;
  CLI owns apphost-scaffold/deploy seam" — is enforced via a single-file ownership rule
  (R-14): toolchain upgrade owns `scaffold-versions.ts` and `copilot-setup-steps.yml`; CLI
  Wave 6 owns `scaffold-files.ts` and `scaffold-aspire.ts` (for the `APPHOST_TS` and
  `SDK_IMPORT_FROM_HELPERS` paths). The two research strands are sequenced: toolchain pin
  lands first, Wave 6 path migration consumes the new pin.

## Validation

This is a **research-only** phase, so the validation is **read-only re-verification** rather
than a gate run. The verification work performed:

1. **Re-read both prior notes** (TOOLCHAIN-2.8.md, ASPIRE-13.4-13.5.md) to confirm or refute
   their claims. Found 5 discrepancies (D-1..D-5) — all recorded in the artifact, not
   silently re-derived.
2. **Verified the current scaffold constants** at
   `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`,
   `scaffold-files.ts`, `scaffold-aspire.ts`, `scaffold-dirs.ts`, `scaffold-defaults.ts`. The
   claim that `SCAFFOLD_COMMUNITY_TOOLKIT.VERSION = '13.2.1-beta.532'` is **duplicated state**
   with `SCAFFOLD_VERSIONS.ASPIRE_HOSTING_DENO` is confirmed (scaffold-aspire.ts:11) and is
   the basis for D.1-2.
3. **Verified the current CI pin** at
   `.github/workflows/copilot-setup-steps.yml:42` (`deno-version: v2.x`) and the Aspire CLI
   install via `aspire.dev` install script (not `dotnet workload install`).
4. **Verified the `dotnet/global.json` generator**
   (`packages/cli/src/kernel/templates/aspire/generate-global-json.ts`) emits
   `allowPrerelease: true`, which is the basis for the R-6 mitigation.
5. **Counted the workspace members** — 28 `deno.json` files in `packages/` + `plugins/` —
   to confirm the A-8 catalog-rewrite scope.
6. **Surveyed @std/zod usage** — 354 files reference `@std/*`, 90 reference `zod` — to confirm
   the A-8 catalog centralisation is the right shape.
7. **Verified the `dotnet/net10.0` target** in
   `ServiceDefaults.csproj.template` and the `tx`/`vscode-jsonrpc` pin in
   `render-ts-apphost.ts:51-62` (basis for D.1-5).

**No gate was run.** Per the brief, the impl phase runs the gates, not this research.

## Responses to review comments or issue comments when relevant

N/A — this is a fresh PR-comment trigger on a research branch. No prior review comments
apply. The artifact is the deliverable; review is the next step.

## Remaining risks

The top three "must watch" risks for the impl phase, in priority order:

1. **R-7 (Aspire 13.4 is still pre-release).** The bump should not happen until Aspire cuts
   13.4.x GA. Guard with the E-12 "no preview" assertion in `check-scaffold-versions.ts`.
2. **R-11 (Deno+Aspire type-system coupling).** If Aspire 13.4's regenerated SDK requires
   TS 5.6+, slice 1 (decoupled) is invalid and the impl must use slice 1b (coupled).
   Verify by reading the Aspire 13.4 preview release notes *before* opening the impl
   PR; if the SDK target is unclear, prefer the coupled slice as a safer default.
3. **R-16 (`.modules/` path drift).** Until Wave 6 lands the path realignment, the
   generated `aspire.config.json` references the legacy `.modules/aspire.ts` path. The
   13.4 SDK accepts the legacy path (forward-compatible per the live 13.2.2 verification),
   so this is **not** a launch blocker, but it is drift the maintainer should be aware of
   in PR review.

**Medium risks to monitor in the impl phase:** R-4 (carve-out scope explosion in the four
heavy-generic packages — the 20-symbol cap is the guard), R-2 (JSR publish gate rejecting
Node-leaking types — guard with E-8 across all 28 member packages), R-6 (.NET 10 RC shifts —
guard with `dotnet --list-sdks \| grep 10` in CI).

**Deferred to post-alpha / S5:** R-1 (Fresh/Preact inference under TS 6.0.3 — owned by S5),
R-3 (Lume — out of scope), R-9 + R-10 (CI pin friction — re-evaluate at beta), R-12
(Aspire 13.4 SDK TS target — verify before opening the impl PR).

---

**RESEARCH COMPLETE**
