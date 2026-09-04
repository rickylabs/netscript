# The eis-chat bar — measured, not described

Source: read-only audit of `rickylabs/eis-chat` (898 commits, 816 first-party ts/tsx files).
These are the numbers a Wave 7 build is measured against. They are targets, not trivia.

| Property | eis-chat actual |
| --- | --- |
| Design tokens in own token source | **156** (`apps/dashboard/assets/tokens.css`, 248 lines) + generated `tokens.json` manifest + checked-in sync tool |
| Dark mode | **35 semantic overrides** under `[data-theme='dark']`; no component branches on theme; pre-paint inline script prevents flash |
| Raw hex outside the token source | **19** across 65 stylesheets / 16,734 CSS lines |
| `/design` surface | A real sub-app: own `_layout.tsx`, 4 pages (tokens/components/composition/generative), **1,694 lines** of view code, click-to-copy `var(--ns-*)` chips, driven by a 309-line component registry |
| UI primitives / blocks / islands | **50 / 18 / 35** |
| Route-group collocation | `(_components)` 24, `(_islands)` 4, `(_shared)` 2, `(design)`, plus 12 `index.tsx` + `index.route.ts` sidecar pairs and per-segment `_middleware.ts` |
| Contract derivation | Prisma → `prisma-zod-generator` → versioned `v1` module narrowed with `.pick(...).strict()`; CI fails if generated output is uncommitted |
| Tests | **183 test files, 1,247 `Deno.test` cases** — including executable architecture-fitness tests that read source and assert seams |
| Browser E2E | Playwright resolved at runtime (no workspace dep), 8 scenarios, gateable by exit code, written around a named production defect |
| Type escapes in 619 source files | **0 `@ts-ignore`, 0 `@ts-expect-error`**; 11 real `as any`, 9 of them in browser-eval bridges |
| README | **243 lines** — every capability section also names a limit; inline Mermaid topology; exact gate commands; 13-row path→purpose table |
| Architecture gates | 7 `check:*` programs reading committed JSON inventories, run under their own frozen lockfile; the gates themselves are tested for each failure mode; CI is 17 steps |

## The five properties that actually make it feel production-grade

1. **The token source is the design.** Brand-derived ramps (green-tinted neutrals, `#108e37`
   primary, `#852f7b` secondary), `Outfit` + `DM Mono`, a 6/10/14/18/24 radius scale, *green-tinted
   shadows*, and domain type tokens like `--ns-text-chat`. Layout itself is tokenised
   (`--ns-app-nav`, `--ns-topbar-h`, `--ns-shell-content`).
2. **The gallery renders from a manifest**, so a new token appears in the docs automatically.
3. **Rationale lives next to the code.** Migration entries explain *why* cache-read and cache-write
   are separate columns; ADRs are append-only "because the record of why something was decided is
   the point".
4. **Limits are stated, not hidden.** The README says what is API-only and what is refused.
5. **Gates are programs, not lint rules**, and editing the inventory JSON alone cannot make a new
   exception pass.
