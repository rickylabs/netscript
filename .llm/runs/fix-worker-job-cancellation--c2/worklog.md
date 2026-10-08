# Worklog

## Design

Public surface and domain: Required handler signal, compatible dispatch input, isolated owned controller, injected clock, first-cause DOMException, bounded grace, full Deno path wiring and explicit local Worker.cancel

Ports: preserve existing owning package contracts. Constants: existing finite vocabulary; additional values only when needed by the issue. Contributor path: extend existing implementation and adjacent regressions.

Commit slices: bootstrap plan, source/test/mutation evidence, independent evaluation evidence. No speculative files.

PLAN-EVAL: Required: lifecycle and public cancellation contract design; hard stop until independent PLAN-EVAL PASS.

## Nine phases

1. Bootstrap: clean clone, fetch, fresh branch from current main.
2. Research: issue, MCP, selected skills/doctrine and existing implementation examined.
3. Plan & Design: locked design recorded above.
4. Plan-Gate: Required: lifecycle and public cancellation contract design; hard stop until independent PLAN-EVAL PASS.
5. Implement: pending.
6. Gate: pending; raw exit codes to be recorded.
7. Evaluate: pending; independent different-vendor session mandatory.
8. Release: N/A, owner explicitly requires unmerged PRs.
9. Close: pending source delivery and handoff; publication remains owner work.

# Locked design — issue 2066

Archetype 3 runtime behavior, package/plugin scope; no service topology or remote API contract edit; public handler contract changes. Job handler contexts (domain, runtime and public root mirror) gain required signal: AbortSignal and optional deadlineAt: epoch milliseconds. RuntimeWorkerPort accepts a separate JobDispatchContext with optional signal/deadline for compatibility; runner owns a guaranteed handler signal. No invented remote cancel protocol: Worker.cancel(executionId) cancels an active local execution; caller-provided dispatch signal is also a cancel path.

State: runner accepting/stopped plus per-dispatch owned AbortController and tracked completion. Existing worker activeJobs keys are durable execution IDs and carry execution controllers. Phases: pending -> running -> completed/failed/timeout/cancelled; first abort reason wins. DOMException reason names TimeoutError, ShutdownError, AbortError distinguish causes. Preserve known names from parent signals; normalize unspecified parent reasons to AbortError.

Time is injected: runner options use a JobRunnerClock port (now(): number; schedule(delayMs, callback): disposable stop function). Default Web Platform clock adapter lives in adapters; composition-root forwards existing clock now when provided. Clock schedules deadline and abort-grace timers; all timer handles and parent-signal listeners are disposed on settlement. No timers inside handlers. Derive effective deadline as min(dispatch deadline, now+job.timeout). Validate finite nonnegative timeout/grace and finite explicit deadline. Pre-aborted signals or expired deadlines prevent handler execution.

Runner races handler settlement with an abort grace rejection. On abort the signal is immediately visible; handler may clean up during abortGracePeriodMs (default 1000), but cannot return successful result after abort. stop() rejects new work, aborts active dispatches with ShutdownError and awaits tracked bounded completions. Grace bounds runtime wait, not physical JavaScript termination; a non-cooperating in-process handler may continue. Document this limit explicitly, including CPU blocking limitation.

Plugin executeWorkerJob -> executeDenoJob -> WorkerPool.executeJob -> InProcessJobRunner forwards parent signal. Pool exposes grace option. Worker.stop aborts active controllers with ShutdownError before waiting on listeners and stops pool concurrently to avoid listener/handler deadlock. Worker.cancel looks up execution ID and aborts with AbortError, returns false for absent/already-aborted execution. Failure recording classifies TimeoutError as timeout and ShutdownError/AbortError as cancelled, preserves ordinary handler failures. Late progress after abort rejects before state reporting.

Delivery remains existing at-least-once/idempotency behavior; cancellation releases claim. Handlers remain concurrent across dispatches; each has isolated cancellation ownership. Existing supervisor and execution-state ports retain responsibility for diagnostics and failure handling. No broad executor refactor or new package.

