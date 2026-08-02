# Local CLI reproduction

Command:

```sh
deno run -A packages/cli/bin/netscript.ts init e2eproj \
  --path .llm/tmp/fix-1058-local.n48ei9 \
  --db postgres --service --service-name users --service-port 3001 \
  --ci --yes --no-git --force
cd .llm/tmp/fix-1058-local.n48ei9/e2eproj
deno run -A /home/codex/repos/fix-1058/packages/cli/bin/netscript.ts \
  plugin install auth --name auth --project-root . --no-samples --force \
  --local-path /home/codex/repos/fix-1058/plugins/auth
grep -rn '^model ' database/postgres/schema/
```

Output:

```text
Installed auth plugin "auth" on port 8094.
Created 1 plugin files.
Regenerated 13 Aspire helper files.
database/postgres/schema/schema.prisma:17:model User {
```

Every model present in the generated schema tree is declared exactly once. As diagnosed before this
slice, local-path installs do not materialize the plugin's `database/` contribution (#1043/#1014),
so this local-path command correctly contains only the scaffold's example `User`. The auth fragment
itself is separately guarded by the plugin regression test, which proves its four top-level names
are `AuthUser`, `AuthSession`, `AuthAccount`, and `AuthVerification` and none of the unprefixed
names remain. Dependency-mode fragment materialization remains covered by the unchanged JSR install
test.
