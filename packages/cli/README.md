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

---

## 📖 Documentation

- **Reference**: [rickylabs.github.io/netscript/reference/cli/](https://rickylabs.github.io/netscript/reference/cli/)
- **Author a plugin (how-to)**: [rickylabs.github.io/netscript/how-to/author-a-plugin/](https://rickylabs.github.io/netscript/how-to/author-a-plugin/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE).
Published to JSR with cryptographically verified provenance.
