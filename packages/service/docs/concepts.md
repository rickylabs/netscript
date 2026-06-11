# Concepts

## Service Router

The router is caller-owned and passed into the builder. The service package does not hide routers
inside global registries or force a listener.

## Service App

`ServiceApp` is the mountable app returned by `build()`. It exposes Web Platform request handling
without requiring callers to name Hono in their public types.

## Running Service

`RunningService` is the lifecycle handle returned by `serve()` and `defineService()`. It contains
the app, assigned listener address, and an async `stop()` method.

## Health Checks

Health checks are named async probes. The default endpoints are `/health`, `/health/live`, and
`/health/ready`.
