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
- Exact `0.0.5-canary.15` quickstart passed the previously failing service-add boundary and completed cleanup with no run-owned survivors.

### Merge-readiness receipts

| Gate | Result |
| --- | --- |
| Focused worker-rewrite + quickstart suite tests | exit 0; 10 passed, 0 failed |
| Scoped check (`packages/cli/e2e`, `ts,tsx`) | exit 0; 131 selected, 0 findings |
| Scoped lint (`packages/cli/e2e`, `ts,tsx`) | exit 0; 131 selected, 0 findings |
| Scoped format (`packages/cli/e2e`, `ts,tsx`) | exit 0; 131 selected, 0 findings |
| `deno task quality:gate` | exit 0; existing warnings only |
| Published quickstart (`quickstart.walk`, `jsr:@netscript/cli@0.0.5-canary.15`) | exit 0; 10 passed, 0 failed |
| Canonical `scaffold.runtime` one-pass gate | exit 0; 76 passed, 0 failed; `runtime.flow-b-fixture` passed |
| Final run-owned leak check | exit 0; Aspire/Docker probes ok; zero run-owned survivors |

- Reconcile: issue #1345 and draft PR #1346 remain the sole 0.0.5 repair cluster; #1343 remains deferred to 0.0.6 and is not duplicated.
- Resource hygiene: 15 foreign and 3 unproven resources were reported and left untouched.
- Lock hygiene: repair/release `deno.lock` hashes remain `d32ef0c1f2b9256e05cf7339c452bd8cf6addeb9a4b433d38abcee992651b529`; protected coordination hash remains `1c4d59cc38c00742997d3c20dc39ae79b7966891422969b7b444d76642d0ccc1`.
- Next hard gate: independent IMPL-EVAL on the frozen current head through the canonical DeepSeek V4 Flash 0731 max route.