Tests: actual runner lifecycle deadline + timeout, shutdown, explicit cancel and bounded non-cooperation; actual plugin processWorkerJob full Deno path tests timeout and parent cancellation terminal statuses; public Worker cancel/stop lifecycle exercised through existing queue test seam if available. Use one parameterized test for all three plugin causes where feasible. Every added test has a causal source mutation observed failing then restored passing. Existing type fixtures updated for required signal without adding redundant tests. Gates: structured package/plugin/consumer checks/tests, fmt/lint/docs and publish/JSR audit, quality:scan + arch:check; runtime integration needs no distributed topology change. Record baseline debt rather than claim false green.

PLAN-EVAL hard stop before source. Reviewer must scrutinize shutdown ordering, pre-abort race, no false success, clock cleanup and lack of remote cancellation requirement. Source closure may use Fixes only if issue acceptance fully met; no published consumer proof fabricated.

PLAN-EVAL PASS at `6d6bca2cdb4361c17779e079ce6e7331510c8233`. Adopt advisories A1–A6: native DOMException cause transport, adapter-owned clock, dispatch-input compatibility in fake, manual F-13 evidence. Task dispatcher cancellation remains explicit deferred scope; this issue covers job handlers. Worker shutdown signal also links newly-created execution controllers so admissions racing drain inherit shutdown. Implementation waits while issue #2036 CI amendment is completed in order.

Gate `cancellation-tests`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts plugins/workers/worker/job-cancellation_test.ts`. Full raw output retained privately.

Gate `cancellation-tests-corrected`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts plugins/workers/worker/job-cancellation_test.ts`. Full raw output retained privately.

Queue-seam PLAN-EVAL PASS at b1078f01abbeed14cecb3e27be6f9945bfcaf2b0 before source implementation. Handler signals/deadlines, clock adapter, compatible dispatch input, grace, first-cause rejection, Deno signal forwarding and immediate shutdown plus local cancel implemented. Seven runner/real Worker lifecycle regressions pass. Initial test attempt failed before execution due mixed Node/Web timer typing; ReturnType timer annotation corrected, no no-check escape. Runtime logs retained privately, operational entrypoint diagnostics excluded from public evidence. Mutation proof and full source gates follow.

Gate `worker-source-check`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --root plugins/workers --ext ts,tsx --deno-arg --frozen --deno-arg --unstable-kv`. Full raw output retained privately.

Gate `worker-source-check-corrected`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --root plugins/workers --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `worker-existing-suite`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests plugins/workers/tests plugins/workers/worker`. Full raw output retained privately.

Gate `worker-fmt-write`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --write --file packages/plugin-workers-core/README.md --file packages/plugin-workers-core/src/adapters/web-platform-job-runner-clock.ts --file packages/plugin-workers-core/src/domain/job-context.ts --file packages/plugin-workers-core/src/ports/job-runner-clock.ts --file packages/plugin-workers-core/src/public/root.ts --file packages/plugin-workers-core/src/runtime/composition-root.ts --file packages/plugin-workers-core/src/runtime/in-process-job-runner.ts --file packages/plugin-workers-core/src/runtime/job-dispatcher.ts --file packages/plugin-workers-core/src/runtime/mod.ts --file packages/plugin-workers-core/src/runtime/runtime-types.ts --file packages/plugin-workers-core/src/testing/memory-worker.ts --file packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts --file packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts --file packages/plugin-workers-core/tests/runtime/job-payload-contract_test.ts --file plugins/workers/README.md --file plugins/workers/jobs/job-tools_test.ts --file plugins/workers/worker/job-cancellation_test.ts --file plugins/workers/worker/job-dispatcher.ts --file plugins/workers/worker/job-execution.ts --file plugins/workers/worker/job-runner-pool.ts --file plugins/workers/worker/queue-consumer.ts --file plugins/workers/worker/worker-options.ts --file plugins/workers/worker/worker.ts`. Full raw output retained privately.

Gate `worker-full-suite`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests plugins/workers`. Full raw output retained privately.

Gate `worker-source-check-final`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --root plugins/workers --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `worker-source-check-complete`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --root plugins/workers --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `worker-full-suite-corrected`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests plugins/workers`. Full raw output retained privately.

Gate `mutation-deadline`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts plugins/workers/worker/job-cancellation_test.ts`. Full raw output retained privately.

Gate `mutation-shutdown`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts`. Full raw output retained privately.

Gate `mutation-parent`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts plugins/workers/worker/job-cancellation_test.ts`. Full raw output retained privately.

