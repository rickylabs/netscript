# Phase Group Registry: jsr-readiness

The group map for the `release/jsr-readiness` umbrella (supervisor run). See
`.llm/harness/workflow/supervisor.md`. One section per **phase group** (= one sub-run:
branch + worktree + nested run + sub-PR + evaluator pass). The umbrella exit gate is
`scorecard.md`.

## Run Metadata

| Field | Value |
|-------|-------|
| Supervisor run ID | `release-jsr-readiness--supervisor` |
| Integration branch | `release/jsr-readiness` (off `main` @ `cc3b8731`) |
| Base branch | `main` |
| Surface | JSR-readiness of the 27 publishable units; exit = `scorecard.md` PASS |
| Exit gate | `scorecard.md` (evaluator-owned, separate session) |
| Roles | Claude supervises · OpenHands evaluates (separate session) · Codex WSL implements (mobile-visible) |

## Status Legend

| Status | Meaning |
|--------|---------|
| `planned` | In the map, not started |
| `active` | Group branch/worktree launched; implementation in progress |
| `evaluating` | Handed to a separate evaluator session |
| `merged` | Evaluator `PASS` (or accepted `FAIL_DEBT`); merged `--no-ff` |
| `blocked` | Waiting on a dependency or a user decision |
| `rescope` | Under rescope (see `escalations/`) |

## Sequencing (handover §3)

```
chore/prod-readiness  ┐
chore/deps-hygiene    ├─ run in parallel (independent surfaces)
docs/* RESEARCH+PLAN  ┘
        │
        ▼  (cleanup + hygiene MERGED — docs document the clean, hygienic surface)
docs/user-site IMPL · docs/internal-overhaul IMPL
        │
        ▼
scorecard PASS (evaluator) ──► publish prep: E (26 non-CLI OIDC) ──► F (@netscript/cli last, LD-7)
```

Forced order: **docs IMPL** does not start until `chore/prod-readiness` **and**
`chore/deps-hygiene` are `merged`. The two docs sub-runs may run Research+Plan in
parallel with cleanup/hygiene. All four sub-runs branch off the umbrella and PR into it.

## Group 1 — chore/prod-readiness (repo cleanup)

| Field | Value |
|-------|-------|
| Group branch | `chore/prod-readiness` (off `release/jsr-readiness`) |
| Nested run ID | `chore-prod-readiness--cleanup` |
| Surface | Repo-wide, incl. root: dead code, ALL backward-compat shims, temp/garbage/build cruft, stray root files |
| Archetype | N/A — cross-cutting repo hygiene (no public-API archetype). Touches many surfaces; adds/removes no API |
| Scope overlay | partial `SCOPE-docs.md` (deletes dead doc *files*; does **not** rewrite doc *content*) |
| Status | `planned` |

### Pre-conditions
- Umbrella branch current with `main`.

### Deliverables
- Zero dead/temp/garbage/build cruft; all compat shims/aliases removed; dead doc files deleted; stray root files removed (e.g. `agents-handover.md`).

### Success criteria
- Scorecard **C1**. `publish:dry-run` 0 slow types (27) still green; `check`/`test`/`lint`/`fmt` green; `arch:check` not regressed; `e2e:cli` at merge-readiness.

