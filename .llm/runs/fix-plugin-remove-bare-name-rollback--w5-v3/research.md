# Research — plugin remove bare-name dispatch and rollback

## Baseline and issue evidence

- Re-baselined on `origin/main` / `3677973bc` on 2026-08-04.
- Live issue #1236 reports clean-scaffold failures on 0.0.4, 0.0.5-canary.2, and
  0.0.5-canary.6. `netscript plugin remove sagas` exits 1 after removing the entry from
  `netscript.config.ts`; stderr says `installing sagas` and JSR rejects bare `sagas`.
- The public help contract is `plugin remove <name>` / “Remove a configured NetScript plugin.”
  Bare configured name is therefore the supported argument, not user error.

## Current implementation facts

1. `remove-plugin.ts` mutates `appsettings.json`, generated directories, and
   `netscript.config.ts` before dispatching `input.packageName ?? input.pluginName`.
2. `dispatchPluginVerb` treats that value as a package and constructs its JSR CLI target; a bare
   configured name therefore becomes the invalid package identity.
3. Installed `scaffold.plugin.json` contains the validated package name (for example
   `@netscript/plugin-sagas`) and the configured/canonical plugin metadata needed for preflight.
4. The existing remover does not delete the installed plugin directory, database schema fragments,
   or regenerate Aspire/plugin-reference wiring.
5. `.llm/harness/debt/arch-debt.md` already records
   `ISSUE-167-PLUGIN-REMOVE-UNINSTALL`; its closing gate requires a reverse-plan contract and an
   add/remove/re-add lifecycle without orphaned artifacts.
6. `packages/cli` is Archetype 6 (CLI/Tooling), currently under a recorded Restructure verdict.
   This slice must not deepen that debt.

## RED strategy

- Add a public command-tree test that creates a configured plugin fixture, invokes
  `plugin remove sagas`, forces dispatch failure, and proves the current half-removed state.
- Preserve RED evidence against the baseline before adding the implementation fix.

## JSR surface scan

- No `deno.json`, export map, `mod.ts`, dependency, or public library export change is planned.
- The CLI command contract remains `plugin remove <configured-name>`; only its implementation and
  removal-specific error semantics change.
- Slow-type and package-file-list risk is unchanged. Retain `doc:lint`, package JSR audit, and
  publish dry-run as final gates because `packages/cli` is publishable.

## Open questions resolved by the plan

- Package identity comes from explicit `--pkg` or validated installed metadata before mutation.
- Remote/plugin-owned remove dispatch completes before host mutation begins.
- Host mutations execute under a bounded filesystem snapshot journal and roll back on failure.
- Plugin-owned workspace, plugin-specific generated registries, schema fragments, and regenerated
  Aspire/reference wiring are owned cleanup surfaces.