Gate `mutation-grace`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts`. Full raw output retained privately.

Gate `mutation-terminal-cause`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all plugins/workers/worker/job-cancellation_test.ts`. Full raw output retained privately.

Gate `restored-cancellation-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts plugins/workers/worker/job-cancellation_test.ts`. Full raw output retained privately.

Gate `worker-fmt-final-write`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --write --file packages/plugin-workers-core/README.md --file packages/plugin-workers-core/src/adapters/web-platform-job-runner-clock.ts --file packages/plugin-workers-core/src/domain/job-context.ts --file packages/plugin-workers-core/src/ports/job-runner-clock.ts --file packages/plugin-workers-core/src/public/root.ts --file packages/plugin-workers-core/src/runtime/composition-root.ts --file packages/plugin-workers-core/src/runtime/in-process-job-runner.ts --file packages/plugin-workers-core/src/runtime/job-dispatcher.ts --file packages/plugin-workers-core/src/runtime/mod.ts --file packages/plugin-workers-core/src/runtime/runtime-types.ts --file packages/plugin-workers-core/src/testing/memory-worker.ts --file packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts --file packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts --file packages/plugin-workers-core/tests/runtime/job-payload-contract_test.ts --file plugins/workers/README.md --file plugins/workers/jobs/health-check.ts --file plugins/workers/jobs/health-check_test.ts --file plugins/workers/jobs/job-tools_test.ts --file plugins/workers/worker/job-cancellation_test.ts --file plugins/workers/worker/job-dispatcher.ts --file plugins/workers/worker/job-execution.ts --file plugins/workers/worker/job-runner-pool.ts --file plugins/workers/worker/queue-consumer.ts --file plugins/workers/worker/worker-options.ts --file plugins/workers/worker/worker.ts`. Full raw output retained privately.

Gate `worker-doc-core`: raw exit `1`. Command: `deno task doc:lint --root packages/plugin-workers-core`. Full raw output retained privately.

Gate `worker-doc-plugin`: raw exit `1`. Command: `deno task doc:lint --root plugins/workers`. Full raw output retained privately.

Gate `worker-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `worker-jsr-core`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin-workers-core --text`. Full raw output retained privately.

Gate `worker-jsr-plugin`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root plugins/workers --text`. Full raw output retained privately.

Gate `worker-publish-core`: raw exit `0`. Command: `deno task --cwd packages/plugin-workers-core publish:dry-run`. Full raw output retained privately.

Gate `worker-publish-plugin`: raw exit `0`. Command: `deno task --cwd plugins/workers publish:dry-run`. Full raw output retained privately.

Gate `worker-doc-core-baseline`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-doc-lint.ts --root <private-evidence>`. Full raw output retained privately.

Gate `worker-doc-plugin-baseline`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-doc-lint.ts --root <private-evidence>`. Full raw output retained privately.

Gate `worker-doc-testing-detail`: raw exit `1`. Command: `deno doc --lint packages/plugin-workers-core/src/testing/mod.ts`. Full raw output retained privately.

Gate `worker-doc-runtime-detail`: raw exit `1`. Command: `deno doc --lint packages/plugin-workers-core/src/runtime/mod.ts`. Full raw output retained privately.

Gate `worker-doc-worker-detail`: raw exit `1`. Command: `deno doc --lint plugins/workers/worker/mod.ts`. Full raw output retained privately.

Gate `worker-doc-core-corrected`: raw exit `1`. Command: `deno task doc:lint --root packages/plugin-workers-core`. Full raw output retained privately.

