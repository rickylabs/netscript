---
title: KV Concepts
description: Glossary for @netscript/kv keys, stores, watches, providers, and testing contracts.
package: '@netscript/kv'
order: 2
---

# KV Concepts

## Adapter

An adapter implements the KV behavior against a concrete backend. Current adapters cover Deno KV,
Redis, Kvdex bridging, and process-local memory.

## Key

A key is a readonly array of string-compatible parts. The array shape stays compatible with
`Deno.Kv` and with NetScript queue integrations that share the same storage boundary.

## Provider

A provider names the backend selected by the shared lifecycle helpers. Provider detection can use
explicit options or environment variables supplied by the application.

## Store

`KvStore` is the base contract for reading, writing, deleting, listing, and closing state. Callers
write against the contract so tests can replace the backend with memory.

## Watch

`WatchableKv` extends the store with `watch` and `watchPrefix`. Use watches for live state streams
instead of sentinel keys that force callers to reload an entire collection.

## Testing Contract

The `@netscript/kv/testing` subpath exposes the in-memory adapter and `runKvStoreContract`. Custom
adapters should run that contract before they are used by a package or plugin.
