# Plan & Design — READY FOR REVIEW

## Locked decisions

1. Preserve #2499's single compensation/inbound transition commit path. Production changes only if fault proofs expose a remaining defect; do not duplicate already-correct logic.
2. Add compensation-specific fault/retry regression on persisted Deno KV, real Redis, ordinary Prisma/PostgreSQL and command-capable Prisma/PostgreSQL. Assert stored envelope, history, digest and correlation, retry using the same outcome, and duplicate replay writes nothing. Include terminal compensated, failed-error outcome where useful, and a chained compensation outcome.
3. KV/Redis failure injects at the storage atomic-call boundary after all mutations are assembled (there is no legitimate between-writes window). Assert replay+state+history in the same batch and no rows change on a rejected commit. Also test commit-success/acknowledgement-loss recovery. PostgreSQL injects after actual applied-key write and before state write in the transaction. Never weaken the atomic contract to manufacture a window.
4. Negative controls restore the former reservation-before-save compensation path in an isolated verification worktree, retaining the new tests. Each provider's failure/retry assertion must go red. Record exact mutation and failed cases.
5. Document the guarantee for each shipped store and refusal of granular custom stores in the saga plugin README. Scheduled/cascaded delivery recovery stays out of scope.

## Slices

0. Bootstrap this run and draft PR; independent PLAN-EVAL must PASS before implementation.
1. Compensation provider fault proofs, guarantee docs and any minimal exposed repair, plus run records. Gates: structured test/check/lint/fmt, quality:gate, JSR package audit; independent read-only slice review before sign-off. Files: packages/plugin-sagas-core/tests/runtime/saga-compensation-retry_test.ts, tests/fixtures/transition-store/postgres-conformance.ts.template, a focused reusable test fixture if needed, plugins/sagas/README.md, this run. Runtime/store edits only if justified by a failing proof.
2. Evidence/review handoff only if necessary: same-session independent IMPL-EVAL, mark PR ready, inspect CI snapshot and review threads; final IMPL-EVAL exact pushed head. No merge.

## Gates, risks and decisions

Structured focused tests with real providers first, followed by the core/runtime suite; source check/lint/fmt wrappers on changed TS files; quality:gate includes configured architecture scans. Use existing package JSR audit and doc-lint; compare inherited findings before classifying. No dependencies or lock changes.

Risk: a failure injected only before atomic dispatch does not prove a physically partial transaction. Mitigation: assert batch contents, use actual database row-write failure for PostgreSQL, and run the old broken path as a negative control. Reopen the persisted providers for retry when practical. Risk: injected failure after successful commit can be ambiguous; same-outcome replay must return committed false without another history row.

Safe to defer: full scaffold.runtime is expressly prohibited locally; coordinator must arm e2e-cli-gate and obtain its CI verdict. No open implementation decision requires owner input. Acceptance remains unchecked if any provider cannot be proved. No new architectural debt accepted; existing post-commit effects recovery remains deferred.


## CI repair — locked scope extension

Failure run 41189386045, PostgreSQL tier: runtime.aspire-start fails because Garnet exits with a missing restored local dotnet tool. The generated helper swallows dotnet tool restore errors under a ten-second bound. Existing CI prep fetches container images, but does not prepare the executable Garnet tool used by the same suite. SQLite/Garnet and every core shard pass. Latest main workflow's runtime tiers pass (its separate desktop job fails); predecessor #2499 also has both runtime tiers green. The missing tool is directly evidenced; a cold/failed NuGet restore is the mechanism suggested by the helper, not a claimed observed timeout. An external unchanged retry is currently live; do not duplicate it or weaken any gate.

Repair the missing CI prerequisite at the existing prep entrypoint: restore garnet-server using SCAFFOLD_VERSIONS.GARNET_TOOL and an isolated local manifest before starting the one-pass runtime suite in either tier. Use a finite 120-second restore bound and inherited stdout/stderr, propagate every nonzero exit or timeout, and leave all suite assertions/readiness limits intact. This warms both the NuGet package cache and dotnet's local tool resolver cache. No new dependency pin or generated product changes.

Slice 2 files: `.llm/tools/e2e/prepull-runtime-images.ts`, existing prep tests, and this run record. Gates: structured focused prep tests and check/lint/fmt; real local pinned tool restore plus resolution from a second manifest if the SDK is available; existing quality gate. Negative control removes preflight and confirms the prerequisite regression test fails. Hosted full e2e-cli remains required; no local full scaffold.runtime per original host scheduling rule. Independent PLAN-EVAL round 2 before editing; IMPL-EVAL round 4 before sign-off and final round 5 at pushed repaired head.