Gate `worker-jsr-plugin-baseline`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root <private-evidence> --text`. Full raw output retained privately.

Gate `worker-doc-plugin-corrected`: raw exit `1`. Command: `deno task doc:lint --root plugins/workers`. Full raw output retained privately.

Mutation evidence: disabled deadline scheduling kills runner and actual Worker timeout; disabled stop abort kills runner shutdown/grace; disabled parent linking kills runner and Worker cancel; disabled grace rejection kills noncooperation; replaced terminal classification kills all three actual Worker causes. Restored 7/7 pass. Parameterized Worker regressions moved into adjacent existing job-dispatcher_test.ts after mutation proof to avoid increasing an already-overfull worker folder; test bodies unchanged.

New documentation findings fixed: execute JSDoc and JobDispatchContext exposed on existing presets/testing surfaces; worker barrel exposes the necessary first-party queue/message vocabulary, permitted by F-15's explicit @netscript exception (MCP consulted). Corrected core and plugin doc diagnostic rows and entrypoint exits now exactly match main baseline, no new doc debt introduced.

Source slices split for <30 files: S2a core lifecycle/context plus existing handler type fixtures; S2b plugin cancellation/queue path plus real lifecycle regressions/public type completeness. S3 evaluation artifacts. No material behavior design change.

Gate `worker-fmt-source-write`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --write --file packages/plugin-workers-core/README.md --file packages/plugin-workers-core/src/adapters/web-platform-job-runner-clock.ts --file packages/plugin-workers-core/src/domain/job-context.ts --file packages/plugin-workers-core/src/ports/job-runner-clock.ts --file packages/plugin-workers-core/src/presets/mod.ts --file packages/plugin-workers-core/src/public/root.ts --file packages/plugin-workers-core/src/runtime/composition-root.ts --file packages/plugin-workers-core/src/runtime/in-process-job-runner.ts --file packages/plugin-workers-core/src/runtime/job-dispatcher.ts --file packages/plugin-workers-core/src/runtime/mod.ts --file packages/plugin-workers-core/src/runtime/runtime-types.ts --file packages/plugin-workers-core/src/testing/memory-worker.ts --file packages/plugin-workers-core/src/testing/mod.ts --file packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts --file packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts --file packages/plugin-workers-core/tests/runtime/job-payload-contract_test.ts --file plugins/workers/README.md --file plugins/workers/jobs/health-check.ts --file plugins/workers/jobs/health-check_test.ts --file plugins/workers/jobs/job-tools_test.ts --file plugins/workers/worker/job-dispatcher.ts --file plugins/workers/worker/job-dispatcher_test.ts --file plugins/workers/worker/job-execution.ts --file plugins/workers/worker/job-runner-pool.ts --file plugins/workers/worker/mod.ts --file plugins/workers/worker/queue-consumer.ts --file plugins/workers/worker/worker-options.ts --file plugins/workers/worker/worker.ts`. Full raw output retained privately.

Gate `worker-lint`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --config <private-evidence> --file packages/plugin-workers-core/src/adapters/web-platform-job-runner-clock.ts --file packages/plugin-workers-core/src/domain/job-context.ts --file packages/plugin-workers-core/src/ports/job-runner-clock.ts --file packages/plugin-workers-core/src/presets/mod.ts --file packages/plugin-workers-core/src/public/root.ts --file packages/plugin-workers-core/src/runtime/composition-root.ts --file packages/plugin-workers-core/src/runtime/in-process-job-runner.ts --file packages/plugin-workers-core/src/runtime/job-dispatcher.ts --file packages/plugin-workers-core/src/runtime/mod.ts --file packages/plugin-workers-core/src/runtime/runtime-types.ts --file packages/plugin-workers-core/src/testing/memory-worker.ts --file packages/plugin-workers-core/src/testing/mod.ts --file packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts --file packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts --file packages/plugin-workers-core/tests/runtime/job-payload-contract_test.ts --file plugins/workers/jobs/health-check.ts --file plugins/workers/jobs/health-check_test.ts --file plugins/workers/jobs/job-tools_test.ts --file plugins/workers/worker/job-dispatcher.ts --file plugins/workers/worker/job-dispatcher_test.ts --file plugins/workers/worker/job-execution.ts --file plugins/workers/worker/job-runner-pool.ts --file plugins/workers/worker/mod.ts --file plugins/workers/worker/queue-consumer.ts --file plugins/workers/worker/worker-options.ts --file plugins/workers/worker/worker.ts`. Full raw output retained privately.

Gate `worker-source-final`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --root plugins/workers --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `worker-suite-final`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests plugins/workers`. Full raw output retained privately.

Gate `worker-consumer`: raw exit `0`. Command: `deno run --config deno.json --frozen --allow-all <private-evidence>`. Full raw output retained privately.

Gate `worker-jsr-core-final`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin-workers-core --text`. Full raw output retained privately.

Gate `worker-jsr-plugin-final`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root plugins/workers --text`. Full raw output retained privately.

Gate `worker-publish-plugin-final`: raw exit `0`. Command: `deno task --cwd plugins/workers publish:dry-run`. Full raw output retained privately.

