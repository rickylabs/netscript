# Plan under research

## SKILL

netscript-doctrine, netscript-harness, netscript-pr, netscript-tools, netscript-deno-toolchain, netscript-cli, jsr-audit.

## Required public behavior

Worker pause/resume stop/restart intake while admitted jobs continue. A drain stops intake, waits for admitted work within a configurable budget, then aborts leftovers and awaits bounded handler cleanup. Grace is configurable through worker config and forwarded by standard/generated runtimes, with a default derived/documented against drain ownership. Shutdown handback refunds the current delivery attempt on every adapter that tracks attempts; actual handler failures still charge. Retain fencing/idempotency and durable DLQ semantics. Docs explain all fields/defaults/semantics. No Redis Streams or saga transport edits.

## Must resolve before PLAN-EVAL

- Exact listener/worker lifetime split: pause cannot settle start(), close queues or destroy runner; resume cannot exceed configured admission or mask listener failures.
- Signal scope: stop intake without aborting jobs/tasks/lease heartbeats; later abort only after the work budget.
- One total/default budget and runner cleanup grace, config schema/types/JSDoc, standard and generated forwarding, no dependency on the separate shutdown PR.
- Inventory every delivery-count backend and its atomic/fenced refund boundary; distinguish worker shutdown from handler failure/caller cancel/deadline; retain default nack behavior for existing consumers.
- Real failing tests for pause/no claims, within-budget ack, repeated shutdown beyond maxDeliveries, failure charging and >1second cleanup through configured runner path.
- Concrete ordered file groups<30each and package/public-surface gate set, debt/JSR risks.

## Intended slices

S1 research/reproductions/locked contracts and separate feature PLAN-EVAL; run artifacts plus focused tests, no production. S2 queue contract then adapter implementations and refund tests. S3 worker lifecycle/budget contract then implementation, pool/config/generated forwarding and tests. S4 docs/generated consumers, static/full runtime validation, final independent evaluation and ready/head/thread gates. Refine exact file groups after inventory. One direct-to-main PR, no stacking with runtime shutdown PR.

## Validation selection

Archetype3 runtime/behavior folding queue integration2 and plugin5; all required static, fitness, backend lifecycle and consumer gates. Structured check/test/lint/fmt, quality:gate, doc lint/baseline and JSR audits/dry-run, release:preflight/docs:accuracy, generated assets freshness. Real backend cases for changed accounting adapters, preserve existing fencing/expiry/renewal/outage tests. Full scaffold.runtime once at the end because standard/generated worker runtime wiring changes; supported runner if local Docker topology is unsupported. All containers/resources fenced by positive ownership; no foreign cleanup.

## Deferred scope

No saga feed/transport/Streams work, no generic lifecycle registry, no unrelated dependency or cache/lock changes. Resolve routine choices autonomously and record them; independent plan evaluation is mandatory before implementation.
