# Wave 6 CLI research — context pack (read order)

Read only what the research needs; this is a RESEARCH-ONLY phase.

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
