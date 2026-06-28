# Drift

- 2026-06-28 S1: implemented Decision 2 with a shared exported protocol helper
  `stripPluginManifestSchemaKey()` and used it at both CLI call sites
  (`fetch-jsr-plugin-validator.ts` and local-path `add-plugin.ts`). `parsePluginManifest()` itself
  remains unchanged and `PluginInstallerManifestSchema` remains `.strict()`, matching the passed
  plan plus evaluator watcher recommendation (b).
- 2026-06-28 S4: adopted the primary version-coherence path. Plugin scaffold emitters import their
  own `deno.json` version via JSON import, so `release:cut`/`coordinateVersionBump` remains the only
  version source and `.llm/tools/release/cut.ts` was not changed. Full `scaffold.runtime` e2e passed
  48/48 and retained generated artifacts under
  `.llm/tmp/cli-e2e/plugin-smoke-20260628-174019`; those artifacts pin the current branch version
  `0.0.1-alpha.12`. The branch has not been bumped to alpha.13, so the alpha.13 train proof is the
  same single-source mechanism rather than a literal alpha.13 string in this pre-release branch.
