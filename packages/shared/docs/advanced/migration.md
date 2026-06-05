---
title: Shared Migration Notes
description: Alpha migration notes for shared package consumers.
package: '@netscript/shared'
order: 31
---

# Migration

## Alpha root surface

Consumers should import from `@netscript/shared` only. The package does not publish `./utils`.

## Datetime helpers

The old unpublished `packages/shared/utils/datetime.ts` helper has been deleted. Temporal is stable
in the target Deno runtime, so callers should use `Temporal` directly or introduce a package-owned
clock/scheduler port when time is part of runtime behavior.

## Workspace compatibility

Some later-wave plugins still use the local `@shared/utils` alias for non-datetime helpers. That
compatibility path is not part of the JSR package surface.
