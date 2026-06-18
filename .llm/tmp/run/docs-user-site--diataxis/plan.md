# Plan: docs/user-site (external/user documentation — Diátaxis + Lume→Pages)

> **DRAFT** — Research+Plan may proceed in parallel with Groups 1/2; **IMPL is gated on
> `chore/prod-readiness` AND `chore/deps-hygiene` merged** (docs must describe the clean,
> hygienic surface). PLAN-EVAL (separate session) required before any slice.

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `docs-user-site--diataxis` |
| Branch | `docs/user-site` (off `release/jsr-readiness`) |
| Phase | `plan` (draft) |
| Target | External user docs site + per-package reference + onboarding |
| Archetype | N/A (docs) — touches every publishable unit's README/reference surface |
| Scope overlays | `SCOPE-docs.md` |

## Goal

A coherent **external** documentation site for NetScript users, structured on **Diátaxis**
(tutorial / how-to / reference / explanation), with per-package API **reference** generated from
`deno doc` (and `deno doc --lint` clean, full-export), standardized package READMEs, and conceptual
onboarding — built with **Lume** and deployed to **GitHub Pages**.

## Scope

- **Reference (A1):** per publishable unit, API reference from `deno doc`; `deno doc --lint` 0
  diagnostics on the **full export surface**.
- **README standard (A2):** one standardized README shape across units (title, install, quick
  example, links to reference + concepts). Generated/checked, not hand-drifted.
- **Onboarding + concepts (A3):** tutorials (learning-oriented) + explanation (understanding) +
  how-to (task-oriented), Diátaxis-separated and cross-linked.
- **Build/deploy (A3):** Lume site → GitHub Pages via CI (`setup-deno` → `deno task build` →
  `upload-pages-artifact` → `deploy-pages`).
- **Freshness gate (E1):** a doc-freshness fitness gate so reference can't silently rot.

## Non-Scope

- Internal/contributor docs (Group 4 owns harness/doctrine/`.llm/`/root ops docs).
- Rewriting framework code or public API to make docs nicer (docs describe reality; API changes are
  separate runs).
- Marketing site / blog.
- A custom docs framework — **use Lume** (wrap-don't-reinvent).

## Hidden Scope

- **Reference denominator:** which of the 27 units get full reference vs lighter treatment
  (library packages vs `examples/`/`apps/`/`e2e`). Resolve in Design.
- **`deno doc --lint` debt:** some units may emit lint diagnostics (missing `@param`, non-exported
  return types). Fixing those touches **source JSDoc** — coordinate (supervisor writes docs; source
  JSDoc edits may need a generator slice). May surface as debt.
- **Pages subpath base URL:** `rickylabs.github.io/netscript` is a project subpath → Lume needs a
  `location`/base-path config or all asset/links break. Known risk from research.
- **Pages workflow file needs `workflow` scope** — the current PAT lacks it; the workflow YAML must
  be pushed with a workflow-scoped token (user to provide; **supervisor pings user at this point**).

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| US-1 | Diátaxis is the information architecture (4 types, separated, cross-linked). | Proven model; research-backed (Diátaxis + Laravel/TanStack/Medusa). |
| US-2 | Reference is **generated from `deno doc`**, not hand-written. | Single source of truth = the code; cheap to keep fresh; `deno doc` is the JSR-native surface. |
| US-3 | Build with **Lume**; deploy to **GitHub Pages** via the standard Deno Pages CI recipe. | Deno-native SSG; matches toolchain. |
| US-4 | `deno doc --lint` must be **0 on full export** per unit (A1). | Scorecard exit; JSR quality bar. |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| Reference denominator (which units, depth) | must resolve now | Drives slice count + the A1 gate scope. |
| Pages domain/subpath + Lume `location` config | must resolve in Design | Breaks all links if wrong; research flagged it. |
| Where `deno doc --lint` fixes live (supervisor doc vs generator source-JSDoc slice) | must resolve now | Determines if a Codex slice is needed; affects role boundaries. |
| README generation vs hand-authored-with-check | safe to defer | Resolve in Design. |

## Risk Register

| Risk | Mitigation |
|------|------------|
| Pages subpath breaks asset/links | Set Lume `location`; verify built `_site` links in CI before deploy. |
| `deno doc --lint` debt larger than expected | Census early; split source-JSDoc fixes to a generator slice; record residue as debt. |
| Pages workflow blocked by missing `workflow` scope | Ping user for workflow-scoped token at that slice; do not attempt the push without it. |
| Docs describe pre-cleanup reality | IMPL gated on Groups 1+2 merged (LD-F). |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| Mixed doc types on one page (tutorial+reference muddled) | avoid | Diátaxis separation. |
| Hand-drifted per-package READMEs | existing | resolve (standardize + check). |
| Hand-written API reference that rots | avoid | generate from `deno doc` + freshness gate. |

## Fitness Gates

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| `deno doc --lint` 0 full-export per unit (A1) | yes | per-unit lint run |
| README standard conformance (A2) | yes | README check script |
| Lume build + Pages deploy (A3) | yes | CI green; `_site` artifact deploys |
| doc-freshness gate (E1) | yes | gate wired into quality lane |
| Links/anchors valid in built site | yes | link-check on `_site` |

## Arch-Debt Implications

| Entry | Action | Notes |
|-------|--------|-------|
| `.llm/harness/debt/arch-debt.md` | add | Any `deno doc --lint` source-JSDoc residue deferred past this run. |

## Validation Plan

| Order | Gate | Command/check | Expected |
|-------|------|---------------|----------|
| 1 | reference quality | `deno doc --lint <entry>` per unit | 0 diagnostics |
| 2 | README standard | README check script | conformant |
| 3 | build | `deno task build` (Lume) | `_site` produced |
| 4 | links | link-check `_site` | no broken links/anchors |
| 5 | deploy | Pages CI | deploy succeeds (needs workflow-scoped token for the YAML) |

## Dependencies

- **Blocks on:** Groups 1 (`prod-readiness`) + 2 (`deps-hygiene`) merged before IMPL.
- Research grounding: `.llm/tmp/docs/docs-architecture-research.md`.
- Pages workflow YAML needs a workflow-scoped token (user-provided; supervisor triggers the ask).
- `deno doc` documentation (rendering/lint gotchas) lands in Group 4 (internal) — cross-link.

## Drift Watch

- `deno doc --lint` debt exceeding a doc-only fix (→ generator slice or debt).
- Pages subpath/location issues at build.
- Scope creep into internal/contributor docs (Group 4) or into API changes.
