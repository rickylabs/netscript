---
title: Database Concepts
description: Glossary for @netscript/database contracts, adapters, tracing, and extensions.
package: '@netscript/database'
order: 2
---

# Database Concepts

## Adapter

An adapter implements `DatabaseAdapter` for a concrete backend. It owns driver-specific wiring but
not the application schema.

## Port

The port is the small database behavior contract consumed by NetScript packages. It lives in
`ports/` and is tested through `./testing`.

## Provider

A provider names a backend family such as `postgres`, `mssql`, `mysql`, or `sqlite`.

## SQL JSON Extension

The SQL JSON extension serializes and deserializes fields stored as strings when a backend lacks a
native JSON type for the selected schema.

## Tracing

Tracing helpers wrap Prisma operations so callers can attach structured spans without creating
global telemetry state inside the package.
