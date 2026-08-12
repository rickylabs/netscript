# Slice B — #1417 implementation evidence

**Branch:** `fix/1417-publish-dry-run-no-mutation`  
**Commit:** `1a05934e9`  
**Baseline:** `origin/main@01aa12b67e36b643e1ca4f94421ecba07e030db5`  
**PLAN-EVAL:** N/A per run drift D-2.  
**IMPL-EVAL:** required; separate Fable 5 medium session, pending supervisor dispatch.

## Implementation decision

Option 1 (the preferred approach) is implemented: workspace and MCP package dry-runs copy the
checkout to a temporary workspace, run the unchanged `deno publish --dry-run` gate there, and
remove the copy in `finally`. Catalog materialization and Deno's publish-shape processing still run;
neither receives a path into the source checkout. This remains safe if the process is interrupted:
an abandoned temporary directory is possible after a hard kill, but a partially rewritten source
manifest is not.

The mutation has two participants. NetScript's `publishWorkspace` intentionally materializes npm
`catalog:` entries before invoking Deno. Deno's package-scoped dry-run can also rewrite manifest
publish metadata. The defect was exposing the live checkout to either mutation. The regression
tests simulate both classes, plus an attempted `deno.lock` write, against the real isolation seam.

## Negative control — final regression suite red without isolation

Isolation was temporarily replaced with `return await operation(sourceRoot)`, the exact final
two-test suite was executed, and then isolation was restored before any commit. Real untruncated
output:

```text
$ deno test --allow-read --allow-write --allow-run .llm/tools/release/publish-workspace_test.ts
Check .llm/tools/release/publish-workspace_test.ts
running 2 tests from ./.llm/tools/release/publish-workspace_test.ts
publish dry-run isolates catalog and Deno manifest rewrites in a throwaway workspace ... FAILED (58ms)
package dry-run isolates MCP publish array rewrites ... FAILED (6ms)

 ERRORS 

publish dry-run isolates catalog and Deno manifest rewrites in a throwaway workspace => ./.llm/tools/release/publish-workspace_test.ts:5:6
error: AssertionError: Values are not equal.


    [Diff] Actual / Expected


-   true
+   false

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.19/equals.ts:67:9)
    at commandRunner (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace_test.ts:34:9)
    at async publishWorkspaceInPlace (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:127:20)
    at async file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:58:14
    at async withThrowawayWorkspace (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:216:10)
    at async publishWorkspace (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:57:12)
    at async file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace_test.ts:14:5

package dry-run isolates MCP publish array rewrites => ./.llm/tools/release/publish-workspace_test.ts:46:6
error: AssertionError: Values are not equal.


    [Diff] Actual / Expected


-   true
+   false

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.19/equals.ts:67:9)
    at file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace_test.ts:63:7
    at async file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:71:20
    at async withThrowawayWorkspace (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:216:10)
    at async publishMemberDryRun (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:70:3)
    at async file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace_test.ts:54:5

 FAILURES 

publish dry-run isolates catalog and Deno manifest rewrites in a throwaway workspace => ./.llm/tools/release/publish-workspace_test.ts:5:6
package dry-run isolates MCP publish array rewrites => ./.llm/tools/release/publish-workspace_test.ts:46:6

FAILED | 0 passed | 2 failed (74ms)

error: Test failed
EXIT_CODE=1
```

## Green gate transcripts

The sections below are machine-recorded command stdout/stderr with explicit exit codes. Empty
fences for git assertions are the required empty output, not omitted output.


### Clean-tree precondition

Command: `git status --porcelain`

Exit code: **0** · elapsed: 0.0s

````text
````

### Root publish dry-run

Command: `rtk proxy deno task publish:dry-run`

Exit code: **0** · elapsed: 49.1s

