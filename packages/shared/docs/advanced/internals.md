---
title: Shared Internals
description: Contributor notes for the shared package implementation.
package: '@netscript/shared'
order: 32
---

# Internals

The implementation is split by doctrine role:

- `src/domain/` owns constants, schemas, result types, and schema contracts.
- `src/application/` owns the oRPC base contract and schema helper factories.
- `src/diagnostics/` owns inspection.
- `src/public/` curates the published root surface.

Runtime schemas may use Zod directly, but public signatures should expose package-owned types so JSR
documentation stays stable and slow-type free.
