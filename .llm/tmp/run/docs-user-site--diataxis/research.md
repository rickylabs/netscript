# Research — docs-user-site--diataxis

> Grounded in `.llm/tmp/docs/docs-architecture-research.md` (Diátaxis four-type model; Lume→GitHub
> Pages recipe + subpath `location` risk; Laravel/TanStack/MedusaJS doc-architecture synthesis).

## Re-baseline

- Carried-in source: handover §3.3.
- Re-derived against `main` @ `cc3b8731`.
- Prereq: docs describe the **post-cleanup, post-hygiene** surface → IMPL waits for Groups 1+2.

## Findings

| # | Finding | Source / how to verify |
|---|---------|------------------------|
| 1 | **Diátaxis**: 4 doc types (tutorial/how-to/reference/explanation) on 2 axes (action↔cognition, practical↔theoretical); keep separated, link across. | `docs-architecture-research.md` §Diátaxis. |
| 2 | **Lume→Pages recipe**: `setup-deno@v2` (cache) → `deno task build` → `upload-pages-artifact@v3` (path `_site`) → `deploy-pages@v4`; perms `contents:read`/`pages:write`/`id-token:write`. | `docs-architecture-research.md` §Lume. |
| 3 | **Subpath gap**: project Pages (`<user>.github.io/netscript`) needs Lume `location` config or links/assets break. | `docs-architecture-research.md` §Lume risk. |
| 4 | **Reference source = `deno doc`** (+ `deno doc --lint`): the JSR-native surface description; `deno doc --lint` is the publish-quality bar. AGENTS.md: "`deno doc` is your friend". | `deno doc --help`; AGENTS.md Read Order. |
| 5 | Comparators: Laravel (versioned, task + reference split), TanStack (per-package docs, framework-adapter matrix), MedusaJS (concepts vs reference vs how-to separation). | `docs-architecture-research.md` §comparators. |
| 6 | 27 publishable units exist; not all are library packages (examples/apps/e2e) — reference denominator must be decided. | `deno task publish:dry-run` unit list. |

## Census to build (generator/Design)

- **Unit classification:** library vs example vs app vs e2e → reference depth per class.
- **`deno doc --lint` baseline:** run per candidate unit; count diagnostics; classify doc-only vs
  source-JSDoc fixes.
- **README inventory:** current README shapes → define the standard template + checker.
- **Lume site skeleton:** nav = Diátaxis sections; `location` for the Pages subpath.

## jsr-audit surface scan

- For each unit getting reference: the export entry (`exports`/`mod.ts`) is the `deno doc` input;
  `deno doc --lint` 0 on the **full export** is the A1 bar. Cross-check the export map matches the
  published surface (no missing/extra entry).

## Open questions

- Reference denominator + depth per unit class.
- Pages domain/subpath + exact Lume `location` value.
- `deno doc --lint` fixes: doc-only (supervisor) vs source-JSDoc (generator slice)?
- README: generated vs authored-with-check.
