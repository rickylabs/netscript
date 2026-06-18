# Plan: docs/internal-overhaul (internal/contributor documentation)

> **DRAFT** — Research+Plan may proceed in parallel with Groups 1/2; **IMPL is gated on
> `chore/prod-readiness` AND `chore/deps-hygiene` merged** (internal docs describe the cleaned
> harness/tooling surface). PLAN-EVAL (separate session) required before any slice.

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `docs-internal-overhaul--contributor` |
| Branch | `docs/internal-overhaul` (off `release/jsr-readiness`) |
| Phase | `plan` (draft) |
| Target | Internal/contributor docs: harness, doctrine, `.llm/`, AGENTS/CLAUDE surface, root ops |
| Archetype | N/A (docs/internal) |
| Scope overlays | `SCOPE-docs.md` |

## Goal

Consolidate and de-duplicate the **internal/contributor** documentation into a coherent, prod-ready
set: harness docs (`.llm/harness/`), architecture doctrine (`docs/architecture/doctrine/`), `.llm/`
tooling/agentic architecture, the `AGENTS.md`/`CLAUDE.md` agent surface, and root operations docs —
and **document `deno doc` properly** in the harness + `jsr-audit` skills. `validate-claude-surface.ts`
must stay green.

## Scope

- **Consolidate/de-dup (F1):** merge overlapping internal docs; one authoritative home per concept;
  fix stale cross-references; remove redundancy (without deleting load-bearing doctrine).
- **`deno doc` documentation:** add a proper `deno doc` section to the harness docs + the
  `jsr-audit` skill — npm-dep rendering, JSX/TSX highlighting, the npm-without-types workaround, and
  `deno doc --lint` usage as the publish-quality bar.
- **Agent surface coherence:** `AGENTS.md` + `CLAUDE.md` + `.agents/skills/` accurate vs reality;
  `.claude/skills/` regenerated from `.agents/skills/` (never hand-edited).
- **Doc-maintenance gate (E1):** a fitness gate that keeps internal docs from drifting (broken
  internal links / orphaned docs / stale skill mirrors).

## Non-Scope

- External/user docs (Group 3 owns the user site, per-package reference, onboarding).
- Deleting dead doc **files** (that is Group 1 `prod-readiness`; this run rewrites/consolidates
  surviving **content**).
- Changing doctrine **decisions** (this is doc hygiene, not a doctrine change run).
- Editing framework code.

## Hidden Scope

- `.claude/skills/` are **generated mirrors** of `.agents/skills/` — edit the source, regenerate,
  never hand-edit the mirror. Run `validate-claude-surface.ts` after.
- De-duplication can accidentally drop a load-bearing nuance — diff carefully; preserve doctrine
  intent.
- Internal cross-references are dense (harness ↔ doctrine ↔ skills ↔ AGENTS) — a consolidation can
  break many links at once.

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| IO-1 | One authoritative home per concept; others link to it (no copy-paste duplication). | De-dup goal; reduces drift. |
| IO-2 | `.claude/skills/` regenerated from `.agents/skills/`; never hand-edited. | CLAUDE.md rule; `validate-claude-surface.ts` enforces. |
| IO-3 | `deno doc` is documented as the canonical internal-API surface tool (+ `--lint` as the publish bar). | AGENTS.md "deno doc is your friend"; supports Group 3 + jsr-audit. |
| IO-4 | Consolidation rewrites **content**; file **deletion** of dead docs is Group 1's job. | Clean role split with `prod-readiness`. |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| Diátaxis (or a lighter contributor-doc IA) for internal docs | must resolve now | Determines the consolidation target structure. |
| Canonical home for each duplicated concept (harness vs doctrine vs skill) | must resolve now | Drives the merge slices. |
| Scope of `deno doc` doc (harness only vs harness + jsr-audit + a standalone reference) | safe to defer | Resolve in Design. |
| Coordination with Group 1 on which doc files are deleted vs consolidated | must resolve now | Avoid both runs touching the same file. |

## Risk Register

| Risk | Mitigation |
|------|------------|
| Consolidation drops load-bearing doctrine nuance | Diff-review; preserve intent; doctrine owner check. |
| Breaking internal cross-references | Link-check internal docs as a gate; fix refs in the same slice. |
| Hand-editing `.claude/skills/` mirror | Edit `.agents/skills/` source + regenerate; `validate-claude-surface.ts` green. |
| Overlap/conflict with Group 1 deletions | Coordinate file ownership at the supervisor level before IMPL. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| Same concept documented in 3 places, drifting | existing | resolve (one home + links). |
| `deno doc` usage undocumented in harness/jsr-audit | existing | resolve (add section). |
| Hand-edited skill mirrors | avoid | regenerate from source. |

## Fitness Gates

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| `validate-claude-surface.ts` green (F1) | yes | `.llm/tools/agentic/validate-claude-surface.ts` |
| internal link/anchor check | yes | link-check over internal docs |
| `.claude/skills/` == regenerated from `.agents/skills/` | yes | regen + diff clean |
| doc-maintenance gate (E1) wired | yes | gate in quality lane |

## Arch-Debt Implications

| Entry | Action | Notes |
|-------|--------|-------|
| `.llm/harness/debt/arch-debt.md` | review | Close debt entries that were really doc-drift; record any deferred consolidation. |

## Validation Plan

| Order | Gate | Command/check | Expected |
|-------|------|---------------|----------|
| 1 | claude surface | `deno run … .llm/tools/agentic/validate-claude-surface.ts` | green |
| 2 | skill mirrors | regenerate `.claude/skills/` from `.agents/skills/`; diff | no unexpected drift |
| 3 | internal links | link-check internal docs | no broken refs |
| 4 | doctrine intact | doctrine spot-check | decisions preserved |

## Dependencies

- **Blocks on:** Groups 1 (`prod-readiness`) + 2 (`deps-hygiene`) merged before IMPL.
- Coordinates with Group 1 on doc-file ownership (delete vs consolidate).
- Feeds Group 3 (the `deno doc` documentation supports the user-site reference generation).

## Drift Watch

- Any consolidation that changes a doctrine decision (→ STOP; that's a doctrine run).
- Hand-edited skill mirrors (→ regenerate).
- File-deletion overlap with Group 1.