### Notes
- Off-limits: `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, catalog/`catalog:` (LD-7/LD-8 + Option-A law). Deletes only — **no new aliases**. Removing a shim requires a consumer scan first.

## Group 2 — chore/deps-hygiene (dependency tooling)

| Field | Value |
|-------|-------|
| Group branch | `chore/deps-hygiene` (off `release/jsr-readiness`) |
| Nested run ID | `chore-deps-hygiene--deps` |
| Surface | `deno.json` task/dep hygiene + dependency-shape **tooling** (scanners). Ships tooling; does **NOT** restructure the catalog |
| Archetype | A6-adjacent for the scanner scripts (cli-tooling); otherwise N/A repo tooling |
| Scope overlay | none |
| Status | `planned` |

### Deliverables
1. **JSR-dep centralization scanner** — flags any `jsr:` dep used by >1 member with divergent versions; structured JSON; wired into CI + `arch:check`.
2. **npm catalog-compliance scanner** — any `npm:` dep used by >1 member, or not bound to a single member, MUST be a `catalog:` ref (not inline pin); fails on violation; wired in.
3. **`file:`/`link:` audit** — fail if any publishable unit ships one. Do NOT adopt them.
4. **`deno task` prune** — drop dead/dup tasks; `--filter` by dir; `set -e` where needed.
5. **`deno bump-version` wrapper** — replace the bespoke bump tool with a thin wrapper over native Conventional-Commit-derived `deno bump-version`; keep structured output.

### Success criteria
- Scorecard **D1–D5 + E2**. Early check: confirm member `catalog:` refs resolve on Deno 2.8.3 before touching anything. `publish:dry-run` still green.

### Notes
- Off-limits (NEVER): catalog restructuring / de-cataloging; version pins; `scaffold-versions.ts`. Catalog law: npm via `catalog:`, JSR inline `jsr:` per member. No release-time `deno.json` transform.

## Group 3 — docs/user-site (external/user docs)

| Field | Value |
|-------|-------|
| Group branch | `docs/user-site` (off `release/jsr-readiness`) |
| Nested run ID | `docs-user-site--diataxis` |
| Surface | External user docs: per-package reference (`deno doc` + standardized README, `deno doc --lint` clean) + conceptual onboarding; Lume → GitHub Pages |
| Archetype | N/A — docs (touches every unit's doc/README surface) |
| Scope overlay | `SCOPE-docs.md` |
| Status | `planned` (Research+Plan may run in parallel with Groups 1/2; **IMPL gated on 1+2 merged**) |

### Deliverables
- Diátaxis-structured site (tutorial + how-to + reference + explanation); per-package reference generated from `deno doc`; standardized READMEs; Lume site + GitHub Pages CI.

### Success criteria
- Scorecard **A1–A3 + E1**. `deno doc --lint` 0 (full-export) per unit; READMEs to standard; Lume build + Pages deploy green; doc-freshness gate wired.

### Notes
- Research grounding: `.llm/tmp/docs/docs-architecture-research.md` (Diátaxis, Lume→Pages, Laravel/TanStack/Medusa). Pages subpath (`rickylabs.github.io/netscript`) likely needs Lume `location` config — OQ. Pages workflow file needs a local-git push (PAT lacks `workflow` scope).

## Group 4 — docs/internal-overhaul (contributor docs)

| Field | Value |
|-------|-------|
| Group branch | `docs/internal-overhaul` (off `release/jsr-readiness`) |
| Nested run ID | `docs-internal-overhaul--contributor` |
| Surface | Internal/contributor docs: harness, doctrine, `.llm/` architecture, `AGENTS.md`/`CLAUDE.md` surface, root ops docs; document `deno doc` in harness + `jsr-audit` skills |
| Archetype | N/A — docs/internal |
| Scope overlay | `SCOPE-docs.md` |
| Status | `planned` (Research+Plan may run in parallel; **IMPL gated on 1+2 merged**) |

### Deliverables
- Consolidated, de-duplicated, prod-ready internal docs; `deno doc` documented (npm rendering, JSX/TSX highlighting, npm-without-types fixes) in the harness + `jsr-audit` skills.

### Success criteria
- Scorecard **F1 + E1**. `validate-claude-surface.ts` green; no broken internal cross-refs; harness doc-maintenance gate wired.

### Notes
- Keep `.claude/skills/` **generated** from `.agents/skills/` — do not hand-edit mirrored files. Run `.llm/tools/agentic/validate-claude-surface.ts` after edits.

## Open umbrella-level items

- **GitHub access gap (BLOCKER for PR/comment/trigger/merge machinery):** `gh` not installed; no GitHub MCP connected to this session (it is enabled only in Zed, a separate scope). Recorded in `drift.md`. Needs a user decision before any sub-PR / OpenHands PR-comment trigger / merge can happen.
- Sub-branches/worktrees + draft sub-PRs are created at **group-launch time**, not at bootstrap (no generator launched yet — handover §5.5).
