# S1 independent slice review

I found nothing in S1 that blocks it.

**What I checked against the S1 working tree and the plan:**
- **Manifest field.** The new optional `databaseRequirement` field is strictly validated: the variable name must match a regex, every appsettings path must be non-empty, values must be booleans, and the default must be one of the declared values. It is exported as a type from the protocol module. Manifests without the field come back unchanged, and a test covers that.
- **Backend selection happens before planning.** `resolvePluginDescriptorBeforePlanning` now calls `selectPluginDatabaseRequirement` before `planPluginInstall`. That function reads the process environment, then the project `.env`, then the declared appsettings paths, then the default. Unsupported or inherited values are rejected before anything is written. For the chosen value it sets the DB-related fields on capabilities, provider and `officialSource` together. The specialised provider replaces the existing one in the registry, which allows replacement. Asking for better-auth with `--no-db` fails early. The public and local paths share this code. Both commands pass `Deno.env.get` in from the command layer, so the core code doesn't read the environment directly.
- **Schema copy.** For a plugin that declares a selector and whose chosen backend needs no SQL, schema copying is skipped entirely, even with an explicit `--db` or on a project that already has SQL. Published (JSR) installs still fetch schema files with the integrity check. Source installs now read the package's own `database/` folder, which fixes the local auth gap I raised in PLAN-EVAL, and fall back to the old copied-plugin folder. Plugins without a selector (workers, sagas, triggers) keep their existing behaviour; their source packages ship `database/*.prisma`.
- **Options passed to the auth scaffold.** The configuration is added to the scaffold options only when there is one, so the existing dispatch argument check still holds for other plugins. Auth is first-party and its scaffold runs with `-A`, so falling back to `Deno.env.get` when an older CLI sends no configuration is allowed. `createAuthAdapterPlugin` adds `prismaContract` only for better-auth.
- **Saved `Environment`.** It is written to `NetScript.Plugins.auth.Environment`, which `auth configure` and `showAuthBackend` already read and write. The reinstall merge keeps existing keys instead of dropping them. Deploy config takes the saved `RequiresDb` over the static `infrastructure.requires` (now `["kv"]`). So a kv-oauth install no longer shows `db` as a requirement, and a better-auth install still gets its database through the saved value.

**Advisory, not blocking:**
- `plugin-database-requirement.ts` imports `jsr:@std/dotenv@~0.225.5` inline instead of through the CLI's import map. The lock file already has that version, so nothing churns. Consider adding it to the map, or reusing the existing `readAuthEnvBackend` parsing style.
- An auth manifest from this change installed by an older CLI would treat better-auth as needing no database. Versions ship in lockstep, so this only matters if they are ever mixed.
- No install-level test yet shows a kv-oauth install on a project with SQL copying no schema. This is expected in S2's consumer proof.
- The `createAuthAdapterPlugin` doc says it doesn't read ambient configuration, but `scaffold.ts` does fall back to the environment. The comment is accurate for the function itself.

VERDICT: PASS
