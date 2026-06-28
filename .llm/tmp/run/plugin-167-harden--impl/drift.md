# Drift

- 2026-06-28 S1: implemented Decision 2 with a shared exported protocol helper
  `stripPluginManifestSchemaKey()` and used it at both CLI call sites
  (`fetch-jsr-plugin-validator.ts` and local-path `add-plugin.ts`). `parsePluginManifest()` itself
  remains unchanged and `PluginInstallerManifestSchema` remains `.strict()`, matching the passed
  plan plus evaluator watcher recommendation (b).
