# Drift: NetScript Ecosystem 0.0.1-alpha.0 JSR Release

Append-only.

## DRIFT-001 — Generator and evaluator share the session (process)

**Date:** 2026-05-04
**Severity:** process
**Source of truth:** `.agents/skills/netscript-harness/SKILL.md` §7 "Evaluator Separation" and
`.llm/harness/workflow/run-loop.md` §4 "Evaluate."

**Standard rule:** The evaluator must be a separate session from the generator.

**Observed reality:** The user explicitly asked for the evaluator pass first **and** the planner
pass to run in the same session ("FOR THIS RUN YOU NEED TO RUN EVALUATOR FIRST AGAINST EACH
PACKAGE ONE BY ONE"). The user is initiating a docs-only multi-target run that scopes 24 packages
+ 5 plugins, so a single-session pass is the only way to deliver the coherent master `PLAN.md`
they requested.

**Mitigation:**

- This run produces both `evaluate_<pkg>.md` (evaluator artifact) and `plan_<pkg>.md`
  (planner artifact) per target.
- Each per-package implementation run that follows must run the evaluator in a separate session
  per the standard harness rule.
- The master `PLAN.md` records this requirement explicitly under "Per-package implementation
  workflow."

## DRIFT-002 — Phase A fitness scripts are not implemented (expected)

**Date:** 2026-05-04
**Severity:** minor
**Source of truth:** `.llm/harness/gates/archetype-gate-matrix.md` §"Phase A Reporting."

**Observed reality:** F-1..F-18 are documented but their `.llm/tools/check-*.ts` scripts do not
all exist yet. Every per-package evaluation reports gates as `PENDING_SCRIPT` with manual
evidence; no `FAIL` is emitted purely for missing scripts.

**Mitigation:** every per-package plan declares the manual evidence path until scripts land.

## DRIFT-003 — Doctrine verdict table is the only authoritative codebase-wide signal

**Date:** 2026-05-04
**Severity:** minor

**Observed reality:** `doctrine/10-codebase-verdict-and-handoff.md` is dated `2026-04-29` and
`arch-debt.md` shows several entries closed `2026-05-01`. Specifically:

- `packages/runtime-config — Refactor` — closed.
- `packages/config — schema.ts 945 LOC` — closed via cli scope (per the closing note, but the
  package is still 1,968 LOC and the README is missing).

**Mitigation:** per-package evaluations read the actual current state (folder list + deno.json
exports + README presence + LOC) and reconcile against file 10 + arch-debt. Any divergence is
called out under "Findings" of that package's evaluation.

## DRIFT-004 — `@netscript/shared` package name mismatch — **CLEARED 2026-05-04 (deeper pass)**

**Date:** 2026-05-04
**Severity:** significant → **resolved**
**Source of truth:** `packages/shared/deno.json` and `packages/shared/mod.ts`.

**Original observation (incorrect):** the prior pass reported `deno.json` declared `@netscript/shared` while `mod.ts` said `@test-app/shared`.

**Corrected reality (verified 2026-05-04 deeper pass via `audit/readiness/jsr/packages__shared.json`):** `packages/shared/deno.json` declares `"name": "@netscript/shared"` and `mod.ts` opens with the matching `@module @netscript/shared` JSDoc block. There is no name mismatch. The earlier finding appears to have been a stale read or confusion with a different sub-package.

**Real outstanding shared-package issues** (now tracked elsewhere):
- 35 slow-types in published surface — see `audit/dry-run/shared.txt` and `evaluate_shared.md` § 4.
- `@module` tag flagged missing on one entrypoint — see `audit/readiness/jsr/packages__shared.json`.
- Forbidden `utils/` folder name — folded into Wave 0 rewrite (`plan_shared.md` § 5).

## DRIFT-005 — `@netscript/contracts` and `@netscript/config` have single-string `exports`

**Date:** 2026-05-04
**Severity:** minor
**Source of truth:** `packages/contracts/deno.json`, `packages/config/deno.json`.

**Observed reality:** both packages declare `exports` as a single string (`"./mod.ts"`) instead
of an object. JSR accepts this, but it removes the subpath surface convention used by every other
package in the workspace and breaks the symmetry the README + docs documents. Recorded as a
finding in each package's evaluation.

## DRIFT-006 — Several packages ship without README

**Date:** 2026-05-04
**Severity:** significant for JSR alpha
**Source of truth:** filesystem walk of `packages/*/README.md`.

**Observed reality:** the following packages have **zero** README at the time of this run:
`config`, `contracts`, `database`, `runtime-config`, `service`, `streams`, `triggers`, `watchers`,
`workers`. JSR doc score and the alpha-quality bar both require an enterprise-grade README.

**Mitigation:** every plan with a missing README has a dedicated "README + docs/" slice as a
prerequisite for the F-7 gate.

## DRIFT-007 — `@shared/utils` import alias

- Severity: significant
- Discovered: planner pass (slice 6, plugin sweep)
- Description: every package using shared imports `@shared/utils` mapped to
  `packages/shared/utils/mod.ts` — but `packages/shared` exposes only a `utils.ts` file (not a
  `utils/` folder). The alias is a local convention that masks the fact that consumers depend on
  internals of the shared package. After Wave 0 decomposition, the alias must be removed and
  consumers must import from the new role-named modules in `@netscript/shared`.
- Resolution: handled in Wave 0 of `PLAN.md` and per-package plans for plugins/sagas, plugins/triggers, plugins/workers.

## DRIFT-008 — Phase A → Phase B transition for fitness scripts

**Date:** 2026-05-04 (deeper pass)
**Severity:** minor
**Source of truth:** `.llm/tools/fitness/`.

**Observed reality:** Until this run, the `.llm/tools/fitness/check-cli-*.ts` scripts were
**CLI-package specific only**. There were no repo-wide doctrine or NetScript-standards
evaluators. DRIFT-002 declared "F-1..F-18 PENDING_SCRIPT" with manual evidence as the workaround.

**Resolution this pass:**
- New: `.llm/tools/fitness/audit-jsr-package.ts` — generic JSR readiness for any package
- New: `.llm/tools/fitness/check-doctrine.ts` — generic doctrine readiness (axioms A1..A14, anti-patterns AP-1/7/9/12/15/19/22/23)
- New: `.llm/tools/fitness/check-netscript-standards.ts` — repo-wide standards (NS-S-1..NS-S-10) per `harmonisation/STANDARDS.md`
- New: `.llm/tools/fitness/release-readiness.ts` — master runner producing unified `_summary.md`
- New: `.llm/tools/fitness/audit-all-packages.ts` — batch JSR audit
- All registered in `.llm/tools/entry.md`

DRIFT-002 is now substantially resolved for non-CLI packages. The CLI-specific gates
(`check-cli-file-size.ts`, `check-cli-isolation.ts`, etc.) remain CLI-only and are correct.

## DRIFT-009 — Plan documents now embed audit data, not just narrative

**Date:** 2026-05-04 (deeper pass)
**Severity:** process

**Observed reality:** the previous pass produced `plan_<pkg>.md` and `evaluate_<pkg>.md`
files that were narrative-only and did not embed concrete `deno publish --dry-run` output,
slow-type counts, JSR audit findings, or readiness JSON paths. The user explicitly called
this out as incomplete.

**Resolution this pass:**
- All 28 `evaluate_<pkg>.md` files were re-authored from scratch (not patched) by
  `.llm/tools/fitness/generate-package-plans.ts` with: real readiness JSON references,
  dry-run output tail, top JSR/doctrine/standards findings, current folder tree, and a
  code-quality verdict computed from the audit data.
- All 28 `plan_<pkg>.md` files were re-authored from scratch with: target folder tree
  (per archetype), target public-surface stubs (per `harmonisation/PUBLIC-SURFACE-PATTERNS.md`),
  test plan (per archetype), slice list (driven from real findings), gate matrix
  (today → target), naming map (current → target), and full cross-references.
- `harmonisation/STANDARDS.md`, `harmonisation/DOCS-STRUCTURE.md`,
  `harmonisation/PUBLIC-SURFACE-PATTERNS.md` are the new normative references every
  plan points to.
