# Research — fix-1014-plugin-schema-dependency-mode--dependency-schema

## Re-baseline

- Carried-in source: issue #1014 prompt and suspected-cause notes.
- Re-derived against `main` @ `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01.
- The stated cause held: `copyPluginSchemasToRootDb()` only walks copied source under
  `plugins/<name>/database` and silently returns `[]` when it is absent; dependency mode creates no
  such source tree and supplies no alternate schema source.
- Clarification: the current plugin-owned adapter scaffolders do not generate Prisma artifacts.
  `InstallSpec.prismaContract` is declared and auth populates it, but repository search found no
  production consumer. The generic placeholder is emitted only by the legacy kernel
  `PluginScaffolder`, which is not the dependency-mode path.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | A direct call with `requiresDb: true` and no copied source returns zero copies and writes no root fragment. | Baseline `deno eval` recorded `{"copies":0,"targetExists":false}`. |
| 2 | Public install invokes `renderPluginSupport()` and then the copied-source-only schema copier. | `packages/cli/src/public/features/plugins/install/install-plugin.ts`; `render-plugin.ts`. |
| 3 | Local install still relies on copied source and local descriptors intentionally have an empty metadata file map. | `install-local-plugin.ts`; `resolveLocalPluginDescriptor()` in `install-plugin.ts`. |
| 4 | The existing injectable `JsrPackageFileFetcher` can retrieve package bytes; URL construction currently lives privately beside integrity verification. | `public/infra/jsr/verify-jsr-package-integrity.ts`. |
| 5 | JSR 0.0.2 metadata has `/database/auth.prisma`, `/database/sagas.prisma`, `/database/triggers.prisma`, and `/database/workers.prisma`; all four manifests declare migrations. AI and streams declare false and publish no Prisma files. | `deno eval` fetch of each `0.0.2_meta.json` manifest and `scaffold.plugin.json`, 2026-08-01. |
| 6 | `versionMetadata.files` normalizes the JSR `manifest` entries into slash-prefixed checksum keys. | `fetch-jsr-plugin-validator.ts` and its tests. |
| 7 | The userland suite expects `plugins/workers/database/schema.prisma`, but current dependency-mode adapter resources do not emit it. This assertion reflects an older/generic-placeholder path and is not proof of the real published worker fragment. | `true-userland-install-suite.ts`; `plugins/workers/src/adapter/plugin.ts`; repository search for schema writers. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `@netscript/cli` public install flow, JSR descriptor metadata, and first-party
  plugin publish includes/file manifests.
- No new export, `deno.json`, or public type is planned. Slow-type risk is therefore unchanged.
- Publish/install risk: runtime file fetches must use the already injectable fetcher, preserve
  slash-prefixed metadata compatibility, and never run during `--dry-run`.
- File-list risk: already-published 0.0.2 packages are the compatibility baseline; no manifest field
  or republish is required.

## Open questions

- None that force implementation rework. The schema declaration signal is locked to
  `manifest.capabilities.hasDatabaseMigrations`, because it exists in 0.0.2 and matches the
  published file set exactly.
