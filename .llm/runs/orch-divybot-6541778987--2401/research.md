# Research and Aspire caller inventory

Baseline: `4e018ad0bab9b9b90daf4764a035fd3ff879b9fa`, local origin/main at bootstrap. Read relevant doctrine axioms/layering, CLI archetype, harness gates, JSR rubric, CLI and Aspire skills. NetScript MCP find_guidance then search_docs confirmed event observation guidance and NDJSON format.

## Caller inventory

Paths below are repository-relative. “Once” means bounded per explicit command/request or named gate, not a periodic timer.

| Caller | Command | Frequency | Distribution / disposition |
| --- | --- | --- | --- |
| CLI `kernel/adapters/database/operations/operation-runner.ts` | `ps`; `wait`; resource command; `describe`; logs; stop | ps/wait once per DB operation; **describe every 1s** until executable completes | Consumer CLI, generated DB tasks invoke this runner. Replace describe loop through existing executor seam. |
| CLI `kernel/adapters/aspire/apphost-doctor-inspector.ts` | ps + describe | Once per plugin doctor / explicit MCP get_app_status request, each bounded 5s | Consumer; keep one-shot. No internal scheduler. Child health uses direct HTTP. |
| CLI `kernel/adapters/aspire/docker-topology-inspector.ts` | ps | Once per topology inspection | Consumer; keep one-shot. |
| CLI `kernel/adapters/aspire/aspire-compose-deploy-target.ts` | ps (Docker Compose command, not Aspire ps) | Once per deploy status | Consumer; not an AppHost watch. |
| CLI `kernel/adapters/aspire/aspire-cloud-deploy-target.ts` | Aspire deploy/publish and lifecycle | Explicit deployment operation | Consumer; no periodic AppHost describe. |
| MCP `infrastructure/aspire-ps-dashboard-reader.ts`, CLI composition | ps | Once when resolving telemetry endpoint / reader invocation | Consumer MCP; explicit startup/request; no timer. |
| MCP `infrastructure/service-endpoints/aspire-cli-endpoint-source.ts` | ps → describe → ps | Once per endpoint discovery with stable process identity validation | Consumer MCP; explicit discovery, no timer. |
| Generated `kernel/templates/workspace/aspire-cli-task.ts` | otel/export; ps fallback | One user task; at most one discovery fallback and retry | Consumer generated; bounded, retain. |
| Generated telemetry route `assets/app/routes/examples/telemetry/(_shared)/telemetry-trace.ts.template` | ps via shared dashboard reader | One per explicit page refresh/POST; no client interval | Consumer generated; retain bounded read. |
| Generated workspace dev tasks/AppHost | aspire start/run; agent mcp | Explicit task; long-lived lifecycle | Consumer generated; no ps/describe scheduler. |
| Generated `_aspire-compat.ts.template`, background health and supervisors | Direct HTTP/TCP/RESP/DB readiness checks, SDK lifecycle | Health interval uses protocol probe, **no CLI invocation** | Consumer generated; no CLI polling to replace. |
| E2E `runtime/resource-state-stream.ts` | describe exact resource --follow | One owned stream per transition observer, buffered and disposed | Internal runtime gate; existing event observation retained. |
| E2E `runtime/evidence/describe-capture.ts`, resource-command.ts | describe --follow; one settled describe; start/logs | Bounded per convergence/stage; stream lifetime tied to gate | Internal; no periodic snapshots. |
| E2E `verify-live-db-endpoint.ts`, `service-env/verify-service-env.ts`, `verify-db-status-preserves-apphost.ts`, `validate-aspire-task-traces.ts`, `aspire-dashboard-telemetry.ts`, `verify-saga-publish-process.ts`, `verify-endpoint-readiness.ts`, `garnet-coexistence-fixture.ts`, `aspire-mcp-smoke.ts` | describe/ps as applicable | Finite per fixture/gate; HTTP/readiness repeats reuse resolved endpoint | Internal; retain bounded snapshots. |
| E2E runtime `listener-unreachable-fixture.ts`, `behavior-scripts.ts`, `capture-db-endpoint-allocation.ts`, `verify-typed-db-phase-b.ts`, `verify-listener-readiness.ts`, `verify-credential-rejection.ts` | describe/ps as applicable | Finite setup/checkpoint snapshots, event stream for repeated transitions | Internal; retain. |
| `.llm/tools/e2e/scaffold-e2e-test.ts` (embedded in agent-tools.generated.ts) | finite list of wait calls; describe; logs; four endpoint describe reads | Once per smoke stage/endpoint; heartbeat prints progress only | Shipped consumer agent tool and internal; no periodic CLI polling, retain bounded calls. |
| `.llm/tools/maint/teardown/probes.ts` and embedded agent tools | aspire ps | Once per leak-check inventory | Shipped maintainer/agent tool; no scheduler, retain. |
| `.llm/tools/agentic/wsl/wsl-foundation.ts` | aspire --version | Explicit environment check | Internal; no AppHost connection. |

Inventory method: source searches for literal aspire/ps/describe/wait, command executor callsites and generated .template assets, excluding duplicate embedded generated strings and retained runs. Existing `check-aspire-resource-polling` guard currently covers CLI E2E only and misses the shipped DB runner (indirect `this.runAspire`). Widen its test selection to shipped CLI source as a prevention check if it remains useful after replacement.

## Upstream cause and search

Verified pinned source: https://github.com/microsoft/aspire/blob/v13.5.3/src/Aspire.Hosting/ApplicationModel/ResourceNotificationService.cs . `WatchAsync` attaches OnResourceUpdated then yields initial snapshots before its try/finally; disposal at an initial snapshot cannot reach unsubscribe. Dashboard health waits trigger this even for ps/describe. See measured report https://github.com/rickylabs/netscript/issues/2401 .

Searches on 2026-10-31: microsoft/aspire issues for `WatchAsync leak` (open and closed), `WatchAsync subscription`, `resource watches leak`, `ResourceNotificationService`, `"resource" "subscriptions" "leak"`, and `"memory leak"`; web lookup for WatchAsync/OnResourceUpdated. No matching upstream issue located. #20609/#20972 concern DCP Kubernetes watch transport, a distinct cause, and must not be claimed as this issue. Ready-to-file report in upstream-report.md; owner files it.

Reported measurements (not reproduced in this run): 16-resource TypeScript AppHost, ps+describe/minute: 14.3 GB RSS after 45.6 h, ending slope 0.67 GB/h versus 0.31 GB/h average. Fresh dump after 14 minutes: 105 unbounded ResourceEvent channels, 106 handlers, four active readers; batches of 20 describe/20 ps/10 wait added 42/40/24 channels. Downstream mitigation bounds command count, not an upstream repair or zero-leak claim.
