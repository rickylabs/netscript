# Research

## Release receipts

- Fresh canary workflow `31196590524` passed budget preflight, readiness, provisioning, dry-run, graph preflight, and OIDC publication.
- `0.0.5-canary.15` is complete on JSR for all 35 effective workspace members.
- Exact pinned production E2E `31196896495` failed from tag commit `85eb9352d301aeee470dd62aa5dd5e8257d47858`.

## Root causes

1. `configurePublishedWorkersBlock` assumes the generated Deno argument list remains on one line. W1-B deliberately formats generated `.mts`, so the config pair now spans whitespace/newlines and the fixture reports a false missing-argument failure.
2. Quickstart step 3 invokes the new whole-project task before the documented Aspire restore and Prisma generation steps. Its Prisma/AppHost errors are expected pre-generation state reached out of order, not separate product-template defects. Step 3 needs a targeted service check; step 6 remains the authoritative whole-project check after prerequisites.

The missing PGDATA receipt follows the aborted quickstart setup and is not an independent root cause.

## Scope boundary

Repair the SHA/tag-pinned production release gate only. #1343 remains the separate 0.0.6 smoke from outside the framework checkout and is neither closed nor claimed by this run.
