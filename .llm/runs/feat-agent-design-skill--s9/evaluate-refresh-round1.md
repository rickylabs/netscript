# Refresh IMPL-EVAL round 1 — 2026-11-01

Separate read-only Anthropic Claude session; requested and observed model
`claude-opus-5-5`, requested high effort. Candidate tree, before sign-off.

**Verdict: FAIL_FIX**

I reviewed the diff against `origin/main` 6a1d84a6e and the live candidate tree. Almost everything in the assignment checks out. One correctness defect blocks the pass, and the run records need updating.

### Blocker 1: the "Installed pair" links don't resolve in a `netscript init` project

`netscript-design` links each preset's pair as `../fresh-ui-theme-<id>/DESIGN.md|SKILL.md`, under the column heading "Installed pair (relative to this skill in the Fresh app)". In the standard scaffold the skill and the pairs are installed in different folders:
- **Where the skill goes:** `netscript init` runs agent init at the workspace root, so the skill lands in `<workspace>/.agents/skills/netscript-design/` (`packages/cli/src/public/features/init/run-init-command.ts:145-151`).
- **Where the pairs go:** both the default theme and any `init --preset` are installed into `apps/<app>/` (`packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts:213-218` and `packages/cli/src/kernel/application/ui/v2/presets/apply-init-preset.ts:34-41`). `ui:apply --app` writes there too, so pairs end up in `apps/<app>/.agents/skills/fresh-ui-theme-<id>/`.
- **Result:** all 48 relative links point to `<workspace>/.agents/skills/fresh-ui-theme-<id>/`, which nothing ever creates. The heading also wrongly says the skill sits "in the Fresh app". This defeats the "link installed pairs" requirement in the default layout. The links only work if the user runs `agent init` from inside the app folder.
- **Why tests pass:** the S9 test only checks the `../fresh-ui-theme-` text and that those folders are *absent* in the agent-init root (`packages/cli/src/public/features/agent/init/init-agent_test.ts:686-695`). It never checks that a link resolves.
- **Where to fix:** `.llm/tools/docs/generate-design-skill.ts:86` and `:119-121`. Possible repair:
  - Show the installed location as app-relative text: `fresh-ui-theme-<id>` under `apps/<app>/.agents/skills/` in a scaffolded workspace, or `.agents/skills/` in a standalone Fresh app. Don't use links relative to the shared skill.
  - Keep the published source links.
  - Regenerate the skill and the carriers in order.
  - Update the generator test (`.llm/tools/docs/generate-design-skill_test.ts:283-288`) and the init test. Ideally, also assert the named location against a real scaffold, e.g. that `apps/<app>/.agents/skills/fresh-ui-theme-studio-utility/DESIGN.md` exists after `init`.

### Blocker 2: run records don't describe the refresh
- `.llm/runs/feat-agent-design-skill--s9/context-pack.md` still describes the earlier state (main 49eeb9f, "next ready PR2456"). It doesn't mention the 6a1d84a6e merge, the current candidate, or runtime UNPROVEN.
- `.llm/runs/feat-agent-design-skill--s9/worklog.md` has the refresh design but no record of the candidate's evidence: 120/0/0 tests, scoped wrappers, 15/15 root checks, generator order, the `--allow-dirty` corpus step, and runtime UNPROVEN (Docker daemon inaccessible, Aspire doctor nonzero). Add these in repo-relative form with the repair.

### What checks out
- **24 presets:** the 24 `registry:theme` items that have `meta.preset` each map to the same DESIGN/SKILL source the registry declares (`packages/fresh-ui/registry.json`):
  - `ns-one` and all `studio-*` use `themes/studio`.
  - The other 10 languages use `themes/<id>`.
  - The 6 token-only presets use `token-presets/<id>`.
  - `theme-seed`, `theme-previews` and `theme-toggle` are correctly left out.
  - The generator fails if a link is missing or doesn't match the expected pattern.
- **11 complete theme languages:** listed in catalogue order with `_template` excluded; `check:design-skill` reports 11 themes and 24 presets.
- **No duplicated per-theme docs:** only two files are written. A test proves no theme document body is copied in.
- **Guideline snapshot:** written byte-for-byte from the canonical file, with its SHA-256 in the header. The installed copy equals the canonical bytes for all three hosts (init test). `--check` is read-only and fails before writing anything (negative-control tests).
- **Guard order:** `check:assets-barrel` runs `check:design-skill` (read-only) before any regeneration. `gen:assets-barrel` runs `gen:design-skill` first.
- **Installer:** `netscript-design` is discoverable through the manifest, the router row, the AGENTS template and the Claude repo-skill bridge. It is idempotent on a second run for claude, vscode and opencode, and existing host tests are kept.
- **Current operations routing:** the skill sends readers to `web-layer/how-to/theme-your-app` and the local pair, and says the provisional notes in GUIDELINES are historical. Its claims match `docs/site/web-layer/how-to/theme-your-app.md`: Studio Utility default, `ui:apply --preset`, `--app`, `init --preset`, `tokens.config.json`, the override file being kept, and the `ui:add theme-<id>` caveat.
- **Evidence:** all 15 root `check:*` tasks from `deno.json` exited 0. Agent tests are 120/0/0. The PR body has `Refs #2431` with no closing keyword and no absolute paths.
- **Runtime:** `scaffold.runtime` is UNPROVEN, not passed and not an authorized skip; I accept it as UNPROVEN under the operator override.

After the repair, final-head freshness checks need to be rerun as planned. I'm ready to re-review in this same session.
