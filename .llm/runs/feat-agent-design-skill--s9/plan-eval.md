**PASS.** I found no blockers.

I checked the plan against the code in this checkout:

- **Guideline reference:** the installer writes every file listed in the skill manifest, nested ones included, under `.agents/skills/` for every host (`init-agent.ts:149-159`). So `netscript-design/references/GUIDELINES.md` installs with no installer change. `GUIDELINES.md` has no relative links, so the exact copy still reads correctly once installed.
- **Hosts and discovery:** the Claude bridge builds its skill-name list from the manifest's `*/SKILL.md` entries (`init-agent.ts:169-200`). The VS Code and OpenCode hosts read `.agents/skills` directly. Adding a routing row to `guidance.md.template` covers what remains, and the old host tests are kept.
- **Theme-pair links:** generating them from complete theme folders (excluding `_template`) matches the docs-site contract (`docs/site/_plugins/design-system.ts:5,203-217`). There are 11 complete pairs today.
- **Drift gate order:** the plan runs a read-only `--check` in front of `check:assets-barrel`. That task currently regenerates first, then runs `git diff` on a list of files that doesn't include `skills/**`. A chained `&&` stops before any regeneration if the check fails. The plan also includes a negative control that changes the source and proves the check fails without repairing it.
- **MCP budget:** the budget covers only the pages listed in `MCP_EMBEDDED_DOC_PATHS`, capped at 294,912 bytes (`generate-publish-assets.ts:39,337-351`). The skill manifest doesn't feed it, so adding the skill adds no MCP pages. Measuring before and after is enough.
- **Scope:** `buildDesignSkill` is an internal tooling export, not package API. There are no dependency, lock or registry-installer changes, and the S2 and token-v2 work stays deferred.

Three non-blocking suggestions for the implementer:

1. **Folder exclusion:** exclude every folder starting with `_` (as the site does), not just `_template`, and follow the catalogue order in section 6, so the two link sets can't drift apart.
2. **Main-branch auto-repair:** once `gen:assets-barrel` also writes `skills/netscript-design/**`, the auto-repair job on main will refuse to commit those files. Its allowlist only takes `*.generated.ts` plus two fixed paths (`publish-carrier-repair.mjs:10-14`). It fails safely by opening a tracked drift issue, but say so in `drift.md`.
3. **Release staging:** the generated skill files are committed source, not entries in `PUBLISH_ASSET_OUTPUTS`. Make sure the PR commits them along with the updated `skills.generated.ts`.
