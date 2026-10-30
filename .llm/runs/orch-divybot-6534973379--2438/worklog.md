# Worklog

## Design

1. Public surface: existing telemetry exports unchanged; shared API dependency floor 1.10.0. Internal fixtures run frozen against the committed graph.
2. Domain vocabulary: fixture lock = private copy of committed lock; frozen = missing or drifted resolution exits nonzero.
3. Ports: native Deno config/lock resolver, filesystem and subprocess API; no new production ports.
4. Constants: committed deno.lock is dependency authority; explicit --lock / --frozen are subprocess policy. Existing exact Prisma 7.10.0 retained.
5. Commit slices: bootstrap plan; API + fixture freeze + regression gates; final evidence. Detailed files/gates in plan.md.
6. Deferred scope: unrelated dependency upgrades, production saga behavior, scaffolding, merge and release.
7. Contributor path: .llm/tools/testing/locked-fixture.ts explains and implements fixture-lock policy for future consumers.

## Routing

Owner override recorded verbatim in supervisor.md. PLAN-EVAL must PASS before implementation. Independent reviewer must review final exact pushed head. No self-certification.

## Bootstrap reconcile

Issue open, branch equals current main. No existing PR covers the fix. Specific owner instruction keeps PR draft, uses Refs, and reserves final readiness/merge to coordinator. Acceptance on main remains post-merge/unproven.
