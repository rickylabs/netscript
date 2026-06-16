# Deno 2.8 + Aspire 13.4 upgrade research — context pack (read order)

Read only what the research needs; this is a RESEARCH-ONLY phase.

## 1. Harness + activation
- `.agents/skills/netscript-harness/SKILL.md`
- `.llm/harness/workflow/{activation,run-loop}.md`

## 2. Prior repo notes (READ FIRST — authoritative starting inventory; re-verify)
- `.llm/tmp/run/master--public-release-program/notes/TOOLCHAIN-2.8.md`
  (Deno 2.8 leverage map: bump-version, publish auto-rewrite, deno ci,
  isolatedDeclarations + doc --lint, deno pack, catalog:, deno audit, TS 6.0.3,
  lib.node default, testing upgrades, compile framework detection, OTel)
- `.llm/tmp/run/master--public-release-program/notes/ASPIRE-13.4-13.5.md`
  (Aspire 13.4-now / 13.5-later: current pins, TS apphost GA, dashboard commands,
  `aspire logs/otel --search`, native Deno apphost `microsoft/aspire#16218`)

## 3. Deno 2.8 — live sources (re-verify against the notes)
- `https://deno.com/blog/v2.8` (the blogpost the maintainer named)
- `https://docs.deno.com/runtime/reference/cli/bump_version/`
- `https://docs.deno.com/runtime/fundamentals/workspaces/`
- `https://docs.deno.com/runtime/reference/cli/doc/` (`--lint`)
- `https://jsr.io/docs/about-slow-types` · `https://jsr.io/docs/scoring`
- local pins: root `deno.json`/`deno.jsonc` (workspace members, tasks, lint, imports),
  `deno.lock`, `.github/workflows/` (`setup-deno@v2`, `deno-version: v2.x`)

## 4. Aspire 13.4 — sources + live toolchain
- `https://devblogs.microsoft.com/aspire/whats-new-aspire-13-4/`
- `https://github.com/microsoft/aspire/issues/16218` (milestone 13.5, our request)
- local pins: `dotnet/AppHost/AppHost.csproj`, `dotnet/global.json`,
  `packages/aspire/` wrapper (`config.ts`, `constants.ts`, `types.ts`, `schema.ts`,
  `docs/`), `packages/NetScript.Aspire.Hosting/`
- `.agents/skills/aspire/SKILL.md`
- **Aspire MCP** (`list_docs`/`search_docs`/`get_doc`/`list_integrations`) for the
  live 13.4 feature surface and CommunityToolkit package versions
- CI baseline: `.github/workflows/copilot-setup-steps.yml` (Aspire CLI via
  `aspire.dev` install script; .NET SDK 10; NuGet warm-up)

## 5. Doctrine / standards (only if a recommendation touches structure)
- `.claude/skills/netscript-doctrine/SKILL.md`
- `.llm/harness/gates/archetype-gate-matrix.md`

## 6. Cross-reference — keep consistent, do NOT duplicate
- Wave 6 CLI research (`.llm/tmp/run/feat-package-quality-wave6-cli--research/`)
  owns the CLI's apphost scaffold + `deploy` port + command-registry seam. This
  upgrade research owns the **toolchain version + feature adoption**; reference the
  CLI research for anything about CLI-owned deploy/apphost structure.

## Notes
- No backward compatibility required (greenfield alpha) — legacy may be deleted
  outright in the LATER impl phase; this phase only *lists* what to remove.
- Wrap-don't-reinvent: prefer the new first-party Deno/Aspire features over any
  bespoke local machinery they supersede.
- The repo is at Deno 2.7.11 today; CI floats `v2.x`. Pinning to `2.8.x` is itself
  a decision to record.

---

## Plan-phase addendum (read for PLAN-EVAL)

Definitive plan deliverables now in this dir:
- `plan.md` — Phase T (Deno 2.8) + Phase A (Aspire 13.4 scaffold bump), 9 locked decisions,
  10 commit slices, risk register, validation plan, E-12 preview guard.
- `phase-p-jsr-alpha-publish-plan.md` — the in-between JSR alpha.0 publish milestone (all 28
  members except `@netscript/cli`).
- `drift.md` — discrepancies D-1..D-5 logged.

Files the IMPL phase touches (ownership-scoped):
- Owned here: `.github/workflows/copilot-setup-steps.yml:40-42`, root + 28 member `deno.json`,
  `packages/cli/src/kernel/constants/scaffold-versions.ts`, `packages/aspire/src/public/mod.ts`,
  `.llm/tools/check-scaffold-versions.ts` (new), `arch-debt.md`.
- Owned by Wave 6 (DO NOT edit here): CLI restructure, `scaffold-files.ts`, apphost path migration.

Generated-not-committed (edit the generator/constant, never the output):
`dotnet/AppHost/AppHost.csproj`, `global.json` (via `generate-global-json.ts`, `allowPrerelease:
true`).
