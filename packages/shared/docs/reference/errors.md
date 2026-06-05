---
title: Shared Errors Reference
description: Common error payloads and schemas for NetScript contract packages.
package: '@netscript/shared'
order: 23
---

# Errors

Shared error payloads are plain data objects that oRPC error definitions can carry.

- `NotFoundError` / `NotFoundErrorSchema`
- `ValidationError` / `ValidationErrorSchema`
- `UnauthorizedError` / `UnauthorizedErrorSchema`
- `ForbiddenError` / `ForbiddenErrorSchema`
- `RateLimitError` / `RateLimitErrorSchema`
- `ServiceUnavailableError` / `ServiceUnavailableErrorSchema`

Use `notFound()` when the route path can identify the resource type. Pass an explicit message when a
handler needs domain-specific wording.