Gate `worker-publish-core-final`: raw exit `0`. Command: `deno task --cwd packages/plugin-workers-core publish:dry-run`. Full raw output retained privately.

Final gates: explicit frozen source check zero diagnostics; full package/plugin suite 112 pass, zero fail; public root/runtime/worker consumer runs and confirms required signal/deadline. Scoped lint/fmt pass. Core JSR audit zero FAIL; plugin audit retains exactly unchanged doctor module-tag FAIL, explicitly recorded for evaluator adjudication. Both publish dry-runs pass; core/plugin corrected doc-lint retain exactly baseline per-entry counts and exits. Public runtime/test vocabulary complete without reexporting third-party API. F-13 has no dedicated script: manual invariant evidence is per-dispatch ownership, first-cause abort, bounded draining, actual signal path and terminal status tests. No service topology edits; distributed health gate N/A per PLAN-EVAL.

Core adapters directory adds the approved Web Platform clock implementation at doctrine-prescribed placement; overfull pre-existing src directory grows by one required adapter folder (18 to 19), recorded as bounded existing structural debt. Plugin tests folded into existing adjacent file so worker directory cardinality stays unchanged.

Gate `worker-fmt-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file packages/plugin-workers-core/README.md --file packages/plugin-workers-core/src/adapters/web-platform-job-runner-clock.ts --file packages/plugin-workers-core/src/domain/job-context.ts --file packages/plugin-workers-core/src/ports/job-runner-clock.ts --file packages/plugin-workers-core/src/presets/mod.ts --file packages/plugin-workers-core/src/public/root.ts --file packages/plugin-workers-core/src/runtime/composition-root.ts --file packages/plugin-workers-core/src/runtime/in-process-job-runner.ts --file packages/plugin-workers-core/src/runtime/job-dispatcher.ts --file packages/plugin-workers-core/src/runtime/mod.ts --file packages/plugin-workers-core/src/runtime/runtime-types.ts --file packages/plugin-workers-core/src/testing/memory-worker.ts --file packages/plugin-workers-core/src/testing/mod.ts --file packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts --file packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts --file packages/plugin-workers-core/tests/runtime/job-payload-contract_test.ts --file plugins/workers/README.md --file plugins/workers/jobs/health-check.ts --file plugins/workers/jobs/health-check_test.ts --file plugins/workers/jobs/job-tools_test.ts --file plugins/workers/worker/job-dispatcher.ts --file plugins/workers/worker/job-dispatcher_test.ts --file plugins/workers/worker/job-execution.ts --file plugins/workers/worker/job-runner-pool.ts --file plugins/workers/worker/mod.ts --file plugins/workers/worker/queue-consumer.ts --file plugins/workers/worker/worker-options.ts --file plugins/workers/worker/worker.ts`. Full raw output retained privately.

Gate `worker-quality-final`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `worker-drain-final-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `worker-drain-fmt`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --write --file plugins/workers/worker/worker.ts --file plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Concurrent Worker.stop callers now share drain completion; the actual shutdown scenario asserts the same Promise and immediate signal. Focused final runtime/dispatcher suite passes after this lifecycle correction. No new test or design concept added.

Gate `worker-drain-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file plugins/workers/worker/worker.ts --file plugins/workers/worker/job-dispatcher_test.ts --deno-arg --frozen`. Full raw output retained privately.

S2a core source `81589373f2ef91bcc4bed6d10189b14f8fbe815d`; S2b final plugin source `da438b2f90abf95d7d9cbe39a3bc57c2bb7989b2`. S3 independent IMPL-EVAL brief locked; no source edit while evaluator runs.

## Independent implementation verdict

GLM max IMPL-EVAL PASS for final source da438b2f90abf95d7d9cbe39a3bc57c2bb7989b2, actual evaluated head cb66a3f13642e5581aef13d82f203533e814b439. Reviewer independently reran 16 runner/actual Worker/dispatcher cases, zero failures. F-7 unchanged baseline, F-JSR-2 unchanged doctor finding and F-16 bounded required adapter folder all explicitly DEBT_ACCEPTED; F-13 PENDING_SCRIPT with manual invariant evidence. Source phases complete, ready for review. Publication and released-consumer condition remain owner work; no merge.

CI follow-up findings: tagline fails because new cancellation paragraph became README first paragraph; move unchanged prose to its own section. Existing generated payload consumer lacks now-required signal; update both legitimate and deliberately invalid payload calls plus fixture context stub, preserving payload-specific negative proof. Existing MCP corpus freshness tests fail because public context exports changed; owning corpus must be regenerated after clean source commit. PLAN-EVAL N/A for these mechanical contract-fixture and generated-document repairs; no behavior change/new test.

Gate `review-docs-tagline`: raw exit `0`. Command: `deno task docs:tagline:check`. Full raw output retained privately.

Gate `review-registry-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all plugins/workers/tests/cli/runtime-registry-generator_test.ts`. Full raw output retained privately.

Gate `review-fixture-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file plugins/workers/tests/cli/runtime-registry-generator_test.ts --deno-arg --frozen`. Full raw output retained privately.

Gate `review-fixture-lint`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --file plugins/workers/tests/cli/runtime-registry-generator_test.ts`. Full raw output retained privately.

