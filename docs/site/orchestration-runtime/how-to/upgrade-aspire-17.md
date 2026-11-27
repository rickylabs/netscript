---
layout: layouts/base.vto
title: Upgrade to Aspire 17
description: Migrate an existing NetScript workspace from a Node.js Aspire AppHost to Aspire 17.0.0 and native Deno execution.
templateEngine: [vento, md]
order: 110
---

# Upgrade to Aspire 17

NetScript `0.0.10` upgrades orchestration to **Aspire `17.0.0`** with a native Deno TypeScript
AppHost (`aspire/deno.json`) and first-party Deno hosting (`builder.addDenoApp` via
`Aspire.Hosting.JavaScript`). Existing workspaces scaffolded with a legacy Node.js
`aspire/package.json` AppHost fail closed before any CLI mutation until migrated.

## 1. Install Aspire CLI `17.0.0` and NetScript `0.0.10`

Install or update the pinned Aspire CLI and NetScript CLI, and confirm the toolchain is healthy:

```bash
dotnet tool update -g Aspire.Cli --version 17.0.0
# or, for a fresh install:
dotnet tool install -g Aspire.Cli --version 17.0.0

deno install --global --allow-all --force --name netscript jsr:@netscript/cli@^0.0.10

aspire --version
aspire doctor --non-interactive --nologo
```

If you manage toolchains with `mise`, update the `aspire` entry in your local `.mise.toml` to
`"17.0.0"` or point `NETSCRIPT_ASPIRE_CLI` at your pinned binary.

## 2. Migrate a legacy Node.js `aspire/package.json` workspace

Remove the legacy Node.js AppHost files from `aspire/`:

```bash
rm -rf aspire/package.json aspire/tsconfig.apphost.json aspire/node_modules
```

Update your root `deno.json` **preserving all existing `"workspace"` entries and `"unstable"`
flags** (such as `"raw-imports"` and `"kv"`), adding `"./aspire"` to `"workspace"` and
`"sloppy-imports"` to `"unstable"`:

```json
{
  "workspace": ["./aspire", "./packages/contracts", "./database/*", "./services/*", "./apps/*"],
  "unstable": ["raw-imports", "kv", "sloppy-imports"]
}
```

Create `aspire/deno.json` (include `"pg"` when using a container PostgreSQL database so the
`<name>_auth` credential-readiness probe can authenticate):

```json
{
  "imports": {
    "net": "node:net",
    "vscode-jsonrpc/node.js": "npm:vscode-jsonrpc@8.2.0/node.js",
    "zod": "catalog:",
    "pg": "npm:pg@^8.16.0",
    "@netscript/aspire": "jsr:@netscript/aspire@^0.0.10"
  }
}
```

Update `aspire/aspire.config.json` to target the Aspire `17.0.0` SDK and integration packages
(`netscript generate aspire` regenerates `apphost.mts` and `.helpers/*`, whereas
`aspire/aspire.config.json` holds your SDK and NuGet pins):

- Set `"sdk.version"` to `"17.0.0"` (replacing the prior SDK pin), preserving your existing `"profiles"` block.
- Add `"Aspire.Hosting.JavaScript": "17.0.0"` under `"packages"` (required for first-party
  `addDenoApp`).
- Bump any configured database integrations (`"Aspire.Hosting.PostgreSQL"`,
  `"Aspire.Hosting.MySql"`, `"Aspire.Hosting.SqlServer"`) to `"17.0.0"` and set
  `"Aspire.Hosting.Browsers"` to `"17.0.0-preview.1.26567.5"`.
- Remove retired `"Aspire.Hosting.Redis"` or `"Aspire.Hosting.Garnet"` entries from `"packages"`
  (NetScript `0.0.10` models caches with core SDK primitives).

Example updated `aspire/aspire.config.json` (include only the database package matching your
workspace):

```json
{
  "appHost": {
    "path": "apphost.mts",
    "language": "typescript/nodejs"
  },
  "sdk": {
    "version": "17.0.0"
  },
  "packages": {
    "Aspire.Hosting.JavaScript": "17.0.0",
    "Aspire.Hosting.Browsers": "17.0.0-preview.1.26567.5"
  }
}
```

Then regenerate the AppHost helpers and restore the Aspire 17.0.0 SDK modules:

```bash
netscript generate aspire
(cd aspire && aspire restore)
```

`netscript generate aspire` regenerates `aspire/apphost.mts`, `aspire/.helpers/*`, and
`.netscript/aspire-cli.ts`, and automatically upgrades a generated prior-release
`.netscript/quality-runner.ts` so `deno task check` checks AppHost files natively with
`deno check --unstable-kv --config aspire/deno.json` instead of the removed Node compiler. (If you
customized `.netscript/quality-runner.ts` and removed its generated header, update `runAppHostCheck`
to use `deno check --unstable-kv --config aspire/deno.json` when `aspire/deno.json` exists.)

## 3. Preserve pre-existing container SQL Server passwords

Aspire 17.0.0 NetScript workspaces generate complexity-safe passwords for container databases and
persist them atomically under `.data/aspire-secrets/<name>.password`. If you have an existing SQL
Server data volume initialized with a previous password, hand that password off before your first
`aspire start` using either method:

1. **Secret file (recommended):** write the existing password to
   `.data/aspire-secrets/<resource-name>.password` with mode `0600` (`chmod 600`), **or**
2. **One-time environment handoff:** export `NETSCRIPT_DB_PASSWORD_<KEY>="<existing-password>"`
   (where `<KEY>` is the uppercased resource name with non-alphanumeric characters replaced by `_`)
   for the first start so NetScript persists it into `.data/aspire-secrets/`, **or**
3. **Reset local dev volume:** remove the old local dev container volume if you do not need its
   data, letting Aspire initialize a fresh database with a newly generated secret.

## 4. Verify the upgraded workspace

Confirm generated surfaces, type checking, and isolated runtime startup:

```bash
netscript generate aspire --check
deno task check
(cd aspire && aspire start --isolated --format Json --non-interactive --nologo)
aspire describe --format Json --non-interactive --nologo
```

When verification finishes, stop only the AppHost you started:

```bash
aspire stop --apphost "$PWD/aspire/apphost.mts" --non-interactive --nologo
```
