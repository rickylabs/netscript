# Research — fix-doctor-service-entrypoint-unpublished--w5-a

## Re-baseline

- Carried-in source: owner brief and release PR #1624 failure report.
- Re-derived against `main` @ `9a7cadcaa9066970e931ed6abf1e61b65fcef20e` on 2026-08-12.
- The worktree is clean, the branch matches the requested branch, and `HEAD == origin/main`.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `checkServiceEntrypoint` catches every `loadJsrExportMap` exception and returns an `error`; it has no exact-404 exclusion path. | `doctor-plugin-use-case.ts:424-453` |
| 2 | `fetchJsrExportMap` throws a message-only `Error` for every non-OK response, so callers cannot structurally distinguish 404 from 503. | `public/infra/jsr/fetch-jsr-export-map.ts` |
| 3 | Doctor warnings are rendered by name and do not fail the command; only aggregate `error` reports produce exit 1. | `doctor-plugin-command.ts` |
| 4 | The #1597 E2E predicate checks the exact version metadata URL, returns only on `response.status === 404`, and throws on every other non-OK response. | `e2e/.../package-backed-plugin-version.ts` |
| 5 | Release PR #1624 targets `main`, has no linked issue or acceptance checklist, and fails before 0.0.6 exists on JSR. | GitHub PR #1624 metadata and owner brief |
| 6 | Doctrine verdict for `packages/cli` is Archetype 6 / Keep: preserve the kernel/surface split. | doctrine file 10 verdict table |

## jsr-audit surface scan

- Surface scanned: the internal doctor use case and JSR export-map adapter. No `mod.ts`, export map,
  package metadata, or public symbol surface changes are planned.
- Slow-type / surface risks: none. New error/result vocabulary will remain internal and explicitly typed.
- Publish/runtime risk: a published exact version must still load and validate the `./services` export.

## Open questions

- None. The owner contract fixes the exact status predicate, reporting behavior, and three tests.

