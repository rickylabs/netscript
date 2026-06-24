# @netscript/aspire

[![JSR](https://jsr.io/badges/@netscript/aspire)](https://jsr.io/@netscript/aspire)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**SDK-neutral Aspire diagnostics, `appsettings.json` parsing, and AppHost composition ports for
NetScript. It turns plain config data into validated resource graphs without leaking any Aspire SDK
type into your signatures.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/aspire

# Node.js / Bun
npx jsr add @netscript/aspire
bunx jsr add @netscript/aspire
```

### Usage

```typescript
import { inspectAspire } from '@netscript/aspire';

// Inspect an AppHost target and render a JSON-stable diagnostic report.
const report = inspectAspire('./dotnet/AppHost');

console.log(report.summary);
console.log(report.details);
```

Validating an `appsettings.json` file before composition uses the `config` subpath:

```typescript
import { parseAppSettings } from '@netscript/aspire/config';

const { config, warnings } = await parseAppSettings('dotnet/AppHost/appsettings.json');

console.log(config.Name); // "test-app"
for (const warning of warnings) console.warn(warning);
```

---

## 📦 Key Capabilities

- **SDK-neutral by contract**: Every function takes plain data and returns plain data. No Aspire SDK
  type appears in any public signature, so diagnostics and composition stay testable.
- **Validated config parsing**: `parseAppSettings` reads `appsettings.json`, validates it against
  Zod schemas (`@netscript/aspire/schema`), resolves key-dependent defaults, and reports
  cross-reference issues.
- **AppHost composition ports**: `@netscript/aspire/application` exposes `composeAppHost`, the
  `ContributionRegistry`, deterministic port allocation, and resolver helpers that turn config
  entries into Aspire resources.
- **Pluggable builder adapter**: `@netscript/aspire/adapters` provides the `AspireTypeScriptBuilder`
  port that emits AppHost resources, plus environment-source resolution.
- **First-class test surface**: `@netscript/aspire/testing` ships an in-memory builder, the
  `AspireNSPluginContribution` base class, and deterministic fixtures for plugin authors writing
  composition tests.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/aspire/](https://rickylabs.github.io/netscript/reference/aspire/)
- **Orchestration & Runtime**:
  [rickylabs.github.io/netscript/orchestration-runtime/](https://rickylabs.github.io/netscript/orchestration-runtime/)
- **Deploy locally with Aspire**:
  [rickylabs.github.io/netscript/how-to/deploy-local-aspire/](https://rickylabs.github.io/netscript/how-to/deploy-local-aspire/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