````text
Task publish:dry-run deno run --allow-read --allow-write --allow-run .llm/tools/release/run-publish-dry-run.ts
Publishing a workspace...
╭ Warning
│
│  Ignored build scripts for packages:
│  npm:lmdb@3.5.5
│  npm:msgpackr-extract@3.0.4
│
│  Lifecycle scripts are only supported when using a `node_modules` directory.
│  Enable it in your deno config file:
│  "nodeModulesDir": "auto"
╰─
Check packages/ai/mod.ts
Check packages/ai/anthropic.ts
Check packages/ai/openai-compatible.ts
Check packages/ai/openai-embeddings.ts
Check packages/ai/openrouter.ts
Check packages/ai/ollama.ts
Check packages/ai/mcp.ts
Check packages/ai/agent.ts
Check packages/ai/src/skills/mod.ts
Check packages/ai/src/contracts/mod.ts
Check packages/ai/src/ports/mod.ts
Check packages/ai/tools.ts
Check packages/ai/src/testing/mod.ts
Check packages/aspire/mod.ts
Check packages/aspire/config.ts
Check packages/aspire/schema.ts
Check packages/aspire/types.ts
Check packages/aspire/constants.ts
Check packages/aspire/src/application/mod.ts
Check packages/aspire/src/adapters/mod.ts
Check packages/aspire/src/testing/mod.ts
Check packages/aspire/src/public/mod.ts
Check packages/mcp/mod.ts
Check packages/mcp/cli.ts
Check packages/mcp/openapi-projection.ts
Check packages/auth-better-auth/mod.ts
Check packages/auth-kv-oauth/mod.ts
Check packages/auth-kv-oauth/src/providers.ts
Check packages/auth-kv-oauth/src/store.ts
Check packages/auth-kv-oauth/src/crypto.ts
Check packages/auth-kv-oauth/src/cookies.ts
Check packages/auth-kv-oauth/src/flow.ts
Check packages/auth-kv-oauth/src/backend.ts
Check packages/auth-kv-oauth/src/errors.ts
Check packages/auth-workos/mod.ts
Check packages/cron/mod.ts
Check packages/cron/adapters/mod.ts
Check packages/cron/ports/mod.ts
Check packages/cron/testing/mod.ts
Check packages/database/mod.ts
Check packages/database/ports/mod.ts
Check packages/database/adapters/mod.ts
Check packages/database/adapters/postgres.adapter.ts
Check packages/database/adapters/mssql.adapter.ts
Check packages/database/adapters/mysql.adapter.ts
Check packages/database/extensions/mod.ts
Check packages/database/scripts/mod.ts
Check packages/database/prisma-tracing.ts
Check packages/database/testing/mod.ts
Check packages/kv/mod.ts
Check packages/kv/redis.ts
Check packages/kv/kvdex.ts
Check packages/kv/src/testing/mod.ts
Check packages/prisma-adapter-mysql/mod.ts
Check packages/queue/mod.ts
Check packages/queue/adapters/deno-kv.adapter.ts
Check packages/queue/adapters/redis.adapter.ts
Check packages/queue/adapters/amqp.adapter.ts
Check packages/queue/adapters/postgres.adapter.ts
Check packages/queue/adapters/kv-dead-letter-store.ts
Check packages/queue/adapters/postgres-dead-letter-store.ts
Check packages/queue/adapters/redis-dead-letter-store.ts
Check packages/queue/adapters/kv-polling.adapter.ts
Check packages/queue/ports/mod.ts
Check packages/queue/ports/errors.ts
Check packages/queue/validation/mod.ts
Check packages/queue/testing/mod.ts
Check packages/sdk/mod.ts
Check packages/sdk/src/auto-update/mod.ts
Check packages/sdk/src/desktop/mod.ts
Check packages/sdk/src/cache/mod.ts
Check packages/sdk/src/client/mod.ts
Check packages/sdk/src/collections/mod.ts
Check packages/sdk/src/discovery/mod.ts
Check packages/sdk/src/ports/mod.ts
Check packages/sdk/src/query/mod.ts
Check packages/sdk/src/query-client/mod.ts
Check packages/sdk/src/streams.ts
Check packages/sdk/src/telemetry/mod.ts
Check packages/service/mod.ts
Check packages/service/src/auth/mod.ts
Check packages/service/src/primitives/rpc-path.ts
Check packages/cli/mod.ts
Check packages/cli/scaffolding.ts
Check packages/cli/testing.ts
Check packages/config/mod.ts
Check packages/config/src/merge/mod.ts
Check packages/config/src/paths/mod.ts
Check packages/config/src/schema/plugins/mod.ts
Check packages/contracts/mod.ts
Check packages/contracts/crud.ts
Check packages/contracts/query.ts
Check packages/contracts/transform.ts
Check packages/plugin-ai-core/mod.ts
Check packages/plugin-ai-core/src/contracts/v1/mod.ts
Check packages/plugin-auth-core/mod.ts
Check packages/plugin-auth-core/src/domain/mod.ts
Check packages/plugin-auth-core/src/ports/mod.ts
Check packages/plugin-auth-core/src/contracts/v1/mod.ts
Check packages/plugin-auth-core/src/telemetry/mod.ts
Check packages/plugin-auth-core/src/streams/mod.ts
Check packages/plugin-auth-core/src/config/mod.ts
Check packages/plugin-auth-core/src/presets/mod.ts
Check packages/plugin-auth-core/src/testing/mod.ts
Check packages/plugin-sagas-core/mod.ts
Check packages/plugin-sagas-core/src/builders/mod.ts
Check packages/plugin-sagas-core/src/domain/mod.ts
Check packages/plugin-sagas-core/src/ports/mod.ts
Check packages/plugin-sagas-core/src/runtime/mod.ts
Check packages/plugin-sagas-core/src/adapters/mod.ts
Check packages/plugin-sagas-core/src/transports/mod.ts
Check packages/plugin-sagas-core/src/stores/mod.ts
Check packages/plugin-sagas-core/src/middleware/mod.ts
Check packages/plugin-sagas-core/src/integration/workers/mod.ts
Check packages/plugin-sagas-core/src/integration/publisher/mod.ts
Check packages/plugin-sagas-core/src/telemetry/mod.ts
Check packages/plugin-sagas-core/src/config/mod.ts
Check packages/plugin-sagas-core/src/contracts/v1/mod.ts
Check packages/plugin-sagas-core/src/streams/mod.ts
Check packages/plugin-sagas-core/src/presets/mod.ts
Check packages/plugin-sagas-core/src/abstracts/mod.ts
Check packages/plugin-sagas-core/src/testing/mod.ts
Check packages/plugin-sagas-core/src/agent/mod.ts
Check packages/plugin-streams-core/mod.ts
Check packages/plugin-streams-core/src/sse/mod.ts
Check packages/plugin-streams-core/src/telemetry/mod.ts
Check packages/plugin-streams-core/src/testing/mod.ts
Check packages/plugin-triggers-core/mod.ts
Check packages/plugin-triggers-core/src/adapters/mod.ts
Check packages/plugin-triggers-core/src/builders/mod.ts
Check packages/plugin-triggers-core/src/config/mod.ts
Check packages/plugin-triggers-core/src/contracts/v1/mod.ts
Check packages/plugin-triggers-core/src/domain/mod.ts
Check packages/plugin-triggers-core/src/ports/mod.ts
Check packages/plugin-triggers-core/src/public/mod.ts
Check packages/plugin-triggers-core/src/runtime/mod.ts
Check packages/plugin-triggers-core/src/stores/mod.ts
Check packages/plugin-triggers-core/src/telemetry/mod.ts
Check packages/plugin-triggers-core/src/testing/mod.ts
Check packages/plugin-workers-core/mod.ts
Check packages/plugin-workers-core/src/builders/mod.ts
Check packages/plugin-workers-core/src/contracts/v1/mod.ts
Check packages/plugin-workers-core/src/registry/mod.ts
Check packages/plugin-workers-core/src/state/mod.ts
Check packages/plugin-workers-core/src/executor/mod.ts
Check packages/plugin-workers-core/src/workflow/mod.ts
Check packages/plugin-workers-core/src/streams/mod.ts
Check packages/plugin-workers-core/src/stores/mod.ts
Check packages/plugin-workers-core/src/presets/mod.ts
Check packages/plugin-workers-core/src/shutdown/mod.ts
Check packages/plugin-workers-core/src/domain/public-schema.ts
Check packages/plugin-workers-core/src/telemetry/mod.ts
Check packages/plugin-workers-core/src/abstracts/mod.ts
Check packages/plugin-workers-core/src/testing/mod.ts
Check packages/plugin-workers-core/src/config/mod.ts
Check packages/plugin-workers-core/src/runtime/mod.ts
Check packages/plugin/mod.ts
Check packages/plugin/src/abstracts/mod.ts
Check packages/plugin/src/adapter/mod.ts
Check packages/plugin/src/config/mod.ts
Check packages/plugin/src/cli/mod.ts
Check packages/plugin/loader.ts
Check packages/plugin/src/protocol/mod.ts
Check packages/plugin/src/scaffold/mod.ts
Check packages/plugin/src/sdk/mod.ts
Check packages/plugin/src/testing/mod.ts
Check packages/plugin/src/templates/mod.ts
Check packages/plugin/src/contract-base/mod.ts
Check packages/plugin/src/service/mod.ts
Check packages/watchers/mod.ts
Check plugins/ai/mod.ts
Check plugins/ai/cli.ts
Check plugins/ai/src/public/mod.ts
Check plugins/ai/src/adapter/plugin.ts
Check plugins/ai/scaffold.ts
Check plugins/ai/contracts/v1/mod.ts
Check plugins/auth/mod.ts
Check plugins/auth/src/public/mod.ts
Check plugins/auth/contracts/v1/mod.ts
Check plugins/auth/scaffold.ts
Check plugins/auth/cli.ts
Check plugins/auth/services/src/main.ts
Check plugins/auth/streams/mod.ts
Check plugins/auth/streams/server.ts
Check plugins/sagas/mod.ts
Check plugins/sagas/cli.ts
Check plugins/sagas/src/public/mod.ts
Check plugins/sagas/src/cli/mod.ts
Check plugins/sagas/scaffold.ts
Check plugins/sagas/src/e2e/mod.ts
Check plugins/sagas/src/aspire/mod.ts
Check plugins/sagas/src/runtime/mod.ts
Check plugins/sagas/contracts/v1/mod.ts
Check plugins/sagas/doctor.ts
Check plugins/sagas/services/src/main.ts
Check plugins/sagas/streams/mod.ts
Check plugins/sagas/streams/server.ts
Check plugins/streams/mod.ts
Check plugins/streams/scaffold.ts
Check plugins/streams/cli.ts
Check plugins/streams/src/cli/composition/main.ts
Check plugins/streams/src/e2e/mod.ts
Check plugins/streams/src/aspire/mod.ts
Check plugins/streams/services/src/main.ts
Check plugins/triggers/mod.ts
Check plugins/triggers/cli.ts
Check plugins/triggers/src/aspire/mod.ts
Check plugins/triggers/src/cli/composition/main.ts
Check plugins/triggers/src/public/mod.ts
Check plugins/triggers/src/runtime/mod.ts
Check plugins/triggers/scaffold.ts
Check plugins/triggers/services/src/main.ts
Check plugins/triggers/streams/mod.ts
Check plugins/triggers/streams/server.ts
Check plugins/workers/mod.ts
Check plugins/workers/cli.ts
Check plugins/workers/src/aspire/mod.ts
Check plugins/workers/src/cli/composition/main.ts
Check plugins/workers/contracts/v1/mod.ts
Check plugins/workers/doctor.ts
Check plugins/workers/jobs/health-check.ts
Check plugins/workers/bin/runtime.ts
Check plugins/workers/scaffold.ts
Check plugins/workers/services/src/main.ts
Check plugins/workers/streams/mod.ts
Check plugins/workers/streams/server.ts
Check plugins/workers/worker/mod.ts
Check packages/fresh-ui/mod.ts
Check packages/fresh-ui/src/ai/render-ui.tsx
Check packages/fresh-ui/desktop.ts
Check packages/fresh-ui/interactive.ts
Check packages/fresh-ui/primitives.tsx
Check packages/fresh-ui/registry.ts
Check packages/fresh/mod.ts
Check packages/fresh/src/runtime/server/mod.ts
Check packages/fresh/src/runtime/desktop/mod.ts
Check packages/fresh/src/application/builders/mod.ts
Check packages/fresh/src/application/route/mod.ts
Check packages/fresh/src/application/defer/mod.ts
Check packages/fresh/src/application/form/mod.ts
Check packages/fresh/src/diagnostics/error/mod.ts
Check packages/fresh/src/runtime/streams/mod.ts
Check packages/fresh/src/runtime/ai/mod.ts
Check packages/fresh/src/runtime/ai/sandbox.ts
Check packages/fresh/src/application/query/mod.ts
Check packages/fresh/src/runtime/interactive/mod.ts
Check packages/fresh/src/application/vite/vite.ts
Check packages/fresh/src/testing/mod.ts
Check packages/logger/mod.ts
Check packages/logger/middleware.ts
Check packages/logger/orpc.ts
Check packages/runtime-config/mod.ts
Check packages/telemetry/mod.ts
Check packages/telemetry/config.ts
Check packages/telemetry/tracer.ts
Check packages/telemetry/context.ts
Check packages/telemetry/attributes.ts
Check packages/telemetry/instrumentation.ts
Check packages/telemetry/registry.ts
Check packages/telemetry/orpc.ts
Check packages/telemetry/hono.ts
Check packages/telemetry/ai.ts
Check packages/telemetry/src/adapters/otel/mod.ts
Check packages/telemetry/query.ts
Check packages/telemetry/src/testing/mod.ts
Checking for slow types in the public API...
Check packages/ai/mod.ts
Check packages/ai/anthropic.ts
Check packages/ai/openai-compatible.ts
Check packages/ai/openai-embeddings.ts
Check packages/ai/openrouter.ts
Check packages/ai/ollama.ts
Check packages/ai/mcp.ts
Check packages/ai/agent.ts
Check packages/ai/src/skills/mod.ts
Check packages/ai/src/contracts/mod.ts
Check packages/ai/src/ports/mod.ts
Check packages/ai/tools.ts
Check packages/ai/src/testing/mod.ts
Check packages/aspire/mod.ts
Check packages/aspire/config.ts
Check packages/aspire/schema.ts
Check packages/aspire/types.ts
Check packages/aspire/constants.ts
Check packages/aspire/src/application/mod.ts
Check packages/aspire/src/adapters/mod.ts
Check packages/aspire/src/testing/mod.ts
Check packages/aspire/src/public/mod.ts
Check packages/mcp/mod.ts
Check packages/mcp/cli.ts
Check packages/mcp/openapi-projection.ts
Check packages/auth-better-auth/mod.ts
Check packages/auth-kv-oauth/mod.ts
Check packages/auth-kv-oauth/src/providers.ts
Check packages/auth-kv-oauth/src/store.ts
Check packages/auth-kv-oauth/src/crypto.ts
Check packages/auth-kv-oauth/src/cookies.ts
Check packages/auth-kv-oauth/src/flow.ts
Check packages/auth-kv-oauth/src/backend.ts
Check packages/auth-kv-oauth/src/errors.ts
Check packages/auth-workos/mod.ts
Check packages/cron/mod.ts
Check packages/cron/adapters/mod.ts
Check packages/cron/ports/mod.ts
Check packages/cron/testing/mod.ts
Check packages/database/mod.ts
Check packages/database/ports/mod.ts
Check packages/database/adapters/mod.ts
Check packages/database/adapters/postgres.adapter.ts
Check packages/database/adapters/mssql.adapter.ts
Check packages/database/adapters/mysql.adapter.ts
Check packages/database/extensions/mod.ts
Check packages/database/scripts/mod.ts
Check packages/database/prisma-tracing.ts
Check packages/database/testing/mod.ts
Check packages/kv/mod.ts
Check packages/kv/redis.ts
Check packages/kv/kvdex.ts
Check packages/kv/src/testing/mod.ts
Check packages/prisma-adapter-mysql/mod.ts
Check packages/queue/mod.ts
Check packages/queue/adapters/deno-kv.adapter.ts
Check packages/queue/adapters/redis.adapter.ts
Check packages/queue/adapters/amqp.adapter.ts
Check packages/queue/adapters/postgres.adapter.ts
Check packages/queue/adapters/kv-dead-letter-store.ts
Check packages/queue/adapters/postgres-dead-letter-store.ts
Check packages/queue/adapters/redis-dead-letter-store.ts
Check packages/queue/adapters/kv-polling.adapter.ts
Check packages/queue/ports/mod.ts
Check packages/queue/ports/errors.ts
Check packages/queue/validation/mod.ts
Check packages/queue/testing/mod.ts
Check packages/sdk/mod.ts
Check packages/sdk/src/auto-update/mod.ts
Check packages/sdk/src/desktop/mod.ts
Check packages/sdk/src/cache/mod.ts
Check packages/sdk/src/client/mod.ts
Check packages/sdk/src/collections/mod.ts
Check packages/sdk/src/discovery/mod.ts
Check packages/sdk/src/ports/mod.ts
Check packages/sdk/src/query/mod.ts
Check packages/sdk/src/query-client/mod.ts
Check packages/sdk/src/streams.ts
Check packages/sdk/src/telemetry/mod.ts
Check packages/service/mod.ts
Check packages/service/src/auth/mod.ts
Check packages/service/src/primitives/rpc-path.ts
Check packages/cli/mod.ts
Check packages/cli/scaffolding.ts
Check packages/cli/testing.ts
Check packages/config/mod.ts
Check packages/config/src/merge/mod.ts
Check packages/config/src/paths/mod.ts
Check packages/config/src/schema/plugins/mod.ts
Check packages/contracts/mod.ts
Check packages/contracts/crud.ts
Check packages/contracts/query.ts
Check packages/contracts/transform.ts
Check packages/plugin-ai-core/mod.ts
Check packages/plugin-ai-core/src/contracts/v1/mod.ts
Check packages/plugin-auth-core/mod.ts
Check packages/plugin-auth-core/src/domain/mod.ts
Check packages/plugin-auth-core/src/ports/mod.ts
Check packages/plugin-auth-core/src/contracts/v1/mod.ts
Check packages/plugin-auth-core/src/telemetry/mod.ts
Check packages/plugin-auth-core/src/streams/mod.ts
Check packages/plugin-auth-core/src/config/mod.ts
Check packages/plugin-auth-core/src/presets/mod.ts
Check packages/plugin-auth-core/src/testing/mod.ts
Check packages/plugin-sagas-core/mod.ts
Check packages/plugin-sagas-core/src/builders/mod.ts
Check packages/plugin-sagas-core/src/domain/mod.ts
Check packages/plugin-sagas-core/src/ports/mod.ts
Check packages/plugin-sagas-core/src/runtime/mod.ts
Check packages/plugin-sagas-core/src/adapters/mod.ts
Check packages/plugin-sagas-core/src/transports/mod.ts
Check packages/plugin-sagas-core/src/stores/mod.ts
Check packages/plugin-sagas-core/src/middleware/mod.ts
Check packages/plugin-sagas-core/src/integration/workers/mod.ts
Check packages/plugin-sagas-core/src/integration/publisher/mod.ts
Check packages/plugin-sagas-core/src/telemetry/mod.ts
Check packages/plugin-sagas-core/src/config/mod.ts
Check packages/plugin-sagas-core/src/contracts/v1/mod.ts
Check packages/plugin-sagas-core/src/streams/mod.ts
Check packages/plugin-sagas-core/src/presets/mod.ts
Check packages/plugin-sagas-core/src/abstracts/mod.ts
Check packages/plugin-sagas-core/src/testing/mod.ts
Check packages/plugin-sagas-core/src/agent/mod.ts
Check packages/plugin-streams-core/mod.ts
Check packages/plugin-streams-core/src/sse/mod.ts
Check packages/plugin-streams-core/src/telemetry/mod.ts
Check packages/plugin-streams-core/src/testing/mod.ts
Check packages/plugin-triggers-core/mod.ts
Check packages/plugin-triggers-core/src/adapters/mod.ts
Check packages/plugin-triggers-core/src/builders/mod.ts
Check packages/plugin-triggers-core/src/config/mod.ts
Check packages/plugin-triggers-core/src/contracts/v1/mod.ts
Check packages/plugin-triggers-core/src/domain/mod.ts
Check packages/plugin-triggers-core/src/ports/mod.ts
Check packages/plugin-triggers-core/src/public/mod.ts
Check packages/plugin-triggers-core/src/runtime/mod.ts
Check packages/plugin-triggers-core/src/stores/mod.ts
Check packages/plugin-triggers-core/src/telemetry/mod.ts
Check packages/plugin-triggers-core/src/testing/mod.ts
Check packages/plugin-workers-core/mod.ts
Check packages/plugin-workers-core/src/builders/mod.ts
Check packages/plugin-workers-core/src/contracts/v1/mod.ts
Check packages/plugin-workers-core/src/registry/mod.ts
Check packages/plugin-workers-core/src/state/mod.ts
Check packages/plugin-workers-core/src/executor/mod.ts
Check packages/plugin-workers-core/src/workflow/mod.ts
Check packages/plugin-workers-core/src/streams/mod.ts
Check packages/plugin-workers-core/src/stores/mod.ts
Check packages/plugin-workers-core/src/presets/mod.ts
Check packages/plugin-workers-core/src/shutdown/mod.ts
Check packages/plugin-workers-core/src/domain/public-schema.ts
Check packages/plugin-workers-core/src/telemetry/mod.ts
Check packages/plugin-workers-core/src/abstracts/mod.ts
Check packages/plugin-workers-core/src/testing/mod.ts
Check packages/plugin-workers-core/src/config/mod.ts
Check packages/plugin-workers-core/src/runtime/mod.ts
Check packages/plugin/mod.ts
Check packages/plugin/src/abstracts/mod.ts
Check packages/plugin/src/adapter/mod.ts
Check packages/plugin/src/config/mod.ts
Check packages/plugin/src/cli/mod.ts
Check packages/plugin/loader.ts
Check packages/plugin/src/protocol/mod.ts
Check packages/plugin/src/scaffold/mod.ts
Check packages/plugin/src/sdk/mod.ts
Check packages/plugin/src/testing/mod.ts
Check packages/plugin/src/templates/mod.ts
Check packages/plugin/src/contract-base/mod.ts
Check packages/plugin/src/service/mod.ts
Check packages/watchers/mod.ts
Check plugins/ai/mod.ts
Check plugins/ai/cli.ts
Check plugins/ai/src/public/mod.ts
Check plugins/ai/src/adapter/plugin.ts
Check plugins/ai/scaffold.ts
Check plugins/ai/contracts/v1/mod.ts
Check plugins/auth/mod.ts
Check plugins/auth/src/public/mod.ts
Check plugins/auth/contracts/v1/mod.ts
Check plugins/auth/scaffold.ts
Check plugins/auth/cli.ts
Check plugins/auth/services/src/main.ts
Check plugins/auth/streams/mod.ts
Check plugins/auth/streams/server.ts
Check plugins/sagas/mod.ts
Check plugins/sagas/cli.ts
Check plugins/sagas/src/public/mod.ts
Check plugins/sagas/src/cli/mod.ts
Check plugins/sagas/scaffold.ts
Check plugins/sagas/src/e2e/mod.ts
Check plugins/sagas/src/aspire/mod.ts
Check plugins/sagas/src/runtime/mod.ts
Check plugins/sagas/contracts/v1/mod.ts
Check plugins/sagas/doctor.ts
Check plugins/sagas/services/src/main.ts
Check plugins/sagas/streams/mod.ts
Check plugins/sagas/streams/server.ts
Check plugins/streams/mod.ts
Check plugins/streams/scaffold.ts
Check plugins/streams/cli.ts
Check plugins/streams/src/cli/composition/main.ts
Check plugins/streams/src/e2e/mod.ts
Check plugins/streams/src/aspire/mod.ts
Check plugins/streams/services/src/main.ts
Check plugins/triggers/mod.ts
Check plugins/triggers/cli.ts
Check plugins/triggers/src/aspire/mod.ts
Check plugins/triggers/src/cli/composition/main.ts
Check plugins/triggers/src/public/mod.ts
Check plugins/triggers/src/runtime/mod.ts
Check plugins/triggers/scaffold.ts
Check plugins/triggers/services/src/main.ts
Check plugins/triggers/streams/mod.ts
Check plugins/triggers/streams/server.ts
Check plugins/workers/mod.ts
Check plugins/workers/cli.ts
Check plugins/workers/src/aspire/mod.ts
Check plugins/workers/src/cli/composition/main.ts
Check plugins/workers/contracts/v1/mod.ts
Check plugins/workers/doctor.ts
Check plugins/workers/jobs/health-check.ts
Check plugins/workers/bin/runtime.ts
Check plugins/workers/scaffold.ts
Check plugins/workers/services/src/main.ts
Check plugins/workers/streams/mod.ts
Check plugins/workers/streams/server.ts
Check plugins/workers/worker/mod.ts
Check packages/fresh-ui/mod.ts
Check packages/fresh-ui/src/ai/render-ui.tsx
Check packages/fresh-ui/desktop.ts
Check packages/fresh-ui/interactive.ts
Check packages/fresh-ui/primitives.tsx
Check packages/fresh-ui/registry.ts
Check packages/fresh/mod.ts
Check packages/fresh/src/runtime/server/mod.ts
Check packages/fresh/src/runtime/desktop/mod.ts
Check packages/fresh/src/application/builders/mod.ts
Check packages/fresh/src/application/route/mod.ts
Check packages/fresh/src/application/defer/mod.ts
Check packages/fresh/src/application/form/mod.ts
Check packages/fresh/src/diagnostics/error/mod.ts
Check packages/fresh/src/runtime/streams/mod.ts
Check packages/fresh/src/runtime/ai/mod.ts
Check packages/fresh/src/runtime/ai/sandbox.ts
Check packages/fresh/src/application/query/mod.ts
Check packages/fresh/src/runtime/interactive/mod.ts
Check packages/fresh/src/application/vite/vite.ts
Check packages/fresh/src/testing/mod.ts
Check packages/logger/mod.ts
Check packages/logger/middleware.ts
Check packages/logger/orpc.ts
Check packages/runtime-config/mod.ts
Check packages/telemetry/mod.ts
Check packages/telemetry/config.ts
Check packages/telemetry/tracer.ts
Check packages/telemetry/context.ts
Check packages/telemetry/attributes.ts
Check packages/telemetry/instrumentation.ts
Check packages/telemetry/registry.ts
Check packages/telemetry/orpc.ts
Check packages/telemetry/hono.ts
Check packages/telemetry/ai.ts
Check packages/telemetry/src/adapters/otel/mod.ts
Check packages/telemetry/query.ts
Check packages/telemetry/src/testing/mod.ts
warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/adapters/tanstack-connector.ts:31:30
   | 
31 |     const mcp = await import(TANSTACK_MCP_SPECIFIER);
   |                              ^^^^^^^^^^^^^^^^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/adapters/tanstack-connector.ts:50:30
   | 
50 |     const mcp = await import(TANSTACK_MCP_SPECIFIER);
   |                              ^^^^^^^^^^^^^^^^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/adapters/tanstack-connector.ts:51:32
   | 
51 |     const stdio = await import(TANSTACK_MCP_STDIO_SPECIFIER);
   |                                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/configured-plugin-manifest-loader-child.ts:22:42
   | 
22 |   const imported: unknown = await import(specifier);
   |                                          ^^^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/configured-plugin-manifest-probe-child.ts:16:27
   | 
16 |   imported = await import(moduleSpecifier);
   |                           ^^^^^^^^^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/plugin-registry.ts:450:31
    | 
450 |   const module = await import(resolvePluginImportSpecifier(projectRoot, spec)) as Record<
    |                               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/ui/registry.ts:205:31
    | 
205 |   const module = await import(manifestUrl) as { freshUiRegistryManifest?: UiRegistryManifest };
    |                               ^^^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts:565:33
    | 
565 |     const module = await import(moduleUrl) as Record<string, unknown>;
    |                                 ^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/item/add-plugin-item-command.ts:42:37
   | 
