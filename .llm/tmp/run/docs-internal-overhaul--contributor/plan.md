# Plan: docs/internal-overhaul (internal/contributor documentation)

> **PLAN-EVAL CYCLE-1 = FAIL_PLAN → REMEDIATED; RE-SUBMITTING FOR CYCLE 2** (2026-06-18). Cycle-1
> (OpenHands run `27766416302-1`, `plan-eval.md`) PASSED 7/8 Plan-Gate boxes; the single FAIL was
> the missing **commit-slice enumeration**. Fix applied: added the **`## Commit Slices`** section
> (S0–S8, each with what-it-proves + gate + files), aligned to the evaluator's illustrative shape and
> the **LD-DOCS-LANE** decision (Claude-workflow per-domain authoring; OpenHands validates per-domain).
> No locked decision, scope, gate, or risk-register row was changed. All other boxes (IO-2…IO-6,
> boundary, off-limits guardrail) were VERIFIED. No slice begins before a cycle-2 PASS.

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
| IO-5 | **No Diátaxis for internal docs.** Keep the existing **functional/role-based** structure (harness mechanics · architecture doctrine · domain skills · agent surface `AGENTS`/`CLAUDE` · root ops) as a navigable index with one-home-per-concept + cross-links. Diátaxis is the *user* site (Group 3) only. | Internal docs are reference/procedure for contributors, already function-organized; imposing tutorial/explanation quadrants adds churn without value. |
| IO-6 | **Canonical-home rubric:** architecture *decisions* → `docs/architecture/doctrine/`; cross-agent operating rules/entry → `AGENTS.md`; domain procedure → the matching `.agents/skills/<name>`; Claude-only startup → `CLAUDE.md`; run/orchestration mechanics → `.llm/harness/`. Everything else links to the one home; never restate. | Matches CLAUDE.md Supervisor Rules + AGENTS.md Read Order; gives every concept a deterministic home so the exhaustive concept→home map (Design deliverable) is mechanical. |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| Contributor-doc IA (Diátaxis vs lighter) | **RESOLVED** (IO-5) | Functional/role-based index, not Diátaxis. |
| Canonical home per concept | **RESOLVED** (IO-6) | Rubric locked; exhaustive concept→home map is a Design deliverable. |
| Group-1 file-deletion coordination | **RESOLVED** | G1 (merged) deleted only `AGENTS-handoff.md` (relocated into `openhands-handoff` skill). Clean field — consolidation references the skill, not the deleted root file. See research. |
| Scope of `deno doc` doc (harness only vs harness + jsr-audit + standalone) | resolve in Design | Default = harness doc + `jsr-audit` skill section (IO-3). |

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

## Commit Slices

Ordered implementation slices (target < 30). Each names **what it proves**, the **proving gate**
(from the Fitness Gates table), and the **files** it touches. Per **LD-DOCS-LANE** (program
registry; `CLAUDE.md` Workflow Policy docs-authoring exception), authoring slices **S1–S6** are
produced by the **Claude dynamic workflow** — one agent per domain, under the harness SKILL
(`netscript-harness` + `jsr-audit`/`netscript-doctrine`), model routed per slice — and **OpenHands
validates per-domain** (qwen 3.7 max, separate session) before the next slice is considered done.
Gate slices **S0/S7/S8** are mechanical. No slice changes the locked decisions, scope, gate set,
or risk register; no slice edits framework code, deletes doc *files* (Group 1's job), changes
doctrine *decisions*, or hand-edits `.claude/skills/` (regenerate from `.agents/skills/`).

Gate key: **G-surface** = `validate-claude-surface.ts` green · **G-mirror** = `.claude/skills/`
regen-diff clean · **G-links** = internal link/anchor check · **G-doctrine** = doctrine spot-check
(decisions preserved).

| # | Slice | What it proves | Gate | Files (path-level) |
|---|-------|----------------|------|--------------------|
| S0 | Re-baseline sanity | Branch matches umbrella HEAD; run artifacts current | (bootstrap) | — (no file edits) |
| S1 | `deno doc` section — `jsr-audit` skill | npm-dep rendering, JSX/TSX highlighting, npm-without-types workaround, and `deno doc --lint` as the publish bar are all documented (IO-3) | G-surface, G-mirror, G-links | `.agents/skills/jsr-audit/SKILL.md` (add section); regenerate `.claude/skills/jsr-audit/SKILL.md` |
| S2 | `deno doc` section — harness docs | Harness tells contributors to reach for `deno doc <module>` / `deno doc --filter <symbol>` / `deno why` before broad reads (IO-3) | G-links | `.llm/harness/` (README or new `tools-and-commands.md`); link from `workflow/run-loop.md` |
| S3 | Canonical-home duplication map (AGENTS ↔ harness ↔ skills) | Each duplicated rule has exactly one home + cross-links; IO-6 rubric applied (the exhaustive concept→home map) | G-links, G-doctrine | `AGENTS.md`, `.agents/skills/*/SKILL.md` (link-only); regenerate affected `.claude/skills/` mirrors |
| S4 | Doctrine reference tidy-up | `DOCTRINE-REF.md` + doctrine index stay consistent; doctrine **decisions** unchanged (IO-4 boundary) | G-doctrine | `.llm/harness/DOCTRINE-REF.md`, `docs/architecture/doctrine/*.md` (link/index-only) |
| S5 | `.llm/` tooling/agentic architecture doc | One doc explains `.llm/tools/{deps,fitness,agentic}/` + watch/handoff utilities | G-links, G-doctrine | `.llm/tools/README.md` (or new architecture doc) |
| S6 | Root-ops + agent-surface coherence | Root `*.md`, `AGENTS.md`, `CLAUDE.md` cross-refs coherent; no orphans | G-links | root `*.md`, `AGENTS.md`, `CLAUDE.md` (link-only) |
| S7 | Doc-maintenance gate (E1) wired | An internal link / orphan / stale-mirror gate exists in the harness gate set | gate present in `deno.json`/`gates/` | `.llm/harness/gates/*`, `deno.json` task |
| S8 | Final gate sweep | All four Fitness Gates green together | G-surface, G-mirror, G-links, G-doctrine | — (gate-only) |

Each authoring slice (S1–S6) commits + pushes + comments on PR #57, then OpenHands validates that
domain before the next is considered complete. The implementer may re-split a slice for smaller,
more verifiable chunks; each slice must carry at least one Fitness Gate.

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
- **Implementation lane (LD-DOCS-LANE):** authoring via the Claude dynamic workflow (per-domain
  agents under the harness SKILL); validation via OpenHands (qwen 3.7 max, per-domain). No
  framework-source slice in this group (Group 4 is doc-only).

## Drift Watch

- Any consolidation that changes a doctrine decision (→ STOP; that's a doctrine run).
- Hand-edited skill mirrors (→ regenerate).
- File-deletion overlap with Group 1.
