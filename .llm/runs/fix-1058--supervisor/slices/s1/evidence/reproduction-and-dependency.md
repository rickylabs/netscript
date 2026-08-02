# Pre-change evidence

## Published-canary reproduction

Command (disposable project under `.llm/tmp/fix-1058-published.CgLDOl`):

```sh
deno run -A --minimum-dependency-age=0 jsr:@netscript/cli@0.0.3-canary.3 init e2eproj \
  --path .llm/tmp/fix-1058-published.CgLDOl \
  --db postgres --service --service-name users --service-port 3001 \
  --ci --yes --no-git --force
cd .llm/tmp/fix-1058-published.CgLDOl/e2eproj
deno run -A --minimum-dependency-age=0 jsr:@netscript/cli@0.0.3-canary.3 \
  plugin install auth --name auth --project-root . --no-samples --force
grep -rn '^model ' database/postgres/schema/
```

Output:

```text
Installed auth plugin "auth" on port 8094.
Created 1 plugin files.
Regenerated 13 Aspire helper files.
database/postgres/schema/plugins/auth/auth.prisma:2:model User {
database/postgres/schema/plugins/auth/auth.prisma:17:model Session {
database/postgres/schema/plugins/auth/auth.prisma:33:model Account {
database/postgres/schema/plugins/auth/auth.prisma:55:model Verification {
database/postgres/schema/schema.prisma:17:model User {
```

Direct line checks:

```text
database/postgres/schema/schema.prisma:17: model User {
database/postgres/schema/plugins/auth/auth.prisma:2: model User {
```

This proves the collision is between the scaffold example model and one published auth fragment.
There is no duplicated fragment.

## better-auth stop-line verification

The workspace catalog and lock resolve `better-auth` 1.6.20:

```text
deno.json:219: "better-auth": "^1.6.20"
deno.lock:146: "npm:better-auth@1.6.20": ...
deno.lock:2072: "better-auth@1.6.20_..."
```

Command:

```sh
deno doc --filter BetterAuthDBOptions npm:better-auth@1.6.20
```

Resolved pinned type:

```text
type BetterAuthDBOptions<ModelName extends string, Keys extends string = string> = {
  modelName?: ModelName | LiteralString;
  fields?: Partial<Record<Exclude<Keys, "id">, string>>;
  additionalFields?: ...;
}
```

`BetterAuthOptions` uses `BetterAuthDBOptions` for `user`, `session`, `account`, and `verification`,
so the owner-directed mapping is supported and implementation may proceed. The better-auth Prisma
adapter indexes the generated client as `db[model]`; therefore the configured values are the
camelCase Prisma client accessors (`authUser`, `authSession`, `authAccount`, `authVerification`),
not the PascalCase schema identifiers.
