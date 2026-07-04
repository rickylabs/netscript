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
import { createPublicCli } from "@netscript/cli";

// Build the public NetScript command tree against host-supplied services.
const cli = createPublicCli({
  cwd: () => Deno.cwd(),
  resolvePath: (path = ".") => new URL(path, `file://${Deno.cwd()}/`).pathname,
});

await cli.parse(["--help"]);
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

| Permission     | Why                                                                              |
| -------------- | -------------------------------------------------------------------------------- |
| `--allow-run`  | `deno compile` the service binaries and invoke `servy` / `systemctl` / `icacls`. |
| `--allow-read` | Read the workspace config, entrypoints, and release/secret files.                |
| `--allow-write`| Emit compiled binaries, release directories, the `current` link, and env files.  |
| `--allow-net`  | Health-probe the activated service (`FetchHealthProbe`).                          |
| `--allow-sys`  | Resolve the host OS/triple to pick the Servy vs. systemd adapter and target.      |
| `--allow-env`  | Read the deploy owner principal for the Windows secret-file ACL.                 |

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

| Permission     | Why                                                            |
| -------------- | ------------------------------------------------------------- |
| `--allow-run`  | Spawn the `deno deploy` CLI (`plan`/`up`/`down`/`status`/`logs`). |
| `--allow-read` | Read `deno.json` + the entrypoint for the unstable-API guard. |
| `--allow-net`  | The `deno deploy` CLI uploads to and queries the platform.    |
| `--allow-env`  | The `deno deploy` CLI reads auth/token environment variables. |

Authentication is delegated to the `deno deploy` CLI (its token/login flow); this
surface issues no credentials of its own.

---

## 📖 Documentation

- **Reference**: [rickylabs.github.io/netscript/reference/cli/](https://rickylabs.github.io/netscript/reference/cli/)
- **Author a plugin (how-to)**: [rickylabs.github.io/netscript/how-to/author-a-plugin/](https://rickylabs.github.io/netscript/how-to/author-a-plugin/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE).
Published to JSR with cryptographically verified provenance.
