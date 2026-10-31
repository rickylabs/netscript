# Plan & Design — READY FOR REVIEW

## Locked decisions

Deliver #2108 as a consumer acceptance capstone. Preserve existing shared store resolver and explicit projection seam from merged #2300/#2343; fix source only for a demonstrated acceptance defect. Archetype 6 CLI/tooling, with Archetype 5 plugin runtime subjects and docs overlay. No public exports, dependencies or novel extension axes planned; JSR surface/slow-type risk is unchanged (test/fixture/docs-only wave). Doctrine A7/A12/A13: reuse CLI, Web APIs and existing durable stores; assert committed state and duplicate replay rather than process labels alone.

Create an opt-in proof under `packages/cli/e2e/fixtures/kv-only/`. It initializes a clean local-source consumer with `--db none`, installs workers/sagas/triggers with `--no-db` and auth kv-oauth, generates plugins/runtime schemas and runs doctor. Assert no DB metadata, SQL model, injected DB environment or DB bootstrap. Scaffold-only regression runs without Aspire. Full proof starts isolated Aspire, resolves exact resources/endpoints, requires every application resource healthy plus background readiness, and executes a job, saga and trigger on KV. Prove saga replay and a runner outside Aspire. Always stop only the owned AppHost. Preserve sanitized per-step evidence; failures remain unproven.

## Slices and gates

1. S0 bootstrap: this run's plan/design records and independent PLAN-EVAL; commit/push and draft PR.
2. S1 acceptance fixture + consumer regression (`packages/cli/e2e/fixtures/kv-only/*`, `packages/cli/src/local/composition/kv-only-plugins_test.ts`), any demonstrated scoped fixes/tests. Gates: structured check/test/lint/fmt, quality:gate, focused existing saga tests; separate slice review before sign-off commit.
3. S2 execute full KV-only consumer proof and negative controls, document exact supported recipe/migration and proof limits; update generated doc carriers and run evidence. Gates: opt-in proof, relevant docs generation/accuracy/freshness checks, independent IMPL-EVAL. Commit/push then ready; final separate evaluation on exact pushed head.

## Risks and mitigations

- Missing KV/no-db runtime suite: opt-in acceptance command only; request coordinator-owned scaffold.runtime CI and propose adding a minimal KV tier separately.
- Aspire/remote-container reachability: use supported executable cache mode if needed; never weaken readiness checks or claim an unexecuted gate.
- Empty registries prove startup only: author and generate real userland job/saga/trigger definitions, then inspect durable effects.
- Shared host: isolated AppHost and exact-path cleanup; foreign resources untouched.
- Baseline/generated carrier drift: smallest required generators/checks; no unrelated formatting or lock mutation.

## Open decisions / deferred scope / debt

No must-resolve public-contract decision. Engine/process details follow existing runtime APIs after PLAN-EVAL; execution results determine fixes within the declared write surface. New CI tier deferred for explicit coordinator agreement; no release or merge. No accepted architecture debt. Full scaffold.runtime is explicitly forbidden locally; e2e-cli CI verdict is requested at READY.