42 |         const module = await import(toFileUrl(cliPath).href) as {
   |                                     ^^^^^^^^^^^^^^^^^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/loader.ts:93:31
   | 
93 |   const module = await import(fileUrl);
   |                               ^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/runtime/job-dispatcher.ts:30:73
   | 
30 |     this.#importModule = options.importModule ?? ((specifier) => import(specifier));
   |                                                                         ^^^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/application/generated-project-registry.ts:69:23
   | 
69 |   return await import(specifier) as Readonly<Record<string, unknown>>;
   |                       ^^^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/discovery/manifest-resolver.ts:33:29
   | 
33 |       module = await import(specifier) as { readonly default?: PluginManifest };
   |                             ^^^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/adapters/otel/otel-sdk.ts:201:25
    | 
201 |     return await import(specifier);
    |                         ^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/services/src/main.ts:121:34
    | 
121 |   const bootstrap = await import(bootstrapModule);
    |                                  ^^^^^^^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/services/src/main.ts:139:55
    | 
139 |   const { createPluginServiceContext } = await import(bootstrapModule) as PluginServiceBootstrap;
    |                                                       ^^^^^^^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/runtime/saga-runner.ts:157:17
    | 
157 |   return import(specifier) as Promise<unknown>;
    |                 ^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/runtime/saga-runner.ts:174:33
    | 
174 |   const imported = await import(bootstrapModule) as SagaRunnerBootstrap;
    |                                 ^^^^^^^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/local-runtime-backend.ts:262:33
    | 
262 |     const module = await import(`${this.files.toImportUrl(path)}?cli=${crypto.randomUUID()}`);
    |                                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/runtime/project-trigger-registry.ts:19:31
   | 
19 |   const module = await import(registryModule);
   |                               ^^^^^^^^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
  --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/main.ts:88:55
   | 
88 |   const { createPluginServiceContext } = await import(bootstrapModule) as PluginServiceBootstrap;
   |                                                       ^^^^^^^^^^^^^^^ the unanalyzable dynamic import
   | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/local-runtime-backend.ts:309:35
    | 
309 |       const module = await import(this.#files.toImportUrl(entrypoint));
    |                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/runtime/generated-jobs.ts:183:25
    | 
183 |     return await import(registryUrl.href) as Record<string, unknown>;
    |                         ^^^^^^^^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

Simulating publish of @netscript/database@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/README.md (6.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/adapters/mod.ts (642B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/adapters/mssql.adapter.ts (15.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/adapters/mysql.adapter.ts (13.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/adapters/postgres.adapter.ts (6.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/deno.json (1.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/extensions/mod.ts (676B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/extensions/sql-json.extension.ts (20.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/mod.ts (7.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/ports/database-client.ts (4.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/ports/mod.ts (372B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/prisma-tracing.ts (10.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/scripts/fix-zod-imports.ts (19.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/scripts/generate-zod.ts (2.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/scripts/migrate.ts (16.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/scripts/mod.ts (925B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/scripts/patch-prisma-client.ts (4.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/testing/mock-database.ts (3.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/database/testing/mod.ts (717B)
Simulating publish of @netscript/plugin-ai-core@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-ai-core/README.md (7.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-ai-core/deno.json (1.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-ai-core/mod.ts (1.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-ai-core/src/contracts/v1/ai.contract-schemas.ts (10.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-ai-core/src/contracts/v1/ai.contract.ts (17.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-ai-core/src/contracts/v1/base-error-adapter.ts (1.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-ai-core/src/contracts/v1/mod.ts (1.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-ai-core/src/public/mod.ts (1.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-ai-core/src/router/ai-router.ts (3.96KB)
Simulating publish of @netscript/plugin-ai@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/README.md (6.45KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/cli.ts (716B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/contracts/v1/mod.ts (372B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/deno.json (1.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/mod.ts (276B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/scaffold.plugin.json (1.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/scaffold.runtime.json (923B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/scaffold.ts (1.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/plugin.ts (5.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/agent/agent.stub.ts (1.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/agent/agent.ts (1.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/barrel/barrel.stub.ts (2.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/barrel/barrel.ts (1.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/chat-route/chat-route.stub.ts (2.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/chat-route/chat-route.ts (813B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/input.ts (1.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/mcp-server/mcp-server.ts (2.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/mcp-tool/mcp-tool.stub.ts (2.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/mcp-tool/mcp-tool.ts (662B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/mod.ts (1.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/models/models.stub.ts (1.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/models/models.ts (759B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/stream-proxy/stream-proxy.stub.ts (5.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/stream-proxy/stream-proxy.ts (855B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/thread-store/thread-store.stub.ts (1.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/thread-store/thread-store.ts (1.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/tool/tool.stub.ts (1.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/adapter/resources/tool/tool.ts (1.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/cli/ai-commands.ts (3.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/cli/ai-project.ts (7.71KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/cli/ai-registry-compiler.ts (14.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/cli/generate-runtime-registries.ts (2.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/cli/sync-ai-project.ts (923B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/constants.ts (751B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/package-metadata.generated.ts (219B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/ai/src/public/mod.ts (3.07KB)
Simulating publish of @netscript/plugin-streams@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/README.md (7.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/cli.ts (492B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/deno.json (2.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/mod.ts (1.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/package.json (145B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/scaffold.plugin.json (1.69KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/scaffold.ts (647B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/services/src/durability.ts (1.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/services/src/main.ts (4.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/services/src/proxy-headers.ts (6.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/services/src/proxy.ts (9.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/plugin.ts (2.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/barrel/barrel.stub.ts (954B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/barrel/barrel.ts (1.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/consumer/consumer.stub.ts (4.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/consumer/consumer.ts (2.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/input.ts (3.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/mod.ts (1006B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/producer/producer.stub.ts (878B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/producer/producer.ts (2.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/schema/schema.stub.ts (664B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/schema/schema.ts (2.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/stream/stream.stub.ts (2.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/adapter/resources/stream/stream.ts (1.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/aspire/mod.ts (473B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/aspire/streams-contribution.ts (1.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/cli/adapters/artifact-writer.ts (893B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/cli/adapters/runtime-client.ts (3.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/cli/adapters/topic-walker.ts (5.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/cli/composition/main.ts (2.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/cli/streams-cli.ts (5.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/cli/streams-types.ts (2.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/e2e/mod.ts (231B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/e2e/probes/health.ts (318B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/e2e/probes/probe-context.ts (1.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/e2e/probes/producer-reconnect.ts (4.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/e2e/probes/publish.ts (700B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/e2e/probes/subscribe.ts (1.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/e2e/streams-gates.ts (1.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/package-metadata.generated.ts (219B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/public/mod.ts (3.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/streams/src/public/stream-api.ts (2.75KB)
Simulating publish of @netscript/plugin-triggers@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/README.md (7.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/cli.ts (496B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/contracts/v1/mod.ts (106B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/contracts/v1/triggers.contract.ts (228B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/database/triggers.prisma (2.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/deno.json (2.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/mod.ts (379B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/package.json (135B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/scaffold.plugin.json (1.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/scaffold.runtime.json (1.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/scaffold.ts (651B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/services/src/main.ts (13.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/services/src/raw-trigger-routes.ts (4.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/services/src/router.ts (905B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/services/src/routers/router-context.ts (1.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/services/src/routers/v1-types.ts (1.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/services/src/routers/v1.ts (15.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/plugin.ts (2.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/barrel/barrel.stub.ts (794B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/barrel/barrel.ts (2.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/file-watch/file-watch.stub.ts (1.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/file-watch/file-watch.ts (1.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/glue/glue.ts (764B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/glue/runtime.stub.ts (682B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/input.ts (6.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/mod.ts (1004B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/scheduled/scheduled.stub.ts (1.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/scheduled/scheduled.ts (2.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/webhook/webhook.stub.ts (2.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/adapter/resources/webhook/webhook.ts (3.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/aspire/mod.ts (602B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/aspire/triggers-contribution.ts (5.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/command-types.ts (1.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/commands.ts (8.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/composition/main.ts (2.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/generate-runtime-registries.ts (7.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/http-triggers-service.ts (4.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/local-runtime-backend.ts (11.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/management-commands.ts (2.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/mod.ts (1.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/trigger-registry-compiler.ts (3.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/trigger-source-editor.ts (2.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/triggers-cli-backend-support.ts (5.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/cli/triggers-cli.ts (1.75KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/constants.ts (952B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/package-metadata.generated.ts (219B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/public/mod.ts (3.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/runtime/mod.ts (2.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/runtime/project-trigger-registry.ts (3.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/runtime/trigger-processor.ts (3.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/src/runtime/trigger-runtime-processor.ts (12.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/streams/factory.ts (2.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/streams/mod.ts (1.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/streams/producer.ts (2.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/streams/schema.ts (3.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/triggers/streams/server.ts (1.75KB)
Simulating publish of @netscript/watchers@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/README.md (5.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/deno.json (1.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/mod.ts (941B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/src/file-watcher.ts (12.71KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/src/filters/debounce.ts (3.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/src/filters/dedup.ts (3.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/src/filters/glob.ts (1.71KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/src/filters/stability.ts (3.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/src/fs.ts (3.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/src/public/mod.ts (963B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/src/strategies/hybrid.ts (2.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/src/strategies/native.ts (3.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/src/strategies/polling.ts (7.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/watchers/src/types.ts (5.93KB)
Simulating publish of @netscript/plugin-workers-core@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/README.md (7.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/deno.json (2.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/mod.ts (1.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/abstracts/job-dispatcher.ts (428B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/abstracts/job-lifecycle-adapter.ts (556B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/abstracts/job-scheduler.ts (874B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/abstracts/mod.ts (1.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/abstracts/registry.ts (444B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/abstracts/task-executor.ts (816B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/abstracts/task-instrumentation.ts (221B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/abstracts/task-runtime-adapter.ts (799B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/abstracts/worker-instrumentation.ts (942B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/abstracts/workers-command.ts (767B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/abstracts/workers-item-scaffolder.ts (568B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/builders/builder-types.ts (2.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/builders/job-builder.ts (9.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/builders/mod.ts (985B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/builders/task-builder.ts (7.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/builders/workflow-builder.ts (5.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/config/config-schema.ts (582B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/config/job-config.ts (3.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/config/mod.ts (1019B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/config/task-config.ts (3.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/config/workers-config.ts (6.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/contracts/v1/mod.ts (840B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/contracts/v1/workers.contract-definition.ts (19.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/contracts/v1/workers.contract-schemas.ts (8.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/contracts/v1/workers.contract-types.ts (4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/contracts/v1/workers.contract.ts (953B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/constants.ts (6.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/cron.ts (3.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/job-context.ts (432B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/job-definition.ts (11.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/job-handler.ts (514B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/job-result.ts (1.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/job-spec.ts (13.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/mod.ts (3.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/permissions.ts (2.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/public-schema.ts (5.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/task.ts (15.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/domain/workflow.ts (6.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/argv-builder.ts (4.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/cmd-runtime-adapter.ts (900B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/command-spec.ts (1.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts (5.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/deno-runtime-adapter.ts (991B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/dotnet-runtime-adapter.ts (667B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/executable-runtime-adapter.ts (699B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/log-classifier.ts (846B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/mod.ts (1.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/path-resolution.ts (1.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/permission-flags.ts (1.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/powershell-runtime-adapter.ts (698B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/python-runtime-adapter.ts (670B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/runtime-adapter-base.ts (2.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/adapters/shell-runtime-adapter.ts (676B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/executor-types.ts (4.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/mod.ts (1.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts (8.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/ports/job-storage-port.ts (510B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/ports/mod.ts (456B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/ports/scheduler-port.ts (319B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/ports/worker-idempotency-port.ts (1.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/ports/worker-port.ts (379B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/presets/mod.ts (790B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/presets/start-workers.ts (723B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/public/root.ts (13.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/registry/kv-job-registry.ts (6.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/registry/kv-task-registry.ts (4.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/registry/memory-job-registry.ts (1.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/registry/mod.ts (921B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/registry/registry-options.ts (890B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/registry/registry-types.ts (5.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/registry/registry.ts (474B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/runtime/composition-root.ts (4.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/runtime/in-process-job-runner.ts (1.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/runtime/job-dispatcher.ts (2.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/runtime/messages.ts (2.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/runtime/mod.ts (5.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/runtime/runtime-types.ts (11.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/runtime/worker-idempotency.ts (1.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/shutdown/mod.ts (290B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/shutdown/shutdown-manager.ts (4.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/state/execution-state.ts (12.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/state/mod.ts (384B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/stores/kv-worker-idempotency-store.ts (7.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/stores/mod.ts (562B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/streams/mod.ts (735B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/streams/producer.ts (4.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/streams/schema.ts (7.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/telemetry/attributes.ts (1.76KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/telemetry/instrumentation.ts (7.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/telemetry/job-tools.ts (3.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/telemetry/mod.ts (1.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/testing/job-fixtures.ts (4.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/testing/memory-job-storage.ts (1.69KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/testing/memory-worker.ts (2.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/testing/mod.ts (1.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/workflow/mod.ts (1.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/workflow/workflow-executor.ts (5.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/workflow/workflow-state.ts (2.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/workflow/workflow-step-runner.ts (2.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-workers-core/src/workflow/workflow-types.ts (1.89KB)
Simulating publish of @netscript/service@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/README.md (8.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/deno.json (1.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/mod.ts (4.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/adapters/runtime-host-budget-timer.ts (1.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/auth/auth-middleware.ts (6.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/auth/hono-context.ts (1.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/auth/mod.ts (1.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/auth/options.ts (1.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/auth/scope-authorizer.ts (2.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/auth/static-credential-authenticator.ts (3.69KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/auth/trusted-header-authenticator.ts (2.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/auth/types.ts (3.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/builder/service-builder-impl.ts (15.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/builder/service-builder.ts (5.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/builder/service-listener.ts (8.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/builder/service-rpc.ts (4.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/builder/service-shutdown.ts (4.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/diagnostics/database-connectivity.ts (14.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/presets/define-service.ts (8.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/primitives/handlers.ts (5.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/primitives/health.ts (7.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/primitives/openapi.ts (4.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/primitives/orpc-router.ts (393B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/primitives/rpc-path.ts (1.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/primitives/scalar.generated.ts (3.31MB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/runtime/runtime-host.ts (6.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/service/src/types.ts (7.53KB)
Simulating publish of @netscript/auth-better-auth@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-better-auth/README.md (5.76KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-better-auth/deno.json (713B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-better-auth/mod.ts (1.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-better-auth/src/better-auth-backend.ts (6.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-better-auth/src/better-auth.ts (10.68KB)
Simulating publish of @netscript/fresh-ui@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/README.md (7.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/deno.json (2.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/desktop.ts (1.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/interactive.ts (3.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/mod.ts (1.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/primitives.tsx (993B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry.generated.ts (350.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry.manifest.ts (48.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry.schema.ts (1.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry.ts (4.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/alert-styles.css (1.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/alert.css (162B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/alert.tsx (1.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/avatar.css (1.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/avatar.tsx (2.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/badge.css (1.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/badge.tsx (1.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/breadcrumb.tsx (2.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/button.css (4.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/button.tsx (4.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/card.css (694B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/card.tsx (2.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/chart-block.css (3.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/chart-block.tsx (3.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/checkbox.css (764B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/checkbox.tsx (1.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/choice-styles.css (868B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/citation-chip.css (1.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/citation-chip.tsx (1.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/code-block.css (1.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/code-block.tsx (1.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/command-palette.css (3.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/command-palette.tsx (4.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/control-props.ts (4.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/data-table.css (867B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/data-table.tsx (2.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/desktop-dialog.css (1.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/desktop-dialog.tsx (2.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/desktop-notification.css (1.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/desktop-notification.tsx (2.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/desktop-tray-menu.css (1.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/desktop-tray-menu.tsx (4.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/desktop-update-prompt.css (2.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/desktop-update-prompt.tsx (3.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/desktop-window-chrome.css (1.99KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/desktop-window-chrome.tsx (3.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/detail-layout.css (303B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/detail-layout.tsx (1.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/donut.css (1.71KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/donut.tsx (2.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/dropzone.css (1.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/dropzone.tsx (8.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/empty-state.css (293B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/empty-state.tsx (915B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/filter-form.css (526B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/filter-form.tsx (1.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/floating.css (1.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/form-control-styles.css (1.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/form-field.css (627B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/form-field.tsx (1.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/icon-button.tsx (1.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/inline-notice.css (178B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/inline-notice.tsx (1.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/input.tsx (890B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/label.css (224B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/label.tsx (1.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/markdown-pipeline.ts (11.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/markdown.css (4.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/message.css (4.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/message.tsx (5.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/model-selector.css (2.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/model-selector.tsx (2.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/page-header.css (402B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/page-header.tsx (2.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/pagination.css (257B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/pagination.tsx (1.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/panel.css (672B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/panel.tsx (2.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/progress.css (1.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/progress.tsx (2.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/prompt-input.css (3.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/prompt-input.tsx (7.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/responsive-table.css (3.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/responsive-table.tsx (3.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/search.css (1.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/search.tsx (1.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/section-divider.css (531B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/section-divider.tsx (845B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/select.tsx (2.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/separator.css (213B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/separator.tsx (955B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/sheet.css (3.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/sidebar-shell.tsx (4.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/skeleton.css (2.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/skeleton.tsx (5.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/spinner.css (860B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/spinner.tsx (1.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/stats-grid.css (1.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/stats-grid.tsx (1.9KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/surface-styles.css (481B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/switch.css (1.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/switch.tsx (1.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/textarea.css (57B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/textarea.tsx (779B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/toast.css (5.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/tool-call-card.css (2.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/components/ui/tool-call-card.tsx (2.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/islands/DesktopOnly.tsx (1.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/islands/McpUiWidget.tsx (6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/islands/SidebarToggle.tsx (2.71KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/islands/ThemeToggle.tsx (3.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/islands/Toast.tsx (5.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/islands/mcp-ui-widget.css (403B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/islands/theme-toggle.css (630B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/lib/cn.ts (387B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/lib/public-types.ts (404B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/lib/toast.ts (2.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/styles/layouts.css (17.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/theme/styles.css (701B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/theme/theme-bridge.css (3.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/theme/tokens.css (8.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/registry/theme/tokens.json (33.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/ai/render-ui.tsx (12.86KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/chat/parse-blocks.ts (22.66KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/desktop/constants.ts (1.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/desktop/create-desktop-chrome.ts (11.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/desktop/mod.ts (1.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/desktop/types.ts (10.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/package-metadata.generated.ts (223B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/presentation/data-grid.tsx (14.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/presentation/primitives.tsx (9.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/_internal/collection-navigation.ts (1.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/_internal/compose-event-handlers.ts (638B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/_internal/compose-refs.ts (446B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/_internal/context-error.ts (1006B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/_internal/dom-types.ts (370B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/_internal/platform-popover.ts (1.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/_internal/public-props.ts (1.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/_internal/use-controllable-signal.ts (802B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/_internal/use-dismissable-layer.ts (1.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/accordion/Accordion.tsx (3.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/accordion/accordion.types.ts (3.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/accordion/use-accordion.ts (9.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/action-menu/ActionMenu.tsx (6.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/action-menu/action-menu.types.ts (2.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/combobox/Combobox.tsx (2.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/combobox/combobox.types.ts (2.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/combobox/combobox.utils.ts (974B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/combobox/use-combobox.ts (6.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/dialog/Dialog.tsx (2.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/dialog/dialog.types.ts (3.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/dialog/use-dialog.ts (5.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/drawer/Drawer.tsx (2.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/drawer/drawer.types.ts (782B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/drawer/use-drawer.ts (113B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/popover/Popover.tsx (3.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/popover/popover.types.ts (4.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/popover/use-popover.ts (7.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/sheet/Sheet.tsx (2.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/sheet/sheet.types.ts (3.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/sheet/use-sheet.ts (5.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/tabs/Tabs.tsx (1.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/tabs/tabs.types.ts (1.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/tabs/tabs.utils.ts (366B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/tabs/use-tabs.ts (5.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/tooltip/Tooltip.tsx (2.71KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/tooltip/tooltip.types.ts (2.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh-ui/src/runtime/tooltip/use-tooltip.ts (7.45KB)
Simulating publish of @netscript/plugin-sagas@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/README.md (7.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/cli.ts (484B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/contracts/v1/mod.ts (455B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/database/sagas.prisma (6.99KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/deno.json (2.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/doctor.ts (113B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/mod.ts (243B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/package.json (272B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/scaffold.plugin.json (1.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/scaffold.runtime.json (776B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/scaffold.ts (639B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/services/src/database-client.ts (2.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/services/src/init.ts (1.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/services/src/main.ts (4.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/services/src/router.ts (672B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/services/src/routers/router-context.ts (1.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/services/src/routers/v1-handlers.ts (10.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/services/src/routers/v1-helpers.ts (7.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/services/src/routers/v1-types.ts (11.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/services/src/routers/v1.ts (321B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/services/src/saga-registry.ts (2.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/adapter/plugin.ts (4.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/adapter/resources/barrel/barrel.stub.ts (563B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/adapter/resources/barrel/barrel.ts (1.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/adapter/resources/glue/glue.ts (749B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/adapter/resources/glue/runtime.stub.ts (2.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/adapter/resources/input.ts (5.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/adapter/resources/mod.ts (731B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/adapter/resources/saga/saga.stub.ts (2.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/adapter/resources/saga/saga.ts (2.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/aspire/mod.ts (513B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/aspire/sagas-contribution.ts (5.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/cli/adapters/runtime-api-client.ts (1.99KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/cli/codemod.ts (3.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/cli/command-types.ts (1.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/cli/commands.ts (8.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/cli/fluent-call-editor.ts (3.75KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/cli/generate-runtime-registries.ts (3.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/cli/local-runtime-backend.ts (11.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/cli/mod.ts (4.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/cli/registry-generator.ts (5.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/cli/saga-inspector.ts (2.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/cli/sagas-cli.ts (1.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/constants.ts (841B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/e2e/mod.ts (696B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/e2e/probes/health.ts (398B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/e2e/probes/probe-context.ts (1.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/e2e/probes/roundtrip.ts (583B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/e2e/sagas-gates.ts (1019B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/package-metadata.generated.ts (219B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/public/mod.ts (3.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/runtime/create-durable-saga-runtime.ts (3.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/runtime/mod.ts (3.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/runtime/project-registry-module.ts (1.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/runtime/saga-delivery.ts (9.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/runtime/saga-instance-projection.ts (9.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/runtime/saga-publisher.ts (11.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/runtime/saga-runner.ts (9.86KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/runtime/saga-supervisor.ts (6.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/src/telemetry/otel-saga-tracer.ts (241B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/streams/factory.ts (2.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/streams/mod.ts (449B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/streams/producer.ts (7.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/streams/schema.ts (442B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/streams/server.ts (534B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/sagas/verify-plugin.ts (1.54KB)
Simulating publish of @netscript/runtime-config@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/runtime-config/README.md (5.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/runtime-config/deno.json (1.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/runtime-config/mod.ts (1.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/runtime-config/src/application/loader.ts (4.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/runtime-config/src/application/watcher.ts (1.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/runtime-config/src/diagnostics/summary.ts (3.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/runtime-config/src/domain/types.ts (4.28KB)
Simulating publish of @netscript/auth-workos@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-workos/README.md (5.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-workos/deno.json (694B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-workos/mod.ts (1.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-workos/src/workos-authenticator.ts (12.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-workos/src/workos-backend.ts (8.17KB)
Simulating publish of @netscript/fresh@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/README.md (8.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/deno.json (4.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/mod.ts (1.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/builder/factory.ts (3.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/builder/form-support.ts (11.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/builder/mod.tsx (18.66KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/builder/route-support.ts (4.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/builder/state.ts (6.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/builder/validators.ts (2.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/catalog.ts (11.86KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/internal.ts (3.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/mod.ts (322B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/navigation/context.ts (2.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/navigation/hooks.ts (4.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/navigation/link.tsx (10.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/navigation/mod.ts (6.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/page-compat.ts (1.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/page-compat/builder-types.ts (1.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/page-compat/context-types.ts (8.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/page-compat/definition-types.ts (5.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/page-compat/form-types.ts (6.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/page-compat/partial-types.ts (183B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/page-compat/route-types.ts (9.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/page-compat/shared-types.ts (1.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/runtime/context.ts (4.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/runtime/handlers.ts (1.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/runtime/mod.tsx (10.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/runtime/render.tsx (3.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/search-params.ts (4.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-page/types.ts (14.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/define-partial.tsx (4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/builders/mod.ts (1.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/cache-entries/cache-entry.ts (1.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/cache-entries/mod.ts (1.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/defer/DeferIsland.tsx (7.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/defer/DeferPage.tsx (9.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/defer/Deferred.tsx (2.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/defer/mod.ts (366B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/defer/policy.ts (6.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/defer/telemetry.ts (6.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/_internal/descriptor-types.ts (4.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/_internal/intent-reply-types.ts (8.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/_internal/page-types.ts (1.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/_internal/prop-types.ts (7.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/_internal/runtime-types.ts (5.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/_internal/types.ts (1.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/_internal/value-types.ts (1.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/components/enhancement.tsx (7.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/components/form-region.tsx (846B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/components/form.tsx (2.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/field-descriptors/aria-data.ts (1.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/field-descriptors/collection.ts (5.69KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/field-descriptors/constraints.ts (1.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/field-descriptors/descriptor.ts (5.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/field-descriptors/entry.ts (51B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/field-descriptors/mod.ts (2.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/mod.ts (2.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/runtime/collection-keys.ts (1.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/runtime/config.ts (4.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/runtime/handler-context.ts (2.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/runtime/idempotency.ts (487B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/runtime/intent.ts (8.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/runtime/pagination.ts (2.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/runtime/reply.ts (6.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/runtime/state.ts (6.75KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/runtime/telemetry.ts (1.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/runtime/types.ts (1.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/schema-adapter/contract.ts (2.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/schema-adapter/entry.ts (370B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/schema-adapter/mod.ts (522B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/schema-adapter/standard.ts (5.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/schema-adapter/zod-constraints.ts (6.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/schema-adapter/zod-defaults.ts (3.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/schema-adapter/zod-errors.ts (1.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/schema-adapter/zod-internals.ts (1.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/schema-adapter/zod.ts (1.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/validation/csrf.ts (2.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/validation/error-normalization.ts (2.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/validation/errors.ts (2.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/form/validation/pipeline.ts (7.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/query/cache-invalidation/mod.ts (1.76KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/query/hooks.ts (8.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/query/hydration-script.tsx (2.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/query/hydration.ts (1.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/query/mod.ts (2.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/query/query-client.ts (1.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/query/query-island.tsx (1.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/query/query-types.ts (9.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/route/_internal/contract-runtime.ts (15.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/route/_internal/contract-types.ts (8.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/route/contract.ts (291B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/route/manifest-page-module.ts (13.88KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/route/manifest-types.ts (2.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/route/manifest.ts (19.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/route/mod.ts (6.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/route/pagination-types.ts (4.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/route/schema-output.ts (727B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/route/types.ts (14.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/application/vite/vite.ts (14.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/diagnostics/error/ErrorDisplay.tsx (4.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/diagnostics/error/classify.ts (1.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/diagnostics/error/extract.ts (1.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/diagnostics/error/handler.ts (2.99KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/diagnostics/error/mod.ts (614B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/diagnostics/error/primitives.ts (1.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/diagnostics/error/types.ts (642B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/internal/package-telemetry/telemetry.ts (2.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/ai/create-chat-connection.ts (25.66KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/ai/mcp-app-call-handler.ts (12.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/ai/mcp-sandbox-handler.ts (8.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/ai/mod.ts (5.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/ai/sandbox.ts (834B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/ai/stream-proxy.ts (8.71KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts (2.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/desktop/constants.ts (375B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/desktop/mod.ts (711B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/desktop/types.ts (3.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/interactive-hooks/use-promise.ts (1.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/interactive/mod.ts (348B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/server/define-fresh-app.ts (4.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/server/fresh-app-telemetry.ts (1.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/server/mod.ts (1011B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/server/query-cache-invalidation.ts (2.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/server/sse.ts (12.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/server/stream-error-boundary.tsx (2.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/server/stream.ts (7.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/streams/create-stream-db.ts (5.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/streams/create-stream-event-source.ts (2.71KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/runtime/streams/mod.ts (3.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/src/testing/mod.ts (4.69KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/tests/fixtures/builders/form-page.tsx (1.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/tests/fixtures/builders/layer-page.tsx (1.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/tests/fixtures/builders/partial-page.tsx (884B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/tests/fixtures/builders/routed-page/[id].tsx (1.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/tests/fixtures/builders/search-page.tsx (1.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/tests/fixtures/builders/static-page.tsx (793B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/fresh/tests/runtime-catalog-dependencies.ts (245B)
Simulating publish of @netscript/config@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/README.md (4.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/define-config.ts (2.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/deno.json (1.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/env.ts (3.88KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/loader.ts (4.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/mod.ts (3.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/diagnostics/inspect-config.ts (1.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/config-root-types.ts (3.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/config-section-types.ts (20.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/mod.ts (718B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/saga-inputs.ts (2.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/app-schema.ts (686B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/aspire-schema.ts (476B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/database-schema.ts (853B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/deploy-schema.ts (14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/gateway-schema.ts (388B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/logging-schema.ts (600B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/netscript-config-schema.ts (5.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/paths-schema.ts (1.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/permissions-schema.ts (1.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/runtime-config-schema.ts (792B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/sdk-schema.ts (820B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/domain/schemas/service-schema.ts (711B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/merge/mod.ts (5.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/paths/mod.ts (4.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/public/mod.ts (2.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/src/schema/plugins/mod.ts (6.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/types.ts (279B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/config/workspace.ts (5.67KB)
Simulating publish of @netscript/plugin-streams-core@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/README.md (7.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/deno.json (1.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/mod.ts (2.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/adapters/durable-stream-producer-transport.ts (4.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/adapters/system-stream-producer-clock.ts (1.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/adapters/system-stream-producer-random.ts (330B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/application/create-durable-stream.ts (10.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/application/create-service-stream-producer.ts (2.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/application/durable-stream-producer-queue.ts (4.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/application/durable-stream-producer-supervisor-contract.ts (2.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/application/durable-stream-producer-supervisor.ts (15.9KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/application/durable-stream-producer-support.ts (3.76KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/application/stream-sse-v1.ts (7.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/application/stream-url-resolver.ts (5.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/builders/define-stream-schema.ts (1.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/diagnostics/inspect-stream-topic.ts (1.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/domain/constants.ts (342B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/domain/producer-contract-v1.ts (4.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/domain/sse-contract-v1.ts (9.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/domain/stream-event.ts (880B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/domain/stream-schema.ts (3.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/package-metadata.generated.ts (215B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/ports/stream-producer-clock-port.ts (246B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/ports/stream-producer-port.ts (1.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/ports/stream-producer-random-port.ts (183B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/ports/stream-producer-transport-port.ts (2.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/public/mod.ts (2.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/sse/mod.ts (1.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/telemetry/attributes.ts (3.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/telemetry/instrumentation.ts (11.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/telemetry/mod.ts (1.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/telemetry/producer-metrics.ts (8.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/testing/memory-stream-producer.ts (3.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/testing/mod.ts (365B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-streams-core/src/testing/topic-fixtures.ts (1.13KB)
Simulating publish of @netscript/cron@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cron/README.md (4.9KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cron/adapters/_shared.ts (6.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cron/adapters/deno.adapter.ts (8.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cron/adapters/memory.adapter.ts (11.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cron/adapters/mod.ts (759B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cron/deno.json (944B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cron/mod.ts (5.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cron/ports/mod.ts (976B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cron/ports/scheduler.ts (4.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cron/ports/types.ts (7.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cron/testing/mod.ts (226B)
Simulating publish of @netscript/plugin-triggers-core@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/README.md (8.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/deno.json (1.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/mod.ts (383B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/adapters/cron-trigger-scheduler-adapter.ts (7.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/adapters/hmac-sha256-webhook-verifier.ts (2.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/adapters/memory-webhook-verifier.ts (1.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/adapters/mod.ts (1.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/adapters/watchers-file-watcher-adapter.ts (8.69KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/builders/define-file-watch.ts (3.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/builders/define-scheduled-trigger.ts (2.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/builders/define-webhook.ts (2.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/builders/mod.ts (1.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/config/define-triggers.ts (246B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/config/mod.ts (668B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/config/trigger-config-schema.ts (4.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/contracts/v1/mod.ts (1.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/contracts/v1/triggers.contract.ts (24.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/domain/constants.ts (3.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/domain/errors.ts (4.75KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/domain/ids.ts (430B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/domain/mod.ts (2.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/domain/scheduled-spec.ts (320B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/domain/trigger-action.ts (1.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/domain/trigger-context.ts (215B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/domain/trigger-definition.ts (4.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/domain/trigger-event.ts (2.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/domain/trigger-spec.ts (992B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/file-watcher-port.ts (1.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/mod.ts (2.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/trigger-clock-port.ts (300B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/trigger-defer-scheduler-port.ts (1.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/trigger-dlq-port.ts (915B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/trigger-enabled-state-port.ts (730B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/trigger-event-store-port.ts (892B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/trigger-event-subscription-port.ts (1.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/trigger-idempotency-port.ts (899B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/trigger-ingress-port.ts (624B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/trigger-processor-port.ts (1.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/trigger-scheduler-port.ts (1.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/ports/webhook-verifier-port.ts (592B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/public/mod.ts (3.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/runtime/compute-next-fire-times.ts (8.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/runtime/create-event-subscription.ts (2.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/runtime/create-manual-dispatcher.ts (3.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/runtime/create-trigger-ingress.ts (8.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/runtime/create-trigger-processor.ts (295B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/runtime/create-webhook-test-delivery.ts (4.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/runtime/logger.ts (1.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/runtime/mod.ts (3.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/runtime/trigger-processor.ts (10.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/stores/kv-trigger-defer-scheduler.ts (5.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/stores/kv-trigger-enabled-state-store.ts (2.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/stores/kv-trigger-runtime-stores.ts (9.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/stores/mod.ts (1.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/telemetry/attributes.ts (5.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/telemetry/instrumentation.ts (10.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/telemetry/mod.ts (1.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/testing/deno-kv-trigger-event-store-double.ts (2.76KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/testing/inline-trigger-processor.ts (1.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/testing/memory-file-watcher-adapter.ts (3.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/testing/memory-trigger-defer-scheduler.ts (3.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/testing/memory-trigger-enabled-state-store.ts (1.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/testing/memory-trigger-event-store.ts (2.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/testing/memory-trigger-idempotency-store.ts (2.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/testing/memory-trigger-scheduler-adapter.ts (3.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/testing/mod.ts (2.76KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/testing/recording-trigger-event-store.ts (2.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-triggers-core/src/testing/trigger-test-clock.ts (1.35KB)
Simulating publish of @netscript/plugin-auth-core@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/README.md (6.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/deno.json (1.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/mod.ts (499B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/config/mod.ts (3.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/contracts/v1/auth.contract.ts (17.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/contracts/v1/base-error-adapter.ts (1.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/contracts/v1/mod.ts (828B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/domain/mod.ts (5.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/ports/mod.ts (12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/presets/mod.ts (1.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/public/mod.ts (2.8KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/streams/mod.ts (2.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/telemetry/attributes.ts (4.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/telemetry/instrumentation.ts (12.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/telemetry/mod.ts (640B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/telemetry/redaction.ts (3.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-auth-core/src/testing/mod.ts (1.68KB)
Simulating publish of @netscript/plugin@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/README.md (6.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/deno.json (2.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/loader.ts (2.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/mod.ts (3.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/mod.ts (1.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/plugin-aspire-contribution.ts (389B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/plugin-background-processor-contribution.ts (529B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/plugin-contract-version-contribution.ts (513B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/plugin-contribution.ts (275B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/plugin-db-schema-contribution.ts (513B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/plugin-e2e-contribution.ts (465B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/plugin-migration-contribution.ts (470B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/plugin-runtime-config-topic-contribution.ts (520B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/plugin-service-contribution.ts (471B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/plugin-stream-topic-contribution.ts (649B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/abstracts/plugin-telemetry-contribution.ts (463B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/commands/doctor.ts (1.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/commands/info.ts (1.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/commands/install.ts (4.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/commands/remove.ts (989B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/commands/update.ts (1010B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/contract.ts (10.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/defaults.ts (2.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/factory.ts (1.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/item/artifact.ts (1.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/item/item-scaffolder.ts (842B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/item/substitute.ts (2.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/mod.ts (3.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/runner/plugin-cli-runner.ts (4.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapter/scaffold-cli-runner.ts (3.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapters/memory-file-system-adapter.ts (778B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/adapters/mod.ts (75B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/application/mod.ts (112B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/application/plugin-loader.ts (348B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/application/plugin-registry.ts (760B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/adapters/project-files.ts (6.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/application/argv.ts (1.8KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/application/base-meta-commands.ts (2.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/application/generated-project-registry.ts (2.66KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/application/registry-emitter.ts (6.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/application/scaffold-plan.ts (1.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/base/doctor-report.ts (714B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/base/plugin-cli.ts (673B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/base/plugin-runtime-config-cli.ts (522B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/composition/cliffy-runner.ts (499B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/composition/mount-plugin-cli.ts (411B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/mod.ts (1.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/presentation/help-formatter.ts (287B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/presentation/verb-router.ts (423B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/cli/types.ts (1.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/application/contribution-merger.ts (1.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/builders/define-plugin.ts (377B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/builders/plugin-builder.ts (13.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/background-processor-contribution.ts (305B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/contract-version-contribution.ts (263B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/contribution-axes.ts (57B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/db-schema-contribution.ts (278B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/e2e-contribution.ts (216B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/migration-contribution.ts (212B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/plugin-contributions.ts (2.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/plugin-dependencies.ts (206B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/plugin-lifecycle-hooks.ts (661B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/plugin-manifest.ts (1.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/plugin-metadata.ts (177B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/runtime-config-topic-contribution.ts (256B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/service-contribution.ts (260B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/stream-topic-contribution.ts (212B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/domain/telemetry-contribution.ts (242B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/mod.ts (2.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/validators/contribution-axis-validator.ts (266B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/validators/manifest-schema.ts (941B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/config/validators/reserved-names.ts (268B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/contract-base/domain/base-contract.ts (4.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/contract-base/domain/base-errors.ts (3.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/contract-base/domain/capabilities.ts (3.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/contract-base/mod.ts (1.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/diagnostics/e2e-gate.ts (1.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/diagnostics/inspect-plugin.ts (2.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/diagnostics/inspect-walker-output.ts (271B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/diagnostics/mod.ts (1.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/diagnostics/probes.ts (5.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/diagnostics/verify-plugin.ts (14.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/domain/constants.ts (1.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/domain/core-types.ts (1.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/domain/errors.ts (894B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/domain/installed-version.ts (169B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/domain/mod.ts (641B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/domain/schema-types.ts (1.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/kernel/assets/embedded.generated.ts (12.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/kernel/assets/template-registry.ts (1.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/ports/file-system-port.ts (354B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/ports/mod.ts (61B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/protocol/manifest.ts (15.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/protocol/mod.ts (853B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/protocol/scaffolder.ts (1.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/scaffold/mod.ts (4.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/application/run-walker-pipeline.ts (992B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/discovery/ast-extractor.ts (3.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/discovery/filesystem-walker.ts (1.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/discovery/manifest-resolver.ts (4.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/discovery/ports/emitter-port.ts (507B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/discovery/ports/extractor-port.ts (636B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/discovery/ports/manifest-resolver-port.ts (310B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/discovery/ports/walker-port.ts (422B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/discovery/registry-emitter.ts (2.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/discovery/source-graph.ts (679B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/discovery/watcher.ts (349B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/mod.ts (2.66KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/presets/start-walker.ts (652B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/presets/start-watcher.ts (269B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/runtime/doctor-runner.ts (253B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/runtime/instrumentation-bridge.ts (515B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/runtime/plugin-context.ts (436B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/runtime/plugin-host-bootstrap.ts (434B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/sdk/runtime/plugin-service-context.ts (781B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/service/mod.ts (1.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/service/presentation/create-plugin-service.ts (7.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/service/presentation/plugin-contract-binder.ts (6.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/mod.ts (329B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/README.md.template (4.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/deno.json.template (1.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/docs/architecture.md.template (701B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/mod.ts.template (1.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/src/aspire/%7B%7Bplugin-name%7D%7D-contribution.ts.template (284B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/src/aspire/mod.ts.template (184B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/src/cli/%7B%7Bplugin-name%7D%7D-cli.ts.template (463B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/src/cli/composition/main.ts.template (399B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/src/e2e/mod.ts.template (433B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/src/public/mod.ts.template (223B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/src/scaffolding/mod.ts.template (244B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/src/testing/mod.ts.template (269B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/templates/skeleton/tests/_fixtures/readme-examples_test.ts.template (199B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/testing/manifest-fixtures.ts (359B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/testing/memory-emitter.ts (66B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/testing/memory-manifest-resolver.ts (56B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/testing/memory-walker.ts (66B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/testing/mod.ts (1.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/testing/plugin-cli-contract.ts (241B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin/src/testing/walker-fixtures.ts (209B)
Simulating publish of @netscript/plugin-sagas-core@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/README.md (8.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/deno.json (2.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/mod.ts (360B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/abstracts/abstract-agent-runtime.ts (930B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/abstracts/abstract-saga-bus.ts (1.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/abstracts/abstract-saga-store.ts (1.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/abstracts/abstract-saga-transport.ts (820B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/abstracts/mod.ts (1.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/adapters/mod.ts (2.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts (8.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/agent/define-agent.ts (284B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/agent/mod.ts (207B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/builders/define-query.ts (477B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/builders/define-saga.ts (11.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/builders/define-signal.ts (478B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/builders/mod.ts (813B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/config/config-schema.ts (580B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/config/define-saga-config.ts (5.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/config/mod.ts (899B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/config/saga-config-schema.ts (7.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/contracts/v1/mod.ts (824B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/contracts/v1/sagas.contract.ts (25.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/cascaded-message.ts (1.76KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/constants.ts (2.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/errors.ts (2.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/ids.ts (646B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/mod.ts (1.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/retry-policy.ts (558B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/saga-context.ts (831B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/saga-correlation.ts (557B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/saga-definition.ts (2.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/saga-message.ts (584B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/saga-state.ts (782B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/domain/saga-transition.ts (1.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/integration/publisher/mod.ts (427B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/integration/publisher/saga-publisher-port.ts (2.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/integration/workers/mod.ts (637B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/integration/workers/trigger-job.ts (1.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/integration/workers/trigger-task.ts (1.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/integration/workers/triggers.ts (1.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/integration/workers/types.ts (2.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/middleware/mod.ts (999B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/middleware/saga-middleware.ts (3.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/middleware/sse-events-middleware.ts (6.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/package-metadata.generated.ts (215B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/ports/mod.ts (1.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/ports/saga-agent-runtime-port.ts (1.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/ports/saga-applied-key-port.ts (951B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/ports/saga-bus-port.ts (2.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/ports/saga-clock-port.ts (567B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/ports/saga-history-store-port.ts (1.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/ports/saga-idempotency-port.ts (420B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/ports/saga-outbox-port.ts (919B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/ports/saga-store-port.ts (1.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/ports/saga-transport-port.ts (1.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/presets/mod.ts (428B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/presets/start-sagas.ts (2.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/public/messages.ts (4.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/public/mod.ts (1.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts (4.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/runtime/logger.ts (1.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/runtime/mod.ts (2.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/runtime/saga-applied-keys.ts (1.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/runtime/saga-compensator.ts (4.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/runtime/saga-engine.ts (16.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/runtime/saga-idempotency.ts (5.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/runtime/saga-scheduler.ts (7.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/stores/kv-saga-runtime-stores.ts (4.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/stores/kv-saga-store.ts (6.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/stores/mod.ts (2.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/stores/prisma-saga-store.ts (10.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/stores/saga-store-backend.ts (2.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/streams/mod.ts (541B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/streams/schema.ts (3.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/telemetry/attributes.ts (5.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/telemetry/instrumentation.ts (11.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/telemetry/mod.ts (1.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/telemetry/otel-saga-telemetry.ts (5.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/testing/create-test-saga-runtime.ts (1.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/testing/memory-saga-bus.ts (2.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/testing/memory-saga-store.ts (3.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/testing/mod.ts (1.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/testing/recording-saga-store.ts (3.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/testing/test-saga-clock.ts (1.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/transports/list-transport-commands.ts (9.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/transports/list-transport-delayed.ts (4.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/transports/list-transport-subscription.ts (5.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/transports/list-transport.ts (9.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/transports/mod.ts (2.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/transports/redis-transport-commands.ts (11.9KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/transports/redis-transport-delayed.ts (4.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/transports/redis-transport-subscription.ts (4.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/plugin-sagas-core/src/transports/redis-transport.ts (9.55KB)
Simulating publish of @netscript/telemetry@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/README.md (8.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/ai.ts (347B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/attributes.ts (131B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/config.ts (130B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/context.ts (125B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/deno.json (1.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/hono.ts (119B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/instrumentation.ts (141B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/mod.ts (2.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/orpc.ts (119B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/query.ts (1.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/registry.ts (270B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/adapters/ai/otel-ai-telemetry.ts (4.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/adapters/aspire-query/aspire-telemetry-normalize.ts (14.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/adapters/aspire-query/aspire-telemetry-query.ts (6.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/adapters/aspire-query/mod.ts (271B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/adapters/otel/mod.ts (952B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/adapters/otel/otel-deno.ts (6.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/adapters/otel/otel-sdk.ts (14.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/adapters/otel/select-provider.ts (2.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/fan-in-links.ts (1.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/mod.ts (346B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/query/mod.ts (1.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/query/schema.ts (7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/query/types.ts (360B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/registry/instrumentation-registry.ts (2.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/registry/mod.ts (341B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/registry/provider-registration.ts (2.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/registry/types.ts (1.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/span-utils.ts (809B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/span.ts (2.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/application/tracer.ts (2.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/execution.ts (847B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/genai.ts (606B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/helpers.ts (7.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/job.ts (1.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/kv.ts (484B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/messaging.ts (1.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/mod.ts (471B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/saga.ts (1.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/scheduler.ts (742B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/spans.ts (1.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/sse.ts (763B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/trigger.ts (2.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/attributes/worker.ts (307B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/config/constants.ts (4.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/config/environment.ts (4.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/config/mod.ts (253B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/config/provider-registration.ts (1.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/config/schema.ts (4.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/config/singleton.ts (488B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/context/helpers.ts (2.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/context/message.ts (1.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/context/mod.ts (440B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/context/payload-context.ts (1.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/context/types.ts (980B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/context/w3c.ts (7.69KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/diagnostics/inspect-telemetry.ts (2.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/domain/mod.ts (121B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/domain/query.ts (6.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/domain/telemetry-convention.ts (3.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/domain/types.ts (5.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/hono/mod.ts (220B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/hono/otel-middleware.ts (2.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/instrumentation/mod.ts (267B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/instrumentation/queue.ts (11.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/instrumentation/scheduler.ts (14.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/instrumentation/types.ts (2.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/instrumentation/worker.ts (18.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/orpc/_types.ts (1.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/orpc/_utils.ts (488B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/orpc/error-plugin.ts (11.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/orpc/handler-context.ts (6.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/orpc/mod.ts (682B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/orpc/tracing-plugin.ts (8.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/ports/meter-port.ts (2.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/ports/mod.ts (613B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/ports/propagator-port.ts (1.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/ports/provider-options.ts (1.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/ports/span-link-port.ts (1.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/ports/telemetry-query-port.ts (2.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/ports/tracer-provider-port.ts (2.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/testing/in-memory-span-recorder.ts (8.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/src/testing/mod.ts (123B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/telemetry/tracer.ts (128B)
Simulating publish of @netscript/contracts@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/README.md (5.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/crud.ts (757B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/crud/create-crud-contract.ts (16.88KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/deno.json (1.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/mod.ts (694B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/query.ts (606B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/schemas/filters.ts (6.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/schemas/pagination.ts (7.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/src/application/contract-primitives.ts (5.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/src/application/paginated-query.ts (6.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/src/application/transform-helpers.ts (5.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/src/application/zod-helpers.ts (4.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/src/diagnostics/inspection.ts (1.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/src/domain/constants.ts (1.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/src/domain/errors.ts (3.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/src/domain/result.ts (431B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/src/domain/schema-types.ts (3.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/src/domain/schemas.ts (7.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/src/public/mod.ts (2.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/contracts/transform.ts (383B)
Simulating publish of @netscript/ai@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/README.md (11.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/agent.ts (2.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/anthropic.ts (2.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/deno.json (1.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/docs/architecture.md (6.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/mcp.ts (1.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/mod.ts (3.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/ollama.ts (3.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/openai-compatible.ts (3.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/openai-embeddings.ts (1.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/openrouter.ts (2.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/adapters/anthropic.adapter.ts (8.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/adapters/http-reachability.adapter.ts (3.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/adapters/in-memory-retriever.adapter.ts (6.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/adapters/in-memory-vector-memory-store.ts (1.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/adapters/ollama.adapter.ts (7.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/adapters/openai-compatible.adapter.ts (8.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/adapters/openai-embeddings.adapter.ts (5.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/adapters/openai-vision.adapter.ts (4.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/adapters/openrouter.adapter.ts (9.66KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/adapters/tanstack-chat-client.ts (12.88KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/agent/errors.ts (793B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/agent/history.ts (5.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/agent/loop.ts (12.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/agent/state.ts (1.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/application/backoff.ts (662B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/application/provider-retry.ts (5.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/application/vector-memory.ts (3.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/contracts/chunk.ts (3.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/contracts/content.ts (2.86KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/contracts/errors.ts (5.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/contracts/generation.ts (2.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/contracts/message.ts (1.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/contracts/mod.ts (568B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/contracts/model.ts (2.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/contracts/prompt.ts (3.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/contracts/tool.ts (2.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/contracts/ui.ts (1.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/contracts/usage.ts (2.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/adapters/base-transport.ts (4.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/adapters/stdio-transport.ts (3.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/adapters/streamable-http-transport.ts (3.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/adapters/tanstack-connector.ts (4.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/application/auth.ts (599B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/application/backoff.ts (865B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/application/factory.ts (821B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/application/pool.ts (11.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/application/register-tools.ts (2.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/mcp/application/signal.ts (657B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/agent-loop.ts (2.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/chat-client.ts (6.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/embedding.ts (3.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/mcp-transport.ts (6.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/memory.ts (3.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/mod.ts (1.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/model-provider.ts (4.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/reachability.ts (2.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/retriever.ts (2.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/skill-loader.ts (552B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/telemetry.ts (1.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/tool-registry.ts (1.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/ports/vision.ts (3.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/runtime/mod.ts (6.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/skills/adapters/in-memory-skill-content-source.ts (1.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/skills/application/create-skill-loader.ts (2.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/skills/application/match-skills.ts (2.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/skills/application/parse-skill-markdown.ts (3.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/skills/domain/types.ts (3.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/skills/mod.ts (1.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/testing/fakes.ts (7.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/testing/mod.ts (861B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/tools/adapters/in-memory-registry.ts (4.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/tools/application/builder.ts (6.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/tools/application/registry.ts (1.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/tools/application/render-ui.ts (1.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/tools/domain/definition.ts (3.86KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/src/tools/domain/render-ui.ts (3.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/ai/tools.ts (2.39KB)
Simulating publish of @netscript/plugin-workers@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/README.md (6.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/bin/combined.ts (432B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/bin/runtime.ts (6.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/bin/scheduler.ts (86B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/bin/worker.ts (80B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/cli.ts (492B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/contracts/v1/mod.ts (556B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/database/workers.prisma (8.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/deno.json (2.86KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/doctor.ts (117B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/jobs/health-check.ts (8.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/jobs/job-tools.ts (231B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/mod.ts (162B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/package.json (272B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/scaffold.plugin.json (1.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/scaffold.runtime.json (1.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/scaffold.ts (647B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/generated-jobs.ts (868B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/init.ts (4.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/main.ts (3.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/router.ts (701B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/routers/admin.ts (2.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/routers/describe.ts (1.66KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/routers/jobs.ts (4.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/routers/router-context.ts (3.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/routers/runs.ts (5.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/routers/subscribe.ts (4.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/routers/tasks.ts (3.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/routers/v1.ts (1.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/services/src/service-runtime.ts (2.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/plugin.ts (5.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/barrel/barrel.stub.ts (537B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/barrel/barrel.ts (1.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/glue/glue.ts (759B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/glue/runtime.stub.ts (994B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/input.ts (4.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/job/job.stub.ts (984B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/job/job.ts (1.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/mod.ts (1.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/resource-metadata.ts (3.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/task/task.stub.ts (1.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/task/task.ts (3.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/workflow/workflow.stub.ts (653B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/adapter/resources/workflow/workflow.ts (1.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/aspire/mod.ts (526B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/aspire/workers-contribution.ts (2.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/adapters/runtime-api-client.ts (2.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/command-types.ts (2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/commands.ts (15.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/composition/main.ts (4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/generate-runtime-registries.ts (2.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/local-runtime-backend.ts (17.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/mod.ts (1.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/official-sample-configuration.ts (11.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/registry-compiler.ts (4.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/runtime-registry-generator.ts (12.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/cli/workers-cli.ts (2.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/e2e/mod.ts (231B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/e2e/probes/health.ts (318B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/e2e/probes/probe-context.ts (283B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/e2e/workers-gates.ts (942B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/package-metadata.generated.ts (219B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/public/mod.ts (4.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/src/runtime/generated-jobs.ts (7.75KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/streams/factory.ts (2.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/streams/mod.ts (608B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/streams/producer.ts (1.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/streams/schema.ts (253B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/streams/server.ts (762B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/job-dispatcher.ts (10.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/job-execution.ts (7.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/job-runner-pool.ts (1.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/listener-supervisor.ts (4.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/mod.ts (1.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/queue-consumer.ts (4.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/scheduler-dispatch.ts (2.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/scheduler-events.ts (1003B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/scheduler-info.ts (549B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/scheduler-options.ts (3.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/scheduler-scheduling.ts (1.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/scheduler-tracing.ts (2.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/scheduler.ts (9.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/worker-idempotency-events.ts (1.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/worker-options.ts (7.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/workers/worker/worker.ts (12.42KB)
Simulating publish of @netscript/cli@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/README.md (17.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/assets/schema/config-file.v1.json (48.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/bin/netscript.ts (948B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/deno.json (2.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/mod.ts (490B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/scaffolding.ts (2.45KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/aspire/apphost-doctor-inspector.ts (3.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target.ts (11.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts (7.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/configured-plugin-manifest-loader-child.ts (1.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/configured-plugin-manifest-probe-child.ts (1.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/configured-plugin-manifest-probe.ts (3.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/deploy-config-background.ts (5.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/deploy-config-resolvers.ts (14.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/deploy-config-types.ts (2.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/deploy-config.ts (8.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/infrastructure-connection-strings.ts (8.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/infrastructure-docker.ts (2.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/infrastructure-resolvers.ts (8.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/infrastructure.ts (2.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/plugin-registry.ts (17.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/project-config-loader-child.ts (802B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/project-config-loader.ts (2.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/config/runtime-config/deno-runtime-config-store.ts (3.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/contracts/contract-scaffolder.ts (7.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/contracts/contract-source.ts (4.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/contracts/templates/contract-template-registry.ts (1.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/contracts/templates/generate-deno-json.ts (97B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/contracts/templates/generate-v1-mod.ts (2.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/contracts/types.ts (4.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/contracts/version-registry.ts (2.88KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/contracts/workspace-resolver.ts (3.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/apphost-lifecycle-lock.ts (5.88KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/aspire-command-executor.ts (1.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/operation-runner-helpers.ts (4.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/operation-runner.ts (11.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/providers/database-providers.ts (265B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/providers/mssql.provider.ts (557B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/providers/mysql.provider.ts (531B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/providers/postgres.provider.ts (560B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/providers/sqlite.provider.ts (549B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/scaffolder.ts (7.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/workspace-mutator.ts (9.9KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/database/workspace-resolver.ts (3.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deno-deploy/create-deno-deploy-target.ts (1.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deno-deploy/deno-deploy-cli.ts (2.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deno-deploy/deno-deploy-preflight.ts (2.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/commands/admin-command.ts (1.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/commands/install.ts (5.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/commands/manifest-command.ts (2.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/commands/servy-command.ts (2.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/compile/compile-bundler.ts (7.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/compile/compile-config.ts (3.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/compile/compile-format.ts (1.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/compile/compile-platform.ts (881B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/compile/compile-runner.ts (11.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/compile/compile-targets.ts (5.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/deploy-exit.ts (382B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/display.ts (1.69KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/runtime-detect.ts (1.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/shared.ts (509B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/types.ts (944B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/upgrade-steps.ts (7.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/deploy/upgrade-summary.ts (2.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/health/fetch-health-probe.ts (2.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/linux/systemd/systemd-command.ts (2.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/linux/systemd/systemd-environment.ts (1.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts (4.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/loggers/base-logger.ts (746B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/loggers/console-logger.ts (9.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts (5.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/plugin/db-integration.ts (10.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/plugin/kinds/api.kind.ts (928B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/plugin/kinds/plugin-kind-providers.ts (136B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/plugin/netscript-config-plugin.ts (2.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/plugin/plugin-reference-reconciler.ts (9.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/plugin/prisma-declaration-scanner.ts (3.8KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/plugin/prisma-schema-writer.ts (4.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/plugin/registry-scaffolder.ts (2.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/plugin/scaffolder.ts (10.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts (24.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/runtime/file-system/deno-file-system.ts (3.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/runtime/platform/deno-platform.ts (6.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/runtime/process/deno-process.ts (1.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/runtime/prompt/cliffy-prompt.ts (1.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/scaffold/directory-copier.ts (3.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/scaffold/dry-run-fs.ts (7.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/scaffold/editor-config.ts (5.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/scaffold/fresh-adapter.ts (5.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/scaffold/import-resolver.ts (15.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/scaffold/memory-fs.ts (9.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/scaffold/scaffolder.ts (10.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/scaffold/template-adapter.ts (6.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/scaffold/workspace-writer.ts (6.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/secrets/env-file-secrets-store.ts (4.99KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/service/client-scaffolder.ts (1.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/service/port-allocator.ts (3.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/service/router-source.ts (2.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/service/scaffolder.ts (4.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/service/workspace-mutator.ts (7.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/service/workspace-resolver.ts (2.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts (5.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/templates/app/generate-app-tsconfig.ts (581B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/templates/app/generate-vite-config.ts (1.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts (6.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/templates/template-asset.ts (1.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/environment/env-file-content.ts (11.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/environment/env-file-values.ts (12.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/environment/env-file-writer.ts (2.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/manifest/manifest-loader.ts (795B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/manifest/manifest-placeholders.ts (10.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/manifest/manifest-resolver.ts (2.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/manifest/manifest-types.ts (713B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/manifest/manifest.ts (3.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/runtime/runtime-config-overrides.ts (3.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/runtime/runtime-config-schema-types.ts (1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/runtime/runtime-config-schema.ts (9.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/runtime/runtime-config-writer.ts (5.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/runtime/runtime-version-utils.ts (2.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/runtime/runtime-version.ts (8.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/runtime/v8-profiles.ts (4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/servy/servy-config.ts (4.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/servy/servy-environment.ts (11.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/servy/servy-writer.ts (1.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/servy/servy-xml.ts (4.9KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/adapters/windows/tasks-copier.ts (8.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/abstracts/cli-command.ts (328B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/abstracts/cli-root.ts (497B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/abstracts/manifest.ts (1.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/abstracts/pipeline-step.ts (1009B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/abstracts/pipeline.ts (2.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/abstracts/registry.ts (509B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/abstracts/use-case.ts (325B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/output/renderers/init-json-renderer.ts (1.9KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/plugin/configured-plugin-specifier.ts (531B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/plugin/exported-plugin-manifest.ts (1.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/registries/db-engine-registry.ts (2.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/registries/deploy-target-registry.ts (4.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/registries/output-renderer-registry.ts (1.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/registries/plugin-kind-registry.ts (2.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/registries/preset-registry.ts (866B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/registries/template-registry.ts (2.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/context.ts (1.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/init-orchestrator.ts (5.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/init-pipeline.ts (3.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/orchestrate-init.ts (90B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/plan-init.ts (10.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/render-init.ts (713B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts (9.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/support/format-generated-files.ts (899B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/support/git-init.ts (995B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/support/helpers.ts (1.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/support/post-scripts-init.ts (1.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/validate-init.ts (6.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/workspace-init.ts (4.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/writers/app-route-seeds.ts (3.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts (12.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/writers/write-example-service-app-files.ts (6.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/scaffold/writers/write-init.ts (2.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/testing/in-memory-scaffolder.ts (1.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/ui/registry-deno-json.ts (2.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/ui/registry-styles.ts (3.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/ui/registry.ts (12.86KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/ui/resolve-ui-app-root.ts (3.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/application/ui/web-scaffold.ts (4.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/agent-docs.generated.ts (1.71MB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/agent-tools.generated.ts (128.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/assets/design.css.template (16.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/client.ts.template (119B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/components/ui/mod.ts.template (2.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/main.ts.template (935B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/router.ts.template (1.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(_components)/dashboard-view.tsx.template (4.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(_components)/health-view.tsx.template (1.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(_components)/home-view.tsx.template (2.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(_shared)/health.ts.template (761B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/(_components)/components-view.tsx.template (24.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/(_components)/composition-view.tsx.template (13.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/(_components)/tokens-view.tsx.template (11.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/(_islands)/FloatingSurfaceDemo.tsx.template (4.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/(_islands)/TokenClipboard.tsx.template (985B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/(_shared)/registry.ts.template (8.86KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/(_shared)/tokens.ts.template (3.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/_layout.tsx.template (2.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/components.tsx.template (628B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/composition.tsx.template (645B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/index.tsx.template (204B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/(design)/design/tokens.tsx.template (586B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/_app.tsx.template (1.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/_layout.tsx.template (2.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/dashboard.tsx.template (1.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_components)/crud-view.tsx.template (5.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_components)/examples-view.tsx.template (2.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_components)/hero.tsx.template (2.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_components)/lab-panel.tsx.template (882B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_components)/managed-form.tsx.template (1.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_components)/notes-card.tsx.template (571B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_components)/page-layout.tsx.template (887B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_components)/summary-card.tsx.template (907B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_components)/summary-panel.memory.tsx.template (1.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_components)/summary-panel.tsx.template (1.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.memory.tsx.template (7.69KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.tsx.template (9.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_shared)/authorization.ts.template (820B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_shared)/service-showcase.memory.ts.template (2.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/(_shared)/service-showcase.ts.template (2.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/crud.tsx.template (1.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/index.tsx.template (1.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/optimistic-list-mutation.ts.template (1.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/route-contract.ts.template (742B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/service-query.ts.template (1.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/service/index.layout.tsx.template (436B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/service/index.tsx.template (3.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/telemetry/(_components)/telemetry-view.tsx.template (4.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/telemetry/(_shared)/telemetry-trace.ts.template (4.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/examples/telemetry/index.tsx.template (1.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/health.tsx.template (1.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/index.tsx.template (1.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/routes/partials/examples/service-summary.tsx.template (549B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/utils.ts.template (274B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/app/vite.config.ts.template (1.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template (17.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/aspire/helpers/apphost.ts.template (431B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/aspire/helpers/configure-dashboard.ts.template (823B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/aspire/helpers/run-tool.ts.template (1.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/database/connection-helpers.ts.template (4.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/database/schema.prisma.template (445B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/database/scripts/fix-zod-imports.ts.template (709B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/database/scripts/generate-zod.ts.template (542B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/database/scripts/migrate.ts.template (236B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/database/scripts/patch-prisma-client.ts.template (344B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/database/seed.ts.template (316B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/database/zod-generator.config.json.template (230B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/embedded.generated.ts (289.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/aspire/helpers/generate-db-cli-mode-1.ts.template (2.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/aspire/helpers/generate-index-1.ts.template (2.99KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-apps-1.ts.template (2.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-background-1.ts.template (2.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-infrastructure-1.ts.template (2.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-plugins-1.ts.template (2.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-services-1.ts.template (3.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-tools-1.ts.template (5.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/database/generate-engine-mod-1.ts.template (1.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/database/generate-prisma-config-1.ts.template (4.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/plugins/generate-plugin-contracts-1.ts.template (1.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/plugins/generate-plugin-db-schema-1.ts.template (667B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/plugins/generate-plugin-samples-1.ts.template (2.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/plugins/generate-plugin-samples-2.ts.template (1.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/plugins/generate-plugin-samples-3.ts.template (2.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/plugins/generate-plugin-service-1.ts.template (1.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/plugins/generate-plugin-service-2.ts.template (773B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/plugins/generate-plugin-service-3.ts.template (587B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/generated/workspace/netscript-config-1.ts.template (511B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/manifest.ts (9.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/plugins/service-context.ts.template (3.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/publish-assets.generated.ts (49.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/registry-generator-fixture.ts (4.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/service/contract.memory.ts.template (3.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/service/contract.ts.template (2.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/service/main.memory.ts.template (453B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/service/main.ts.template (541B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/service/router.ts.template (944B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/service/routers/health.ts.template (482B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/service/routers/v1.memory.ts.template (2.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/service/routers/v1.ts.template (2.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/skills.generated.ts (57.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/windows/env.template (6.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/workspace/contracts/mod.ts.template (160B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/workspace/contracts/v1-aggregate.ts.template (371B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/workspace/contracts/v1-empty.ts.template (281B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/workspace/github/workflows/deploy-bare-metal.yml.template (1.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/workspace/github/workflows/deploy-compose-ghcr.yml.template (1.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/workspace/github/workflows/deploy-deno-deploy.yml.template (1.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/workspace/gitignore.template (190B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/assets/workspace/plugins/mod.ts.template (224B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/deploy.ts (2.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/helpers-files.ts (613B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/jsr-specifiers.ts (2.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/linux.ts (1.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/port-ranges.ts (1.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/providers.ts (2.66KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/runtime.ts (1.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog.ts (2.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts (1.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/scaffold/scaffold-defaults.ts (523B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/scaffold/scaffold-dirs.ts (581B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/scaffold/scaffold-files.ts (728B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/scaffold/scaffold-packages.ts (3.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/scaffold/scaffold-validation.ts (473B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts (510B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/scaffold/scaffold-workspace-packages.ts (1.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/template-conventions.ts (235B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/constants/windows.ts (6.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/cache-backend.ts (359B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/core-types.ts (3.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/db-engine.ts (4.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/activation-convention.ts (4.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/compile-target.ts (2.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/deno-deploy-cli-port.ts (2.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/deno-deploy-target.ts (6.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/deploy-target-port.ts (5.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/deploy-target-registry-port.ts (1006B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/health-gate.ts (3.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/linux-service-deploy-target.ts (757B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/observability-convention.ts (2.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/rollback-convention.ts (5.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/runtime-overrides.ts (3.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/secrets-convention.ts (5.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/service-deploy-target.ts (8.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/servy-config.ts (2.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/unstable-api-guard.ts (4.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/deploy/windows-service-deploy-target.ts (546B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/errors.ts (6.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/errors/cli-exit-error.ts (2.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/infrastructure-config.ts (2.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/plugin-kind.ts (8.8KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/resolved-config.ts (11.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/scaffold/app-name.ts (552B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/scaffold/default-port-allocation.ts (1.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/scaffold/scaffold-options.ts (6.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/scaffold/scaffold-plan.ts (2.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/scaffold/workspace-config.ts (2.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/service-manifest.ts (1.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/domain/service-shape.ts (3.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/extension-points.ts (1.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/ports/file-system-port.ts (986B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/ports/jsr-resolver-port.ts (378B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/ports/logger-port.ts (399B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/ports/process-port.ts (983B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/ports/prompt-port.ts (579B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/ports/runtime-config-store-port.ts (1.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/ports/template-port.ts (1.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/presentation/abstracts/deploy-step-command.ts (1.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/presentation/abstracts/scaffold-command.ts (1.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/presentation/command-types.ts (400B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/presentation/output/default-output.ts (1.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/presentation/output/output-event.ts (980B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/presentation/output/renderers/human-output-renderer.ts (1.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/presentation/output/renderers/json-output-renderer.ts (594B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/presentation/output/renderers/output-renderer.ts (338B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/presentation/output/renderers/silent-output-renderer.ts (350B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/app/agent-conventions.ts (7.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/app/app-template-test-support.ts (3.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/generate-appsettings.ts (10.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/generate-aspire-config.ts (5.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/generate-global-json.ts (981B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/_utils.ts (3.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/generate-config-schema.ts (2.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/generate-db-cli-mode.ts (2.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/generate-index.ts (3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/helpers-generator-pipeline.ts (8.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/register/database-permissions.ts (527B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts (13.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts (10.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts (18.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts (10.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts (7.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-tools.ts (3.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/register/render-http-endpoint.ts (2.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/register/resolve-resource-environment.ts (6.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/tests/generators-test-support.ts (6.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/aspire/helpers/types.ts (3.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/database/database-generators.ts (603B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/database/generate-db-deno-json.ts (6.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/database/generate-db-mod.ts (577B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/database/generate-engine-mod.ts (5.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/database/generate-prisma-config.ts (1.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/plugins/generate-plugin-contracts.ts (1.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/plugins/generate-plugin-db-schema.ts (1.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/plugins/generate-plugin-deno-json.ts (3.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/plugins/generate-plugin-mod.ts (3.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/plugins/generate-plugin-samples.ts (2.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/plugins/generate-plugin-service-context.ts (479B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/plugins/generate-plugin-service.ts (3.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/plugins/plugin-generators.ts (804B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/service/generate-service-deno-json.ts (3.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/workspace/aspire-cli-task.ts (4.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/workspace/contracts/deno-json.ts (1.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/workspace/deno-json.ts (5.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/workspace/generate-readme.ts (11.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/workspace/netscript-config.ts (1.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/workspace/node-modules-verifier.ts (7.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/workspace/package-json.ts (505B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/workspace/plugins/deno-json.ts (962B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/workspace/quality-runner.ts (5.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/kernel/templates/workspace/tsconfig.ts (301B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/local/composition/create-local-contributor-cli.ts (1.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/local/composition/local-contributor-command-tree.ts (1.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/local/features/plugins/install/install-local-plugin-command.ts (4.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/local/features/plugins/install/install-local-plugin-helpers.ts (3.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/local/features/plugins/install/install-local-plugin.ts (12.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/local/features/plugins/plugins-group.ts (3.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/adapters/local-import-resolver.ts (5.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/adapters/monorepo-detector.ts (2.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/adapters/official-plugin-source.ts (11.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/adapters/packages-copier.ts (7.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/adapters/plugin-file-collector.ts (7.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/adapters/plugin-import-rewriter.ts (7.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/composition/create-maintainer-cli.ts (1.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/domain/local-packages.ts (1.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/init/init-command.ts (5.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/init/orchestrate-maintainer-init.ts (4.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/probe/probe-group.ts (946B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/probe/probe-monorepo-command.ts (2.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/probe/probe-monorepo.ts (2.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/release/eject/producer-root-files.ts (7.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/release/eject/release-eject-command.ts (2.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/release/eject/release-eject-constants.ts (275B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/release/eject/release-eject-git.ts (1.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/release/eject/release-eject.ts (8.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/release/release-group.ts (945B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/root/maintainer-command-dependencies.ts (5.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/root/maintainer-command-tree.ts (1.86KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/sync/packages/sync-packages-command.ts (2.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/sync/packages/sync-packages.ts (1.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-test-support.ts (9.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin.ts (6.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/sync/plugin/sync-plugin-command.ts (2.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/sync/plugin/sync-plugin.ts (4.8KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/sync/sync-group.ts (1.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/sync/templates/sync-templates-command.ts (1.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/sync/templates/sync-templates.ts (1.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/test-scaffold/run-scaffold-test.ts (1.88KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/test-scaffold/test-group.ts (921B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/features/test-scaffold/test-scaffold-command.ts (2.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/infra/official-plugin-copier.ts (1.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/maintainer-api.ts (2.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/ports/local-import-resolver-port.ts (578B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/ports/package-copier-port.ts (1.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/maintainer/presentation/support.ts (879B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/adapters/agent/deno-agent-docs-generator.ts (10.99KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/adapters/agent/deno-aspire-agent-initializer.ts (1.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/adapters/jsr-import-resolver.ts (5.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/adapters/os-service-factory.ts (1.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/adapters/service-activation-port.ts (6.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/adapters/servy-os-service.ts (2.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/adapters/systemd-os-service.ts (2.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/composition/cli-command-registry.ts (2.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/composition/create-public-cli.ts (955B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/composition/run-public-cli.ts (1.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/domain/db-add-plan.ts (1.37KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/domain/plugin-install-plan.ts (4.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/domain/scaffold-plan.ts (63B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/domain/service-add-plan.ts (1.66KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/agent-group.ts (2.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/drift/record-drift-command.ts (1.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/init/agent-docs-generator.ts (522B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/init/agent-init-file-system.ts (1.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/init/aspire-agent-initializer.ts (413B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/init/init-agent-command.ts (2.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/init/init-agent-input.ts (839B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/init/init-agent.ts (13.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/mcp/agent-mcp-command.ts (2.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/mcp/agent-mcp-input.ts (177B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/mcp/cli-mcp-adapters.ts (2.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts (3.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/config/config-group.ts (1.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/config/override/manage-runtime-overrides.ts (2.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/config/override/override-group.ts (3.99KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/config/override/runtime-lifecycle-command.ts (2.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/config/project/list-appsettings-paths.ts (4.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/config/project/project-config-command.ts (4.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/config/project/project-config-ops.ts (5.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/config/project/read-appsettings-schema.ts (2.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/config/project/resolve-appsettings-path.ts (8.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/add-route/add-contract-route-command.ts (2.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/add-route/add-contract-route-input.ts (260B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/add-route/add-contract-route.ts (2.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/add/add-contract-command.ts (3.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/add/add-contract-input.ts (181B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/add/add-contract.ts (2.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/contracts-group.ts (1.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/inspect/inspect-contract-command.ts (2.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/inspect/inspect-contract-input.ts (170B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/inspect/inspect-contract.ts (1.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/list/list-contracts-command.ts (2.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/list/list-contracts-input.ts (156B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/remove/remove-contract-command.ts (1.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/remove/remove-contract-input.ts (141B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/remove/remove-contract.ts (2.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/version-add/add-contract-version-command.ts (2.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/version-add/add-contract-version-input.ts (555B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/version-add/add-contract-version.ts (2.66KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/contracts/version-add/contract-version-group.ts (519B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/add/add-db-command.ts (2.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/add/add-db-input.ts (357B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/add/add-db.ts (2.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/add/plan-db-add.ts (2.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/add/render-db.ts (877B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/db-group.ts (2.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/deploy/deploy-db-command.ts (342B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/generate/generate-db-command.ts (797B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/init/init-db-command.ts (1.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/introspect/introspect-db-command.ts (801B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/list/list-db-command.ts (1.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/migrate/migrate-db-command.ts (1.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/operations/db-operation-command.ts (3.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/remove/remove-db-command.ts (2.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/reset/reset-db-command.ts (765B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/resolve/resolve-db-command.ts (1.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/seed/seed-db-command.ts (745B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/status/status-db-command.ts (764B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/studio/studio-db-command.ts (761B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/db/validate/validate-db-command.ts (326B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/build/build-deploy-command.ts (3.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/build/build-deploy.ts (4.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/build/build-windows-cli.ts (5.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/build/build-windows-options.ts (423B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/build/build-windows-prebuild.ts (3.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/build/build-windows-runtime.ts (8.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/build/build-windows-strategy.ts (12.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/build/build-windows-tasks.ts (2.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/build/prepare-deploy-build.ts (3.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/copy/copy-deploy-command.ts (8.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/deno-deploy/deno-deploy-command.ts (6.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/deploy-group.ts (4.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/install/install-deploy-command.ts (2.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/install/install-service-deploy.ts (4.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/list/list-deploy-targets-command.ts (1.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/list/list-deploy-targets.ts (762B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/logs/logs-deploy-command.ts (9.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/package-cli/package-cli-deploy-command.ts (10.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/start/start-deploy-command.ts (9.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/status/status-deploy-command.ts (6.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/stop/stop-deploy-command.ts (6.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/desktop-group.ts (2.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/package/desktop-package-contract.ts (5.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/package/package-desktop-command.ts (4.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/package/package-desktop.ts (6.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/package/plan-desktop-packages.ts (4.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/release/native-release-contract.ts (1.75KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/release/prepare-native-release.ts (5.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/release/prepare-release-command.ts (4.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/release/release-group.ts (925B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/release/release-store.ts (6.71KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/release/server/release-handler.ts (6.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/release/server/serve-release-command.ts (3.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/desktop/release/sign-release.ts (2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/run-target-operation.ts (2.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/target-deploy-command.ts (3.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/target/target-secrets-command.ts (1.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/uninstall/uninstall-deploy-command.ts (2.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/uninstall/uninstall-service-deploy.ts (4.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/deploy/upgrade/upgrade-deploy-command.ts (11.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/generate/aspire/generate-aspire-command.ts (1.71KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/generate/aspire/generate-aspire.ts (2.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/generate/generate-group.ts (1.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/generate/plugins/generate-installed-plugin-registries.ts (932B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command.ts (3.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts (15.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas-command.ts (3.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas-input.ts (238B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas.ts (6.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/init/init-command.ts (6.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/init/init-input.ts (949B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/init/init-interactive.ts (2.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/marketplace/marketplace-group.ts (720B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/marketplace/publish/marketplace-publish-command.ts (1.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/marketplace/search/marketplace-search-command.ts (1.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/ai/ai-plugin-command.ts (4.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/auth/auth-config.ts (8.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts (5.44KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/auth/auth-session-client.ts (2.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/auth/auth-types.ts (1.61KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts (9.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/dispatch/plugin-dispatch-port.ts (1.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/dispatch/plugin-verb-command.ts (3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/doctor/doctor-plugin-command.ts (4.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts (23.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/host/discover-plugins.ts (1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/host/host-plugin-command.ts (2.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/host/load-plugin-contributions.ts (478B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/host/plugin-loader.ts (3.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/host/resolve-plugin-manifest.ts (1.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/host/trigger-walker.ts (849B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/info/info-plugin-command.ts (882B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/install/confirm-plugin-install.ts (4.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/install/install-plugin-command.ts (4.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/install/install-plugin-input.ts (815B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/install/install-plugin.ts (24.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/install/jsr-plugin-validator-port.ts (3.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/install/plan-plugin-install.ts (7.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts (2.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/install/plugin-trust-tier.ts (1.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/install/render-plugin.ts (3.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/item/add-plugin-item-command.ts (2.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/list/list-plugins-command.ts (4.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/list/list-plugins-input.ts (468B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/new/new-plugin-command.ts (3.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts (27.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/plugins-group.ts (4.9KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/remove/plugin-removal-plan.ts (5.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/remove/project-path-snapshot.ts (2.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/remove/remove-plugin-command.ts (3.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/remove/remove-plugin.ts (9.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/scaffold/scaffold-plugin-command.ts (3.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/scaffold/scaffold-plugin-use-case.ts (6.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/scaffold/template-substitution.ts (1.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/plugins/update/update-plugin-command.ts (2.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/root/public-command-dependencies.ts (17.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/root/public-command-tree.ts (4.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/add-handler/add-service-handler-command.ts (1.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/add-handler/add-service-handler-input.ts (155B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/add-handler/add-service-handler.ts (2.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/add/add-service-command.ts (2.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/add/add-service-input.ts (477B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/add/add-service.ts (3.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/add/plan-service-add.ts (2.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/add/render-service.ts (1.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/configure/mutate-service-config.ts (2.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/configure/service-config-command.ts (2.88KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/generate/generate-service-command.ts (1.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/list/list-services-command.ts (1.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/list/list-services-input.ts (132B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/remove/remove-service-command.ts (1.9KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/remove/remove-service-input.ts (152B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/remove/remove-service.ts (3.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/services/services-group.ts (2.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/ui/add/add-ui-command.ts (3.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/ui/add/add-ui-input.ts (317B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/ui/init/init-ui-command.ts (2.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/ui/init/init-ui-input.ts (235B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/ui/list/list-ui-command.ts (1.62KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/ui/registry.ts (60B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/ui/remove/remove-ui-command.ts (1.19KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/features/ui/update/update-ui-command.ts (1.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/infra/jsr/fetch-jsr-export-map.ts (759B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator.ts (9.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/infra/jsr/verify-jsr-package-integrity.ts (4.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/infra/permissions/plugin-scaffold-permissions.ts (2.02KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/ports/jsr-resolver-port.ts (145B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/ports/os-service-port.ts (1.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/ports/service-manifest-port.ts (1.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/presentation/support.ts (2.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/public-api.ts (10.53KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/src/public/scaffolding/plugin-scaffolding.ts (4.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/cli/testing.ts (8.24KB)
Simulating publish of @netscript/kv@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/README.md (5.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/adapters/deno-kv.adapter.ts (15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/adapters/denokv-bridge.ts (22.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/adapters/kvdex.ts (4.8KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/adapters/memory.adapter.ts (13.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/adapters/redis.adapter.ts (24.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/adapters/redis/connection.ts (8.59KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/adapters/redis/serialization.ts (3.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/adapters/redis/types.ts (4.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/application/auto-detect.ts (4.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/application/errors.ts (315B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/application/keys.ts (4.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/application/mod.ts (654B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/application/shared.ts (7.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/deno.json (1.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/kvdex.ts (902B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/mod.ts (900B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/redis.ts (1.76KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/src/testing/memory-kv.ts (1.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/src/testing/mod.ts (688B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/types/common.ts (2.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/types/kv-store.ts (5.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/types/mod.ts (398B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/kv/types/watchable-kv.ts (3.59KB)
Simulating publish of @netscript/sdk@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/README.md (8.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/deno.json (1.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/mod.ts (2.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/auto-update/adapters/deno-auto-update-adapter.ts (5.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/auto-update/adapters/netscript-rollback-telemetry.ts (1.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/auto-update/application/release-client.ts (2.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/auto-update/application/start-auto-update.ts (3.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/auto-update/domain/constants.ts (1.75KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/auto-update/domain/types.ts (5.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/auto-update/mod.ts (1.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/cache/cache-provider.ts (2.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/cache/cache-query.ts (7.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/cache/defaults.ts (291B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/cache/kv-cache-store.ts (4.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/cache/mod.ts (1.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/client/errors.ts (2.5KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/client/http-client-link.ts (5.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/client/mod.ts (1.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/client/service-client.ts (1.69KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/collections/create-query-collection.ts (5.83KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/collections/mod.ts (831B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/desktop/adapters/bind-channel.ts (8.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/desktop/adapters/orpc-serialization.ts (1.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/desktop/application/desktop-rpc-client.ts (1.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/desktop/domain/constants.ts (1.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/desktop/domain/types.ts (5.74KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/desktop/mod.ts (2.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/discovery/browser-env.ts (1.84KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/discovery/kv-connection.ts (7.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/discovery/mod.ts (1.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/discovery/service-discovery.ts (106B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/discovery/service-url.ts (4.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/openapi/helpers.ts (1.98KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/ports/cache-entry.ts (1.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/ports/cache-store.ts (2.78KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/ports/client-link-factory.ts (710B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/ports/mod.ts (2.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/ports/query-client.ts (1.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/ports/query-factory.ts (4.52KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/ports/query-key.ts (1.03KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/ports/query-options.ts (814B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/ports/service-client.ts (6.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/ports/service-query-utils.ts (9.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/presets/define-services.ts (4.45KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/query-client/create-service-query-utils.ts (2.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/query-client/key-bridge.ts (1.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/query-client/kv-cache-persister.ts (2.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/query-client/mod.ts (2.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/query-client/query-client-factory.ts (1.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/query-client/types.ts (2.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/query/client-proxy.ts (1.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/query/composite-query.ts (3.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/query/mod.ts (1.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/query/query-factory.ts (6.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/streams.ts (1.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/telemetry/mod.ts (481B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/sdk/src/telemetry/otel-middleware.ts (1.34KB)
Simulating publish of @netscript/auth-kv-oauth@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-kv-oauth/README.md (6.04KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-kv-oauth/deno.json (1.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-kv-oauth/mod.ts (2.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-kv-oauth/src/backend.ts (12.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-kv-oauth/src/cookies.ts (3.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-kv-oauth/src/crypto.ts (4.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-kv-oauth/src/errors.ts (1.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-kv-oauth/src/flow.ts (13.63KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-kv-oauth/src/providers.ts (12.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/auth-kv-oauth/src/store.ts (8.64KB)
Simulating publish of @netscript/prisma-adapter-mysql@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/prisma-adapter-mysql/README.md (4.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/prisma-adapter-mysql/deno.json (677B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/prisma-adapter-mysql/mod.ts (94B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/prisma-adapter-mysql/src/adapter.ts (20.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/prisma-adapter-mysql/src/conversion.ts (8.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/prisma-adapter-mysql/src/errors.ts (4.99KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/prisma-adapter-mysql/src/mod.ts (1.46KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/prisma-adapter-mysql/src/types.ts (3.15KB)
Simulating publish of @netscript/aspire@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/README.md (12.75KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/config.ts (29.89KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/constants.ts (5.39KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/deno.json (1.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/mod.ts (890B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/schema.ts (1.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/adapters/aspire-typescript-builder.ts (542B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/adapters/env-resolver.ts (1.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/adapters/mod.ts (386B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/adapters/port-allocator.ts (129B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/application/build-vite-env-var-name.ts (2.15KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/application/compose-apphost.ts (1.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/application/mod.ts (1.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/application/port-allocation.ts (817B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/application/resolve-env-vars.ts (3.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/application/resolve-paths.ts (2.95KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/application/resolve-permissions.ts (1.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/application/resolve-references.ts (2.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/diagnostics/inspect-aspire.ts (2.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/domain/aspire-resource.ts (588B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/domain/contribution-context.ts (998B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/domain/env-source.ts (295B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/domain/errors.ts (640B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/domain/health-check-spec.ts (369B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/domain/mod.ts (521B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/domain/plugin-entry.ts (1.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/domain/reference-spec.ts (340B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/ports/aspire-builder-port.ts (1.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/ports/aspire-runtime-port.ts (355B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/ports/mod.ts (126B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/public/mod.ts (2.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/runtime/aspire-ns-plugin-contribution.base.ts (1.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/runtime/contribution-registry.ts (1.21KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/runtime/mod.ts (210B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/testing/contribution-fixtures.ts (1.58KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/testing/memory-aspire-builder.ts (3.08KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/src/testing/mod.ts (578B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/aspire/types.ts (5.78KB)
Simulating publish of @netscript/plugin-auth@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/README.md (6.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/cli.ts (480B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/contracts/v1/mod.ts (304B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/database/auth.prisma (2.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/deno.json (2.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/mod.ts (236B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/package.json (200B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/scaffold.plugin.json (1.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/scaffold.ts (635B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/services/src/backend-registry.ts (10.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/services/src/init.ts (2.17KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/services/src/main.ts (4.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/services/src/request-context.ts (1005B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/services/src/router.ts (624B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/services/src/routers/router-context.ts (1.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/services/src/routers/v1-handlers.ts (14.26KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/services/src/routers/v1-helpers.ts (4.24KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/services/src/routers/v1-types.ts (4.56KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/services/src/routers/v1.ts (328B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/src/adapter/plugin.ts (1.96KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/src/adapter/resources/barrel/barrel.stub.ts (1.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/src/adapter/resources/barrel/barrel.ts (906B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/src/adapter/resources/input.ts (294B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/src/adapter/resources/mod.ts (184B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/src/constants.ts (925B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/src/package-metadata.generated.ts (219B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/src/public/mod.ts (2.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/streams/factory.ts (1.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/streams/mod.ts (551B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/streams/producer.ts (8.66KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/streams/schema.ts (3.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/streams/server.ts (842B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/plugins/auth/verify-plugin.ts (1.08KB)
Simulating publish of @netscript/logger@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/logger/README.md (4.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/logger/config.ts (3.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/logger/constants.ts (475B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/logger/creators.ts (3.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/logger/deno.json (998B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/logger/middleware.ts (6.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/logger/mod.ts (1.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/logger/orpc-plugin.ts (12.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/logger/orpc.ts (528B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/logger/types.ts (1.21KB)
Simulating publish of @netscript/queue@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/README.md (6.49KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/adapters/_envelope.ts (3.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/adapters/amqp.adapter.ts (7.9KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/adapters/deno-kv.adapter.ts (10.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/adapters/kv-dead-letter-store.ts (3.86KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/adapters/kv-polling.adapter.ts (21.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/adapters/mod.ts (519B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/adapters/postgres-dead-letter-store.ts (6.82KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/adapters/postgres.adapter.ts (17.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/adapters/redis-dead-letter-store.ts (3.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/adapters/redis.adapter.ts (11.64KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/deno.json (1.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/factory/create-parallel-queue.ts (2.65KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/factory/create-queue.ts (9.85KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/factory/create-typed-queue.ts (5.9KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/factory/mod.ts (336B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/internal/parallel-queue.ts (7.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/mod.ts (2.67KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/ports/dead-letter.ts (2.43KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/ports/errors.ts (4.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/ports/message-queue.ts (5.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/ports/mod.ts (733B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/ports/options.ts (5.22KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/testing/memory-queue.ts (9.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/testing/mod.ts (211B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/validation/mod.ts (241B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/queue/validation/validation.ts (3.52KB)
Simulating publish of @netscript/mcp@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/README.md (19.86KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/cli.ts (12.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/deno.json (1.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/mod.ts (8.8KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/openapi-projection.ts (1.14KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/docs/docs-flows.ts (4.47KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/docs/find-guidance-flow.ts (4.42KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/export-surfaces/export-surface-flows.ts (11.41KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/export-surfaces/export-surface-tool-contracts.ts (3.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/analyze-db-bottlenecks-flow.ts (1.05KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/analyze-service-performance-flow.ts (1.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/doctor-flow.ts (3.97KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/execute-command-flow.ts (1.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/get-app-status-flow.ts (1.3KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/get-last-job-result-flow.ts (1.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/get-operation-schema-flow.ts (4.13KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/get-recent-errors-flow.ts (1.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/get-run-flow.ts (1.68KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/list-api-services-flow.ts (3.32KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/list-commands-flow.ts (1.45KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/list-runs-flow.ts (1.2KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/list-service-operations-flow.ts (4.36KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/planned-flow.ts (485B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/record-drift-flow.ts (2.28KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/flows/telemetry-doctor-family.ts (1.92KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/runner/mcp-server.ts (7.18KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/runner/receipt-lifecycle.ts (982B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/runner/truncation.ts (2.48KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/service-endpoint-directory.ts (10.38KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/telemetry-aggregation.ts (15.16KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/application/tool-registry.ts (3.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/command-catalog-port.ts (664B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/command-executor-port.ts (2.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/command-policy.ts (2.77KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/diagnostic-evidence-port.ts (891B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/docs/docs-corpus-port.ts (3.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/docs/guidance-concepts.ts (4.35KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/docs/guidance-contract.ts (3.81KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/docs/guidance-index.ts (8.34KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/docs/guidance-parser.ts (4.88KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/docs/guidance-result.ts (3.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/doctor-check-family.ts (1.94KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/json-rpc.ts (1.8KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/openapi/canonical-identity.ts (3.57KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/openapi/description-ladder.ts (2.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/openapi/operation-index.ts (3.09KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/openapi/schema-views.ts (11.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/project-doctor-port.ts (304B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/schema.ts (4.87KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/telemetry-endpoint.ts (2.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/telemetry-probe-port.ts (531B)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/telemetry-summaries.ts (3.6KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/tool-contracts.ts (13.1KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/domain/tool-types.ts (2.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/aspire-doctor-family.ts (2.01KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/embedded-docs-corpus.ts (3.12KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/export-surfaces/embedded-export-surface-corpus.ts (6.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts (400.73KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/fetch-telemetry-probe.ts (1.23KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/filesystem-diagnostic-evidence.ts (1.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/filesystem-docs-corpus.ts (15.25KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/plugin-doctor-family.ts (1.31KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/project-wiring-doctor-family.ts (4.91KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/release-embedded-docs-corpus.ts (5.4KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/service-endpoints/appsettings-endpoint-source.ts (3.29KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/service-endpoints/aspire-cli-command.ts (1.07KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/service-endpoints/aspire-cli-endpoint-source.ts (10.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/service-endpoints/aspire-cli-output.ts (2.55KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/service-endpoints/endpoint-url.ts (1.06KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/service-endpoints/fetch-service-endpoint-probe.ts (6.7KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/service-endpoints/override-endpoint-source.ts (3.51KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/service-endpoints/run-manifest-endpoint-source.ts (4.79KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/spawn-command-executor.ts (4.72KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/static-command-catalog.ts (1.33KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/stdio-transport.ts (1.27KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/infrastructure/telemetry-query-adapter.ts (3.11KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/ports/export-surface-corpus-port.ts (2.54KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/ports/service-endpoint-directory-port.ts (8.93KB)
   file:///tmp/netscript-publish-dry-run-5160c32af82be1b5/packages/mcp/src/publish-assets.generated.ts (274.57KB)
Success Dry run complete
````

### Post-root status must be empty

Command: `rtk git status --porcelain`

Exit code: **0** · elapsed: 0.0s

````text
ok
````

Recorder note: RTK renders an empty porcelain result as the semantic token `ok`; it does not pass
through zero bytes. The raw `git status --porcelain` ground-truth assertion immediately below is
the byte-empty verdict source. The recorder initially treated RTK's two-byte `ok` as a failure and
stopped; this was a recorder predicate error, not a product gate failure.

### Raw post-root status ground truth must be empty

Command: `git status --porcelain`

Exit code: **0** · elapsed: 0.0s

````text
````

### Service catalog sentinel

Command: `rtk grep "zod": "catalog:" packages/service/deno.json`

Exit code: **0** · elapsed: 0.0s

````text
1 matches in 1 files:

packages/service/deno.json:27:"zod": "catalog:"
````

### Root deno.lock diff must be empty

Command: `rtk git diff --stat -- deno.lock`

Exit code: **0** · elapsed: 0.0s

````text

````

### Raw root deno.lock diff ground truth must be empty

Command: `git diff --stat -- deno.lock`

Exit code: **0** · elapsed: 0.0s

````text
````

### MCP package-scoped publish dry-run

Command: `rtk proxy deno task --cwd packages/mcp publish:dry-run`

Exit code: **0** · elapsed: 2.7s

````text
Task publish:dry-run deno run --allow-read --allow-write --allow-run ../../.llm/tools/release/run-publish-dry-run.ts --root ../.. --member packages/mcp
Check mod.ts
Check cli.ts
Check openapi-projection.ts
Checking for slow types in the public API...
Check mod.ts
Check cli.ts
Check openapi-projection.ts
Simulating publish of @netscript/mcp@0.0.5 with files:
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/README.md (19.86KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/cli.ts (12.18KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/deno.json (1.19KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/mod.ts (8.8KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/openapi-projection.ts (1.14KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/docs/docs-flows.ts (4.47KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/docs/find-guidance-flow.ts (4.42KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/export-surfaces/export-surface-flows.ts (11.41KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/export-surfaces/export-surface-tool-contracts.ts (3.29KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/analyze-db-bottlenecks-flow.ts (1.05KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/analyze-service-performance-flow.ts (1.07KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/doctor-flow.ts (3.97KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/execute-command-flow.ts (1.29KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/get-app-status-flow.ts (1.3KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/get-last-job-result-flow.ts (1.25KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/get-operation-schema-flow.ts (4.13KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/get-recent-errors-flow.ts (1.2KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/get-run-flow.ts (1.68KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/list-api-services-flow.ts (3.32KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/list-commands-flow.ts (1.45KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/list-runs-flow.ts (1.2KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/list-service-operations-flow.ts (4.36KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/planned-flow.ts (485B)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/record-drift-flow.ts (2.28KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/flows/telemetry-doctor-family.ts (1.92KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/runner/mcp-server.ts (7.18KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/runner/receipt-lifecycle.ts (982B)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/runner/truncation.ts (2.48KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/service-endpoint-directory.ts (10.38KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/telemetry-aggregation.ts (15.16KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/application/tool-registry.ts (3.35KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/command-catalog-port.ts (664B)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/command-executor-port.ts (2.11KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/command-policy.ts (2.77KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/diagnostic-evidence-port.ts (891B)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/docs/docs-corpus-port.ts (3.4KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/docs/guidance-concepts.ts (4.35KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/docs/guidance-contract.ts (3.81KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/docs/guidance-index.ts (8.34KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/docs/guidance-parser.ts (4.88KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/docs/guidance-result.ts (3.94KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/doctor-check-family.ts (1.94KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/json-rpc.ts (1.8KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/openapi/canonical-identity.ts (3.57KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/openapi/description-ladder.ts (2.7KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/openapi/operation-index.ts (3.09KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/openapi/schema-views.ts (11.12KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/project-doctor-port.ts (304B)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/schema.ts (4.87KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/telemetry-endpoint.ts (2.11KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/telemetry-probe-port.ts (531B)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/telemetry-summaries.ts (3.6KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/tool-contracts.ts (13.1KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/domain/tool-types.ts (2.11KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/aspire-doctor-family.ts (2.01KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/embedded-docs-corpus.ts (3.12KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/export-surfaces/embedded-export-surface-corpus.ts (6.27KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts (400.73KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/fetch-telemetry-probe.ts (1.23KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/filesystem-diagnostic-evidence.ts (1.72KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/filesystem-docs-corpus.ts (15.25KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/plugin-doctor-family.ts (1.31KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/project-wiring-doctor-family.ts (4.91KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/release-embedded-docs-corpus.ts (5.4KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/service-endpoints/appsettings-endpoint-source.ts (3.29KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/service-endpoints/aspire-cli-command.ts (1.07KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/service-endpoints/aspire-cli-endpoint-source.ts (10.33KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/service-endpoints/aspire-cli-output.ts (2.55KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/service-endpoints/endpoint-url.ts (1.06KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/service-endpoints/fetch-service-endpoint-probe.ts (6.7KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/service-endpoints/override-endpoint-source.ts (3.51KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/service-endpoints/run-manifest-endpoint-source.ts (4.79KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/spawn-command-executor.ts (4.72KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/static-command-catalog.ts (1.33KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/stdio-transport.ts (1.27KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/infrastructure/telemetry-query-adapter.ts (3.11KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/ports/export-surface-corpus-port.ts (2.54KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/ports/service-endpoint-directory-port.ts (8.93KB)
   file:///tmp/netscript-publish-dry-run-ef04956bf8c55d32/packages/mcp/src/publish-assets.generated.ts (274.57KB)
Success Dry run complete
````

### MCP manifest diff must be empty

Command: `rtk git diff --stat -- packages/mcp/deno.json`

Exit code: **0** · elapsed: 0.0s

````text

````

### Raw MCP manifest diff ground truth must be empty

Command: `git diff --stat -- packages/mcp/deno.json`

Exit code: **0** · elapsed: 0.0s

````text
````

### Post-package deno.lock diff must be empty

Command: `rtk git diff --stat -- deno.lock`

Exit code: **0** · elapsed: 0.0s

````text

````

### Raw post-package deno.lock diff ground truth must be empty

Command: `git diff --stat -- deno.lock`

Exit code: **0** · elapsed: 0.0s

````text
````

### Focused isolation regression tests (green)

Command: `deno test --allow-read --allow-write --allow-run .llm/tools/release/publish-workspace_test.ts`

Exit code: **0** · elapsed: 0.1s

````text
running 2 tests from ./.llm/tools/release/publish-workspace_test.ts
publish dry-run isolates catalog and Deno manifest rewrites in a throwaway workspace ... ok (17ms)
package dry-run isolates MCP publish array rewrites ... ok (3ms)

ok | 2 passed | 0 failed (25ms)

````

### Root check

Command: `rtk proxy deno task check`

Exit code: **0** · elapsed: 174.2s

````text
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-f-b-dryrun"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2876,"batches":24,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
Task check deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
````
