---
title: Logger Concepts
description: Core vocabulary for NetScript logging categories, context, and framework integrations.
package: '@netscript/logger'
order: 2
---

# Logger Concepts

## Category Hierarchy

A category hierarchy is the ordered name path LogTape uses to route a log record. NetScript service
loggers use `netscript.services.<service>`, package loggers use `netscript.packages.<package>`,
worker loggers use `netscript.workers.<worker>`, and job loggers use `netscript.jobs.<job>`.

## Configuration

Configuration is the one-time LogTape setup performed by `configureLogging` or `ensureLogging`.
Environment defaults choose text logs for local development and JSON logs for production-like
runtimes. Tests can call `resetLogging` to clear the package state before the next scenario.

## Context

Context is structured metadata attached to a log flow. The package exposes LogTape `withContext`
from the root entrypoint, and the Hono middleware populates `requestId`, `method`, and `path` around
the downstream handler.

## Framework Edges

Framework edges are subpaths that know about a specific runtime surface. `./middleware` is the Hono
edge, and `./orpc` is the RPC edge. Keeping them separate protects the root package from unnecessary
framework imports.

## Request Identifier

The request identifier is read from `X-Request-ID` when available and generated when missing. The
middleware stores it on the request context and includes it in request logs so service logs can be
correlated without parsing message text.
