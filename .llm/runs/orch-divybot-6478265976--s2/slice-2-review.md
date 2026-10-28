# Slice 2 review

**PASS**

I found no blocking issues in slice 2. What I checked:

- **Pure builder** (`packages/fresh-ui/src/registry/build-registry.ts`):
  - It validates the root registry and every included chunk against the pinned schema, which lets included chunks omit `name` and `homepage`.
  - Include paths resolve from the including file's directory, with cycle detection and de-duplication.
  - It re-validates the merged item list, so a name duplicated across chunks is rejected.
  - Every `files[].path` goes through `assertRegistrySourcePath`, which rejects absolute paths, `..`, empty segments, `\`, `:` and NUL.
  - All source reads finish before any artifact is produced. Items are sorted by name and the `registry` item name is reserved. The test confirms each embedded `content` exactly matches the source file and that a rebuild is identical.
- **Preflight before writes** (`packages/cli/src/kernel/application/ui/build/build-ui-registry.ts`):
  - It checks that the registry file is inside the source root, then builds everything (each source read checked both by path and through symlinks), then checks every output path. Writes only start after all of that.
  - `build-ui-command_test.ts` shows a missing source leaves the filesystem unchanged.
- **Symlink containment** (`packages/cli/src/kernel/adapters/ui/deno-ui-registry-paths.ts`):
  - It resolves real paths through existing links and walks up the parent directories for paths that don't exist yet. Dangling links are rejected.
  - `deno-ui-registry-paths_test.ts` covers a linked source file, a linked output directory, a dangling link and the accepted case of a new file inside the root.
- **Wiring:**
  - `ui:build` is registered in `packages/cli/src/public/features/root/public-command-tree.ts`, with `DenoUiRegistryPaths` provided in `public-command-dependencies.ts`.
  - The new `build:registry` step in `docs/site/deno.json` builds the repo's registry into `_site/r` as part of `deno task build`, which `.github/workflows/pages.yml` already runs. 87 artifacts (86 items plus the catalog) matches the reported real CLI run.
- **Reference docs:** `docs/site/reference/fresh-ui/index.md` lists `buildRegistry` / `RegistryBuildInput` and `freshUiRegistryJson`, matching what `packages/fresh-ui/registry-v2.ts` exports.

I didn't run any commands myself, so I'm relying on the reported results for the test, check/lint/fmt and real-CLI runs.
