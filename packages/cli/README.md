# @netscript/cli

[![JSR](https://jsr.io/badges/@netscript/cli)](https://jsr.io/@netscript/cli)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The NetScript command surface: scaffold a workspace, then grow it — contracts, services, databases,
plugins, Fresh UI, deployment — with verbs that regenerate the Aspire host and the plugin registries
for you.**

Ships as the `netscript` binary, and as an embeddable command tree you can mount inside your own CLI.

---

## 🚀 Quick Start

### Installation

```bash
# The `netscript` binary (what most people want)
deno install --global --allow-all --name netscript jsr:@netscript/cli

# The embeddable command tree, as a library
deno add jsr:@netscript/cli

# Node.js / Bun
npx jsr add @netscript/cli
bunx jsr add @netscript/cli
```

### Usage

One command lays down a complete, running backend workspace — contracts, an example oRPC service, a
Prisma-backed database, the Fresh app, the plugin registry, and the Aspire orchestration layer:

```bash
netscript init my-app --db postgres --service --yes
cd my-app

netscript db migrate           # evolve the schema
netscript service add          # add another service + its v1 contract
netscript plugin install workers  # durable background processing
```

Every verb that changes the shape of the workspace **regenerates what is derived from it** — the
Aspire AppHost helpers, the plugin registries, the contract version aggregates. You do not
hand-maintain the wiring.

Prefer to see the blast radius first? `netscript init my-app --dry-run` prints every file it would
write without touching the disk.

---

## 🗺 Command map

| Group         | What it owns                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `init`        | Scaffold a new workspace (`--db`, `--service`, `--no-aspire`, `--dry-run`).                                                           |
| `contract`    | `add`, `add-route`, `version`, `inspect`, `list`, `remove` — the typed oRPC contract surface.                                         |
| `service`     | `add`, `add-handler`, `ref`, `set`, `list`, `remove`, `generate` — service workspaces and their Aspire registration.                  |
| `db`          | `add`, `init`, `migrate`, `generate`, `seed`, `status`, `studio`, `introspect`, `reset`, `deploy` — Prisma lifecycle.                 |
| `plugin`      | `new`, `scaffold`, `install`, `remove`, `sync`, `update`, `doctor`, `list`, `info`, `ai`, `auth` — first-party and third-party plugins. |
| `ui:*`        | `ui:init`, `ui:add`, `ui:list`, `ui:update`, `ui:remove` — the Fresh UI registry (pages, islands, collections).                       |
| `generate`    | `aspire`, `plugins`, `runtime-schemas` — regenerate derived artifacts on demand.                                                      |
| `config`      | `inspect`, `get`, `set`, `override`, `runtime` — resolved configuration and runtime overrides.                                        |
| `agent`       | `init`, `mcp` — install and run the agent tooling (see below).                                                                        |
| `deploy`      | Bare-metal, Deno Deploy, and Aspire cloud targets (see below).                                                                        |
| `marketplace` | `search`, `publish` — plugin discovery and distribution.                                                                              |

`netscript <group> --help` prints the live tree for any group; it is generated from the same command
definitions this package exports, so it never drifts from the binary you installed.

---

## 📦 Key capabilities

- **Scaffold-and-grow, not scaffold-and-diverge**: `init` writes the workspace, and every later verb
  keeps the derived layers (Aspire helpers, plugin registries, contract aggregates) in sync. The
  generated project is meant to be re-generated, not forked.
- **Embeddable command tree**: `createPublicCli(host)` returns the full public `netscript` surface
  against a `PublicCliHost`, so a host binary owns the process boundary — argv, exit codes,
  permissions — while NetScript owns the verbs. `runPublicCli()` adds the standard NetScript error
  formatting for a binary edge.
- **Plugin verb dispatch**: `dispatchPluginVerb` and `FRAMEWORK_VERBS` route the framework-owned verbs
  (`install`, `remove`, `enable`, `disable`, `sync`, `setup`, `update`, `doctor`, `info`) into a
  plugin's own published CLI via `deno x -A jsr:<pkg>/cli` — so a plugin implements its verbs once
  and inherits the command surface.
- **Plugin host loading**: `createPluginHostLoader` and `resolvePluginManifest` resolve configured
  plugin specs, walk the project, and aggregate runtime contributions through structural ports.
- **Plugin scaffolding**: `scaffoldPluginPackage` and the `@netscript/cli/scaffolding` engine render
  `{{var | pipe}}` skeleton templates into a fully-formed plugin package.
- **Deterministic testing**: `@netscript/cli/testing` supplies in-memory filesystem, process, prompt,
  and logger ports plus fixture builders, so scaffold and CLI flows are exercised without touching
  the disk or spawning processes.

### Subpaths

| Subpath                      | Purpose                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------- |
| `@netscript/cli`             | The embeddable command tree (`createPublicCli`, `runPublicCli`, plugin dispatch) |
| `@netscript/cli/scaffolding` | Template-rendering engine for plugin package scaffolds                           |
| `@netscript/cli/testing`     | In-memory ports + fixture builders for deterministic CLI tests                   |

---

## 🤖 Agent tooling

NetScript's agentic surface is one triple: the **CLI** is the hands, the **skills** are the doctrine,
and **MCP** is the eyes. Install all three into a project root:

```bash
netscript agent init
```

Claude Code receives `.mcp.json`, the NetScript skill bundle under `.claude/skills/`, and a marked
section in `AGENTS.md`; VS Code receives `.vscode/mcp.json`. Hosts are auto-detected, or select them
with `--host claude|vscode|all`. Re-running preserves other host configuration and leaves unchanged
files alone.

The installed server entry runs `netscript agent mcp` ([`@netscript/mcp`](https://jsr.io/@netscript/mcp)).
Prefer ordinary CLI verbs for direct, repeatable operations — an agent that can run `netscript db
migrate` should just run it. Reach for MCP for what a shell cannot cheaply give an agent: bounded
telemetry aggregation, cross-domain diagnostics, and documentation search. The MCP data boundary
covers telemetry, project metadata, generated registries, and public docs — never project source,
environment values, credentials, or secrets.

---

## 🚢 Deployment

`netscript deploy <target> <op>` is a thin router over target adapters. Targets implement the
canonical `plan` / `emit` / `up` / `down` / `status` / `logs` operations; a target wired with the
shared deploy-core conventions additionally advertises `rollback` and `secrets`. An unwired
descriptor advertises only the subset it can actually perform, so the router never exposes a verb the
target cannot honour.

| Target                                                      | Mechanism                                                                                                                                                                                                                         | Prerequisites                                                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **bare metal**                                              | `deno compile` → single binary, managed as an OS service through one `OsServicePort` seam: Servy on Windows, systemd on Linux.                                                                                                    | Configure `deploy.targets.{windows,linux}`.                                                         |
| `deno-deploy`                                               | `deno deploy [--prod]`, with an unstable-API guard that **refuses** a `--prod` push when the project uses APIs Deno Deploy rejects (`Deno.openKv`, `Deno.cron`, `BroadcastChannel`, `Temporal`). Preview pushes warn and proceed. | The `deno deploy` CLI owns auth; this surface mints no credentials.                                 |
| `kubernetes`, `azure-aca`, `azure-app-service`, `azure-aks` | Validates the generated TypeScript AppHost declares the matching hosting integration, then delegates to `aspire publish` / `deploy` / `destroy`.                                                                                  | `aspire add <target>`, a configured cluster/subscription context, and Helm 4.2+ for Kubernetes/AKS. |
| `cloud-run`                                                 | Docker-image lane: `docker build` → `docker push` → `gcloud run deploy`.                                                                                                                                                          | Docker, Google Cloud CLI auth, and a reachable registry.                                            |

### Native desktop packaging

An enabled Aspire app with `Type: "desktop"` can package through its configured task hook:

```json
{
  "Type": "desktop",
  "Enabled": true,
  "Workdir": "apps/storefront",
  "PackageTaskName": "desktop:package"
}
```

The task owns the desktop entrypoint and permissions. NetScript appends the native Deno flags:

```bash
netscript deploy desktop package --app storefront --all-targets \
  --format app --format appimage --format deb --format rpm --format msi
netscript deploy desktop package --app storefront \
  --target x86_64-unknown-linux-gnu --format appimage --format deb
```

Every invocation uses an explicit target and output path. Omitted formats produce all formats for
the selected OS: `.app`/`.dmg` on macOS, `.AppImage`/`.deb`/`.rpm` on Linux, and `.msi` on Windows.
Runtime compression defaults to `xz`; select `--compression none|lzma|zstd` explicitly when needed.
The `.dmg` format requires a macOS host, and `zstd` requires the external `zstd` executable.
An unfiltered `--all-targets` includes `.dmg`, so run that complete matrix on macOS; other hosts can
use repeatable `--format` filters to omit it while still cross-compiling the remaining targets.
Native installers are unsigned at this stage; signing and notarization remain external CI steps.

Cloud authentication and RBAC are deliberately **operator-owned**. NetScript does not mint cloud
credentials, assign RBAC, or hand-author Helm, Bicep, Kubernetes, or Azure manifests: AppHost-backed
targets delegate to Aspire after validation, and Cloud Run owns only the image build/push/apply seam.

`deno compile` produces **unsigned** binaries. Signing is a deliberate manual hook — run it between
`deploy build` and `deploy install` with your own certificate and timestamp authority
(`signtool sign /fd SHA256 /tr <url> /td SHA256 <binary>.exe` on Windows; `gpg --detach-sign` or your
distro's package-signing flow on Linux).

### Permissions

A host binary embedding the deploy surface must grant:

| Permission      | Why                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `--allow-run`   | `deno compile` the service binaries; invoke `servy` / `systemctl` / `aspire` / `docker` / `gcloud`.    |
| `--allow-read`  | Read the workspace config, entrypoints, and release/secret files.                                      |
| `--allow-write` | Emit compiled binaries, release directories, the `current` link, and env files.                        |
| `--allow-net`   | Health-probe the activated service (`FetchHealthProbe`).                                               |
| `--allow-sys`   | Resolve the host OS/triple to select the Servy vs. systemd adapter and compile target.                 |
| `--allow-env`   | Read the deploy owner principal for the Windows secret-file ACL; provider CLIs read their auth tokens. |

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/cli/](https://rickylabs.github.io/netscript/reference/cli/)
- **CLI & scaffold**:
  [rickylabs.github.io/netscript/orchestration-runtime/cli-scaffold/](https://rickylabs.github.io/netscript/orchestration-runtime/cli-scaffold/)
- **How-to: Author a plugin**:
  [rickylabs.github.io/netscript/how-to/author-a-plugin/](https://rickylabs.github.io/netscript/how-to/author-a-plugin/)
- **How-to: Deploy**: [rickylabs.github.io/netscript/how-to/deploy/](https://rickylabs.github.io/netscript/how-to/deploy/)
- **Agent tooling**:
  [rickylabs.github.io/netscript/capabilities/agent-tooling/](https://rickylabs.github.io/netscript/capabilities/agent-tooling/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
