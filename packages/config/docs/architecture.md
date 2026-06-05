---
title: Config Architecture
description: Architecture notes for @netscript/config.
package: '@netscript/config'
order: 1
---

# Config Architecture

This package implements the Archetype 2 (Integration) pattern for the foundation run because plugin
manifests consume config schema fragments, scaffold constants, and merge logic.

```
domain schemas -> public barrel -> package root
merge          -> plugin contribution application use case
paths          -> scaffold constants
diagnostics    -> inspectConfig
```

The root `mod.ts` is a barrel. `src/public/mod.ts` curates exports. Schema files under `src/domain/`
split the former monolithic schema into named configuration concerns.

The main axioms are A1 public types first, A8 one concern per file, A10 composition root over hidden
state, and A14 publish gates preserve doctrine.

Avoided anti-patterns include AP-1 monolithic files, AP-11 hidden globals, and AP-14 upstream
re-exporting.
