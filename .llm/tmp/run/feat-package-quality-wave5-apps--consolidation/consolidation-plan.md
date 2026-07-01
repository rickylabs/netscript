# Consolidation Plan — Wave 5 Apps (production-grade structural pass)

Run ID: `feat-package-quality-wave5-apps--consolidation`
Branch: `feat/package-quality-wave5-apps` · Archetype: **4 — Public DSL/Builder** (all four units)
Doctrine verdict baseline: Wave 5 packages pass type/lint/JSR but are **pre-doctrine structurally**.
This plan serves as the run's `plan.md`. **Per user direction the separate PLAN-EVAL session is
waived** (user: "won't require an additional PLAN PHASE … you are smart enough"). The IMPL-EVAL /
gate evidence is still produced (worklog + gates + drift).

## Goal

Bring `@netscript/{service,sdk,fresh-ui,fresh}` to the **same production-grade structure as Wave
2/3** (`packages/plugin` reference): canonical `src/{domain,ports,application,adapters,...}`
layering, file-splitting under the 500-LOC ceiling, folder cardinality ≤ 12, **zero legacy
surface** (no root barrel folders, no forbidden `utils/`), seams realized as **ports + adapters**,
and **all consumers — including CLI scaffold templates — updated with no backward-compat shims.**

## D1 — LOCKED architecture decisions

