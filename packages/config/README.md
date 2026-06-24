# @netscript/config

[![JSR](https://jsr.io/badges/@netscript/config)](https://jsr.io/@netscript/config)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The typed project-configuration surface for NetScript: author a project config once with
`defineConfig`, load and cache it at startup with `initConfig`, and read a validated
`NetScriptConfig` that framework packages, the CLI, and generators consume.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/config

# Node.js / Bun
npx jsr add @netscript/config
bunx jsr add @netscript/config
```

### Usage

Define a project config once in `netscript.config.ts`:

```typescript
import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'orders',
  version: '1.0.0',
  databases: {
    active: 'postgres',
    config: [{ provider: 'postgres', schema: 'database/postgres/schema' }],
  },
  services: {
    api: { port: 3000 },
  },
});
```

Load and cache it at process startup, then read the validated config synchronously:

```typescript
import { getConfig, initConfig, inspectConfig } from '@netscript/config';

await initConfig();
const config = getConfig();

const report = inspectConfig(config);
console.log(report.summary);
```

---

## 📦 Key Capabilities

- **Typed authoring**: `defineConfig` and `defineConfigAsync` validate a `NetScriptConfig` at
  definition time; `defineConfigAsync` resolves topology that depends on the current command or
  environment mode.
- **Loader and runtime cache**: `loadConfig`, `initConfig`, `getConfig`, `isConfigLoaded`, and
  `clearConfigCache` resolve the authored config once and serve the validated object synchronously
  to the rest of the process.
- **Environment helpers**: `resolveEnv`, `getEnv`, `hasEnv`, and the `getMode` / `isDev` / `isProd`
  / `isTest` mode predicates read typed, coerced environment variables.
- **Workspace discovery**: `discoverWorkspace`, `findWorkspaceRoot`, `findMember`, and
  `getMemberEntrypoint` classify Deno workspace members for the CLI and generators.
- **Subpath schemas without Zod leakage**: `@netscript/config/merge` folds plugin-contributed config
  fragments, `@netscript/config/paths` exposes scaffold constants, and
  `@netscript/config/schema/plugins` validates appsettings plugin entries — kept off the root
  surface so it never leaks Zod internals.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/config/](https://rickylabs.github.io/netscript/reference/config/)
- **Orchestration & Runtime**:
  [rickylabs.github.io/netscript/orchestration-runtime/](https://rickylabs.github.io/netscript/orchestration-runtime/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