Gate `review-fixture-fmt`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file plugins/workers/tests/cli/runtime-registry-generator_test.ts --file plugins/workers/README.md`. Full raw output retained privately.

Mechanical follow-up slice review: README cancellation contract text unchanged, moved after introduction; required signal added to both generated fixture calls and its local context stub while negative payload @ts-expect-error remains. Existing registry suite and docs tagline plus selected check/lint/fmt exit 0. No production behavior or public-contract changes. Commit clean read set before owning export corpus regeneration.

Gate `review-corpus-regenerate`: raw exit `0`. Command: `deno task gen:mcp-export-corpus`. Full raw output retained privately.

Owning gen:mcp-export-corpus exit 0 from clean committed read set; corpus refreshed for mandatory signal/deadline and documented queue port exports. Generated artifact only; no manual corpus editing. Commit before exercising committed-tree freshness regressions.

Gate `review-corpus-tests`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts`. Full raw output retained privately.

Gate `review-mcp-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts --deno-arg --frozen`. Full raw output retained privately.

Gate `review-corpus-freshness`: raw exit `0`. Command: `deno task gen:mcp-export-corpus --check`. Full raw output retained privately.

Gate `review-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `review-corpus-tests-corrected`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts`. Full raw output retained privately.

Corrected corpus fixture gate exit 0 (12 pass): the local Git shim had transparently relocated the test's requested temporary worktrees, breaking their expected paths. Owned failed fixtures removed; test-scoped WT_ENFORCE=0 preserves owner-requested task-folder confinement without editing the shim. TMPDIR remains inside task folder. Original relocation failure retained; corrected existing freshness/clean-tree suite passes. Corpus --check, generated selected type check and quality gate also exit 0. No new tests or runtime behavior delta; mandatory source runtime/mutation PASS remains da438b2f90abf95d7d9cbe39a3bc57c2bb7989b2. Independent exact-head mechanical delta IMPL-EVAL next.

## Final exact-source delta IMPL-EVAL verdict

Delta IMPL-EVAL PASS at dd6cea4bf99db07f6d7012f8f45ae0e7f96614d6 for final delta source 20484c8e7c2d48fa48ec5e6800d7ce855f9f35c5; original runtime PASS preserved for da438b2f90abf95d7d9cbe39a3bc57c2bb7989b2. Delta ead12a6c1..HEAD inspected commit-by-commit: README cancellation prose byte-identical relocation (verified programmatically), existing registry fixture gains required signal on both calls with payload @ts-expect-error retained, owning corpus regenerated as one payload line plus provenance (symbolCount 7908 to 7920). Independent reruns: registry suite 8/0 exit 0, corpus 12-test suite 12/0 exit 0, docs:tagline:check 36/0 exit 0, gen:mcp-export-corpus --check exit 0 with provenance sha matching committed corpus. Qualified Deno 2.9.5 directory, WT_ENFORCE=0 and task-folder TMPDIR from launch; no global shim/config change; working tree clean throughout. No new tests/mutation obligation; F-7/F-JSR-2/F-16 and F-13 treatment carried unchanged. Verdict in review-evaluate.md; no merge/publication claim.

S7 review amendment Design checkpoint: D1-D5 locked in cancellation-review-plan.md. Independent Google Gemini selected PLAN-EVAL PASS at immutable 0023b8f193f2cdc8cc3e8f8f06ebeeb700228584 before implementation. Owner HARNESS fallback authorized after primary GLM provider stalled without verdict; private provider logs preserved. Three production files and three adjacent test files, no public contract/dependency changes. S7-S9 remain pending.

