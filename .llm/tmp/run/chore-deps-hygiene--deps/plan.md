# Plan: chore/deps-hygiene (dependency-shape tooling + task hygiene)

> **DRAFT** — pending research (catalog-resolution confirm + dep census) + PLAN-EVAL (separate session).

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `chore-deps-hygiene--deps` |
| Branch | `chore/deps-hygiene` (off `release/jsr-readiness`) |
| Phase | `plan` (draft) |
| Target | `deno.json` task/dep hygiene + dependency-shape **scanners** |
| Archetype | A6-adjacent (cli-tooling) for the scanner scripts; otherwise repo tooling |
| Scope overlays | none |

## Archetype

The scanners + the bump wrapper are **repo tooling** (Deno scripts under `.llm/tools/deps/`),
closest to the cli-tooling archetype: structured stdout, explicit exit codes, no hidden side
effects, `--json` output, testable pure cores. They are NOT publishable units.

## Goal

Ship the dependency-shape **enforcement tooling** the catalog law needs and tidy `deno.json`
tasks — **without restructuring the catalog**. The catalog shape is correct and locked (Option-A);
the gap is that nothing *enforces* it and JSR-version centralization is impossible via Deno config.
Close that with scanners wired into CI + `arch:check`, plus task prune and a `deno bump-version`
wrapper.

## Scope (5 deliverables, from handover §3.2)

1. **JSR-dep centralization scanner** — parse all workspace members; for each `jsr:` specifier used
   by >1 member, FAIL if versions diverge. Structured JSON report. Wired into CI + `arch:check`.
2. **npm catalog-compliance scanner** — any `npm:` dep used by >1 member (or not uniquely owned by
   one member) MUST be a `catalog:` reference, not an inline pin. FAIL on violation. Wired in.
3. **`file:`/`link:` audit** — FAIL if any publishable unit ships a `file:`/`link:` specifier (JSR
   cannot resolve them; `deno publish` rewrites siblings). Report offenders.
4. **`deno task` prune** — remove dead/duplicate tasks across root + member `deno.json`; verify no
   task is referenced by another task / CI / e2e before removal.
5. **`deno bump-version` wrapper** — thin wrapper over native Conventional-Commit-derived
   `deno bump-version`; **replace** the bespoke bump tool; preserve structured output.

## Non-Scope (LOCKED — never)

- Catalog restructuring / de-cataloging / moving JSR deps into a (non-existent) catalog.
- Editing version pins / `scaffold-versions.ts`.
- Any release-time `deno.json` transform.
- Bumping/upgrading actual dependency versions (this is hygiene + tooling, not an upgrade run).
- Adopting `file:`/`link:` (the audit FORBIDS them; it does not introduce them).

## Hidden Scope

- A `jsr:` dep may legitimately differ in version across members mid-migration — the scanner must
  distinguish "divergent and should converge" from "intentionally pinned"; needs an allow-list or
  a clear FAIL-and-fix policy (resolve in Design).
- `arch:check` integration: must match the existing `deno task arch:check` harness contract
  (exit codes, report format) — read it before wiring.
- Task prune must not drop tasks referenced indirectly (CI workflow, `e2e:cli`, other tasks,
  `.llm/tools/*` callers).
- The bespoke bump tool may be referenced by release docs/CI — update references when replacing it.

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| DH-1 | **Catalog law stays:** npm via `catalog:`, JSR inline `jsr:` per member. Never de-catalog. | Only shape Deno supports (PR #32947). Supervisor LD-A. |
| DH-2 | JSR-version centralization is a **scanner gate**, not a config change. | Deno has no JSR catalog / no publish-time map tree-shaking. LD-B. |
| DH-3 | Scanners FAIL the build on violation (CI + `arch:check`), not warn-only. | Durable enforcement (scorecard E2). |
| DH-4 | `deno bump-version` wrapper **replaces** the bespoke tool; keeps structured output. | Wrap-don't-reinvent (AGENTS.md rule 3). |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| Confirm member `catalog:` refs resolve on Deno 2.8.3 before touching anything | **must resolve now** | Handover early-check; gates the whole run. |
| Scanner home (`.llm/tools/deps/` vs `tools/`) + exact `arch:check` integration contract | must resolve now | Determines wiring; PLAN-EVAL will check. |
| Divergent-JSR-version policy (hard FAIL vs allow-list) | must resolve now | Affects scanner semantics + the slice list. |
| Whether `deps:*` wrappers already cover part of this (`deps:latest|outdated|why|audit|prod-install`) | safe to defer | Inventory in research; reuse, don't duplicate. |

## Risk Register

| Risk | Mitigation |
|------|------------|
| Scanner false-positives block CI on legitimate cases | Allow-list + dry-run report before enabling FAIL; land scanner in report-only, flip to FAIL in a later slice. |
| Pruning a task that something depends on | Grep all task references (CI/e2e/other tasks) before removal; `e2e:cli` at merge-readiness. |
| bump-version wrapper changes release behavior | Snapshot current bump output; assert wrapper parity in a test. |
| Touching `deno.json` accidentally perturbs catalog/pins | Scope edits to tasks only; diff-review every `deno.json` hunk. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| Unenforced catalog/JSR-version invariants | existing | resolve (scanners + gate) |
| Bespoke bump tool vs native `deno bump-version` | existing | resolve (wrap native) |
| Dead/duplicate `deno task`s | existing | resolve (prune) |

## Fitness Gates

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| New scanners pass on current tree (report-only) then FAIL-on-violation | yes | scanner `--json` output + CI run |
| `arch:check` integrates scanners, not regressed | yes | `deno task arch:check` |
| publish:dry-run (27, 0 slow types) unaffected | yes | `.llm/tools/run-publish-dry-run.ts` |
| check/test/lint/fmt (source TS) | yes | scoped wrappers |
| bump-version wrapper parity test | yes | wrapper test green |

## Arch-Debt Implications

| Entry | Action | Notes |
|-------|--------|-------|
| `.llm/harness/debt/arch-debt.md` | add/close | If divergent JSR versions are found but deferred, record as debt with the convergence target. |

## Validation Plan

| Order | Gate | Command/check | Expected |
|-------|------|---------------|----------|
| 0 | catalog resolves | `deno task deps:prod-install` / member resolve check on 2.8.3 | `catalog:` refs resolve |
| 1 | scanners | `deno run … deps/scan-jsr-centralization.ts --json` etc. | clean (or known allow-list) |
| 2 | arch | `deno task arch:check` | passes incl. new scanner gate |
| 3 | publishability | `deno task publish:dry-run` | 27 units, 0 slow types |
| 4 | check/test | scoped `run-deno-check.ts` + `deno task test` | green |
| 5 | bump parity | wrapper test | matches native output |

## Dependencies

- Branches off the umbrella; runs in parallel with `chore/prod-readiness`.
- Prerequisite for **docs IMPL** (docs document the hygienic dependency surface + new tooling).
- Uses existing `.llm/tools/deps/` wrappers + `deno-toolchain` skill knowledge.

## Drift Watch

- Any pressure to "fix" a divergence by de-cataloging or editing a pin → STOP (violates DH-1/LD-A).
- Catalog failing to resolve on 2.8.3 (would be architectural — escalate, do not work around).
- Scanner scope creeping into a dependency-upgrade run.
