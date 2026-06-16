# Drift log — Wave 6 `@netscript/cli` A6-v2 promotion

Reality vs RFC/doctrine assumptions (from research):

| ID | Assumption | Reality | Impact |
| -- | ---------- | ------- | ------ |
| W-1 | CLI needs a full rewrite to reach A6-v2. | Already A6-correct shape; bounded moves only. | AP-1 closes as a 7-slice program, not a rewrite. |
| W-2 | `e2e/` is a workspace member. | Already resolved on the current branch: root `deno.json` includes `packages/cli/e2e`. | Slice 0.1 is a verify-green check, not a workspace edit. |
| W-3 | `DeployTargetKey` is already a port. | Slice 2 replaced the literal-union lock-in with `DeployTargetPort` + `DeployTargetRegistryPort`. | Resolved in Slice 2. |
| W-4 | Aspire 13.4 native Deno apphost is released. | Not at research time; bump deferred to slice 5, consuming Phase A pins. | Slice 5 gated on upgrade-run GA status (LD-6). |
| W-5 | Root `deno publish --dry-run` failure is a CLI bug. | Upstream `packages/aspire` barrel false-positive (R-1); fixed in Phase T (T0). | Not a CLI blocker. |

## Plan-phase drift (this session)

- The 5 maintainer open questions are carried with safe defaults (plan §Open-Decision Sweep); only Q2
  (`DeployTargetKey`→port timing) is "must resolve now" and is resolved to slice 2. No deferral forces
  rework.

## Post-#44-merge drift (supervisor, 2026-06-16)

- **D-W6-1 — Slice 5 apphost migration pulled forward into #44 (R6).** Assumption W-4 / LD-8
  assigned the Aspire 13.4 GA apphost-path realignment (`scaffold-files.ts`/`scaffold-aspire.ts`
  → `apphost.mts` + `.aspire/modules/*.mts` + `tsconfig.apphost.json`) to **this wave, slice 5**.
  Reality: #44's R5 runtime gate (`scaffold.runtime` E2E) failed at `database.init` because Aspire
  13.4.4 demands the `.mts` shape, so R6 (`677d5405`+`a50d73f`) performed the migration **in #44**
  to make that PR self-green. IMPL-EVAL APPROVED; merged `733388f`. **Impact:** slice 5 collapses
  from *perform migration* to *verify inherited shape* + schema mirror + `WithProcessCommand`
  flag-off. LD-8 amended in plan; W-4 effectively resolved (GA shape present, no preview fallback
  needed). PLAN-EVAL must judge against the amended (verify-only) slice 5, not the original.
- **D-W6-2 — freshness bump folded into slice 0.** Post-merge, the #44 IMPL-EVAL flagged
  `tailwindcss`/`@tailwindcss/vite` → ^4.3.1 and `@preact/signals` → 2.9.2 (released within days of
  R3, outside the `vite`-only DEBT_ACCEPTED). Folded into slice 0 (catalog-baseline consumption)
  rather than a standalone chore PR, to land `feat/package-quality` at-latest before it reaches `main`.
- **Rebased** this branch onto `733388f` (post-#44 `feat/package-quality`); was based on pre-#44
  `fcef53d`. Docs-only branch, clean rebase.

## Watch items (impl phase logs here)

- Aspire 13.4 preview vs GA at slice 5 (consume coupled fallback if preview).
- Any target-tree move changing a public export path.
- Impl-vs-research divergence → `research-realized.md` (LD-5), never edit `research.md`.

## Implementation Drift

- **D-W6-3 — App writer split stayed in kernel.** Research/plan text suggested moving
  `kernel/application/scaffold/writers/*` to `maintainer/features/codegen/*`, but
  `kernel/application/scaffold/orchestrate-init.ts` owns the public init pipeline and imports
  `scaffoldApp`. Moving app writers to a maintainer surface would introduce a kernel→maintainer
  dependency and fail F-CLI-4. Slice 3 therefore split the two 384-line files in place and preserved
  public export paths.
