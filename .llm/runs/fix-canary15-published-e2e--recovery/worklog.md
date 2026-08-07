# Worklog

## Design

Keep product and test seams semantic and narrow:

- rewrite the adjacent `--config` value independently of line formatting;
- keep quickstart step 3 scoped to the service it adds, then retain the generated whole-project task at documented step 6 after Aspire restore and Prisma generation.

Do not weaken file selection, remove the AppHost batch, rerun the already-valid W1-B evaluator, or change canary.15 artifacts.

## 2026-08-07 — diagnosis

- Parent workflow: `31196590524` — publish complete, pinned pair failed.
- Child workflow: `31196896495` — public init passed; scaffold runtime and quickstart failed.
- Local exact-version quickstart reproduced the seeded Prisma mismatch and missing AppHost TypeScript install.
- PLAN-EVAL recorded N/A before implementation.

## 2026-08-07 — implementation

- Refined three observed symptoms into two roots: the Prisma/AppHost errors shared one cause, a premature whole-project check.
- Added formatting/newline and missing-config coverage for the published workers argument rewrite.
- Changed quickstart step 3 from the whole-project task to `deno check --unstable-kv services/users`; step 6 remains unchanged.
- Focused tests: 10 passed, 0 failed.
- Exact `0.0.5-canary.15` quickstart passed the previously failing service-add boundary and completed cleanup with no run-owned survivors; a fresh terminal-output receipt remains scheduled with the final gate pass.
