# #599 Flow-B correlation/outcome floor — implementation worklog

## Identity

- Branch/worktree: `fix/599-flowb-attribute-floor` / `/home/codex/repos/ns-wt-599`
- Implementation lane: WSL Codex under beta-7 shipping orchestrator session `df71d36c`
- PR lifecycle and final slice review: owned by the orchestrator; this lane will not open or update a PR.
- PLAN-EVAL: owner-waived by the slice brief (drift D1); this short plan is the authorized substitute before implementation.

## Research

- Issue #599's four acceptance boxes are the contract.
- TC-6/TC-7 define the canonical cross-domain pair as `netscript.correlation.id` and `netscript.outcome`; legacy/domain status keys remain compatibility attributes.
- `@netscript/telemetry` is doctrine Archetype 2 (Integration), current verdict **Refactor**. `plugins/workers` is Archetype 5 (Plugin), current verdict **Refactor**; its runtime composes core worker and telemetry contracts rather than redefining them.
- Runtime behavior is also in scope: queue spans are emitted by telemetry's `TracedQueue`, worker job spans by workers-core instrumentation, and trigger product spans by the triggers plugin runtime.
- Public-surface impact: **none**. The slice adds values to existing attribute maps and preserves an existing optional `JobMessage.correlationId`; it adds no export, entrypoint, CLI command, public type, or function signature.
- Relevant doctrine risks: AP-9 (do not introduce a speculative helper), AP-13/AP-25 (do not add effects), and existing telemetry/workers structural debt. The focused additive changes create or deepen no architecture debt.

## Design

### Public surface

No new public API. Existing constants/builders are reused where practical; compatibility attributes remain emitted.

### Domain vocabulary

- Correlation floor: `netscript.correlation.id`
- Outcome floor: `netscript.outcome`
- Product spans: trigger ingress/detect/process, queue enqueue/dequeue, and job execute
- Outcomes use the existing operation lifecycle values (`pending`/`running`/`completed`/`failed` as applicable).

### Ports

No new ports. Existing OpenTelemetry span contracts and existing `JobMessage` transport contract are consumed.

### Constants

Reuse `NetScriptCorrelationAttributes.CORRELATION_ID` / existing worker telemetry constants and the established `netscript.outcome` convention. Do not create a parallel convention.

### Plan and commit slice

1. Add focused regression assertions, implement the canonical pair on product spans, preserve `correlationId` in `executeDenoJob()`, and tighten the existing T8 validator sets. Prove with scoped wrapper check/lint, telemetry and workers package tests, and `behavior.otel.traces`; record verbatim command outputs here, then commit and push with the mandated explicit refspec.

### Deferred scope

- No telemetry package restructuring, worker executor decomposition, alias removal, or full `scaffold.runtime` run; those are outside #599 and merge-readiness remains with the orchestrator.
- IMPL-EVAL and substantive Tier-A slice sign-off remain with the separate orchestrator session.

### Contributor path

Start at the domain attribute maps/builders, follow their existing instrumentation call sites, then update the single Flow-B trace validator so product emission and end-to-end acceptance stay coupled.

## Evidence

- Acceptance 1: `traceJobExecution()` now emits canonical `netscript.outcome` at running/completed/failed transitions while retaining legacy `job.status`.
- Acceptance 2: trigger ingress/detect/process and queue enqueue/dequeue spans emit `netscript.correlation.id` plus `netscript.outcome`. Trigger correlation is the event ID already propagated to the worker message; queue correlation is read from that existing message envelope.
- Acceptance 3: `processWorkerJob()` threads the received `correlationId` through `executeWorkerJob()` and `executeDenoJob()` copies it into the rebuilt in-process `JobMessage`, allowing `WorkerPool` to pass it to the callback context.
- Acceptance 4: the existing T8 validator's single `correlatedSpans` set now contains ingress, process, enqueue, dequeue, execute, callback boundary, and fan-in; the same set is checked for canonical outcome. No fork was created.
- No public exports or API contracts were added. No `deno.lock` change is owned by this slice.

## Gate results

### Scoped check

Command:

```text
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/telemetry --root plugins/workers --root plugins/triggers --root packages/cli/e2e --ext ts,tsx
```

Verbatim output:

```json
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns-wt-599"},"command":"deno check --quiet --unstable-kv <files>","selection":{"filesSelected":335,"batches":3,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

### Scoped lint

Command:

```text
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/telemetry --root plugins/workers --root plugins/triggers --root packages/cli/e2e --ext ts,tsx
```

Verbatim output:

```json
{"source":{"mode":"command","cwd":"/home/codex/repos/ns-wt-599","exitCode":0},"selection":{"filesSelected":335,"batches":2},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
```

### Package tests

Commands and verbatim verdict lines:

```text
(cd packages/telemetry && deno task test)
ok | 50 passed | 0 failed (1s)

(cd plugins/workers && deno task test)
ok | 24 passed | 0 failed (2s)
```

Full verbatim command output was captured during the run at `.llm/tmp/599-telemetry-test.log` and `.llm/tmp/599-workers-test.log` (scratch evidence, intentionally not committed).

### T8 Flow-B gate

Exact gate ID: `behavior.otel.traces`. The CLI's executable single-gate form is:

```text
deno task e2e:cli gate scaffold.runtime behavior.otel.traces
```

Verbatim output:

```text
Task e2e:cli deno run --allow-all packages/cli/e2e/cli.ts 'gate' 'scaffold.runtime' 'behavior.otel.traces'
Running scaffold.runtime
> behavior.otel.traces: Validate OTEL trace chain via Dashboard API
  FAILED 42ms
Summary: passed=0 failed=1
error: Uncaught (in promise) RemoteError: CLI E2E gate failed
```

The structured gate log proves this was a prerequisite/environment failure before any trace assertion: `NotFound ... readfile '.../.netscript/e2e/aspire-start.json'`. A standalone `gate` invocation creates a fresh scratch project but does not run the fixture/Aspire setup gates. The brief forbids this lane from running full `scaffold.runtime`; Tier-A/orchestrator must execute T8 against its prepared runtime during merge readiness.

## Drift

- D1: PLAN-EVAL/external evaluator dispatch is owner-waived in the slice brief; implementation proceeds after this recorded plan.
- D2: the focused T8 gate cannot execute standalone because its fresh scratch project has no `aspire-start.json` or live generated runtime. The gate implementation compiled, but live trace validation remains an orchestrator prerequisite; no product assertion failed.

## Reconcile

- Issue #599 remains open and PR lifecycle belongs to the beta-7 orchestrator. This slice implements all four boxes; Tier-A retains substantive review and closing-keyword responsibility.
