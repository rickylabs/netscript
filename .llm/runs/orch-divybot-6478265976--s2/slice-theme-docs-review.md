# Independent theme documentation carrier review

Requested route: `claude -p --model claude-opus-5-5 --effort high`; same evaluator session, read-only, closed stdin, blockers only.

**PASS.** I found no runtime, publish, schema or compatibility blockers in the theme-docs slice. The shell was disabled, so I didn't run any tests; this verdict comes from reading the code.

- **Old scaffold and design-sync are unaffected:** `legacyRegistryManifest` (`packages/fresh-ui/src/registry/legacy-registry.ts:69-72`) leaves the new skill files out of the theme items it hands to the existing scaffold and design-sync. That keeps the 85-item baseline and the theme check against the token generator matching.
- **The embedded copy of the docs:** `.llm/tools/generate-cli-assets-barrel.ts:184-190` embeds every `docs/design-system/themes/...` file that a theme item declares, under `../../docs/...` keys. The file is read from the same root that already resolves the existing `../../` sources. `check:assets-barrel` already diffs `packages/fresh-ui/registry.generated.ts`, so a stale embedded copy is caught.
- **Both lookup paths agree:** the MCP adapter (`packages/mcp/src/infrastructure/fresh-ui-registry-catalog.ts:30-33`) and the new static-build test map paths the same way: `packages/fresh-ui/` is stripped, and anything else gets `../../`. Doc sources therefore resolve from the embedded copy, with no read from the source tree at runtime.
- **Building from a local checkout:** `buildUiRegistry` checks every source path against `--source-root`. Fresh UI's paths are relative to the repository root, so building it requires pointing the source root at the repo root. That was already true for its `packages/fresh-ui/...` paths and matches the approved source-root decision. The doc paths pass `assertRegistrySourcePath`.
- **Tests:** `tests/registry-theme-docs.test.ts` checks that there is one theme item per token preset, keyed on `meta.preset`, so the `theme-seed` alias isn't counted as a preset. It also checks:
  - Each item points at `docs/design-system/themes/<language>/...`, with `ns-one` using `studio`.
  - Each target is `.agents/skills/fresh-ui-theme-<preset-id>/`.
  - The embedded text matches the canonical files byte for byte.
  - A static build from the embedded copy alone gives each theme exactly these two docs.
- **MCP size limit, not a new problem:** viewing a theme through `view_registry_item` returns the structured `tool_result_too_large` error. `registry/theme/tokens.json` is about 52,000 lines, so theme items were already over the 64 KB limit before this slice. The two Markdown files don't change that, and it is the fail-cleanly behaviour already accepted.
