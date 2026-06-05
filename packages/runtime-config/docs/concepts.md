---
title: Runtime Config Concepts
description: Glossary and invariants for runtime override loading.
package: "@netscript/runtime-config"
order: 2
---

# Concepts

## Runtime Directory

The directory that contains the `current` pointer and versioned topic files.

## Pointer

The `current` file identifies the active runtime config version. It may be JSON or a plain semantic
version string.

## Topic

A topic is one section of runtime config: jobs, sagas, triggers, features, or tasks.

## Snapshot

`RuntimeConfig` is the complete loaded snapshot. It is immutable by convention and should be treated
as input to the caller's runtime policy.

## Invariants

- Missing files do not crash startup.
- Missing topic files produce empty arrays.
- Watchers reload snapshots and call the consumer callback.
- Diagnostics are returned as structured values, not emitted by package code.