Gate `review-focused`: raw exit `1`. Command: `deno run -A .llm/tools/run-deno-test.ts --path packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts --path packages/plugin-workers-core/tests/runtime/job-payload-contract_test.ts --path plugins/workers/worker/job-dispatcher_test.ts -- --frozen`. Full raw output retained privately.

Gate `review-focused`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts packages/plugin-workers-core/tests/runtime/job-payload-contract_test.ts plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `review-mutant-schema`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter schema-backed async validation packages/plugin-workers-core/tests/runtime/job-payload-contract_test.ts`. Full raw output retained privately.

Gate `review-restored-schema`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter schema-backed async validation packages/plugin-workers-core/tests/runtime/job-payload-contract_test.ts`. Full raw output retained privately.

Gate `review-mutant-preabort`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter runner preserves pre-aborted packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts`. Full raw output retained privately.

Gate `review-restored-preabort`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter runner preserves pre-aborted packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts`. Full raw output retained privately.

Gate `review-mutant-overdue`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter runner reconciles overdue packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts`. Full raw output retained privately.

Gate `review-mutant-overdue`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter runner reconciles overdue packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts`. Full raw output retained privately.

Gate `review-restored-overdue`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter runner reconciles overdue packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts`. Full raw output retained privately.

Gate `review-mutant-core-progress`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter runner owns blocked progress packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts`. Full raw output retained privately.

Gate `review-restored-core-progress`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter runner owns blocked progress packages/plugin-workers-core/tests/runtime/job-cancellation_test.ts`. Full raw output retained privately.

Gate `review-mutant-actual-progress-timeout`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter Worker cancellation during unawaited progress drain retains timeout plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `review-restored-actual-progress-timeout`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter Worker cancellation during unawaited progress drain retains timeout plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `review-mutant-actual-progress-cancel`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter Worker cancellation during unawaited progress drain retains cancel plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `review-restored-actual-progress-cancel`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter Worker cancellation during unawaited progress drain retains cancel plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `review-mutant-actual-progress-shutdown`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter Worker cancellation during unawaited progress drain retains shutdown plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `review-restored-actual-progress-shutdown`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter Worker cancellation during unawaited progress drain retains shutdown plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `review-mutant-reentry`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter Worker reentrant stop plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `review-mutant-reentry`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter Worker reentrant stop plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `review-mutant-reentry`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter Worker reentrant stop plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `review-restored-reentry`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter Worker reentrant stop plugins/workers/worker/job-dispatcher_test.ts`. Full raw output retained privately.

Gate `amendment-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --root plugins/workers --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `amendment-lint`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-workers-core --root plugins/workers --ext ts,tsx`. Full raw output retained privately.

Gate `amendment-fmt`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-workers-core --root plugins/workers --ext ts,tsx`. Full raw output retained privately.

Gate `amendment-suite`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/plugin-workers-core/tests plugins/workers`. Full raw output retained privately.

Gate `amendment-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `amendment-jsr-core`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin-workers-core --text`. Full raw output retained privately.

Gate `amendment-publish-core`: raw exit `0`. Command: `deno task --cwd packages/plugin-workers-core publish:dry-run`. Full raw output retained privately.

Gate `amendment-doc-core`: raw exit `1`. Command: `deno task doc:lint --root packages/plugin-workers-core`. Full raw output retained privately.

