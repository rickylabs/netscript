---
layout: layouts/base.vto
title: Workspace data
templateEngine: [vento, md]
prev: { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" }
next: { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" }
---

# Workspace data

Your app can sign users in, but it has nothing of its own to store yet. This chapter gives the
workspace its own data: a **second, isolated database** with its own Prisma schema, migration history,
and generated client — separate from the primary Postgres the auth plugin migrated into. The reason to
isolate it is the same reason teams isolate any domain: an independent lifecycle you can migrate, scale,
and back up on its own. It also bounds the blast radius — a bad migration to your team schema cannot
take the auth tables down with it, and vice versa.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

A second Postgres datasource named `workspace`, scaffolded by `netscript db add`, with its own
`Member` and `Workspace` models, its own migration, and its own typed Prisma client. By the end you can
import that client at `database/workspace/schema/.generated/client.server.ts` and query workspace
records — fully independent from the primary database and the auth tables.

## Before you begin

You need the auth layer from [chapter 2](/tutorials/workspace/02-auth/) and **Aspire running**. The
second database is provisioned as its own container in the Aspire graph, so Docker must be up too.
Confirm the primary is migrated and Aspire is live:

```sh
# In my-workspace/, with `aspire start` up in another terminal
netscript db status        # primary datasource is migrated (chapter 2)
docker info                # Docker engine is running
```

{{ comp callout { type: "important", title: "A second database is a deliberate choice" } }}
A second datasource is the right tool when you need an <strong>isolated</strong> data domain — a
separate migration lifecycle and a datasource you can scale and back up independently. If you only
wanted a new <em>table</em>, you would add a model to the primary schema instead. Adding a whole
datasource means a second migration history and a second generated client to manage. This track adds
one on purpose, to keep workspace records cleanly separate from auth.
{{ /comp }}

{{ comp callout { type: "note", title: "This split is how a real NetScript app stores its data" } }}
A production context-accumulator chat application built on NetScript uses exactly
this shape: one <strong>org-catalog</strong> datasource (Prisma-managed: who exists, which projects
and channels there are) kept separate from the datastores each channel accumulates context into.
Not everything is one database. The catalog answers "what is there and who belongs to it"; the
domain data lives on its own lifecycle. Your <code>workspace</code> datasource here plays the
catalog role for your team records.
{{ /comp }}

## Step 1 — Scaffold the second database

From the workspace root, run `netscript db add <engine>`. The `--name` flag sets the **config key** the
datasource is registered under — use `workspace` so it does not collide with the primary `postgres`:

```sh
# Add a second Postgres for workspace records. Registered under
# NetScript.Databases.workspace, scaffolded into database/workspace/.
netscript db add postgres --name workspace
```

In one pass, `db add` scaffolds a workspace at `database/workspace/` (its own
`schema/schema.prisma`, `prisma.config.ts`, and `scripts/`), registers the datasource in
`appsettings.json` under `NetScript.Databases.workspace`, adds it as a project member, and regenerates
the Aspire config so the new container joins the resource graph.

{{ comp callout { type: "note", title: "The engine is swappable" } }}
This track uses <code>postgres</code>, but <code>db add</code> is polyglot: swap <code>postgres</code> for
<code>mysql</code>, <code>mssql</code>, or <code>sqlite</code> to scaffold that engine instead. Postgres,
MySQL, and SQL Server each provision an Aspire container; SQLite is file-backed and adds no container
resource. Keep <code>postgres</code> to follow the rest of this tutorial as written.
{{ /comp }}

{{ comp callout { type: "note", title: "The new datasource starts empty" } }}
<code>db add</code> scaffolds the workspace and registers the datasource, but it does
<strong>not</strong> run a migration or generate a client — the new
<code>database/workspace/schema/schema.prisma</code> ships a starter schema and no
<code>.generated/</code> directory yet. You run the migration loop yourself in Step 4, targeting the
new datasource with <code>--db</code>.
{{ /comp }}

## Step 2 — Restart Aspire so the container joins the graph

Because `db add` regenerated the Aspire config, the new database becomes a container in the resource
graph. Restart the AppHost so it provisions:

```sh
cd aspire
aspire start
```

Open the dashboard at [https://localhost:18888](https://localhost:18888) and confirm the new
`workspace` resource goes green alongside the existing `postgres` and `redis`.

{{ comp callout { type: "warning", title: "Restart is not optional" } }}
The new container only appears because <code>db add</code> <strong>regenerated the Aspire helpers</strong>.
If you skip the restart, the AppHost will not know about the datasource and the resource never shows
up — and the migration in Step 4 has nothing to reach.
{{ /comp }}

## Step 3 — Define the workspace models

Edit the second datasource's schema to hold workspace records. A `Workspace` row is a team; a `Member`
row links a signed-in user (by their auth `subject`) to a workspace:

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

The `subject` column is the link back to auth: it stores the `Principal.subject` value the auth backend
resolves for a signed-in user, so a workspace member is "this auth identity, in this workspace."

## Step 4 — Migrate and generate the second datasource

The `netscript db` operations are **multi-database aware**: every one takes a `--db <target>` flag,
where the target is a config key, a database name, or `all`. Point each command at the `workspace`
datasource. Run these from the workspace root with `aspire start` up:

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

Each datasource keeps its **own** migration history and generated client. Migrating `--db workspace`
never touches the primary Postgres (or the auth tables), and vice versa.

{{ comp callout { type: "note", title: "Omitting --db targets the primary" } }}
A <code>db</code> command with no <code>--db</code> resolves to the <strong>primary</strong> datasource
(the default Postgres the auth plugin migrated into). Always pass <code>--db workspace</code> when you
mean the second one, or <code>--db all</code> to fan out across every registered datasource.
{{ /comp }}

## Step 5 — Query the workspace client

After `db generate --db workspace`, the second datasource has its own typed client. Import it exactly
like the primary — just from the new path. It is an independent `PrismaClient`, typed off the
`Workspace`/`Member` models:

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
The primary client lives at <code>database/postgres/schema/.generated/client.server.ts</code>; the
workspace client at <code>database/workspace/schema/.generated/client.server.ts</code>. They are
distinct <code>PrismaClient</code>s — crossing the imports queries the wrong database. Re-run
<code>netscript db generate --db workspace</code> after every schema edit, or your code is typed
against the old shape.
{{ /comp }}

## Extend — app-level org scoping

The data model above is **single-tenant**: every `Member` belongs to a `Workspace`, but there is no
framework-managed notion of an organization that owns many workspaces. NetScript does not ship orgs,
tenants, or RBAC roles — if you want multi-tenant scoping, you add it yourself, in your own schema and
your own queries.

{{ comp callout { type: "note", title: "Org scoping is your code, not a framework primitive" } }}
To scope data to an organization, add an <code>orgId</code> column to your own models and filter every
query by it — for example <code>workspaceDb.workspace.findMany(&#123; where: &#123; orgId &#125; &#125;)</code>.
NetScript has <strong>no</strong> first-class organization, tenant, or role primitive: the
<code>auth</code> plugin resolves an identity (a <code>Principal</code> with a <code>subject</code>),
and the route-authz seam in <a href="/tutorials/workspace/05-route-authz/">chapter 5</a> checks
<em>scopes</em>, not org membership. Multi-tenant isolation, role hierarchies, and per-org access
control are <strong>application logic you own</strong> — treat any <code>orgId</code> here as a column
you maintain, not a behavior the framework enforces.
<!-- caveat: arch-debt:seamless-auth-roadmap -->
{{ /comp }}

## Verify your progress

Confirm the second datasource is migrated and its client generated:

```sh
netscript db status --db workspace
ls database/workspace/schema/.generated/client.server.ts
```

`db status --db workspace` should report it migrated and in sync, and the generated client file should
exist.

- [ ] `netscript db add postgres --name workspace` scaffolded `database/workspace/`.
- [ ] The `workspace` resource is green in the Aspire dashboard.
- [ ] `database/workspace/schema/schema.prisma` defines `Workspace` and `Member`.
- [ ] `netscript db status --db workspace` reports migrated and in sync.
- [ ] The generated client exists at `database/workspace/schema/.generated/client.server.ts`.

## What you built

Your workspace now owns its data: a second, isolated Postgres datasource with `Workspace` and `Member`
models, its own migration history, and its own typed client — the same catalog-versus-domain split a
real NetScript app runs on, cleanly separate from auth and the primary database. You also saw the
boundary: org scoping is app-level, not a framework primitive. Next comes the moment this data model
exists for — adding a member to a team — and you do it off the request path with a background job.

{{ comp.nextPrev({ prev: { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" }, next: { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" } }) }}
</content>