**D1.1 — Abstraction strategy (reconciles user's "abstract class / base / ports / adapters").**
The user asked for abstract base classes on public seams. Doctrine 03 (A4/A5) forbids base classes
without ≥ 2 real concrete subtypes on a named axis, and mandates **cross-package extension via
ports + registration, not inheritance**. Live inspection found **no package has ≥ 2 subtypes
today**. Therefore the production-grade realization of "public-facing seams" here is:
- **Ports** (interfaces) for every consumed/ extensible contract — already strong in `sdk`; add to
  `service` where a real seam exists.
- **Adapters** — one file per technology in `src/adapters/`, class `= <Tech><Port>`.
- **Stub-only base classes ONLY where a genuine subtype axis exists or is committed.** None qualify
  today; introducing them would be premature-abstraction (Wet-Codebase AP, A4/A5 fail). We
  **protect the seams** (RFC 14 `Transport` in-process, `FormSchemaAdapter` Valibot) by keeping
  them as ports with one adapter, co-located in plural-named folders ready for a sibling
  (R-FOLD-AD-COLOC). This is recorded as deliberate, justified withholding — not an omission.

**D1.2 — `src/` is the only source root.** Every package wraps source in `src/`. Root-level files
are `mod.ts`, optional `cli.ts`, `README.md`, `deno.json`, `CHANGELOG.md` only. Root barrel
folders are deleted; `exports` repoint into `src/`.

**D1.3 — Subpath KEYS stay stable during internal restructure (non-breaking), then `fresh`'s
surface is rationalized in one dedicated tail slice** with every template/test/consumer updated in
the same commit. `service`/`sdk`/`fresh-ui` keep their existing subpath keys (only the right-hand
target paths move into `src/`), so external consumers and CLI templates for those three do **not**
change. `fresh` is the only package whose public surface is rationalized.

**D1.4 — No shims, no re-export aliases.** Legacy import paths are removed, not aliased. Consumers
move in the same slice that removes the old path (zero-window break, validated by `deno check`).

**D1.5 — Archetype label fix.** `fresh-ui` README/header corrected A3 → A4.

**D1.6 — Generated/large catalogs stay single-purpose.** `fresh-ui/registry.manifest.ts` (891)
moves to `src/registry/manifest/` and splits by item group (components / blocks / islands / styles
/ libs / theme) so each file ≤ ~250 LOC and the catalog stays one concept per file.

## Gate set (archetype 4 + jsr-audit; per `gates/archetype-gate-matrix.md`)

F-1 per-layer caps · F-5 surface encapsulation · F-6 publishability (dry-run) · F-7 doc-score ·
F-11 forbidden-folder · F-16 subpath cardinality · F-17 abstract co-location · F-18 sub-barrel ·
full-export `deno doc --lint` · scoped `deno check --unstable-kv` · scoped `deno lint`/`fmt` ·
consumer-import gate (workspace `deno check`) · **`deno task e2e:cli` from WSL native worktree**
(A4-Browser routes for fresh/fresh-ui validated against `apps/playground`). Use the scoped wrappers
`.llm/tools/run-deno-{check,lint,fmt}.ts`, not raw root CLI.

## Phases & commit slices (dependency order: service → sdk → fresh-ui → fresh)

Each slice: internal-only where possible, named gate, commit, append `commits.md`.

### Phase A — `@netscript/service` (smallest; calibration)
- **A1** Split `src/builder/service-builder.ts` (604) → `service-builder.ts` (interface + factory,
  ≤ 150) + `service-builder-state.ts` (typestate accumulator) + `service-builder-steps.ts`
  (cors/logger/db/openapi/docs/rpc/health step fns). Gate: `deno check` + `deno test` service.
- **A2** Confirm role layering, add `@module` docs to any split files, README archetype line.
  Gate: full-export `deno doc --lint` + dry-run service.

### Phase B — `@netscript/sdk` (collapse barrels → canonical roles)
- **B1** Create `src/adapters/`; move `kv-cache-store.ts`, `http-client-link.ts`,
  `kv-cache-persister.ts` there (class names already `<Tech><Port>`). Update intra-package imports.
- **B2** Introduce `src/domain/` (pure types currently inlined) + `src/application/` (factories:
  query, query-client, collections, `define-services` preset). Move feature files into role folders;
  keep `discovery/` (legit feature cluster) and `ports/`.
- **B3** Delete root barrel folders (`cache/`,`client/`,`collections/`,`discovery/`,`query/`,
  `query-client/`,`telemetry/`,`ports/`); repoint `deno.json` `exports` to `./src/**/mod.ts`.
  **Subpath keys unchanged** → no external break. Gate: `deno check` sdk + workspace consumers
  (`queue`, `fresh`) + dry-run + doc-lint.

### Phase C — `@netscript/fresh-ui` (introduce `src/`)
- **C1** Create `src/`; move `runtime/`→`src/runtime/`, `tokens/`→`src/domain/tokens/` (token
  vocab) / keep token CSS under `registry/theme/` (generated artifact path stays for
  `tokens:build`), `primitives.tsx`→`src/presentation/primitives.tsx`, interactive impls→
  `src/runtime/`. Root `mod.ts`/`interactive.ts`/`primitives.tsx` become re-export shells pointing
  into `src/`. Repoint `exports`. Subpath keys unchanged.
- **C2** Move `registry.manifest.ts` (891) → `src/registry/manifest/` split by item group;
  `registry.schema.ts` → `src/registry/schema.ts`. Fix README A3→A4. Gate: check + dry-run +
  doc-lint + `tokens:check` unaffected.

### Phase D — `@netscript/fresh` (long pole)
- **D1** Create `src/`; lift `domain` types; **eliminate `utils/`** (`cache-entry.ts` →
  `src/domain/cache-entry.ts`, delete `utils/`, drop `./utils` subpath, update the one consumer).
- **D2** `builders/` → `src/application/builders/` with vertical feature folders
  (`define-page/`, `define-partial/`); split `builders/mod.ts` (1110) + `define-page/builder.tsx`
  (1097) per concern (builder / state / validation / navigation / runtime / types), each ≤ ~400.
- **D3** `route/` → `src/application/routes/`; split `mod.ts` (755) + `contract.ts` (600) into
  `contract.ts` / `manifest.ts` / `validation.ts` / `types.ts`.
- **D4** `form/` (28 files) → `src/application/forms/` with role sub-folders (`validation/`,
  `enhancement/`, `state/`, `components/`, `schema-adapters/`); split `schema-adapter.ts` (576) +
  `field-descriptors.ts` (518). Co-locate `FormSchemaAdapter` + `ZodSchemaAdapter` in
  `schema-adapters/` (seam ready for Valibot; no base class).
- **D5** `server/` + `streams/` + `defer/` + `error/components` → `src/application/streaming/`
  (sse/stream/stream-db/defer/error-display); `query/`→`src/application/query/`;
  `config/vite.ts`→`src/application/vite-config/`; `hooks/`,`components/` placed by role.
- **D6 (breaking surface + consumers)** Repoint all `fresh` `exports` to `src/`; rationalize
  subpaths (drop `./utils`; fold `./error`,`./streams`,`./defer`→`./streaming`; keep
  `./builders`,`./route`,`./form`,`./query`,`./interactive`,`./vite`,`./server` decision finalized
  here from real consumer counts). **Update in the same commit:** CLI `SCAFFOLD_PACKAGES`,
  `import-resolver.ts`, `generate-app-deno-json.ts`, 13 templates, 3 CLI tests, plugin deno.json,
  cross-package imports, root workspace deno.json, `apps/playground`. Gate: workspace `deno check`
  + dry-run + doc-lint + **`deno task e2e:cli` (WSL native)**.

### Phase E — Close
- Root scoped check/lint/fmt; arch:check if Phase B+ composite gate available; full E2E (WSL);
  update README "see also" cross-links; CHANGELOG entries; context-pack; arch-debt for any deferral;
  exhaustive PR summary comment.

## Open-decision sweep
- **Subpath rationalization for `fresh` (D6)** — *must resolve now* (breaking; finalized from
  consumer counts at D6, not deferred).
- **Base classes** — *resolved now*: withheld per D1.1.
- **fresh-ui token folder placement** (`src/domain/tokens` vs keep `registry/theme` generated) —
  *safe to defer* within C: generated CSS path stays; only TS token vocab moves.
- **`./server` fold vs keep** — *safe to defer to D6* (consumer count decides; templates use it).

## Risk register
| Risk | Mitigation |
| --- | --- |
| Subpath break cascades to CLI scaffold → e2e red | D1.3 keeps keys stable for 3 packages; fresh's break is one atomic D6 slice with all consumers; validate `deno check` workspace before e2e. |
| E2E only valid on WSL native (`/mnt/c` DrvFS fails) | Run `deno task e2e:cli run scaffold.runtime --cleanup` from `/home/codex/repos/netscript-wave5-apps` (codex-wsl-remote skill); Windows scoped `deno check` for fast inner loop. |
| File splits reintroduce slow types (F-6) | Keep explicit return types on every moved export; re-run dry-run per package. |
| Over-abstraction pressure (user wants base classes) | D1.1: ports+adapters only; document withholding; evaluator-safe on A4/A5. |
| `fresh` too large for one safe pass | Phases D1–D5 are internal-only (subpaths stable via repoint); D6 is the only breaking slice. Each Dx is independently `deno check`-gated. If D2 alone exceeds budget it may split (drift entry). |

## Debt implications
- If `fresh` D6 surface rationalization cannot land with full e2e green in this pass, record an
  arch-debt entry (owner, closing gate F-16/F-18) rather than leaving a half-broken surface.
- `fresh-ui` registry manifest split is structural; if catalog regeneration tooling is later added,
  note follow-up.

## Deferred scope
- RFC 14 unified-mode / in-process transport (seam-protect only; do NOT implement).
- `@netscript/ui-primitives` (RFC-deferred; do NOT create).
- Publishing/versioning/OIDC (S2/S3).
- New tests beyond what splits require (keep existing suites green; add only where a split needs it).

## Contributor path (post-consolidation)
Open `packages/<pkg>/src/`: `domain/` (vocabulary) → `ports/` (seams) → `application/builders/<x>/`
(the DSL) → `adapters/` (tech) → `testing/`. To add a builder: copy a sibling feature folder under
`application/builders/`, add its subpath to `deno.json` `exports`. To add a tech adapter: drop one
file in `adapters/`, register at the composition root.
