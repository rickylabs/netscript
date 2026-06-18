# Plan: docs/user-site (external/user documentation — Diátaxis + Lume→Pages)

> **READY FOR PLAN-EVAL** (2026-06-18) — Groups 1+2 are now **merged** into the umbrella, so the
> IMPL gate is satisfied; the two big open decisions (reference denominator, lint-fix location) are
> resolved with hard evidence in `research.md`. PLAN-EVAL (separate OpenHands/minimax-M3 session)
> required before any slice. Two items remain **user-gated** (do not block PLAN-EVAL): Pages
> domain/subpath value and a `workflow`-scoped token for the Pages CI YAML.

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

- **Reference denominator (RESOLVED → 26):** the publish denominator is **26 units** (25 E-wave +
  `@netscript/cli`); `@netscript/cli-e2e` (`publish:false`) is excluded. Depth *within* the 26 (the
  4 `*-core` substrate packages folded under their public plugin vs full pages) remains a Design call.
- **`deno doc --lint` debt (RESOLVED → 1 unit):** baseline census shows **25/26 clean**; only
  `@netscript/fresh-ui` fails with **7 `error[private-type-ref]`** (public component consts typed by
  private `*Namespace` types). These are **source/TS fixes**, so they are a **WSL Codex slice**
  (SCOPE-frontend), not supervisor doc work — see research table for the exact 7 files/lines.
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
| US-5 | Reference **denominator = 26 publish targets** (25 E-wave + `@netscript/cli`); `@netscript/cli-e2e` excluded (`publish:false`). | Matches the canonical `publish:dry-run` + publish E/F split; see research finding #6. |
| US-6 | The single `deno doc --lint` debt (`@netscript/fresh-ui`, 7 `private-type-ref`) is fixed by a **WSL Codex source slice** (export the `*Namespace` types), not supervisor doc edits. | Role boundary: supervisor does not write `packages/` code; fix is TS not Markdown. |
| US-7 | **Pages target = project subpath `https://rickylabs.github.io/netscript/`** (user decision 2026-06-18). Lume `location` MUST be set to this base path; the deploy slice still needs a `workflow`-scoped token (user-provided). | Default GitHub project Pages; no DNS. Base-path config is mandatory or all asset/links break (research §subpath risk). |
| US-8 | Reference **depth**: 22 primary reference pages (one per public unit); the 4 `*-core` substrate packages (`plugin-{sagas,streams,triggers,workers}-core`) fold as an **Internals** subsection under their public plugin page, not standalone nav entries. All 26 stay in the lint denominator. | Users consume the public plugin surface; `*-core` is substrate. Keeps nav legible while preserving the 26-unit A1 bar. |
| US-9 | **READMEs**: one standardized template (title · one-line purpose · `deno add jsr:@netscript/<pkg>` install · quick example · links to reference + concepts), **generated per unit** and enforced by a README-conformance checker (A2 gate). | Single shape, no hand-drift; matches A2 "generated/checked". |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| Reference denominator (which units) | **RESOLVED** (US-5) | 26 publish targets; cli-e2e excluded. |
| Where `deno doc --lint` fixes live | **RESOLVED** (US-6) | 25/26 clean; fresh-ui = 1 Codex source slice (7 edits). |
| Reference **depth** per unit (fold `*-core` vs full pages) | **RESOLVED** (US-8) | 22 primary reference pages; the 4 `*-core` substrate packages fold as an "Internals" subsection under their public plugin. |
| Pages domain/subpath + Lume `location` config | **RESOLVED** (US-7) | Project subpath `https://rickylabs.github.io/netscript/`; Lume `location` set to it. |
| Pages CI YAML push needs `workflow`-scoped token | **user-gated** | Current PAT lacks effective workflow scope; user provides before the deploy slice. |
| README generation vs hand-authored-with-check | **RESOLVED** (US-9) | Standardized template, generated per unit + enforced by a README-conformance checker (A2). |

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

## Commit Slices

> Authored under LD-DOCS-LANE (Claude dynamic workflow per-domain/per-unit; OpenHands IMPL-EVAL validates per-unit). Worktree `.claude/worktrees/g3-user-site` (`docs/user-site`). Agents write via Bash absolute paths into the worktree (workflow subagents inherit the launch-worktree pin — see supervisor lesson). Off-limits unchanged: no `packages/`/`plugins/` source edits in the doc lane (the sole source change is the fresh-ui Codex slice, G3-FUI); no version pins; no catalog edits.

| Slice | Proves (gate) | Files |
|-------|---------------|-------|
| G3-0 | Lume site skeleton + Diátaxis nav + `location` subpath config; `deno task build` → `_site` (A3 build) | `docs/site/` (Lume config, nav, layouts), root `deno.json` `build` task |
| G3-1 | README standard template + conformance checker script runs (A2) | `.llm/tools/check-readme-standard.ts`, `docs/site/_includes` README template, `deno.json` task |
| G3-2 | Per-unit API **reference** from `deno doc` for the 22 primary units (4 `*-core` folded as Internals subsections); `deno doc --lint` per unit (A1; 25/26 clean, fresh-ui pending G3-FUI) | `docs/site/reference/<unit>/*` |
| G3-3 | Standardized **READMEs** generated per unit, checker conformant (A2) | `packages/*/README.md`, `plugins/*/README.md` (doc files only) |
| G3-4 | Diátaxis **concepts/tutorials/how-to** conceptual pages, cross-linked (IA) | `docs/site/{tutorials,how-to,explanation}/*` |
| G3-5 | **doc-freshness** fitness gate wired (E1) | `.llm/tools/check-doc-freshness.ts` (or reuse), `deno.json` task, gate doc |
| G3-6 | Links/anchors valid in built `_site` (build + link-check) | link-check over `_site` |
| G3-FUI | **fresh-ui** `deno doc --lint` 0: export the 7 `*Namespace` types (A1 last unit) — **WSL Codex source slice**, SCOPE-frontend | `packages/fresh-ui/src/runtime/{accordion,dialog,drawer,popover,sheet,tabs,tooltip}/*.tsx` |
| G3-DEPLOY | Pages CI deploy (A3) — **user-gated**: `.github/workflows/*.yml` push needs a `workflow`-scoped token | `.github/workflows/pages.yml` |

**Lane split:** G3-0..G3-6 = Claude doc-authoring workflow (this supervisor drives git/gates/IMPL-EVAL). G3-FUI = WSL Codex daemon-attached (framework code). G3-DEPLOY = user-provided `workflow`-scoped token. G3-FUI and G3-DEPLOY do not block the G3-0..G3-6 doc bulk or its IMPL-EVAL; fresh-ui's A1 gate stays RED (recorded debt) until G3-FUI lands.

## Dependencies

- **Blocks on:** Groups 1 (`prod-readiness`) + 2 (`deps-hygiene`) merged before IMPL.
- Research grounding: `.llm/tmp/docs/docs-architecture-research.md`.
- Pages workflow YAML needs a workflow-scoped token (user-provided; supervisor triggers the ask).
- `deno doc` documentation (rendering/lint gotchas) lands in Group 4 (internal) — cross-link.

## Drift Watch

- `deno doc --lint` debt exceeding a doc-only fix (→ generator slice or debt).
- Pages subpath/location issues at build.
- Scope creep into internal/contributor docs (Group 4) or into API changes.
