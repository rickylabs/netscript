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

## PLAN-EVAL round 1 repairs: exact proof and evidence contract

Entrypoint: `deno run --no-lock -A packages/cli/e2e/fixtures/kv-only/run-adoption.ts <project-parent>`. Scaffold-only CI regression imports `scaffold.ts`; the runtime entrypoint is not named *_test.ts and is guarded by import.meta.main. It never runs from normal tests. `README.md` is the extension guide. `definitions.ts` installs test-owned userland modules; `runtime.ts` contains HTTP/Aspire assertions. The script emits a sanitized JSON receipt with named steps, raw exit status and resource health names/states; it throws/exits nonzero on any failed step and always tears down only its exact AppHost. Raw logs and connection details stay in local excluded evidence, never committed.

Scaffold contract: clean `init --db none`; workers/sagas/triggers install `--no-db --no-samples`, auth with `NETSCRIPT_AUTH_BACKEND=kv-oauth`. Before and after generate/doctor require empty Databases, RequiresDb false on all four APIs and three background entries, no Prisma contribution/model under consumer userland, no DB environment/bootstrap assignment in generated helpers. Generated scaffold quality includes userland definitions and `.netscript/generated` registries plus `aspire/.helpers/*.mts`: structured run-deno-check and run-deno-lint with explicit selected files/config (unstable KV supplied by wrapper). The regression runs these checks without starting Aspire; copied framework sources are dependencies rather than a repo-wide lint sweep.

Workflows: author a userland KV proof job with defineJobHandler and a defineJob config entry; trigger `POST /api/v1/workers/jobs/kv-proof-job/trigger`, require completed execution for that exact job from `/api/v1/workers/executions`. Author `kv-proof-saga` with named initial/working/completed phases and compensation; publish through `POST /api/v1/sagas/publish` with stable correlation and idempotency keys, require persisted state count/version through the instance API. Replay the same idempotency key, then a fresh FIFO barrier message; final state/version prove the replay was not applied twice. Author a memory-verified webhook `kv-proof-trigger` that enqueues the proof job; POST its webhook endpoint, require the accepted event's exact ID reach completed in `/api/v1/events` and another completed job execution. API reads are the supported KV read models with no DB backend configured; direct canonical store/replay semantics also run in existing real-KV runner tests.

Detached proof: stop only the Aspire `sagas` resource; launch its generated runtime directly with Deno using only the borrowed KV connection and registry/project/store/projection settings (no DB or plugin bootstrap and no Aspire supervisor). Publish fresh plus duplicate/barrier events through the still-running API. Require the persisted expected saga state and version before stopping/reaping the direct process and restoring the resource. This proves the generated background runner independently of a web session or Aspire supervision.

### Gate commands

- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --unstable-kv --allow-all packages/cli/src/local/composition/kv-only-plugins_test.ts plugins/sagas/tests/runtime/saga-canonical-backend_test.ts plugins/sagas/tests/runtime/saga-kv-only-runner_test.ts`
- Structured run-deno-check/lint/fmt: explicit --file for fixture/regression TypeScript, private lint/fmt config retaining root options without root CLI exclusions.
- `deno task quality:gate` (includes quality scan + doctrine); `deno task --cwd docs/site check:source-format`; required doc carrier generation/freshness/accuracy after documentation edit.
- Generated project check and lint: same wrappers, `--config <consumer>/deno.json`, explicit --file selection of installed userland/glue, generated registries and Aspire helpers; preserve imports and lint rules while avoiding broad copied-package legacy lint.
- Full opt-in command above; full scaffold.runtime is CI only.

### Acceptance evidence map / negative controls

| Acceptance | Positive evidence | Negative control (test-owned copy; never committed) |
| --- | --- | --- |
| No DB install/generate/doctor | scaffold receipt + consumer test | Set RequiresDb true or inject DB env into generated helper; no-DB assertion must fail |
| Generated check/lint | wrapper summaries include helpers/registries | Reintroduce an unused DB local in helper; generated lint must fail |
| Runner store selection | canonical backend tests | Override runner canonical selection to ignore NETSCRIPT_SAGA_STORE; env Prisma parity test must fail |
| Explicit projection/default/migration | KV runner + projection selector tests and docs | Ignore explicit projection setting (return kv); none and Prisma tests must fail |
| Healthy Aspire/resources | exact resource names and ready payloads in receipt | Existing background readiness negative tests cover false-ready/sibling/crash cases |
| Job, saga, trigger KV effects | per-workflow receipt IDs/counts/version | Duplicate idempotency protection removed in disposable runtime source copy; existing real-KV duplicate replay assertion must fail |
| Detached runner | stopped owned saga resource + direct runtime completion receipt | Require persisted version advance only after direct runner readiness, fail on early process exit |
| Documentation release-gate note | main inspection | Old separate-release-acceptance note is already absent; record verified absence, no deletion needed |

Expected controls are targeted production mutations in disposable copies, preserving tests. Restore any temporary mutation before normal gates, compare hashes and report failing test names/raw exit codes. Do not spend a third PLAN-EVAL round.

## S3 validation inventory repair

After readiness, the full Aspire parity gate requires refreshing its generated surface manifest for the new fixtures. Regenerate `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv` with the canonical script; gate check:aspire-version-parity plus independent six-row review, commit/push with run context, then re-evaluate the exact final pushed head. No executable or runtime change; prior positive consumer proof remains applicable.

S3 also refreshes `packages/mcp/src/publish-assets.generated.ts` after CI identified its docs-corpus wrapper as stale. Gate: canonical gen/check:publish-assets; independent supplemental artifact review before the same S3 commit. No executable behavior changes.

S3 CI regression support also declares the existing BFF cookie alias in the root test import map and updates the empty-tools pipeline expectation to its current Promise no-op contract. Run all twelve files named by the five failing shard reports; retain cookie/CORS/public-route and generated-browser negative controls unchanged.
