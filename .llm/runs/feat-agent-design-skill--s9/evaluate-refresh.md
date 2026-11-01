# S9 refresh IMPL-EVAL — 2026-11-01

Separate read-only Anthropic session, resumed from round 1. Requested command:
`claude -p --model claude-opus-5-5 --effort high`; observed model usage reports
`claude-opus-5-5`. Tools restricted to Read/Grep/Glob; no mutation tools or MCP.
Implementation vendor family: OpenAI. Scope: current source tree versus main
`6a1d84a6e04c0d39df3926528e0380e267316aee`, before supervisor sign-off.

**Verdict: PASS**

I re-read the live files and the round-2 diff against `origin/main` 6a1d84a6e. Both round-1 blockers are fixed and I found no new ones.

### Blocker 1 (the `../fresh-ui-theme-<id>/` links) is fixed
- **Generator:** each preset row now shows the exact registry target path, `.agents/skills/fresh-ui-theme-<id>/{DESIGN,SKILL}.md`, as code text instead of a sibling link (`.llm/tools/docs/generate-design-skill.ts:80`, `:117`). The surrounding text explains the two layouts:
  - in a scaffolded workspace, select `apps/<app>/` first;
  - in a standalone Fresh app, resolve from its root;
  - never resolve these paths relative to the shared SKILL.md (`:106-109`).
  
  The published source links are kept (`:81`).
- **Generated skill and carrier:** `skills/netscript-design/SKILL.md` has the new text and no sibling links, and the change has reached `packages/cli/src/kernel/assets/skills.generated.ts`.
- **Tests:**
  - The generator test rejects `](../fresh-ui-theme-` and checks both layout instructions (`.llm/tools/docs/generate-design-skill_test.ts:288-299`).
  - The three-host init test checks the app-relative paths for all 24 registry presets (`packages/cli/src/public/features/agent/init/init-agent_test.ts:466-473`).
  - The new integration test runs a real `init --preset studio-utility --app-name dashboard`, with real preset preparation, scaffold writers and installer; only process execution and Aspire are stubbed (`packages/cli/src/public/features/init/init-agent-integration_test.ts:36-47`, `:544-567`). It proves:
    - the shared skill is at the workspace root;
    - no theme pair exists at the workspace root;
    - `apps/dashboard/.agents/skills/fresh-ui-theme-studio-utility/` matches `docs/design-system/themes/studio/*` byte for byte.
  - It uses `init --preset` rather than a bare scaffold, which matches main's legacy behaviour of leaving theme docs out of bare scaffolds. No scaffold behaviour changes in this PR.

### Blocker 2 (stale run records) is fixed
- `.llm/runs/feat-agent-design-skill--s9/context-pack.md`, `.llm/runs/feat-agent-design-skill--s9/worklog.md` (sections "Refresh candidate validation" and "Refresh review repair") and `.llm/runs/feat-agent-design-skill--s9/refresh-evidence.json` now record:
  - main 6a1d84a6e and baseline 1b8cfeb80;
  - 121/0/0 tests;
  - all 4 changed TS files checked, linted and formatted with nothing dropped;
  - 15/15 root `check:*` tasks passing;
  - quality, docs-accuracy, preflight, JSR audit and publish dry-run all passing;
  - the `--allow-dirty` corpus step;
  - runtime UNPROVEN, with its exit code and failed gates.
- All paths are repo-relative.

### Round-1 checks still hold
- **Presets:** all 24 are generated from `packages/fresh-ui/registry.json`, with fail-closed validation of the source path and target.
- **Themes:** the 11 complete theme languages are listed and `_template` is excluded.
- **No copied theme docs:** the generator writes only two files.
- **Exact GUIDELINES bytes:** the snapshot's SHA-256 is `9f02cb22…`, matching the source hash in the skill header.
- **Guard order:** `check:assets-barrel` runs `check:design-skill` (read-only) before any regeneration (`deno.json`).
- **Discovery:** the manifest, router row and AGENTS template still route to `netscript-design`.
- **PR body:** `Refs #2431` only, with no closing keyword.

### Limitations, not blockers
- **Runtime:** `scaffold.runtime` remains **UNPROVEN** (the Docker daemon is inaccessible). The operator allows that; it is not a runtime pass and not a policy skip, and the merge record should say so.
- **Before READY:** the final-head freshness checks and quality receipts still need to run after the sign-off commit, as planned.