Gate `amendment-jsr-plugin`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root plugins/workers --text`. Full raw output retained privately.

Gate `amendment-publish-plugin`: raw exit `0`. Command: `deno task --cwd plugins/workers publish:dry-run`. Full raw output retained privately.

Gate `amendment-doc-plugin`: raw exit `1`. Command: `deno task doc:lint --root plugins/workers`. Full raw output retained privately.

Gate `amendment-carrier`: raw exit `1`. Command: `deno task agent:carrier:check`. Full raw output retained privately.

S7 substantive review: D1-D5 correct the five verified review findings within the locked six source/test files. All eight new tests individually fail causal, compiling source mutations and pass after exact restoration. Initial constant-false mutation caused a type error and was replaced by a type-safe clock comparison; it does not count as proof. Reentrant promise assertion strengthened to strict identity after deep equality failed to kill the old implementation. Full owning suite 120 pass/0 fail/0 ignored; frozen source check, scoped lint/fmt, quality and architecture exit zero. Core/plugin publish dry-runs pass. Whole all-entrypoint core/plugin documentation JSON is byte-identical to the prior corrected baseline with raw exits one; plugin JSR retains only inherited doctor module-tag failure. Initial carrier invocation named nonexistent task, to be corrected by check:assets-barrel. No public signature or dependency delta. S7 source complete; clean-source corpus freshness S8 next, mandatory independent amendment IMPL S9 pending.

Gate `amendment-corpus-fresh`: raw exit `0`. Command: `deno task check:mcp-export-corpus`. Full raw output retained privately.

Gate `amendment-carrier-corrected`: raw exit `0`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

Gate `amendment-corpus-tests`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts packages/mcp/tests/embedded-export-surface-corpus_test.ts`. Full raw output retained privately.

Gate `amendment-consumer`: raw exit `0`. Command: `deno run --frozen --config deno.json --allow-all <private-consumer>`. Full raw output retained privately.

S8 qualification complete: canonical corpus freshness unchanged sha42f8c6a692ba7882afc7cfc4325fd77993815ea97b14d8ad26a3ee1909cf37a8,7920 symbols; no generated-source delta required. All14 generator/embedded corpus tests pass under test-scoped WT_ENFORCE=0 and task-local TMPDIR, corrected check:assets-barrel passes, native required-signal/deadline consumer executes. No dependency/lock/public signature/carrier changes. Full120-suite and unchanged complete per-entrypoint doc baselines retained. Source78f868ee4 complete; independent exact-head cancellation amendment IMPL next, source frozen until process exit.

S9 independent Google Gemini amendment IMPL-EVAL PASS at exact 3c13a09530be4c76757df735adc3d40c41d50e13, runtime source 78f868ee4feb692b03c1089c43b53934afe7524a. Fresh separate session b1eeb8af-91ec-4a67-98f9-5c44b9961c86, owner-authorized fallback after primary provider stall. Reviewer independently reruns120 full/25 focused tests with no failures/skips,222-file scoped frozen check/lint/fmt, quality/architecture, actual publications, all-entrypoint doc comparison and14corpus tests/carrier/freshness; five findings resolved and eight causal mutants verified. Existing workers-doc-baseline, doctor-module and core-layout debt explicitly DEBT_ACCEPTED without false raw greens. Source clean through gates; expected evaluate report is the only review-authored final delta. Report complete and reviewer process exitedzero before close. Original reports retained. Phases5/6/7 and sourceclose9 complete,8release N/A. FinalheadCI/coordinatedpublication/publishedconsumer remainownerwork, Refs2066, EIScreateJobAbortScope removal afterqualifiedrelease.

## Review repair — Bootstrap / Research / Plan & Design / Plan-Gate
Baseline 523c3e352a340bbd0255fdeb6b24120cb40ce137; read owner HARNESS and independent review. Scope: Merge main; retain real-core registry and plugin payload coverage with required handler signals and negative payload assertions; no runtime behavior change.. Existing contracts locked; PLAN-EVAL N/A for bounded mechanical reconciliation unless new decision-heavy issues emerge.

## Design — review repair
Public surface and domain vocabulary remain those of the reviewed feature. Existing ports/constants retained. No new abstraction. Preserve both branch and main behavior, tests and debt records. Main generated assets precede canonical regeneration commits. Contributor path: focused existing test and its owning source. Commit slices follow repair plan. Owner acceptance of published consumer remains deferred.

Conflict resolution: main now uses real workers core and includes configured/unconfigured plugin-dir payloads. Retained writeWorkersManifest(projectRoot, true) and real core type imports; retained PR signal arguments on valid and invalid handler calls and both negative payload assertions. Removed obsolete duplicate local fixture block, consistent with main helper signature. Both debt sections retained. No worker runtime source changed by conflict resolution.

Resolved registry test wrapper exit 0: 10 passed, no failures/ignored. Supervisor reviewed conflict delta; cancellation runtime untouched and both payload/cancellation assertions preserved.

Canonical gen:agent-docs-prose exit 0. Generated carrier reviewed; no hand edits.

Canonical gen:assets-barrel exit 0. Generated carrier reviewed; no hand edits.
