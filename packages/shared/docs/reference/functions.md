---
title: Shared Functions Reference
description: Public functions and factories exported by the shared package.
package: '@netscript/shared'
order: 21
---

# Functions

## Contract and errors

- `baseContract` — oRPC contract primitive with shared error definitions.
- `getResourceType(options)` — resolves a singular resource name from handler path segments.
- `notFound(options)` — throws the shared `NOT_FOUND` oRPC error.

## Validation factories

- `positiveInt(options)`
- `nonNegativeInt(options)`
- `paginationLimit(options)`
- `paginationOffset(options)`
- `boundedString(options)`
- `positiveNumber(options)`
- `nonNegativeNumber(options)`
- `stringToNumber(outputSchema)`
- `stringToInt(outputSchema)`

## Diagnostics

- `inspectShared(target)` — returns a JSON-stable inspection report.
