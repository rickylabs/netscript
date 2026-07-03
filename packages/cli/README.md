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

The bare-metal targets implement the canonical `plan` / `emit` / `up` / `down` / `status` / `logs` operations (with `build` / `install` / `uninstall` retained as verb aliases). `rollback` and `secrets` are declared-unsupported for now and are tracked for a later deployment-hardening release.

---

## 📖 Documentation

- **Reference**: [rickylabs.github.io/netscript/reference/cli/](https://rickylabs.github.io/netscript/reference/cli/)
- **Author a plugin (how-to)**: [rickylabs.github.io/netscript/how-to/author-a-plugin/](https://rickylabs.github.io/netscript/how-to/author-a-plugin/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE).
Published to JSR with cryptographically verified provenance.
