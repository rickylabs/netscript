# IMPL-EVAL round 1 — FAIL_FIX

IMPL-EVAL round 1 fails on one blocker: several other docs pages still say auth always installs its tables, which this change makes false. The code and tests hold up.

**Blocker: other docs still describe the old auth behaviour**

S2 updated `add-a-plugin.md` correctly. But these pages still say every auth install, kv-oauth included, contributes `auth.prisma` and its four tables:

- `docs/site/identity-access/how-to/add-authentication.md`:
  - Line 49 says the plugin "contributes the `auth.prisma` schema" with no condition.
  - Lines 194-196 say "Every install provisions these tables so the schema stays consistent."
  - The Step 4 heading, "run the auth database migration", sits in a recipe that uses kv-oauth.
- `docs/site/tutorials/workspace/02-auth.md`: this tutorial selects kv-oauth.
  - Lines 12 and 28-29, plus the closing summary at line 226, list "the `auth.prisma` migration applied" as an outcome.
  - Step 3 (lines 107-124) says "The migration always runs."
  - With this change, kv-oauth contributes no schema, so the reader can't reach that outcome.
- `docs/site/tutorials/workspace/index.md:79` ("choose the interactive `kv-oauth` backend, run the `auth.prisma` migration") and `06-deploy.md:85` (the kv-oauth `auth.prisma` migration "from chapter 2").
- `docs/site/glossary.md:79` ("the auth plugin installs `auth_users` / … / `auth_verifications`") and `docs/site/identity-access/auth.md:307` ("The plugin contributes a package-provided `auth.prisma` schema"). These two need wording that says only better-auth contributes it.

These statements were true on main. The fix:
1. Make each one conditional on better-auth. In the kv-oauth tutorial and recipe, mark the auth migration step as better-auth only.
2. Regenerate the matching rows in the agent-docs prose carrier.
3. Record this small docs-only scope expansion in `drift.md`, since the declared writable surface named only `add-a-plugin.md`.

`docs/site/data-persistence/database.md` is already correct (it says "better-auth backend").

**Code checks that passed**
- **S1 commit:** it is the change I reviewed and passed. S2 adds an explicit return type on the scaffold closure and a `--no-db` rejection test. That test checks no `database/` folder is created.
- **Local package aliases** (`ensureLocalPluginImports`):
  - It runs only for local-path installs and skips dry runs.
  - Aliases come from the selected package's declared exports in its `deno.json`.
  - Pointing into the source checkout is not new for local-source projects; the existing runtime aliases already do it.
  - The workers, sagas and triggers runtime targets match the existing local runtime paths, so the new aliases are additions for those plugins, not changed targets.
  - Public install keeps its exact `jsr:` alias, and a test asserts it.
- **Consumer tests:**
  - Local and public no-DB kv-oauth installs: no Prisma files, empty `Databases`, `RequiresDb=false`, selected backend saved, generate and doctor report no errors.
  - better-auth through `.env`: all four `@@map` tables present.
  - Switching back to kv-oauth with `--force` leaves the existing schema byte-identical and does not re-add a removed fragment.
- **`add-a-plugin.md`:** `netscript plugin auth backend set` is a real command. The stated precedence (process env, then `.env`, then appsettings, default kv-oauth) matches the selector. The safe-reinstall and table-preservation notes match the tests.

**Advisory, not blocking**
- In CI-default local mode, `scaffold.runtime` passes `--local-path` for workers, sagas, triggers and streams. So the new aliases now apply to all four plugins, and the CI `e2e-cli` verdict is the real proof of that path.
- The JSR baseline findings (missing `@module` tags, private-type references) are unchanged and not caused by this branch.
- The inline `jsr:@std/dotenv` import from S1 is still advisory only.

`scaffold.runtime` remains unproven until coordinator CI runs it. That is not waived and does not authorise merge.

VERDICT: FAIL_FIX
