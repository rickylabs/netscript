# Wave 6 CLI research — context pack (read order)

Read only what the current implementation/evaluation phase needs. Research and plan are complete;
Slice 4a landed after Slices 0, 1, 2, 3, and 5.

## 1. Harness + activation
- `.agents/skills/netscript-harness/SKILL.md`
- `.llm/harness/workflow/{activation,run-loop}.md`
- `.llm/harness/gates/archetype-gate-matrix.md` (archetype **A6 — cli-tooling**)
- `.llm/harness/debt/arch-debt.md` → entry **`packages/cli` AP-1 / doctrine verdict Restructure**

## 2. Doctrine (structure + standards authority)
- `.claude/skills/netscript-doctrine/SKILL.md`
- Doctrine 05 (folder structure: canonical role folders, forbidden names, ≤12/dir, ≤4 depth, ≤500 LOC)
- Doctrine 06 (archetype map)
- `docs/architecture/{STANDARDS,PUBLIC-SURFACE-PATTERNS,DOCS-STRUCTURE}.md`

## 3. CLI-specific
- `netscript-cli` skill (read BEFORE diagnosing scaffold/db/CLI behavior; compare generated
  apps to CLI kernel templates)
- `packages/cli/` — `src/{kernel,local,maintainer,public}/`, `bin/`, `e2e/`, `docs/`, `README.md`
- Canonical per-package authority (nest, do NOT rewrite): `.llm/tmp/run/
  copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/{evaluate_cli.md,plan_cli.md}`
  + nested PLAN §6 (CLI quality bar) and §9 (the `deno publish --dry-run` false positive)

## 4. Aspire 13.4 deployment (area D — seams + prior research only)
- `.llm/tmp/run/master--public-release-program/notes/ASPIRE-13.4-13.5.md` (repo notes — read FIRST)
- `packages/aspire/` (NetScript's Aspire wrapper: `config.ts`, `constants.ts`, `docs/`)
- `.agents/skills/aspire/SKILL.md`
- Aspire MCP (`list_docs`/`search_docs`/`get_doc`) for 13.4 publisher/deployer features
- CI baseline: `.github/workflows/copilot-setup-steps.yml` (Aspire CLI via `aspire.dev` install script)

## 5. Supervisor context (where this wave sits)
- `.llm/tmp/run/feat-package-quality--supervisor/phase-registry.md` → "Wave 6 — Tooling" +
  "Wave 5 CLOSEOUT" (the just-finished pattern to mirror)

## Notes
- Deno baseline in CI is floating `v2.x` (separate upgrade track handles Deno 2.8.x explicitly).
- Wrap-don't-reinvent: prefer Aspire/Deno/`@std/*`/upstream APIs over local abstractions.
- The CLI is the docs-site source of truth for S5; structure decisions should anticipate that.

---

## Plan-phase addendum (read for PLAN-EVAL)

Definitive plan deliverables now in this dir:
- `plan.md` — 7-slice A6-v1→A6-v2 promotion, 8 locked decisions, slice table (<30), risk register,
  A6 gate set (F-CLI-3/4/27), validation plan. Closes AP-1.
- `worklog.md` (§Design), `drift.md` (W-1..W-5), `plan-eval.md` (evaluator skeleton).

Cross-program dependencies (PR #44 upgrade run):
- Consumes Phase T `catalog:` baseline (slice 0) + aspire-barrel fix (T0).
- Consumes Phase A Aspire 13.4 GA pins (slice 5).
- Consumes Phase P published alpha.0 fixture (slice 4 `scaffold.published.runtime`).

Ownership boundary (LD-8, amended by D-W6-1): #44/R6 already performed the apphost-path migration,
so this wave verifies the inherited `apphost.mts` / `.aspire/modules/*.mts` shape and does not edit
`scaffold-files.ts`, `scaffold-aspire.ts`, `scaffold-versions.ts`, or CI/toolchain pins.
`@netscript/cli` is NOT published in Phase P — it ships last (LD-7).

## Implementation resume point

- Latest landed slice before Slice 6: `43e8ea4` (`Slice 4a: finish local CLI scaffold improvements`)
  plus `5f234b0` harness bookkeeping.
- Slice 4a delivered rows 4.1-4.6 only: init orchestrator/pipeline split, in-memory scaffolder,
  `init --json`, empty `init --from` preset registry, generic `PipelineContext`, and
  `docs/commands/init.md`.
- Load-bearing local runtime gate stayed green: `scaffold.runtime` `passed=41 failed=0`,
  `database.init` PASS, `E2E_EXIT=0`.
- Full Slice 4a sweep also passed: `deno task check` 1,597 files/0 findings, `deno task lint`
  1,082 files/0 findings, `deno task fmt:check` 1,167 files/0 findings, `deno task test`
  650 passed/0 failed/12 ignored, and `deno task publish:dry-run` exit 0 with existing non-CLI
  warnings only.
- Slice 4b (`scaffold.published.runtime`) remains deferred to post-S3 and must not be created in
  this run.
- Slice 6 closeout scope: final local `scaffold.runtime` stayed `passed=41 failed=0`; focused
  F-CLI scripts are green; CLI check/doc-lint/publish dry-run are green; broad `arch:check` remains
  red on the known repo-wide baseline (`FAIL=58 WARN=143 INFO=1`) and is not a new CLI blocker.
