# @netscript/logger

[![JSR](https://jsr.io/badges/@netscript/logger)](https://jsr.io/@netscript/logger)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**Structured logging for NetScript services, packages, workers, and jobs, built on
[LogTape](https://logtape.org/). Configure once at startup, then create category-scoped loggers and
attach request-scoped context across the runtime.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/logger

# Node.js / Bun
npx jsr add @netscript/logger
bunx jsr add @netscript/logger
```

### Usage

```typescript
import { configureLogging, createServiceLogger } from '@netscript/logger';

await configureLogging({ level: 'info' });

const logger = createServiceLogger('users');

logger.info('Service starting', { port: 3000 });
```

`configureLogging()` is environment-aware: human-readable text in local development, structured JSON
in production. Use `ensureLogging()` when shared startup paths may run more than once, and
`withContext()` to bind request-scoped fields onto every record emitted within a callback.

---

## 📦 Key Capabilities

- **Category-scoped creators**: `createServiceLogger`, `createPackageLogger`, `createWorkerLogger`,
  `createJobLogger`, and `createChildLogger` produce loggers with a consistent NetScript category
  hierarchy.
- **One-shot configuration**: `configureLogging` and `ensureLogging` set up LogTape with
  environment-aware sinks; `isLoggingConfigured` and `resetLogging` cover lifecycle and test
  isolation.
- **Hono request logging**: `@netscript/logger/middleware` exposes `loggerMiddleware`, injecting a
  request-scoped logger and request ID and logging start, completion, and failure with
  sensitive-field redaction.
- **oRPC integration**: `@netscript/logger/orpc` exposes `LoggingPlugin` and `createLoggingPlugin`
  to log oRPC handler and client interceptions.
- **LogTape contract re-exported**: `getLogger`, `getConsoleSink`, `configure`, `withContext`, and
  the `Logger`, `LogRecord`, `LogLevel`, and `Sink` types pass through unchanged.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/logger/](https://rickylabs.github.io/netscript/reference/logger/)
- **Observability**:
  [rickylabs.github.io/netscript/observability/](https://rickylabs.github.io/netscript/observability/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
