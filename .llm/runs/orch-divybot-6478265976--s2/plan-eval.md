# PLAN-EVAL round 2

**PASS**

The new "PLAN-EVAL repair — locked" and "Local build source-root decision" sections resolve all four blockers. I checked each fix against the current source:

1. **Preset and token reuse:** Resolved. The preset payload now holds only ids and item references. The chosen preset is written to `tokens.config.json` using its existing strict v1 schema, and its source root and override settings are kept. `buildAppTokens` still compiles once. A filtering filesystem layer only decides which outputs get written, which works because the function writes through the injected file system (`packages/cli/src/kernel/application/tokens/build-app-tokens.ts:55`). Planned tests check that a later `tokens build` keeps the applied preset and that `--only theme` leaves the font file unchanged.
2. **Lock rules for managed files:** Resolved. `assets/styles.css` stays with the existing aggregator writer and is never hashed as an app-owned copy. The five files in `APP_TOKEN_FILES` are marked as managed token outputs and are left out of component conflict checks. Edits to component copies and installed theme docs stay protected.
3. **`ui:remove` and the lock:** Resolved. Removing an item now prunes the lock (slice 4). Installed state comes from the lock for v2 apps and from file existence for legacy apps. An unnamed update with an empty lock does nothing, so removed items aren't reinstalled.
4. **Theme docs:** Resolved.
   - The doc carrier is `.llm/tools/generate-cli-assets-barrel.ts`. It already produces `FRESH_UI_REGISTRY_CONTENT` (`renderFreshUiRegistryContent`, `:178`) and runs with full read permission (the `gen:assets-barrel` task in `deno.json`), so it can read `docs/design-system/themes/**`.
   - The existing `check:assets-barrel` task and a new exact-bytes test keep the carrier fresh.
   - Skill folders are named by preset id. `ns-one` and the `studio-*` presets map to the `studio` doc folder; every other preset maps to its own language folder, and each of those folders exists. This matches `packages/fresh-ui/src/tokens/domain/token-presets.ts:39`.
   - Arbitrary publisher roots stay contained, so the traversal ban still holds.
