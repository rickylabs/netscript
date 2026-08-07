# Worklog

## Design

Keep product and test seams semantic and narrow:

- rewrite the adjacent `--config` value independently of line formatting;
- make the seeded database script use the API already guaranteed by the seeded and generated Prisma clients;
- provision AppHost dependencies at the quickstart boundary that newly requires them, before the whole-scaffold check.

Do not weaken file selection, remove the AppHost batch, rerun the already-valid W1-B evaluator, or change canary.15 artifacts.

## 2026-08-07 — diagnosis

- Parent workflow: `31196590524` — publish complete, pinned pair failed.
- Child workflow: `31196896495` — public init passed; scaffold runtime and quickstart failed.
- Local exact-version quickstart reproduced the seeded Prisma mismatch and missing AppHost TypeScript install.
- PLAN-EVAL recorded N/A before implementation.
