---
layout: layouts/base.vto
title: Workspace data
templateEngine: [vento, md]
prev: { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" }
next: { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" }
---

# Workspace data

In this chapter you give the workspace a **second, isolated database** with its own Prisma schema,
migration history and generated client, separate from the primary Postgres that holds the auth
tables. One `netscript db add` scaffolds the datasource and joins it to the Aspire graph; after one
migrate-and-generate pass you have a typed Prisma client scoped to that datasource.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

A second Postgres datasource named `workspace`, scaffolded by `netscript db add`, with `Member` and
`Workspace` models, its own migration and its own typed Prisma client. At the end you import that
client from `database/workspace/schema/.generated/client.server.ts` and query workspace records,
independently of the primary database and the auth tables.

## Before you begin

You need the auth layer from [chapter 2](/tutorials/workspace/02-auth/) and **`aspire start`
running**. The second database runs as its own container in the Aspire graph, so Docker must be up
too:

```sh
# In my-workspace/, with `aspire start` up in another terminal
netscript db status        # primary datasource is migrated (chapter 2)
docker info                # Docker engine is running
```

{{ comp callout { type: "important", title: "A second database is a deliberate choice" } }}
Use a second datasource when you need an <strong>isolated</strong> data domain: its own migration
lifecycle, scaled and backed up independently, so a bad migration in one can't take the other down.
If you only need a new <em>table</em>, add a model to the primary schema instead. This track adds a
datasource on purpose, to keep workspace records separate from auth.
{{ /comp }}

## Step 1 — Scaffold the second database

From the workspace root, run `netscript db add <engine>`. The `--name` flag sets the **config key**
the datasource is registered under. Use `workspace` so it doesn't collide with the primary
`postgres`:

```sh
# Add a second Postgres for workspace records. Registered under
# NetScript.Databases.workspace, scaffolded into database/workspace/.
netscript db add postgres --name workspace
```

`db add` does four things in one pass:

- scaffolds a workspace at `database/workspace/` with its own `schema/schema.prisma`,
  `prisma.config.ts` and `scripts/`;
- registers the datasource in `appsettings.json` under `NetScript.Databases.workspace`;
- adds it as a project member;
- regenerates the Aspire config so the new container joins the resource graph.

It does **not** run a migration or generate a client: `schema.prisma` ships a starter schema and
there is no `.generated/` directory yet. You run the migration yourself in Step 4.

{{ comp callout { type: "note", title: "The engine is swappable" } }}
<code>db add</code> also accepts <code>mysql</code>, <code>mssql</code> and <code>sqlite</code>.
Postgres, MySQL and SQL Server each provision an Aspire container; SQLite is file-backed and adds no
container resource. Keep <code>postgres</code> to follow this tutorial as written.
{{ /comp }}

## Step 2 — Restart Aspire so the container joins the graph

`db add` regenerated the Aspire config, so restart the AppHost to provision the new container:

```sh
cd aspire
aspire start
```

Open the dashboard at the URL Aspire prints and confirm the new
`workspace` resource goes green next to `postgres` and `redis`.

{{ comp callout { type: "warning", title: "Don't skip the restart" } }}
Until you restart, the AppHost doesn't know about the datasource: the resource never appears and the
migration in Step 4 has nothing to reach.
{{ /comp }}

## Step 3 — Define the workspace models

Edit the second datasource's schema. A `Workspace` row is a team; a `Member` row links a signed-in
user, by their auth `subject`, to a workspace:

```prisma
// database/workspace/schema/schema.prisma — add these models
model Workspace {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  members   Member[]
}

model Member {
  id          String    @id @default(cuid())
  // The auth Principal.subject from chapter 2 — the stable user identifier.
  subject     String
  role        String    @default("member")
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  createdAt   DateTime  @default(now())

  @@unique([workspaceId, subject])
}
```

The `subject` column links back to auth: it stores the `Principal.subject` the auth backend resolves
for a signed-in user. A member is "this auth identity, in this workspace".

## Step 4 — Migrate and generate the second datasource

Every `netscript db` operation takes a `--db <target>` flag, where the target is a config key, a
database name or `all`. Point each command at the `workspace` datasource, from the workspace root,
with `aspire start` up:

{{ comp.tabbedCode({ tabs: [
  {
    label: "1 · init",
    lang: "sh",
    code: "# Create + apply the first migration for the SECOND datasource only.\nnetscript db init --db workspace --name init"
  },
  {
    label: "2 · generate",
    lang: "sh",
    code: "# Generate the Deno-runtime Prisma client + zod schemas into\n# database/workspace/schema/.generated for the workspace datasource.\nnetscript db generate --db workspace"
  },
  {
    label: "3 · status",
    lang: "sh",
    code: "# Confirm the workspace datasource is migrated and in sync.\nnetscript db status --db workspace"
  }
] }) }}

Each datasource keeps its **own** migration history and generated client. Migrating
`--db workspace` never touches the primary Postgres or the auth tables, and the reverse holds too.

{{ comp callout { type: "note", title: "Omitting --db targets the primary" } }}
A <code>db</code> command without <code>--db</code> runs against the <strong>primary</strong>
datasource, the Postgres the auth plugin migrated into. Pass <code>--db workspace</code> for the
second one, or <code>--db all</code> to run against every registered datasource.
{{ /comp }}

## Step 5 — Query the workspace client

After `db generate --db workspace`, the second datasource has its own typed client. Import it like
the primary client, from the new path. It is an independent `PrismaClient`, typed from the
`Workspace` and `Member` models:

```ts
// services/workspace/src/db.ts
// The SECOND datasource generates its OWN client. Import it from its path.
import { PrismaClient as WorkspacePrisma } from '../../database/workspace/schema/.generated/client.server.ts';

export const workspaceDb = new WorkspacePrisma();

// Fully typed off the workspace schema — separate from the primary client.
const teams = await workspaceDb.workspace.findMany({ take: 20 });
console.log(teams.length);
```

{{ comp callout { type: "warning", title: "Import the right client" } }}
The primary client lives at <code>database/postgres/schema/.generated/client.server.ts</code> and the
workspace client at <code>database/workspace/schema/.generated/client.server.ts</code>. Crossing the
imports queries the wrong database. Re-run <code>netscript db generate --db workspace</code> after
every schema edit, or your code is typed against the old shape.
{{ /comp }}

## Extend — app-level org scoping

The model above is **single-tenant**: every `Member` belongs to a `Workspace`, but nothing models an
organization that owns many workspaces. NetScript doesn't ship orgs, tenants or RBAC roles. For
multi-tenant scoping, you add it in your own schema and your own queries.

{{ comp callout { type: "note", title: "Multi-Tenancy and Org Scoping Design Boundary" } }}
NetScript's identity system resolves a <code>Principal</code> with a <code>subject</code> and claims, but the core runtime does not enforce organization boundaries or multi-tenant database scoping. This keeps authentication decoupled from application-level data isolation. Implement multi-tenant scoping, such as filtering by <code>orgId</code> or managing role hierarchies, in your application logic. First-class, typed organization and multi-tenancy primitives are planned under roadmap item R3.
<!-- caveat: arch-debt:seamless-auth-roadmap -->
{{ /comp }}

## Verify your progress

Confirm the second datasource is migrated and its client generated:

```sh
netscript db status --db workspace
ls database/workspace/schema/.generated/client.server.ts
```

`db status --db workspace` reports the datasource migrated and in sync, and the generated client file
exists.

- [ ] `netscript db add postgres --name workspace` scaffolded `database/workspace/`.
- [ ] The `workspace` resource is green in the Aspire dashboard.
- [ ] `database/workspace/schema/schema.prisma` defines `Workspace` and `Member`.
- [ ] `netscript db status --db workspace` reports migrated and in sync.
- [ ] The generated client exists at `database/workspace/schema/.generated/client.server.ts`.

## What you built

A second, isolated Postgres datasource with `Workspace` and `Member` models, its own migration
history and its own typed client, separate from auth and the primary database. Org scoping stays
app-level. Next, you add members to a team with a background job that runs off the request path.
