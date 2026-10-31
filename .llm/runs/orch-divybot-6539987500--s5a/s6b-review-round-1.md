**Verdict: FAIL_FIX** (S6b CLI organization review; S6c carriers and final gates are not covered)

The moves, imports and the `SCAFFOLD_DIRS.APPS` change are correct, and no stale imports remain. The new empty-entry cleanup has one gap: it can delete a lock entry that another installed item still depends on. I only read the code.

## Blocker: the cleanup skips S2's dependents check

In `presets/apply-remote-preset.ts`, the new cleanup loop deletes any theme or base lock entry that is left with no files, dependencies or CSS imports. It never checks whether another lock item lists that entry in its `registryDependencies`. S2's own `removeUiRegistry` (`registry-lifecycle.ts:65-70`) refuses exactly this case with "Registry item is still required by …".

With the built-in registry this happens to be safe. The roughly 60 items that depend on `theme-seed` are protected only because `theme-seed` has dependencies of its own (`cn`, `public-types`). The `theme-<preset>` items have no dependents. But a third-party theme or base item with no dependencies of its own, which other items depend on, would be removed while still referenced. A later `ui:update` or `ui:add` could then re-resolve it and collide with files the URL theme now owns.

**Fix:**
1. In the predicate, also require that no other item has `item.registryDependencies.includes(ref)`, the same check `removeUiRegistry` makes.
2. Add a test where a dependent item keeps the emptied theme entry in the lock.

## What I verified

- **The moves.**
  - `apply-preset.ts`, `resolve-preset.ts`, `apply-remote-preset.ts`, `figma-theme-files.ts` and `apply-init-preset.ts` now live in `kernel/application/ui/v2/presets/`.
  - Their internal imports were adjusted correctly: `../` for siblings in `ui/v2`, `../../../../` for `domain` and `constants`, `../../../tokens` for token files, and `./` within `presets/`.
  - All consumers use the new paths: the public `ui:init` and `ui:apply` commands, `run-init-command.ts`, both dependency roots, maintainer orchestration and the tests.
  - Searching for the old `ui/v2/<file>.ts` and `scaffold/apply-init-preset` paths finds nothing outside run records.
- **Folder counts.** `ui/v2` has 11 files plus `presets/` and `tests/`, which is 13. That's the same as the 12 files plus `tests/` before, so it's not worse. `kernel/application/scaffold` is back to its baseline.
- **`apply-init-preset.ts`** resolves `projectRoot / SCAFFOLD_DIRS.APPS / (appName ?? deriveDefaultAppName(name))`.
- **The cleanup itself** runs only on the Figma-config path, after the S2 install and config re-homing, and before the single `plan.commit`. It never touches the new URL entry. Apart from the missing dependents check, the predicate is correct.

## Recommended (don't block S6b)

- **Move `preset-tokens.ts` into `presets/`.** It's a preset helper, and moving it would bring `ui/v2` to 12 entries.
- **Fix three doc issues** in `docs/site/reference/cli/commands.md` (could be done in S6c):
  - The paragraph explaining that built-in preset codes select a context within the installed sources, plus the dry-run and init-failure guidance (lines 588–592), sits at the end of the Aspire/plugins generation section. Move it to the `ui:apply` / `init --preset` section.
  - The `ui:apply --preset <code> --only theme,font` row says "a theme/preset JSON URL is also accepted". With `--only`, only preset-JSON URLs work; registry theme URLs are refused ("URL theme items apply as a whole"). Say so in that row.
  - The init-failure guidance should also say that agent setup was skipped and how to rerun it, because a preset failure throws before `initAgent`.

OPENHANDS_VERDICT: FAIL_FIX
