# 2026-10-31 — Local and public consumer proofs

Local init marks a project by packages/cli/deno.json, not a dedicated marker file. That marker suppresses published kind-package aliases. Local plugin-owned userland therefore needs the selected composing plugin's own exports registered as relative local imports. ensureLocalPluginImports performs that reconciliation for every local-path package; public install preserves its exact published alias.

Do not use a maintainer-created local-source project to claim a normal public-init proof: the marker changes import wiring. The regression uses public init for the public CLI branch. It runs init/install/generate/doctor only, never Aspire start or the expensive scaffold.runtime suite.

Root fmt/lint excludes CLI. For scoped source evidence, copy root fmt options to a private config without include/exclude, then pass that config to the structured wrappers. The formatter coverage must show no dropped files.

The workspace tutorial's KV auth chapter does not migrate the primary SQL datasource. Chapter 3 cannot use a primary-db-migrated status precheck attributed to chapter 2. Its first required database migration is the separate workspace datasource in chapter 3. Correct dependent prerequisite comments when removing an auth migration, as well as the migration step itself.
