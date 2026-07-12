# @netscript/cli

[![JSR](https://jsr.io/badges/@netscript/cli)](https://jsr.io/@netscript/cli)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The embeddable command surface for NetScript workspaces: build the `netscript` command tree, dispatch framework plugin verbs, and scaffold plugin packages from your own runtime.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/cli

# Node.js / Bun
npx jsr add @netscript/cli
bunx jsr add @netscript/cli
```

### Usage

```typescript
import { createPublicCli } from '@netscript/cli';

// Build the public NetScript command tree against host-supplied services.
const cli = createPublicCli({
  cwd: () => Deno.cwd(),
  resolvePath: (path = '.') => new URL(path, `file://${Deno.cwd()}/`).pathname,
});

await cli.parse(['--help']);
```

For a binary edge, wrap the tree in `runPublicCli()` for consistent NetScript error formatting.

---

## 📦 Key Capabilities

- **Embeddable command tree**: `createPublicCli` returns the full public `netscript` command surface against a `PublicCliHost`, so a host binary owns process boundaries while NetScript owns the verbs.
- **Plugin verb dispatch**: `dispatchPluginVerb` and `FRAMEWORK_VERBS` route the framework-owned verbs (`add`, `remove`, `enable`, `sync`, `doctor`, and more) through `deno dx jsr:<pkg>/cli`.
- **Plugin host loading**: `createPluginHostLoader` and `resolvePluginManifest` resolve configured plugin specs, walk the project, and aggregate runtime contributions from structural ports.
- **Plugin scaffolding**: `scaffoldPluginPackage` (root) and the `@netscript/cli/scaffolding` engine render `{{var | pipe}}` skeleton templates into a plugin package.
- **Deterministic testing**: `@netscript/cli/testing` supplies in-memory filesystem, process, prompt, and logger ports plus fixture builders for exercising scaffold and CLI flows.
- **Bare-metal deployment**: `netscript deploy` compiles each workspace service into a self-contained single binary and manages it as an OS service through one OS-agnostic seam — Servy on Windows, systemd on Linux — configured per OS under `deploy.targets.{windows,linux}`.
- **Aspire cloud deployment**: `netscript deploy kubernetes|azure-aca|azure-app-service|azure-aks <op>` validates the generated TypeScript AppHost defines the matching hosting integration, then delegates publish/deploy/destroy through `aspire --apphost`. `netscript deploy cloud-run <op>` follows the Docker-image provider lane with `docker build`, `docker push`, and `gcloud run deploy`.

---

## 🖥 Bare-metal deployment

NetScript deploys workspace services to bare-metal hosts as OS-managed services behind one OS-agnostic seam, so the CLI verbs stay identical across platforms:

- **OS-agnostic service port** — `OsServicePort` (`install` / `start` / `stop` / `status` / `uninstall`) is satisfied by the Servy adapter on Windows and the systemd adapter on Linux. `createOsServicePort(os, { process })` resolves the right adapter, and the deploy lifecycle verbs (`deploy install | start | stop | status | uninstall`) route through it. Service naming and config paths follow the host OS: `NetScript.<svc>` + `<svc>.xml` on Windows, `netscript-<svc>.service` on Linux.
- **Single-binary artifacts** — `deploy build` compiles each Deno service into a self-contained binary with `deno compile`, embedding assets via `--include`. The compile target defaults to the host triple (`x86_64-pc-windows-msvc` → `.exe`, `x86_64-unknown-linux-gnu` → ELF) and is overridable per target with `deploy.targets.<os>.compileTarget`.
- **Per-OS configuration** — `deploy.targets.windows` (servy path, service prefix, install base) and `deploy.targets.linux` (systemctl path, unit prefix, install base, `user`/`group`, runtime dir) share one build/bundle/health/logging base; unset fields fall back to OS-sensible defaults.

### Binary signing

`deno compile` produces **unsigned** binaries. Signing is a deliberate manual hook so you can use your own certificate and timestamp authority — run it after `deploy build` and before `deploy install`:

- **Windows**: `signtool sign /fd SHA256 /tr <timestamp-url> /td SHA256 <binary>.exe`
- **Linux**: attach a detached signature (`gpg --detach-sign <binary>`) or use your distribution's package-signing flow.

### Operation coverage

The bare-metal targets implement the canonical `plan` / `emit` / `up` / `down` / `status` / `logs` operations (with `build` / `install` / `uninstall` retained as verb aliases). The full 7-op contract — adding `rollback` and `secrets` — is available once a target is wired with the shared deploy-core conventions: `up` runs a health-gated activation (atomic cutover + probe + automatic rollback on failure), `rollback` returns to the previous healthy release, and `secrets` reconciles a restricted env file (`0o600` on Linux, owner+SYSTEM ACL on Windows). An unwired descriptor advertises only the 6-op subset, so the router never exposes a verb the target cannot perform.

### Permissions

The bare-metal deploy lifecycle compiles binaries, manages OS services, writes release/secret material, and health-probes the running service, so a host binary embedding this surface must grant:

| Permission      | Why                                                                              |
| --------------- | -------------------------------------------------------------------------------- |
| `--allow-run`   | `deno compile` the service binaries and invoke `servy` / `systemctl` / `icacls`. |
| `--allow-read`  | Read the workspace config, entrypoints, and release/secret files.                |
| `--allow-write` | Emit compiled binaries, release directories, the `current` link, and env files.  |
| `--allow-net`   | Health-probe the activated service (`FetchHealthProbe`).                         |
| `--allow-sys`   | Resolve the host OS/triple to pick the Servy vs. systemd adapter and target.     |
| `--allow-env`   | Read the deploy owner principal for the Windows secret-file ACL.                 |

---

## ☁️ Deno Deploy target

`netscript deploy deno-deploy <op>` deploys a workspace to
[Deno Deploy](https://deno.com/deploy). Supported operations: `plan` (preflight
only), `up` (`deno deploy [--prod]`), `down`, `status`, `logs`. Configure defaults
under `deploy.targets['deno-deploy']` in `netscript.config.ts`
(`org`/`app`/`prod`/`entrypoint`/`envFile`) or pass
`--org`/`--app`/`--prod`/`--entrypoint`/`--env-file`; flags override config. `up
--dry-run` runs `plan` without pushing.

`plan`/`up` first run an unstable-API guard: `up --prod` **refuses** to push when
the project uses APIs that require `--unstable-*` flags (e.g. `Deno.openKv`,
`Deno.cron`, `BroadcastChannel`, `Temporal`), which Deno Deploy rejects; preview
pushes warn but proceed.

### Permissions

The deploy subcommands shell out to the `deno deploy` CLI and read project files,
so a host binary embedding this surface must grant:

| Permission     | Why                                                               |
| -------------- | ----------------------------------------------------------------- |
| `--allow-run`  | Spawn the `deno deploy` CLI (`plan`/`up`/`down`/`status`/`logs`). |
| `--allow-read` | Read `deno.json` + the entrypoint for the unstable-API guard.     |
| `--allow-net`  | The `deno deploy` CLI uploads to and queries the platform.        |
| `--allow-env`  | The `deno deploy` CLI reads auth/token environment variables.     |

Authentication is delegated to the `deno deploy` CLI (its token/login flow); this
surface issues no credentials of its own.

---

## ☸️ Aspire Kubernetes, Azure, and Docker-image cloud targets

`netscript deploy kubernetes <op>` and
`netscript deploy azure-aca|azure-app-service|azure-aks|cloud-run <op>` are thin
routers over target adapters. Supported operations are:

- `plan` / `emit`: for Kubernetes/Azure, validate the AppHost platform marker
  and run `aspire publish --apphost <path> --output-path <dir>`; for Cloud Run,
  preflight the configured image reference.
- `up`: for Kubernetes/Azure, run
  `aspire deploy --apphost <path> --output-path <dir>`; for Cloud Run, run
  `docker build`, `docker push`, then `gcloud run deploy`.
- `down`: for Kubernetes/Azure, run
  `aspire destroy --apphost <path> --output-path <dir> --yes`; for Cloud Run,
  run `gcloud run services delete`.

For AppHost-backed targets, configure `deploy.targets.<target>.appHost` when the
default `aspire/apphost.mts` is not the right entrypoint, and
`deploy.targets.<target>.outputPath` when `.deploy/<target>` is not the desired
artifact directory. The CLI deliberately does not pass platform names as
`aspire --environment`; that flag is a deployment profile, while platform
selection belongs in AppHost code such as `builder.addKubernetesEnvironment(...)`
and `publishAsKubernetesService(...)`.

For Cloud Run, configure `deploy.targets['cloud-run'].registry` and
`deploy.targets['cloud-run'].imageName`. The adapter builds
`<registry>/<imageName>`, pushes it, and deploys that image with `gcloud run
deploy <service> --image <registry>/<imageName>`.

### Cloud prerequisites

Cluster and cloud authentication are intentionally operator-owned:

| Target                                          | Prerequisites                                                                                                                                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kubernetes`                                    | `aspire add kubernetes`, a configured `kubectl` context, Helm 4.2+, and a registry reachable by the cluster.                                                                        |
| `azure-aca` / `azure-app-service` / `azure-aks` | Azure CLI login, subscription/location parameters, and the matching Azure hosting integration in the AppHost. AKS also needs `kubectl`, Helm, and RBAC that can manage the cluster. |
| `cloud-run`                                     | Docker, Google Cloud CLI auth, Artifact Registry or compatible Docker registry access, and Cloud Run IAM/RBAC that can push the image and update the service.                       |

NetScript does not mint cloud credentials, assign RBAC, or hand-author Helm,
Bicep, Kubernetes, or Azure provider manifests in the CLI. Kubernetes/Azure
adapters delegate to Aspire after AppHost validation; Cloud Run owns only the
Docker image build/push/apply seam.

---

## Agent tooling

Install the version-matched NetScript skills and MCP host configuration from a project root:

```bash
netscript agent init
```

Claude Code receives `.mcp.json`, the NetScript skill bundle under `.claude/skills/`, and a marked
section in `AGENTS.md`. VS Code receives `.vscode/mcp.json`. Host directories are detected, or use
`--host claude`, `--host vscode`, or `--host all` explicitly. Re-running the command preserves
other host configuration and leaves unchanged files alone.

The installed server entry runs `netscript agent mcp`. Prefer ordinary CLI commands for direct,
repeatable operations; use MCP for bounded telemetry aggregation, cross-domain diagnostics, and the
public-docs search-to-get workflow. The MCP data boundary covers telemetry, project metadata,
generated registries, and public docs—never project source, environment values, credentials, or
secrets.

See [Agent tooling](https://rickylabs.github.io/netscript/capabilities/agent-tooling/) for the full
13-tool catalog and command policy.

## 📖 Documentation

- **Reference**: [rickylabs.github.io/netscript/reference/cli/](https://rickylabs.github.io/netscript/reference/cli/)
- **Author a plugin (how-to)**: [rickylabs.github.io/netscript/how-to/author-a-plugin/](https://rickylabs.github.io/netscript/how-to/author-a-plugin/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE).
Published to JSR with cryptographically verified provenance.
