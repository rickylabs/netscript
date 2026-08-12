# Slice B — #1417 implementation evidence

**Branch:** `fix/1417-publish-dry-run-no-mutation`  
**Commit:** `1a05934e9`  
**Draft PR:** `#1538` — https://github.com/rickylabs/netscript/pull/1538  
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

### Root test

Command: `rtk proxy deno task test`

Exit code: **0** · elapsed: 341.9s

````text
running 2 tests from ./.github/scripts/aspire-nuget-cache-policy.test.ts
every Aspire runtime workflow persists the exact pinned NuGet package train ... ok (1ms)
published E2E uses the fixed Aspire CLI and retains CLI diagnostics ... ok (279µs)
running 53 tests from ./.github/scripts/ci-classify-changes.test.ts
regression: packages/cli/a.ts -> docs/a.md rename is NOT docs-only ... ok (1ms)
parseNameStatus: statuses A/M/D keep their single path ... ok (632µs)
parseNameStatus: copies include both sides; deletes stay impacting ... ok (569µs)
parseNameStatus: docs-to-docs rename stays docs-only ... ok (309µs)
rename of a Markdown file under packages stays docs-only ... ok (313µs)
parseNameStatus: unrecognisable line degrades to a bare path (forces run) ... ok (278µs)
parseNameStatus: empty/undefined input ... ok (294µs)
sanitizeReason: strips control chars and newlines ... ok (240µs)
sanitizeReason: caps length at 500 ... ok (172µs)
reason with a GITHUB_OUTPUT-injection filename stays one line ... ok (206µs)
docs surfaces are docs-only ... ok (182µs)
Markdown is docs-only under ordinary impacting directories ... ok (113µs)
critical workflow paths win over the markdown allowlist ... ok (74µs)
impacting surfaces force the scaffold gate ... ok (205µs)
unknown root paths force the gate (conservative default) ... ok (108µs)
SAFETY: an unrecognised path forces EVERY output true ... ok (292µs)
SAFETY: the classifier own sources force everything (.github/scripts) ... ok (68µs)
tier-defining workflow edits escalate scaffold, docker and desktop ... ok (97µs)
NEGATIVE: non-tier workflow edits set needs_deno ONLY ... ok (104µs)
classifyDenoConfigChange: tasks-only vs toolchain vs unparseable ... ok (762µs)
#1122 REPLAY: release workflow + tasks-only deno.json + .llm tools stays off the scaffold tiers ... ok (185µs)
root deno.json toolchain change (workspace/imports) escalates everything ... ok (179µs)
NEGATIVE: root deno.json with NO base/head content escalates (fail toward running) ... ok (51µs)
deno.lock always escalates (tasks-only discrimination never applies) ... ok (66µs)
nested workspace deno.json escalates regardless of root discrimination ... ok (129µs)
packages (non-cli) code: deno+docker+scaffold+surface, NOT desktop ... ok (117µs)
packages/cli code: the .deb surface -> needs_desktop ... ok (137µs)
plugins code: docker yes, desktop/surface no ... ok (150µs)
NEGATIVE: agent-context-only change (.agents one-file PR, #1055) skips everything ... ok (161µs)
docs/ markdown: needs_docs only ... ok (161µs)
package README: docs + surface, no toolchain ... ok (171µs)
.llm/tools code files set needs_deno (root deno test discovers them) ... ok (155µs)
NEGATIVE: .llm non-code files stay fully skipped ... ok (108µs)
docs/ code files set docs AND deno ... ok (192µs)
decide: docs-only PR skips both jobs ... ok (62µs)
decide: Markdown-only diff under packages is docs-only ... ok (127µs)
decide: Markdown plus one TypeScript file is full ... ok (160µs)
decide: Markdown plus deno.lock is full ... ok (114µs)
decide: one code file forces both jobs ... ok (70µs)
decide: empty diff runs EVERYTHING (cannot classify) ... ok (97µs)
decide: ci:skip-e2e skips runtime only ... ok (55µs)
decide: ci:skip-scaffold skips static only ... ok (79µs)
decide: both skip labels skip both jobs ... ok (137µs)
NEGATIVE: skip labels never widen to the vector (frozen semantics) ... ok (99µs)
decide: ci:full overrides docs-only and forces the ENTIRE vector ... ok (71µs)
decide: ci:full overrides skip labels ... ok (132µs)
decide: workflow_dispatch runs everything (no diff) ... ok (97µs)
decide: workflow_dispatch honours skip labels ... ok (42µs)
decide: workflow_dispatch honours ci:skip-scaffold for sqlite runtime ... ok (87µs)
decide: sqlite runtime reason follows the scaffold signal ... ok (150µs)
workflow: sqlite runtime uses sibling diff guard and fails closed ... ok (1ms)
parseLabels: JSON array and comma forms ... ok (191µs)
parseFiles: newline and comma forms ... ok (105µs)
running 3 tests from ./.github/scripts/draft-workflow-policy.test.ts
every pull-request workflow handles ready_for_review ... ok (2ms)
draft PRs schedule no core, e2e, quality, or surface jobs ... ok (1ms)
capability-vector and label overrides remain composed beneath draft gating ... ok (334µs)
running 2 tests from ./.github/scripts/e2e-cli-event-policy.test.ts
e2e-cli schedules code/lifecycle events but never label metadata events ... ok (1ms)
e2e-cli skip labels still short-circuit on the next normal trigger ... ok (511µs)
running 3 tests from ./.llm/tools/agentic/claude/claude-print_test.ts
Claude print wrapper preserves route identity and same-session resume ... ok (1ms)
Claude print wrapper assigns launch identity before the evaluator can make requests ... ok (234µs)
ordinary Claude print launches retain implicit fresh-session behavior ... ok (84µs)
running 5 tests from ./.llm/tools/agentic/claude/evaluator-model-guard_test.ts
evaluator model guard forwards an approved open model without changing the request ... ok (10ms)
evaluator model guard rejects, audits, and aborts a prohibited child model request ... ok (1ms)
evaluator model guard fails closed when a model-bearing request omits its model id ... ok (392µs)
evaluator model guard aborts even when its durable audit write fails ... ok (348µs)
evaluator audit paths cannot escape their dedicated root ... ok (189µs)
running 5 tests from ./.llm/tools/agentic/claude/hybrid-delegation_test.ts
hybrid contract applies the centralized DeepSeek default and bounded defaults ... ok (854µs)
hybrid contract rejects arbitrary models, efforts, and timeouts ... ok (530µs)
hybrid contract rejects malformed non-object inputs ... ok (281µs)
hybrid contract enforces UTF-8 prompt and context byte limits ... ok (693µs)
hybrid prompt labels caller context without adding implicit repository content ... ok (293µs)
running 10 tests from ./.llm/tools/agentic/claude/hybrid-launcher_test.ts
hybrid launcher parses only absolute cwd and bounded name ... ok (1ms)
native Claude environment strips every provider credential override ... ok (282µs)
MCP config is stdio-only, credential-free, and minimally permissioned ... ok (696µs)
generated MCP permission argv starts the real stdio server ... ok (284ms)
exact MCP permissions cancel a stubborn worker group without an orphan ... ok (572ms)
bridge evidence requires pid, cwd, and bridge id but preserves derived registry name ... ok (328µs)
launcher proves bridge attachment and always removes mode-0600 config ...
------- post-test output -------
{"event":"hybrid_remote_control_attached","pid":42,"cwd":"/repo","sessionId":"conversation","bridgeSessionId":"session_remote","name":"hybrid"}
----- post-test output end -----
launcher proves bridge attachment and always removes mode-0600 config ... ok (1ms)
launcher fails closed and cleans up without bridge evidence ... ok (1ms)
launcher rejects a non-directory cwd before creating config or spawning Claude ... ok (1ms)
launcher rejects missing HOME before filesystem or process effects ... ok (441µs)
running 6 tests from ./.llm/tools/agentic/claude/hybrid-mcp-server_test.ts
hybrid MCP exposes exactly the delegation tool after initialization ... ok (1ms)
hybrid MCP returns bounded structured tool success and errors ... ok (907µs)
MCP cancellation notification aborts the matching worker request ... ok (1ms)
duplicate in-flight request ids fail without replacing cancellation ownership ... ok (430µs)
newline stdio isolates parse errors and emits JSON-RPC responses ... ok (4ms)
invalid and unknown protocol requests do not expose internal errors ... ok (404µs)
running 10 tests from ./.llm/tools/agentic/claude/hybrid-opencode-adapter_test.ts
worker environment is allow-listed and isolates Claude/provider credentials ... ok (1ms)
adapter uses argv without a shell and reports requested/observed route identity ... ok (5ms)
isolated hybrid worker receives current-project MCP overlay without other credentials ... ok (3ms)
adapter terminates oversized output ... ok (1ms)
adapter propagates AbortSignal and terminates the worker ... ok (4ms)
adapter enforces timeout and terminates the worker ... ok (2ms)
adapter redacts worker credentials from failure diagnostics ... ok (1ms)
adapter rejects protected credentials reflected in successful output ... ok (1ms)
adapter escalates timed-out process-group cleanup from TERM to KILL ... ok (273ms)
adapter bounds concurrent workers and releases the queue ... ok (5ms)
running 17 tests from ./.llm/tools/agentic/claude/openrouter-run_test.ts
OpenRouter launcher parses the full flag surface ... ok (1ms)
OpenRouter launcher omits absent optional flags rather than passing undefined ... ok (293µs)
OpenRouter launcher rejects a missing model, prompt, or unknown effort ... ok (1ms)
a typo fails loudly instead of silently dropping the requested artifact ... ok (301µs)
duplicate and value-less flags are rejected before any request ... ok (330µs)
the launcher route always enables the open-evaluator model guard ... ok (217µs)
the child environment binds the credential and clears every rival key ... ok (773µs)
building the child environment never mutates the parent map ... ok (245µs)
the credential file supplies the child auth token when nothing is exported ... ok (607µs)
a missing credential fails with an actionable, key-free error ... ok (557µs)
the spawned child receives the isolated environment and never the key in argv ... ok (2ms)
an ordinary child exit code is returned unchanged ... ok (953µs)
the guard base URL overrides a caller-supplied route variable ... ok (24ms)
a denied model terminates the child and exits with the guard code ...
------- post-test output -------
evaluator model request denied: model=closed/model requesting_session=b5c8c222-2f69-4a4b-8824-c0f1d686e473
----- post-test output end -----
a denied model terminates the child and exits with the guard code ... ok (26ms)
tee success writes the stream to the file and preserves the exit code ...
------- post-test output -------
Deno.serve: request.signal aborts on successful responses (legacy behavior). To detect when a request has been fully delivered use the `completed` promise on the handler's info argument. Move cleanup to the handler's return path, or opt in to the new behavior with --unstable-no-legacy-abort. See https://docs.deno.com/go/unstable-no-legacy-abort
{"type":"result","ok":true}----- post-test output end -----
tee success writes the stream to the file and preserves the exit code ... ok (7ms)
an unwritable tee destination fails before the child is ever spawned ... ok (1ms)
a tee stream failure reaps the child instead of abandoning it ... ok (2ms)
running 7 tests from ./.llm/tools/agentic/claude/remote-model-gateway_test.ts
exact messages route forces model and isolates OpenRouter authentication ... ok (11ms)
all non-exact routes preserve Claude OAuth and cannot receive OpenRouter auth ... ok (1ms)
malformed exact model requests fail closed without an upstream fetch ... ok (1ms)
oversized exact model requests fail closed before buffering ... ok (800µs)
trailing-slash messages path is not classified as model inference ... ok (706µs)
gateway returns the upstream streaming response without rebuilding it ... ok (2ms)
a reflected OpenRouter credential is stripped from Anthropic passthrough ... ok (618µs)
running 5 tests from ./.llm/tools/agentic/claude/remote-model-launcher_test.ts
new inference session uses the configured model and mandatory bypass mode ... ok (1ms)
conversation fork uses inference-only resume with model and effort ... ok (280µs)
launcher rejects unsafe or contradictory session combinations ... ok (1ms)
Claude child receives the gateway URL but no alternate-provider credential ... ok (146µs)
launcher removes signal hooks and closes the gateway when Claude fails ... ok (418µs)
running 3 tests from ./.llm/tools/agentic/codex/agy-live_test.ts
agy state comes from transcript status and recency, never process state ... ok (2ms)
agy snapshot surfaces dispatch issue, non-zero exit, current step, and file evidence ... ok (696µs)
agy worktree index resolves conversation ids ... ok (161µs)
running 3 tests from ./.llm/tools/agentic/codex/app-server-message_test.ts
turnStartRequest applies requested effort to the child turn ... ok (573µs)
thread start route is parsed from the authoritative response ... ok (210µs)
app-server argv uses a TOML string override and never composes profile ... ok (169µs)
running 7 tests from ./.llm/tools/agentic/codex/classify-codex-failure_test.ts
classifies beta.6 quota exhaustion and its 12-hour reset time ... ok (1ms)
classifies quota exhaustion without a reset time ... ok (214µs)
parses a 24-hour reset time and rolls a passed time to tomorrow ... ok (206µs)
classifies model capacity independently from quota ... ok (178µs)
preserves unclassified output ... ok (120µs)
rollout classification ignores a quoted quota message in the user prompt ... ok (161µs)
rollout classification reads structured error records ... ok (144µs)
running 3 tests from ./.llm/tools/agentic/codex/codex-follow_test.ts
codex follow parses finite since durations ... ok (1ms)
codex follow pretty and JSON formats retain event classification ... ok (285µs)
codex follow streams an appended terminal event and exits without polling sleeps ... ok (123ms)
running 7 tests from ./.llm/tools/agentic/codex/codex-rollout-live_test.ts
live state distinguishes working, idle, and stalled with a fake clock ... ok (1ms)
structured terminal failure distinguishes refused from dead ... ok (447µs)
quoted quota and refusal prose cannot fabricate a terminal state ... ok (234µs)
a refusal message before productive work is refused only when the turn completes ... ok (209µs)
readable live events include actions and file writes but omit bookkeeping ... ok (490µs)
session identity uses rollout metadata and filename fallback ... ok (124µs)
rollout resolver selects the newest exact thread match ... ok (7ms)
running 5 tests from ./.llm/tools/agentic/codex/codex-status_test.ts
Codex status reports zero when the process table has no real app-server ... ok (997µs)
Codex status ignores its wrapper shell and counts the anchored app-server ... ok (228µs)
Codex status reports unanchored app-servers without claiming ownership ... ok (97µs)
Codex status reports dirty rollout file evidence ahead of the branch commit ... ok (666µs)
Codex status reports the branch commit for a clean worktree ... ok (830µs)
running 4 tests from ./.llm/tools/agentic/codex/launch-codex-slice_test.ts
OpenRouter launcher materializes supported named and app-server configs ... ok (1ms)
OpenRouter launcher rejects arbitrary profile names and non-native homes ... ok (379µs)
native app-server launches reject rather than silently ignore named profiles ... ok (168µs)
successful sends stay successful without identity but route mismatches fail closed ... ok (272µs)
running 6 tests from ./.llm/tools/agentic/codex/run-codex-slice-lib_test.ts
done contract accepts only the final exact marker ... ok (1ms)
done contract requires a blocked reason ... ok (283µs)
teardown enforcement makes owned survival load-bearing ... ok (399µs)
foreign and unproven survival never fail a sibling run ... ok (279µs)
backoff uses reset time then bounded exponential schedule ... ok (262µs)
wall-clock clamp never crosses or underflows the budget ... ok (108µs)
running 3 tests from ./.llm/tools/agentic/compatibility-wrappers_test.ts
S5 retains every legacy task as a thin compatibility entry point ... ok (2ms)
compatibility wrappers retain stable flag and delegation contracts ... ok (4ms)
launch task and dry-run preflight retain sender-registry permission parity ... ok (449µs)
running 4 tests from ./.llm/tools/agentic/config/no-hardcoded-volatile_test.ts
config exports resolve to a non-trivial forbidden set ... ok (780µs)
Layer A — no config value is hardcoded outside config/ (exact, derived) ... ok (41ms)
Layer A — suite README references config or marks illustratives ... ok (1ms)
Layer B — no model/version/endpoint-shaped literal in production (structural) ... ok (38ms)
running 12 tests from ./.llm/tools/agentic/github/pr-checks_test.ts
latest workflow attempt supersedes a stale failed check-run ... ok (1ms)
latest successful workflow attempt supersedes a stale cancellation ... ok (191µs)
genuinely failed latest workflow attempt remains exit-relevant ... ok (163µs)
job id cannot overwrite an unrelated check-run id ... ok (118µs)
latest-attempt identity wins a timestamp tie ... ok (178µs)
queued latest-attempt job is pending instead of exposing stale failure ... ok (175µs)
cancelled run with newer green sibling is superseded and clean ... ok (207µs)
genuinely failed latest run is an exit-relevant current failure ... ok (101µs)
in-progress latest run is pending and clean, never a pass ... ok (142µs)
post-merge run on deleted head ref is stale and not a failure ... ok (101µs)
only latest run with the same name counts ... ok (111µs)
report includes head SHA and evaluation timestamp ... ok (41µs)
running 5 tests from ./.llm/tools/agentic/github/publication-body_test.ts
concurrent publication sessions stage collision-free body paths ... ok (9ms)
publication ownership rejects a body staged by another session ... ok (3ms)
publication ownership rejects body or metadata changed after staging ... ok (6ms)
publication staging refuses reuse of one session directory ... ok (3ms)
publication staging tightens a pre-existing root to owner-only ... ok (3ms)
running 7 tests from ./.llm/tools/agentic/github/review-threads_test.ts
unanswered review thread blocks ... ok (1ms)
replied review thread passes without requiring resolution ... ok (308µs)
reasoned decline is a reply and passes without a code change ... ok (223µs)
same-author follow-up does not answer a review thread ... ok (168µs)
outdated unanswered review thread is listed but ignored ... ok (211µs)
review-thread GraphQL reader returns every paginated thread ... ok (9ms)
CI close-gate invokes the answered review-thread task with read-only token access ... ok (920µs)
running 65 tests from ./.llm/tools/agentic/lib/agentic-lib_test.ts
winToWsl maps a Windows path to /mnt ... ok (1ms)
winToWsl passes through a POSIX path ... ok (161µs)
buildWslCommand selects local bash argv on Linux ... ok (664µs)
buildWslCommand preserves Windows wsl.exe argv ... ok (207µs)
buildWslCommand maps cwd locally and to Windows --cd ... ok (257µs)
buildWslCommand rejects a local requested-user mismatch ... ok (643µs)
wslUser/wslHome default to the historical hardcoded values when env is unset ... ok (241µs)
NETSCRIPT_WSL_USER/HOME override the defaults ... ok (198µs)
gh hosts fallback extracts only github.com oauth_token without exposing siblings ... ok (523µs)
missing GitHub net permission is classified and rendered without auth advice ... ok (364µs)
genuinely rejected GitHub credentials retain 401 diagnostics and auth remedy ... ok (128µs)
sq wraps plain strings ... ok (148µs)
sq escapes embedded single quotes ... ok (33µs)
validateHandoffContract passes a compliant brief ... ok (327µs)
validateHandoffContract fails without use harness ... ok (262µs)
validateHandoffContract fails without SKILL chapter ... ok (145µs)
validateHandoffContract tolerates CRLF briefs ... ok (255µs)
parseThreadInfo extracts the thread id from the real fixture ... ok (1ms)
parseThreadInfo returns nulls for a log with no thread ... ok (447µs)
parseThreadInfo accepts v0.144 camel-case app-server identity ... ok (134µs)
parseTurnComplete reports idle on a terminal task_complete ... ok (242µs)
parseTurnComplete skips trailing token_count bookkeeping after task_complete ... ok (179µs)
parseTurnComplete reports busy mid-turn ... ok (96µs)
parseTurnComplete tolerates a truncated leading line and top-level type ... ok (49µs)
parseTurnComplete returns not-complete for empty/garbage tail ... ok (54µs)
evaluateGitSafety passes a clean no-upstream worktree ... ok (115µs)
evaluateGitSafety flags an inherited upstream (push hazard) ... ok (70µs)
evaluateGitSafety flags a wrong branch and wrong base ... ok (147µs)
evaluateGitSafety returns code 5 for a missing worktree ... ok (112µs)
parseRepoSlug splits owner/name ... ok (217µs)
parseRepoSlug rejects malformed slugs ... ok (262µs)
buildOpenHandsComment emits the trigger line and body ... ok (213µs)
buildOpenHandsComment omits unset tokens and strips CRLF ... ok (162µs)
parseOpenHandsStatusComment parses a completed status ... ok (845µs)
parseOpenHandsStatusComment treats Running as non-final ... ok (355µs)
parseOpenHandsStatusComment maps failure headings ... ok (121µs)
buildPullRequestBody carries the core fields and omits draft when unset ... ok (203µs)
buildPullRequestBody sets draft when requested ... ok (132µs)
buildMergeBody passes method and pins the head sha ... ok (200µs)
parseEvalVerdict reads a PASS from a Verdict line ... ok (324µs)
parseEvalVerdict reads a FAIL_FIX verdict ... ok (279µs)
parseEvalVerdict prefers the Verdict line over an instructional echo ... ok (166µs)
parseEvalVerdict returns null verdict when absent ... ok (286µs)
parseEvalVerdict reads a standalone VERDICT: PASS (no IMPL/PLAN kind) ... ok (211µs)
parseEvalVerdict treats PASS-WITH-NITS as a pass ... ok (539µs)
parseEvalVerdict reads a standalone FAIL_FIX without a kind ... ok (127µs)
parseEvalVerdict never parses a menu echo as a verdict ... ok (119µs)
selectLatestOpenHandsComment picks the last tagged comment ... ok (200µs)
selectLatestOpenHandsComment returns null when none tagged ... ok (96µs)
appendVerdictContractEpilogue appends the contract once (idempotent) ... ok (191µs)
appendVerdictContractEpilogue instructs early verdict + machine-readable line ... ok (209µs)
the contract epilogue itself can never satisfy the verdict extractor ... ok (288µs)
extractVerdict reads the machine-readable OPENHANDS_VERDICT line (exact) ... ok (389µs)
extractVerdict reads the formal PHASE/VERDICT header (exact) ... ok (402µs)
extractVerdict prefers an exact layer over a newer heuristic comment ... ok (10ms)
extractVerdict falls back to a ## Verdict section in a synthesized summary ... ok (866µs)
extractVerdict falls back to an inline **Verdict: PASS.** phrase ... ok (492µs)
extractVerdict finds a verdict token buried in a context dump ... ok (507µs)
extractVerdict never matches the trigger/template comment ... ok (136µs)
extractVerdict ignores plain PASS/FAIL prose away from a verdict context ... ok (491µs)
extractVerdict takes the newest comment within the same layer ... ok (237µs)
extractVerdict returns null when there are no comments ... ok (165µs)
extractVerdict matches a bolded machine marker with Verdict: prefix (PR #475 prod form) ... ok (150µs)
extractVerdict matches a decorated full-line verdict in an agent comment (PR #476 prod form) ... ok (165µs)
extractVerdict never maps GitHub review vocabulary to a verdict ... ok (126µs)
running 4 tests from ./.llm/tools/agentic/lib/openrouter-credential_test.ts
shared OpenRouter credential parser accepts quoted exports ... ok (803µs)
shared credential resolver prefers the process environment ... ok (322µs)
shared credential resolver follows the configured fallback convention ... ok (193µs)
shared credential resolver fails without exposing unrelated content ... ok (766µs)
running 9 tests from ./.llm/tools/agentic/opencode/opencode-boundary-plugin_test.ts
plugin module exposes only the callable default at runtime ... ok (1ms)
resume matrix removes empty deltas and structurally empty assistant events ... ok (847µs)
tool-only turns preserve tool identity, result semantics, and ordering ... ok (336µs)
reasoning-only and interrupted text turns remain provider-visible ... ok (192µs)
provider switches retain stored identity and repeated normalization is idempotent ... ok (298µs)
signed reasoning adjacency fails closed with safe local identity only ... ok (1ms)
unsafe event identity is bounded and never echoed ... ok (123µs)
discovery telemetry distinguishes MCP, web, local docs, and generated source ... ok (376µs)
history validation receipt proves every dispatch without retaining content ... ok (316µs)
running 3 tests from ./.llm/tools/agentic/opencode/opencode-preflight_test.ts
MCP preflight keeps available count separate from expected tools and calls ... ok (870µs)
MCP preflight fails closed for missing connection or invalid host tool shape ... ok (706µs)
MCP preflight diagnostics reject unsafe generated server identities ... ok (81µs)
running 7 tests from ./.llm/tools/agentic/opencode/opencode-project-config_test.ts
generated MCP translation is stable, multi-server, and complete ... ok (1ms)
generated MCP translation rejects malformed or unsupported entries ... ok (900µs)
inline overlay preserves isolation keys and project MCP wins collisions ... ok (417µs)
inline overlay rejects malformed and colliding non-object config ... ok (464µs)
discovery uses nearest config and stops at the project boundary ... ok (12ms)
discovery fails closed on malformed nearest config ... ok (1ms)
prepared environment retains credential/provider isolation and adds owned receipt path ... ok (3ms)
running 7 tests from ./.llm/tools/agentic/opencode/opencode-run_test.ts
OpenCode argv keeps the message before every flag ... ok (2ms)
OpenCode argv repeats -f and passes variant and JSON format through ... ok (647µs)
OpenCode argv resumes the exact stored session before provider dispatch ... ok (218µs)
OpenCode binary override takes precedence over PATH-resolved name ... ok (163µs)
OpenRouter env parser accepts export and quoted values ... ok (326µs)
existing OpenRouter key wins without reading the config file ... ok (1ms)
OpenRouter key falls back to the configured user env file ... ok (1ms)
running 4 tests from ./.llm/tools/agentic/opencode/opencode-web_test.ts
OpenCode web argv carries configured host, port, discovery, and repeated CORS ... ok (737µs)
OpenCode web recognizes only explicit loopback hostnames ... ok (75µs)
OpenCode web requires a password for LAN or mDNS exposure ... ok (656µs)
OpenCode web permits protected remote exposure and local loopback ... ok (146µs)
running 4 tests from ./.llm/tools/agentic/openhands/docs-eval-workflow_test.ts
docs eval event matrix permits only ready transition or authorized request ... ok (1ms)
docs eval escape hatches and durable marker are deterministic ... ok (248µs)
workflow source encodes the serialized exactly-once contract ... ok (668µs)
OpenHands runner installs the missing LiteLLM MCP dependency ... ok (444µs)
running 5 tests from ./.llm/tools/agentic/runtime/adapters/antigravity-adapter_test.ts
Antigravity adapter passes the prompt as the final print value ... ok (8ms)
Antigravity argv rejects an empty or flag-shaped resolved prompt ... ok (724µs)
Antigravity adapter classifies auth/service failure and retains no raw output ... ok (648µs)
Antigravity adapter abort is a failed timeout even with owner acceptance ... ok (3ms)
Antigravity adapter bounds captured provider text before classification ... ok (1ms)
running 11 tests from ./.llm/tools/agentic/runtime/adapters_test.ts
Codex launch uses a content file and preserves exact worktree identity ... ok (2ms)
Codex launch refuses an owned worktree before constructing a rival process ... ok (589µs)
Codex resume is same-thread only and cannot construct a new sender ... ok (670µs)
Codex reuses bounded launch-log and turn parsing primitives ... ok (1ms)
route matrix rejects incomplete and conflicting identity before construction ... ok (544µs)
dirty wrong-branch and active-turn Codex plans reject before execution ... ok (412µs)
Claude static smoke uses fixed bounded argv and blocks owner-only live work ... ok (700µs)
Antigravity observations are finite and live evidence is bounded ... ok (676µs)
provider requires explicit issue 577 profiles and never exposes input values ... ok (1ms)
unsupported lifecycle operations return finite diagnostics and no request ... ok (927µs)
foundation owned readers match checkpoint canonical component shapes ... ok (2ms)
running 4 tests from ./.llm/tools/agentic/runtime/antigravity-compat_test.ts
legacy persisted Gemini desired state migrates explicitly to Antigravity vocabulary ... ok (2ms)
ambiguous legacy and canonical Google CLI state is refused ... ok (640µs)
legacy foundation manifest migrates without a Gemini executable alias ... ok (9ms)
Antigravity static and bounded live probes use agy without a Gemini alias ... ok (957µs)
running 3 tests from ./.llm/tools/agentic/runtime/antigravity-evidence-aggregation_test.ts
aggregation writes only empirically supported normalized citations ... ok (2ms)
owner acceptance alone never writes run resources ... ok (427µs)
local aggregation adapter writes value-only metadata with private mode ... ok (10ms)
running 6 tests from ./.llm/tools/agentic/runtime/antigravity-evidence_test.ts
finite Antigravity evidence proves exact headless markers without raw output ... ok (2ms)
classification fails closed for auth, timeout, quota, and rate limiting ... ok (321µs)
citation metadata strips query, fragment, credentials, duplicates, and raw text ... ok (1ms)
owner acceptance is explicit and does not overwrite observed failure ... ok (194µs)
AGENTS and GEMINI instruction markers are classified independently ... ok (197µs)
structured output is read from the probe, not pinned ... ok (282µs)
running 4 tests from ./.llm/tools/agentic/runtime/child-process-environment-adapter_test.ts
child environment late-binds only the selected target and leaves parent map unchanged ... ok (14ms)
every profile policy explicitly clears rival credential keys ... ok (474µs)
absent credential returns structured non-secret auth diagnostic without spawning ... ok (280µs)
policy refuses a selected target that is also explicitly cleared ... ok (197µs)
running 2 tests from ./.llm/tools/agentic/runtime/cli/antigravity-evidence-cli_test.ts
evidence CLI accepts only bounded identifiers and fixed probe kinds ... ok (769µs)
evidence CLI rejects prompt, credential, relative aggregation, and excessive timeout flags ... ok (428µs)
running 2 tests from ./.llm/tools/agentic/runtime/cli/provider-canary_test.ts
provider canary defaults to exhaustive credential-free static mode ... ok (1ms)
provider calls require explicit live mode with complete route identity ... ok (1ms)
running 1 test from ./.llm/tools/agentic/runtime/cli/rollout-canary-cli_test.ts
rollout CLI accepts only worktree and output paths ... ok (753µs)
running 2 tests from ./.llm/tools/agentic/runtime/cli/rollout-canary-runner_test.ts
runner orchestrates shipped commands and returns nine secret-safe rows ... ok (3ms)
provider incompatibility blocks the recommendation ... ok (426µs)
running 2 tests from ./.llm/tools/agentic/runtime/cli/routing-state_test.ts
routing state human edge is finite for an empty machine-local store ... ok (2ms)
routing state human edge renders canonical evaluator lanes ... ok (416µs)
running 9 tests from ./.llm/tools/agentic/runtime/codex-remote-repair_test.ts
daemon classification explicitly distinguishes every #580 state ... ok (677µs)
repair refuses active sessions and child commands before every mutation ... ok (515µs)
repair proceeds from absent state despite stale non-completed rollout evidence ... ok (4ms)
repair proceeds from stale_socket state despite stale non-completed rollout evidence ... ok (1ms)
repair still refuses a non-completed rollout anchored by a live app-server ... ok (2ms)
repair refuses unanchored processes and parser never broad-matches shells ... ok (367µs)
dry-run inspects and plans without daemon, socket, or evidence mutation ... ok (144µs)
repair follows anchored terminate socket restart verify evidence order ... ok (176µs)
post-repair version skew fails verification and persists no evidence ... ok (102µs)
running 9 tests from ./.llm/tools/agentic/runtime/contract_test.ts
schema vocabularies are finite and duplicate-free ... ok (666µs)
command union covers the complete schema 1.0 command vocabulary ... ok (362µs)
command mode policy rejects illegal combinations at runtime ... ok (633µs)
desired-state source loads a value-free state from a content reference ... ok (153µs)
desired-state routes preserve validated OpenRouter preset identity ... ok (695µs)
persisted and result contracts expose identifiers and fingerprints only ... ok (300µs)
read and mutation port vocabularies are disjoint ... ok (141µs)
reconciliation plans are serializable data, not executable closures ... ok (217µs)
strict desired-state vocabulary rejects unknown nested keys ... ok (1ms)
running 9 tests from ./.llm/tools/agentic/runtime/controller_test.ts
successful apply persists desired state, checkpoint id, and last command ... ok (5ms)
configure survives a fresh LocalRuntimeStateAdapter roundtrip ... ok (26ms)
state write failure compensates; failed compensation is reported failed ... ok (6ms)
checkpoints retain typed inverse metadata and before/after fingerprints ... ok (3ms)
explicit rollback rejects external drift without mutation and is idempotent ... ok (1ms)
generic repair apply cannot bypass the dedicated guarded adapter ... ok (361µs)
read stages classify probe, state, checkpoint, and desired failures ... ok (815µs)
planner-only calls remain mutation free and adapter diagnostics remain exact ... ok (2ms)
post-action and rollback probes preserve finite failure categories ... ok (3ms)
running 4 tests from ./.llm/tools/agentic/runtime/deferred-boundaries_test.ts
deferred registry retains only future rollout issue 582 ... ok (956µs)
Antigravity live evidence plans while controller apply remains unsupported ... ok (659µs)
all controller lifecycle apply paths point to the ownership-enforced launcher ... ok (328µs)
issue 582 rollout promotion remains absent rather than a hidden implementation ... ok (185µs)
running 6 tests from ./.llm/tools/agentic/runtime/launch-route-identity_test.ts
launch identity rejects missing or unsupported provider model and effort ... ok (1ms)
launch evidence records matched requested and observed identity ... ok (303µs)
Codex custom provider id is canonicalized to OpenRouter identity ... ok (138µs)
launch evidence exposes mismatch fields without provider output or credentials ... ok (116µs)
route mismatch escalation blocks with explicit operator action by default ... ok (191µs)
route mismatch escalation has an explicit opt-out ... ok (140µs)
running 1 test from ./.llm/tools/agentic/runtime/legacy-checkpoint_test.ts
exact schema-1.0 legacy checkpoint remains readable but unavailable inverse is refused ... ok (15ms)
running 14 tests from ./.llm/tools/agentic/runtime/planner_test.ts
runtime component version fixture is immutable and explicitly ordered ... ok (1ms)
equal configured state plans no actions ... ok (603µs)
equal bootstrap state plans no actions ... ok (514µs)
doctor accepts the complete PR 0A observed component vocabulary ... ok (218µs)
planner blocks a runtime-forced illegal command mode ... ok (188µs)
bootstrap drift yields deterministic data-only actions in finite order ... ok (327µs)
Codex repair plans one explicit mobile-control action ... ok (213µs)
OpenRouter route planning is available after issue 577 profile selection ... ok (330µs)
Antigravity live smoke planning is enabled after owner acceptance ... ok (178µs)
fallback never changes route inside an active turn ... ok (188µs)
unsafe worktree blocks launch before any session action ... ok (310µs)
controller lifecycle apply is a permanent plan-only boundary ... ok (879µs)
false current-route metadata is rejected before route mutation planning ... ok (170µs)
rollback is idempotent and plans only an observed prepared checkpoint ... ok (240µs)
running 2 tests from ./.llm/tools/agentic/runtime/preset-canary_test.ts
static canary exhaustively validates every OpenRouter preset launch plan ... ok (4ms)
missing and incoherent preset records fail the exhaustive canary ... ok (717µs)
running 7 tests from ./.llm/tools/agentic/runtime/provider-canary_test.ts
complete observed compatibility is the only fan-out-eligible result ... ok (981µs)
absent credentials are structured blocked diagnostics and never fabricated passes ... ok (776µs)
preset identity is reported and a mismatched preset fails before spawn ... ok (321µs)
unsupported, malformed, and timeout evidence fail closed with actionable diagnostics ... ok (348µs)
live adapter reduces private JSONL to counts and enforces read-only runner argv ... ok (11ms)
Codex canary requires the named profile and uses ephemeral read-only execution ... ok (260µs)
Codex namespace rejection is reduced to a structured incompatibility ... ok (452µs)
running 6 tests from ./.llm/tools/agentic/runtime/provider-profiles_test.ts
provider profiles are finite, frozen, and clear every rival credential key ... ok (496µs)
OpenRouter preset slugs and route purposes are locked ... ok (546µs)
native profiles resolve compatibly while non-native routes require explicit profiles ... ok (291µs)
profile mismatch and rival credential presence fail explicitly by key name only ... ok (439µs)
OpenRouter plan mode is enabled while controller apply remains unsupported ... ok (654µs)
Antigravity live evidence plans without changing provider profiles ... ok (234µs)
running 5 tests from ./.llm/tools/agentic/runtime/rollout-canary_test.ts
aggregate requires exactly nine ordered stable canary ids ... ok (1ms)
conditional evidence remains explicit and drives conditional recommendation ... ok (291µs)
conditional classifications can never become fabricated passes ... ok (251µs)
sensitive and raw evidence is refused before persistence ... ok (140µs)
a failed row blocks promotion recommendation ... ok (117µs)
running 1 test from ./.llm/tools/agentic/runtime/rollout-report_test.ts
checked-in report is traceable to every machine-readable canary ... ok (1ms)
running 36 tests from ./.llm/tools/agentic/runtime/routing-policy_test.ts
policy selects by explicit priority and reports mobile visibility changes ... ok (1ms)
active slices and maximum fallback depth block without selecting ... ok (266µs)
evaluation blocks rather than selecting the author model family ... ok (135µs)
outside-plan and higher-effort Fable-shaped policy requires explicit approvals ... ok (229µs)
orchestrator defaults to Opus 5 high and deep analysis to Fable 5 medium ... ok (540µs)
Fable 5 is back on the subscription: every Fable route is in-plan and auto-selectable ... ok (121µs)
there is no mobile_orchestration lane — the orchestrator session owns /rc ... ok (166µs)
implementation stays Codex GPT-5.6 Sol — medium normal, high complex ... ok (206µs)
adversarial review of Codex work is Fable, opposite-family, paired to effort ... ok (291µs)
delegated chores: docs/cleanup on Sonnet 5 high, code chores on Opus 5 medium ... ok (236µs)
orchestrator and deep-analysis lanes carry a Codex Sol high token-limit fallback ... ok (201µs)
Claude Code workflow lane stays Opus 5 low ... ok (130µs)
major UI/UX work is GLM-led or receives the mandatory GLM adversarial pass ... ok (185µs)
OpenCode vision evaluation complements the mandatory GLM design pass ... ok (139µs)
deep-analysis Fable fallback requires classified Codex quota exhaustion ... ok (205µs)
canonical research and documentation-authoring lanes use Gemini 3.6 Flash through Antigravity ... ok (100µs)
documentation authoring is not bound to an OpenRouter provider ... ok (156µs)
Claude review stays opposite-family on GPT-5.6 Sol xhigh ... ok (122µs)
canonical evaluator lanes bind each authored family to its opposite-family route ... ok (315µs)
canonical evaluator resolution rejects self-certification ... ok (762µs)
formal evaluator defaults to a native opposite-family session ... ok (404µs)
formal evaluator uses Minimax/DeepSeek only for third opinion or native quota limit ... ok (318µs)
formal evaluator falls back to AGY Gemini 3.6 Flash high only on explicit OpenRouter limit ... ok (484µs)
formal evaluator rejects wrong native family and reused generator sessions ... ok (229µs)
formal evaluator rejects cross-phase presets ... ok (314µs)
formal IMPL evaluator rejects the stale Qwen 3.7 model ... ok (557µs)
formal IMPL evaluator rejects the retired well-formed Qwen 3.8 route ... ok (296µs)
formal evaluator rejects the Gemini documentation-authoring generator lane ... ok (189µs)
review-of-Codex ladder is effort-paired and Fable is reserved for medium+ ... ok (279µs)
every review-of-Codex route is opposite-family (Claude); Fable primaries are in-plan and auto-selectable ... ok (405µs)
token-limit review fallbacks stay Claude-family and are never primary ... ok (220µs)
docs_audit is an opposite-family Codex Sol medium single pass with NO cross-family fallback ... ok (231µs)
docs_audit large-changeset high effort is declared policy data, not prose ... ok (266µs)
docs_audit fallback selection fails closed on any non-OpenAI-family candidate ... ok (148µs)
docs_polish is Claude Fable 5 medium edit-only, with an ordered depth-2 fallback chain ... ok (248µs)
implementation lanes are effort-tiered on GPT-5.6 Sol ... ok (221µs)
running 3 tests from ./.llm/tools/agentic/runtime/routing-signal-classifier_test.ts
structured diagnostics take precedence over compatibility text ... ok (1ms)
exact pinned versions classify known compatibility text ... ok (243µs)
unknown versions, unknown text, and unrelated diagnostics fail closed ... ok (178µs)
running 3 tests from ./.llm/tools/agentic/runtime/routing-state-machine_test.ts
fallback and restoration require boundaries, reset time, and successful canary ... ok (1ms)
failed canary records backoff and cannot probe early ... ok (317µs)
routing state and bounded history survive a fresh local adapter ... ok (9ms)
running 7 tests from ./.llm/tools/agentic/runtime/runner-provider-profiles_test.ts
Codex OpenRouter profile is credential-free Responses TOML with mode 0600 ... ok (1ms)
Codex OpenRouter plans select the named isolated profile and child credential ... ok (1ms)
Codex OpenRouter refuses launch planning without a materialized profile ... ok (294µs)
Claude native and OpenRouter routes use model plus isolated child environments ... ok (622µs)
Claude OpenRouter launch and resume use the isolated print wrapper ... ok (547µs)
formal evaluator routes alone receive the child-model request guard ... ok (672µs)
custom Claude base URL is sanitized and always reports experimental remote unavailable ... ok (1ms)
running 4 tests from ./.llm/tools/agentic/runtime/sender-ownership_test.ts
live sender ownership deterministically blocks a rival and directs resume ... ok (493µs)
age never makes a live owner stale and dead evidence permits reclaim ... ok (66µs)
atomic local create permits exactly one sender and stores no payload fields ... ok (8ms)
strict record parser rejects unknown fields and cross-worktree ownership conflicts ... ok (393µs)
running 1 test from ./.llm/tools/agentic/teardown/forbidden-commands_test.ts
repository contains no shared-host bulk teardown command ... ok (885ms)
running 7 tests from ./.llm/tools/agentic/teardown/leak-check_test.ts
report never hides foreign or unproven survivors ... ok (2ms)
owned registry survivor reports age, staleness, and exact scoped command ... ok (388µs)
foreign resource can be stale from probed creation time without registry evidence ... ok (414µs)
unavailable probes report no survivors and never block done ... ok (9ms)
successful Aspire probe survives unavailable Docker ... ok (2ms)
apparent owner is derived from the worktree parent, not a fixed path ... ok (393µs)
a resource outside the sibling root has no apparent owner ... ok (261µs)
running 7 tests from ./.llm/tools/agentic/teardown/ownership_test.ts
empty registry and foreign host has zero actionable resources ... ok (3ms)
path containment compares segments rather than string prefixes ... ok (261µs)
registry identity requires pid and process start time ... ok (155µs)
missing or unparseable mount evidence fails closed ... ok (110µs)
aspire mcp command line is rejected despite otherwise owned path ... ok (266µs)
a clean-clone container outside the worktree is owned once its root is registered ... ok (303µs)
an over-broad owned root cannot claim another run ... ok (155µs)
running 2 tests from ./.llm/tools/agentic/teardown/probes_test.ts
observed Aspire 13.4.6 shapes normalize behind ports ... ok (1ms)
missing and malformed mount labels expose no path evidence ... ok (139µs)
running 5 tests from ./.llm/tools/agentic/teardown/run-resources_test.ts
missing registry reads as an empty schema-versioned registry ... ok (3ms)
registration writes atomically and deduplicates identity pairs ... ok (7ms)
wrong schema never becomes ownership evidence ... ok (1ms)
a v1 registry reads forward with no owned roots ... ok (1ms)
owned roots deduplicate and refuse to claim a shared parent ... ok (2ms)
running 6 tests from ./.llm/tools/agentic/teardown/teardown_test.ts
dry run and foreign resources execute no commands ... ok (2ms)
apply exits non-zero when requested cleanup is escalated ... ok (362µs)
apply stops each AppHost by path and re-verifies a single container id ... ok (1ms)
a zero exit from aspire stop is not accepted while the process survives ... ok (567µs)
a pid reused by another process counts as stopped ... ok (420µs)
changed labels abandon removal and escalate ... ok (235µs)
running 20 tests from ./.llm/tools/agentic/wsl/wsl-foundation_test.ts
parseVersion accepts common tool banners ... ok (729µs)
component classifier distinguishes missing, outdated, and ready ... ok (222µs)
component classifier rejects successful unparseable version output ... ok (259µs)
state directory detail never contains an absolute home path ... ok (73µs)
Antigravity auth uses only secret-safe official session markers ... ok (102µs)
legacy Gemini cleanup requires a matching ownership manifest ... ok (155µs)
missing provider sessions are non-fatal auth-required states ... ok (152µs)
Codex version skew remains distinct from managed availability ... ok (125µs)
doctor report prioritizes auth conflict over degraded state ... ok (273µs)
bootstrap plan is ordered, exact-versioned, and reversible by ownership ... ok (385µs)
bootstrap plan is empty when desired state is already present ... ok (163µs)
Antigravity-only install creates the owned root before writing its installer ... ok (140µs)
unfinished Antigravity install is recoverable into the ownership manifest ... ok (101µs)
canonical recovery rejects wrong-owner and non-executable agy metadata ... ok (74µs)
non-executable agy cannot finalize ownership or remove recovery journal ... ok (7ms)
valid canonical agy recovery finalizes ownership then removes journal ... ok (5ms)
installer creates its root and durable journal before execution ... ok (3ms)
malformed ownership manifest is invalid rather than missing ... ok (1ms)
unreadable ownership manifest is invalid rather than missing ... ok (1ms)
rollback plan never removes Codex or provider session directories ... ok (164µs)
running 11 tests from ./.llm/tools/deps/bump-version_test.ts
bump-version wrapper preserves native dry-run output ... ok (157ms)
bump-version wrapper coordinates an exact version with zero residue ... ok (149ms)
coordinated stable bump preserves third-party versions ... ok (73ms)
coordinated canary bump preserves third-party versions ... ok (20ms)
discoverVersionFiles includes tracked locks and excludes untracked adjacent locks ... ok (22ms)
discoverVersionFiles falls back to existing locks outside a Git worktree ... ok (6ms)
findVersionResidue reports a prior release retained in a nested member lock ... ok (7ms)
findVersionResidue ignores a same-core canary and reports an exact stable residue ... ok (7ms)
findVersionResidue excludes captured public-surface baseline snapshots ... ok (12ms)
findVersionResidue excludes test fixtures that pin prior published releases ... ok (18ms)
findVersionResidue reports stale generated TypeScript and retains deliberate exclusions ... ok (12ms)
running 6 tests from ./.llm/tools/deps/check-zod-alignment_test.ts
zod alignment accepts npm v4 plus the documented residual v3 boundary ... ok (1ms)
zod alignment rejects a second or v3 lock instance ... ok (272µs)
zod alignment rejects JSR and inline member specifiers ... ok (376µs)
zod alignment rejects source that emits a JSR Zod manifest ... ok (185µs)
zod alignment rejects an AI or MCP package resolving through v3 ... ok (351µs)
zod alignment rejects the oRPC compatibility root surface ... ok (165µs)
running 2 tests from ./.llm/tools/deps/prod-install_test.ts
prod-install uses deno ci --prod without rejected frozen flag ... ok (1ms)
prod-install preserves skip-types without adding frozen flag ... ok (223µs)
running 1 test from ./.llm/tools/docs/build-agent-docs-bundle_test.ts
docs prose builder requires the #1068 task router and writes only its output root ... ok (31ms)
running 2 tests from ./.llm/tools/docs/check-accuracy-and-discoverability_test.ts
checkFreshRootImports allows valid root imports and fails on invalid root import with file, line, and symbol diagnostics ... ok (15ms)
checkGoldenPathDocs rejects retired paths, aliases, and query dialect drift ... ok (8ms)
running 4 tests from ./.llm/tools/docs/check-docs-contract-derivation_test.ts
documented contract derivation compiles through both generated aliases ... ok (3s)
negative fixture exits non-zero: root-alias ... ok (1s)
negative fixture exits non-zero: contracts-alias ... ok (2s)
negative fixture exits non-zero: barrel-export ... ok (2s)
running 1 test from ./.llm/tools/docs/check-exports-drift_test.ts
drift checker negative fixture validation ... ok (2ms)
running 1 test from ./.llm/tools/docs/check-internal-links_test.ts
checkInternalLinks validates same-page fragment, cross-page fragment, relative clean URL, and relative .md failure ... ok (11ms)
running 3 tests from ./.llm/tools/docs/generate-export-surface-corpus_test.ts
normalizer consumes the checked-in Deno 2.9 JSON fixture ... ok (2ms)
generated payload is deterministic and carries pinned count and hash metadata ... ok (71ms)
renderer covers real first-party interface, variable, alias, and class JSON shapes ... ok (393ms)
running 4 tests from ./.llm/tools/e2e/print-failed-report-steps_test.ts
formatFailedReportSteps prints error and captured command streams ... ok (1ms)
formatFailedReportSteps leads with decisive Prisma errors and filters download noise ... ok (239µs)
GitHub diagnostic formats carry the failed gate and decisive error ... ok (396µs)
formatFailedReportSteps rejects a report without steps ... ok (762µs)
running 4 tests from ./.llm/tools/e2e/scaffold-e2e-test_test.ts
scaffold diagnostic cleans up by default with explicit opt-out ... ok (3ms)
missing Aspire binary becomes a structured failed step ... ok (123ms)
consumer mode selects the exact released CLI without a framework clone ... ok (8ms)
generated host-port validation is critical and inspects the final pre-runtime artifact ... ok (4ms)
running 2 tests from ./.llm/tools/fitness/check-ds-gates_test.ts
ds no raw hex gate fails on a fixture raw color ... ok (59ms)
ds color utilities gate fails on a fixture stock palette utility ... ok (45ms)
running 4 tests from ./.llm/tools/generate-publish-assets_test.ts
MCP fallback is generated from the locked release prose within 256 KiB ... ok (72ms)
release asset regeneration removes prior-version provenance residue ... ok (7ms)
top-level generation refreshes provenance before MCP reads it ... ok (86ms)
release bump rebases one shared corpus before CLI and MCP consume it ... ok (49ms)
running 6 tests from ./.llm/tools/harness/extract-verdict_test.ts
reads the verdict from assistant text blocks, NOT the empty result field ... ok (1ms)
EMPTY evaluator output is a hard failure even when the run reports success ... ok (264µs)
output with no verdict token is a failure to evaluate ... ok (434µs)
concatenates multiple assistant turns and blocks ... ok (281µs)
does not match a verdict token embedded in a longer word ... ok (453µs)
tolerates non-JSON noise on the stream ... ok (749µs)
running 6 tests from ./.llm/tools/quality/scan-code-quality_test.ts
scanner reports every guarded quality rule and honors reasoned line allowances ... ok (10ms)
scanner accepts exact changed files and ignores tests and generated sources ... ok (1ms)
scanner catches evasion attempts: file-wide ignore, spaced casts, predicate name checks ... ok (2ms)
capability id containing a plugin name is NOT a false positive ... ok (2ms)
scanner catches plugin-identity via const/array indirection (Opus IMPL-EVAL bypass) ... ok (2ms)
scanner catches @ts-error suppressions and `as never` (source-side type escapes) ... ok (1ms)
running 2 tests from ./.llm/tools/release/assert-release-version_test.ts
release version coherence reports every coordinated manifest mismatch ...
------- post-test output -------
Release version coherence: FAIL (expected 0.0.5; 3 of 3 manifests mismatch)
- deno.json: 0.0.4
- packages/api/deno.json: 0.0.4
- packages/web/deno.json: 0.0.3
----- post-test output end -----
release version coherence reports every coordinated manifest mismatch ... ok (24ms)
release version coherence passes only when the coordinated set matches ...
------- post-test output -------
Release version coherence: PASS (3 manifests at 0.0.5)
----- post-test output end -----
release version coherence passes only when the coordinated set matches ... ok (9ms)
running 15 tests from ./.llm/tools/release/canary-label_test.ts
payload includes a PR merge commit buried behind a release update merge ... ok (116ms)
stable version is rejected instead of labelled ... ok (686µs)
repo-style wrong-train label and published version fail drift both ways ... ok (284µs)
drift is scoped to the published canary train ... ok (111µs)
payload uses commit associations, not misleading commit-subject issue numbers ... ok (259µs)
prior canary point is resolved from the published train ... ok (355µs)
first canary falls back to nearest stable first-parent point ... ok (124µs)
did-not-run checks are visibly distinct from passing checks in JSON ... ok (242µs)
closing-link lookup failure prevents a false payload pass ... ok (447µs)
empty payload renders an explicit canary note ... ok (188µs)
a zero-commit range returns explicit genuine-empty evidence without association lookup ... ok (85µs)
a non-empty range without PR associations is a named derivation failure ... ok (148µs)
release note refuses a version absent from registry output ... ok (92µs)
canary release is a prerelease and can never become Latest ... ok (53µs)
drift is scoped to the target train and still catches real divergence ... ok (248µs)
running 12 tests from ./.llm/tools/release/canary_test.ts
canary version takes the maximum registry N across all members including yanked versions ... ok (994µs)
canary version uses tags as a secondary collision guard and tolerates new packages ... ok (312µs)
canary parser accepts only a stable target and task separator ... ok (788µs)
machine result carries the resolved 0.0.4 canary identity ... ok (5ms)
canary republish version must be canonical and belong to the target train ... ok (482µs)
canary republish accepts only a clean checkout matching the tagged tree ... ok (471µs)
canary republish refuses a dirty checkout before comparing committed trees ... ok (310µs)
canary republish names both tree SHAs when tagged content differs ... ok (189µs)
canary ref creation pushes only an ephemeral branch and provenance tag ... ok (511µs)
canary version fails closed when registry discovery fails ... ok (335µs)
JSR registry discovery treats only 404 as a new package ... ok (3ms)
JSR registry discovery retains yanked version keys and rejects malformed metadata ... ok (648µs)
running 3 tests from ./.llm/tools/release/check-jsr-publish-budget_test.ts
publish budget admits a full coordinated workspace before minting ... ok (7ms)
publish budget fails clearly when remaining attempts cannot cover the workspace ... ok (514µs)
publish budget fails closed on unauthenticated or malformed quota data ... ok (423µs)
running 1 test from ./.llm/tools/release/config/no-hardcoded-volatile_test.ts
release endpoint is centralized in config ... ok (5ms)
running 7 tests from ./.llm/tools/release/cut_test.ts
release cut creates its PR through the injected GitHub transport ...
------- post-test output -------
release:cut GitHub token source: test
https://github.com/rickylabs/netscript/pull/999
----- post-test output end -----
release cut creates its PR through the injected GitHub transport ... ok (1ms)
release cut leaves PR creation failure non-fatal ...
------- post-test output -------
release:cut GitHub token source: test
release:cut could not create the release PR: GitHub API returned 422: validation failed
Branch release/cut-0.0.1-beta.8 was pushed successfully. Open the PR manually against main using the generated body file.
----- post-test output end -----
release cut leaves PR creation failure non-fatal ... ok (465µs)
release cut writes its PR body in a fresh worktree ... ok (7ms)
release cut bump coordinator updates root members and lock with no residue ... ok (19ms)
release cut refuses equal or older versions ... ok (609µs)
canary mode accepts only a same-core canary of the current stable version ... ok (470µs)
release cut parser ignores task separator ... ok (162µs)
running 15 tests from ./.llm/tools/release/github-release_test.ts
toVersion strips a single leading v; toTag re-adds it ... ok (644µs)
version-only diff accepts the complete release version surface only ... ok (245µs)
green canary pair accepts current SHA or a version-only immediate parent ... ok (781µs)
canary pair gate fails closed for source drift and API failure ... ok (606µs)
parent canary evidence rejects seeded manifest drift inside a version file ... ok (199µs)
formatClosedIssues renders a bulleted list, empty when none ... ok (92µs)
composeReleaseBody orders intro, changelog, closed issues and drops blanks ... ok (87µs)
parseArgs: version positional or flag, defaults to non-prerelease Latest ... ok (155µs)
parseArgs: --prerelease implies not-Latest; explicit --latest with it throws ... ok (658µs)
parseArgs: --no-latest overrides the default ... ok (55µs)
parseArgs: every documented release:publish invocation is accepted ... ok (720µs)
parseArgs: intro is required (the deliberate manual step) ... ok (124µs)
parseArgs: version is required ... ok (79µs)
parseArgs: notes-file and message are mutually exclusive ... ok (64µs)
parseArgs: unknown flag and missing value are rejected ... ok (112µs)
running 5 tests from ./.llm/tools/release/preflight-release_test.ts
publish-set audit includes AI siblings and reports publish:false as missing ... ok (15ms)
publish-set exclusions require a recorded reason ... ok (1ms)
publish-set audit accepts an explicitly reasoned internal exclusion ... ok (3ms)
publish-set audit covers explicit nested workspace members and applies the durable exclusion ... ok (4ms)
markdown preflight blocks stale normal and prerelease pins across docs ... ok (5ms)
running 11 tests from ./.llm/tools/release/preflight-text-imports_test.ts
preflight rejects import attributes in publishable source ... ok (1ms)
preflight ignores import-attribute text in inert source regions ... ok (336µs)
preflight flags cross-line import.meta-relative reads ... ok (758µs)
preflight ignores URL constructors and generated constants without Deno reads ... ok (341µs)
preflight allowlist suppresses a single read line ... ok (413µs)
preflight flags eager fromFileUrl on import.meta.url ... ok (631µs)
preflight ignores embedded string source but still flags following executable code ... ok (184µs)
preflight still flags executable code in a template interpolation ... ok (157µs)
preflight allows protocol-guarded fromFileUrl import.meta conversion ... ok (342µs)
release:preflight task argv accepts a bare separator ... ok (108ms)
file-url check ignores embedded string data but still fails on real syntax ... ok (368µs)
running 2 tests from ./.llm/tools/release/prepare-release_test.ts
shared release preparation runs the stable gate sequence in order ...
------- post-test output -------
release:canary bumped 0.0.1-beta.10 -> 0.0.1-canary.1
release:canary gate: gen:publish-assets
release:canary gate: gen:mcp-export-corpus
release:canary gate: gen:assets-barrel
release:canary gate: publish:readiness
release:canary gate: publish:dry-run
release:canary gate: deno ci --prod
----- post-test output end -----
shared release preparation runs the stable gate sequence in order ... ok (3ms)
shared release preparation regenerates assets then stops when residue remains ...
------- post-test output -------
release:canary bumped 0.0.1-beta.10 -> 0.0.1-canary.1
release:canary gate: gen:publish-assets
release:canary gate: gen:mcp-export-corpus
release:canary gate: gen:assets-barrel
----- post-test output end -----
shared release preparation regenerates assets then stops when residue remains ... ok (1ms)
running 13 tests from ./.llm/tools/release/publish-readiness_test.ts
publish readiness emits ordered structured evidence for every composed check ... ok (2ms)
publish readiness fails on a seeded workspace member omitted from the publish set ... ok (374µs)
publish readiness preserves the seeded stale Markdown pin gate ... ok (174µs)
lockstep and residue audit fails on seeded manifest and internal specifier versions ... ok (16ms)
lockstep audit ignores seeded fixture scaffold versions outside the release surface ... ok (8ms)
publish readiness fails on a pin the release no longer ships ... ok (6ms)
publish readiness fails on a seeded versionless framework specifier ... ok (2ms)
first-publish checklist fails on a seeded missing README ... ok (2ms)
first-publish checklist fails over-cap tagline, missing license/exports, and docs pointer ... ok (3ms)
publish readiness fails when seeded first-publish provisioning dry-check fails ... ok (509µs)
new-package evidence enumerates only registry-absent members ... ok (478µs)
registry failure skips dependent first-publish checks instead of using a partial set ... ok (507µs)
publish readiness exercises the real preflight for a seeded text import and carries #810 sunset ... ok (88ms)
running 2 tests from ./.llm/tools/release/publish-workspace_test.ts
publish dry-run isolates catalog and Deno manifest rewrites in a throwaway workspace ... ok (17ms)
package dry-run isolates MCP publish array rewrites ... ok (8ms)
running 3 tests from ./.llm/tools/release/release-canary-workflow_test.ts
canary workflow reuses the publisher and records only an awaited green pair ... ok (1ms)
stable publisher uses composed readiness before provisioning and real publish ... ok (773µs)
production E2E waits for JSR propagation for explicit canary dispatches ... ok (449µs)
running 2 tests from ./.llm/tools/release/report-jsr-publish-outcome_test.ts
publish outcome distinguishes none, partial, and complete exact-version presence ... ok (1ms)
exact-version assertion names every missing package ... ok (742µs)
running 3 tests from ./.llm/tools/release/surface-diff_test.ts
surface classifier reports changed/removal as major and addition as minor ... ok (3ms)
surface classifier accepts explicitly declared majors without hiding verdict ... ok (1ms)
surface normalization ignores locations, docs, bodies, and resolution paths ... ok (1ms)
running 1 test from ./.llm/tools/release/verify-canary-pair_test.ts
canary pair verifier parses an explicit repo and rejects malformed input ... ok (1ms)
running 2 tests from ./.llm/tools/run-deno-check_test.ts
runner fails when deno check excludes every explicit target despite exit 0 ... ok (63ms)
runner fails when its own selection is empty ... ok (56ms)
running 6 tests from ./.llm/tools/run-deno-fmt_test.ts
crashedBatches captures a batch that fails with no finding of its own ... ok (1ms)
crashedBatches does not treat an ordinary formatting finding as a crash ... ok (285µs)
a crashed batch is still reported when ANOTHER batch has a formatting finding ... ok (312µs)
a crashed batch is caught even when the only findings are ignored line endings ... ok (142µs)
crashedBatches tolerates the "No target files found." empty-batch exit ... ok (203µs)
formatFailedBatches strips ANSI and reports every crashed batch ... ok (198µs)
running 4 tests from ./.llm/tools/run-deno-lint_test.ts
runLint captures a batch that fails without lint occurrences ... ok (1ms)
runLint does not treat ordinary lint findings as batch failures ... ok (508µs)
runLint tolerates the empty-batch "No target files found." exit ... ok (279µs)
runLint reports every failing batch, not just the first ... ok (440µs)
running 8 tests from ./.llm/tools/validation/acceptance-evidence_test.ts
structured evidence treats em dashes in evidence as harmless data ... ok (1ms)
structured evidence supports one-based box-index fallback ... ok (255µs)
unmatched evidence fails with issue, named box, comparison, and repair ... ok (874µs)
missing evidence fails with the exact named box and action ... ok (156µs)
legacy evidence remains readable and emits a structured-format deprecation ... ok (349µs)
post-merge boxes are excluded from required evidence and stay unchecked ... ok (115µs)
stale verdict snapshot is detected after an issue edit ... ok (1ms)
umbrella reference without closing keyword is untouched ... ok (405µs)
running 10 tests from ./.llm/tools/validation/check-aspire-host-ports_test.ts
rejects the generated line that shipped #952 ... ok (979µs)
accepts a config-driven pin, which a resource opts into ... ok (372µs)
accepts the un-pinned shape ... ok (92µs)
rejects every unconditional entry-port write that shipped #952 ... ok (219µs)
accepts the conditional opt-in that replaced them ... ok (266µs)
only checks entry ports in the files that compose appsettings entries ... ok (79µs)
honours an explicit justification marker ... ok (83µs)
treats an empty justification as a failure ... ok (54µs)
rejects a pinned host port in a generated appsettings file ... ok (209µs)
does not descend into generated runtime state ... ok (6ms)
running 12 tests from ./.llm/tools/validation/check-close-gate_test.ts
close-gate resolves body, commit, and manual closing-reference sources ... ok (1ms)
manual closing link gates unchecked acceptance and removing the link passes ... ok (995µs)
body-keyword-only closing behavior is unchanged without external references ... ok (162µs)
closing-keyword prose inside acceptance-evidence fences is ignored ... ok (123µs)
close-gate retries transient GitHub failures before returning JSON ... ok (9ms)
close-gate falls back to public metadata after an authenticated 5xx ... ok (861µs)
close-gate does not retry non-transient GitHub failures ... ok (846µs)
close-gate keeps issue pass fail and override semantics with rebuilt findings ... ok (454µs)
close-gate fails unchecked PR DoD but ignores non-authoritative checklists ... ok (652µs)
close-gate pretty log carries rebuilt provenance and PR findings ... ok (272µs)
close-gate workflow guard accepts live reads and fires on frozen label regression ... ok (830µs)
post-merge close-gate box is excluded with a visible notice ... ok (156µs)
running 7 tests from ./.llm/tools/validation/check-netscript-jsr-specifiers_test.ts
embedded MCP documentation is allowed without weakening MCP source checks ... ok (11ms)
a pin from a previous release fails, naming the version the workspace ships ... ok (6ms)
a current pin naming a real export passes ... ok (5ms)
a subpath the package does not export fails even when the version is current ... ok (7ms)
range pins fail while template placeholders remain version-neutral ... ok (4ms)
an allowance marker exempts a versioned specifier from every rule ... ok (5ms)
a package outside the workspace is skipped rather than guessed at ... ok (3ms)
running 1 test from ./.llm/tools/validation/fresh-ui-quality_test.ts
frozen Fresh UI check rejects lock drift without rewriting the lock ... ok (799ms)
running 1 test from ./.llm/tools/validation/mirror-acceptance-evidence_test.ts
mirror retries once from a live body after a mid-air edit ... ok (5ms)
running 3 tests from ./.llm/tools/validation/redis-regression-gate_test.ts
Redis regression gate fails closed without a configured service URL ... ok (1ms)
Redis negative control removes exactly the #1075 serialization from current source ... ok (1ms)
Redis negative control refuses source that no longer matches #1075 exactly ... ok (391µs)
running 6 tests from ./docs/site/_plugins/check-source-format_test.ts
rejects raw newlines inside quoted Vento component arguments ... ok (9ms)
rejects Markdown headings in Vento pages without Markdown rendering ... ok (16ms)
accepts multiline component objects whose individual strings stay valid ... ok (1ms)
rejects literal Vento placeholders in any rendered page ... ok (3ms)
allows only the bounded CLI string-template documentation tokens ... ok (2ms)
rejects CLI documentation tokens beyond the bounded allowance ... ok (3ms)
running 4 tests from ./docs/site/reference/ai/examples_test.ts
Ollama reachability example ... ok (21ms)
Opt-in Rate-Limit Retries example ... ok (842µs)
Manage Token Budgets in Agent Loops example ... ok (528µs)
Citation-Ready RAG Retrieval example ... ok (385µs)
running 3 tests from ./docs/site/reference/contracts/examples_test.ts
contracts: page pagination (paginatedQuery) ... ok (1ms)
contracts: offset pagination (offsetPaginatedQuery) ... ok (349µs)
contracts: cursor pagination (cursorPaginatedQuery) ... ok (293µs)
running 1 test from ./docs/site/reference/cron/examples_test.ts
MemoryCronAdapter deterministic execution with FakeTime ... ok (8ms)
running 1 test from ./docs/site/reference/prisma-adapter-mysql/examples_test.ts
MySQL adapter example type-check ... ok (754µs)
running 1 test from ./docs/site/reference/queue/examples_test.ts
durable DLQ inspection and reprocessing worked example ... ok (5ms)
running 1 test from ./docs/site/reference/sagas/examples_test.ts
Saga testing with createTestSagaRuntime and controllable clock ... ok (1ms)
running 1 test from ./docs/site/reference/streams/examples_test.ts
stream socket-free testing with MemoryStreamProducer and telemetry facade ... ok (26ms)
running 1 test from ./docs/site/reference/triggers/examples_test.ts
Trigger operator, manual dispatch, test delivery, and lifecycle subscriptions ... ok (21ms)
running 1 test from ./docs/site/reference/workers/examples_test.ts
WorkflowExecutor infrastructure-free testing and idempotent resume ... ok (3ms)
running 14 tests from ./packages/ai/tests/agent_loop_test.ts
agent loop: single text turn transitions idle -> running -> done ... ok (2ms)
agent loop: records model spans through the injected telemetry port ... ok (546µs)
agent loop: tool call round-trips through the injected registry ... ok (695µs)
agent loop: a missing tool handler yields an error result but keeps looping ... ok (298µs)
agent loop: exceeding maxSteps settles in errored with AgentMaxStepsExceededError ... ok (895µs)
agent loop: an already-aborted signal settles in aborted immediately ... ok (1ms)
agent loop: stop() during a run unwinds to the aborted terminal state ... ok (332µs)
slidingWindowHistory: keeps leading system messages plus the most recent N ... ok (212µs)
slidingWindowHistory: returns the input unchanged when within the window ... ok (179µs)
tokenBudgetHistory: respects the default character budget and keeps newest messages ... ok (345µs)
tokenBudgetHistory: preserves all leading system messages ... ok (198µs)
tokenBudgetHistory: honors a custom estimator ... ok (193µs)
tokenBudgetHistory: zero budget retains only zero-cost newest messages ... ok (189µs)
tokenBudgetHistory: tiny budgets preserve system framing even when it exceeds budget ... ok (218µs)
running 6 tests from ./packages/ai/tests/anthropic_test.ts
anthropic: importing the subpath self-registers the provider ... ok (25ms)
anthropic: listModels surfaces the wrapped TanStack catalog ... ok (513µs)
anthropic: supports + getModel resolve a catalog model ... ok (229µs)
anthropic: getModel rejects an unknown model with AiError ... ok (795µs)
anthropic: end-to-end getModel("anthropic:<model>") resolves via the registry ... ok (301µs)
anthropic: createChatClient wraps the TanStack Anthropic text adapter (F-13 stop path) ... ok (251µs)
running 2 tests from ./packages/ai/tests/byok_test.ts
BYOK: each chat adapter resolves per-request connection values and static fallbacks ...
------- post-test output -------
{
  error: AuthenticationError: 401 {"error":{"message":"rejected"}}
      at APIError.generate (file:///home/codex/.cache/deno/npm/registry.npmjs.org/@anthropic-ai/sdk/0.97.1/src/core/error.ts:79:14)
      at Anthropic.makeStatusError (file:///home/codex/.cache/deno/npm/registry.npmjs.org/@anthropic-ai/sdk/0.97.1/src/client.ts:817:28)
      at Anthropic.makeRequest (file:///home/codex/.cache/deno/npm/registry.npmjs.org/@anthropic-ai/sdk/0.97.1/src/client.ts:1077:24)
      at async AnthropicTextAdapter.chatStream (file:///home/codex/.cache/deno/npm/registry.npmjs.org/@tanstack/ai-anthropic/0.15.13/src/adapters/text.ts:212:22)
      at async TextEngine.streamModelResponse (file:///home/codex/.cache/deno/npm/registry.npmjs.org/@tanstack/ai/0.39.0/src/activities/chat/index.ts:1030:22)
      at async TextEngine.run (file:///home/codex/.cache/deno/npm/registry.npmjs.org/@tanstack/ai/0.39.0/src/activities/chat/index.ts:826:13)
      at async runStreamingText (file:///home/codex/.cache/deno/npm/registry.npmjs.org/@tanstack/ai/0.39.0/src/activities/chat/index.ts:2759:22)
      at async Object.stream [90m(file:///home/codex/repos/ns006-f-b-dryrun/[39mpackages/ai/src/adapters/tanstack-chat-client.ts:182:26[90m)[39m
      at async runTurn [90m(file:///home/codex/repos/ns006-f-b-dryrun/[39mpackages/ai/tests/byok_test.ts:21:11[90m)[39m
      at async fn [90m(file:///home/codex/repos/ns006-f-b-dryrun/[39mpackages/ai/tests/byok_test.ts:50:7[90m)[39m {
    status: [33m401[39m,
    headers: Headers { [32m"content-type"[39m: [32m"application/json"[39m },
    requestID: [1mnull[22m,
    error: { error: { message: [32m"rejected"[39m } },
    type: [1mnull[22m
  },
  source: [32m"anthropic.chatStream"[39m
}
----- post-test output end -----
BYOK: each chat adapter resolves per-request connection values and static fallbacks ... ok (80ms)
BYOK: missing-configuration errors never echo request secrets ... ok (1ms)
running 13 tests from ./packages/ai/tests/generation_options_test.ts
anthropic: effort tier maps to output_config.effort (never deprecated budget_tokens) ... ok (24ms)
anthropic: off disables extended thinking; max tokens maps to max_tokens ... ok (2ms)
openai-compatible: effort tier maps to flat reasoning_effort ... ok (422µs)
openai-compatible: off omits reasoning_effort (no disable value on the wire) ... ok (224µs)
openrouter: per-turn options map to top-level reasoning + max_tokens ... ok (433µs)
openrouter: reasoning normalizer keeps the legacy tier shape and disables on off ... ok (188µs)
ollama: reasoningEffort is a no-op; only max tokens maps through ... ok (239µs)
mergeModelOptions: later layers win and an all-empty merge is undefined ... ok (471µs)
per-call modelOptions: exact provider request shapes pass through ... ok (406µs)
per-call modelOptions override static options; omission is unchanged ... ok (208µs)
anthropic rejects deprecated enabled + budget_tokens with typed 400 error ... ok (672µs)
agent loop: a reasoning event surfaces as a distinct reasoning chunk ... ok (2ms)
probe: eis-chat per-message effort picker threads through shipped adapters ... ok (544µs)
running 11 tests from ./packages/ai/tests/mcp_test.ts
createMcpTransport selects stdio and Streamable-HTTP transports ... ok (667µs)
StreamableHttpMcpTransport applies none auth mode without credential headers ... ok (1ms)
StreamableHttpMcpTransport applies api-token auth headers from injected config ... ok (219µs)
StreamableHttpMcpTransport applies oauth bearer headers from injected config ... ok (178µs)
registerMcpTools adds tools on connect and removes them on stop ... ok (1ms)
McpTransportPool keys servers and prefixes remote tool names ... ok (557µs)
McpTransportPool keeps transports warm across turns ... ok (453µs)
McpTransportPool extracts ui resources as plain resource and src data ... ok (274µs)
createMcpTransportPool builds pooled transports from config ... ok (641µs)
Streamable-HTTP reconnect backs off and resurfaces tools without duplicates ... ok (1ms)
stop aborts in-flight connect work and moves to closed ... ok (1ms)
running 10 tests from ./packages/ai/tests/ollama_test.ts
ollama: importing the subpath self-registers the provider ... ok (17ms)
ollama: listModels/supports/getModel reflect the configured models ... ok (498µs)
ollama: getModel rejects an unknown model when models are configured ... ok (834µs)
ollama: default host is the local daemon address ... ok (254µs)
ollama: createChatClient wraps the TanStack client with no reasoning options ... ok (414µs)
ollama: checkReachable probes GET {host}/api/tags and reports reachable ... ok (10ms)
ollama: checkReachable reports a non-2xx status as unreachable with detail ... ok (800µs)
ollama: checkReachable degrades (does not throw) when the host is down ... ok (420µs)
ollama: a custom ReachabilityPort overrides the default probe ... ok (316µs)
HttpReachabilityAdapter: probes a custom path ... ok (483µs)
running 6 tests from ./packages/ai/tests/openai_compatible_test.ts
openai-compatible: importing the subpath self-registers the provider ... ok (19ms)
openai-compatible: listModels/supports/getModel reflect the configured models ... ok (412µs)
openai-compatible: getModel rejects an unknown model when models are configured ... ok (484µs)
openai-compatible: unconfigured models list is optimistic (endpoint owns its catalog) ... ok (233µs)
openai-compatible: createChatClient wraps the TanStack client (F-13 stop path) ... ok (154µs)
openai-compatible: an unconfigured client can receive connection values per request ... ok (281µs)
running 5 tests from ./packages/ai/tests/openai_embeddings_test.ts
openai-embeddings: importing the subpath self-registers the provider ... ok (808µs)
openai-embeddings: embed shapes request and maps response in input order ... ok (7ms)
openai-embeddings: provider error maps to AiError ... ok (1ms)
openai-embeddings: malformed embedding response rejects ... ok (240µs)
openai-embeddings: missing api key rejects before fetch ... ok (712µs)
running 5 tests from ./packages/ai/tests/openai_vision_test.ts
openai-vision: provider-family subpath registers a dedicated vision provider ... ok (24ms)
openai-vision: URL source request shape and usage propagation ... ok (10ms)
openai-vision: base64 source becomes a MIME data URL ... ok (494µs)
openai-vision: provider errors map to AiError ... ok (1ms)
vision: unconfigured default still throws the typed error ... ok (733µs)
running 9 tests from ./packages/ai/tests/openrouter_test.ts
openrouter: importing the subpath self-registers the provider ... ok (24ms)
openrouter: listModels/supports/getModel reflect the configured models ... ok (540µs)
openrouter: getModel rejects an unknown model when models are configured ... ok (737µs)
openrouter: unconfigured models list is optimistic (OpenRouter owns its catalog) ... ok (290µs)
openrouter: reasoning normalization emits the top-level reasoning.effort shape ... ok (308µs)
openrouter: createChatClient wraps the TanStack client (F-13 stop path) ... ok (207µs)
openrouter: createChatClient defers key resolution so a request can supply it ... ok (171µs)
openrouter: createChatClient resolves the key from OPENROUTER_API_KEY env ... ok (203µs)
openrouter: default base URL is the OpenRouter endpoint ... ok (109µs)
running 5 tests from ./packages/ai/tests/prompt_test.ts
composeSystemPrompt orders by precedence with insertion-order ties ... ok (1ms)
composeSystemPrompt lets precedence override contribution order ... ok (166µs)
composeSystemPrompt drops blank sections and trims retained content ... ok (153µs)
composeSystemPrompt rejects duplicate names with a typed error ... ok (942µs)
PromptAssembler result fits the agent-loop system input unchanged ... ok (289µs)
running 4 tests from ./packages/ai/tests/provider_isolation_test.ts
bundle isolation: importing @netscript/ai/anthropic registers exactly one provider ... ok (190ms)
bundle isolation: importing @netscript/ai/openai-compatible registers exactly one provider ... ok (178ms)
bundle isolation: importing @netscript/ai/openrouter registers exactly one provider ... ok (168ms)
bundle isolation: importing @netscript/ai/ollama registers exactly one provider ... ok (168ms)
running 6 tests from ./packages/ai/tests/provider_retry_test.ts
embedding retry honors Retry-After before succeeding ... ok (3ms)
full-jitter exponential backoff stays within each attempt cap ... ok (548µs)
abort during backoff stops before another provider attempt ... ok (1ms)
exhausted retries throw typed AiRateLimitError with attempt count ... ok (853µs)
unwrapped providers retain the default no-retry behavior ... ok (277µs)
chat retries before output but never replays a partial stream ... ok (1ms)
running 4 tests from ./packages/ai/tests/registry_test.ts
model registry: registered provider resolves via getModelProvider ... ok (674µs)
model registry: getModel resolves a "<provider>:<model>" ref end-to-end ... ok (224µs)
model registry: getModelProvider throws ModelProviderNotFoundError when unregistered ... ok (508µs)
parseModelRef: rejects a malformed ref with InvalidModelRefError ... ok (314µs)
running 7 tests from ./packages/ai/tests/retriever_test.ts
retrieves vector-only matches with vector tags ... ok (2ms)
retrieves keyword-only matches without an embedding provider ... ok (447µs)
fuses overlapping channels once and tags the result hybrid ... ok (298µs)
title boost breaks otherwise equal keyword ranks ... ok (162µs)
preserves citation-ready provenance shape ... ok (526µs)
bounds results by k and treats non-positive k as empty ... ok (320µs)
falls back to keyword retrieval when query embedding fails ... ok (678µs)
running 6 tests from ./packages/ai/tests/runtime_test.ts
createAiRuntime: defaults every unspecified port to its no-op/throwing default ... ok (1ms)
createAiRuntime: injected telemetry port is used verbatim ... ok (313µs)
createAiRuntime: unconfigured embedding port rejects with AiNotConfiguredError ... ok (529µs)
createAiRuntime: unconfigured agent loop rejects when iterated ... ok (172µs)
createAiRuntime: getModelProvider without id or default throws AiNotConfiguredError ... ok (339µs)
getAiRuntime: reuses and resets the process singleton ... ok (350µs)
running 5 tests from ./packages/ai/tests/skills_test.ts
parseSkillMarkdown parses blessed frontmatter and body ... ok (1ms)
parseSkillMarkdown rejects missing frontmatter, malformed tags, and empty body ... ok (1ms)
loader preserves progressive disclosure and matches tags without embeddings ... ok (669µs)
semantic-only and combined matching use the injected provider ... ok (650µs)
semantic matching degrades to tag-only without a provider ... ok (183µs)
running 6 tests from ./packages/ai/tests/tools_test.ts
defineAiTool().server(): valid input runs the handler and returns typed output ... ok (812µs)
defineAiTool().server(): rejects invalid input BEFORE the handler runs ... ok (337µs)
createToolRegistry: dispatch throws ToolNotFoundError for an unregistered name ... ok (380µs)
createToolRegistry: registered server tool dispatches with validated input ... ok (381µs)
render_ui descriptor round-trips through registration + dispatch WITHOUT a live renderer ... ok (378µs)
createToolRegistry satisfies ToolRegistryPort: definitions are visible + handler-bridged ... ok (266µs)
running 5 tests from ./packages/ai/tests/vector_memory_test.ts
vector memory ranks by cosine relevance and honors k ... ok (1ms)
vector memory returns empty for an empty store without embedding ... ok (179µs)
vector memory recall fails soft when embeddings fail ... ok (307µs)
recall helper preserves load fallback when recall is absent ... ok (360µs)
recall helper never lets a recall error break the turn ... ok (602µs)
running 2 tests from ./packages/aspire/tests/_fixtures/readme-examples_test.ts
README composition example creates an inspectable resource graph ... ok (781µs)
public aggregate exports composeAppHost and schema generator ... ok (3ms)
running 2 tests from ./packages/aspire/tests/adapters/aspire-typescript-builder_test.ts
AspireTypeScriptBuilder records resources and references as operations ... ok (1ms)
resolveEnvSource resolves literals, secrets, resources, and raw strings ... ok (214µs)
running 3 tests from ./packages/aspire/tests/application/compose-apphost_test.ts
composeAppHost registers plugin contributions and returns resources ... ok (1ms)
composeAppHost skips plugins without Aspire contributions ... ok (439µs)
createPortAllocator reuses assigned ports before allocating new ones ... ok (240µs)
running 1 test from ./packages/aspire/tests/config_test.ts
config ...
  parseAppSettings: parses real appsettings.json ... ok (9ms)
  parseAppSettings: resolves default workdirs ... ok (1ms)
  parseAppSettings: parses apps correctly ... ok (1ms)
  AppTypeSchema: accepts desktop as the fourth app type ... ok (1ms)
  AppEntrySchema: preserves optional desktop enablement ... ok (0ms)
  AppEntrySchema: preserves the desktop packaging task hook ... ok (0ms)
  parseAppSettings: parses plugins correctly ... ok (1ms)
  PluginEntrySchema: preserves configured environment ... ok (1ms)
  ServiceEntrySchema: preserves configured environment (#1447) ... ok (0ms)
  ServiceEntrySchema: keeps the deprecated Env alias (#1447) ... ok (0ms)
  PluginEntrySchema: keeps the deprecated Env alias (#1447) ... ok (0ms)
  parseAppSettings: rejects a non-string environment value (#1447) ... ok (0ms)
  AppSettingsSchema: preserves saga store metadata ... ok (1ms)
  AppSettingsSchema: preserves host-side Aspire parameters ... ok (1ms)
  parseAppSettings: parses background processors ... ok (1ms)
  parseAppSettings: parses databases ... ok (1ms)
  parseAppSettings: parses cache ... ok (1ms)
  AppSettingsSchema: accepts Deno KV cache entries ... ok (0ms)
  CacheModeSchema: accepts all five modes ... ok (0ms)
  CacheModeSchema: rejects unknown mode ... ok (1ms)
  CacheEntrySchema: accepts Executable mode with ToolVersion ... ok (0ms)
  CacheEntrySchema: defaults Engine=Garnet, Mode=Container ... ok (0ms)
  parseAppSettings: warns on invalid engine×mode combos ... ok (8ms)
  parseAppSettings: no matrix warning for valid combos ... ok (2ms)
  parseAppSettings: parses tools ... ok (2ms)
  parseAppSettings: disabled entries preserved ... ok (1ms)
  parseAppSettings: OTEL defaults filled ... ok (1ms)
  parseAppSettings: Deno defaults filled ... ok (1ms)
  AppSettingsSchema: rejects missing Name ... ok (1ms)
  ServiceEntrySchema: accepts a service that pins no host port ... ok (1ms)
  ServiceEntrySchema: accepts HostPort and the deprecated Port alias ... ok (0ms)
  ServiceEntrySchema: preserves health probe configuration ... ok (1ms)
  PluginEntrySchema: preserves health probe configuration ... ok (0ms)
  ServiceEntrySchema: fills defaults ... ok (0ms)
  NetScriptConfigSchema: fills section defaults ... ok (1ms)
  parseAppSettings: strict mode throws on bad cross-refs ... ok (2ms)
  parseAppSettings: non-strict mode returns warnings ... ok (1ms)
  parseAppSettings: service references validated ... ok (1ms)
config ... ok (71ms)
running 6 tests from ./packages/aspire/tests/helpers_test.ts
helpers/telemetry ...
  buildOtelEnvVars: denoApp mode returns 3 vars ... ok (1ms)
  buildOtelEnvVars: executable mode returns 10 vars ... ok (1ms)
  buildOtelEnvVars: denoTask mode returns 10 vars ... ok (0ms)
  buildOtelEnvVars: custom endpoint ... ok (0ms)
helpers/telemetry ... ok (5ms)
helpers/constants: dashboard env vars match Aspire dashboard contract ... ok (129µs)
helpers/vite ...
  buildViteEnvVarName: simple name ... ok (0ms)
  buildViteEnvVarName: hyphenated name ... ok (0ms)
  buildViteEnvVarName: custom endpoint name ... ok (1ms)
  buildViteEnvVarName: normalizes every identifier segment ... ok (0ms)
helpers/vite ... ok (3ms)
helpers/permissions ...
  resolvePermissions: returns defaults when no entry perms ... ok (0ms)
  resolvePermissions: entry overrides defaults ... ok (0ms)
  resolvePermissions: appends watch flag ... ok (0ms)
  resolvePermissions: default watch flag is --watch-hmr ... ok (0ms)
  resolvePermissions: no watch flag when disabled ... ok (0ms)
helpers/permissions ... ok (4ms)
helpers/paths ...
  resolveWorkspacePath: navigates up two levels ... ok (1ms)
  resolveWorkdir: default from section + key ... ok (1ms)
  resolveWorkdir: explicit overrides default ... ok (0ms)
  resolveDataPath: uses provided path ... ok (0ms)
  resolveDataPath: defaults to .data/{name} ... ok (0ms)
helpers/paths ... ok (4ms)
helpers/references ...
  extractServiceReferences: deduplicates service refs ... ok (0ms)
  extractServiceReferences: empty when no refs ... ok (0ms)
  extractPluginReferences: returns plugin refs ... ok (0ms)
  extractPluginReferences: empty when none ... ok (1ms)
  extractDependencies: extracts flags ... ok (0ms)
  extractDependencies: defaults to false ... ok (0ms)
helpers/references ... ok (2ms)
running 1 test from ./packages/aspire/tests/runtime/aspire-ns-plugin-contribution_test.ts
AspireNSPluginContribution: default hooks return empty declarations ... ok (837µs)
running 2 tests from ./packages/aspire/tests/runtime/contribution-registry_test.ts
ContributionRegistry: resolves registered contributions by plugin name ... ok (765µs)
ContributionRegistry: rejects duplicate plugin names ... ok (456µs)
running 1 test from ./packages/aspire/tests/schema_test.ts
schema ...
  generates valid JSON Schema draft-7 ... ok (3ms)
  allOf wraps ASP.NET Core schema ref ... ok (2ms)
  contains NetScript properties in generated schema ... ok (1ms)
  contains host-side Aspire parameters in generated schema ... ok (3ms)
  enum schemas produce correct values ... ok (1ms)
schema ... ok (15ms)
running 1 test from ./packages/aspire/tests/types_test.ts
types ...
  z.infer shapes match expected structure ... ok (5ms)
  narrowed schema provides literal key types ... ok (4ms)
  ServiceEntry type matches schema output ... ok (1ms)
  AppType and AppEntry expose the desktop contract ... ok (0ms)
  generic utilities resolve correctly at type level ... ok (0ms)
types ... ok (13ms)
running 1 test from ./packages/auth-better-auth/tests/backend-error-interop_test.ts
backend unsupported-operation errors share one runtime class ... ok (20ms)
running 1 test from ./packages/auth-better-auth/tests/better-auth-node-compat_test.ts
better-auth resolves under Deno node compatibility ...
------- post-test output -------
2026-08-12T08:24:30.570Z WARN [Better Auth]: [better-auth] Warning: your BETTER_AUTH_SECRET appears low-entropy. Use a randomly generated secret for production.
----- post-test output end -----
better-auth resolves under Deno node compatibility ... ok (29ms)
running 10 tests from ./packages/auth-better-auth/tests/better-auth_test.ts
createBetterAuthAuthenticator maps getSession to Principal ... ok (16ms)
createBetterAuthAuthenticator rejects missing sessions ... ok (2ms)
createBetterAuthAuthenticator emits refreshed cookies from better-auth headers ... ok (944µs)
createNetscriptBetterAuth wraps better-auth prismaAdapter over a consumer Prisma client ...
------- post-test output -------
2026-08-12T08:24:30.964Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
2026-08-12T08:24:30.964Z WARN [Better Auth]: [better-auth] Warning: your BETTER_AUTH_SECRET appears low-entropy. Use a randomly generated secret for production.
----- post-test output end -----
createNetscriptBetterAuth wraps better-auth prismaAdapter over a consumer Prisma client ... ok (12ms)
configureNetscriptBetterAuthOptions forwards dedicated plugins ... ok (269µs)
configureNetscriptBetterAuthOptions defaults to namespaced Prisma model names ... ok (215µs)
configureNetscriptBetterAuthOptions lets escape-hatch model names override defaults ... ok (182µs)
configureNetscriptBetterAuthOptions forwards escape-hatch options under NetScript database ... ok (291µs)
createBetterAuthBackend exposes AuthBackendPort provider and session ports ... ok (2ms)
createBetterAuthBackend throws typed errors for unsupported managed-session operations ... ok (884µs)
running 9 tests from ./packages/auth-kv-oauth/tests/auth_kv_oauth_test.ts
provider presets normalize descriptors and enforce client auth shape ... ok (19ms)
crypto seals and opens token payloads with a key id prefix ... ok (8ms)
cookies use __Host, HttpOnly, Secure and proxy-derived HTTPS ... ok (4ms)
KV store round-trips sessions, consumes txns once, and CAS-rotates ... ok (5ms)
flow rejects open redirects before creating an authorization redirect ... ok (2ms)
flow performs sign-in and callback with single-use state ... ok (7ms)
backend implements providers, sessions, crypto, principal mapping, and authenticate ... ok (2ms)
backend refreshes near-expiry sessions and detects refresh-token reuse ... ok (4ms)
backend reports token endpoint refresh failures as typed errors ... ok (3ms)
running 2 tests from ./packages/auth-workos/tests/workos-access-token_test.ts
createWorkosAccessTokenAuthenticator verifies a WorkOS bearer token via JWKS ... ok (197ms)
createWorkosAccessTokenAuthenticator rejects missing and invalid bearer tokens ... ok (1ms)
running 5 tests from ./packages/auth-workos/tests/workos-authenticator_test.ts
createWorkosAuthenticator maps an authenticated WorkOS session to Principal ... ok (26ms)
createWorkosAuthenticator rejects missing and invalid sealed sessions ... ok (258µs)
createWorkosAuthenticator emits Set-Cookie when WorkOS refresh returns a sealed session ... ok (555µs)
createWorkosBackend exposes AuthBackendPort provider and session ports ... ok (3ms)
createWorkosBackend throws typed errors for unsupported managed-session operations ... ok (1ms)
running 1 test from ./packages/auth-workos/tests/workos-node-compat_test.ts
WorkOS sealed-session SDK path resolves under Deno node compatibility ... ok (1ms)
running 4 tests from ./packages/bench/tests/bench-runner_test.ts
turns_to_green is the 1-based turn where the suite first goes green ... ok (2ms)
never green yields null turns_to_green and best partial pass rate ... ok (355µs)
turn cap halts the loop before the driver is exhausted ... ok (494µs)
cost accumulates across turns and is priced from the pinned table ... ok (276µs)
running 2 tests from ./packages/bench/tests/deno-http_test.ts
deno-http runner runs the frozen suite green against a compliant service ... ok (2ms)
deno-http runner reports failures when the service violates the contract ... ok (932µs)
running 2 tests from ./packages/bench/tests/json-reporter_test.ts
JSON reporter round-trips a run summary losslessly ... ok (1ms)
markdown reporter renders a table row per attempt and flags provisional ... ok (730µs)
running 2 tests from ./packages/bench/tests/local-workspace_test.ts
sandbox seeds agent-visible files but excludes tests/ and reference/ ... ok (17ms)
dispose is idempotent and tolerant of a missing dir ... ok (1ms)
running 7 tests from ./packages/bench/tests/normalizer_test.ts
clamp bounds values into range ... ok (1ms)
ascending anchor maps worst->0, best->1, midpoint->0.5 ... ok (218µs)
descending anchor (turns 80->5) maps best->1, worst->0 ... ok (229µs)
descending anchor clamps beyond best and worst ... ok (329µs)
wall anchor 900->60 endpoints ... ok (192µs)
degenerate anchor (worst === best) yields 0 ... ok (167µs)
normalizeMetric treats null turns_to_green as 0 ... ok (137µs)
running 4 tests from ./packages/bench/tests/scorer_test.ts
perfect metrics score the sum of scored weights (0.80 with reserve) ... ok (1ms)
worst metrics score 0 ... ok (1ms)
lines_of_code is report-only with weight 0 and no contribution ... ok (441µs)
each component contribution equals normalized * weight ... ok (187µs)
running 1 test from ./packages/bench/tests/task-catalog_test.ts
task catalog registers t1+t2 with loadable non-empty matching suites ... ok (26ms)
running 1 test from ./packages/cli/module_import_side_effect_test.ts
public module imports do not execute the CLI runner ... ok (444ms)
running 2 tests from ./packages/cli/scaffolding_test.ts
plugin scaffolding plans and writes plugin-owned templates ... ok (3ms)
plugin scaffolding skips existing files unless overwrite is enabled ... ok (794µs)
running 4 tests from ./packages/cli/src/kernel/adapters/aspire/apphost-doctor-inspector_test.ts
AppHost doctor inspector uses ps truth before describe ... ok (1ms)
AppHost doctor inspector reports unavailable when Aspire cannot execute ... ok (1ms)
AppHost doctor inspector preserves genuine Aspire command failures ... ok (763µs)
AppHost doctor inspector returns named resource state from the matching AppHost ... ok (441µs)
running 8 tests from ./packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target_test.ts
kubernetes adapter declares an Aspire-owned operation subset ... ok (1ms)
plan/emit validate AppHost markers and delegate without platform --environment ... ok (825µs)
up uses configured AppHost and outputPath from request config ... ok (293µs)
AppHost validation rejects a mismatched platform before invoking Aspire ... ok (570µs)
cloud-run up builds, pushes, and deploys the configured image ... ok (768µs)
cloud-run down deletes the configured service ... ok (397µs)
cloud-run requires registry and imageName config ... ok (719µs)
a non-zero external CLI exit surfaces stderr detail ... ok (439µs)
running 8 tests from ./packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target_test.ts
compose adapter declares the supported subset and omits rollback/secrets ... ok (1ms)
plan/emit delegate to `aspire publish --output-path` (authors no YAML) ... ok (524µs)
plan forwards Aspire environment and non-interactive flags ... ok (250µs)
compose `up` self-hosts via `docker compose up -d` on the emitted file ... ok (317µs)
docker `up` delegates the apply to `aspire deploy` ... ok (299µs)
docker `up` can clear Aspire deployment cache for CI ... ok (375µs)
down/status/logs shell `docker compose` against the emitted project ... ok (706µs)
a non-zero exit surfaces as a thrown error with stderr detail ... ok (869µs)
running 4 tests from ./packages/cli/src/kernel/adapters/config/deploy-config-resolvers.test.ts
resolveDenoDeployTarget: empty config defaults prod to false with no fields ... ok (1ms)
resolveDenoDeployTarget: reads deploy.targets[deno-deploy] from config ... ok (258µs)
resolveDenoDeployTarget: CLI flag overrides win over config ... ok (205µs)
resolveDenoDeployTarget: flags alone work with no config section ... ok (159µs)
running 7 tests from ./packages/cli/src/kernel/adapters/config/deploy-config-resolvers_test.ts
resolveLinuxDeploy applies Linux-sensible defaults ... ok (802µs)
resolveLinuxDeploy honors user overrides from deploy.targets.linux ... ok (219µs)
resolveWindowsDeploy applies Windows-sensible defaults ... ok (196µs)
resolveWindowsDeploy honors user overrides from deploy.targets.windows ... ok (123µs)
resolveDeployBase defaults the activation/secrets/otel convention blocks (U1–U3) ... ok (167µs)
activation.strategy defaults per-OS (symlink on Linux, dir-swap on Windows) ... ok (102µs)
resolveDeployBase honors activation/secrets/otel overrides ... ok (176µs)
running 9 tests from ./packages/cli/src/kernel/adapters/config/plugin-registry.test.ts
loadRegisteredPlugins returns normalized background processor metadata ... ok (63ms)
loadRegisteredPlugins loads plugin specs from netscript config when omitted ... ok (167ms)
loadRegisteredPlugins preserves registry output shape from explicit config specs ... ok (18ms)
loadRegisteredPlugins resolves the generated AI configured module ... ok (46ms)
loadRegisteredPluginMetadata reads scaffold manifests without importing plugin modules ... ok (20ms)
loadRegisteredPluginMetadata omits service metadata for a service-less manifest ... ok (17ms)
loadRegisteredPluginMetadata derives identity from the configured module directory ... ok (2ms)
loadRegisteredPluginMetadata isolates malformed scaffold metadata per plugin ... ok (3ms)
loadRegisteredPluginMetadata falls back when userland scaffold manifest is absent ... ok (18ms)
running 4 tests from ./packages/cli/src/kernel/adapters/config/project-config-loader_test.ts
loadProjectConfig runs the child loader under the project deno.json ... ok (152ms)
loadProjectConfig preserves JavaScript config file resolution ... ok (152ms)
loadProjectConfig reports a missing config from the child process ... ok (140ms)
loadProjectConfig parses stdout without reading stderr noise ... ok (827µs)
running 2 tests from ./packages/cli/src/kernel/adapters/contracts/contract-source_test.ts
contract source promotion renames versioned symbols and prose ... ok (914µs)
contract route append round-trips through structured inspection ... ok (2ms)
running 1 test from ./packages/cli/src/kernel/adapters/database/apphost-lifecycle-lock_test.ts
FileAppHostLifecycleLock reclaims a lock held by a dead process ... ok (11ms)
running 3 tests from ./packages/cli/src/kernel/adapters/database/operation-runner-helpers_test.ts
isNoRunningAppHostOutput accepts the documented line with allowed prefixes ... ok (1ms)
isNoRunningAppHostOutput rejects a failure that only quotes the phrase ... ok (141µs)
db migrate forwards artifact name and terminal identity to the generated task ... ok (217µs)
running 1 test from ./packages/cli/src/kernel/adapters/database/operation-runner_test.ts
DbOperationRunner ...
  uses the resident explicit-start resource and never starts a second AppHost ...
------- post-test output -------
Starting db migrate for postgres...
migration complete
db migrate completed successfully.
----- post-test output end -----
  uses the resident explicit-start resource and never starts a second AppHost ... ok (2ms)
  fails closed when the resident AppHost is absent without starting a resource ...
------- post-test output -------
Starting db seed for postgres...
----- post-test output end -----
  fails closed when the resident AppHost is absent without starting a resource ... ok (1ms)
  stops the resident operation resource when the database task fails ...
------- post-test output -------
Starting db status for postgres...
failed
db status failed with exit code 7.
----- post-test output end -----
  stops the resident operation resource when the database task fails ... ok (1ms)
  stops the resource when a signal aborts polling ...
------- post-test output -------
Starting db seed for postgres...
----- post-test output end -----
  stops the resource when a signal aborts polling ... ok (1ms)
  keeps studio attached to the resident AppHost ... ok (0ms)
DbOperationRunner ... ok (11ms)
running 1 test from ./packages/cli/src/kernel/adapters/database/scaffolder_test.ts
DatabaseScaffolder ...
  renders database script wrappers with concrete schema and generated paths ... ok (6ms)
  derives unique container database names for added engines ... ok (1ms)
DatabaseScaffolder ... ok (8ms)
running 1 test from ./packages/cli/src/kernel/adapters/database/workspace-mutator_remove_test.ts
database removal repairs primary and tool references ... ok (1ms)
running 1 test from ./packages/cli/src/kernel/adapters/database/workspace-resolver_test.ts
DbWorkspaceResolver ...
  discovers configured databases from appsettings.json ... ok (2ms)
  resolves all enabled databases and skips disabled entries ... ok (1ms)
  maps config engine labels to CLI engine identifiers ... ok (0ms)
  rejects unknown database targets ... ok (1ms)
DbWorkspaceResolver ... ok (7ms)
running 5 tests from ./packages/cli/src/kernel/adapters/deno-deploy/deno-deploy-cli_test.ts
buildDeployArgs: preview push maps only provided flags ... ok (722µs)
buildDeployArgs: production push maps --prod/--org/--app/--env-file/entrypoint in order ... ok (282µs)
buildLogsArgs/buildDeleteArgs/buildStatusArgs: map subcommand + target flags ... ok (293µs)
DenoDeployCliAdapter: shells `deno` with deploy argv from the project root ... ok (311µs)
DenoDeployCliAdapter: propagates a non-zero exit code ... ok (132µs)
running 1 test from ./packages/cli/src/kernel/adapters/deploy/compile/compile-platform_test.ts
compile-platform ...
  defaultCompileTarget returns the host triple ... ok (0ms)
  binaryExtensionForTarget appends .exe for windows triples ... ok (0ms)
  binaryExtensionForTarget yields no extension for non-windows triples ... ok (0ms)
compile-platform ... ok (3ms)
running 3 tests from ./packages/cli/src/kernel/adapters/deploy/compile/compile_test.ts
loadDeployConfig resolves unified background processors from appsettings and registry ... ok (658ms)
extractCompileTargets emits metadata-driven background processor targets ... ok (589µs)
loadDeployConfig maps service references to compile target dependencies ... ok (275µs)
running 1 test from ./packages/cli/src/kernel/adapters/deploy/runtime-detect_test.ts
deploy runtime-detect ...
  honors an explicit OS over the host ... ok (0ms)
  falls back to the host OS when none is given ... ok (0ms)
  builds OS-appropriate full service names ... ok (0ms)
  builds OS-appropriate config file names ... ok (1ms)
  joins config paths per OS ... ok (1ms)
deploy runtime-detect ... ok (6ms)
running 5 tests from ./packages/cli/src/kernel/adapters/health/fetch-health-probe_test.ts
resolveProbeUrl derives http://host:port/path when no url is given ... ok (718µs)
resolveProbeUrl prefers an explicit url over derived host/port/path ... ok (87µs)
probe is healthy when the observed status equals expectStatus ... ok (9ms)
probe is unhealthy when the status differs from expectStatus ... ok (433µs)
a thrown fetch (timeout/refused) is a non-healthy outcome, not an error ... ok (673µs)
running 2 tests from ./packages/cli/src/kernel/adapters/linux/systemd/systemd-environment_test.ts
withObservabilityEnvironment merges the core OTEL env over a base record ... ok (1ms)
renderSystemdUnit emits the merged OTEL vars as Environment= directives ... ok (571µs)
running 2 tests from ./packages/cli/src/kernel/adapters/linux/systemd/systemd_test.ts
renderSystemdUnit ...
  renders a well-formed .service unit with defaults ... ok (1ms)
  emits User/Group/RuntimeDirectory only when provided ... ok (0ms)
  escapes quotes and backslashes in Environment values ... ok (1ms)
  honors overrides for service type, restart, and wantedBy ... ok (0ms)
renderSystemdUnit ... ok (6ms)
systemd command builders ...
  builds the full unit name with the default prefix ... ok (0ms)
  builds lifecycle args ... ok (0ms)
  builds enable args with and without --force ... ok (0ms)
  builds disable and daemon-reload args ... ok (1ms)
  builds journalctl args ... ok (0ms)
systemd command builders ... ok (5ms)
running 9 tests from ./packages/cli/src/kernel/adapters/plugin/db-integration_test.ts
copyPluginSchemaToRootDb copies plugin schema into active root DB schema tree ... ok (4ms)
copyPluginSchemaToRootDb skips non-DB plugins ... ok (317µs)
copyPluginSchemasToRootDb copies production plugin schema filenames ... ok (518µs)
copyPluginSchemasToRootDb prefers package fragments over copied placeholders ... ok (653µs)
copyPluginSchemasToRootDb keeps the bare schema filename rule for package fragments ... ok (212µs)
copyPluginSchemasToRootDb validates declared schemas without widening no-DB behavior ... ok (658µs)
copyPluginSchemasToRootDb rejects a dependency fragment that collides with a base declaration ... ok (730µs)
copyPluginSchemasToRootDb deduplicates an identical base declaration ... ok (438µs)
copyPluginSchemasToRootDb reinstalls a changed fragment without self-collision ... ok (241µs)
running 5 tests from ./packages/cli/src/kernel/adapters/plugin/plugin-reference-reconciler_test.ts
reconcilePluginReferences omits dangling dependencies and adds every producer edge ... ok (13ms)
reconcilePluginReferences maps canonical dependencies to renamed installed instances ... ok (994µs)
reconcilePluginReferences uses configured modules and accepts service-less declarations ... ok (2ms)
reconcilePluginReferences wires a fixture third-party plugin to declared services and apps ... ok (2ms)
third-party linking converges when consumers arrive later and cleans up after uninstall ... ok (2ms)
running 2 tests from ./packages/cli/src/kernel/adapters/plugin/scaffolder_test.ts
PluginScaffolder includes sample jobs and tasks by default ... ok (7ms)
PluginScaffolder skips sample files and manifest contributions when disabled ... ok (1ms)
running 19 tests from ./packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts
PluginWorkspaceMutator ensures plugins root and plugin packages are workspace members ... ok (2ms)
PluginWorkspaceMutator injects first-party plugin core imports into root deno config ... ok (2ms)
root-level scaffold runtime imports resolve in both package-source modes ... ok (7ms)
PluginWorkspaceMutator registers background plugins with companion API service ... ok (948µs)
PluginWorkspaceMutator omits appsettings entries for service-less plugins ... ok (477µs)
PluginWorkspaceMutator honors absolute local source service entrypoints ... ok (555µs)
PluginWorkspaceMutator keeps package id separate from the instance name ... ok (331µs)
PluginWorkspaceMutator writes saga store backend appsettings for saga plugins ... ok (423µs)
PluginWorkspaceMutator provisions shared Garnet cache when missing ... ok (435µs)
PluginWorkspaceMutator reuses existing shared cache entry ... ok (280µs)
PluginWorkspaceMutator appends project-local plugin config specs ... ok (1ms)
PluginWorkspaceMutator registers generated plugin glue entrypoints ... ok (415µs)
PluginWorkspaceMutator rejects a missing configured plugin module ... ok (884µs)
PluginWorkspaceMutator removes exactly one plugin instance from netscript config ... ok (772µs)
PluginWorkspaceMutator removes generated root-level plugin glue declarations ... ok (352µs)
first-party control-plane modules are import-safe and preserve application barrels ... ok (12s)
first-party generated namespaces have complete imports in JSR and local-source modes ... ok (11ms)
PluginWorkspaceMutator writes no ai kind-source jsr pins into local-source projects ... ok (520µs)
PluginWorkspaceMutator rewrite map covers every @netscript/telemetry export subpath ... ok (943µs)
running 2 tests from ./packages/cli/src/kernel/adapters/runtime/file-system/deno-file-system_test.ts
copyFilePortable falls back to read/write when native copy is denied ... ok (1ms)
copyFilePortable rethrows non-permission copy failures ... ok (532µs)
running 2 tests from ./packages/cli/src/kernel/adapters/runtime/process/deno-process_test.ts
DenoProcess kills and awaits a child after the configured timeout ... ok (71ms)
DenoProcess can start a child with an empty inherited environment ... ok (65ms)
running 1 test from ./packages/cli/src/kernel/adapters/scaffold/tests/dry-run-fs_test.ts
DryRunFileSystemAdapter ...
  should record writeFile as write operation ... ok (1ms)
  should record createDir as mkdir operation ... ok (1ms)
  should record remove as remove operation ... ok (0ms)
  should record copy with src in content field ... ok (0ms)
  should record multiple operations in order ... ok (0ms)
  should NOT write files to the inner adapter ... ok (0ms)
  should NOT create directories in the inner adapter ... ok (0ms)
  exists() returns true for recorded write paths ... ok (0ms)
  exists() returns true for recorded mkdir paths ... ok (0ms)
  exists() delegates to inner for unknown paths ... ok (1ms)
  exists() returns false for truly absent paths ... ok (0ms)
  stat() returns isFile:true for recorded write paths ... ok (0ms)
  stat() returns isDirectory:true for recorded mkdir paths ... ok (0ms)
  stat() delegates to inner for real paths ... ok (0ms)
  readFile() returns content from recorded writes before inner adapter ... ok (0ms)
  readFile() delegates to inner adapter ... ok (0ms)
  readFile() throws if file not in inner ... ok (1ms)
  getOperations() returns copy not reference ... ok (0ms)
DryRunFileSystemAdapter ... ok (20ms)
running 1 test from ./packages/cli/src/kernel/adapters/scaffold/tests/fresh-adapter_test.ts
normalizeFreshOutput ...
  should remove known demo files that exist ... ok (2ms)
  should skip demo files that do not exist ... ok (1ms)
  should update deno.json with scoped name and exports ... ok (0ms)
  should handle missing deno.json gracefully ... ok (0ms)
normalizeFreshOutput ... ok (8ms)
running 2 tests from ./packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts
resolveNetScriptImports ...
  should keep direct scaffold package families aligned across modes ... ok (1ms)
  should resolve JSR mode imports ... ok (1ms)
  should resolve local mode imports with default base ... ok (0ms)
  should resolve local mode with custom base ... ok (0ms)
resolveNetScriptImports ... ok (8ms)
resolveNuGetReference ...
  should resolve JSR mode as package reference ... ok (0ms)
  should resolve local mode as project reference ... ok (0ms)
  should use custom path for local mode ... ok (0ms)
resolveNuGetReference ... ok (2ms)
running 1 test from ./packages/cli/src/kernel/adapters/scaffold/tests/scaffolder_test.ts
Scaffolder integration ...
  should scaffold a single file from template content ... ok (2ms)
  should write pre-rendered content directly ... ok (0ms)
  should skip existing files without overwrite ... ok (0ms)
  should overwrite existing files with overwrite flag ... ok (0ms)
  should scaffold directory tree from templates ... ok (1ms)
  should report skipped files in result ... ok (1ms)
  should create directories and report them ... ok (0ms)
  should check existence via the scaffolder ... ok (0ms)
Scaffolder integration ... ok (12ms)
running 2 tests from ./packages/cli/src/kernel/adapters/scaffold/tests/template-adapter_test.ts
renderTemplate ...
  should replace simple variables ... ok (1ms)
  should replace multiple variables ... ok (0ms)
  should apply camelCase pipe ... ok (1ms)
  should apply pascalCase pipe ... ok (0ms)
  should apply kebabCase pipe ... ok (0ms)
  should apply snakeCase pipe ... ok (0ms)
  should apply upperCase pipe ... ok (0ms)
  should apply lowerCase pipe ... ok (0ms)
  should handle whitespace in placeholders ... ok (0ms)
  should handle whitespace around pipe ... ok (0ms)
  should throw on undefined variable ... ok (1ms)
  should throw on unknown pipe ... ok (1ms)
  should leave non-template content unchanged ... ok (0ms)
renderTemplate ... ok (13ms)
StringTemplateAdapter ...
  should have engine name ... ok (0ms)
  should render template string ... ok (1ms)
  should render file from filesystem ... ok (1ms)
StringTemplateAdapter ... ok (3ms)
running 3 tests from ./packages/cli/src/kernel/adapters/scaffold/tests/workspace-writer_test.ts
addWorkspaceMember ...
  adds member and sorts alphabetically ... ok (1ms)
  throws if member already exists ... ok (1ms)
  normalizes backslashes in member path ... ok (1ms)
  normalizes member path without leading ./ ... ok (0ms)
addWorkspaceMember ... ok (6ms)
validateUniqueName ...
  accepts valid kebab-case names ... ok (1ms)
  validates resource names without workspace uniqueness checks ... ok (0ms)
  rejects invalid pattern — uppercase ... ok (1ms)
  rejects invalid pattern — starts with digit ... ok (0ms)
  rejects invalid pattern — special chars ... ok (0ms)
  rejects name exceeding max length ... ok (0ms)
  rejects reserved names ... ok (0ms)
  rejects names already in workspace ... ok (1ms)
validateUniqueName ... ok (6ms)
allocatePort ...
  returns preferred port when available ... ok (1ms)
  skips already used ports ... ok (1ms)
  throws when range is exhausted ... ok (1ms)
allocatePort ... ok (4ms)
running 6 tests from ./packages/cli/src/kernel/adapters/secrets/env-file-secrets-store_test.ts
put on POSIX writes content then chmod 0o600, no process invocation ... ok (1ms)
put on Windows writes content then applies owner+SYSTEM icacls ACL, no chmod ... ok (231µs)
Windows put without a ProcessPort rejects ... ok (421µs)
list parses persisted keys and ignores blanks and comments ... ok (249µs)
list returns empty when the secret file is absent ... ok (121µs)
clear removes the secret file ... ok (125µs)
running 1 test from ./packages/cli/src/kernel/adapters/service/client-scaffolder_test.ts
service client scaffolder mirrors the typed SDK and query template ... ok (3ms)
running 1 test from ./packages/cli/src/kernel/adapters/service/router-source_test.ts
service handler append binds through the generated typed contract router ... ok (2ms)
running 7 tests from ./packages/cli/src/kernel/adapters/service/scaffolder_test.ts
ServiceScaffolder creates a contract-bound service workspace ... ok (3ms)
shared contract scaffolder creates service contracts and aggregates v1 mod exports ... ok (1s)
PortAllocator assigns next available service port ... ok (652µs)
PortAllocator rejects out-of-range and duplicate requested ports ... ok (956µs)
ServiceWorkspaceResolver discovers configured services ... ok (651µs)
shared generateV1Mod supports multiple service names ... ok (186µs)
shared generateV1Mod supports one service name ... ok (180µs)
running 4 tests from ./packages/cli/src/kernel/adapters/templates/template-asset_test.ts
package asset adapters do not perform direct Deno.read template reads ... ok (2ms)
template asset adapter reads embedded content without hydration ... ok (403µs)
template asset adapter renders existing template pipes ... ok (823µs)
app and service templates emit lint-clean generated contracts ... ok (81µs)
running 1 test from ./packages/cli/src/kernel/adapters/windows/manifest/manifest-resolver_test.ts
buildManifestContext resolves executable bindings via manifest resource aliases ... ok (8ms)
running 2 tests from ./packages/cli/src/kernel/application/registries/template-registry_test.ts
TemplateRegistry manifest matches checked-in template assets ... ok (14ms)
TemplateRegistry reads registered template content ... ok (141µs)
running 8 tests from ./packages/cli/src/kernel/application/scaffold/orchestrate-init_test.ts
root and app scaffold bookkeeping share the project-boundary filename ... ok (748µs)
initNextSteps includes public database preparation steps for JSR init ... ok (515µs)
InMemoryScaffolder writes rendered files without a temp directory ... ok (672µs)
initNextSteps includes local database preparation steps for maintainer init ... ok (196µs)
initNextSteps tells no-Aspire Postgres users to self-provision ... ok (332µs)
initNextSteps points at the dashboard when Aspire assigns the service port ... ok (319µs)
initNextSteps prints a literal URL and an isolation warning for a pinned port ... ok (111µs)
initNextSteps prints a literal URL for a no-Aspire workspace ... ok (137µs)
running 7 tests from ./packages/cli/src/kernel/application/scaffold/plan-init_test.ts
scaffoldRoot emits CI/CD workflow templates for shipped deploy targets ... ok (29ms)
scaffoldRoot writes and bookkeeps a self-contained root tsconfig ... ok (1ms)
#966 scaffoldRoot keeps source appsettings tracked by git ... ok (826µs)
scaffoldRoot emits the Aspire CLI task runner only for Aspire workspaces ... ok (1ms)
scaffoldRoot always emits quality and npm runners with the Deno pin ... ok (2ms)
scaffoldRoot emits deploy workflow invocations accepted by the real deploy parser ...
------- post-test output -------
✓ compose plan ok
✓ docker up ok
deno-deploy up ok
deno-deploy up ok
Deployment artifacts generated.
----- post-test output end -----
scaffoldRoot emits deploy workflow invocations accepted by the real deploy parser ... ok (14ms)
scaffoldRoot omits Aspire-backed compose CI when --no-aspire is used ... ok (1ms)
running 2 tests from ./packages/cli/src/kernel/application/scaffold/support/format-generated-files_test.ts
generated-file formatting uses scaffold style and the exact file list ... ok (1ms)
generated-file formatting propagates formatter failures ... ok (711µs)
running 4 tests from ./packages/cli/src/kernel/application/scaffold/writers/write-app-files_test.ts
selected cache backend is carried into the generated app runtime ... ok (649µs)
cache registration import is omitted when cache is disabled ... ok (170µs)
app tsconfig is self-contained and Vite/Fresh compatible ... ok (526µs)
initial route references match the canonical generated leaf shape ... ok (214µs)
running 5 tests from ./packages/cli/src/kernel/application/ui/registry-deno-json_test.ts
a subpath dependency maps the package root so the subpath import resolves ... ok (2ms)
two subpaths of one package collapse to a single package-root entry ... ok (470µs)
dependencies without a subpath keep their specifier verbatim ... ok (404µs)
existing workspace imports are never overwritten ... ok (384µs)
importEntryForDependency normalises every specifier shape ... ok (624µs)
running 5 tests from ./packages/cli/src/kernel/application/ui/registry-lifecycle_test.ts
registry list mirrors the manifest and flags installed items ... ok (2ms)
registry update reports local edits without clobbering them ... ok (1ms)
registry remove deletes files and dependency imports ... ok (1ms)
installing the desktop items pins the SDK release the workspace ships ... ok (3ms)
removing one desktop item keeps the SDK import the other still needs ... ok (2ms)
running 2 tests from ./packages/cli/src/kernel/application/ui/registry-styles.test.ts
writeStylesAggregator registers a collection install's per-item CSS imports ... ok (1ms)
writeStylesAggregator appends a collection install onto an existing aggregator ... ok (803µs)
running 2 tests from ./packages/cli/src/kernel/application/ui/web-scaffold_test.ts
page scaffold emits a definePage route and colocated island files ... ok (1ms)
island scaffold emits signals or query hydration templates ... ok (316µs)
running 2 tests from ./packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog_test.ts
scaffold runtime npm imports match workspace, Fresh, and SDK catalogs ... ok (2ms)
standalone workspace Zod catalog matches the repository authority ... ok (273µs)
running 2 tests from ./packages/cli/src/kernel/constants/version-drift_test.ts
no hardcoded pinned NetScript JSR specifiers in CLI src ... ok (141ms)
no version-less NetScript JSR specifiers in framework command sources ... ok (37ms)
running 4 tests from ./packages/cli/src/kernel/domain/deploy/activation-convention_test.ts
activateWithHealthGate records the candidate and prunes on a passing gate ... ok (1ms)
activateWithHealthGate activates the candidate BEFORE probing it ... ok (247µs)
activateWithHealthGate auto-rolls-back to the prior current on a failing gate ... ok (305µs)
activateWithHealthGate on a failing gate with no prior current does not rollback-activate ... ok (205µs)
running 9 tests from ./packages/cli/src/kernel/domain/deploy/deno-deploy-target_test.ts
DenoDeployTarget: declares the supported canonical op subset (no rollback/secrets) ... ok (760µs)
DenoDeployTarget: plan reports guard violations without shelling ... ok (575µs)
DenoDeployTarget: plan on a clean project reports Deploy-ready ... ok (158µs)
DenoDeployTarget: up refuses a production push with unstable-API violations ... ok (633µs)
DenoDeployTarget: up proceeds on a preview push despite violations (warns) ... ok (369µs)
DenoDeployTarget: up pushes cleanly and forwards resolved defaults ... ok (304µs)
DenoDeployTarget: down/status/logs delegate to the CLI port ... ok (337µs)
DenoDeployTarget: a non-zero CLI exit code throws ... ok (251µs)
DEFAULT_DEPLOY_TARGETS: registers the deno-deploy target ... ok (158µs)
running 11 tests from ./packages/cli/src/kernel/domain/deploy/deploy-target-port_test.ts
deploy target contract exposes the canonical 7-op names ... ok (702µs)
deploy target contract retains the legacy build/install/uninstall verb aliases ... ok (69µs)
deploy target port accepts an adapter that implements only the canonical subset ... ok (185µs)
deploy target registry reserves all first-party target keys at the type level ... ok (546µs)
unwired bare-metal service targets advertise only the canonical 6-op subset (F-DEPLOY-1) ... ok (314µs)
wiring the core ports promotes a service target to the 7-op surface and delegates ... ok (714µs)
a bare-metal service operation resolves a target-scoped descriptor result ... ok (246µs)
the default deploy target registry resolves every first-party target ... ok (340µs)
the default deploy target registry exposes only operations with implemented handlers ... ok (200µs)
compose and docker targets resolve the Aspire adapter operation subsets ... ok (107µs)
kubernetes, azure, and cloud-run targets resolve the Aspire cloud operation subset ... ok (111µs)
running 4 tests from ./packages/cli/src/kernel/domain/deploy/health-gate_test.ts
runHealthGate passes once a probe reports healthy, honoring earlier retries ... ok (986µs)
runHealthGate fails after exhausting retries ... ok (173µs)
runHealthGate counts a thrown probe (timeout/transport) as a failed attempt ... ok (610µs)
runHealthGate makes at least one attempt even when retries < 1 ... ok (208µs)
running 5 tests from ./packages/cli/src/kernel/domain/deploy/observability-convention_test.ts
observabilityEnv emits OTEL_DENO=true with the derived service name and default protocol ... ok (1ms)
observabilityEnv wires the exporter endpoint and protocol when configured ... ok (144µs)
observabilityEnv applies the service-name prefix ... ok (121µs)
observabilityEnv emits the service-version resource attribute and optional standalone var ... ok (560µs)
observabilityEnv returns an empty map when disabled ... ok (414µs)
running 9 tests from ./packages/cli/src/kernel/domain/deploy/rollback-convention_test.ts
DEFAULT_RELEASE_RETENTION is 3 ... ok (1ms)
retainReleases prunes prior releases older than the retention window ... ok (339µs)
retainReleases never prunes the current release even when keep is 0 ... ok (274µs)
retainReleases is a no-op when keep >= prior count ... ok (206µs)
selectRollbackTarget picks the most-recent healthy release before current ... ok (234µs)
selectRollbackTarget skips unhealthy prior releases ... ok (183µs)
selectRollbackTarget returns undefined for single/empty history ... ok (116µs)
rollbackToPrevious activates the previous healthy release ... ok (268µs)
rollbackToPrevious is a structured no-op when there is nothing to roll back to ... ok (140µs)
running 6 tests from ./packages/cli/src/kernel/domain/deploy/secrets-convention_test.ts
RESTRICTED_SECRET_FILE_MODE is owner read/write only (0o600) ... ok (725µs)
renderSecretsEnvFile emits KEY=VALUE lines with the restricted mode ... ok (373µs)
renderSecretsEnvFile quotes + escapes values that would break a dotenv parse ... ok (184µs)
renderSecretsEnvFile renders an empty body for a bundle with no secrets ... ok (109µs)
reconcileSecrets writes the rendered bundle through the store port ... ok (673µs)
reconcileSecrets reports keys held by the store but dropped from the bundle as pruned ... ok (232µs)
running 6 tests from ./packages/cli/src/kernel/domain/deploy/unstable-api-guard_test.ts
scanUnstableApis: clean project reports ok with no violations ... ok (818µs)
scanUnstableApis: flags Deno.openKv usage in an entrypoint ... ok (169µs)
scanUnstableApis: flags features declared in deno.json unstable list ... ok (213µs)
scanUnstableApis: dedupes the same API across the declared list and sources ... ok (73µs)
scanUnstableApis: detects Temporal, cron, and BroadcastChannel tokens ... ok (171µs)
scanUnstableApis: tolerates missing/invalid deno.json and sources ... ok (62µs)
running 3 tests from ./packages/cli/src/kernel/domain/scaffold/app-name_test.ts
deriveDefaultAppName adds one project-specific web suffix ... ok (1ms)
deriveDefaultAppName stays inside the validated app-name contract ... ok (250µs)
deriveDefaultAppName trims a separator at the length boundary ... ok (110µs)
running 2 tests from ./packages/cli/src/kernel/domain/scaffold/default-port-allocation_test.ts
scaffold default ports are stable, high, and resource-specific ... ok (692µs)
scaffold default port allocation probes occupied ports ... ok (228µs)
running 2 tests from ./packages/cli/src/kernel/templates/app/generators-config_test.ts
generateAppDenoJson ...
  should produce valid JSON with scoped name ... ok (1ms)
  should have exports pointing to main.ts ... ok (1ms)
  should include Fresh and Preact imports ... ok (1ms)
  should include JSX compiler options ... ok (0ms)
  should NOT include workspace field (only valid on root deno.json) ... ok (0ms)
  should have Vite-based tasks ... ok (0ms)
  should include Vite and Fresh plugin imports ... ok (0ms)
  should end with trailing newline ... ok (0ms)
  emits the expected app manifest shape for JSR mode ... ok (0ms)
  should resolve @netscript/fresh/vite in local mode ... ok (1ms)
  should match the validated copied-workspace app contract in local mode ... ok (0ms)
  sources external app dependency pins from the scaffold catalog ... ok (1ms)
generateAppDenoJson ... ok (13ms)
generateAppViteConfig ...
  should include the NetScript Vite plugin and workspace watch paths ... ok (1ms)
  should include all @app aliases mirrored from the playground ... ok (0ms)
  keeps alias and plugin ordering stable in the vite config ... ok (0ms)
generateAppViteConfig ... ok (2ms)
running 1 test from ./packages/cli/src/kernel/templates/app/route-templates_test.ts
app route template rendering ...
  router.ts mirrors the playground route entrypoint and adds the scaffold service ref ... ok (1ms)
  CRUD links resolve to the generated /examples/crud route ... ok (1ms)
  rejects duplicate direct appRoutes targets ... ok (1ms)
  utils.ts re-exports a typed definePage helper ... ok (0ms)
  app shell imports design CSS and avoids favicon console noise ... ok (0ms)
  index route keeps the builder in index.tsx and the view in a child component ... ok (0ms)
  dashboard route keeps operations data in a registry-only child view ... ok (0ms)
  health route keeps the builder in health.tsx and the probe payload in shared helpers ... ok (0ms)
  health route renders through SSR unless the caller asks for JSON only ... ok (0ms)
  layout template keeps define.layout and exposes the examples nav ... ok (0ms)
  design route templates use NetScript page builders and scoped route files ... ok (0ms)
  examples landing route keeps the builder in index.tsx and the cards in a child view ... ok (0ms)
  static directory-pattern route uses registry form, table, and detail blocks ... ok (0ms)
  example service template wires the selected service client and query helpers ... ok (0ms)
  resource-local route contract owns typed path and search state ... ok (0ms)
  service example route is folder-owned with the builder in index.tsx and layout in index.layout.tsx ... ok (0ms)
  service example child components separate page structure from layer UIs ... ok (0ms)
  managed form renders the schema-invalid branch and keeps partial navigation ... ok (1ms)
  managed form renders the successful-submission branch ... ok (0ms)
  route-local shared loader prefetches and dehydrates the showcase query ... ok (1ms)
  optimistic callbacks capture and restore the exact pre-mutation snapshot ... ok (30ms)
  DB island exposes cached query states and consumes executable rollback callbacks ... ok (0ms)
  memory island consumes executable rollback callbacks and preserves query states ... ok (1ms)
  summary panel and partial route keep defer concerns server-owned ... ok (0ms)
  service contract exposes typed CRUD schemas for the showcase mutations ... ok (1ms)
  service router binds Prisma-backed CRUD handlers for the showcase flow ... ok (0ms)
app route template rendering ... ok (52ms)
running 1 test from ./packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts
generateTsAspireConfig ...
  lets Aspire choose per-process dashboard and telemetry ports ... ok (1ms)
  does not pin the profile to the base Aspire infra ports ... ok (0ms)
  includes all required DB integration packages for multi-engine projects ... ok (0ms)
  includes the browser logs integration package by default ... ok (0ms)
generateTsAspireConfig ... ok (6ms)
running 3 tests from ./packages/cli/src/kernel/templates/aspire/generators_test.ts
generateGlobalJson ...
  should produce valid JSON with SDK version ... ok (0ms)
  should set rollForward to latestMinor ... ok (0ms)
  should allow prereleases ... ok (0ms)
  should accept custom SDK version ... ok (1ms)
  should end with trailing newline ... ok (0ms)
  keeps the root and sdk key ordering stable ... ok (0ms)
generateGlobalJson ... ok (8ms)
generateAspireConfig ...
  should produce valid JSON with appHostPath ... ok (0ms)
  should accept custom appHostPath ... ok (0ms)
  should end with trailing newline ... ok (0ms)
  keeps the minimal config shape stable ... ok (1ms)
generateAspireConfig ... ok (4ms)
generateAppsettings ...
  should produce valid JSON with NetScript config root ... ok (1ms)
  should include OTEL endpoint under NetScript.Otel ... ok (0ms)
  should accept custom appPort and otelPort ... ok (0ms)
  should pin no app host port by default ... ok (0ms)
  should omit Databases/PrimaryDatabase when dbEngine is none ... ok (1ms)
  defaults shared cache to redis ... ok (0ms)
  can omit shared cache emission ... ok (0ms)
  emits garnet cache appsettings when selected ... ok (0ms)
  emits deno-kv cache appsettings when selected ... ok (0ms)
  should register Postgres engine when dbEngine is postgres ... ok (0ms)
  should register Sqlite engine without Mode ... ok (1ms)
  should register MSSQL engine with matching Aspire password parameter ... ok (0ms)
  should include example service when provided, pinning no host port ... ok (1ms)
  should pin the host port a caller explicitly requests ... ok (0ms)
  should produce an empty Services block when no service provided ... ok (0ms)
  should omit Prisma Studio when no database is configured ... ok (0ms)
  should end with trailing newline ... ok (0ms)
  keeps the default NetScript key ordering stable ... ok (0ms)
  keeps service + postgres sections structurally stable ... ok (0ms)
generateAppsettings ... ok (14ms)
running 1 test from ./packages/cli/src/kernel/templates/aspire/helpers/tests/database-permissions_test.ts
SQLite permissions add FFI only when it is not already granted ... ok (851µs)
running 1 test from ./packages/cli/src/kernel/templates/aspire/helpers/tests/generate-db-cli-mode_test.ts
generateDbCliMode ...
  generates targets for all configured database engines ... ok (1ms)
  registers operation resources without short-circuiting the resident graph ... ok (0ms)
generateDbCliMode ... ok (7ms)
running 1 test from ./packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-infrastructure_test.ts
generateRegisterInfrastructure ...
  uses session lifetime for configured-persistent databases only under isolated starts ... ok (2ms)
  registers redis cache containers with endpoint wiring ... ok (0ms)
  registers garnet cache containers with endpoint wiring ... ok (1ms)
  emits deno-kv Local cache as in-process wiring without an Aspire resource ... ok (0ms)
  emits deno-kv Container cache as a Deno KV Connect container with an access token ... ok (0ms)
  emits garnet Executable cache as a self-provisioned dotnet tool (Docker-less) ... ok (1ms)
  honors an explicit ToolVersion pin for the garnet Executable arm ... ok (0ms)
  emits garnet Auto as a runtime Docker probe: Garnet container vs Garnet executable ... ok (0ms)
  emits deno-kv Auto with the DenoKv Connect container as the Docker branch ... ok (0ms)
  registers sqlite as a resolved file-backed Aspire resource ... ok (0ms)
  generates one resolved graph resource per scaffolded backing service ... ok (1ms)
  registers SQL Server containers with explicit image and password policy env ... ok (1ms)
  persists container database credentials for resident AppHost restarts ... ok (0ms)
generateRegisterInfrastructure ... ok (12ms)
running 2 tests from ./packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts
generateRegisterBackground ...
  should return a non-empty string ... ok (2ms)
  should include the standard file header ... ok (0ms)
  should export registerBackgroundProcessors async function ... ok (0ms)
  should import buildOtelEnvVars and resolvePermissions ... ok (1ms)
  should register processors via addExecutable ... ok (0ms)
  emits SQLite FFI exactly once for background processors ... ok (1ms)
  keeps non-SQLite background output byte-identical ... ok (1ms)
  should use --watch flag (not --watch-hmr) for background processors ... ok (1ms)
  should enable Deno worker options for background processors ... ok (0ms)
  should include enabled gate for each processor ... ok (0ms)
  should include OTEL env vars when telemetry is enabled ... ok (0ms)
  should opt out of telemetry when disabled ... ok (1ms)
  should include concurrency env var when configured ... ok (0ms)
  should include database dependency when RequiresDb is true ... ok (1ms)
  should include KV cache dependency when RequiresKv is true ... ok (1ms)
  uses the typed service map parameter for background service references ... ok (5ms)
  should pass saga store backend appsettings to background env ... ok (0ms)
  should register the saga supervisor health endpoint and probe ... ok (0ms)
  should point triggers background at the generated trigger registry module ... ok (0ms)
  should handle empty processors ... ok (1ms)
generateRegisterBackground ... ok (35ms)
generateRegisterApps ...
  should return a non-empty string ... ok (1ms)
  should include the standard file header ... ok (0ms)
  should export registerApps async function ... ok (0ms)
  should import buildViteEnvVarName from _aspire-compat ... ok (0ms)
  should register app type with valid deno task argv ... ok (1ms)
  should include enabled gate for each app ... ok (0ms)
  should include OTEL telemetry for all app types ... ok (0ms)
  should include HTTP endpoint when port is configured ... ok (0ms)
  should not emit browser-log capabilities for generic executable apps ... ok (0ms)
  should use deno task for app registration ... ok (0ms)
  should include VITE service-discovery injection for service references ... ok (0ms)
  should register desktop only when explicitly enabled ... ok (0ms)
  should make desktop launch wait for the Fresh build resource ... ok (0ms)
  should apply desktop build and predev task defaults ... ok (0ms)
  should inject server-side discovery without an Aspire HTTP endpoint for desktop ... ok (0ms)
  should annotate app type in comment ... ok (0ms)
  should register an HTTP health probe for app resources ... ok (0ms)
  should probe a custom path when HealthCheckPath is configured ... ok (0ms)
  should omit the health probe when HealthCheckPath is false ... ok (0ms)
  should register a health probe for every endpoint-bearing executable ... ok (0ms)
  should not register a health probe for an endpoint-less task ... ok (0ms)
  should handle empty apps ... ok (0ms)
generateRegisterApps ... ok (17ms)
running 2 tests from ./packages/cli/src/kernel/templates/aspire/helpers/tests/generators-config-infra_test.ts
generateConfigSchema ...
  should return a non-empty string ... ok (1ms)
  should include the standard file header ... ok (0ms)
  should import zod and NetScriptConfigSchema from _aspire-compat ... ok (0ms)
  should export ProjectConfigSchema and ProjectConfig type ... ok (0ms)
  should include section entries as literal keys ... ok (0ms)
  should import entry schemas only for populated sections ... ok (1ms)
  should quote property keys with special characters ... ok (0ms)
  should handle all empty sections with no z.object blocks ... ok (0ms)
generateConfigSchema ... ok (8ms)
generateRegisterInfrastructure ...
  should return a non-empty string ... ok (1ms)
  should include the standard file header ... ok (0ms)
  should export registerInfrastructure async function ... ok (0ms)
  should export InfrastructureContext interface ... ok (0ms)
  should import persistent-container helpers only when generated output uses them ... ok (0ms)
  should use addPostgres for Postgres Container mode ... ok (0ms)
  should use addConnectionString for External mode ... ok (0ms)
  should include withLifetime for persistent databases, session-scoped when isolated ... ok (0ms)
  should include withDataBindMount for databases with DataPath ... ok (0ms)
  should include addDatabase when DatabaseName is specified ... ok (1ms)
  should assign server directly when no DatabaseName ... ok (0ms)
  should use a Redis-compatible Garnet container for Garnet cache engine ... ok (0ms)
  should resolve primary database from config ... ok (1ms)
  should resolve primary cache from config ... ok (0ms)
  should set null primaries when not configured ... ok (1ms)
  should handle empty databases and caches ... ok (0ms)
generateRegisterInfrastructure ... ok (11ms)
running 2 tests from ./packages/cli/src/kernel/templates/aspire/helpers/tests/generators-pipeline_test.ts
HelpersGeneratorPipeline ...
  should generate all AppHost project files when enabled ... ok (5ms)
  should generate 11 files without apphost ... ok (1ms)
  should produce files with non-empty paths and content ... ok (1ms)
  threads SQLite FFI to every permission-bearing register output ... ok (0ms)
  should emit local import specifiers that resolve to generated files ... ok (1ms)
  should use correct .helpers/ output paths for all helpers files ... ok (0ms)
  should include apphost.mts at root level (not in .helpers/) ... ok (1ms)
  must not generate a second DB-operation AppHost over resident data ... ok (1ms)
  should not include apphost.mts when generateAppHost is false ... ok (0ms)
  should render apphost.mts with correct template variables ... ok (1ms)
  should include configure-dashboard.mts from Tier 2 template ... ok (1ms)
  should mirror dashboard env constants in the Aspire compat helper ... ok (0ms)
  should include the Aspire compat helper with VITE env-var export ... ok (0ms)
  should bound best-effort Garnet tool restore ... ok (1ms)
  should pass populated config through to Tier 1 generator content ... ok (0ms)
  should handle empty config producing valid no-op output ... ok (0ms)
HelpersGeneratorPipeline ... ok (26ms)
generateHelpers ...
  should return the same file count as pipeline.execute() ... ok (0ms)
  should support generateAppHost: false ... ok (0ms)
  should produce valid generated files with non-empty content ... ok (1ms)
generateHelpers ... ok (3ms)
running 2 tests from ./packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts
generateRegisterServices ...
  should return a non-empty string ... ok (0ms)
  should include the standard file header ... ok (0ms)
  should export registerServices async function ... ok (0ms)
  should import register-services dependencies ... ok (0ms)
  should generate two-pass registration structure ... ok (1ms)
  should register services via addExecutable with correct port and entrypoint ... ok (0ms)
  should include full executable OTEL env vars for each service ... ok (0ms)
  should register an HTTP health probe after the endpoint for unpinned services ... ok (0ms)
  should support custom and disabled service health probes ... ok (1ms)
  should use --watch-hmr flag for services (HMR-capable) ... ok (0ms)
  should emit FFI permission only for SQLite-backed service commands ... ok (0ms)
  should preserve explicit service permissions while requiring SQLite FFI once ... ok (0ms)
  keeps non-SQLite service output byte-identical ... ok (0ms)
  should wire primary database dependency for all services ... ok (0ms)
  should wire service references from the services map ... ok (0ms)
  should wire plugin references from the plugins map ... ok (0ms)
  should handle empty services ... ok (0ms)
generateRegisterServices ... ok (15ms)
generateRegisterPlugins ...
  should return a non-empty string ... ok (1ms)
  should include the standard file header ... ok (0ms)
  should export registerPlugins async function ... ok (0ms)
  should generate two-pass registration structure ... ok (0ms)
  should register plugins via addExecutable with correct port ... ok (1ms)
  emits SQLite FFI exactly once for plugin services ... ok (0ms)
  keeps non-SQLite plugin output byte-identical ... ok (0ms)
  should include full executable OTEL env vars for each plugin ... ok (0ms)
  should register an HTTP health probe after the endpoint for unpinned plugins ... ok (0ms)
  should support custom and disabled plugin health probes ... ok (0ms)
  should inject configured plugin environment variables ... ok (0ms)
  should wire plugin→plugin references in pass 2 ... ok (0ms)
  should wire service references in pass 1 (services already exist) ... ok (0ms)
  should handle RequiresDb dependency ... ok (0ms)
  should handle RequiresKv dependency via the withCacheReference seam ... ok (1ms)
  should pass saga store backend appsettings to plugin env ... ok (0ms)
  should point triggers API at the generated trigger registry module ... ok (0ms)
  should handle empty plugins ... ok (0ms)
generateRegisterPlugins ... ok (12ms)
running 3 tests from ./packages/cli/src/kernel/templates/aspire/helpers/tests/generators-tools-db-index_test.ts
generateRegisterTools ...
  should return a non-empty string ... ok (1ms)
  should include the standard file header ... ok (0ms)
  should export registerTools async function ... ok (0ms)
  should import resolveWorkspacePath from _aspire-compat ... ok (0ms)
  should register tools via addExecutable with deno task ... ok (1ms)
  should use resource name as TaskName fallback ... ok (0ms)
  should convert hyphenated names to safe identifiers ... ok (0ms)
  should include enabled gate for each tool ... ok (1ms)
  should use named database dependency when configured ... ok (0ms)
  should fall back to primary database when no named database ... ok (0ms)
  should inject database URL for database-backed tools ... ok (1ms)
  should resolve Prisma Studio to the database workspace ... ok (0ms)
  should handle empty tools ... ok (0ms)
generateRegisterTools ... ok (13ms)
generateDbCliMode ...
  should generate targets for all configured database engines ... ok (1ms)
  registers explicit DB resources without short-circuiting the resident graph ... ok (0ms)
generateDbCliMode ... ok (2ms)
generateIndex ...
  should return a non-empty string ... ok (1ms)
  should include the standard file header ... ok (0ms)
  should export createNetScriptAppHost async function with correct params ... ok (1ms)
  should import parseAppSettings from _aspire-compat ... ok (0ms)
  should import DistributedApplicationBuilder from SDK module ... ok (0ms)
  should include all registration phase imports ... ok (0ms)
  should follow correct registration order in function body ... ok (0ms)
  should parse config via parseAppSettings in function body ... ok (0ms)
generateIndex ... ok (4ms)
running 5 tests from ./packages/cli/src/kernel/templates/aspire/helpers/tests/register-http-endpoint_test.ts
resolveHostPort ...
  should return undefined when the entry pins nothing ... ok (0ms)
  should prefer HostPort over the deprecated Port alias ... ok (0ms)
  should still read the deprecated Port alias so existing configs keep working ... ok (0ms)
resolveHostPort ... ok (4ms)
renderHttpEndpointOptions ...
  should omit port entirely when nothing is pinned ... ok (0ms)
  should emit the pinned host port when one is configured ... ok (0ms)
  should always name the PORT env var so the process learns its target port ... ok (0ms)
renderHttpEndpointOptions ... ok (2ms)
generateRegisterServices host ports ...
  should pin no host port for a service that configures none ... ok (1ms)
  should pin the host port a service opts into via HostPort ... ok (1ms)
  should keep honouring the deprecated Port alias unchanged ... ok (0ms)
  should wire cross-references through getEndpoint regardless of pinning ... ok (0ms)
generateRegisterServices host ports ... ok (5ms)
generateRegisterPlugins host ports ...
  should pin no host port for a plugin that configures none ... ok (1ms)
  should keep honouring a configured plugin port ... ok (0ms)
generateRegisterPlugins host ports ... ok (2ms)
generateRegisterApps host ports ...
  should still register an endpoint for a web app that pins no host port ... ok (0ms)
  should keep honouring a configured app port ... ok (0ms)
  should leave a portless task app without an HTTP endpoint, as before ... ok (1ms)
generateRegisterApps host ports ... ok (3ms)
running 3 tests from ./packages/cli/src/kernel/templates/aspire/helpers/tests/service-environment-runtime_test.ts
generated service registration, executed (#1447) ...
  should put every declared entry on its own resource ... ok (39ms)
  should still wire the database reference and wait ... ok (28ms)
  should register the HTTP endpoint that owns PORT ... ok (28ms)
generated service registration, executed (#1447) ... ok (98ms)
declared environment precedence, per documented category (#1447) ...
  should honor the plain (control) rule: declared-wins ... ok (27ms)
  should honor the plain (second control) rule: declared-wins ... ok (24ms)
  should honor the OTel rule: generated-wins ... ok (28ms)
  should honor the database URL rule: generated-wins ... ok (21ms)
  should honor the database engine URI rule: generated-wins ... ok (30ms)
  should honor the database provider rule: generated-wins ... ok (27ms)
  should honor the service discovery rule: generated-wins ... ok (24ms)
  should honor the PORT / endpoint rule: refused ... ok (24ms)
  should keep a non-colliding control intact while collisions are overridden ... ok (34ms)
declared environment precedence, per documented category (#1447) ... ok (244ms)
the declared environment reaches a real process (#1447) ...
  should be observed by a process started with the assigned environment ... ok (81ms)
the declared environment reaches a real process (#1447) ... ok (82ms)
running 2 tests from ./packages/cli/src/kernel/templates/aspire/helpers/tests/service-environment_test.ts
declared service environment (#1447) ...
  should survive config parsing under the deprecated Env alias ... ok (10ms)
  should apply every declared entry to the correct service resource ... ok (3ms)
  should apply the declared entries through withEnvironment ... ok (2ms)
  should let generated telemetry and database values win a declared collision ... ok (2ms)
  should refuse a declared PORT and say so in the generated helper ... ok (2ms)
  should prefer Environment over the deprecated Env alias ... ok (1ms)
  should emit nothing extra for a service that declares no environment ... ok (2ms)
  should regenerate byte-identical output ... ok (2ms)
declared service environment (#1447) ... ok (31ms)
declared plugin environment parity (#1447) ...
  should apply the declared entries to plugin resources the same way ... ok (4ms)
  should read the deprecated Env alias on plugin entries too ... ok (2ms)
  should place declared entries before generated values on plugins as well ... ok (1ms)
  should refuse a declared PORT on plugin resources too ... ok (3ms)
declared plugin environment parity (#1447) ... ok (13ms)
running 1 test from ./packages/cli/src/kernel/templates/aspire/pristine-scaffold-ports_test.ts
pristine scaffold host ports (#952) ...
  should write no host port for the example service or the app ... ok (1ms)
  should generate a service registration that pins nothing ... ok (1ms)
  resolves the database resource afresh instead of persisting an allocated endpoint (#1202) ... ok (0ms)
  should generate an app registration that pins nothing but still serves HTTP ... ok (0ms)
  should still pin when the developer asks for it ... ok (0ms)
pristine scaffold host ports (#952) ... ok (10ms)
running 1 test from ./packages/cli/src/kernel/templates/database/generators_test.ts
database template generators ...
  generates engine-specific Deno tasks and imports ... ok (3ms)
  includes patch-client and fix-zod tasks for sqlite ... ok (0ms)
  generates zod and patch-client tasks for mysql ... ok (0ms)
  generates zod and patch-client tasks for mssql ... ok (1ms)
  generates Prisma config with Aspire env key and sqlite fallback URL ... ok (1ms)
  generates Prisma config with the env import and fallback for postgres ... ok (0ms)
  normalizes mssql Aspire loopback endpoints to hostname URLs ... ok (0ms)
  generates engine modules with adapter setup where required ... ok (0ms)
  constructs the sqlite engine module with the libsql driver adapter ... ok (1ms)
  includes the libsql adapter import for the sqlite database deno.json ... ok (0ms)
  generates the root database facade for the selected engine ... ok (0ms)
database template generators ... ok (14ms)
running 4 tests from ./packages/cli/src/kernel/templates/plugins/generate-plugin-service_test.ts
generatePluginService opts KV-backed plugin services into Redis adapter ... ok (2ms)
generatePluginService does not add Redis adapter import for API-only services ... ok (429µs)
generatePluginProcessorEntrypoint carries the selected KV adapter ... ok (233µs)
generatePluginServiceContext emits package-resident safe imports ... ok (145µs)
running 2 tests from ./packages/cli/src/kernel/templates/service/generators_test.ts
generateServiceDenoJson ...
  should produce valid JSON with scoped name and direct imports only ... ok (0ms)
  should resolve service imports against local packages when using copied workspace members ... ok (1ms)
  should run the server with --unstable-no-legacy-abort (Deno 2.9, #176) ... ok (0ms)
  should end with a trailing newline ... ok (0ms)
generateServiceDenoJson ... ok (6ms)
service template rendering ...
  main.ts uses defineService as the only boot primitive ... ok (1ms)
  router.ts preserves the validated service-local health contract shape ... ok (0ms)
service template rendering ... ok (2ms)
running 22 tests from ./packages/cli/src/kernel/templates/workspace/generators_test.ts
generateTsConfig terminates parent lookup without claiming Deno files ... ok (1ms)
generateDenoJson emits the expected root workspace shape in JSR mode ... ok (1ms)
generateDenoJson gives standalone workspaces their own Zod catalog ... ok (221µs)
generatePackageJson pins the pre-window Deno runtime ... ok (217µs)
generateDenoJson emits detached Aspire telemetry task routes ... ok (184µs)
generateAspireCliTaskRunner emits bare-first fallback and actionable failure ... ok (140µs)
generateDenoJson gives Aspire cold starts a configurable five-minute budget ... ok (151µs)
generateDenoJson scopes the minimum dependency age exception to NetScript packages ... ok (291µs)
generateDenoJson emits shared plugin service-context imports in JSR mode ... ok (113µs)
generateDenoJson maps @database/zod for the selected database engine ... ok (117µs)
generateDenoJson keeps generated database aliases in local mode ... ok (113µs)
generateDenoJson keeps the same root-only shape in local mode ... ok (157µs)
generateDenoJson omits imports in local mode ... ok (109µs)
generateDenoJson expands copied workspace packages in stable order ... ok (156µs)
generateNetScriptConfig emits the JSR import and stable section order ... ok (509µs)
generateNetScriptConfig switches to local imports without the JSR TODO banner ... ok (115µs)
generateReadme — TS AppHost with service + postgres ... ok (880µs)
generateReadme — no aspire points at app dev task ... ok (215µs)
generateReadme — no aspire postgres asks for self-provisioning ... ok (197µs)
generateReadme — sqlite gets non-persistent note ... ok (176µs)
generateReadme — mysql gets persistent-container note ... ok (190µs)
generated tsconfigs terminate upward lookup so a hostile parent cannot reach the project ... ok (206µs)
running 2 tests from ./packages/cli/src/kernel/templates/workspace/node-modules-verifier_test.ts
generated verifier fails closed for a cache file missing from node_modules/.deno ... ok (48ms)
generated verifier passes only after the local materialization is complete ... ok (40ms)
running 6 tests from ./packages/cli/src/kernel/templates/workspace/quality-runner_test.ts
generated quality runner rejects an empty owned-source selection in every mode ... ok (157ms)
generated quality runner selects TS, TSX, and AppHost MTS while excluding non-product trees ... ok (90ms)
generated quality runner propagates a selected TypeScript failure ... ok (793ms)
generated quality runner rejects explicit any in selected product source ... ok (63ms)
generated quality runner is itself lint and format clean in its consumer location ... ok (142ms)
generated quality runner checks AppHost source through its restored TypeScript project ... ok (323µs)
running 1 test from ./packages/cli/src/local/composition/local-contributor-command-tree_test.ts
local contributor CLI composition ...
  exposes public project commands plus maintainer commands ... ok (13ms)
local contributor CLI composition ... ok (26ms)
running 1 test from ./packages/cli/src/local/features/plugins/install/install-local-plugin_test.ts
local contributor install plugin flow ...
  writes starter plugin files with local imports for non-canonical plugin names ... ok (12ms)
  renders canonical plugins without copying source when no local path is supplied ... ok (3ms)
  writes thin local-import stubs for canonical plugins when source copy is disabled ... ok (3ms)
  keeps the plugin-owned AI namespace configured in local-source installs ... ok (2s)
  skips the target generated project when discovering the official plugin source root ... ok (1ms)
local contributor install plugin flow ... ok (2s)
running 1 test from ./packages/cli/src/maintainer/adapters/official-plugin-source_test.ts
findOfficialPluginSourceRoot follows copied workspace source marker ... ok (18ms)
running 2 tests from ./packages/cli/src/maintainer/adapters/packages-copier_test.ts
copyLocalPackages keeps mysql adapter engine-specific while resolving database imports ... ok (110ms)
copyLocalPackages copies mysql adapter only for mysql engine ... ok (98ms)
running 1 test from ./packages/cli/src/maintainer/features/init/init-command_test.ts
createMaintainerInitCommand ...
  accepts an explicit boolean value for --service without consuming the project name ... ok (5ms)
createMaintainerInitCommand ... ok (7ms)
running 1 test from ./packages/cli/src/maintainer/features/root/maintainer-services_test.ts
maintainer application services ...
  syncPackages delegates to the package copier port ... ok (1ms)
  syncPlugin discovers the source root and defaults to canonical names ... ok (0ms)
  syncPlugin carries a service-less official source without service metadata ... ok (23ms)
  syncTemplates runs all registered steps in order ... ok (0ms)
  probeMonorepo reports local sync capabilities and localBase ... ok (0ms)
  runScaffoldTest launches the repo e2e task with scaffold suite ids ... ok (1ms)
  orchestrateMaintainerInit runs local-mode init and package sync ... ok (1ms)
  orchestrateMaintainerInit fails when no monorepo root is available ... ok (0ms)
maintainer application services ... ok (34ms)
running 4 tests from ./packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-copy_test.ts
canCopyOfficialPlugin recognizes canonical first-party plugin names ... ok (15ms)
copyOfficialPlugin copies plugin and background source workspaces ... ok (291ms)
copyOfficialPlugin rewrites fallback plugin source imports for top-level background workspaces ... ok (118ms)
official plugin import rewrite converts local package paths to JSR specifiers ... ok (247µs)
running 2 tests from ./packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts
copyOfficialPlugin wires sample config and runtime files for scaffold projects ... ok (314ms)
copyOfficialPlugin honors includeSamples false ... ok (113ms)
running 4 tests from ./packages/cli/src/public/adapters/agent/deno-agent-docs-generator_test.ts
offline docs cover every export subpath at the exact installed version ... ok (90ms)
lock evidence resolves a non-exact JSR range ... ok (2ms)
workspace evidence resolves a local package version without a lock ... ok (65ms)
missing lock evidence, version mismatch, and launch throws fail loudly ... ok (56ms)
running 1 test from ./packages/cli/src/public/adapters/jsr-import-resolver_test.ts
JsrImportResolver ...
  resolves NetScript package specifiers to JSR imports ... ok (1ms)
  resolves external dependencies to registry imports ... ok (0ms)
  resolves selected imports as an import-map fragment ... ok (1ms)
  rejects unknown import keys ... ok (1ms)
JsrImportResolver ... ok (6ms)
running 3 tests from ./packages/cli/src/public/adapters/os-service-factory_test.ts
createOsServicePort routes windows to the servy adapter ... ok (983µs)
createOsServicePort routes linux to the systemd adapter ... ok (138µs)
OS routing is coherent from explicit OS → naming → adapter ... ok (390µs)
running 6 tests from ./packages/cli/src/public/adapters/service-activation-port_test.ts
SymlinkActivationPort activates via atomic symlink+rename before restart ... ok (1ms)
DirSwapActivationPort removes the old junction then recreates before restart ... ok (236µs)
current resolves the active release id from the current link basename ... ok (195µs)
current is undefined when no current link exists ... ok (60µs)
record appends to persisted history and history reads it back ... ok (369µs)
prune removes each pruned release directory recursively ... ok (118µs)
running 1 test from ./packages/cli/src/public/adapters/systemd-os-service_test.ts
SystemdOsServiceAdapter ...
  maps Linux service operations to byte-identical systemctl invocations ... ok (1ms)
  fails fast when daemon-reload fails and does not enable ... ok (0ms)
  surfaces a structured result on success ... ok (0ms)
SystemdOsServiceAdapter ... ok (6ms)
running 1 test from ./packages/cli/src/public/composition/run-public-cli_test.ts
normalizes plugin custom add syntax without changing other verbs ... ok (13ms)
running 1 test from ./packages/cli/src/public/domain/scaffold-plan_test.ts
createScaffoldPlan ...
  builds the base workspace member list ... ok (1ms)
  includes service and database members when selected ... ok (0ms)
createScaffoldPlan ... ok (6ms)
running 1 test from ./packages/cli/src/public/features/agent/drift/record-drift-command_test.ts
agent drift record enforces the same receipt gate and appends locally ... ok (21ms)
running 2 tests from ./packages/cli/src/public/features/agent/init/init-agent-command_test.ts
agent init command forwards editor and --with-docs explicitly ...
------- post-test output -------
NetScript agent integration is already current.
----- post-test output end -----
agent init command forwards editor and --with-docs explicitly ... ok (4ms)
agent init command rejects unsupported editors with manual guidance ... ok (962µs)
running 19 tests from ./packages/cli/src/public/features/agent/init/init-agent_test.ts
agent init writes Claude config, skills, and marked AGENTS section idempotently ... ok (36ms)
agent init selects VS Code and detect-or-all host table ... ok (35ms)
agent init applies native editor configuration for none, Zed, and VS Code ... ok (49ms)
agent init detects one existing editor and rejects an ambiguous project ... ok (21ms)
S-18 prior-release host stays pinned until agent init and restart exposes the tool triad ... ok (681ms)
VS Code-only agent init never delegates to the Claude skill tree ... ok (31ms)
agent init rejects a bundle whose manifest hash does not match ... ok (1ms)
installed skill routing resolves to installed skills or help ... ok (19ms)
aspire delegation is skipped when Playwright CLI is already installed ... ok (22ms)
aspire delegation timeout is swallowed after cancelling the fake ... ok (20ms)
aspire delegation errors are swallowed with unconditional MCP config ... ok (17ms)
agent init installs the complete diagnostic surface ... ok (18ms)
agent init installs the consumer tool surface for every host ... ok (27ms)
installed consumer tools resolve from the project when process CWD differs ... ok (442ms)
agent init leaves the offline docs corpus absent unless requested ... ok (13ms)
agent init --with-docs installs a path-closed local corpus ... ok (19ms)
generated project search_docs reaches its installed corpus after host restart ... ok (886ms)
agent init --with-docs gives Claude, VS Code, and Zed the same docs root ... ok (44ms)
offline docs failure occurs before any project write ... ok (1ms)
running 3 tests from ./packages/cli/src/public/features/agent/mcp/agent-mcp-command_test.ts
agent mcp explains stdio setup and does not start a server on a TTY ... ok (3ms)
agent mcp starts silently when stdin is piped ... ok (1ms)
agent mcp help names stdio transport and client configuration docs ... ok (27ms)
running 4 tests from ./packages/cli/src/public/features/agent/mcp/cli-mcp-adapters_test.ts
CLI-hosted MCP defaults to the real CLI package version without a JSR child ... ok (21ms)
CLI-hosted MCP executes a mismatched-version host entrypoint ... ok (114ms)
an injected host executor reports identity distinct from standalone MCP ... ok (439µs)
agent MCP adapters expose real verbs and non-stub plugin doctor results ... ok (56ms)
running 1 test from ./packages/cli/src/public/features/agent/mcp/command-policy-parity_test.ts
every default MCP command policy prefix exists in the public CLI tree ... ok (17ms)
running 3 tests from ./packages/cli/src/public/features/config/override/manage-runtime-overrides_test.ts
publish writes a version before atomically activating its topic pointer ... ok (959µs)
rollback preserves other topic pointers ... ok (353µs)
dashboard-style flag set and clear create immutable versions ... ok (783µs)
running 5 tests from ./packages/cli/src/public/features/config/project/list-appsettings-paths_test.ts
listAppsettingsPaths reports canonical case-sensitive paths ... ok (6ms)
listAppsettingsPaths expands records over the project's own keys ... ok (2ms)
listAppsettingsPaths templates records the project has not populated ... ok (1ms)
listAppsettingsPaths surfaces keys the generator does not read ... ok (3ms)
listAppsettingsPaths filters by prefix ... ok (2ms)
running 10 tests from ./packages/cli/src/public/features/config/project/project-config-ops_test.ts
getDottedValue reads resolved telemetry paths ... ok (1ms)
setProjectConfigValue maps telemetry endpoint into generated AppSettings ... ok (17ms)
#955 setProjectConfigValue writes a key parseAppSettings reads back ... ok (6ms)
#955 setProjectConfigValue does not double the NetScript prefix ... ok (5ms)
#955 setProjectConfigValue preserves user-chosen record keys ... ok (5ms)
#955 setProjectConfigValue rejects a path the generator does not read ... ok (4ms)
#955 setProjectConfigValue rejects a value the schema would drop ... ok (5ms)
#955 setProjectConfigValue --force writes an off-schema key with no silent success ... ok (3ms)
#975 setProjectConfigValue writes a modelled Aspire parameter without --force ... ok (4ms)
#955 readAppsettingsValue resolves the same spellings as set ... ok (7ms)
running 14 tests from ./packages/cli/src/public/features/config/project/resolve-appsettings-path_test.ts
resolveAppsettingsPath accepts the full appsettings path unchanged ... ok (4ms)
resolveAppsettingsPath canonicalizes schema field casing ... ok (2ms)
resolveAppsettingsPath accepts the section-relative shorthand ... ok (2ms)
resolveAppsettingsPath never re-cases a record key against the schema ... ok (2ms)
resolveAppsettingsPath keeps an unknown record key verbatim ... ok (1ms)
resolveAppsettingsPath preserves hyphenated service keys ... ok (1ms)
resolveAppsettingsPath rejects a misspelled schema field with suggestions ... ok (2ms)
resolveAppsettingsPath rejects a doubled root prefix ... ok (1ms)
resolveAppsettingsPath resolves a top-level key without re-homing it ... ok (1ms)
resolveAppsettingsPath reports an undeclared top-level key at the top level ... ok (1ms)
resolveAppsettingsPath will not descend into a scalar ... ok (1ms)
resolveAppsettingsPath resolves the telemetry alias through the schema ... ok (852µs)
collectSchemaIssues reports issues at the written path ... ok (4ms)
collectSchemaIssues ignores pre-existing damage elsewhere ... ok (356µs)
running 1 test from ./packages/cli/src/public/features/contracts/add-route/add-contract-route_test.ts
contract add-route emits an inspectable typed procedure ... ok (2ms)
running 1 test from ./packages/cli/src/public/features/contracts/add/add-contract_test.ts
add contract ...
  writes a v1 contract and regenerates the aggregate ... ok (3ms)
  preserves an existing contract unless force is set ... ok (0ms)
  rejects names outside the workspace naming contract ... ok (1ms)
add contract ... ok (7ms)
running 1 test from ./packages/cli/src/public/features/contracts/remove/remove-contract_test.ts
contract remove deletes every version and regenerates aggregates ... ok (5ms)
running 1 test from ./packages/cli/src/public/features/contracts/version-add/add-contract-version_test.ts
contract version add promotes symbols and regenerates aggregates ... ok (5ms)
running 1 test from ./packages/cli/src/public/features/db/add/add-db_test.ts
public add database flow ...
  plans a database add request from project metadata ... ok (2ms)
  writes the database workspace and root project metadata ... ok (5ms)
public add database flow ... ok (10ms)
running 1 test from ./packages/cli/src/public/features/db/operations/db-operation-command_test.ts
DB operation command no longer requires a transient AppHost workspace mutator ... ok (2ms)
running 1 test from ./packages/cli/src/public/features/deploy/build/deploy_test.ts
public deploy application flows ...
  builds deployment artifacts from a resolved config ... ok (2ms)
  installs manifest services in manifest order ... ok (1ms)
  routes install naming through the linux (systemd) lane ... ok (0ms)
  uninstalls manifest services in reverse manifest order ... ok (0ms)
  maps Windows service operations to servy-cli invocations ... ok (0ms)
public deploy application flows ... ok (9ms)
running 2 tests from ./packages/cli/src/public/features/deploy/build/prepare-deploy-build_test.ts
deployBuildDirs maps a Windows deploy root to the four standard subdirs ... ok (1ms)
deployBuildDirs derives every subdir under the given deploy root ... ok (574µs)
running 1 test from ./packages/cli/src/public/features/deploy/list/list-deploy-targets_test.ts
deploy list enumerates every registered target with advertised operations ... ok (1ms)
running 1 test from ./packages/cli/src/public/features/deploy/target/desktop/desktop-group_test.ts
desktop deploy group exposes the native package command ... ok (23ms)
running 4 tests from ./packages/cli/src/public/features/deploy/target/desktop/package/package-desktop-command_test.ts
desktop package parser forwards repeated formats and explicit selectors ... ok (25ms)
desktop package parser forwards all-targets and xz defaults ... ok (2ms)
desktop package parser rejects conflicting selectors before application call ... ok (787µs)
desktop package parser rejects unknown format and compression values ...
  unsupported-format ... ok (1ms)
  invalid-input ... ok (1ms)
desktop package parser rejects unknown format and compression values ... ok (2ms)
running 7 tests from ./packages/cli/src/public/features/deploy/target/desktop/package/package-desktop_test.ts
package workflow consumes configured PackageTaskName and app workdir ... ok (27ms)
package workflow defaults the #452 hook to desktop:package ... ok (750µs)
multiple enabled desktop apps require explicit selection ... ok (752µs)
disabled and non-desktop requested apps fail honestly ...
  app-disabled ... ok (0ms)
  app-not-desktop ... ok (0ms)
disabled and non-desktop requested apps fail honestly ... ok (3ms)
zstd preflight runs before package invocations ... ok (587µs)
missing zstd executable is reported as a typed tool error ... ok (687µs)
package process failures identify target and format ... ok (497µs)
running 7 tests from ./packages/cli/src/public/features/deploy/target/desktop/package/plan-desktop-packages_test.ts
desktop target catalog exhaustively derives SDK OS and architecture pairs ... ok (19ms)
all-targets plans every native format with explicit unique argv ... ok (2ms)
all-targets format filter selects only compatible targets ... ok (1ms)
omitted selector uses the current SDK target and can omit compression ... ok (397µs)
target and all-targets are mutually exclusive ... ok (1ms)
dmg fails before execution on a non-macOS host ... ok (406µs)
an incompatible explicit target and format is rejected ... ok (273µs)
running 2 tests from ./packages/cli/src/public/features/deploy/target/desktop/release/prepare-native-release_test.ts
release preparation composes lowercase digests and exact native patch map ... ok (2ms)
release preparation rejects duplicate and unsafe prior versions before promotion ... ok (2ms)
running 1 test from ./packages/cli/src/public/features/deploy/target/desktop/release/prepare-release-command_test.ts
release prepare parser invokes exact bsdiff argv and promotes signed envelope ... ok (58ms)
running 4 tests from ./packages/cli/src/public/features/deploy/target/desktop/release/release-store_test.ts
release store rejects lower and equal sequences using private high-water ... ok (41ms)
concurrent promotion permits exactly one route winner ... ok (5ms)
manifest replacement failure safely burns sequence after immutable patch write ... ok (4ms)
corrupt private high-water fails closed ... ok (2ms)
running 4 tests from ./packages/cli/src/public/features/deploy/target/desktop/release/server/release-handler_test.ts
release server route and real handler match public createReleaseClient URL composition ... ok (37ms)
handler serves exact manifest bytes and immutable patch HEAD metadata ... ok (6ms)
handler rejects methods, private paths, encoded separators, and traversal ...
  /stable/linux-x86_64/.release-state ... ok (0ms)
  /stable/linux-x86_64/%2fsecret.bsdiff ... ok (0ms)
  /stable/linux-x86_64/%2Fsecret.bsdiff ... ok (0ms)
  /stable/linux-x86_64/%2e%2e/secret.bsdiff ... ok (0ms)
  /stable/linux-x86_64/%2E%2E/secret.bsdiff ... ok (0ms)
  /stable/linux-x86_64/..%2fsecret.bsdiff ... ok (0ms)
  /stable/linux-x86_64/secret.txt ... ok (0ms)
  /stable/not-a-target/latest.json ... ok (0ms)
handler rejects methods, private paths, encoded separators, and traversal ... ok (12ms)
resolve-under-root and realpath checks reject escape and symlink reads ... ok (5ms)
running 1 test from ./packages/cli/src/public/features/deploy/target/desktop/release/server/serve-release-command_test.ts
release server parser forwards lifecycle, listener, root, and handler ... ok (46ms)
running 2 tests from ./packages/cli/src/public/features/deploy/target/desktop/release/sign-release_test.ts
Ed25519 envelope signs the exact preserved UTF-8 string ... ok (3ms)
native composer preserves native shape and PKCS8 PEM import verifies ... ok (2ms)
running 7 tests from ./packages/cli/src/public/features/deploy/target/target-deploy-command_test.ts
router derives verb subcommands from the adapter operations (no business logic) ... ok (2ms)
router routes a verb straight to the registry-resolved adapter ...
------- post-test output -------
✓ plan ok
----- post-test output end -----
router routes a verb straight to the registry-resolved adapter ... ok (4ms)
router forwards cache clearing without target-specific branching ...
------- post-test output -------
✓ up ok
----- post-test output end -----
router forwards cache clearing without target-specific branching ... ok (486µs)
router merges target config into the deploy request ...
------- post-test output -------
✓ plan ok
----- post-test output end -----
router merges target config into the deploy request ... ok (846µs)
router omits verbs the adapter does not advertise ... ok (417µs)
router exposes secrets set/get/list and forwards the selected operation ...
------- post-test output -------
✓ secrets ok
----- post-test output end -----
router exposes secrets set/get/list and forwards the selected operation ... ok (1ms)
deploy target routers resolve their default registry targets ... ok (2ms)
running 1 test from ./packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command_test.ts
generate plugin registries command ...
  runs the authoritative generator for the resolved project root ... ok (4ms)
generate plugin registries command ... ok (6ms)
running 1 test from ./packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator_test.ts
installed runtime registry generator ...
  runs a published manifest generator under the project config and canonical target ... ok (2ms)
  names the installed plugin and rejects a declared empty runtime ... ok (2ms)
  dry-run reports canonical paths without executing or writing ... ok (1ms)
  does not substitute an unrelated marked source package for a third-party plugin ... ok (1ms)
installed runtime registry generator ... ok (9ms)
running 9 tests from ./packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts
generated trigger registry loads definitions and excludes control-plane and runtime modules ... ok (171ms)
generated trigger registry rejects a non-definition module that is not excluded ... ok (124ms)
workspace import resolves the on-disk trigger manifest without fetching JSR ... ok (9ms)
generated workers registry loads a custom-only job and excludes job tools ... ok (132ms)
generated sagas registry loads saga definitions and ignores other TypeScript files ... ok (167ms)
packaged runtime export starts a saga runtime with a project-owned non-empty registry ... ok (1s)
generated AI registries load resources and exclude the skill-loader factory ... ok (197ms)
marked source workspace wins for a published-shaped AI project ... ok (163ms)
JSR-only imports retain the published manifest and generator fallback ... ok (9ms)
running 1 test from ./packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts
public generate application flows ...
  regenerates Aspire helpers through an injected helper generator ... ok (1ms)
  plans runtime config schema writes with configured paths ... ok (1ms)
  writes changed schemas and skips unchanged files ... ok (1ms)
  rejects duplicate runtime config schema topics ... ok (2ms)
public generate application flows ... ok (11ms)
running 11 tests from ./packages/cli/src/public/features/init/init-command_test.ts
init --from reports the empty Wave 6 preset registry ... ok (5ms)
init defaults cache on with redis backend in non-interactive mode ... ok (970µs)
init derives an omitted app name from the project name ... ok (244µs)
init keeps an explicit app name authoritative ... ok (297µs)
init derives Prisma model name from service name ... ok (418µs)
init generates a stable high-range standalone service port ... ok (241µs)
init accepts validated Prisma model name override ... ok (165µs)
init rejects invalid Prisma model name override ... ok (1ms)
interactive init prompts for all missing scaffold choices ... ok (646µs)
#968 non-terminal init uses defaults without invoking a prompt ... ok (213µs)
#967 init uses a cwd whose basename already matches the project name ... ok (319µs)
running 2 tests from ./packages/cli/src/public/features/marketplace/marketplace-group_test.ts
marketplace search prints JSR discovery guidance ... ok (5ms)
marketplace publish prints temporary publishing guidance ... ok (831µs)
running 2 tests from ./packages/cli/src/public/features/plugins/ai/ai-plugin-command_test.ts
plugin ai forwards nested lifecycle verbs and flags ... ok (2ms)
plugin ai shells out to the lockstep-versioned plugin CLI ... ok (741µs)
running 10 tests from ./packages/cli/src/public/features/plugins/auth/auth-plugin-command_test.ts
auth backend set reconciles .env and show reports the active backend ... ok (16ms)
auth backend show reads the service-supported appsettings seam ... ok (490µs)
plugin doctor reports the configured active auth backend ... ok (1ms)
github provider preset writes boot-ready OAuth environment ... ok (4ms)
workos and better-auth variants enforce their boot credential contracts ... ok (1ms)
generated kv-oauth key is accepted by the real backend registry ... ok (1ms)
session projection parser exposes active sessions ... ok (408µs)
fetch session adapter lists projections and revokes through signout ... ok (7ms)
plugin auth parser drives backend and session verbs ... ok (5ms)
session CLI lists a signed-in backend session and revoke invalidates it ...
------- post-test output -------
[Auth Stream] Durable stream emit skipped: streams URL is not configured.
[Auth Stream] Durable stream emit skipped: streams URL is not configured.
----- post-test output end -----
session CLI lists a signed-in backend session and revoke invalidates it ... ok (15ms)
running 2 tests from ./packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts
plugin verb dispatch ...
  routes framework verbs through deno x and the plugin cli subpath ... ok (2ms)
  maps non-zero plugin cli exits to remote errors ... ok (0ms)
  returns captured process output through the dispatch port ... ok (0ms)
  identifies framework verbs and resolves jsr cli specifiers ... ok (0ms)
  runs an unversioned first-party plugin through the lockstep config and direct JSR target ... ok (1ms)
  runs an explicitly lockstep first-party plugin through the direct JSR target ... ok (0ms)
  keeps an explicitly non-lockstep first-party plugin on protected deno x dispatch ... ok (1ms)
plugin verb dispatch ... ok (11ms)
plugin scaffold dispatch ...
  invokes a local fixture scaffolder and runs declared post-scripts ... ok (114ms)
  passes dry-run context to the fixture without writing project files ... ok (57ms)
  builds deno run argv with confined flags for third-party JSR scaffolders ... ok (1ms)
  verifies JSR file integrity and reports sha mismatches ... ok (1ms)
plugin scaffold dispatch ... ok (175ms)
running 16 tests from ./packages/cli/src/public/features/plugins/doctor/doctor-plugin-command_test.ts
plugin doctor writes a successful evidence receipt after an actual run ... ok (15ms)
plugin doctor reports configured-module workdirs across first-party topology shapes ... ok (15ms)
plugin doctor exits non-zero when generated registries are absent ... ok (11ms)
plugin doctor accepts real compile-registry workers output and exits zero ... ok (7ms)
plugin doctor accepts real generate plugins workers output and exits zero ... ok (9ms)
plugin doctor accepts the real shared sagas generator output and exits zero ... ok (10ms)
plugin doctor reports visible validation issues by field ... ok (684µs)
plugin doctor distinguishes an absent AppHost from unhealthy resources ... ok (411µs)
plugin doctor warns and exits zero when Aspire inspection is unavailable ... ok (2ms)
plugin doctor reports normally when diagnostic evidence cannot be written ... ok (1ms)
plugin doctor reports configured resources missing from the running AppHost by name ... ok (595µs)
plugin doctor reports a running but unhealthy AppHost resource ... ok (557µs)
plugin doctor does not certify healthy without readiness evidence ... ok (570µs)
plugin doctor maps realistic database config names without inventing section resources ... ok (488µs)
plugin manifest import failures degrade to an error report ... ok (664µs)
one unloadable plugin doctor does not suppress a healthy plugin report ... ok (39ms)
running 8 tests from ./packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts
plugin doctor reports all three host invariants healthy for a valid install ... ok (58ms)
plugin doctor rejects a dangling configured module ... ok (9ms)
plugin doctor rejects a configured module with no manifest export ... ok (35ms)
plugin doctor distinguishes a configured module import failure ... ok (28ms)
plugin doctor kills and reports a configured module that times out ... ok (57ms)
plugin doctor distinguishes a configured module non-zero exit ... ok (23ms)
plugin doctor rejects a service entrypoint absent from a JSR export map ... ok (26ms)
doctor subprocess and runtime loader have manifest-resolution parity ... ok (236ms)
running 1 test from ./packages/cli/src/public/features/plugins/host/plugin-loader_test.ts
plugin host loader ...
  resolves config plugins, merges contributions, and triggers the walker ... ok (2ms)
  resolves project root flags before creating the sync loader ... ok (5ms)
plugin host loader ... ok (10ms)
running 1 test from ./packages/cli/src/public/features/plugins/install/confirm-plugin-install_test.ts
confirmPluginInstall ...
  prompts for third-party packages and includes JSR metadata ... ok (1ms)
  skips prompts for first-party packages ... ok (1ms)
  skips third-party prompts with --skip-confirmation ... ok (0ms)
  rejects third-party packages in --ci mode without an explicit bypass ... ok (1ms)
  rejects third-party packages when no prompt is available ... ok (0ms)
  allows --ci only when --skip-confirmation is explicit ... ok (0ms)
  rejects when a third-party prompt is declined ... ok (0ms)
confirmPluginInstall ... ok (11ms)
running 1 test from ./packages/cli/src/public/features/plugins/install/install-plugin_test.ts
public install plugin flow ...
  threads includeSamples false into the workers scaffolder ... ok (158ms)
  threads includeSamples false into the sagas scaffolder ... ok (132ms)
  threads includeSamples false into the triggers scaffolder ... ok (132ms)
  threads includeSamples false into the streams scaffolder ... ok (129ms)
  plans a starter plugin request from project metadata ... ok (1ms)
  rejects a configured service-less plugin without appsettings or a conventional plugin directory ... ok (2ms)
  rejects an unresolvable plugin (no JSR/local descriptor) instead of CLI-side rendering ... ok (1ms)
  rejects a resolvable plugin when no process runner can dispatch its scaffolder ... ok (0ms)
  installs a published Prisma fragment from JSR metadata into the root schema tree ... ok (5ms)
  rejects a DB-required JSR plugin that declares migrations without a published fragment ... ok (2ms)
  previews a local-path plugin-owned scaffolder without writing files ... ok (66ms)
  installs and links the fixture third-party plugin without officialSource or CLI branches ... ok (61ms)
  installs the AI markdown registry closure into its generated namespace ... ok (2s)
  keeps the configured AI module resolvable across a forced reinstall ... ok (438ms)
  derives plugin-owned service and background workdirs from existing files after a skipped scaffold ... ok (6ms)
  adds workers from the real local-path plugin-owned scaffolder ... ok (121ms)
  previews the real workers local-path scaffolder without writing files ... ok (132ms)
  reruns the real workers scaffolder idempotently ... ok (188ms)
  runs the real sagas local-path scaffolder through plugin install ... ok (134ms)
  previews the real sagas local-path scaffolder without writing files ... ok (101ms)
  reruns the real sagas scaffolder idempotently ... ok (196ms)
  runs the real triggers local-path scaffolder through plugin install ... ok (136ms)
  previews the real triggers local-path scaffolder without writing files ... ok (102ms)
  reruns the real triggers scaffolder idempotently ... ok (222ms)
  runs the real streams local-path scaffolder through plugin install ... ok (121ms)
  previews the real streams local-path scaffolder without writing files ... ok (95ms)
  reruns the real streams scaffolder idempotently ... ok (206ms)
  reconciles dependency-derived plugin references independently of install order ... ok (680ms)
  runs the real auth local-path scaffolder through plugin install ... ok (133ms)
  previews the real auth local-path scaffolder without writing files ... ok (88ms)
  reruns the real auth scaffolder idempotently ... ok (213ms)
public install plugin flow ... ok (6s)
running 2 tests from ./packages/cli/src/public/features/plugins/install/manifest-service-shape_test.ts
shipped manifests preserve their declared appsettings projections ... ok (15ms)
manifest provider normalization converts an absent service entrypoint to null once ... ok (9ms)
running 1 test from ./packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts
resolvePluginPackageSpec ...
  resolves bare aliases to verified NetScript plugin packages ... ok (0ms)
  resolves the AI bare alias to the published NetScript AI plugin package ... ok (0ms)
  passes scoped package names through unchanged ... ok (1ms)
  passes explicit JSR package specs through unchanged ... ok (0ms)
  rejects malformed package specs ... ok (1ms)
resolvePluginPackageSpec ... ok (8ms)
running 1 test from ./packages/cli/src/public/features/plugins/install/plugin-trust-tier_test.ts
classifyPluginTrust ...
  classifies @netscript packages as trusted first-party plugins ... ok (1ms)
  classifies non-NetScript packages as third-party plugins requiring confirmation ... ok (1ms)
classifyPluginTrust ... ok (5ms)
running 2 tests from ./packages/cli/src/public/features/plugins/list/list-plugins-command_test.ts
plugin list succeeds for config-registered plugin without userland scaffold manifest ...
------- post-test output -------
Name	DisplayName	Type	Enabled	Workdir	Service	Port	Axis	Contributions
workers	Workers	-	true	workers	-	-	jobs	0
----- post-test output end -----
plugin list succeeds for config-registered plugin without userland scaffold manifest ... ok (14ms)
plugin list reports configured-module identity across first-party topology shapes ... ok (11ms)
running 1 test from ./packages/cli/src/public/features/plugins/new/new-plugin_test.ts
plugin new use case ...
  registers a generated plugin by default ... ok (10ms)
  writes a dual-tier proxy plugin without template files ... ok (3ms)
  normalizes package names into deterministic tier paths ... ok (1ms)
  skips existing files unless overwrite is enabled ... ok (2ms)
plugin new use case ... ok (20ms)
running 3 tests from ./packages/cli/src/public/features/plugins/remove/remove-plugin_test.ts
plugin remove resolves a configured bare name before dispatch and preserves state on failure ... ok (8ms)
plugin remove rolls back every owned path when regeneration fails after mutation ... ok (4ms)
public plugin install then bare-name remove restores owned state and leaves doctor clean ... ok (215ms)
running 1 test from ./packages/cli/src/public/features/plugins/scaffold/scaffold-plugin_test.ts
plugin scaffold use case ...
  writes registered plugin skeleton templates with semantic substitutions ... ok (5ms)
  skips existing files unless overwrite is enabled ... ok (2ms)
  resolves default target and variables from scoped package names ... ok (0ms)
  rejects templates with missing variables ... ok (1ms)
plugin scaffold use case ... ok (13ms)
running 4 tests from ./packages/cli/src/public/features/root/command-registry_test.ts
public command registry keeps top-level public command order stable ... ok (1ms)
public command registry passes in-memory context to command factories ... ok (351µs)
public command registry rejects duplicate top-level command names ... ok (1ms)
public command registry exposes deploy targets through a string-keyed port registry ... ok (504µs)
running 3 tests from ./packages/cli/src/public/features/root/public-command-tree_test.ts
public root command reports the package version ... ok (30ms)
public init --dry-run leaves the target directory absent ...
------- post-test output -------
╔═════════════════════════════════════════════════════════════╗
║              NetScript — Scaffold New Project               ║
╚═════════════════════════════════════════════════════════════╝

📁 Creating project "dry-run-zero"...
   ✓ Project root (deno.json, netscript.config.ts, .gitignore, README.md)
   ✓ Frontend app "dry-run-zero-web" (Fresh framework)
   ✓ Contracts (v1 stub)
   ✓ Plugins (empty registry)
  [dry-run] Would create 149 files, 23 directories

  No files were written. Remove --dry-run to execute.
----- post-test output end -----
public init --dry-run leaves the target directory absent ... ok (64ms)
public init emits resolvable app conventions with and without the example service ...
------- post-test output -------
╔═════════════════════════════════════════════════════════════╗
║              NetScript — Scaffold New Project               ║
╚═════════════════════════════════════════════════════════════╝

📁 Creating project "with-service"...
   ✓ Project root (deno.json, netscript.config.ts, .gitignore, README.md)
   ✓ Frontend app "dashboard" (Fresh framework)
   ✓ Contracts (v1 with users stub)
   ✓ Example service "users" (oRPC handler, Aspire assigns its port)
   ✓ Plugins (empty registry)
   ✓ Output formatted (deno fmt)

✅ Project scaffolded successfully in 0.3s

  Created: 175 files, 37 directories

Next steps:
  1. cd with-service
  2. deno task --cwd apps/dashboard dev  # start Fresh dev server
  3. # oRPC service "users" at http://localhost:52514/api/rpc

╔═════════════════════════════════════════════════════════════╗
║              NetScript — Scaffold New Project               ║
╚═════════════════════════════════════════════════════════════╝

📁 Creating project "without-service"...
   ✓ Project root (deno.json, netscript.config.ts, .gitignore, README.md)
   ✓ Frontend app "dashboard" (Fresh framework)
   ✓ Contracts (v1 stub)
   ✓ Plugins (empty registry)
   ✓ Output formatted (deno fmt)

✅ Project scaffolded successfully in 0.2s

  Created: 149 files, 23 directories

Next steps:
  1. cd without-service
  2. deno task --cwd apps/dashboard dev  # start Fresh dev server

----- post-test output end -----
public init emits resolvable app conventions with and without the example service ... ok (525ms)
running 1 test from ./packages/cli/src/public/features/services/add-handler/add-service-handler_test.ts
service add-handler verifies the contract then appends a router stub ... ok (5ms)
running 1 test from ./packages/cli/src/public/features/services/add/add-service_test.ts
public add service flow ...
  plans a service add request from project metadata ... ok (4ms)
  writes service and contract files with JSR imports ... ok (6ms)
public add service flow ... ok (15ms)
running 2 tests from ./packages/cli/src/public/features/services/configure/mutate-service-config_test.ts
service ref add/remove mutates appsettings and regenerates in one operation ... ok (11ms)
service set updates port/enabled and regenerates helpers ... ok (2ms)
running 1 test from ./packages/cli/src/public/features/services/remove/remove-service_test.ts
service remove reverses workspace, appsettings, contract, and helper mutations ... ok (5ms)
running 1 test from ./packages/cli/src/public/features/ui/add/add-ui-command_test.ts
ui:add help explains the page island query-loader triad ... ok (13ms)
running 8 tests from ./packages/cli/src/public/features/ui/registry.test.ts
resolveRegistryItems installs the official theme by default ... ok (2ms)
resolveRegistryItems substitutes a theme override for theme dependencies ... ok (284µs)
resolveRegistryItems applies theme overrides through collections ... ok (149µs)
resolveRegistryItems rejects a theme override that is not a theme item ... ok (752µs)
resolveRegistryItems rejects an unknown theme override ... ok (412µs)
registryManifestModuleUrl resolves manifest outside the copy payload ... ok (931µs)
DEFAULT_UI_INIT_ITEMS installs the scaffold foundation and floating styles ... ok (110µs)
installUiRegistryItems uses embedded content by default ... ok (1ms)
running 7 tests from ./packages/cli/src/public/features/ui/ui-app-root-command_test.ts
ui commands resolve the sole Fresh app and never write the workspace root ...
------- post-test output -------
Generated 1 Fresh page files.
----- post-test output end -----
ui commands resolve the sole Fresh app and never write the workspace root ... ok (37ms)
ui commands accept --app and select the named Fresh app ...
------- post-test output -------
Generated 1 Fresh page files.
----- post-test output end -----
ui commands accept --app and select the named Fresh app ... ok (7ms)
ui commands infer the Fresh app from an app descendant cwd ...
------- post-test output -------
Generated 1 Fresh page files.
----- post-test output end -----
ui commands infer the Fresh app from an app descendant cwd ... ok (7ms)
ui commands reject an ambiguous workspace and name every candidate app ... ok (7ms)
every ui command help documents --app ... ok (14ms)
ambiguous ui command process exits non-zero and prints actual candidate apps ... ok (646ms)
UiAddCommandInput exposes every accepted option ... ok (288µs)
running 1 test from ./packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator_test.ts
FetchJsrPluginValidator ...
  returns a validated plugin descriptor for a published NetScript manifest ... ok (6ms)
  installs the CLI's own release version rather than latest ... ok (1ms)
  resolves the semver-greatest prerelease when JSR latest is null ... ok (2ms)
  skips yanked versions when falling back from null latest ... ok (1ms)
  reports invalid metadata when no non-yanked version is installable ... ok (0ms)
  reports missing JSR packages as not found ... ok (0ms)
  reports yanked latest versions ... ok (0ms)
  reports packages that do not publish scaffold.plugin.json ... ok (0ms)
  reports invalid plugin manifests without executing package code ... ok (1ms)
FetchJsrPluginValidator ... ok (19ms)
running 3 tests from ./packages/cli/src/public/infra/jsr/verify-jsr-package-integrity_test.ts
fetchJsrPackageSchemaFragments returns checksum-verified schema content ... ok (2ms)
fetchJsrPackageSchemaFragments rejects tampered schema content ... ok (836µs)
fetchJsrPackageSchemaFragments rejects a schema without a checksum ... ok (752µs)
running 1 test from ./packages/cli/src/public/infra/permissions/plugin-scaffold-permissions_test.ts
buildPluginScaffoldPermissionFlags ...
  uses the trusted deno x permission level for first-party plugins ... ok (1ms)
  allows the fresh alpha dependency-age exception only for first-party opt-in ... ok (1ms)
  confines third-party plugins to project reads, scoped writes, and denied net/run ... ok (1ms)
  does not inject the minimum dependency age bypass for third-party plugins ... ok (0ms)
buildPluginScaffoldPermissionFlags ... ok (9ms)
running 3 tests from ./packages/cli/testing_test.ts
createInMemoryProcess records calls and returns queued results ... ok (934µs)
createInMemoryPrompt replays scripted answers ... ok (367µs)
buildMinimalScaffoldPlan applies overrides ... ok (271µs)
running 4 tests from ./packages/cli/e2e/fixtures/desktop-native/tests/fixture-contract_test.ts
renderer contract acknowledges a response fetched through services__remote__http__0 ... ok (27ms)
release signing fixture exports PKCS8 PEM and verifiable raw public key ... ok (2ms)
renderer entrypoint bundles for a browser without ambient binding declarations ... ok (114ms)
desktop package task forwards target and output flags before the entrypoint ... ok (355µs)
running 5 tests from ./packages/cli/e2e/src/application/gates/quickstart/database-integrity-walk_test.ts
pgDataFromEnv reads PGDATA from docker inspect Env ... ok (3ms)
resolvePgDataPath prefers PGDATA env over host layout ... ok (1ms)
resolvePgDataPath finds nested Postgres 18 PGDATA on a readable host tree ... ok (10s)
resolvePgDataPath keeps flat PGDATA at the mount root ... ok (10s)
resolvePgDataPath fails closed when pg_control is absent ... ok (1s)
running 1 test from ./packages/cli/e2e/src/application/gates/scaffold/run-documented-stream-example_test.ts
unchanged documented native EventSource example consumes named SSE ... ok (222ms)
running 5 tests from ./packages/cli/e2e/src/application/gates/scaffold/select-flow-b-stream-change_test.ts
selectFlowBStreamChange skips startup snapshots and selects one execution record ... ok (2ms)
selectFlowBStreamChange exhaustion names expected and observed correlations ... ok (1ms)
selectFlowBStreamChange enforces the total wait bound between batches ... ok (497µs)
TC-14 rejects a matched record without traceparent ... ok (449µs)
TC-14 rejects a matched record whose trace differs from the producer ... ok (189µs)
running 8 tests from ./packages/cli/e2e/src/application/gates/scaffold/service-env/discover-service-subjects_test.ts
discovery: reads names, workdirs, entrypoints and declared entries ... ok (1ms)
discovery: prefers the canonical Environment over the deprecated alias ... ok (225µs)
discovery: selects the subject deterministically and skips disabled services ... ok (404µs)
discovery: refuses a project with no enabled service ... ok (1ms)
discovery: returns every service that declares an environment ... ok (381µs)
discovery: refuses to pass by matching nothing when no service declares env ... ok (332µs)
discovery: refuses a config whose shape it cannot read ... ok (473µs)
discovery: derives the engine URI key the way the compat helper does ... ok (292µs)
running 7 tests from ./packages/cli/e2e/src/application/gates/scaffold/service-env/process-evidence_test.ts
process evidence: parses the NUL-separated environ blob ... ok (835µs)
process evidence: keeps a value that itself contains = ... ok (104µs)
process evidence: ignores malformed and empty entries ... ok (192µs)
process evidence: identifies a process by the injected resource name ... ok (110µs)
process evidence: refuses an empty scan instead of reporting success ... ok (827µs)
process evidence: returns what the scan identified ... ok (78µs)
process evidence: reads a real process environment through /proc ... ok (53ms)
running 21 tests from ./packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-evidence_test.ts
contract: covers every documented category, in both directions ... ok (786µs)
topology evidence: accepts a running resource that honors the contract ... ok (465µs)
topology evidence: reads a DCP-suffixed instance id ... ok (340µs)
topology evidence: reads the array-shaped environment ... ok (229µs)
topology evidence: requires an explicitly running state, not merely a non-terminal one ... ok (647µs)
topology evidence: accepts Running and Healthy under either spelling shape ... ok (392µs)
topology evidence: reports every missing declared entry at once ... ok (190µs)
topology evidence: catches an inverted precedence per category ... ok (478µs)
topology evidence: catches a refused key that was applied anyway ... ok (220µs)
topology evidence: refuses to guess when the resource is absent ... ok (952µs)
topology evidence: refuses output that carries no JSON ... ok (270µs)
process evidence: accepts a process that honors every category ... ok (647µs)
process evidence: refuses an empty case list rather than passing vacuously ... ok (280µs)
process evidence: catches a declared value the process never observed ... ok (258µs)
process evidence: catches every inverted category in the running process ... ok (475µs)
process evidence: catches a generated OTel identity that is not the resource ... ok (184µs)
process evidence: catches an engine URI that drifted from DATABASE_URL ... ok (200µs)
process evidence: catches a discovery URL that is not an allocated endpoint ... ok (136µs)
process evidence: catches a refused PORT that reached the process ... ok (76µs)
process evidence: catches a process with no PORT at all ... ok (181µs)
process evidence: catches the stale database literals winning in the process ... ok (177µs)
running 4 tests from ./packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-gates_test.ts
service env gates: the behavior gate can read /proc with the flags it declares ... ok (96ms)
service env gates: the fixture gate can spawn the CLI and rewrite appsettings ... ok (46ms)
service env gates: the probe fails when a declared flag is taken away ... ok (47ms)
service env gates: every gate command names a script that exists ... ok (684µs)
running 5 tests from ./packages/cli/e2e/src/application/gates/scaffold/validate-aspire-task-traces_test.ts
parseNonEmptyTraceArray accepts task banners before trace JSON ... ok (1ms)
parseNonEmptyTraceArray rejects empty task output ... ok (1ms)
resourceInstanceName resolves the suffixed DCP resource name ... ok (464µs)
resourceCandidates orders model, display, and running instance identities ... ok (122µs)
resourceCandidates deduplicates a suffixed describe identity ... ok (279µs)
running 2 tests from ./packages/cli/e2e/src/application/gates/scaffold/validate-flow-b-traces_test.ts
TC-14 zero-link diagnostic names producer and consumer identities ... ok (1ms)
TC-14 wrong-link diagnostic prints every link identity and count ... ok (584µs)
running 3 tests from ./packages/cli/e2e/src/application/gates/scaffold/verify-producer-reconnect_test.ts
parseProducerReconnectResult accepts the probe marker only ... ok (26ms)
assertProducerReconnectTrace requires one trace across every reconnect event ... ok (2ms)
assertProducerReconnectMetrics requires retry recovery and delivered receipts ... ok (744µs)
running 4 tests from ./packages/cli/e2e/tests/adapters/commands/docker-resource-cleaner_test.ts
docker cleaner treats an absent docker binary as an empty snapshot ... ok (1ms)
docker cleaner treats a non-zero docker ps as an empty snapshot ... ok (383µs)
docker cleaner returns no resources when the snapshot has no new containers ... ok (808µs)
docker cleaner still throws when removing a created container fails ... ok (567µs)
running 4 tests from ./packages/cli/e2e/tests/adapters/reporting/pretty-reporter_test.ts
pretty reporter aggregate exposes skipped and deferred gate count ... ok (66ms)
pretty reporter surfaces a failed command reason and stderr ... ok (792µs)
pretty reporter distinguishes a retried pass ... ok (341µs)
pretty reporter prints every attempt duration when retries fail ... ok (363µs)
running 1 test from ./packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts
agent mcp real CLI stdio smoke ...
------- post-test output -------
╔═════════════════════════════════════════════════════════════╗
║              NetScript — Scaffold New Project               ║
╚═════════════════════════════════════════════════════════════╝

📁 Creating project "stdio-scaffold"...
   ✓ Project root (deno.json, netscript.config.ts, .gitignore, README.md)
   ✓ Frontend app "dashboard" (Fresh framework)
   ✓ Contracts (v1 stub)
   ✓ Plugins (empty registry)
   ✓ Output formatted (deno fmt)

✅ Project scaffolded successfully in 0.2s

  Created: 149 files, 23 directories

Next steps:
  1. cd stdio-scaffold
  2. deno task --cwd apps/dashboard dev  # start Fresh dev server

----- post-test output end -----
agent mcp real CLI stdio smoke ... ok (2s)
running 18 tests from ./packages/cli/e2e/tests/application/builders/runtime-gates_test.ts
runtime Aspire restore has a bounded infrastructure retry budget ... ok (2ms)
runtime aspire start gate captures detached endpoint metadata ... ok (379µs)
live DB endpoint gate reads the detached dashboard metadata path ... ok (326µs)
app home gate hands the probe a project and an AppHost to resolve the port from ... ok (391µs)
app home gate can reach a localhost endpoint, not only 127.0.0.1 ... ok (453µs)
app reference gate runs the real browser probe for the project-derived app ... ok (351µs)
runtime gates wait for postgres resource by default ... ok (262µs)
runtime app wait derives the resource name from the scaffold project ... ok (204µs)
runtime gates include durable workers and sagas CLI parity ... ok (382µs)
runtime gates prove MCP Aspire endpoint discovery against the live AppHost ... ok (308µs)
project boundary gate requires the project-derived app name ... ok (575µs)
workers wait gate requires runtime startup evidence before behavior gates ... ok (260µs)
runtime gates enumerate every KV-backed first-party background runtime ... ok (372µs)
AI chat route gate captures generated registry import failures ... ok (214µs)
runtime gates wait for mysql resource when mysql is selected ... ok (130µs)
runtime gates skip database resource wait for sqlite ... ok (111µs)
runtime service health gate asserts only the selected sqlite adapter ... ok (245µs)
runtime gates wait for mssql resource with extended timeout when mssql is selected ... ok (289µs)
running 3 tests from ./packages/cli/e2e/tests/application/builders/suite-builder_test.ts
defineCliE2eSuite materializes scaffold.plugins with gates ... ok (3ms)
defineCliE2eSuite rejects suites without gates ... ok (1ms)
defineCliE2eSuite rejects an empty suite id ... ok (393µs)
running 2 tests from ./packages/cli/e2e/tests/application/builders/workspace-options_test.ts
defaultRunOptions targets the maintainer binary entrypoint ... ok (874µs)
withRepoRootOption derives the maintainer binary entrypoint from the repo root ... ok (244µs)
running 1 test from ./packages/cli/e2e/tests/application/gates/aspire-dashboard-telemetry_test.ts
live Aspire fetch normalizes trace and log OTLP envelopes ... ok (9ms)
running 9 tests from ./packages/cli/e2e/tests/application/gates/command-gate_test.ts
command gate never retries an assertion failure ... ok (1ms)
command gate retries a timeout and records a passing second attempt ... ok (350µs)
command gate classifies the Deno cancellation marker and retries it ... ok (253µs)
command gate treats exit 6 without the cancellation marker as an assertion ... ok (181µs)
command gate distinguishes Deno argument parsing from a product assertion ... ok (242µs)
command gate keeps an immediate non-parser failure classified as a product assertion ... ok (158µs)
command gate preserves both timeout durations after retries are exhausted ... ok (164µs)
command gate without retry configuration executes once ... ok (105µs)
command gate honors a per-gate timeout and three-attempt infrastructure budget ... ok (542µs)
running 5 tests from ./packages/cli/e2e/tests/application/gates/configure-published-workers-block_test.ts
published workers rewrite preserves one existing dependency-age argument ... ok (1ms)
published workers rewrite adds one missing dependency-age argument ... ok (273µs)
published workers rewrite accepts a formatted Deno argument array ... ok (133µs)
published workers rewrite adds dependency age to a formatted argument array ... ok (143µs)
published workers rewrite rejects a block without the Deno config pair ... ok (780µs)
running 19 tests from ./packages/cli/e2e/tests/application/gates/generated-app-endpoint_test.ts
readPinnedAppPort returns the port the project declares, not a default ... ok (9ms)
readPinnedAppPort still honours the legacy Port spelling ... ok (1ms)
the app home URL follows a pinned port rather than a guessed one ... ok (1ms)
a pristine scaffold pins no port, and that is not an error ... ok (1ms)
an app absent from appsettings pins nothing ... ok (2ms)
a non-numeric pinned port is reported, never coerced ... ok (2ms)
readPinnedAppPort reports an unreadable appsettings rather than guessing ... ok (2ms)
the app endpoint comes from the resource's declared urls[] ... ok (673µs)
resolution never returns the dashboard link or a sibling service URL ... ok (262µs)
a resource resolves by displayName even though name is suffixed ... ok (84µs)
a relationship stub is never mistaken for the resource ... ok (124µs)
appUrlsFromDescribeOutput tolerates a banner before the JSON ... ok (196µs)
appUrlsFromDescribeOutput names what was missing ... ok (584µs)
app-home probe does not retry terminal endpoint resolution failures ... ok (1ms)
app-home probe retries while aspire describe has not registered the endpoint ... ok (5ms)
app-home probe bounds a resource endpoint that never appears ... ok (1ms)
app-home diagnostics extract the Fresh overlay error and stack ... ok (345µs)
app-home diagnostics retain a useful bounded fallback for unknown responses ... ok (116µs)
app-home exhaustion includes the app resource logs ... ok (1ms)
running 1 test from ./packages/cli/e2e/tests/application/gates/http-gate_test.ts
HTTP gate retries transient request failures within the gate deadline ... ok (263ms)
running 3 tests from ./packages/cli/e2e/tests/application/gates/local-source-fixture_test.ts
resolveLocalSourceImports maps an explicit package set from its source base ... ok (981µs)
prepareLocalSourceFixture rewrites selected generated workspace targets ... ok (7ms)
localSourceFixtureScript prepares a generated project through deno eval ... ok (40ms)
running 3 tests from ./packages/cli/e2e/tests/application/gates/probe-app-reference_test.ts
reference probe renders every named state at desktop and mobile viewports ... ok (2ms)
reference probe rejects the old route with no rendered state marker ... ok (1ms)
reference probe reports a missing semantic marker from the rendered browser DOM ... ok (359µs)
running 3 tests from ./packages/cli/e2e/tests/application/gates/quickstart-aspire-walk_test.ts
bounded Aspire walk runs restore, start, then waits for postgres ... ok (958µs)
bounded Aspire walk classifies restore timeout with #1227 and stops ... ok (509µs)
bounded Aspire walk classifies start timeout independently ... ok (160µs)
running 10 tests from ./packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts
generated explicit-any probe source remains byte-identical ... ok (1ms)
--source jsr accepts the local public CLI binary ... ok (1ms)
scaffold init default command remains byte-identical ... ok (343µs)
scaffold runtime exercises the generated service port default ... ok (201µs)
scaffold init disables the cache exactly once ... ok (264µs)
--source jsr rejects the local contributor CLI binary ... ok (655µs)
generated check runs the fresh scaffold workspace check task ... ok (189µs)
generated quality probes cover TS, TSX, plugin, background, and AppHost surfaces ... ok (96µs)
scaffold contract add gate targets the generated workspace ... ok (289µs)
published AI lifecycle gate reuses the published CLI version ... ok (485µs)
running 2 tests from ./packages/cli/e2e/tests/application/gates/scaffold/generated-app-identity-source-policy_test.ts
scaffold gate scripts do not assume the legacy generated app identity ... ok (20ms)
repo tests that scaffold a default app do not assume the legacy app directory ... ok (304ms)
running 3 tests from ./packages/cli/e2e/tests/application/gates/scaffold/plugin-contract-gates_test.ts
plugin contract gates select runtime schemas and the complete AI namespace ... ok (1ms)
AI appsettings gate rejects only service configuration attributed to AI ... ok (100ms)
doctor negative gate observes failure and restores the configured module ... ok (85ms)
running 3 tests from ./packages/cli/e2e/tests/application/gates/scaffold/ui-ai-gates_test.ts
ui AI gate rejects the old workspace-root layout and accepts the Fresh app layout ... ok (78ms)
ui AI install gate selects the generated Fresh app from the workspace ... ok (648µs)
every UI AI assertion runs in the app and local imports stay workspace-relative ... ok (431µs)
running 7 tests from ./packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts
database endpoint ports match across URL and keyword dialects ... ok (2ms)
database endpoint comparison rejects deliberately mismatched ports ... ok (376µs)
database endpoint comparison names an unparseable side and its value ... ok (367µs)
database health matcher accepts the captured users response contract ... ok (337µs)
database health matcher rejects an unhealthy database fixture ... ok (186µs)
users telemetry correlation reports the compared ids and candidate spans ... ok (358µs)
users telemetry correlation polls until logs and traces converge ... ok (441µs)
running 1 test from ./packages/cli/e2e/tests/application/runner/gate-runner_test.ts
platform-inapplicable gate emits machine-readable NOT_RUN without execution ... ok (2ms)
running 2 tests from ./packages/cli/e2e/tests/application/runner/suite-lease_test.ts
second acquire refuses while the recorded holder pid is alive ... ok (1ms)
dead holder is declared stale, removed, and replaced ... ok (890µs)
running 9 tests from ./packages/cli/e2e/tests/application/runner/suite-runner_test.ts
suite runner reports every #1398 deferral as an explicit skipped step ... ok (6ms)
suite runner emits a failed report and prunes only created Docker resources ... ok (2ms)
suite runner skips cleanup phase when cleanup is disabled ... ok (4ms)
suite runner completes cleanup with a Docker-less cleaner ... ok (2ms)
suite runner cleans up after a targeted non-cleanup gate when cleanup is enabled ... ok (858µs)
suite runner can target cleanup gate without suite cleanup enabled ... ok (732µs)
suite runner releases the expensive-suite lease when suite execution throws ... ok (1ms)
expensive runtime suites contend for one lease in both directions ... ok (821µs)
suite runner does not interact with the lease for a cheap suite ... ok (491µs)
running 1 test from ./packages/cli/e2e/tests/application/verify-clean-clone-readme_test.ts
clean-clone README gate reports a missing binary ... ok (124ms)
running 9 tests from ./packages/cli/e2e/tests/presentation/cli-options_test.ts
mapRunOptions keeps defaults by omitting undefined values ... ok (819µs)
mapRunOptions accepts sqlite database axis ... ok (123µs)
mapRunOptions maps --no-cache ... ok (55µs)
mapRunOptions maps --cache ... ok (117µs)
mapRunOptions rejects unsupported database values ... ok (655µs)
mapRunOptions rejects unsupported plugin values ... ok (434µs)
mapRunOptions accepts ai plugin axis ... ok (227µs)
mapRunOptions accepts mssql database axis ... ok (280µs)
mapRunOptions reports all supported database axes ... ok (214µs)
running 4 tests from ./packages/cli/e2e/tests/presentation/cli-program_test.ts
bare CLI command runs the full scaffold runtime suite with cleanup ... ok (5ms)
full CLI command accepts run options and runs runtime suite ... ok (1ms)
run command lets sqlite runtime suite defaults win unless flags override them ... ok (1ms)
run command keeps explicit postgres above sqlite runtime suite default ... ok (896µs)
running 1 test from ./packages/cli/e2e/tests/presentation/init-json_test.ts
netscript init --json emits a single structured object ... ok (538ms)
running 1 test from ./packages/cli/e2e/tests/presentation/quickstart-command-drift_test.ts
Quickstart executable commands stay aligned with quickstart.walk ... ok (1ms)
running 5 tests from ./packages/cli/e2e/tests/presentation/quickstart-walk-suite_test.ts
quickstart walk exposes exactly seven independently named verdicts before cleanup ... ok (2ms)
quickstart service-add verdict initializes first, adds users, and checks that service ... ok (757µs)
quickstart project-check verdict runs the documented command exactly ... ok (344µs)
quickstart service-response verdict accepts service health without a database assertion ... ok (448µs)
quickstart commands reject a local CLI entrypoint ... ok (909µs)
running 18 tests from ./packages/cli/e2e/tests/presentation/suite-registry_test.ts
registry exposes scaffold capability suites from constants ... ok (1ms)
native desktop suite is registered with an honest fixture preflight ... ok (1ms)
capability suites select only their scoped gates ... ok (2ms)
plugin suite includes all official plugin and generated-check gates ... ok (605µs)
true userland suite runs init, four no-samples plugin installs, assertion, and cleanup ... ok (2ms)
runtime suite includes full scaffold, database, runtime, and behavior gates ... ok (1ms)
runtime suites pin the exact #1398 OTEL deferral without widening it ... ok (1ms)
runtime suite waits for the generated app and requests its home page ... ok (568µs)
runtime DB mutations run only after the resident AppHost starts ... ok (692µs)
runtime suite omits database resource wait for sqlite ... ok (602µs)
sqlite runtime suite resolves its reduced-container defaults without mutating cache mode ... ok (709µs)
runtime suites declare service environment before start and verify it after (#1447) ... ok (639µs)
sqlite runtime suite excludes Postgres-only database evidence gates ... ok (591µs)
sqlite runtime suite keeps explicit database overrides above suite defaults ... ok (377µs)
runtime suite wait matrices match runtime resources for postgres and sqlite ... ok (832µs)
runtime suite selects mssql database resource wait for mssql ... ok (345µs)
capability defaults are a baseline and caller overrides select database gates ... ok (375µs)
existing built-in suites preserve their exact resolved options ... ok (2ms)
running 4 tests from ./packages/config/tests/_fixtures/readme-examples_test.ts
README examples: define and inspect config ... ok (3ms)
README examples: resolve env defaults ... ok (184µs)
README examples: merge plugin contribution ... ok (289µs)
README examples: use paths and plugin schema fragments ... ok (1ms)
running 3 tests from ./packages/config/tests/merge/merge_test.ts
mergePartialConfig: merges object sections without mutating base ... ok (3ms)
mergePartialConfig: a deploy fragment replaces the whole targets map ... ok (1ms)
mergePartialConfig: replaces duplicate database entries by name ... ok (372µs)
running 14 tests from ./packages/config/tests/schema/deploy_schema_test.ts
DockerComposeDeployTargetSchema inherits the shared base fields (spread, no base class) ... ok (2ms)
DockerComposeDeployTargetSchema defaults the deno base image to denoland/deno:2 ... ok (792µs)
DockerComposeDeployTargetSchema accepts compose/registry-specific fields ... ok (301µs)
DeployConfigSchema exposes windows, docker and compose target keys ... ok (2ms)
AspireAppHostDeployTargetSchema inherits the shared base and AppHost fields ... ok (1ms)
AspireCloudDeployTargetSchema remains an AppHost-target alias ... ok (266µs)
CloudRunDeployTargetSchema owns the Docker-image provider fields ... ok (1ms)
DeployConfigSchema exposes kubernetes, azure, and cloud-run target keys ... ok (281µs)
LinuxDeployTargetSchema round-trips systemd fields ... ok (763µs)
DeployConfigSchema accepts sibling windows + linux targets ... ok (284µs)
DeployConfigSchema accepts a linux-only target ... ok (247µs)
shared base carries the activation/secrets/otel convention blocks (spread, R-DEPLOY-3) ... ok (1ms)
activation.strategy rejects an unknown swap strategy ... ok (1ms)
the convention blocks are optional on every target member ... ok (179µs)
running 8 tests from ./packages/config/tests/schema/netscript_config_test.ts
defineConfig: applies defaults to validated saga and trigger sections ... ok (3ms)
defineConfig: accepts legacy project and TS entrypoint AppHost paths ... ok (644µs)
defineConfig: accepts a deploy.targets.windows target ... ok (2ms)
defineConfig: accepts a deploy.targets[deno-deploy] target ... ok (1ms)
defineConfig: accepts windows and deno-deploy targets side by side ... ok (335µs)
defineConfig: does not honor the legacy deploy.windows shape (clean break) ... ok (110µs)
defineConfig: drops unknown deploy.targets keys ... ok (2ms)
defineConfig: rejects unrelated saga and trigger section shapes ... ok (1ms)
running 3 tests from ./packages/config/tests/schema/plugins_test.ts
pluginEntrySchema: applies appsettings defaults for plugin services ... ok (2ms)
backgroundProcessorEntrySchema: applies appsettings defaults for processors ... ok (1ms)
installedVersionSchema: rejects empty version metadata ... ok (1ms)
running 1 test from ./packages/config/tests/schema/service_schema_test.ts
ServiceConfigSchema accepts plugin API references ... ok (2ms)
running 1 test from ./packages/config/workspace.test.ts
discoverWorkspace finds standardized project members ... ok (26ms)
running 2 tests from ./packages/contracts/tests/contracts_test.ts
contracts root exposes pagination and diagnostics primitives ... ok (4ms)
contracts root exposes schema helper factories ... ok (2ms)
running 3 tests from ./packages/contracts/tests/errors_test.ts
getResourceType falls back to resource for empty paths ... ok (718µs)
getResourceType skips version segments and singularizes resources ... ok (179µs)
validationFailed throws a VALIDATION_ERROR envelope via the errors object ... ok (627µs)
running 3 tests from ./packages/contracts/tests/schema-types_test.ts
schema types retain distinct coerced input and parsed output ... ok (3ms)
generic schema factories retain item input and output types ... ok (2ms)
CRUD markers retain the configured identifier schema ... ok (2ms)
running 1 test from ./packages/cron/tests/abort-cleanup_test.ts
MemoryCronAdapter stop aborts jobs and clears scheduler timers ... ok (89ms)
running 4 tests from ./packages/cron/tests/memory-adapter_test.ts
MemoryCronAdapter schedules, triggers, and tracks runs ... ok (15ms)
MemoryCronAdapter emits jobError and records lastError ... ok (1ms)
MemoryCronAdapter enable and disable toggles job state ... ok (692µs)
MemoryCronAdapter rejects invalid expressions ... ok (1ms)
running 12 tests from ./packages/cron/tests/retry-backoff_test.ts
memory retries to success with aggregate invocation semantics ... ok (16ms)
memory reports exhausted retries once at the terminal attempt ... ok (10ms)
memory applies fixed, exponential, linear, and capped backoff ... ok (57ms)
memory aborts a registration during backoff without another attempt ... ok (6ms)
memory stop aborts backoff without another attempt ... ok (5ms)
memory defaults to zero retries ... ok (885µs)
deno retries to success with aggregate invocation semantics ... ok (11ms)
deno reports exhausted retries once at the terminal attempt ... ok (9ms)
deno applies fixed, exponential, linear, and capped backoff ... ok (57ms)
deno aborts a registration during backoff without another attempt ... ok (4ms)
deno stop aborts backoff without another attempt ... ok (5ms)
deno defaults to zero retries ... ok (528µs)
running 2 tests from ./packages/cron/tests/scheduler_test.ts
createScheduler returns memory adapter when requested ... ok (690µs)
getScheduler returns a shared instance until stopped ... ok (243µs)
running 3 tests from ./packages/cron/tests/types_test.ts
CronPresets expose valid expressions ... ok (2ms)
isValidCronExpression validates common cases ... ok (65µs)
parseCronExpression parses valid expressions ... ok (336µs)
running 2 tests from ./packages/database/tests/_fixtures/docs-examples_test.ts
docs: builds a PostgreSQL connection string from parts ... ok (17ms)
docs: mock adapter follows basic lifecycle ... ok (530µs)
running 1 test from ./packages/database/tests/adapter-contract_test.ts
mock database adapter: connects, reports status, executes, and disconnects ... ok (1ms)
running 3 tests from ./packages/database/tests/migrate-artifacts_test.ts
migration creation reports and verifies created and applied artifacts ... ok (7ms)
headless migrate never aliases deploy and fails when no artifact is created ... ok (1ms)
no-change migration is a non-zero result with empty created and applied sets ... ok (1ms)
running 2 tests from ./packages/database/tests/migrate-retry_test.ts
isRetriableMigrationFailure ...
  matches the schema-engine premature-close signature ... ok (2ms)
  does not match real schema/SQL errors ... ok (0ms)
isRetriableMigrationFailure ... ok (6ms)
runPrismaWithRetry ...
  does not read inherited stderr after an interactive spawn ... ok (7ms)
  retries the transient failure and then succeeds ... ok (1ms)
  retries a database-not-ready failure and then succeeds ... ok (0ms)
  stops at maxAttempts when the transient failure persists ... ok (0ms)
  caps exponential retry delays ... ok (1ms)
  never retries a real schema error (no masking) ... ok (0ms)
  runs interactive invocations exactly once with no retry ... ok (0ms)
  returns 0 immediately on first-attempt success ... ok (0ms)
runPrismaWithRetry ... ok (15ms)
running 2 tests from ./packages/database/tests/zod-crud-barrel_test.ts
runWriteCrudZodBarrel emits scaffold CRUD aliases ... ok (10ms)
fixZodImports leaves the upstream model barrel generator-owned ... ok (26ms)
running 2 tests from ./packages/fresh-ui/tests/_fixtures/docs-examples_test.ts
README/getting-started helper flow stays executable ... ok (1ms)
README/getting-started runtime component flow stays executable ... ok (198µs)
running 5 tests from ./packages/fresh-ui/tests/ai/render-ui.test.tsx
renderUiPayload renders nested layout, viz, and data blocks ... ok (2ms)
renderUiPayload truncates payloads beyond the configured max depth ... ok (240µs)
renderUiPayload bounds nested arrays by the max depth guard ... ok (169µs)
renderUiPayload falls back for unknown types without emitting raw markup ... ok (710µs)
documented renderer imports match public subpath export map and fail on root ... ok (5ms)
running 16 tests from ./packages/fresh-ui/tests/chat/parse-blocks.test.ts
parseBlocks: chart JSON body → typed ChartRenderPart ... ok (1ms)
parseBlocks: chart DSL body → normalised to canonical JSON on reload ... ok (458µs)
parseBlocks: donut JSON body with total ... ok (197µs)
parseBlocks: table pipe DSL → columns/rows with alignment ... ok (777µs)
parseBlocks: table JSON body with string columns and array rows ... ok (239µs)
parseBlocks: stats DSL keeps formatted string values ... ok (344µs)
parseBlocks: stats JSON body with numeric value + detail ... ok (152µs)
parseBlocks: line DSL → points series ... ok (578µs)
parseBlocks: line JSON body with title/unit ... ok (178µs)
parseBlocks: malformed fence falls back to a verbatim text part (never throws) ... ok (374µs)
parseBlocks: unknown info-string is left as prose text ... ok (136µs)
parseBlocks: mixed prose + multiple blocks preserves order and text ... ok (350µs)
parseBlocks: plain prose with no fences is a single text part ... ok (179µs)
parseBlocks: adjacent blocks with no prose between round-trip ... ok (262µs)
blockToText: text parts export verbatim; blocks export canonical fences ... ok (56µs)
reload-fidelity property holds across a combined all-kinds fixture ... ok (560µs)
running 1 test from ./packages/fresh-ui/tests/consumer-render.test.tsx
runtime namespaces construct consumer-shaped JSX trees ... ok (654µs)
running 8 tests from ./packages/fresh-ui/tests/data-grid.test.tsx
DataGrid renders a plain row with role-grid structure ... ok (5ms)
DataGrid renders an onSelect row as a selected button row ... ok (423µs)
DataGrid renders an href row as a Fresh client-nav link row ... ok (148µs)
DataGrid renders templated columns and built-in strong and num cells ... ok (147µs)
DataGrid applies column widths as grid-template-columns ... ok (140µs)
DataGrid controlled selection emits row and select-all sets with mixed state ... ok (529µs)
DataGrid checkbox and action cells isolate row activation ... ok (1ms)
DataGrid legacy call shape retains the pre-selection DOM contract ... ok (130µs)
running 6 tests from ./packages/fresh-ui/tests/desktop/desktop-chrome.test.ts
createDesktopChrome no-ops cleanly outside desktop and for partial capabilities ... ok (2ms)
createDesktopChrome wires declarative tray and application menu events ... ok (1ms)
createDesktopChrome validates menu vocabulary before applying it ... ok (1ms)
active desktop chrome exposes only documented window operations ... ok (861µs)
desktop dialogs are gated and preserve native results ... ok (657µs)
desktop notifications request permission, dispatch clicks, and no-op when unavailable ... ok (808µs)
running 7 tests from ./packages/fresh-ui/tests/primitives.test.tsx
VisuallyHidden renders a visually hidden span without dropping caller props ... ok (598µs)
SrOnly is an alias for the visually hidden primitive ... ok (72µs)
VisuallyHidden can be used as a JSX component ... ok (85µs)
Icon renders a decorative token-driven stroke SVG ... ok (113µs)
Icon renders an accessible title when provided ... ok (129µs)
Show renders children only when the condition is truthy ... ok (98µs)
Show supports render functions with the truthy value ... ok (49µs)
running 1 test from ./packages/fresh-ui/tests/registry-doc-drift.test.ts
registry.ts JSDoc collection names match manifest collections ... ok (1ms)
running 3 tests from ./packages/fresh-ui/tests/registry/components/ui/avatar.test.tsx
Avatar sets role + aria-label, defaults to md, derives initials ... ok (5ms)
Avatar honors explicit initials, agent, size, and presence ... ok (310µs)
Avatar single-word name yields two letters ... ok (70µs)
running 3 tests from ./packages/fresh-ui/tests/registry/components/ui/chart-block.test.tsx
ChartBlock defaults to horizontal bars with tones + values ... ok (5ms)
ChartBlock column variant renders y-axis ticks and x labels ... ok (448µs)
ChartBlock scales bar size to a nice axis maximum (no hardcoded color) ... ok (293µs)
running 2 tests from ./packages/fresh-ui/tests/registry/components/ui/citation-chip.test.tsx
CitationChip renders the index as a button with a labelled source ... ok (6ms)
CitationChip active adds is-active + aria-pressed ... ok (496µs)
running 2 tests from ./packages/fresh-ui/tests/registry/components/ui/code-block.test.tsx
CodeBlock renders chrome with filename, lang, copy, and code ... ok (5ms)
CodeBlock omits name/lang when not provided but keeps copy ... ok (216µs)
running 4 tests from ./packages/fresh-ui/tests/registry/components/ui/command-palette.test.tsx
CommandPalette renders the palette structure and group items ... ok (6ms)
CommandPalette renders item icon, hash, and kind sub-parts ... ok (148µs)
CommandPalette renders an empty-state slot with custom copy ... ok (72µs)
CommandPalette composes the Dialog and Combobox L1 primitives ... ok (107µs)
running 3 tests from ./packages/fresh-ui/tests/registry/components/ui/data-table.test.tsx
DataTable.Row applies cols as grid-template-columns ... ok (4ms)
DataTable.Row merges cols with an incoming style object ... ok (137µs)
DataTable.Row without cols carries no grid template (opt-in, no surprise styling) ... ok (48µs)
running 7 tests from ./packages/fresh-ui/tests/registry/components/ui/desktop.test.tsx
DesktopTrayMenu renders the D3 declaration union and stable action IDs ... ok (1ms)
DesktopDialog renders explicit alert/confirm/prompt intents without native side effects ... ok (263µs)
DesktopNotification renders a request preview without requesting permission ... ok (184µs)
DesktopWindowChrome renders only declared documented actions and state ... ok (637µs)
DesktopUpdatePrompt renders the automatic ready-event branch exhaustively ... ok (181µs)
DesktopUpdatePrompt renders the manual Windows installer branch from the event URL ... ok (281µs)
desktop registry items obey the L2 authority chain and form a desktop collection ... ok (1ms)
running 2 tests from ./packages/fresh-ui/tests/registry/components/ui/donut.test.tsx
Donut renders rings, center total, and legend ... ok (4ms)
Donut cycles semantic tones and honors explicit total ... ok (237µs)
running 5 tests from ./packages/fresh-ui/tests/registry/components/ui/dropzone.test.tsx
Dropzone renders a label target with default copy + icon ... ok (4ms)
Dropzone shows hint + active state and keeps children (file input) ... ok (310µs)
Dropzone emits all accepted files from a multi-file drop ... ok (994µs)
Dropzone ingests pasted files from clipboard items ... ok (347µs)
Dropzone applies accept filtering and reports rejected files ... ok (325µs)
running 11 tests from ./packages/fresh-ui/tests/registry/components/ui/foundation.test.tsx
Textarea adds the semantic error class when requested ... ok (5ms)
IconButton composes Button with icon sizing and an accessible label ... ok (279µs)
Progress clamps values and exposes the computed bar width ... ok (419µs)
getInputProps narrows descriptor control props to the Input seam ... ok (178µs)
getSelectProps narrows descriptor control props to the Select seam ... ok (118µs)
Select renders the matching option as selected for server-only initial state ... ok (239µs)
Select preserves multiple selected options in server-rendered markup ... ok (147µs)
getTextareaProps narrows descriptor control props to the Textarea seam ... ok (102µs)
Skeleton stats variant renders the requested number of cards ... ok (329µs)
ResponsiveTable renders semantic table chrome with labeled cells ... ok (320µs)
manifest exposes the expanded foundation and layout collections ... ok (162µs)
running 4 tests from ./packages/fresh-ui/tests/registry/components/ui/message.test.tsx
renderInline produces multiple nodes for bold/code/citation markup ... ok (827µs)
Message renders assistant prose with author, model, body, follow-ups, actions ... ok (4ms)
Message applies user + system role modifiers ... ok (329µs)
TypingIndicator renders the typing seam with a status role ... ok (162µs)
running 3 tests from ./packages/fresh-ui/tests/registry/components/ui/model-selector.test.tsx
ModelSelector renders a details disclosure with the current model ... ok (5ms)
ModelSelector marks the selected option active + alignment ... ok (319µs)
ModelSelector falls back to the first model when value is unknown ... ok (86µs)
running 8 tests from ./packages/fresh-ui/tests/registry/components/ui/prompt-input.test.tsx
PromptInput renders a form with field, capabilities, and send ... ok (5ms)
PromptInput wires aria-pressed toggle pills ... ok (376µs)
PromptInput minimal configuration renders no inert toolbar affordances ... ok (82µs)
PromptInput renders only supplied action capabilities ... ok (117µs)
PromptInput mod-enter submits and composition never submits ... ok (365µs)
PromptInput busy state blocks duplicate submit and exposes Stop ... ok (94µs)
PromptInput omits the model picker when no models given ... ok (53µs)
PromptInput field CSS auto-grows with the existing height bounds ... ok (60µs)
running 3 tests from ./packages/fresh-ui/tests/registry/components/ui/search.test.tsx
Search renders a button styled as an input with placeholder and ⌘K hint ... ok (5ms)
Search omits the kbd hint when shortcut is empty ... ok (274µs)
Search accepts a custom class merged via cn() ... ok (568µs)
running 3 tests from ./packages/fresh-ui/tests/registry/components/ui/tool-call-card.test.tsx
ToolCallCard renders name, status badge, and IO panel ... ok (4ms)
ToolCallCard reflects running vs done status ... ok (209µs)
ToolCallCard error status marks the card ... ok (85µs)
running 3 tests from ./packages/fresh-ui/tests/registry/islands/desktop-only.test.tsx
isDesktopBindingAvailable uses a local structural binding check ... ok (527µs)
DesktopOnly server/browser rendering is inert by default ... ok (678µs)
DesktopOnly can render an explicit browser/Aspire fallback without desktop content ... ok (368µs)
running 7 tests from ./packages/fresh-ui/tests/registry/islands/mcp-ui-widget.test.tsx
sanitizeSandbox defaults to allow-scripts only ... ok (538µs)
sanitizeSandbox strips allow-same-origin on every input shape ... ok (326µs)
resolveWidgetSrc stamps the active theme on absolute and relative sources ... ok (1ms)
mcpUiFrameAttributes keeps the frame restrictive and unlinkable ... ok (171µs)
McpUiWidget keys the iframe on the theme so a theme change remounts ... ok (564µs)
McpUiWidget never renders allow-same-origin, even when a caller asks for it ... ok (218µs)
manifest wires mcp-ui-widget into the ai collection ... ok (130µs)
running 4 tests from ./packages/fresh-ui/tests/registry/lib/toast.test.ts
withToast appends toast params to a path ... ok (1ms)
getToast returns undefined when message is missing ... ok (106µs)
getToast defaults invalid types to info ... ok (89µs)
stripToastFromUrl removes only toast params and preserves other URL parts ... ok (294µs)
running 14 tests from ./packages/fresh-ui/tests/registry/markdown-pipeline.test.ts
stripIncompleteSyntax closes an unterminated bold run ... ok (790µs)
stripIncompleteSyntax closes a truncated fenced code block ... ok (305µs)
stripIncompleteSyntax closes an unterminated inline code span ... ok (114µs)
stripIncompleteSyntax closes unterminated inline math ... ok (62µs)
stripIncompleteSyntax drops a dangling incomplete link ... ok (221µs)
stripIncompleteSyntax leaves complete input unchanged and never throws ... ok (110µs)
remarkCitations rewrites [n] tokens into citation-chip render calls ... ok (548µs)
remarkCitations leaves citation-free text intact ... ok (81µs)
parseStyleDeclarations camelCases properties and keeps custom properties ... ok (315µs)
parseStyleDeclarations skips malformed declarations without throwing ... ok (105µs)
rehypeInlineStyles objectifies string styles recursively ... ok (166µs)
rehypeInlineStyles leaves object styles and style-free nodes alone ... ok (59µs)
extendSanitizeSchema never allows script or event handlers ... ok (211µs)
extendSanitizeSchema accepts nullable upstream collections ... ok (90µs)
running 2 tests from ./packages/fresh-ui/tests/registry/markdown-renderer.test.ts
copied Markdown type-checks and renders directly through Preact ... ok (1s)
generated Fresh Markdown island production-builds for hydration ... ok (28s)
running 1 test from ./packages/fresh-ui/tests/registry/render-ui-generated.test.ts
generated render-ui preserves bounded nested-array behavior ... ok (1ms)
running 3 tests from ./packages/fresh-ui/tests/runtime/_internal/collection-navigation.test.ts
getNextCollectionIndex wraps forward navigation when looping ... ok (599µs)
getNextCollectionIndex clamps backward navigation when looping is disabled ... ok (63µs)
getNextCollectionIndex supports Home and End keys ... ok (110µs)
running 1 test from ./packages/fresh-ui/tests/runtime/accordion/accordion-render.test.tsx
Accordion renders a typed summary trigger with disabled item semantics ... ok (4ms)
running 2 tests from ./packages/fresh-ui/tests/runtime/accordion/accordion.test.ts
getAccordionDataState returns open when the accordion item is expanded ... ok (589µs)
getAccordionDataState returns closed when the accordion item is collapsed ... ok (99µs)
running 4 tests from ./packages/fresh-ui/tests/runtime/action-menu/action-menu.test.ts
ActionMenu publishes default and destructive item intents ... ok (646µs)
ActionMenu item activation is isolated and closes the menu ... ok (152µs)
ActionMenu traverses enabled items with Arrow/Home/End keys ... ok (289µs)
ActionMenu source composes package runtime without new global listeners ... ok (624µs)
running 6 tests from ./packages/fresh-ui/tests/runtime/combobox/combobox.utils.test.ts
getComboboxDataState reflects open/closed ... ok (708µs)
getNextComboboxIndex returns -1 for an empty list ... ok (81µs)
getNextComboboxIndex jumps to first/last ... ok (31µs)
getNextComboboxIndex enters from the matching end with no current highlight ... ok (29µs)
getNextComboboxIndex steps and wraps when loop is on ... ok (118µs)
getNextComboboxIndex clamps when loop is off ... ok (198µs)
running 2 tests from ./packages/fresh-ui/tests/runtime/dialog/dialog.test.ts
getDialogDataState returns open when the dialog is open ... ok (605µs)
getDialogDataState returns closed when the dialog is closed ... ok (86µs)
running 2 tests from ./packages/fresh-ui/tests/runtime/drawer/drawer.test.ts
getDrawerDataState returns open when the drawer is open ... ok (575µs)
getDrawerDataState returns closed when the drawer is closed ... ok (42µs)
running 3 tests from ./packages/fresh-ui/tests/runtime/popover/popover.test.ts
getPopoverDataState returns open when the popover is open ... ok (684µs)
getPopoverDataState returns closed when the popover is closed ... ok (125µs)
popover dismissal restores focus to its trigger ... ok (151µs)
running 3 tests from ./packages/fresh-ui/tests/runtime/tabs/tabs.utils.test.ts
getNextTabsIndex advances horizontally with looping ... ok (689µs)
getNextTabsIndex clamps vertically without looping ... ok (193µs)
getNextTabsIndex handles Home and End keys ... ok (81µs)
running 2 tests from ./packages/fresh-ui/tests/runtime/tooltip/tooltip.test.ts
getTooltipDataState returns open when the tooltip is open ... ok (523µs)
getTooltipDataState returns closed when the tooltip is closed ... ok (116µs)
running 16 tests from ./packages/fresh/src/application/builders/define-page/tests/builder.test.tsx
definePage resolves resources in declaration order and renders layer output ... ok (19ms)
definePage generates GET handler for headers and status ... ok (2ms)
definePage defaults to empty request state when no generic is provided ... ok (3ms)
definePage validates path params before executing the page ... ok (330µs)
definePage method handlers receive resolved resources ... ok (557µs)
definePage falls back to search schema defaults on soft search failures ... ok (3ms)
definePage still returns 400 when search params have no defaults to fall back to ... ok (747µs)
definePage build({ routePattern }) generates typed hrefs with validated params ... ok (3ms)
definePage build({ routePattern }) allows zero-arg makeHref for static routes ... ok (252µs)
InferDefinePage* helpers infer state from the builder $types surface ... ok (614µs)
InferDefinePage child-component helpers expose resource, layer loader, layer, and layout contracts ... ok (494µs)
definePage builder createNav supports same-module typed navigation before build ... ok (1ms)
definePage withRoute(route) supports implicit createNav and build() ... ok (2ms)
definePage withRouteContract({ pathSchema }) promotes path type-state and binds the route ... ok (581µs)
definePage withRouteContract({ searchSchema }) promotes search type-state ... ok (437µs)
definePage withRouteContract({}) throws a clear error when $route is missing ... ok (399µs)
running 6 tests from ./packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx
definePage generated GET handler preserves routePattern for current-route hooks ... ok (26ms)
definePage page hooks expose route, resources, layer data, and slots without prop threading ... ok (4ms)
definePage routed definitions expose default page alias and prebound hooks ... ok (1ms)
useCurrentRoute/useCurrentPath/useCurrentSearch expose typed route state during render ... ok (1ms)
usePageRoute/usePagePath/usePageSearch infer from the built route type ... ok (2ms)
useCurrentRoute fails loudly when the bound route does not match the current render context ... ok (2ms)
running 6 tests from ./packages/fresh/src/application/builders/define-page/tests/runtime.test.tsx
definePage withForm resolves initial layer props and sets the CSRF cookie on GET ... ok (38ms)
definePage withForm returns invalid data when schema validation fails ... ok (6ms)
definePage withForm ignores malformed ctx.data that only partially resembles a form result ... ok (1ms)
definePage withForm redirects after a successful submit ... ok (1ms)
definePage withForm logs the original mutate error before normalizing it ... ok (1ms)
definePage withForm applies collection intents before returning runtime state ... ok (5ms)
running 7 tests from ./packages/fresh/src/application/builders/define-page/tests/search-params.test.tsx
paginationSearchSchema coerces values and computes offset ... ok (23ms)
searchParamsToInput preserves first and repeated query parameter values ... ok (457µs)
definePage layer defer props include merged partial params and freshness settings ... ok (6ms)
definePage defer layers allow partialName to differ from the layer id ... ok (2ms)
definePage blocking stale mode hides stale cached payloads behind the fallback ... ok (397µs)
definePage accepts telemetry configuration without breaking execution ... ok (455µs)
definePage withStreaming generates a chunked GET response without waiting on stream layers ... ok (36ms)
running 1 test from ./packages/fresh/src/application/builders/define-page/tests/surface.test.ts
type surface snapshot compiles ... ok (813µs)
running 3 tests from ./packages/fresh/src/application/builders/define-partial.test.tsx
definePartial returns partial config and renders success content ... ok (14ms)
definePartial wraps loader failures in ErrorDisplay inside the partial boundary ... ok (597µs)
defineStatsPartial delegates to a query function and preserves handler passthrough ... ok (205µs)
running 4 tests from ./packages/fresh/src/application/defer/DeferIsland.test.ts
sanitizeDeferSearchParams preserves real route state ... ok (13ms)
sanitizeDeferSearchParams removes fresh partial transport params only ... ok (129µs)
sanitizeDeferSearchParams returns undefined when only transport params remain ... ok (469µs)
buildDeferFormState keeps page-state params as GET inputs and only partial extras in the partial URL ... ok (366µs)
running 5 tests from ./packages/fresh/src/application/defer/Deferred.test.tsx
Deferred wraps the promise reader in a Suspense boundary ... ok (673µs)
Deferred normalizes JSX render-function children before passing them to the inner reader ... ok (85µs)
usePromise throws the pending promise and later returns the fulfilled value ... ok (155µs)
resolvedPromise lets usePromise return synchronously for fulfilled values ... ok (71µs)
usePromise rethrows the settled rejection after the promise fails ... ok (451µs)
running 4 tests from ./packages/fresh/src/application/form/components/form.test.tsx
Form renders framework-owned submission and csrf hidden inputs ... ok (2ms)
Form forwards formProps attrs to the rendered form without dropping hidden inputs ... ok (568µs)
createFormEnhancementSnapshot strips runtime descriptors to a serializable shape ... ok (577µs)
applyCollectionStrategy adds Fresh partial attrs for server-owned strategies ... ok (103µs)
running 4 tests from ./packages/fresh/src/application/form/runtime/tests/collection.test.ts
applyIntentOperation supports nested collection paths ... ok (1ms)
parseFormSubmission strips collection key fields and returns them separately ... ok (3ms)
applyCollectionKeyOperation mirrors collection reorder and duplicate behavior ... ok (569µs)
collection descriptors expose schema limits and stable item keys ... ok (4ms)
running 6 tests from ./packages/fresh/src/application/form/runtime/tests/intent.test.ts
parseFormIntent handles plain submit intents ... ok (825µs)
parseFormIntent handles encoded collection intents ... ok (234µs)
applyIntentOperation adds collection items without mutating the source value ... ok (680µs)
applyIntentOperation removes collection items ... ok (143µs)
applyIntentOperation duplicates collection items ... ok (265µs)
applyIntentOperation reorders collection items ... ok (114µs)
running 9 tests from ./packages/fresh/src/application/form/runtime/tests/reply.test.ts
reply.initial creates the canonical initial submission result ... ok (664µs)
reply.invalid preserves values and field errors ... ok (321µs)
reply.success stores output and optional success message ... ok (197µs)
reply.error creates canonical error result with form errors ... ok (139µs)
reply.redirect creates canonical redirect result with location and status ... ok (164µs)
reply helpers defensively clone array inputs ... ok (164µs)
reply helpers default csrfToken to empty string when omitted ... ok (81µs)
reply.redirect defaults redirect status to 303 ... ok (146µs)
reply.invalid normalizes omitted formErrors to an empty array ... ok (77µs)
running 4 tests from ./packages/fresh/src/application/form/runtime/tests/runtime-state.test.ts
resolveRuntimeFormState builds field descriptors with constraints and errors ... ok (5ms)
resolveRuntimeFormState builds nested field descriptors and success-state baselines ... ok (941µs)
resolveRuntimeFormState builds collection descriptors and intent button props ... ok (1ms)
resolveRuntimeFormState marks object descriptors dirty when key sets differ ... ok (923µs)
running 4 tests from ./packages/fresh/src/application/form/schema-adapter/schema-adapter-standard.test.ts
createStandardSchemaAdapter safeParse returns parsed output on success ... ok (551µs)
createStandardSchemaAdapter safeParse normalizes field and form errors ... ok (171µs)
createStandardSchemaAdapter parse throws AggregateError on invalid input ... ok (189µs)
createStandardSchemaAdapter accepts Zod Standard Schema metadata ... ok (3ms)
running 16 tests from ./packages/fresh/src/application/form/schema-adapter/schema-adapter.test.ts
createZodAdapter safeParse returns parsed output on success ... ok (3ms)
createZodAdapter safeParse validates through Standard Schema metadata ... ok (1ms)
createZodAdapter safeParse returns flattened field and form errors on invalid input ... ok (1ms)
createZodAdapter parse returns parsed output on valid input ... ok (189µs)
createZodAdapter parse validates through Standard Schema metadata ... ok (279µs)
createZodAdapter parse throws on invalid input ... ok (352µs)
createZodAdapter getDefaults returns schema defaults when available ... ok (553µs)
createZodAdapter getDefaults falls back to empty object when schema defaults are unavailable ... ok (315µs)
createZodAdapter getConstraints returns a conservative supported metadata subset ... ok (607µs)
createZodAdapter getConstraints preserves optional-field required semantics ... ok (311µs)
createZodAdapter getConstraints exposes array collection bounds ... ok (347µs)
createZodAdapter is intent-agnostic and validates values independently of form intent ... ok (357µs)
createZodAdapter returns empty _form array when there are only field errors ... ok (333µs)
createZodAdapter clones defaults defensively across calls ... ok (356µs)
createZodAdapter getDefaults preserves tuple positions when later items define defaults ... ok (402µs)
createZodAdapter getDefaults respects explicit array defaults through wrapper schemas ... ok (411µs)
running 4 tests from ./packages/fresh/src/application/form/validation/csrf.test.ts
generateCsrfToken returns a non-empty token ... ok (1ms)
verifyCsrfToken accepts matching tokens and rejects mismatches ... ok (356µs)
setCsrfCookie writes the expected cookie attributes ... ok (6ms)
readCsrfToken reads the token from request cookies ... ok (4ms)
running 3 tests from ./packages/fresh/src/application/form/validation/error-normalization.test.ts
normalizeFormError returns invalid results for schema validation errors ... ok (1ms)
normalizeFormError returns error results for Error instances ... ok (498µs)
normalizeFormError returns a safe fallback for unknown thrown values ... ok (123µs)
running 2 tests from ./packages/fresh/src/application/query/cache-invalidation/mod.test.ts
invalidateServerQueryCache sends the canonical key to the standard endpoint ... ok (5ms)
invalidateServerQueryCache rejects an unsuccessful invalidation ... ok (636µs)
running 2 tests from ./packages/fresh/src/application/query/hydration-script.test.tsx
QueryHydrationScript renders escaped dehydrated state ... ok (1ms)
HydrationBoundary renders children during server rendering ... ok (331µs)
running 1 test from ./packages/fresh/src/application/query/initial-data.test.tsx
server initialData wins first paint over an older shared-client entry ... ok (17ms)
running 3 tests from ./packages/fresh/src/application/query/mutation-lifecycle.test.ts
island mutation lifecycle rolls back optimistic cache updates on error ... ok (24ms)
island mutation lifecycle threads optimistic context through success and settled ... ok (1ms)
island mutation lifecycle passes typed errors to rollback callbacks ... ok (415µs)
running 4 tests from ./packages/fresh/src/application/query/query-options.test.ts
IslandQueryOptions forwards refetchInterval to the underlying query observer ... ok (1ms)
IslandQueryOptions forwards refetchIntervalInBackground to the underlying query observer ... ok (144µs)
IslandQueryOptions leaves refetchInterval unset when omitted ... ok (195µs)
IslandQueryOptions forwards the server data timestamp ... ok (187µs)
running 11 tests from ./packages/fresh/src/application/route/contract.test.ts
enumPathParamSchema validates literal path params ... ok (598µs)
defineEnumPathParam exposes values, schema, and parser together ... ok (245µs)
bindRoutePattern preserves schemas alongside nav and route pattern ... ok (6ms)
getLinkProps builds anchor props from a bound route contract target ... ok (2ms)
bound route contract exposes getLinkProps directly ... ok (1ms)
route contracts expose parse helpers for path params and URLSearchParams ... ok (1ms)
getLinkProps fails loudly when path params do not satisfy the target contract ... ok (223µs)
createRouteReference infers dynamic, catch-all, optional catch-all, and static href behavior from the route pattern ... ok (835µs)
createRouteReference with static-before-dynamic segment keeps dynamic path params typed (regression for #177) ... ok (181µs)
pairRouteTargets keeps page and partial hrefs aligned ... ok (1ms)
InferRoutePatternPath infers static segments as {} (regression for #178) ... ok (202µs)
running 12 tests from ./packages/fresh/src/application/route/manifest-page-module.test.ts
scanPageModuleRouteBinding extracts the inline contract body and strips $route ... ok (677µs)
scanPageModuleRouteBinding distinguishes .withRoute from .withRouteContract ... ok (65µs)
computePageModuleRewrite (Form A) inserts $route as the first field and the manifest import ... ok (505µs)
computePageModuleRewrite (Form C) inserts .withRoute after definePage() and the routes import ... ok (289µs)
computePageModuleRewrite inserts generated imports after a complete multi-line import ... ok (395µs)
computePageModuleRewrite inserts generated imports after side-effect imports ... ok (123µs)
computePageModuleRewrite handles default and namespace imports as the final import ... ok (217µs)
computePageModuleRewrite prepends generated imports when the module has no imports ... ok (81µs)
computePageModuleRewrite keeps multi-line import rewrites idempotent ... ok (158µs)
computePageModuleRewrite (Form B) is a no-op when the binding is already present ... ok (134µs)
computePageModuleRewrite is idempotent across all forms ... ok (249µs)
computePageModuleRewrite emits the inline-precedence warning when a sidecar also exists ... ok (241µs)
running 10 tests from ./packages/fresh/src/application/route/manifest.test.ts
discoverNetScriptRoutes infers Fresh patterns, keys, and sidecar imports ... ok (3ms)
discoverNetScriptRoutes only binds route contracts from sibling sidecars ... ok (1ms)
discoverNetScriptRoutes classifies inline .withRouteContract page modules as Form A ... ok (979µs)
discoverNetScriptRoutes ignores .withRouteContract outside page modules (helper files) ... ok (787µs)
discoverNetScriptRoutes errors when a page has both .withRoute and .withRouteContract ... ok (683µs)
discoverNetScriptRoutes preserves key semantics for grouped, nested, catch-all, and optional catch-all routes ... ok (2ms)
discoverNetScriptRoutes skips helper dirs, underscore files, and dynamic side-files ... ok (1ms)
renderNetScriptRouteManifest renders the pure routePatterns tree ... ok (335µs)
renderNetScriptRoutesModule renders routes bindings backed by manifest.ts ... ok (273µs)
writeNetScriptRouteManifestSync writes sibling manifest.ts and routes.ts outputs ... ok (1ms)
running 10 tests from ./packages/fresh/src/application/vite/vite.test.ts
createNetScriptVitePlugin returns config through official plugin hooks ... ok (753µs)
createNetScriptVitePlugin returns actual Vite-style plugin objects ... ok (432µs)
createNetScriptVitePlugin watches route roots when route manifest generation is enabled ... ok (2ms)
createNetScriptVitePlugin resolves @app aliases via resolveId ... ok (233µs)
createNetScriptVitePlugin delegates all Preact forms and preserves metadata ... ok (699µs)
createNetScriptVitePlugin resolves versioned Preact Signals through the app import map ... ok (208µs)
createNetScriptVitePlugin collapses Windows Preact slash variants in production builds ... ok (109ms)
createNetScriptVitePlugin rewrites page modules for route binding by default ... ok (4ms)
createNetScriptVitePlugin leaves page modules untouched when pageModuleRouteBinding is false ... ok (1ms)
route manifest watch resyncs when helper TypeScript files move under routes ... ok (78ms)
running 3 tests from ./packages/fresh/src/diagnostics/error/classify_test.ts
classifyErrorType maps HTTP status families ... ok (1ms)
isRetryable allows transient errors ... ok (84µs)
getDefaultMessage returns status-specific messages ... ok (128µs)
running 2 tests from ./packages/fresh/src/diagnostics/error/extract_test.ts
extractErrorData normalizes ordinary errors ... ok (14ms)
extractErrorData normalizes unknown values ... ok (106µs)
running 2 tests from ./packages/fresh/src/internal/package-telemetry/telemetry_test.ts
withFreshSpan returns callback result ... ok (13ms)
emitFreshError records normalized error attributes ... ok (446µs)
running 1 test from ./packages/fresh/src/runtime/ai/create-chat-connection_integration_test.ts
durable chat lifecycle provides seed, optimism, live tokens, reload resume, multi-tab convergence, and multibyte fidelity ... ok (23ms)
running 11 tests from ./packages/fresh/src/runtime/ai/create-chat-connection_test.ts
resolveChatSnapshot wires session URL + auth and reduces via projectChatSnapshot ... ok (19ms)
streamPath override supports per-session durable paths ... ok (6ms)
resolveChatSnapshot requests identity encoding for gzip-mislabeled seed reads ... ok (14ms)
createNetScriptChatConnection requests identity encoding for live gzip-mislabeled reads ... ok (4ms)
projectChatSnapshot is the shared reducer (deterministic seed == live) ... ok (213µs)
createNetScriptChatConnection exposes idempotent close/stop/dispose (F-13) ... ok (700µs)
subscribe re-polls a transient empty first-subscribe (SR2) ... ok (6ms)
subscribe re-polls a transient error but propagates a hard auth error ... ok (3ms)
toNetScriptChatResponse gates on authorize and wires the write URL ... ok (676µs)
toNetScriptChatResponse throws when authorize is given without a request ... ok (463µs)
projectChatSnapshot tolerates malformed / partial messages ... ok (192µs)
running 4 tests from ./packages/fresh/src/runtime/ai/mcp-app-call-handler_test.ts
createMcpAppCallHandler routes same-server tool calls through the pool ... ok (25ms)
createMcpAppCallHandler rejects cross-server body ids before transport access ... ok (1ms)
createMcpAppCallHandler uses the warm pool client for stdio-like transports ... ok (1ms)
createMcpAppCallHandler emits an mcp.tool.call span ... ok (1ms)
running 7 tests from ./packages/fresh/src/runtime/ai/mcp-sandbox-handler_test.ts
injects active --ns-* design tokens before the resource body ... ok (30ms)
switches themes and falls back to the documented default theme ... ok (3ms)
falls back to the first record theme when the default theme is absent ... ok (720µs)
derives the CSP header and meta tag from a representative ui:// URI ... ok (580µs)
returns 400 for a missing or non-ui resource URI ... ok (315µs)
returns 404 when the ui resource resolver misses ... ok (388µs)
passes the incoming request AbortSignal to the resource resolver ... ok (2ms)
running 1 test from ./packages/fresh/src/runtime/ai/sandbox_exports_test.ts
sandbox subpath publishes only implemented exports ... ok (61ms)
running 3 tests from ./packages/fresh/src/runtime/ai/stream-proxy_test.ts
streams a >1KB chunked body through uncorrupted and strips stale content-length/encoding (#239 fence) ... ok (24ms)
supports eis-chat per-session stream paths and survives identity-negotiated gzip mislabel (#219) ... ok (8ms)
propagates the client AbortSignal into the upstream fetch (F-13 cancel-aware) ... ok (982µs)
running 6 tests from ./packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts
browser and Aspire capability shapes disable Desktop RPC without binding ... ok (854µs)
Desktop capability without a usable window returns an inert lifecycle ... ok (129µs)
Desktop binding rejects an empty custom binding name before registration ... ok (692µs)
Fresh binding round-trips typed strings and Uint8Array then closes once ... ok (9ms)
two Fresh Desktop windows keep same-named RPC bindings isolated ... ok (1ms)
procedure failures cross the Fresh binding as typed oRPC errors ... ok (2ms)
running 10 tests from ./packages/fresh/src/runtime/server/define-fresh-app.test.ts
defineFreshApp reuses a provided app instance ... ok (17ms)
defineFreshApp can construct through an adapter factory ... ok (1ms)
defineFreshApp activates request telemetry unless explicitly disabled ... ok (130µs)
defineFreshApp applies lifecycle hooks before request middleware runs ... ok (8ms)
defineFreshApp can override static middleware registration ... ok (570µs)
defineFreshApp can disable static middleware through the adapter seam ... ok (361µs)
defineFreshApp can mount file-system routes at a pattern ... ok (165µs)
defineFreshApp can override file-system route registration ... ok (123µs)
defineFreshApp registers the standard server-query invalidation route ... ok (17ms)
defineFreshApp can disable or move the server-query invalidation route ... ok (2ms)
running 2 tests from ./packages/fresh/src/runtime/server/query-cache-invalidation.test.ts
standard invalidation edge makes the next server read observe a committed mutation ... ok (31ms)
standard invalidation edge rejects unsafe or malformed requests ... ok (1ms)
running 2 tests from ./packages/fresh/src/runtime/server/sse_test.ts
createSSEStream clears heartbeat when the external signal aborts ... ok (12ms)
createKvWatchSSE aborts the KV watch when the response body is canceled ... ok (763µs)
running 2 tests from ./packages/fresh/src/runtime/server/stream_test.ts
renderToStream cancels the renderer stream when the signal aborts ... ok (4ms)
renderToStream cancels immediately when the signal is already aborted ... ok (174µs)
running 1 test from ./packages/fresh/src/runtime/streams/create-stream-db_test.ts
createNetScriptStreamDB wires stream URL, schema, and lifecycle handle through the factory ... ok (16ms)
running 1 test from ./packages/fresh/src/runtime/streams/create-stream-event-source_test.ts
Fresh SSE helper constructs live named-event URL and exposes replay snapshot ... ok (15ms)
running 1 test from ./packages/fresh/tests/_fixtures/docs-examples_test.ts
README quick-start symbols are importable ... ok (16ms)
running 1 test from ./packages/fresh/tests/package-manifest_test.ts
published manifest declares every catalog-backed Fresh runtime dependency ... ok (1ms)
running 3 tests from ./packages/kv/tests/_fixtures/docs-examples_test.ts
docs: memory quickstart stores and reads job state ... ok (2ms)
docs: testing entrypoint creates a clean in-memory adapter ... ok (365µs)
docs: observability recipe receives a watchPrefix event ... ok (442µs)
running 2 tests from ./packages/kv/tests/auto-detect_test.ts
Redis connection discovery handles direct URLs and Aspire connection strings ... ok (1ms)
autoDetectProvider prefers explicit cache provider and falls back to Deno KV ... ok (2ms)
running 46 tests from ./packages/kv/tests/bridge_test.ts
WatchableKvBridge.get — returns entry for existing key ... ok (2ms)
WatchableKvBridge.get — returns null-valued entry for missing key ... ok (181µs)
WatchableKvBridge.getMany — returns entries in order ... ok (480µs)
WatchableKvBridge.set — writes value and returns commit result ... ok (307µs)
WatchableKvBridge.set — supports expireIn option ... ok (508µs)
WatchableKvBridge.delete — removes existing key ... ok (203µs)
WatchableKvBridge.list — iterates entries with prefix ... ok (559µs)
WatchableKvBridge.list — respects limit ... ok (1ms)
WatchableKvBridge.list — cursor property updates during iteration ... ok (407µs)
WatchableKvBridge.list — entries always have non-null versionstamp ... ok (215µs)
WatchableKvBridge.list — reverse yields entries in descending key order ... ok (209µs)
WatchableKvBridge.list — reverse with limit ... ok (215µs)
WatchableKvBridge.list — empty prefix returns no entries ... ok (116µs)
WatchableKvBridge.atomic — set and delete via commit ... ok (304µs)
WatchableKvBridge.atomic — delete in atomic ... ok (194µs)
WatchableKvBridge.atomic — check with matching versionstamp succeeds ... ok (217µs)
WatchableKvBridge.atomic — check with wrong versionstamp fails ... ok (155µs)
WatchableKvBridge.atomic — check null versionstamp ensures key does not exist ... ok (103µs)
WatchableKvBridge.atomic — check null versionstamp fails when key exists ... ok (308µs)
WatchableKvBridge.atomic — commit result has versionstamp on success ... ok (191µs)
WatchableKvBridge.atomic — sum/min/max fall back to set without throwing ... ok (633µs)
WatchableKvBridge.atomic — enqueue is a no-op ... ok (145µs)
WatchableKvBridge.atomic — chaining returns same instance ... ok (459µs)
WatchableKvBridge.watch — returns a ReadableStream with initial state ... ok (7ms)
WatchableKvBridge.watch — initial state includes null for missing keys ... ok (305µs)
WatchableKvBridge.close — does not throw ... ok (157µs)
WatchableKvBridge[Symbol.asyncDispose] — does not throw ... ok (229µs)
WatchableKvBridge.enqueue — throws synchronously with helpful message ... ok (705µs)
WatchableKvBridge.listenQueue — no-op resolves immediately ... ok (88µs)
createNetscriptDb — memory backend creates functional kvdex db ... ok (2ms)
createNetscriptDb — memory backend supports indexed collections ... ok (2ms)
createNetscriptDb — memory backend supports getMany ... ok (849µs)
createNetscriptDb — memory backend supports count ... ok (786µs)
createNetscriptDb — memory backend supports delete ... ok (538µs)
createNetscriptDb — memory backend supports countBySecondaryIndex ... ok (2ms)
createNetscriptDb — memory backend supports updateByPrimaryIndex ... ok (862µs)
createNetscriptDb — memory backend supports deleteMany ... ok (978µs)
createNetscriptDb — memory backend supports addMany ... ok (652µs)
WatchableKvBridge — works as kvdex backend for basic CRUD ... ok (809µs)
WatchableKvBridge — works as kvdex backend for getMany ... ok (424µs)
WatchableKvBridge — works as kvdex backend for count ... ok (389µs)
WatchableKvBridge — works as kvdex backend for atomic check-and-set ... ok (268µs)
WatchableKvBridge — works as kvdex backend for deleteMany ... ok (331µs)
WatchableKvBridge — works as kvdex backend for getOne ... ok (409µs)
WatchableKvBridge — works as kvdex backend for set with explicit id ... ok (303µs)
WatchableKvBridge — works as kvdex backend for forEach ... ok (310µs)
running 23 tests from ./packages/kv/tests/keys_test.ts
keyToString — string-only key ... ok (552µs)
keyToString — mixed types (string, number, boolean) ... ok (51µs)
keyToString — single segment ... ok (63µs)
keyToString — empty key ... ok (38µs)
keyToString — deterministic (same input produces identical output) ... ok (392µs)
generateVersionstamp — returns a 26-character string ... ok (264µs)
generateVersionstamp — matches Crockford base-32 alphabet ... ok (144µs)
generateVersionstamp — sequential calls are strictly monotonic ... ok (121µs)
generateVersionstamp — rapid burst of 100 calls: unique and ascending ... ok (736µs)
keyHasPrefix — exact match returns true ... ok (150µs)
keyHasPrefix — proper prefix returns true ... ok (33µs)
keyHasPrefix — wrong prefix returns false ... ok (61µs)
keyHasPrefix — key shorter than prefix returns false ... ok (139µs)
keyHasPrefix — empty prefix always matches ... ok (114µs)
keyHasPrefix — both empty returns true ... ok (76µs)
keyHasPrefix — numeric segments ... ok (93µs)
keyHasPrefix — type mismatch with strict equality (string '1' vs number 1) ... ok (72µs)
compareKeys — equal keys return 0 ... ok (72µs)
compareKeys — first key less than second returns negative ... ok (29µs)
compareKeys — first key greater than second returns positive ... ok (84µs)
compareKeys — shorter key sorts before longer key when common prefix matches ... ok (42µs)
compareKeys — numeric segments compared via String() coercion ... ok (23µs)
compareKeys — mixed types ordered via String() coercion ... ok (80µs)
running 3 tests from ./packages/kv/tests/memory.adapter_test.ts
MemoryKvAdapter supports CRUD, list, and atomic mutations ... ok (2ms)
MemoryKvAdapter supports TTL expiry and watchPrefix notifications ... ok (32ms)
MemoryKvAdapter watch batches key updates ... ok (650µs)
running 3 tests from ./packages/kv/tests/redis.adapter_test.ts
RedisKvAdapter fails a dead endpoint loudly within a bounded interval ... ok (439ms)
RedisKvAdapter lists real Redis entries and admits one atomic CAS winner ... ignored (0ms)
RedisKvAdapter fails during a Redis restart and recovers on the same instance ... ignored (0ms)
running 1 test from ./packages/kv/tests/shared_test.ts
shared KV lifecycle reuses and resets the singleton ... ok (7ms)
running 6 tests from ./packages/logger/tests/_fixtures/docs-examples_test.ts
logger docs examples: configure root service logging ...
------- post-test output -------
08:26:59.251 INF netscript·services·users Service starting
----- post-test output end -----
logger docs examples: configure root service logging ... ok (2ms)
logger docs examples: install Hono request middleware ... ok (9ms)
logger docs examples: create role-specific categories ...
------- post-test output -------
08:26:59.262 INF netscript·services·orders Service ready
08:26:59.262 DBG netscript·packages·kv Cache lookup
08:26:59.262 INF netscript·workers·email-dispatch Worker listening
08:26:59.262 INF netscript·jobs·daily-export Job accepted
----- post-test output end -----
logger docs examples: create role-specific categories ... ok (699µs)
logger docs examples: reset logging state in tests ... ok (1ms)
logger docs examples: propagate context with LogTape ...
------- post-test output -------
08:26:59.264 INF netscript·services·payments Payment capture requested
----- post-test output end -----
logger docs examples: propagate context with LogTape ... ok (459µs)
logger docs examples: middleware preserves failure boundary ...
------- post-test output -------
Error: example failure
    at file:///home/codex/repos/ns006-f-b-dryrun/packages/logger/tests/_fixtures/docs-examples_test.ts:94:11
    at dispatch (https://jsr.io/@hono/hono/4.12.24/src/compose.ts:51:23)
    at https://jsr.io/@hono/hono/4.12.24/src/compose.ts:51:46
    at withContext (https://jsr.io/@logtape/logtape/2.1.4/src/context.ts:55:12)
    at file:///home/codex/repos/ns006-f-b-dryrun/packages/logger/middleware.ts:166:13
    at dispatch (https://jsr.io/@hono/hono/4.12.24/src/compose.ts:51:23)
    at https://jsr.io/@hono/hono/4.12.24/src/compose.ts:23:12
    at https://jsr.io/@hono/hono/4.12.24/src/hono-base.ts:454:31
    at Hono.#dispatch (https://jsr.io/@hono/hono/4.12.24/src/hono-base.ts:465:6)
    at Hono.fetch (https://jsr.io/@hono/hono/4.12.24/src/hono-base.ts:484:26)
----- post-test output end -----
logger docs examples: middleware preserves failure boundary ... ok (2ms)
running 2 tests from ./packages/logger/tests/config_test.ts
configureLogging marks logging as configured ... ok (1ms)
resetLogging clears configured state for later ensureLogging calls ... ok (548µs)
running 2 tests from ./packages/logger/tests/creators_test.ts
logger creators produce expected categories ... ok (2ms)
createChildLogger uses the parent category ... ok (552µs)
running 1 test from ./packages/logger/tests/middleware_test.ts
loggerMiddleware injects request metadata into Hono context ... ok (10ms)
running 5 tests from ./packages/mcp/tests/canonical-identity_test.ts
canonical identity resolves exact operation id before exact method path ... ok (644µs)
canonical identity refuses case-variant ids as ambiguous candidates ... ok (251µs)
a differently cased unique id remains a non-executing suggestion ... ok (212µs)
canonical identity refuses an exact id shared by more than one operation ... ok (102µs)
substring matches remain non-executing suggestions ... ok (252µs)
running 5 tests from ./packages/mcp/tests/command_adapters_test.ts
static catalog defaults to an explicit unwired descriptor ... ok (1ms)
spawn executor uses the published CLI prefix by default ... ok (298µs)
spawn executor captures a cheap real subprocess ... ok (47ms)
spawn executor bounds output to a tail ... ok (39ms)
spawn executor terminates commands at the deadline ... ok (33ms)
running 1 test from ./packages/mcp/tests/command_composition_test.ts
command tool descriptions disclose policy and output bounds ... ok (727µs)
running 4 tests from ./packages/mcp/tests/command_flows_test.ts
default command policy is deny-wins with default deny ... ok (939µs)
execute command allows plugin install supplied through command args ... ok (433µs)
list commands filters and limits dynamic catalog results ... ok (328µs)
execute command rejects denied paths before calling executor ... ok (145µs)
running 2 tests from ./packages/mcp/tests/description-ladder_test.ts
description ladder covers summary, description, id, and method-path rungs ... ok (1ms)
real generated no-summary spec uses the operation-id rung, not schema properties ... ok (243µs)
running 2 tests from ./packages/mcp/tests/docs-source-policy_test.ts
filesystem source policy admits Markdown plus only root llms.txt ... ok (17ms)
a root containing only llms.txt is synchronously indexable ... ok (1ms)
running 18 tests from ./packages/mcp/tests/docs_test.ts
fixture corpus excludes private paths and bounds list results ... ok (10ms)
search ranks title and heading matches above body matches ... ok (2ms)
search to get funnel retrieves a slugified section only ... ok (3ms)
corpus bounds indexed content and runner applies its tighter response policy ... ok (4ms)
docs root precedence is flag then environment then an indexable project probe ... ok (5ms)
list_docs reports filesystem corpus kind, root, and total document count ... ok (3ms)
an empty project probe falls back to an observable embedded corpus ... ok (36ms)
stdio composition preserves environment precedence over an indexable probe ... ok (96ms)
CLI composition defaults every docs flow to package-shipped docs ... ok (48ms)
CLI composition makes installed help symptoms reachable through MCP docs ... ok (32ms)
missing explicit docs root returns path and --docs-root remediation ... ok (1ms)
empty explicit docs root is an explicit corpus error, never bare zeros ... ok (740µs)
unexpected corpus failures remain bounded structured tool errors ... ok (346µs)
real public docs corpus lists documents when present ... ok (328ms)
search_docs does not throw on title-only, heading-only, body-only, or natural language queries ... ok (585µs)
docs corpus canonicalizes redirect pages and oldUrl aliases ... ok (489µs)
docs corpus fails deterministically on duplicate aliases and alias cycles ... ok (571µs)
real public docs corpus processes redirects and resolves oldUrl aliases ... ok (2s)
running 4 tests from ./packages/mcp/tests/doctor-families_test.ts
project family passes valid workspace and generated plugin registry fixtures ... ok (2ms)
project family fails invalid workspace and missing generated registry fixtures ... ok (1ms)
Aspire family maps the upstream inspection report through injected fixture ports ... ok (355µs)
plugin family exposes the S7 injection seam as a warning ... ok (129µs)
running 7 tests from ./packages/mcp/tests/doctor_test.ts
telemetry probe only treats successful HTTP responses as reachable ... ok (7ms)
doctor fails an explicit telemetry endpoint that responds with HTTP 404 ... ok (931µs)
doctor treats an unreachable explicit endpoint as a failure ... ok (2ms)
doctor warns when no running app and no endpoint is explicit ... ok (569µs)
runner rejects invalid successful tool output ... ok (666µs)
doctor aggregation counts severities and isolates family failures ... ok (823µs)
real doctor flow stays within its advertised schema for large families ... ok (358µs)
running 14 tests from ./packages/mcp/tests/drift-evidence_test.ts
record drift refuses without a diagnostic receipt ... ok (1ms)
record drift refuses a stale diagnostic receipt ... ok (312µs)
record drift refuses a fresh diagnostic receipt with non-zero exit status ... ok (169µs)
record drift accepts fresh successful evidence and appends its receipt ... ok (165µs)
MCP record_drift refuses and accepts through the shared gate ... ok (55ms)
a public introspection receipt satisfies the shared drift gate ... ok (33ms)
a successful execute_command receipt satisfies the shared drift gate ... ok (32ms)
a failed execute_command receipt cannot satisfy the shared drift gate ... ok (28ms)
every explicitly denied command overwrites green evidence with failure ... ok (141ms)
a public introspection output rejection cannot leave green evidence ... ok (52ms)
an actual MCP doctor call writes a diagnostic receipt ... ok (40ms)
invalid MCP tool output replaces stale green evidence with a failed receipt ... ok (671µs)
throwing MCP tool flow replaces stale green evidence with a failed receipt ... ok (291µs)
MCP doctor result survives a diagnostic evidence write failure ... ok (27ms)
running 2 tests from ./packages/mcp/tests/embedded-export-surface-corpus_test.ts
embedded export corpus verifies pinned version, hash, sizes, and exact counts ... ok (51ms)
embedded export corpus rejects corrupted bytes and version drift ... ok (1ms)
running 5 tests from ./packages/mcp/tests/export-surface-flows_test.ts
find_export answers which package and subpath export an exact symbol ... ok (943µs)
list_package_exports groups a bounded declaration page by export subpath ... ok (281µs)
get_export refuses ambiguity and returns only one bounded signature and JSDoc ... ok (473µs)
search_exports ranks the specific helper below a general helper by partial shape ... ok (414µs)
search_exports identifies why the generated corpus cannot load ... ok (515µs)
running 1 test from ./packages/mcp/tests/export-surface-mirror-free_test.ts
mirror-free MCP resolves definePage without a docs directory and settles a receipt ... ok (77ms)
running 4 tests from ./packages/mcp/tests/guidance-contract_test.ts
find_guidance is the 22nd bounded read-only tool contract ... ok (1ms)
find_guidance output schema enforces finite vocabulary and collection bounds ... ok (412µs)
find_guidance flow applies defaults and every response bound ... ok (928µs)
find_guidance flow rejects invalid direct calls and bounds corpus failures ... ok (314µs)
running 1 test from ./packages/mcp/tests/guidance-evaluation_test.ts
locked release-corpus guidance is deterministic and equal across both adapters ... ok (666ms)
running 5 tests from ./packages/mcp/tests/guidance-retrieval_test.ts
shared guidance index bridges concept mismatch and cites fenced and Vento code ... ok (4ms)
cache-freshness concept covers a render and request phrase family ... ok (50ms)
internal prerequisite links contribute one-hop routing without creating a seed ... ok (4ms)
filesystem and embedded adapters return byte-equal guidance over identical sources ... ok (11ms)
flow bounds shared-index responses and unsupported intent has honest fallback ... ok (908µs)
running 5 tests from ./packages/mcp/tests/openapi-read-tools_test.ts
list_api_services forwards sources verbatim and omits counts without a fetched spec ... ok (938µs)
list_api_services reports truncation when service rows are dropped ... ok (204µs)
list_service_operations marks truncation iff at least one matching row was dropped ... ok (1ms)
get_operation_schema composes S4 views and an unauthenticated curl template ... ok (1ms)
CLI settles a successful S6 receipt through the S8 lifecycle ... ok (43ms)
running 2 tests from ./packages/mcp/tests/operation-index_test.ts
operation index preserves deterministic path and method source order ... ok (1ms)
operation index ignores non-object paths and unsupported path keys ... ok (1ms)
running 6 tests from ./packages/mcp/tests/registry_test.ts
registry enumerates the complete v1 contract surface ... ok (931µs)
list_docs output schema requires observable corpus health metadata ... ok (743µs)
contracts reject malformed required fields, types, bounds, and extra keys ... ok (192µs)
non-doctor tools expose planned structured failures in S1 ... ok (150µs)
docs drift proof: documentation reflects registered tool surface and count ... ok (1ms)
public docs activate intent guidance before unfamiliar implementation work ... ok (1ms)
running 4 tests from ./packages/mcp/tests/release-embedded-docs-corpus_test.ts
generated release fallback contains the enumerated intent-guidance documents ... ok (38ms)
outer CLI help augments rather than replaces the generated fallback ... ok (26ms)
embedded docs version mismatch fails synchronously at construction ... ok (1ms)
embedded docs integrity mismatch fails closed before listing ... ok (11ms)
running 3 tests from ./packages/mcp/tests/schema-views_test.ts
schema views merge request parameters and expand bounded local refs ... ok (2ms)
error view compacts only detected identical declarations and preserves refs ... ok (619µs)
real no-database template has exactly empty error views without an envelope ... ok (528µs)
running 9 tests from ./packages/mcp/tests/service-endpoint-directory_test.ts
directory exposes all sources, applies precedence, conflicts, statuses, and pre-fetch exclusions ... ok (2ms)
directory isolates source rejection and probe rejection as explicit failed data ... ok (858µs)
one hanging row times out while healthy rows return under the concurrency cap ... ok (29ms)
one non-cooperative hanging spec fetch times out while another directory row returns ... ok (21ms)
parent cancellation rejects the directory instead of fabricating endpoint rows ... ok (845µs)
fetch probe requests spec before identity without redirects or credentials ... ok (977µs)
fetch probe preserves a path-mounted operator base for spec and identity requests ... ok (845µs)
fetch probe maps spec failures and uses exact P3 guidance for 401 and 403 ... ok (1ms)
fetch probe maps reused-port identity and response bounds without projecting the spec ... ok (914µs)
running 8 tests from ./packages/mcp/tests/service-endpoint-sources_test.ts
override source exposes used, absent, and failed outcomes without decoding sibling policy ... ok (2ms)
appsettings source preserves unpinned services and distinguishes torn configuration ... ok (561µs)
run manifest requires real project identity and an expected current run id ... ok (879µs)
torn manifest remains failed while healthy appsettings remains independently usable ... ok (389µs)
Aspire CLI source uses the 13.4 machine query and parses banner-prefixed resources ... ok (1ms)
Aspire CLI absence, non-zero exit, and parse failure are explicit failed rows ... ok (101ms)
Aspire CLI accepts casing drift and bounded trailing output while preserving identity ... ok (696µs)
Aspire CLI rejects torn output, foreign resources, and AppHost restart races ... ok (619µs)
running 1 test from ./packages/mcp/tests/stdio_test.ts
stdio initialize, list, and unreachable doctor round trip ... ok (152ms)
running 6 tests from ./packages/mcp/tests/telemetry-aggregation_test.ts
domain classification and identity precedence are deterministic ... ok (971µs)
last job result selects newest completed span by optional name or id ... ok (638µs)
service performance uses nearest-rank percentiles and stable grouping ... ok (439µs)
db bottlenecks include NetScript KV and OTel db namespace and rank total time ... ok (444µs)
app status and recent errors group semantic telemetry ... ok (448µs)
span tree bounds cycles, depth, and count ... ok (857µs)
running 2 tests from ./packages/mcp/tests/telemetry-endpoint_test.ts
telemetry endpoint precedence is explicit, env, Aspire port, default ... ok (1ms)
telemetry endpoint resolver ignores invalid and empty values ... ok (155µs)
running 3 tests from ./packages/mcp/tests/telemetry-flows_test.ts
all four telemetry flows return bounded semantic summaries ... ok (1ms)
trace intelligence flows apply windows and return structured empty summaries ... ok (1ms)
get_run returns structured not found ... ok (98µs)
running 1 test from ./packages/mcp/tests/telemetry-live-fixture_test.ts
MCP adapter and telemetry flows consume the captured Aspire 13.4.6 shape ... ok (18ms)
running 4 tests from ./packages/mcp/tests/truncation_test.ts
truncation recursively bounds arrays and strings ... ok (1ms)
75 rows cannot become 50 rows with false truncation metadata ... ok (350µs)
nested truncation marks existing metadata on every declaring ancestor ... ok (160µs)
irreducibly large bounded results fail the UTF-8 byte ceiling ... ok (946µs)
running 1 test from ./packages/plugin-ai-core/src/contracts/v1/base-error-adapter_test.ts
base error adapter validates the Standard Schema boundary ... ok (2ms)
running 3 tests from ./packages/plugin-ai-core/tests/contracts/ai-contract-soundness_test.ts
chat chunk schema validates the reasoning-delta frame (lockstep with @netscript/ai) ... ok (4ms)
ai contract exposes a precise, non-loosened type surface ... ok (199µs)
ai contract carries validated Standard Schema base error data ... ok (107µs)
running 2 tests from ./packages/plugin-auth-core/src/config/config_test.ts
AuthConfigSchema applies backend and session defaults ... ok (3ms)
AuthSessionPolicySchema validates cookie policy knobs ... ok (716µs)
running 5 tests from ./packages/plugin-auth-core/src/contracts/v1/auth.contract_test.ts
authContract exposes the v1 auth procedures ... ok (651µs)
authContractV1 exposes typed context-bound procedures and errors ... ok (336µs)
SigninInputSchema validates provider signin input ... ok (959µs)
CallbackInputSchema accepts provider callback fields ... ok (517µs)
AuthSessionResponseSchema defaults response claims ... ok (1ms)
running 1 test from ./packages/plugin-auth-core/src/contracts/v1/base-error-adapter_test.ts
base error adapter validates the Standard Schema boundary ... ok (2ms)
running 1 test from ./packages/plugin-auth-core/src/domain/domain_test.ts
AuthSessionSchema validates normalized sessions ... ok (2ms)
running 8 tests from ./packages/plugin-auth-core/src/ports/ports_test.ts
createAuthBackendRegistry resolves the default backend ... ok (648µs)
createAuthBackendRegistry resolves named backends from the map seam ... ok (112µs)
AuthBackendPort can expose an optional typed interactive sub-port ... ok (5ms)
createAuthBackendRegistry throws for missing backends ... ok (667µs)
AuthBackendPort remains contract-only for async backends ... ok (346µs)
createHmacSessionTokenCrypto round-trips a signed session id ... ok (1ms)
createHmacSessionTokenCrypto binds the full payload without decorative entropy ... ok (364µs)
createHmacSessionTokenCrypto rejects same-length signature tampering ... ok (674µs)
running 2 tests from ./packages/plugin-auth-core/src/presets/presets_test.ts
createAuthPresetRegistry registers provider presets by kind and id ... ok (576µs)
createAuthPresetRegistry rejects duplicate preset keys ... ok (494µs)
running 3 tests from ./packages/plugin-auth-core/src/streams/streams_test.ts
AuthStreamEventSchema validates known auth event names ... ok (18ms)
AuthStreamSessionSchema validates stream session entities ... ok (1ms)
authStreamSchema exposes the authSession collection ... ok (55µs)
running 3 tests from ./packages/plugin-auth-core/src/telemetry/telemetry_test.ts
hashSubject returns a stable salted HMAC without raw subject material ... ok (14ms)
redactAuthPrincipal hashes subject and removes token-bearing claims ... ok (605µs)
createAuthTelemetry records audit-safe auth attributes and events ... ok (1ms)
running 2 tests from ./packages/plugin-auth-core/src/testing/testing_test.ts
buildAuthUser creates overrideable users ... ok (516µs)
buildAuthSession creates overrideable sessions ... ok (158µs)
running 2 tests from ./packages/plugin-auth-core/tests/contracts/auth-contract-soundness_test.ts
auth contract exposes a precise, non-loosened type surface ... ok (659µs)
auth contract carries validated Standard Schema base error data ... ok (164µs)
running 7 tests from ./packages/plugin-sagas-core/src/stores/kv-saga-store_test.ts
KvSagaStore round-trips state envelopes with memory ... ok (3ms)
KvSagaStore round-trips state envelopes with deno-kv ... ok (6ms)
KvSagaStore saves and resolves correlations ... ok (341µs)
KvSagaStore appends transition log records in version order ... ok (457µs)
KvSagaStore rejects stale expected versions with memory ... ok (633µs)
KvSagaStore rejects stale expected versions with deno-kv ... ok (1ms)
KvSagaStore deletes state, transitions, and matching correlations ... ok (561µs)
running 7 tests from ./packages/plugin-sagas-core/src/stores/prisma-saga-store_integration_test.ts
Prisma saga integration accepts a loopback throwaway database URL ... ok (8ms)
Prisma saga integration rejects a remote database URL without leaking credentials ... ok (797µs)
Prisma saga integration rejects a non-throwaway database name ... ok (156µs)
Prisma saga integration rejects a non-Postgres protocol ... ok (121µs)
Prisma saga integration rejects a malformed database URL ... ok (256µs)
Prisma saga integration keeps every npm Prisma specifier at one version ... ok (672µs)
PrismaSagaStore round-trips through the shipped fragment on Postgres ... ignored (0ms)
running 6 tests from ./packages/plugin-sagas-core/src/stores/prisma-saga-store_test.ts
PrismaSagaStore selector is derived from the shipped schema fragment ... ok (2ms)
PrismaSagaStore round-trips state envelopes ... ok (977µs)
PrismaSagaStore saves and resolves correlations ... ok (357µs)
PrismaSagaStore appends transition log records in version order ... ok (339µs)
PrismaSagaStore rejects stale expected versions with KV parity message ... ok (521µs)
PrismaSagaStore deletes state, transitions, and matching correlations ... ok (318µs)
running 5 tests from ./packages/plugin-sagas-core/src/stores/saga-store-backend_test.ts
resolveSagaStoreBackend reads NETSCRIPT_SAGA_STORE ... ok (618µs)
resolveSagaStoreBackend reads appsettings sagas.store.backend ... ok (138µs)
resolveSagaStoreBackend gives env precedence over appsettings ... ok (70µs)
resolveSagaStoreBackend rejects invalid backend ... ok (524µs)
resolveSagaStoreBackend requires explicit selection ... ok (104µs)
running 1 test from ./packages/plugin-sagas-core/tests/contracts/sagas-contract-soundness_test.ts
sagas contract exposes a precise, non-loosened type surface ... ok (759µs)
running 4 tests from ./packages/plugin-sagas-core/tests/runtime/checkout-saga-contract_test.ts
checkout tutorial sends and delivers only internal saga messages ... ok (14ms)
constructing spawn rejects before an unsupported effect enters the ledger ... ok (1ms)
dispatching a deserialized spawn effect retains the defensive rejection ... ok (336µs)
dispatching an unknown cascade kind fails loudly with the effect name ... ok (130µs)
running 2 tests from ./packages/plugin-sagas-core/tests/runtime/create-saga-runtime_test.ts
createSagaRuntime warns once when native runtime is composed without a store ... ok (13ms)
createSagaRuntime does not warn when native runtime has a store ... ok (1ms)
running 3 tests from ./packages/plugin-sagas-core/tests/runtime/saga-concurrency_test.ts
native runtime rejects overlapping publishes for the same concurrency key ... ok (14ms)
native runtime allows overlapping publishes for different concurrency keys ... ok (1ms)
native bridge carries cascaded send concurrency keys into saga messages ... ok (373µs)
running 5 tests from ./packages/plugin-sagas-core/tests/runtime/saga-engine_applied_keys_test.ts
SagaEngine short-circuits duplicate applied keys before handler effects persist ... ok (12ms)
SagaEngine applies messages without idempotency keys unchanged ... ok (1ms)
SagaEngine scopes applied keys by saga instance ... ok (339µs)
SagaEngine publish options supply idempotency keys for raw engine consumers ... ok (302µs)
MemorySagaAppliedKeyStore records first application and rejects duplicates ... ok (128µs)
running 5 tests from ./packages/plugin-sagas-core/tests/runtime/saga-idempotency_test.ts
SagaIdempotencyDedupTable reserves target-key tuples until ttl expiry ... ok (11ms)
native runtime deduplicates direct publishes by message target and idempotency key ... ok (2ms)
native runtime uses injected durable idempotency port ... ok (466µs)
MemorySagaIdempotencyStore is local-only adapter compatible with the durable port ... ok (936µs)
native runtime deduplicates cascaded sends by target and idempotency key ... ok (599µs)
running 1 test from ./packages/plugin-sagas-core/tests/runtime/saga-runtime_applied_keys_test.ts
createSagaRuntime forwards engineOptions.appliedKeys to the native engine ... ok (12ms)
running 1 test from ./packages/plugin-sagas-core/tests/runtime/saga-scheduler_test.ts
SagaScheduler drain reports dispatch and markFailed errors ... ok (12ms)
running 6 tests from ./packages/plugin-sagas-core/tests/runtime/saga-store_test.ts
native runtime loads and saves saga state between correlated messages ... ok (13ms)
native runtime persists transition from snapshot before in-place mutation ... ok (1ms)
native runtime persists terminal status from failure and compensation cascades ... ok (621µs)
native runtime separates concurrent workflows by definition correlation extractor ... ok (400µs)
native runtime resumes one extracted workflow across distinct message ids ... ok (293µs)
native runtime falls back from undefined extractor to explicit key then stable default ... ok (249µs)
running 1 test from ./packages/plugin-sagas-core/tests/runtime/start-sagas_test.ts
startSagas returns a runtime that accepts publish immediately ... ok (14ms)
running 5 tests from ./packages/plugin-sagas-core/tests/stores/kv-saga-runtime-stores_test.ts
KvSagaIdempotencyStore reserves first key, rejects duplicate, and accepts after ttl with memory ... ok (1s)
KvSagaIdempotencyStore reserves first key, rejects duplicate, and accepts after ttl with deno-kv ... ok (1s)
KvSagaIdempotencyStore shares reservations across fresh store instances ... ok (876µs)
KvSagaAppliedKeyStore records exactly one concurrent applied key with memory ... ok (1ms)
KvSagaAppliedKeyStore records exactly one concurrent applied key with deno-kv ... ok (2ms)
running 2 tests from ./packages/plugin-sagas-core/tests/stores/kv-saga-store_redis_test.ts
KvSagaStore over Redis fails a dead endpoint loudly instead of hanging ... ok (769ms)
KvSagaStore over real Redis lists entries and admits one expected-version save ... ignored (0ms)
running 1 test from ./packages/plugin-sagas-core/tests/telemetry/instrumentation_test.ts
SagaInstrumentation.startHandleSpan forwards parent trace context to tracer ... ok (13ms)
running 2 tests from ./packages/plugin-sagas-core/tests/telemetry/otel-saga-telemetry_test.ts
createOtelSagaTracer attaches real SDK fan-in links with saga attributes ... ok (12ms)
createSagaTelemetry creates the seven shared saga instruments ... ok (440µs)
running 3 tests from ./packages/plugin-sagas-core/tests/telemetry/saga-engine-spans_test.ts
SagaEngine emits one successful saga.handle span for a handled message ... ok (13ms)
SagaEngine records an ERROR span and rethrows when a handler throws ... ok (1ms)
createSagaRuntime threads native instrumentation into the saga engine ... ok (679µs)
running 4 tests from ./packages/plugin-sagas-core/tests/testing/testing-helpers_test.ts
MemorySagaStore persists state and correlation entries ... ok (805µs)
RecordingSagaStore records delegated operations ... ok (176µs)
TestSagaClock advances deterministically ... ok (165µs)
createTestSagaRuntime records publications on memory bus ... ok (163µs)
running 3 tests from ./packages/plugin-streams-core/tests/adapters/durable-stream-producer-transport_test.ts
producer transport retains the exact body and idempotency tuple ... ok (20ms)
producer transport classifies retry, stale epoch, gap, and closed responses ... ok (1ms)
producer transport turns a hung request timeout into a retryable failure ... ok (6ms)
running 2 tests from ./packages/plugin-streams-core/tests/application/create-service-stream-producer_test.ts
createServiceStreamProducer resolves Aspire streams discovery and reaches the resolved endpoint ... ok (18ms)
createServiceStreamProducer fails fast when the streams service is not wired ... ok (687µs)
running 4 tests from ./packages/plugin-streams-core/tests/application/durable-stream-producer-contract_behavior_test.ts
count overflow rejects the newest write with an explicit receipt ... ok (12ms)
byte overflow rejects an oversized write with an explicit receipt ... ok (1ms)
stop during backoff cancels an unattempted accepted write ... ok (1ms)
readiness resolves only after a reconnect reaches ready ... ok (506µs)
running 4 tests from ./packages/plugin-streams-core/tests/application/durable-stream-producer-reconnect_behavior_test.ts
BEHAVIORAL initial outage reconnects the same producer before a later write ... ok (138ms)
BEHAVIORAL mid-session outage retries the failed in-flight write ... ok (90ms)
BEHAVIORAL recovery delivers a write accepted before the server starts ... ok (94ms)
BEHAVIORAL FIFO ordering survives writes that straddle an outage ... ok (105ms)
running 3 tests from ./packages/plugin-streams-core/tests/application/durable-stream-producer_test.ts
DurableStreamProducer rejects unserializable writes through receipts ... ok (30ms)
DurableStreamProducer close completes after an aborted connection ... ok (3ms)
DurableStreamProducer fails synchronously when streams URL is unavailable ... ok (506µs)
running 6 tests from ./packages/plugin-streams-core/tests/application/stream-sse-v1_test.ts
v1 authority exhaustively separates wire names from consumer outcomes ... ok (578µs)
data schema accepts an ordered batch with W3C identity and deletion semantics ... ok (308µs)
malformed and unknown frames are non-retryable and never invent an offset ... ok (301µs)
replay commits opaque offset, cursor, and terminal state only on control ... ok (183µs)
up-to-date control without pending data is a heartbeat outcome ... ok (145µs)
native binding registers named events and preserves replay state on errors ... ok (785µs)
running 2 tests from ./packages/plugin-streams-core/tests/telemetry/durable-stream-producer-telemetry_test.ts
one publish span and trace identity survive retry through receipt settlement ... ok (16ms)
producer metrics distinguish rejected, dropped, and delivery-unknown writes ... ok (1ms)
running 3 tests from ./packages/plugin-streams-core/tests/telemetry/instrumentation_test.ts
StreamsInstrumentation emits producer span and injects trace headers on publish ... ok (13ms)
StreamsInstrumentation starts consumer span with SDK fan-in link attributes ... ok (1ms)
StreamsInstrumentation preserves W3C tracestate in emitted write headers ... ok (319µs)
running 2 tests from ./packages/plugin-streams-core/tests/testing/memory-stream-producer_test.ts
MemoryStreamProducer records upsert and delete events ... ok (755µs)
createStreamTopicFixture returns an execution collection schema ... ok (212µs)
running 1 test from ./packages/plugin-triggers-core/src/adapters/cron-trigger-scheduler-adapter_test.ts
CronTriggerSchedulerAdapter forwards the cron attempt to scheduled events ... ok (835µs)
running 1 test from ./packages/plugin-triggers-core/src/builders/trigger-definition-fields_test.ts
trigger builders preserve optional name and enabled fields ... ok (971µs)
running 8 tests from ./packages/plugin-triggers-core/src/runtime/compute-next-fire-times_test.ts
computeNextFireTimes handles spring-forward skipped wall time ... ok (4ms)
computeNextFireTimes returns both fall-back occurrences ... ok (649µs)
computeNextFireTimes handles UTC-offset timezones without DST ... ok (6ms)
computeNextFireTimes defaults from to current time ... ok (427µs)
computeNextFireTimes returns the requested number of preview instants ... ok (551µs)
computeNextFireTimes supports leap-day recurrences ... ok (8s)
computeNextFireTimes throws a typed error for impossible cron dates ... ok (2ms)
computeNextFireTimes handles every-N-minutes intervals ... ok (1ms)
running 2 tests from ./packages/plugin-triggers-core/src/runtime/create-event-subscription_test.ts
createEventSubscription filters live lifecycle messages ... ok (907µs)
createTriggerIngress publishes accepted, started, and terminal events ... ok (6ms)
running 1 test from ./packages/plugin-triggers-core/src/runtime/create-manual-dispatcher_test.ts
createManualDispatcher persists and processes manual fire events ... ok (1ms)
running 3 tests from ./packages/plugin-triggers-core/src/runtime/create-trigger-ingress_test.ts
createTriggerIngress returns 202 before processor work completes ... ok (6ms)
createTriggerIngress stores malformed JSON as raw text ... ok (488µs)
createTriggerIngress logs status update failures from async processing ... ok (479µs)
running 2 tests from ./packages/plugin-triggers-core/src/runtime/create-webhook-test-delivery_test.ts
createWebhookTestDelivery signs HMAC requests through ingress ... ok (8ms)
createWebhookTestDelivery honors memory verifier definitions through ingress ... ok (922µs)
running 5 tests from ./packages/plugin-triggers-core/src/runtime/trigger-processor_test.ts
TriggerProcessor dispatches handler actions once ... ok (1ms)
TriggerProcessor rejects duplicate idempotency claims ... ok (319µs)
TriggerProcessor moves exhausted retry failures to DLQ ... ok (344µs)
TriggerProcessor applies jitter to retry delay ... ok (9ms)
TriggerProcessor rejects reserved trigger kinds ... ok (601µs)
running 2 tests from ./packages/plugin-triggers-core/src/stores/kv-trigger-defer-scheduler_test.ts
KV defer scheduler fires once at due time and survives adapter restart ... ok (2ms)
KV defer scheduler cancels before due and retains failed past-due replay ... ok (905µs)
running 2 tests from ./packages/plugin-triggers-core/src/stores/kv-trigger-enabled-state-store_test.ts
KvTriggerEnabledStateStore records overrides only with atomic KV ... ok (2ms)
KvTriggerEnabledStateStore supports sequential KV adapters ... ok (518µs)
running 3 tests from ./packages/plugin-triggers-core/src/stores/kv-trigger-runtime-stores_test.ts
KvTriggerEventStore persists, lists, updates, and loads events with MemoryKvAdapter ... ok (2ms)
KvTriggerIdempotencyStore rejects duplicate active and completed claims with MemoryKvAdapter ... ok (655µs)
KvTriggerDlqStore enqueues, lists, filters, and replays entries with MemoryKvAdapter ... ok (469µs)
running 5 tests from ./packages/plugin-triggers-core/src/telemetry/instrumentation_test.ts
ingress span carries netscript.* attributes and SERVER kind (TC-5/TC-6) ... ok (857µs)
deprecated bare aliases are emitted during the window (TC-6 alias) ... ok (263µs)
finishSpan sets outcome + error_class under canonical and alias keys (TC-7/TC-8) ... ok (318µs)
ingress metric records outcome under canonical + alias keys (TC-11) ... ok (83µs)
every canonical trigger attribute is netscript.* namespaced (TC-6) ... ok (163µs)
running 5 tests from ./packages/plugin-triggers-core/src/testing/testing_test.ts
testing stores record and filter trigger events ... ok (805µs)
MemoryTriggerIdempotencyStore applies caller, header, and payload-hash precedence ... ok (682µs)
inline processor invokes handler and reports deferred status ... ok (241µs)
memory scheduler and file watcher emit unified trigger events ... ok (326µs)
TriggerTestClock advances deterministically ... ok (211µs)
running 1 test from ./packages/plugin-triggers-core/tests/contracts/triggers-contract-soundness_test.ts
triggers contract exposes a precise, non-loosened type surface ... ok (954µs)
running 5 tests from ./packages/plugin-workers-core/src/stores/kv-worker-idempotency-store_test.ts
KvWorkerIdempotencyStore claims first delivery and rejects duplicate active claim ... ok (8ms)
KvWorkerIdempotencyStore release allows a failed delivery to retry ... ok (954µs)
KvWorkerIdempotencyStore markApplied rejects later completed duplicate ... ok (741µs)
KvWorkerIdempotencyStore active TTL frees stale claims ... ok (22ms)
KvWorkerIdempotencyStore rejects incomplete KV implementations ... ok (670µs)
running 3 tests from ./packages/plugin-workers-core/tests/contracts/workers-contract-base-seam_test.ts
workers contract conforms to the base plugin seam (satisfies BasePluginContract) ... ok (445µs)
bound workers v1 contract exposes the mandatory describe route ... ok (234µs)
workers capabilities document validates against PluginCapabilitiesSchema ... ok (1ms)
running 1 test from ./packages/plugin-workers-core/tests/contracts/workers-contract-soundness_test.ts
workers contract exposes a precise, non-loosened type surface ... ok (982µs)
running 6 tests from ./packages/plugin-workers-core/tests/executor/argv-builder_test.ts
buildDenoCommand includes permissions, import map, and args ... ok (1ms)
buildPythonCommand prefers virtual environment Python ... ok (265µs)
buildDotNetCommand supports project mode and runtime args ... ok (136µs)
buildShellCommand augments Git Bash PATH on Windows ... ok (165µs)
buildPowerShellCommand uses pwsh off Windows ... ok (280µs)
buildCmdCommand and buildExecutableCommand preserve task args ... ok (187µs)
running 2 tests from ./packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts
DenoRuntimeAdapter executes a script and captures output ... ok (31ms)
DenoRuntimeAdapter captures a non-zero exit ... ok (16ms)
running 4 tests from ./packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts
MultiRuntimeTaskExecutor exports task execution spans through telemetry tracer ... ok (12ms)
MultiRuntimeTaskExecutor dispatches to adapter by task type ... ok (657µs)
MultiRuntimeTaskExecutor prefers custom adapters over built-ins ... ok (395µs)
MultiRuntimeTaskExecutor returns failure result for unsupported runtimes ... ok (156µs)
running 1 test from ./packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts
InProcessJobDispatcher imports sourceUrl before entrypoint for plugin jobs ... ok (8ms)
running 3 tests from ./packages/plugin-workers-core/tests/runtime/worker-idempotency_test.ts
resolveWorkerIdempotencyKey prefers caller key over message id and payload hash ... ok (7ms)
resolveWorkerIdempotencyKey uses message id when caller key is absent ... ok (242µs)
resolveWorkerIdempotencyKey hashes payload deterministically as final fallback ... ok (787µs)
running 3 tests from ./packages/plugin-workers-core/tests/streams/workers-streams_test.ts
toExecutionStreamEntity maps execution records to stream entities ... ok (11ms)
createStreamMutationHook upserts and deletes execution entities ... ok (1ms)
WorkerJobSchema keeps the public job stream surface thin ... ok (1ms)
running 2 tests from ./packages/plugin-workers-core/tests/testing/memory-worker_test.ts
MemoryWorker executes job handlers and records dispatches ... ok (7ms)
createTestWorkersRuntime wires memory ports ... ok (619µs)
running 4 tests from ./packages/plugin/src/adapter/commands/install_test.ts
runInstallCommand writes starter artifacts through the shared emit path ... ok (959µs)
runInstallCommand omits samples and emits alternate structural artifacts ... ok (271µs)
runInstallCommand preserves emit-all behavior when samples policy is undefined ... ok (317µs)
runInstallCommand reports plugin-declared UI registry requirements ... ok (156µs)
running 1 test from ./packages/plugin/src/adapter/factory_test.ts
createPluginAdapter creates CLI and scaffold entrypoints ... ok (1ms)
running 1 test from ./packages/plugin/src/adapter/item/item-scaffolder_test.ts
ItemScaffolder emits typed scaffold artifacts ... ok (656µs)
running 2 tests from ./packages/plugin/src/adapter/item/substitute_test.ts
substituteTokens replaces declared named tokens ... ok (566µs)
TokenValues requires every declared token at type-check time ... ok (156µs)
running 3 tests from ./packages/plugin/src/adapter/runner/plugin-cli-runner_test.ts
runPluginCliCommand routes mandatory info command ... ok (1ms)
runPluginCliCommand routes resources through item scaffolders ... ok (721µs)
runPluginCliCommand routes plugin-owned extra commands ... ok (140µs)
running 1 test from ./packages/plugin/src/adapter/scaffold-cli-runner_test.ts
runPluginScaffoldCli prints one JSON stdout line and keeps logs on stderr ... ok (59ms)
running 1 test from ./packages/plugin/src/sdk/discovery/manifest-resolver_test.ts
ModuleManifestResolver follows workspace package exports absent from root imports ... ok (26ms)
running 2 tests from ./packages/plugin/src/service/presentation/create-plugin-service-rawroute_test.ts
proxy/passthrough mode: serveRpc=false routes everything through the catch-all ...
------- post-test output -------
08:27:29.690 INF netscript·services·proxy-test Service listening
08:27:29.694 INF netscript·services·proxy-test HTTP request started
08:27:29.696 INF netscript·services·proxy-test HTTP request completed
08:27:29.697 INF netscript·services·proxy-test HTTP request started
08:27:29.697 INF netscript·services·proxy-test HTTP request completed
08:27:29.698 INF netscript·services·proxy-test Service shutdown completed
----- post-test output end -----
proxy/passthrough mode: serveRpc=false routes everything through the catch-all ... ok (22ms)
mixed mode: a raw webhook route coexists with the default withRPC wiring ...
------- post-test output -------
08:27:29.708 INF netscript·services·webhook-test Service listening
08:27:29.709 INF netscript·services·webhook-test HTTP request started
08:27:29.709 INF netscript·services·webhook-test HTTP request completed
08:27:29.710 INF netscript·services·webhook-test Service shutdown completed
----- post-test output end -----
mixed mode: a raw webhook route coexists with the default withRPC wiring ... ok (6ms)
running 2 tests from ./packages/plugin/tests/_fixtures/readme-examples_test.ts
README definePlugin example creates an inspectable plugin manifest ... ok (2ms)
author guide manifest example uses the public typestate builder ... ok (295µs)
running 1 test from ./packages/plugin/tests/adapters/memory-file-system_test.ts
memory file system adapter implements text file operations ... ok (570µs)
running 2 tests from ./packages/plugin/tests/application/plugin-loader_test.ts
loadPluginManifest returns the resolver manifest ... ok (582µs)
loadPluginManifest preserves unresolved plugin manifests ... ok (54µs)
running 2 tests from ./packages/plugin/tests/application/plugin-registry_test.ts
PluginRegistry resolves plugins and rejects duplicates ... ok (1ms)
inspectPlugin reports plugin registry diagnostics ... ok (90µs)
running 2 tests from ./packages/plugin/tests/cli/argv_test.ts
normalizePluginArgv parses long flags and positional values ... ok (727µs)
parsePluginCliArgs defaults to info and parses the remaining argv ... ok (201µs)
running 1 test from ./packages/plugin/tests/cli/base-meta-commands_test.ts
createBaseMetaCommands exposes status, health, and info ... ok (1ms)
running 2 tests from ./packages/plugin/tests/cli/generated-project-registry_test.ts
findGeneratedProjectRoot resolves file URLs and relative paths ... ok (747µs)
loadGeneratedProjectRegistry validates exported entries ... ok (448µs)
running 3 tests from ./packages/plugin/tests/cli/plugin-cli_test.ts
mounted plugin CLI commands run through composition helpers ... ok (881µs)
ItemScaffolder and PluginRuntimeConfigCli define stable contracts ... ok (331µs)
doctor reports are passing only when every check passes ... ok (266µs)
running 2 tests from ./packages/plugin/tests/contract-base/base-contract_test.ts
BASE_PLUGIN_CONTRACT_ROUTES exposes the mandatory describe route ... ok (671µs)
PluginCapabilitiesSchema validates a capabilities document ... ok (753µs)
running 1 test from ./packages/plugin/tests/diagnostics/e2e-gate_test.ts
PluginE2eGate carries the shared gate field contract ... ok (555µs)
running 7 tests from ./packages/plugin/tests/diagnostics/probes_test.ts
normalizeProbePath ensures a single leading slash ... ok (471µs)
joinProbeUrl strips a trailing base slash and normalizes the path ... ok (187µs)
summarizeResponse captures status fields and a bounded body preview ... ok (4ms)
assertSuccessfulProbe passes for 2xx and throws otherwise ... ok (643µs)
resolveProbeUrl reproduces workers behavior (single var, no trailing-slash strip) ... ok (228µs)
resolveProbeUrl reproduces sagas behavior (two vars, trailing-slash strip) ... ok (287µs)
resolveProbeUrl reproduces streams behavior (two vars, trailing-slash strip) ... ok (75µs)
running 18 tests from ./packages/plugin/tests/diagnostics/verify-plugin_test.ts
verifyPlugin passes when the manifest satisfies every expectation ... ok (753µs)
verifyPlugin attaches the inspection report even when checks fail ... ok (78µs)
verifyPlugin reports a name mismatch ... ok (101µs)
verifyPlugin reports a version mismatch with both versions ... ok (57µs)
verifyPlugin skips the version check when no version is expected ... ok (132µs)
verifyPlugin reports a missing dependency ... ok (181µs)
verifyPlugin reports a missing service contribution ... ok (99µs)
verifyPlugin reports a service entrypoint/port mismatch ... ok (81µs)
verifyPlugin reports a missing background processor ... ok (74µs)
verifyPlugin reports a missing stream topic ... ok (110µs)
verifyPlugin reports a missing telemetry contribution ... ok (52µs)
verifyPlugin reports a runtime config topic schemaPath mismatch ... ok (59µs)
verifyPlugin reports a database schema mismatch ... ok (41µs)
verifyPlugin reports a contract version mismatch ... ok (128µs)
verifyPlugin reports an e2e gate command mismatch ... ok (77µs)
verifyPlugin reports an aspire module mismatch ... ok (68µs)
verifyPlugin reports a missing helper ... ok (75µs)
verifyPlugin accumulates findings across multiple failing axes ... ok (100µs)
running 2 tests from ./packages/plugin/tests/domain/core-types_test.ts
plugin domain constants expose finite vocabularies ... ok (894µs)
plugin metadata and context types accept runtime-safe shapes ... ok (151µs)
running 1 test from ./packages/plugin/tests/domain/errors_test.ts
plugin domain errors preserve names and inheritance ... ok (934µs)
running 10 tests from ./packages/plugin/tests/protocol/plugin-manifest_test.ts
parsePluginManifest accepts a known-good installer manifest ... ok (3ms)
parsePluginManifest accepts third-party linking without officialSource ... ok (687µs)
parsePluginManifest accepts all shipped plugin manifests ... ok (3ms)
parsePluginManifest preserves the complete service quadruple ... ok (240µs)
parsePluginManifest preserves an absent service quadruple ... ok (302µs)
parsePluginManifest accepts a provider service without officialSource ... ok (239µs)
parsePluginManifest rejects every partial officialSource service triple ... ok (1ms)
parsePluginManifest rejects malformed manifests with useful issues ... ok (450µs)
parsePluginManifest rejects unsupported schemaVersion values ... ok (61µs)
parsePluginManifest rejects unsafe scaffolder and post-script exports ... ok (454µs)
running 2 tests from ./packages/plugin/tests/scaffold/scaffold-generators_test.ts
renderRegistrySource emits deterministic registry source ... ok (691µs)
renderRuntimeRegistrySource emits registry and runtime binding ... ok (243µs)
running 5 tests from ./packages/plugin/tests/sdk/walker-ports_test.ts
WalkerPort contract returns walked files for a root ... ok (6ms)
ExtractorPort contract returns contribution candidates from files ... ok (1ms)
EmitterPort contract emits a registry artifact ... ok (756µs)
ManifestResolverPort contract resolves optional manifests ... ok (231µs)
runWalkerPipeline composes walker extractor and emitter ports ... ok (905µs)
running 2 tests from ./packages/plugin/tests/sdk/watcher-cleanup_test.ts
watcher handle stop resolves for no-op discovery watcher ... ok (513µs)
startWatcher returns a cleanup handle ... ok (60µs)
running 2 tests from ./packages/plugin/tests/service/create-plugin-service_test.ts
createPluginService serves health, service info, and the describe oRPC route ... ok (27ms)
createPluginService runs onStartup hooks on serve() ...
------- post-test output -------
08:27:31.967 INF netscript·services·sample Service listening
08:27:31.969 INF netscript·services·sample Service shutdown completed
----- post-test output end -----
createPluginService runs onStartup hooks on serve() ... ok (7ms)
running 1 test from ./packages/plugin/tests/service/plugin-contract-binder_test.ts
bindPluginContract binds handlers and assembles a versioned router ... ok (7ms)
running 2 tests from ./packages/prisma-adapter-mysql/tests/capabilities_test.ts
inferCapabilities enables relation joins for supported MySQL versions ... ok (595µs)
inferCapabilities disables relation joins for old MySQL and MariaDB ... ok (175µs)
running 3 tests from ./packages/prisma-adapter-mysql/tests/conversion_test.ts
mapColumnType maps common MySQL types to Prisma column types ... ok (592µs)
mapArg converts Prisma transport values for MySQL parameters ... ok (256µs)
mapRow converts rows to Prisma result arrays ... ok (327µs)
running 3 tests from ./packages/prisma-adapter-mysql/tests/errors_test.ts
mapDriverError maps unique constraint violations ... ok (1ms)
mapDriverError maps authentication failures ... ok (176µs)
convertDriverError preserves non-driver errors by throwing them ... ok (551µs)
running 1 test from ./packages/queue/tests/_fixtures/docs-examples_test.ts
README typed queue example validates and processes a message ... ok (16ms)
running 3 tests from ./packages/queue/tests/abort-cleanup_test.ts
kv-polling listener clears timers after abort ... ok (8ms)
amqp listener closes connection when stopped ... ok (104ms)
redis listener disconnects blocking client on abort ... ok (105ms)
running 2 tests from ./packages/queue/tests/dead-letter-store_test.ts
KvDeadLetterStore appends, lists, counts, and reprocesses records ... ok (7ms)
KvDeadLetterStore can wrap an injected raw Deno KV lazily ... ok (2ms)
running 3 tests from ./packages/queue/tests/envelope_test.ts
createEnvelope preserves payload and enqueue headers ... ok (1ms)
isMessageEnvelope distinguishes normalized envelopes ... ok (266µs)
createMessageContext exposes ack and nack callbacks ... ok (322µs)
running 2 tests from ./packages/queue/tests/errors_test.ts
QueueError stores code, cause, and context ... ok (877µs)
queue error subclasses preserve standardized codes ... ok (371µs)
running 2 tests from ./packages/queue/tests/fedify-adapter-dlq_test.ts
DenoKvAdapter terminal nack writes to the dead-letter store ... ok (9ms)
AmqpAdapter terminal nack writes to the dead-letter store ... ok (262µs)
running 1 test from ./packages/queue/tests/kv-polling-dlq_test.ts
KvPollingAdapter routes terminal nacks through the dead-letter store ... ok (6ms)
running 4 tests from ./packages/queue/tests/memory-queue_test.ts
memory queue preserves requeued item settlement state ... ok (2ms)
memory queue listen exits when caller signal is already aborted ... ok (9ms)
memory queue wait removes abort listeners after empty polls ... ok (23ms)
memory queue dead-letters terminal nacks into the configured store ... ok (478µs)
running 2 tests from ./packages/queue/tests/options_test.ts
QueueProvider exposes the supported provider identifiers ... ok (1ms)
QueueOptions accepts an injected dead-letter store ... ok (302µs)
running 5 tests from ./packages/queue/tests/postgres-adapter_test.ts
PostgresAdapter publishes, consumes, and acknowledges with table-backed claims ... ok (9ms)
PostgresAdapter nacks with requeue by releasing the claim ... ok (497µs)
PostgresAdapter dead-letters explicit terminal nacks before deleting the row ... ok (578µs)
PostgresAdapter dead-letters requeued failures after max attempts ... ok (691µs)
createQueue(Postgres) no longer returns the not-implemented stub ... ok (692µs)
running 2 tests from ./packages/queue/tests/provider-dead-letter-store_test.ts
PostgresDeadLetterStore appends idempotently, lists, counts, and reprocesses ... ok (1ms)
RedisDeadLetterStore uses list commands for append, list, count, and reprocess ... ok (316µs)
running 1 test from ./packages/queue/tests/redis-adapter-dlq_test.ts
RedisAdapter dead-letters explicit terminal nacks instead of dropping ... ok (7ms)
running 3 tests from ./packages/queue/tests/typed-queue_test.ts
createTypedQueue exposes the schema and native retrial flag ... ok (15ms)
createTypedQueue rejects invalid messages before touching the backend ... ok (4ms)
createTypedQueue sends invalid dequeue messages to the configured DLQ store ... ok (88ms)
running 4 tests from ./packages/queue/tests/validation_test.ts
safeValidate returns parsed data on success ... ok (671µs)
safeValidate returns error message on failure ... ok (83µs)
validateOrThrow wraps schema failures in QueueValidationError ... ok (330µs)
withValidation validates before running the handler ... ok (503µs)
running 3 tests from ./packages/runtime-config/tests/accessors_test.ts
accessors: resolve overrides by identifier ... ok (619µs)
accessors: return undefined for missing identifiers ... ok (1ms)
isFeatureEnabled: uses explicit flag value or default fallback ... ok (315µs)
running 4 tests from ./packages/runtime-config/tests/loader_test.ts
loadRuntimeConfig: returns empty defaults when pointer is missing ... ok (2ms)
loadRuntimeConfig: loads topic files from JSON pointer ... ok (6ms)
loadRuntimeConfig: derives conventional topic files from plain pointer ... ok (1ms)
loadRuntimeConfig: returns empty defaults when JSON pointer paths are malformed ... ok (885µs)
running 2 tests from ./packages/runtime-config/tests/summary_test.ts
summarizeRuntimeConfig: returns structured disabled override summary ... ok (1ms)
summarizeRuntimeConfig: includes only source message for empty config ... ok (745µs)
running 1 test from ./packages/sdk/src/cache/cache-provider_test.ts
uninitialized cache provider error names the registration import ... ok (503µs)
running 4 tests from ./packages/sdk/tests/auto-update/release-client_test.ts
release URL uses the literal linux-x86_64 Deno target vocabulary ... ok (1ms)
release URL uses the literal darwin-aarch64 Deno target vocabulary ... ok (273µs)
release client rejects untrusted or incomplete app configuration ... ok (713µs)
Deno global access is isolated to the structural adapter ... ok (2ms)
running 8 tests from ./packages/sdk/tests/auto-update/start-auto-update_test.ts
plain deno run disables native auto-update without invoking release config ... ok (12ms)
legacy top-level resolver forwards launch options and callbacks ... ok (777µs)
proposed namespace wins and Windows surfaces a manual installer event ... ok (523µs)
resolver falls back to a valid legacy updater when proposed shape is incomplete ... ok (143µs)
interval-only policy delays native updater installation then preserves recurrence ... ok (378µs)
interval policy rejects non-positive or non-finite intervals ... ok (936µs)
rollback telemetry is reported before the consumer callback ... ok (268µs)
structural resolver returns explicit disabled reasons ... ok (125µs)
running 3 tests from ./packages/sdk/tests/cache/cache-query_test.ts
CacheQuery returns stale data while revalidating in the background ... ok (17ms)
CacheQuery preferFreshOnStale blocks for a fresh result ... ok (133µs)
CacheQuery deduplicates in-flight fetches per instance ... ok (1ms)
running 7 tests from ./packages/sdk/tests/desktop/bind-channel_test.ts
bind ports are real MessagePorts accepted structurally by oRPC without casts ... ok (2ms)
bind channel carries Uint8Array as a top-level native payload ... ok (755µs)
two windows using the same protocol remain isolated ... ok (751µs)
server permits only one pending receive and closes it exactly once ... ok (1ms)
client rehydrates native binding errors with name message and stack ... ok (663µs)
server rejects invalid operations and non-binary frames ... ok (209µs)
queued runtime frames preserve FIFO order ... ok (202µs)
running 1 test from ./packages/sdk/tests/desktop/desktop-rpc-client_test.ts
typed Desktop client round-trips string and Uint8Array through oRPC ... ok (7ms)
running 3 tests from ./packages/sdk/tests/discovery/env-ordering_test.ts
service URL lookup prefers full browser key before shorthand ... ok (439µs)
service URL lookup falls back from browser full key to shorthand ... ok (147µs)
service URL lookup falls back from browser keys to server env ... ok (75µs)
running 5 tests from ./packages/sdk/tests/integration/service-client-runtime_test.ts
createHttpClientLink accepts real oRPC routers and rejects structural impostors ... ok (8ms)
createServiceClient round-trips through live service discovery ...
------- post-test output -------
08:27:36.185 INF netscript·services·sdk-live Service listening
Deno.serve: request.signal aborts on successful responses (legacy behavior). To detect when a request has been fully delivered use the `completed` promise on the handler's info argument. Move cleanup to the handler's return path, or opt in to the new behavior with --unstable-no-legacy-abort. See https://docs.deno.com/go/unstable-no-legacy-abort
08:27:36.201 INF netscript·services·sdk-live Service shutdown completed
----- post-test output end -----
createServiceClient round-trips through live service discovery ... ok (25ms)
createServiceClient rejects connection failures for bad service URLs ... ok (1ms)
createServiceClient reports retry exhaustion callbacks ... ok (6ms)
createServiceClient propagates cancellation to fetch ...
------- post-test output -------
08:27:36.212 INF netscript·services·sdk-live Service listening
08:27:36.214 INF netscript·services·sdk-live Service shutdown completed
----- post-test output end -----
createServiceClient propagates cancellation to fetch ... ok (3ms)
running 1 test from ./packages/sdk/tests/integration/workers-trigger-rpc_test.ts
createServiceClient RPC path reaches a plugin-workers triggerJob route ...
------- post-test output -------
08:27:36.496 INF netscript·services·workers Service listening
08:27:36.508 INF netscript·services·workers HTTP request started
08:27:36.513 INF netscript·services·workers HTTP request completed
Deno.serve: request.signal aborts on successful responses (legacy behavior). To detect when a request has been fully delivered use the `completed` promise on the handler's info argument. Move cleanup to the handler's return path, or opt in to the new behavior with --unstable-no-legacy-abort. See https://docs.deno.com/go/unstable-no-legacy-abort
08:27:36.518 INF netscript·services·workers HTTP request started
08:27:36.519 WRN netscript·services·workers·rpc RPC procedure failed
08:27:36.519 WRN netscript·services·workers·rpc RPC procedure failed
{"level":"warn","service":"workers","procedure":"v1.workers.triggerJob","code":"VALIDATION_ERROR","message":"Job id is required in the {id} path segment.","timestamp":"2026-08-12T08:27:36.519Z"}
08:27:36.520 WRN netscript·services·workers HTTP request completed
08:27:36.520 WRN netscript·services·workers HTTP request completed
08:27:36.524 INF netscript·services·workers Service shutdown completed
----- post-test output end -----
createServiceClient RPC path reaches a plugin-workers triggerJob route ... ok (47ms)
running 1 test from ./packages/sdk/tests/package-manifest_test.ts
published manifest declares every SDK runtime dependency ... ok (1ms)
running 1 test from ./packages/sdk/tests/query-client/kv-cache-persister_test.ts
createKvCachePersister stores, reads, and removes serialized query cache data ... ok (1ms)
running 3 tests from ./packages/sdk/tests/query/query-factory_test.ts
createQueryFactory builds stable action keys and query options ... ok (782µs)
queryOptions shares the server CacheQuery entry and action invalidation ... ok (289µs)
queryOptions remains a direct service query when no server cache is registered ... ok (132µs)
running 2 tests from ./packages/sdk/tests/readme-doctest_test.ts
README examples include checked TypeScript fences ... ok (1s)
README JSON fences parse ... ok (389µs)
running 2 tests from ./packages/service/tests/_fixtures/readme-examples_test.ts
README examples use current service lifecycle APIs ... ok (369µs)
README examples avoid removed builder check names ... ok (59µs)
running 7 tests from ./packages/service/tests/auth/authenticators_test.ts
static credential authenticator accepts a bearer token ... ok (2ms)
static credential authenticator accepts an API key ... ok (323µs)
static credential authenticator rejects missing credentials ... ok (83µs)
static credential authenticator rejects malformed bearer headers ... ok (102µs)
static credential authenticator rejects invalid credentials ... ok (213µs)
trusted header authenticator reads subject, scopes, roles, and claims ... ok (375µs)
trusted header authenticator rejects a missing subject header ... ok (173µs)
running 5 tests from ./packages/service/tests/auth/authorizer_test.ts
scope authorizer allows a matching rule with satisfied scopes and roles ... ok (867µs)
scope authorizer denies missing scope ... ok (93µs)
scope authorizer denies missing role ... ok (129µs)
scope authorizer denies by default when no rule matches ... ok (143µs)
scope authorizer can allow by default when explicitly configured ... ok (132µs)
running 3 tests from ./packages/service/tests/auth/builder-auth_test.ts
builder auth returns 401, 403, and 200 for guarded routes ... ok (20ms)
builder auth leaves health public under guarded api prefix ... ok (1ms)
builder injects Hono principal into oRPC context ... ok (235µs)
running 2 tests from ./packages/service/tests/auth/define-service-auth_test.ts
defineService without auth leaves api routes public ...
------- post-test output -------
08:27:39.600 INF netscript·services·preset-public Service listening
08:27:39.610 INF netscript·services·preset-public HTTP request started
08:27:39.612 INF netscript·services·preset-public HTTP request completed
08:27:39.615 INF netscript·services·preset-public Service shutdown completed
----- post-test output end -----
defineService without auth leaves api routes public ... ok (32ms)
defineService auth option enforces 401, 403, and 200 ...
------- post-test output -------
08:27:39.624 INF netscript·services·preset-auth Service listening
08:27:39.628 INF netscript·services·preset-auth HTTP request started
08:27:39.628 WRN netscript·services·preset-auth auth decision deny
08:27:39.628 WRN netscript·services·preset-auth auth decision deny
08:27:39.629 WRN netscript·services·preset-auth HTTP request completed
08:27:39.629 WRN netscript·services·preset-auth HTTP request completed
08:27:39.631 INF netscript·services·preset-auth HTTP request started
08:27:39.632 INF netscript·services·preset-auth auth decision allow
08:27:39.633 WRN netscript·services·preset-auth auth decision deny
08:27:39.633 WRN netscript·services·preset-auth auth decision deny
08:27:39.633 WRN netscript·services·preset-auth HTTP request completed
08:27:39.633 WRN netscript·services·preset-auth HTTP request completed
08:27:39.635 INF netscript·services·preset-auth HTTP request started
08:27:39.636 INF netscript·services·preset-auth auth decision allow
08:27:39.636 INF netscript·services·preset-auth auth decision allow
08:27:39.636 INF netscript·services·preset-auth HTTP request completed
08:27:39.638 INF netscript·services·preset-auth Service shutdown completed
----- post-test output end -----
defineService auth option enforces 401, 403, and 200 ... ok (16ms)
running 9 tests from ./packages/service/tests/auth/middleware_test.ts
authn middleware returns 401 for guarded path rejection ... ok (9ms)
authn middleware sets principal and calls next on success ... ok (2ms)
authn middleware exposes full headers and cookies to authenticators ... ok (1ms)
authn middleware applies response headers and Set-Cookie values on success ... ok (776µs)
authn middleware bypasses anonymous health paths ... ok (363µs)
authz middleware returns 401 when principal is missing on guarded path ... ok (472µs)
authz middleware returns 403 when authorizer denies ... ok (537µs)
authz middleware calls next when authorizer allows ... ok (676µs)
authz middleware fails closed when authorizer throws ... ok (813µs)
running 7 tests from ./packages/service/tests/database-connectivity_test.ts
resolveProbeEngine skips probe for sqlite (no spurious MySQL probe) (#175) ... ok (593µs)
resolveProbeEngine targets the configured TCP engine ... ok (51µs)
resolveProbeEngine is case-insensitive for TCP engines ... ok (100µs)
resolveProbeEngine falls back to mysql only when provider is unset ... ok (72µs)
resolveProbeEngine skips unrecognized providers instead of probing mysql ... ok (64µs)
resolveProbeEngine reads DB_PROVIDER from the environment ... ok (138µs)
resolveProbeEngine falls back to DATABASE_PROVIDER when DB_PROVIDER is unset ... ok (57µs)
running 5 tests from ./packages/service/tests/define-service_test.ts
defineService disconnects a capable database client on stop ...
------- post-test output -------
08:27:40.157 INF netscript·services·define-service-disconnect Verifying MySQL connectivity
08:27:40.160 INF netscript·services·define-service-disconnect Database connection verified
08:27:40.170 INF netscript·services·define-service-disconnect Service listening
08:27:40.172 INF netscript·services·define-service-disconnect Service shutdown completed
----- post-test output end -----
defineService disconnects a capable database client on stop ... ok (28ms)
defineService exposes a friendly service landing response ...
------- post-test output -------
08:27:40.182 INF netscript·services·define-service-landing Service listening
08:27:40.186 INF netscript·services·define-service-landing HTTP request started
08:27:40.188 INF netscript·services·define-service-landing HTTP request completed
08:27:40.188 INF netscript·services·define-service-landing Service shutdown completed
----- post-test output end -----
defineService exposes a friendly service landing response ... ok (9ms)
defineService aggregate health selects sqlite and excludes unused mysql ...
------- post-test output -------
08:27:40.189 INF netscript·services·define-service-provider-health Skipping database connectivity probe for configured engine
08:27:40.193 INF netscript·services·define-service-provider-health Service listening
08:27:40.194 INF netscript·services·define-service-provider-health Service shutdown completed
----- post-test output end -----
defineService aggregate health selects sqlite and excludes unused mysql ... ok (5ms)
defineService preserves readiness for the configured database ...
------- post-test output -------
08:27:40.195 INF netscript·services·define-service-provider-readiness Skipping database connectivity probe for configured engine
08:27:40.203 INF netscript·services·define-service-provider-readiness Service listening
08:27:40.206 INF netscript·services·define-service-provider-readiness Service shutdown completed
----- post-test output end -----
defineService preserves readiness for the configured database ... ok (12ms)
defineService skips disconnect hook for non-capable database client ...
------- post-test output -------
08:27:40.214 INF netscript·services·define-service-no-disconnect Verifying MySQL connectivity
08:27:40.216 INF netscript·services·define-service-no-disconnect Database connection verified
08:27:40.225 INF netscript·services·define-service-no-disconnect Service listening
08:27:40.226 INF netscript·services·define-service-no-disconnect Service shutdown completed
----- post-test output end -----
defineService skips disconnect hook for non-capable database client ... ok (19ms)
running 3 tests from ./packages/service/tests/handlers_test.ts
createOpenAPIHandler coerces a docs-shaped numeric query parameter ... ok (22ms)
createNotFoundHandler returns service-scoped not found response ... ok (639µs)
createErrorHandler returns production-safe error response ... ok (1ms)
running 8 tests from ./packages/service/tests/health_test.ts
createHealthHandler returns healthy with no checks ... ok (14ms)
createHealthHandler excludes unconfigured database adapter ... ok (616µs)
createHealthHandler excludes unconfigured kv adapter ... ok (307µs)
createHealthHandler excludes unconfigured service adapter ... ok (245µs)
createHealthHandler excludes unconfigured custom adapter ... ok (236µs)
createHealthHandler keeps configured adapter failures authoritative ... ok (568µs)
createLivenessHandler returns ok ... ok (306µs)
createReadinessHandler reports failed readiness ... ok (501µs)
running 1 test from ./packages/service/tests/hono-tracing_test.ts
service builder installs Hono tracing before downstream routes ... ok (21ms)
running 3 tests from ./packages/service/tests/legacy-abort_test.ts
legacy Deno.serve behavior warns on successful requests (baseline repro) ... ok (430ms)
no legacy-abort deprecation on successful requests with --unstable-no-legacy-abort ... ok (224ms)
client disconnect still cancels the in-flight request with the flag ... ok (659ms)
running 2 tests from ./packages/service/tests/rpc-path_test.ts
buildServiceRpcPath derives the shared default route ... ok (10ms)
buildServiceRpcPath rejects ambiguous segments ... ok (1ms)
running 3 tests from ./packages/service/tests/runtime-host_test.ts
runtime host drains phases deterministically and preserves registration order ... ok (9ms)
runtime host returns at the shared budget without awaiting a slow drain ... ok (335µs)
runtime host reports partial failures and continues later drains ... ok (577µs)
running 10 tests from ./packages/service/tests/runtime_test.ts
serve starts on an ephemeral port and stops cleanly ...
------- post-test output -------
08:27:43.390 INF netscript·services·runtime Service listening
08:27:43.402 INF netscript·services·runtime Service shutdown completed
----- post-test output end -----
serve starts on an ephemeral port and stops cleanly ... ok (27ms)
serve stops when external signal aborts ...
------- post-test output -------
08:27:43.412 INF netscript·services·runtime-signal Service listening
08:27:43.414 INF netscript·services·runtime-signal Service shutdown completed
----- post-test output end -----
serve stops when external signal aborts ... ok (5ms)
stop drains an in-flight request before closing the listener ...
------- post-test output -------
08:27:43.423 INF netscript·services·runtime-drain Service listening
08:27:43.451 INF netscript·services·runtime-drain Service shutdown completed
----- post-test output end -----
stop drains an in-flight request before closing the listener ... ok (36ms)
serve installs and removes platform signal listeners by default ...
------- post-test output -------
08:27:43.455 INF netscript·services·runtime-signal-registration Service listening
08:27:43.455 INF netscript·services·runtime-signal-registration Service shutdown completed
----- post-test output end -----
serve installs and removes platform signal listeners by default ... ok (2ms)
serve skips signal listeners when handleSignals is false ...
------- post-test output -------
08:27:43.466 INF netscript·services·runtime-signal-disabled Service listening
08:27:43.466 INF netscript·services·runtime-signal-disabled Service shutdown completed
----- post-test output end -----
serve skips signal listeners when handleSignals is false ... ok (10ms)
serve can start and stop twice without leaking signal handlers ...
------- post-test output -------
08:27:43.476 INF netscript·services·runtime-repeat-1 Service listening
08:27:43.476 INF netscript·services·runtime-repeat-1 Service shutdown completed
08:27:43.486 INF netscript·services·runtime-repeat-2 Service listening
08:27:43.487 INF netscript·services·runtime-repeat-2 Service shutdown completed
----- post-test output end -----
serve can start and stop twice without leaking signal handlers ... ok (20ms)
serve rejects invalid port configuration ... ok (775µs)
serve rejects startup hook failure before listening ... ok (422µs)
service stops cleanly after handler error response ...
------- post-test output -------
08:27:43.497 INF netscript·services·runtime-error Service listening
08:27:43.500 ERR netscript·services·runtime-error Unhandled service error
08:27:43.500 ERR netscript·services·runtime-error Unhandled service error
08:27:43.502 INF netscript·services·runtime-error Service shutdown completed
----- post-test output end -----
service stops cleanly after handler error response ... ok (13ms)
running service exposes assigned listener address ...
------- post-test output -------
08:27:43.508 INF netscript·services·runtime-address Service listening
08:27:43.508 INF netscript·services·runtime-address Service shutdown completed
----- post-test output end -----
running service exposes assigned listener address ... ok (5ms)
running 6 tests from ./packages/service/tests/service-builder_test.ts
createService builder builds a mountable health app ... ok (18ms)
custom health checks affect health status ... ok (1ms)
onShutdown hooks run once in LIFO order on stop ...
------- post-test output -------
08:27:43.802 INF netscript·services·shutdown-hooks Service listening
08:27:43.804 INF netscript·services·shutdown-hooks Service shutdown completed
----- post-test output end -----
onShutdown hooks run once in LIFO order on stop ... ok (9ms)
onShutdown hook rejection is collected and stop still closes listener ...
------- post-test output -------
08:27:43.809 INF netscript·services·shutdown-hook-failure Service listening
08:27:43.810 WRN netscript·services·shutdown-hook-failure Service shutdown completed with issues
08:27:43.810 WRN netscript·services·shutdown-hook-failure Service shutdown completed with issues
----- post-test output end -----
onShutdown hook rejection is collected and stop still closes listener ... ok (4ms)
onShutdown honors drain timeout without hanging stop ...
------- post-test output -------
08:27:43.820 INF netscript·services·shutdown-hook-timeout Service listening
08:27:43.826 WRN netscript·services·shutdown-hook-timeout Service shutdown completed with issues
08:27:43.826 WRN netscript·services·shutdown-hook-timeout Service shutdown completed with issues
----- post-test output end -----
onShutdown honors drain timeout without hanging stop ... ok (15ms)
onShutdown hooks run when a handled signal fires ...
------- post-test output -------
08:27:43.830 INF netscript·services·shutdown-hook-signal Service listening
08:27:43.830 INF netscript·services·shutdown-hook-signal Service shutdown completed
----- post-test output end -----
onShutdown hooks run when a handled signal fires ... ok (4ms)
running 4 tests from ./packages/service/tests/shutdown-coordinator_test.ts
shutdown coordinator runs hooks in LIFO registration order ... ok (8ms)
shutdown coordinator captures hook failures and continues ... ok (1ms)
shutdown coordinator is idempotent and runs hooks once ... ok (279µs)
shutdown coordinator reports hook timeout without hanging ... ok (5ms)
running 8 tests from ./packages/service/tests/tls-listener_test.ts
resolveTlsConfig returns undefined when no TLS is configured ... ok (9ms)
resolveTlsConfig prefers inline TLS material ... ok (237µs)
resolveTlsConfig reads env cert/key files when both are set ... ok (9ms)
resolveTlsConfig ignores env when only one file var is set ... ok (354µs)
buildListenerBanner uses the https scheme when TLS is active ... ok (631µs)
buildListenerBanner uses the http scheme without TLS ... ok (190µs)
serve forwards inline TLS material to Deno.serve (https path) ...
------- post-test output -------
08:27:44.234 INF netscript·services·tls-inline Service listening
08:27:44.236 INF netscript·services·tls-inline Service shutdown completed
----- post-test output end -----
serve forwards inline TLS material to Deno.serve (https path) ... ok (8ms)
serve omits cert/key from Deno.serve when TLS is absent (http path) ...
------- post-test output -------
08:27:44.237 INF netscript·services·tls-absent Service shutdown completed
----- post-test output end -----
serve omits cert/key from Deno.serve when TLS is absent (http path) ... ok (636µs)
running 2 tests from ./packages/service/tests/type-assignability_test.ts
public structural types are assignable through builder APIs ... ok (13ms)
FetchHandler mirror accepts oRPC-style handler result ... ok (3ms)
running 1 test from ./packages/telemetry/tests/_fixtures/readme-examples_test.ts
README registry inspection example returns a diagnostic report ... ok (14ms)
running 1 test from ./packages/telemetry/tests/adapters/otel_ai_telemetry_test.ts
OTel AI adapter exports chat and tool spans with provider usage ... ok (19ms)
running 6 tests from ./packages/telemetry/tests/adapters/otel_provider_test.ts
createTelemetryProvider defaults to the zero-dependency Deno provider ... ok (19ms)
createTelemetryProvider selects the SDK provider by id ... ok (231µs)
SDK provider registers, flushes trace + meter, and shuts down ... ok (1ms)
SDK provider register is idempotent ... ok (275µs)
SDK provider forceFlush/shutdown are no-ops before register ... ok (237µs)
SDK span links preserve attributes; Deno span links drop them ... ok (267µs)
running 1 test from ./packages/telemetry/tests/application/fan-in-links_test.ts
createFanInLinks preserves SDK link attributes and records Deno-native drops ... ok (15ms)
running 6 tests from ./packages/telemetry/tests/attributes/helpers_test.ts
attribute helper builders produce expected semantic keys ... ok (1ms)
job builder emits netscript keys plus deprecated aliases during dup window ... ok (412µs)
execution, saga, trigger, and GenAI builders cover T1 domains ... ok (272µs)
telemetry convention publishes TC-1 through TC-14 and netscript root domains ... ok (148µs)
TC-5 messaging keys match current OpenTelemetry messaging semconv verbatim ... ok (370µs)
canonical exported attribute keys derive from NetScript domains or semconv keys ... ok (360µs)
running 2 tests from ./packages/telemetry/tests/config/config_test.ts
getTelemetryConfig reads OTEL environment values ... ok (1ms)
getTelemetryConfig rejects a malformed OTLP endpoint ... ok (711µs)
running 5 tests from ./packages/telemetry/tests/config/enabled_matrix_test.ts
telemetry is disabled when no signal is present ... ok (954µs)
OTEL_DENO=true still enables telemetry ... ok (167µs)
NETSCRIPT_TELEMETRY_ENABLED enables telemetry without OTEL_DENO ... ok (82µs)
a registered provider enables telemetry without OTEL_DENO ... ok (180µs)
provider selection reads NETSCRIPT_TELEMETRY_PROVIDER ... ok (252µs)
running 2 tests from ./packages/telemetry/tests/context/job_test.ts
createJobTraceEnv omits values when no active span is present ... ok (15ms)
extractJobTraceContext restores context from TRACEPARENT env vars ... ok (590µs)
running 5 tests from ./packages/telemetry/tests/context/w3c_test.ts
traceparent formatting round-trips through the parser ... ok (17ms)
parseTraceparent rejects the reserved ff version ... ok (449µs)
parseTraceparent rejects all-zero and non-hex identifiers ... ok (139µs)
parseTraceState drops malformed members and caps at 32 entries ... ok (319µs)
extractFromTraceContext preserves tracestate through the fallback (regression) ... ok (678µs)
running 1 test from ./packages/telemetry/tests/core/tracer_test.ts
getTracer returns cached tracer instances for the same name/version ... ok (17ms)
running 2 tests from ./packages/telemetry/tests/hono/otel_middleware_test.ts
createHonoTracingMiddleware preserves route-shaped Hono span and downstream parenting ... ok (27ms)
createHonoTracingMiddleware is a no-op enrichment path without an active span ... ok (917µs)
running 3 tests from ./packages/telemetry/tests/layering_test.ts
inner telemetry layers never import from adapters/ ... ok (4ms)
adapters/otel imports only from the ports boundary + @opentelemetry/api ... ok (1ms)
adapters/aspire-query imports only from ports, domain, and sibling modules ... ok (746µs)
running 4 tests from ./packages/telemetry/tests/orpc/plugin_test.ts
TracingPlugin registers upstream instrumentation and oRPC interceptors ... ok (9ms)
TracingPlugin decorates the active upstream oRPC SERVER span ... ok (794µs)
TracingPlugin records oRPC errors on the active upstream span ... ok (469µs)
ErrorHandlingPlugin registers a client interceptor ... ok (325µs)
running 6 tests from ./packages/telemetry/tests/query/aspire_query_test.ts
createTelemetryQuery returns the Aspire query adapter ... ok (510µs)
trace query filter schema rejects malformed limits ... ok (727µs)
AspireTelemetryQuery groups flat Aspire spans by trace id ... ok (10ms)
AspireTelemetryQuery flattens the live Dashboard OTLP envelope ... ok (424µs)
AspireTelemetryQuery reads logs, resources, and metrics ... ok (2ms)
AspireTelemetryQuery degrades to empty results when Aspire is absent ... ok (1ms)
running 3 tests from ./packages/telemetry/tests/runtime/instrumentation-registry_test.ts
InstrumentationRegistry resolves registrations in insertion order ... ok (896µs)
InstrumentationRegistry rejects duplicate registration names ... ok (389µs)
InstrumentationRegistry runs setup and teardown hooks predictably ... ok (275µs)
running 1 test from ./packages/telemetry/tests/runtime/provider-registration_test.ts
provider registration flows through the InstrumentationRegistry seam ... ok (864µs)
running 3 tests from ./packages/telemetry/tests/testing/in-memory-span-recorder_test.ts
in-memory recorder captures span name, attributes, and ok status ... ok (17ms)
in-memory recorder records exception and error status on throw ... ok (533µs)
in-memory recorder reset clears captured spans ... ok (218µs)
running 4 tests from ./packages/watchers/filters/dedup_test.ts
computeContentHash — produces consistent SHA-256 hex ... ok (5ms)
computeContentHash — different content yields different hash ... ok (1ms)
DedupFilter — deduplicates identical files ... ok (1ms)
DedupFilter — remove events pass through ... ok (127µs)
running 5 tests from ./packages/watchers/filters/glob_test.ts
GlobFilter — matches *.csv files ... ok (1ms)
GlobFilter — matches multiple patterns ... ok (279µs)
GlobFilter — remove events always pass through ... ok (121µs)
GlobFilter — rejects non-matching files ... ok (908µs)
GlobFilter — matches() method ... ok (314µs)
running 4 tests from ./packages/watchers/filters/stability_test.ts
StabilityFilter — stable file passes through ... ok (115ms)
StabilityFilter — remove events pass through without check ... ok (151µs)
StabilityFilter — nonexistent file is skipped ... ok (533µs)
StabilityFilter — respects abort signal ... ok (52ms)
running 4 tests from ./packages/watchers/tests/_fixtures/docs-examples_test.ts
README quick-start example constructs and stops a watcher ... ok (1ms)
README network-share example opts into polling ... ok (103µs)
README AbortSignal example wires external cancellation ... ok (809µs)
README strategy and filter examples use the public surface ... ok (569µs)
running 5 tests from ./packages/watchers/tests/file-watcher_test.ts
FileWatcher watch loop stops when the external signal aborts and leaves running === false ... ok (25ms)
FileWatcher honors processExisting: true on startup scan ... ok (6ms)
FileWatcher honors maxFileAge filtering during startup scan ... ok (2ms)
FileWatcher honors debounceMs by collapsing rapid successive events for the same path ... ok (656ms)
DebounceFilter suppresses rapid events for the same path ... ok (22ms)
running 12 tests from ./plugins/ai/src/adapter/resources/resources.test.ts
ai install emits only userland glue under ai/ ... ok (1ms)
ai starter resources cover the current emitters ... ok (116µs)
ai scaffold emitters have focused golden content ... ok (245µs)
ai install declares the registry-owned markdown surface ... ok (51µs)
ai default topology is in-process (no gateway config emitted) ... ok (307µs)
ai stream route threads AbortSignal and exposes stop() (F-13) ... ok (404µs)
ai install starter tool is byte-identical to add tool default emission ... ok (318µs)
ai add tool/agent emit the same shape at the user-named path ... ok (153µs)
ai thread-store resource is opt-in (add-only, not installed by default) ... ok (113µs)
ai MCP tool is conditional and consumes SkillLoaderPort ... ok (178µs)
ai MCP tool emitted source type-checks against the public AI surface ... ok (927ms)
ai resource token map rejects misspelled tokens at compile time ... ok (130µs)
running 3 tests from ./plugins/ai/src/cli/ai-commands.test.ts
AI CLI self-wires add/list/remove tool and agent resources ... ok (28ms)
AI CLI manages providers/models and emits compiling configuration shape ... ok (8ms)
AI CLI adds and lists MCP servers whose registry initializes tools ... ok (6ms)
running 8 tests from ./plugins/ai/src/cli/ai-registry-compiler.test.ts
compileAiRegistry emits a name-keyed tool registry ... ok (1ms)
compileAiRegistry emits a stem-keyed agent factory registry ... ok (722µs)
compileAiRegistry short-circuits when the resource dir is empty/missing ... ok (168µs)
compileAiRegistry includes the emitted tool stub without executing it ... ok (826µs)
compileAiRegistry excludes the actual skill-loader stub by source shape ... ok (543µs)
compileAiRegistry never resolves imports from app-owned tool modules ... ok (630µs)
tool source selection ignores factories, comments, strings, and malformed input ... ok (504µs)
tool source selection accepts structural objects but not partial or factory values ... ok (291µs)
running 2 tests from ./plugins/ai/tests/adapter/doctor_test.ts
ai doctor flags dangling model refs, missing provider keys, and unwired tools ... ok (8ms)
ai doctor accepts configured and wired project state ... ok (2ms)
running 1 test from ./plugins/ai/tests/adapter/no-samples-install_test.ts
plugin install ai --no-samples omits samples and type-checks the generated workspace ... ok (2s)
running 5 tests from ./plugins/ai/tests/manifest_test.ts
ai manifest identity ... ok (637µs)
ai manifest declares the ai runtime-config topic ... ok (177µs)
ai manifest declares a v1 contract version ... ok (180µs)
ai manifest is a thin utility with no bundled service ... ok (195µs)
ai package and scaffold manifest declare no service surface ... ok (4ms)
running 6 tests from ./plugins/auth/src/adapter/resources/resources.test.ts
auth install starter barrel is byte-identical to the install-only scaffolder ... ok (756µs)
auth is install-only and exposes no add resources ... ok (164µs)
auth install emits separate control-plane and userland modules under auth ... ok (205µs)
auth install records the Prisma contract without emitting database files ... ok (79µs)
auth userland barrel imports the published auth core only ... ok (166µs)
auth barrel token map rejects misspelled tokens at compile time ... ok (62µs)
running 1 test from ./plugins/auth/tests/public/manifest_test.ts
authPlugin manifest exposes service, contract, and config axes ... ok (1ms)
running 2 tests from ./plugins/auth/tests/scaffold/manifest_test.ts
auth scaffold manifest satisfies plugin kind provider contract ... ok (1ms)
auth official source and database contribution are discoverable ... ok (682µs)
running 8 tests from ./plugins/auth/tests/services/auth-service_test.ts
kv-oauth handlers complete signin callback session me signout round-trip ...
------- post-test output -------
[Auth Stream] Durable stream emit skipped: streams URL is not configured.
[Auth Stream] Durable stream emit skipped: streams URL is not configured.
----- post-test output end -----
kv-oauth handlers complete signin callback session me signout round-trip ... ok (25ms)
auth handlers emit audit-safe telemetry attributes per operation ...
------- post-test output -------
[Auth Stream] Durable stream emit skipped: streams URL is not configured.
[Auth Stream] Durable stream emit skipped: streams URL is not configured.
----- post-test output end -----
auth handlers emit audit-safe telemetry attributes per operation ... ok (6ms)
backend selection reads NETSCRIPT_AUTH_BACKEND and reports unknown names as backend errors ... ok (759µs)
kv-oauth backend registry requires a configured encryption key for real stores ... ok (753µs)
in-memory kv-oauth test registry supplies its deterministic fixture key ... ok (713µs)
unsupported interactive backend operation maps to typed auth service error ... ok (662µs)
signin routes through the typed interactive backend sub-port ... ok (793µs)
auth handler errors keep observable central oRPC envelopes ... ok (4ms)
running 1 test from ./plugins/auth/tests/services/auth-v1-context-types_test.ts
auth v1 handlers infer contract input context and errors ... ok (914µs)
running 1 test from ./plugins/auth/tests/services/import-surface_test.ts
public contract and service imports resolve ... ok (6ms)
running 4 tests from ./plugins/auth/tests/streams/streams_test.ts
auth stream emit helpers project authSession lifecycle state ... ok (18ms)
auth stream emit helpers return AuthStreamEvent payloads ... ok (1ms)
auth stream emit helpers isolate producer failures from callers ... ok (596µs)
auth stream emit helpers persist active span trace context ... ok (1ms)
running 3 tests from ./plugins/sagas/services/src/database-client_test.ts
KV saga service accepts a host client without saga Prisma delegates ... ok (1ms)
Prisma saga service rejects a host client without saga Prisma delegates ... ok (1ms)
saga service accepts a complete saga Prisma client for either backend ... ok (231µs)
running 7 tests from ./plugins/sagas/src/adapter/resources/resources.test.ts
sagas install starter saga is byte-identical to add saga default emission ... ok (1ms)
sagas TypeScript literals escape apostrophes without changing values ... ok (353µs)
sagas add saga emits the same shape at the user-named path ... ok (338µs)
sagas install emits only userland glue under sagas ... ok (415µs)
sagas install runtime glue registers Redis before starting the runner ... ok (343µs)
sagas install runtime glue exposes a supervisor-backed health endpoint ... ok (222µs)
sagas resource token map rejects misspelled tokens at compile time ... ok (91µs)
running 7 tests from ./plugins/sagas/src/runtime/create-durable-saga-runtime_test.ts
createDurableSagaRuntime injects a KvSagaStore by default ... ok (17ms)
createDurableSagaRuntime honors injected store and kv ... ok (262µs)
createDurableSagaRuntime creates Prisma store without opening KV ... ok (199µs)
createDurableSagaRuntime rejects Prisma backend without client ... ok (653µs)
createDurableSagaRuntime dispatches returned compensation through its default compensator ... ok (2ms)
createDurableSagaRuntime rejects sagaCompensate without a matching branch ... ok (574µs)
createDurableSagaRuntime dispatches sagaFail through its compensation branch ... ok (485µs)
running 2 tests from ./plugins/sagas/src/runtime/durable-saga-restart_test.ts
createDurableSagaRuntime resumes saga state across runtime restart ... ok (20ms)
createDurableSagaRuntime store rejects stale expected versions ... ok (1ms)
running 1 test from ./plugins/sagas/src/runtime/saga-instance-projection_redis_test.ts
projection revives date strings from real Redis-persisted saga state ... ignored (0ms)
running 1 test from ./plugins/sagas/src/runtime/saga-supervisor_test.ts
SagaRuntimeSupervisor default native runtime persists correlated state ... ok (60ms)
running 1 test from ./plugins/sagas/streams/producer_transition_test.ts
saga stream projection emits one upsert for every durable transition ... ok (20ms)
running 2 tests from ./plugins/sagas/tests/adapter/plugin-doctor_test.ts
sagas doctor errors with a remediation when the saga registry is absent ... ok (858µs)
sagas doctor accepts the registry shape shared by both generation paths ... ok (584µs)
running 1 test from ./plugins/sagas/tests/aspire/sagas-contribution_test.ts
SagasAspireContribution registers API and background resources ... ok (1ms)
running 1 test from ./plugins/sagas/tests/cli/add-dry-run_test.ts
sagas add-saga --dry-run writes nothing and reports the real plan ... ok (12ms)
running 2 tests from ./plugins/sagas/tests/cli/fluent-call-editor_test.ts
upsertFluentCall ignores method lookalikes in comments and strings ... ok (862µs)
upsertFluentCall replaces nested call arguments as one syntax span ... ok (420µs)
running 2 tests from ./plugins/sagas/tests/cli/local-runtime-backend_test.ts
saga publish and list commands use runtime contract routes and filters ... ok (1ms)
saga add update and remove regenerate a definition-only registry ... ok (5ms)
running 1 test from ./plugins/sagas/tests/cli/registry-generator-golden_test.ts
generateSagaRegistry emits the golden saga registry module ... ok (1ms)
running 3 tests from ./plugins/sagas/tests/cli/sagas-cli_test.ts
SagasCli exposes the sagas command registry ... ok (1ms)
SagasCli usage metadata uses the runnable versioned JSR entrypoint ... ok (196µs)
SagasCli exposes command metadata with categories and flags ... ok (273µs)
running 1 test from ./plugins/sagas/tests/e2e/sagas-gates_test.ts
getSagasE2eGates returns stable saga gate metadata ... ok (1ms)
running 1 test from ./plugins/sagas/tests/public/manifest_test.ts
sagasPlugin manifest exposes dependencies, service, schema, contract, config, and Aspire axes ... ok (1ms)
running 4 tests from ./plugins/sagas/tests/runtime/project-registry-module_test.ts
resolveProjectRegistryModule uses explicit, env, then project-root fallback precedence ... ok (984µs)
projectFileUrl handles Windows drive roots and backslashes on every host ... ok (77µs)
resolveProjectRegistryModule anchors Windows parent-relative specifiers ... ok (247µs)
resolveProjectRegistryModule preserves absolute URL and module specifiers ... ok (74µs)
running 1 test from ./plugins/sagas/tests/runtime/saga-runner_test.ts
startSagaRunner loads a non-empty dependency-shaped registry from the project root ...
------- post-test output -------
[Sagas Runner] Durable stream projection unavailable: Error: [DurableStreamProducer] Missing plugin reference "streams" for stream "/sagas/instances". Install the streams plugin, then run `netscript service generate` to regenerate Aspire wiring. Durable streams URL not found. Expected DURABLE_STREAMS_URL or services__streams__http__0 (server) / VITE_services__streams__http__0 (browser) in the environment.
    at resolveRequiredStreamUrl (file:///home/codex/repos/ns006-f-b-dryrun/packages/plugin-streams-core/src/application/create-durable-stream.ts:268:11)
    at new DurableStreamProducer (file:///home/codex/repos/ns006-f-b-dryrun/packages/plugin-streams-core/src/application/create-durable-stream.ts:73:12)
    at createDurableStream (file:///home/codex/repos/ns006-f-b-dryrun/packages/plugin-streams-core/src/application/create-durable-stream.ts:313:20)
    at getSagasStreamProducer (file:///home/codex/repos/ns006-f-b-dryrun/plugins/sagas/streams/producer.ts:69:16)
    at withStreamProjection (file:///home/codex/repos/ns006-f-b-dryrun/plugins/sagas/src/runtime/saga-runner.ts:188:57)
    at resolveProjection (file:///home/codex/repos/ns006-f-b-dryrun/plugins/sagas/src/runtime/saga-runner.ts:172:12)
    at startSagaRunner (file:///home/codex/repos/ns006-f-b-dryrun/plugins/sagas/src/runtime/saga-runner.ts:100:62)
    at file:///home/codex/repos/ns006-f-b-dryrun/plugins/sagas/tests/runtime/saga-runner_test.ts:16:28
    at innerWrapped (ext:cli/40_test.js:300:11)
    at exitSanitizer (ext:cli/40_test.js:201:33)
----- post-test output end -----
startSagaRunner loads a non-empty dependency-shaped registry from the project root ... ok (19ms)
running 1 test from ./plugins/sagas/tests/runtime/storefront-checkout-flow_test.ts
storefront documented trigger-worker-saga flow reaches paid as written ... ok (21ms)
running 1 test from ./plugins/sagas/tests/services/init_test.ts
registerSagas uses the shared project-root seam and registers non-empty definitions ... ok (9ms)
running 2 tests from ./plugins/sagas/tests/services/publish-http-boundary_test.ts
HTTP saga publish fails within its deadline when delivery never settles ...
------- post-test output -------
{"level":"error","service":"sagas-publish-boundary-test","procedure":"v1.sagas.publish","code":"SAGA_RETRYABLE","message":"Saga publish did not settle within 10ms.","inputKeys":["type","payload","correlationId","correlationKey","idempotencyKey","concurrencyKey","topic","traceparent","tracestate"],"timestamp":"2026-08-12T08:27:58.551Z"}
----- post-test output end -----
HTTP saga publish fails within its deadline when delivery never settles ... ok (43ms)
HTTP saga publish reaches the runner, persists, projects, and schedules ... ok (19ms)
running 3 tests from ./plugins/sagas/tests/services/publish-message_test.ts
publish contract accepts and round-trips idempotencyKey ... ok (16ms)
publishSagaMessage threads idempotencyKey to runtime message and options ... ok (905µs)
publishSagaMessage acknowledges duplicate already-applied runtime outcomes ... ok (264µs)
running 2 tests from ./plugins/sagas/tests/telemetry/otel-saga-tracer_test.ts
createOtelSagaTracer maps saga span operations to OpenTelemetry span operations ... ok (20ms)
createOtelSagaTracer maps successful saga span status to OpenTelemetry OK ... ok (202µs)
running 2 tests from ./plugins/sagas/tests/telemetry/publish-trace-linkage_test.ts
publishSagaMessage propagates API trace headers as saga.handle parent context ... ok (19ms)
publishSagaMessage records ERROR saga.handle span when handler throws ... ok (909µs)
running 2 tests from ./plugins/streams/services/src/durability_test.ts
describeStorageDurability: file-backed durable branch ... ok (407µs)
describeStorageDurability: in-memory non-durable branch ... ok (130µs)
running 1 test from ./plugins/streams/services/src/main_test.ts
streams connector: health, proxy, and service-info delta ...
------- post-test output -------
08:27:59.610 INF netscript·services·streams Service listening
08:27:59.624 INF netscript·services·streams HTTP request started
08:27:59.627 INF netscript·services·streams HTTP request completed
08:27:59.629 INF netscript·services·streams HTTP request started
08:27:59.630 INF netscript·services·streams HTTP request completed
08:27:59.632 INF netscript·services·streams Service shutdown completed
----- post-test output end -----
streams connector: health, proxy, and service-info delta ... ok (66ms)
running 3 tests from ./plugins/streams/services/src/proxy_test.ts
streams live-read race: first live poll of a not-yet-created stream stays open and delivers on producer write ...
------- post-test output -------
08:27:59.957 INF netscript·services·streams Service listening
08:27:59.967 INF netscript·services·streams HTTP request started
08:28:00.114 INF netscript·services·streams HTTP request completed
Deno.serve: request.signal aborts on successful responses (legacy behavior). To detect when a request has been fully delivered use the `completed` promise on the handler's info argument. Move cleanup to the handler's return path, or opt in to the new behavior with --unstable-no-legacy-abort. See https://docs.deno.com/go/unstable-no-legacy-abort
08:28:00.117 INF netscript·services·streams Service shutdown completed
----- post-test output end -----
streams live-read race: first live poll of a not-yet-created stream stays open and delivers on producer write ... ok (198ms)
streams live-read race: live poll of a stream that never appears returns an empty up-to-date response, not a 404 ...
------- post-test output -------
08:28:00.160 INF netscript·services·streams Service listening
08:28:00.162 INF netscript·services·streams HTTP request started
08:28:00.368 INF netscript·services·streams HTTP request completed
08:28:00.369 INF netscript·services·streams Service shutdown completed
----- post-test output end -----
streams live-read race: live poll of a stream that never appears returns an empty up-to-date response, not a 404 ... ok (244ms)
streams live-read race: a snapshot (non-live) read of a genuinely missing stream still 404s ...
------- post-test output -------
08:28:00.405 INF netscript·services·streams Service listening
08:28:00.408 INF netscript·services·streams HTTP request started
08:28:00.410 WRN netscript·services·streams HTTP request completed
08:28:00.410 WRN netscript·services·streams HTTP request completed
08:28:00.412 INF netscript·services·streams Service shutdown completed
----- post-test output end -----
streams live-read race: a snapshot (non-live) read of a genuinely missing stream still 404s ... ok (42ms)
running 1 test from ./plugins/streams/services/src/sse-contract_conformance_test.ts
real streams service proxy conforms to the exported v1 SSE authority ...
------- post-test output -------
08:28:00.816 INF netscript·services·streams-sse-contract Service listening
08:28:00.832 INF netscript·services·streams-sse-contract HTTP request started
08:28:00.845 INF netscript·services·streams-sse-contract HTTP request completed
08:28:00.849 INF netscript·services·streams-sse-contract HTTP request started
08:28:00.854 INF netscript·services·streams-sse-contract HTTP request completed
08:28:00.857 INF netscript·services·streams-sse-contract HTTP request started
08:28:00.859 INF netscript·services·streams-sse-contract HTTP request completed
08:28:00.861 INF netscript·services·streams-sse-contract HTTP request started
08:28:00.864 INF netscript·services·streams-sse-contract HTTP request completed
08:28:00.867 INF netscript·services·streams-sse-contract HTTP request started
08:28:00.871 INF netscript·services·streams-sse-contract HTTP request completed
08:28:00.881 INF netscript·services·streams-sse-contract HTTP request started
08:28:00.884 INF netscript·services·streams-sse-contract HTTP request completed
08:28:00.886 INF netscript·services·streams-sse-contract Service shutdown completed
----- post-test output end -----
real streams service proxy conforms to the exported v1 SSE authority ... ok (106ms)
running 7 tests from ./plugins/streams/src/adapter/resources/resources.test.ts
streams install starter stream is byte-identical to add stream default emission ... ok (978µs)
streams add stream emits the same shape at the user-named path ... ok (210µs)
streams install emits only userland glue under streams ... ok (189µs)
streams resource token map rejects misspelled tokens at compile time ... ok (133µs)
schema and producer scaffolders emit discoverable compiling source shapes ... ok (440µs)
consumer scaffolder emits StreamDB, query island, and Fresh seed loader ... ok (228µs)
generated schema, producer, and consumer modules type-check together ... ok (1s)
running 1 test from ./plugins/streams/tests/aspire/streams-contribution_test.ts
StreamsAspireContribution registers the streams service and health check ... ok (1ms)
running 3 tests from ./plugins/streams/tests/cli/add-dry-run_test.ts
streams add-schema --dry-run writes nothing and reports the real plan ... ok (9ms)
streams add-producer --dry-run writes nothing and reports the real plan ... ok (2ms)
streams add-consumer --dry-run writes nothing and reports the real plan ... ok (4ms)
running 6 tests from ./plugins/streams/tests/cli/streams-cli_test.ts
StreamsCli executes discovery and diagnostic verbs through injected services ... ok (5ms)
StreamsCli publishes and subscribes with structured command data ... ok (1ms)
topic walker discovers project producers and schema collections ... ok (6ms)
publish and subscribe commands round-trip against DurableStreamTestServer ... ok (49ms)
streamsCli composition root provides the default CLI instance ... ok (209µs)
StreamsCli add verbs write schema, producer, and consumer artifacts ... ok (934µs)
running 1 test from ./plugins/streams/tests/docs/native-event-source-example_test.ts
official native EventSource example is copy-exact and type-checks ... ok (42ms)
running 2 tests from ./plugins/streams/tests/e2e/producer-reconnect_test.ts
reconnectSnapshotResult preserves FIFO and extracts the committed trace identity ... ok (18ms)
reconnectSnapshotResult rejects out-of-order recovery ... ok (744µs)
running 1 test from ./plugins/streams/tests/e2e/streams-gates_test.ts
getStreamsE2eGates returns stable stream probe metadata ... ok (792µs)
running 1 test from ./plugins/streams/tests/public/manifest_test.ts
streamsPlugin manifest exposes service, telemetry, E2E, Aspire, and helper axes ... ok (2ms)
running 2 tests from ./plugins/streams/tests/public/stream-api_test.ts
defineStreamProducer publish rejects instead of silently dropping payloads ... ok (968µs)
defineStreamConsumer subscribe throws instead of returning a no-op unsubscribe ... ok (199µs)
running 1 test from ./plugins/streams/tests/service/durable-stream-producer-idempotency_test.ts
producer transport interoperates with reference-server idempotency semantics ... ok (36ms)
running 6 tests from ./plugins/streams/tests/service/proxy-headers_test.ts
sanitizeProxyResponseHeaders strips the gzip mislabel and hop-by-hop headers ... ok (2ms)
sanitizeProxyResponse re-streams a >1KiB plain body mislabeled as gzip ... ok (7ms)
sanitizeProxyResponse preserves status and statusText ... ok (645µs)
sanitizeProxyResponse forwards a null upstream body unchanged (204) ... ok (238µs)
restreamUpstreamBody re-emits every chunk verbatim through a fresh stream ... ok (712µs)
sanitizeProxyResponse: a mid-stream client disconnect cancels the upstream reader with no AbortError (netscript#268) ... ok (18ms)
running 5 tests from ./plugins/triggers/services/src/main_test.ts
triggers connector smoke ...
------- post-test output -------
08:28:05.068 INF netscript·services·triggers-api Service listening
----- post-test output end -----
  health is served and healthy ... ok (14ms)
  service info root is served ...
------- post-test output -------
08:28:05.086 INF netscript·services·triggers-api HTTP request started
08:28:05.087 INF netscript·services·triggers-api HTTP request completed
----- post-test output end -----
  service info root is served ... ok (4ms)
  backed route listTriggers returns the mapped set ...
------- post-test output -------
08:28:05.089 INF netscript·services·triggers-api HTTP request started
08:28:05.101 INF netscript·services·triggers-api HTTP request completed
08:28:05.108 INF netscript·services·triggers-api HTTP request started
08:28:05.116 INF netscript·services·triggers-api HTTP request completed
Deno.serve: request.signal aborts on successful responses (legacy behavior). To detect when a request has been fully delivered use the `completed` promise on the handler's info argument. Move cleanup to the handler's return path, or opt in to the new behavior with --unstable-no-legacy-abort. See https://docs.deno.com/go/unstable-no-legacy-abort
----- post-test output end -----
  backed route listTriggers returns the mapped set ... ok (29ms)
  enable and disable routes round-trip stored state ...
------- post-test output -------
08:28:05.119 INF netscript·services·triggers-api HTTP request started
08:28:05.123 INF netscript·services·triggers-api HTTP request completed
08:28:05.125 INF netscript·services·triggers-api HTTP request started
08:28:05.127 INF netscript·services·triggers-api HTTP request completed
08:28:05.128 INF netscript·services·triggers-api HTTP request started
08:28:05.131 INF netscript·services·triggers-api HTTP request completed
08:28:05.133 INF netscript·services·triggers-api HTTP request started
08:28:05.135 INF netscript·services·triggers-api HTTP request completed
08:28:05.137 INF netscript·services·triggers-api HTTP request started
08:28:05.141 INF netscript·services·triggers-api HTTP request completed
08:28:05.145 INF netscript·services·triggers-api HTTP request started
08:28:05.147 ERR netscript·services·triggers-api·rpc RPC procedure failed
08:28:05.147 ERR netscript·services·triggers-api·rpc RPC procedure failed
{"level":"error","service":"triggers-api","procedure":"v1.triggers.fireTrigger","code":"UNKNOWN","message":"Trigger sched-1 is disabled.","inputKeys":["id","payload","body"],"timestamp":"2026-08-12T08:28:05.147Z"}
08:28:05.148 WRN netscript·services·triggers-api HTTP request completed
08:28:05.148 WRN netscript·services·triggers-api HTTP request completed
08:28:05.149 INF netscript·services·triggers-api HTTP request started
08:28:05.152 INF netscript·services·triggers-api HTTP request completed
08:28:05.154 INF netscript·services·triggers-api HTTP request started
08:28:05.155 INF netscript·services·triggers-api HTTP request completed
----- post-test output end -----
  enable and disable routes round-trip stored state ... ok (38ms)
  fireTrigger accepts a manual fire event ...
------- post-test output -------
08:28:05.158 INF netscript·services·triggers-api HTTP request started
08:28:05.160 INF netscript·services·triggers-api HTTP request completed
08:28:05.162 INF netscript·services·triggers-api HTTP request started
08:28:05.164 INF netscript·services·triggers-api HTTP request completed
----- post-test output end -----
  fireTrigger accepts a manual fire event ... ok (8ms)
  previewSchedule returns next fire times ...
------- post-test output -------
08:28:05.166 INF netscript·services·triggers-api HTTP request started
08:28:05.168 INF netscript·services·triggers-api HTTP request completed
08:28:05.170 INF netscript·services·triggers-api HTTP request started
08:28:05.192 INF netscript·services·triggers-api HTTP request completed
----- post-test output end -----
  previewSchedule returns next fire times ... ok (28ms)
  subscribeEvents streams a heartbeat ...
------- post-test output -------
08:28:05.194 INF netscript·services·triggers-api HTTP request started
08:28:05.197 INF netscript·services·triggers-api HTTP request completed
08:28:05.199 INF netscript·services·triggers-api HTTP request started
08:28:05.203 INF netscript·services·triggers-api HTTP request completed
----- post-test output end -----
  subscribeEvents streams a heartbeat ... ok (15ms)
  raw webhook unknown trigger id resolves to a 404 ...
------- post-test output -------
08:28:05.212 INF netscript·services·triggers-api HTTP request started
08:28:05.213 WRN netscript·services·triggers-api HTTP request completed
08:28:05.213 WRN netscript·services·triggers-api HTTP request completed
----- post-test output end -----
  raw webhook unknown trigger id resolves to a 404 ... ok (5ms)
  raw webhook known trigger id reaches the ingress ...
------- post-test output -------
08:28:05.215 INF netscript·services·triggers-api HTTP request started
08:28:05.216 WRN netscript·services·triggers-api HTTP request completed
08:28:05.216 WRN netscript·services·triggers-api HTTP request completed
----- post-test output end -----
  raw webhook known trigger id reaches the ingress ... ok (3ms)
------- post-test output -------
08:28:05.219 INF netscript·services·triggers-api Service shutdown completed
----- post-test output end -----
triggers connector smoke ... ok (176ms)
triggers webhook public path resolves to definition id ...
------- post-test output -------
08:28:05.233 INF netscript·services·triggers-api Service listening
08:28:05.237 INF netscript·services·triggers-api HTTP request started
08:28:05.238 INF netscript·services·triggers-api HTTP request completed
08:28:05.241 INF netscript·services·triggers-api Service shutdown completed
----- post-test output end -----
triggers webhook public path resolves to definition id ... ok (10ms)
triggers testWebhook route accepts a synthetic delivery ...
------- post-test output -------
08:28:05.244 INF netscript·services·triggers-api Service listening
08:28:05.246 INF netscript·services·triggers-api HTTP request started
08:28:05.249 INF netscript·services·triggers-api HTTP request completed
08:28:05.253 INF netscript·services·triggers-api HTTP request started
08:28:05.256 INF netscript·services·triggers-api HTTP request completed
08:28:05.257 INF netscript·services·triggers-api Service shutdown completed
----- post-test output end -----
triggers testWebhook route accepts a synthetic delivery ... ok (15ms)
triggers legacy events path lists stored events ...
------- post-test output -------
08:28:05.260 INF netscript·services·triggers-api Service listening
08:28:05.262 INF netscript·services·triggers-api HTTP request started
08:28:05.263 INF netscript·services·triggers-api HTTP request completed
08:28:05.265 INF netscript·services·triggers-api Service shutdown completed
----- post-test output end -----
triggers legacy events path lists stored events ... ok (7ms)
CLI service adapter observes fired webhook ledger and authoritative state ...
------- post-test output -------
08:28:05.271 INF netscript·services·triggers-api Service listening
08:28:05.274 INF netscript·services·triggers-api HTTP request started
08:28:05.276 INF netscript·services·triggers-api HTTP request completed
08:28:05.278 INF netscript·services·triggers-api HTTP request started
08:28:05.279 WRN netscript·services·triggers-api HTTP request completed
08:28:05.279 WRN netscript·services·triggers-api HTTP request completed
08:28:05.281 INF netscript·services·triggers-api HTTP request started
08:28:05.281 INF netscript·services·triggers-api HTTP request completed
08:28:05.283 INF netscript·services·triggers-api HTTP request started
08:28:05.284 INF netscript·services·triggers-api HTTP request completed
08:28:05.286 INF netscript·services·triggers-api HTTP request started
08:28:05.287 INF netscript·services·triggers-api HTTP request completed
08:28:05.289 INF netscript·services·triggers-api Service shutdown completed
----- post-test output end -----
CLI service adapter observes fired webhook ledger and authoritative state ... ok (23ms)
running 10 tests from ./plugins/triggers/src/adapter/resources/resources.test.ts
triggers install starter webhook enqueues the workers health-check job ... ok (1ms)
triggers add resources emit the same shape at user-named paths ... ok (410µs)
add webhook job wiring emits a typed enqueue action and metadata ... ok (26ms)
add scheduled job wiring emits a compiling typed enqueue action ... ok (18ms)
triggers install starter sources are format-stable at generator boundaries ... ok (223µs)
triggers install emits only userland glue under triggers ... ok (201µs)
generated triggers runtime activates the selected Redis adapter ... ok (383ms)
generated triggers runtime uses Deno KV when CACHE_PROVIDER=denokv ... ok (38ms)
triggers resources preserve supported trigger sub-kinds ... ok (436µs)
triggers resource token map rejects misspelled tokens at compile time ... ok (122µs)
running 1 test from ./plugins/triggers/src/runtime/project-trigger-registry_test.ts
loadProjectTriggerDefinitions falls back to project trigger barrel when generated registry is absent ... ok (33ms)
running 1 test from ./plugins/triggers/src/runtime/trigger-runtime-parenting_test.ts
trigger ingress, detect, and process spans share the inbound trace (regression #405) ... ok (10ms)
running 3 tests from ./plugins/triggers/src/runtime/trigger-runtime-processor_test.ts
runtime processor schedules defer actions without routing them to DLQ ... ok (14ms)
runtime processor stamps idempotency key onto enqueued worker job body ... ok (890µs)
runtime processor rejects a trigger disabled in the authoritative state store ... ok (2ms)
running 1 test from ./plugins/triggers/tests/aspire/aspire_test.ts
TriggersAspireContribution registers API and processor resources ... ok (1ms)
running 3 tests from ./plugins/triggers/tests/cli/add-dry-run_test.ts
triggers add-webhook --dry-run writes nothing and reports the real plan ... ok (15ms)
triggers add-file-watch --dry-run writes nothing and reports the real plan ... ok (5ms)
triggers add-scheduled --dry-run writes nothing and reports the real plan ... ok (4ms)
running 4 tests from ./plugins/triggers/tests/cli/cli_test.ts
TriggersCli exposes the triggers command registry ... ok (1ms)
TriggersCli usage metadata uses the runnable versioned JSR entrypoint ... ok (268µs)
triggersCli composition root provides the default CLI instance ... ok (101µs)
StaticTriggersCliBackend returns command metadata without runtime dependencies ... ok (417µs)
running 4 tests from ./plugins/triggers/tests/cli/http-triggers-service_test.ts
HTTP triggers service reads persisted events with filters ... ok (7ms)
HTTP triggers service reads authoritative enabled definitions ... ok (875µs)
HTTP triggers service calls authoritative enable and disable routes ... ok (632µs)
HTTP triggers service reports unreachable and non-success responses ... ok (1ms)
running 3 tests from ./plugins/triggers/tests/cli/local-runtime-backend_test.ts
local triggers backend round-trips update, preview, remove, and persisted events ... ok (394ms)
local triggers backend updates webhook security fields without changing job wiring ... ok (5ms)
trigger source updates replace multiline tags without leaving stale syntax ... ok (193µs)
running 1 test from ./plugins/triggers/tests/cli/trigger-registry-compiler-golden_test.ts
compileTriggerRegistry emits the golden trigger registry module ... ok (1ms)
running 1 test from ./plugins/triggers/tests/e2e/e2e-gates_test.ts
triggersPlugin manifest declares the triggers health E2E gate ... ok (807µs)
running 2 tests from ./plugins/triggers/tests/e2e/webhooks-health_test.ts
triggers api health endpoint is healthy ... ignored (0ms)
webhook triggers are registered ... ignored (0ms)
running 5 tests from ./plugins/triggers/tests/e2e/webhooks-ingress_test.ts
open webhook accepts unsigned payloads ... ignored (0ms)
secured webhook accepts valid hmac payloads ... ignored (0ms)
trigger events are persisted and listed ... ignored (0ms)
webhook trigger detail exposes configuration ... ignored (0ms)
scheduled export can post to secured webhook ... ignored (0ms)
running 5 tests from ./plugins/triggers/tests/e2e/webhooks-security_test.ts
secured webhook rejects payloads signed with the wrong secret ... ignored (0ms)
secured webhook rejects tampered payload bodies ... ignored (0ms)
unknown webhook paths return not found ... ignored (0ms)
secured webhook rejects missing signatures ... ignored (0ms)
export webhook detail exposes hmac configuration ... ignored (0ms)
running 1 test from ./plugins/triggers/tests/public/manifest_test.ts
triggersPlugin manifest exposes core dependencies, service, contract, config, and Aspire axes ... ok (2ms)
running 1 test from ./plugins/workers/jobs/job-tools_test.ts
createJobTools exports handler events, progress, and child spans ... ok (16ms)
running 1 test from ./plugins/workers/services/src/describe-route_test.ts
workers service serves GET /describe with a capabilities document ... ok (31ms)
running 3 tests from ./plugins/workers/services/src/generated-jobs_test.ts
registerGeneratedJobDefinitions loads user jobs into the API service runtime ... ok (26ms)
registerGeneratedJobDefinitions reports a missing generated registry ... ok (846µs)
registerGeneratedJobDefinitions fails when a compiled job does not register ... ok (17ms)
running 3 tests from ./plugins/workers/services/src/init_test.ts
registerPluginJobs stores the built-in health job with the package source URL ...
------- post-test output -------
[Workers Plugin] Registering plugin jobs...
[Workers Plugin] ✅ Registered job 'workers-plugin-health-check'
[Workers Plugin] Total jobs in registry: 1
[Workers Plugin]   - workers-plugin-health-check: Workers Health Check [*/5 * * * *]
[Workers Plugin] Failed to publish job 'workers-plugin-health-check' to stream: Error: [DurableStreamProducer] Missing plugin reference "streams" for stream "/workers/executions". Install the streams plugin, then run `netscript service generate` to regenerate Aspire wiring. Durable streams URL not found. Expected DURABLE_STREAMS_URL or services__streams__http__0 (server) / VITE_services__streams__http__0 (browser) in the environment.
    at resolveRequiredStreamUrl (file:///home/codex/repos/ns006-f-b-dryrun/packages/plugin-streams-core/src/application/create-durable-stream.ts:268:11)
    at new DurableStreamProducer (file:///home/codex/repos/ns006-f-b-dryrun/packages/plugin-streams-core/src/application/create-durable-stream.ts:73:12)
    at createDurableStream (file:///home/codex/repos/ns006-f-b-dryrun/packages/plugin-streams-core/src/application/create-durable-stream.ts:313:20)
    at createWorkersStreamProducer (file:///home/codex/repos/ns006-f-b-dryrun/packages/plugin-workers-core/src/streams/producer.ts:69:20)
    at getWorkersStreamProducer (file:///home/codex/repos/ns006-f-b-dryrun/plugins/workers/streams/producer.ts:41:16)
    at emitJobToStream (file:///home/codex/repos/ns006-f-b-dryrun/plugins/workers/streams/producer.ts:62:23)
    at registerPluginJobs (file:///home/codex/repos/ns006-f-b-dryrun/plugins/workers/services/src/init.ts:100:7)
    at async file:///home/codex/repos/ns006-f-b-dryrun/plugins/workers/services/src/init_test.ts:19:3
    at async innerWrapped (ext:cli/40_test.js:300:5)
    at async exitSanitizer (ext:cli/40_test.js:201:27)
----- post-test output end -----
registerPluginJobs stores the built-in health job with the package source URL ... ok (15ms)
registerPluginJobs repairs stale project-local built-in health job rows ...
------- post-test output -------
[Workers Plugin] Registering plugin jobs...
[Workers Plugin] Updating job 'workers-plugin-health-check' (entrypoint: true, sourceUrl: true, source: false, permissions: true)...
[Workers Plugin]   Old entrypoint: ./plugins/workers/jobs/health-check.ts
[Workers Plugin]   New entrypoint: ./jobs/health-check.ts
[Workers Plugin]   Old sourceUrl: undefined
[Workers Plugin]   New sourceUrl: jsr:@netscript/plugin-workers@0.0.5/jobs/health-check.ts
[Workers Plugin]   Old source: plugin
[Workers Plugin]   New source: plugin
[Workers Plugin] ✅ Re-registered job 'workers-plugin-health-check'
[Workers Plugin] Total jobs in registry: 1
[Workers Plugin]   - workers-plugin-health-check: Workers Health Check [*/5 * * * *]
[Workers Plugin] Failed to publish job 'workers-plugin-health-check' to stream: Error: [DurableStreamProducer] Missing plugin reference "streams" for stream "/workers/executions". Install the streams plugin, then run `netscript service generate` to regenerate Aspire wiring. Durable streams URL not found. Expected DURABLE_STREAMS_URL or services__streams__http__0 (server) / VITE_services__streams__http__0 (browser) in the environment.
    at resolveRequiredStreamUrl (file:///home/codex/repos/ns006-f-b-dryrun/packages/plugin-streams-core/src/application/create-durable-stream.ts:268:11)
    at new DurableStreamProducer (file:///home/codex/repos/ns006-f-b-dryrun/packages/plugin-streams-core/src/application/create-durable-stream.ts:73:12)
    at createDurableStream (file:///home/codex/repos/ns006-f-b-dryrun/packages/plugin-streams-core/src/application/create-durable-stream.ts:313:20)
    at createWorkersStreamProducer (file:///home/codex/repos/ns006-f-b-dryrun/packages/plugin-workers-core/src/streams/producer.ts:69:20)
    at getWorkersStreamProducer (file:///home/codex/repos/ns006-f-b-dryrun/plugins/workers/streams/producer.ts:41:16)
    at emitJobToStream (file:///home/codex/repos/ns006-f-b-dryrun/plugins/workers/streams/producer.ts:62:23)
    at registerPluginJobs (file:///home/codex/repos/ns006-f-b-dryrun/plugins/workers/services/src/init.ts:100:7)
    at async file:///home/codex/repos/ns006-f-b-dryrun/plugins/workers/services/src/init_test.ts:44:3
    at async innerWrapped (ext:cli/40_test.js:300:5)
    at async exitSanitizer (ext:cli/40_test.js:201:27)
----- post-test output end -----
registerPluginJobs repairs stale project-local built-in health job rows ... ok (1ms)
workers plugin export map exposes the built-in health job sourceUrl subpath ... ok (646µs)
running 1 test from ./plugins/workers/services/src/routers/health-soundness_test.ts
sound BaseContractRoute rejects non-conforming handler output ... ok (672µs)
running 2 tests from ./plugins/workers/services/src/trigger-path-id_test.ts
triggerJob resolves the target job id from the {id} path, not the body ...
------- post-test output -------
{"level":"warn","service":"workers","procedure":"v1.workers.triggerJob","code":"NOT_FOUND","message":"Worker with ID job-from-path not found","timestamp":"2026-08-12T08:28:11.003Z"}
----- post-test output end -----
triggerJob resolves the target job id from the {id} path, not the body ... ok (35ms)
triggerTask resolves the target task id from the {id} path, not the body ...
------- post-test output -------
{"level":"warn","service":"workers","procedure":"v1.workers.triggerTask","code":"NOT_FOUND","message":"Worker with ID task-from-path not found","timestamp":"2026-08-12T08:28:11.020Z"}
----- post-test output end -----
triggerTask resolves the target task id from the {id} path, not the body ... ok (5ms)
running 6 tests from ./plugins/workers/src/adapter/resources/resources.test.ts
workers install starter job is byte-identical to add job default emission ... ok (1ms)
workers add job emits the same shape at the user-named path ... ok (152µs)
workers install emits only userland glue under workers ... ok (385µs)
workers task scaffolder preserves multi-runtime task emission ... ok (507µs)
workers workflow resource is add-only ... ok (309µs)
workers resource token map rejects misspelled tokens at compile time ... ok (52µs)
running 3 tests from ./plugins/workers/tests/adapter/plugin-doctor_test.ts
workers doctor errors with a remediation when the job registry is absent ... ok (874µs)
workers doctor accepts compile-registry registry output ... ok (348µs)
workers doctor accepts generate-plugins registry output ... ok (105µs)
running 1 test from ./plugins/workers/tests/aspire/workers-contribution_test.ts
WorkersAspireContribution publishes one dependency-aware workers runtime ... ok (1ms)
running 3 tests from ./plugins/workers/tests/cli/add-dry-run_test.ts
workers add-job --dry-run writes nothing and reports the real plan ... ok (21ms)
workers add-task --dry-run writes nothing and reports the real plan ... ok (6ms)
workers add-workflow --dry-run writes nothing and reports the real plan ... ok (4ms)
running 4 tests from ./plugins/workers/tests/cli/local-runtime-backend_test.ts
workers runtime verbs call durable routes with filters and payloads ... ok (9ms)
run-task forwards argv env timeout and streams executor output ... ok (1ms)
worker metadata filters, updates, shows, and removes with registry regeneration ... ok (1ms)
run-task executes a generated shell task and returns its TaskResult ... ok (29ms)
running 1 test from ./plugins/workers/tests/cli/registry-compiler-golden_test.ts
compileWorkersRegistry emits the golden job registry module ... ok (1ms)
running 3 tests from ./plugins/workers/tests/cli/workers-cli_test.ts
WorkersCli exposes the workers command registry ... ok (9ms)
workersCli composition root provides the default CLI instance ... ok (341µs)
WorkersCli usage metadata uses the runnable versioned JSR entrypoint ... ok (309µs)
running 1 test from ./plugins/workers/tests/e2e/workers-gates_test.ts
getWorkersE2eGates returns stable worker gate metadata ... ok (843µs)
running 1 test from ./plugins/workers/tests/public/manifest_test.ts
workersPlugin manifest exposes service, processor, stream, contract, config, E2E, and Aspire axes ... ok (1ms)
running 8 tests from ./plugins/workers/tests/runtime/generated-jobs_test.ts
resolveGeneratedJobRegistryUrl anchors on the project root ... ok (1ms)
no workers entrypoint resolves the generated registry path itself ... ok (2ms)
an absent generated registry is reported, not silently empty ... ok (1ms)
a generated registry without job definitions fails at startup ... ok (28ms)
a generated registry that fails to import fails at startup ... ok (18ms)
registerGeneratedJobRegistry registers every declared job ... ok (17ms)
registerGeneratedJobRegistry fails loudly when a job does not land ... ok (17ms)
an empty generated registry is a valid load, not a failure ... ok (17ms)
running 3 tests from ./plugins/workers/worker/job-dispatcher_test.ts
processWorkerJob skips completed duplicate redelivery without creating a second execution ...
------- post-test output -------
[Worker worker-test] Processing job 'send-email' (trigger: manual)
[Worker worker-test] Processing job 'send-email' (trigger: manual)
[Worker worker-test] Skipping duplicate job 'send-email' (idempotency=job:send-email:msg-1, alreadyApplied=true)
----- post-test output end -----
processWorkerJob skips completed duplicate redelivery without creating a second execution ... ok (13ms)
processWorkerJob releases a failed claim so redelivery can re-run ...
------- post-test output -------
[Worker worker-test] Processing job 'sync-account' (trigger: manual)
[Worker worker-test] Job 'sync-account' failed: transient worker failure
[Worker worker-test] Processing job 'sync-account' (trigger: manual)
----- post-test output end -----
processWorkerJob releases a failed claim so redelivery can re-run ... ok (1ms)
processWorkerTask skips duplicate redelivery after applied marker ...
------- post-test output -------
[Worker worker-test] Processing task 'resize-image' (trigger: manual)
[Worker worker-test] Task 'resize-image' completed in 1ms
[Worker worker-test] Processing task 'resize-image' (trigger: manual)
[Worker worker-test] Skipping duplicate task 'resize-image' (idempotency=task:resize-image:task-msg-1, alreadyApplied=true)
----- post-test output end -----
processWorkerTask skips duplicate redelivery after applied marker ... ok (1ms)
running 3 tests from ./plugins/workers/worker/job-execution_test.ts
local job entrypoint already rooted under jobsDir is not prefixed twice ... ok (12ms)
jobs-dir-relative local job entrypoint keeps the generated registry convention ... ok (467µs)
project-root-qualified job uses the configured jobs directory without special cases ... ok (634µs)
running 2 tests from ./plugins/workers/worker/worker-options_test.ts
resolveWorkerQueueTriggers does not add sample triggers by default ... ok (710µs)
resolveWorkerQueueTriggers preserves explicit triggers without aliasing the input ... ok (106µs)

ok | 3184 passed (617 steps) | 0 failed | 17 ignored (4m19s)

Task test deno test --allow-all
Check .github/scripts/aspire-nuget-cache-policy.test.ts
Check .github/scripts/ci-classify-changes.test.ts
Check .github/scripts/draft-workflow-policy.test.ts
Check .github/scripts/e2e-cli-event-policy.test.ts
Check .llm/tools/agentic/claude/claude-print_test.ts
Check .llm/tools/agentic/claude/evaluator-model-guard_test.ts
Check .llm/tools/agentic/claude/hybrid-delegation_test.ts
Check .llm/tools/agentic/claude/hybrid-launcher_test.ts
Check .llm/tools/agentic/claude/hybrid-mcp-server_test.ts
Check .llm/tools/agentic/claude/hybrid-opencode-adapter_test.ts
Check .llm/tools/agentic/claude/openrouter-run_test.ts
Check .llm/tools/agentic/claude/remote-model-gateway_test.ts
Check .llm/tools/agentic/claude/remote-model-launcher_test.ts
Check .llm/tools/agentic/codex/agy-live_test.ts
Check .llm/tools/agentic/codex/app-server-message_test.ts
Check .llm/tools/agentic/codex/classify-codex-failure_test.ts
Check .llm/tools/agentic/codex/codex-follow_test.ts
Check .llm/tools/agentic/codex/codex-rollout-live_test.ts
Check .llm/tools/agentic/codex/codex-status_test.ts
Check .llm/tools/agentic/codex/launch-codex-slice_test.ts
Check .llm/tools/agentic/codex/run-codex-slice-lib_test.ts
Check .llm/tools/agentic/compatibility-wrappers_test.ts
Check .llm/tools/agentic/config/no-hardcoded-volatile_test.ts
Check .llm/tools/agentic/github/pr-checks_test.ts
Check .llm/tools/agentic/github/publication-body_test.ts
Check .llm/tools/agentic/github/review-threads_test.ts
Check .llm/tools/agentic/lib/agentic-lib_test.ts
Check .llm/tools/agentic/lib/openrouter-credential_test.ts
Check .llm/tools/agentic/opencode/opencode-boundary-plugin_test.ts
Check .llm/tools/agentic/opencode/opencode-preflight_test.ts
Check .llm/tools/agentic/opencode/opencode-project-config_test.ts
Check .llm/tools/agentic/opencode/opencode-run_test.ts
Check .llm/tools/agentic/opencode/opencode-web_test.ts
Check .llm/tools/agentic/openhands/docs-eval-workflow_test.ts
Check .llm/tools/agentic/runtime/adapters/antigravity-adapter_test.ts
Check .llm/tools/agentic/runtime/adapters_test.ts
Check .llm/tools/agentic/runtime/antigravity-compat_test.ts
Check .llm/tools/agentic/runtime/antigravity-evidence-aggregation_test.ts
Check .llm/tools/agentic/runtime/antigravity-evidence_test.ts
Check .llm/tools/agentic/runtime/child-process-environment-adapter_test.ts
Check .llm/tools/agentic/runtime/cli/antigravity-evidence-cli_test.ts
Check .llm/tools/agentic/runtime/cli/provider-canary_test.ts
Check .llm/tools/agentic/runtime/cli/rollout-canary-cli_test.ts
Check .llm/tools/agentic/runtime/cli/rollout-canary-runner_test.ts
Check .llm/tools/agentic/runtime/cli/routing-state_test.ts
Check .llm/tools/agentic/runtime/codex-remote-repair_test.ts
Check .llm/tools/agentic/runtime/contract_test.ts
Check .llm/tools/agentic/runtime/controller_test.ts
Check .llm/tools/agentic/runtime/deferred-boundaries_test.ts
Check .llm/tools/agentic/runtime/launch-route-identity_test.ts
Check .llm/tools/agentic/runtime/legacy-checkpoint_test.ts
Check .llm/tools/agentic/runtime/planner_test.ts
Check .llm/tools/agentic/runtime/preset-canary_test.ts
Check .llm/tools/agentic/runtime/provider-canary_test.ts
Check .llm/tools/agentic/runtime/provider-profiles_test.ts
Check .llm/tools/agentic/runtime/rollout-canary_test.ts
Check .llm/tools/agentic/runtime/rollout-report_test.ts
Check .llm/tools/agentic/runtime/routing-policy_test.ts
Check .llm/tools/agentic/runtime/routing-signal-classifier_test.ts
Check .llm/tools/agentic/runtime/routing-state-machine_test.ts
Check .llm/tools/agentic/runtime/runner-provider-profiles_test.ts
Check .llm/tools/agentic/runtime/sender-ownership_test.ts
Check .llm/tools/agentic/teardown/forbidden-commands_test.ts
Check .llm/tools/agentic/teardown/leak-check_test.ts
Check .llm/tools/agentic/teardown/ownership_test.ts
Check .llm/tools/agentic/teardown/probes_test.ts
Check .llm/tools/agentic/teardown/run-resources_test.ts
Check .llm/tools/agentic/teardown/teardown_test.ts
Check .llm/tools/agentic/wsl/wsl-foundation_test.ts
Check .llm/tools/deps/bump-version_test.ts
Check .llm/tools/deps/check-zod-alignment_test.ts
Check .llm/tools/deps/prod-install_test.ts
Check .llm/tools/docs/build-agent-docs-bundle_test.ts
Check .llm/tools/docs/check-accuracy-and-discoverability_test.ts
Check .llm/tools/docs/check-docs-contract-derivation_test.ts
Check .llm/tools/docs/check-exports-drift_test.ts
Check .llm/tools/docs/check-internal-links_test.ts
Check .llm/tools/docs/generate-export-surface-corpus_test.ts
Check .llm/tools/e2e/print-failed-report-steps_test.ts
Check .llm/tools/e2e/scaffold-e2e-test_test.ts
Check .llm/tools/fitness/check-ds-gates_test.ts
Check .llm/tools/generate-publish-assets_test.ts
Check .llm/tools/harness/extract-verdict_test.ts
Check .llm/tools/quality/scan-code-quality_test.ts
Check .llm/tools/release/assert-release-version_test.ts
Check .llm/tools/release/canary-label_test.ts
Check .llm/tools/release/canary_test.ts
Check .llm/tools/release/check-jsr-publish-budget_test.ts
Check .llm/tools/release/config/no-hardcoded-volatile_test.ts
Check .llm/tools/release/cut_test.ts
Check .llm/tools/release/github-release_test.ts
Check .llm/tools/release/preflight-release_test.ts
Check .llm/tools/release/preflight-text-imports_test.ts
Check .llm/tools/release/prepare-release_test.ts
Check .llm/tools/release/publish-readiness_test.ts
Check .llm/tools/release/publish-workspace_test.ts
Check .llm/tools/release/release-canary-workflow_test.ts
Check .llm/tools/release/report-jsr-publish-outcome_test.ts
Check .llm/tools/release/surface-diff_test.ts
Check .llm/tools/release/verify-canary-pair_test.ts
Check .llm/tools/run-deno-check_test.ts
Check .llm/tools/run-deno-fmt_test.ts
Check .llm/tools/run-deno-lint_test.ts
Check .llm/tools/validation/acceptance-evidence_test.ts
Check .llm/tools/validation/check-aspire-host-ports_test.ts
Check .llm/tools/validation/check-close-gate_test.ts
Check .llm/tools/validation/check-netscript-jsr-specifiers_test.ts
Check .llm/tools/validation/fresh-ui-quality_test.ts
Check .llm/tools/validation/mirror-acceptance-evidence_test.ts
Check .llm/tools/validation/redis-regression-gate_test.ts
Check docs/site/_plugins/check-source-format_test.ts
Check docs/site/reference/ai/examples_test.ts
Check docs/site/reference/contracts/examples_test.ts
Check docs/site/reference/cron/examples_test.ts
Check docs/site/reference/prisma-adapter-mysql/examples_test.ts
Check docs/site/reference/queue/examples_test.ts
Check docs/site/reference/sagas/examples_test.ts
Check docs/site/reference/streams/examples_test.ts
Check docs/site/reference/triggers/examples_test.ts
Check docs/site/reference/workers/examples_test.ts
Check packages/auth-better-auth/tests/backend-error-interop_test.ts
Check packages/auth-better-auth/tests/better-auth-node-compat_test.ts
Check packages/auth-better-auth/tests/better-auth_test.ts
Check packages/auth-kv-oauth/tests/auth_kv_oauth_test.ts
Check packages/auth-workos/tests/workos-access-token_test.ts
Check packages/auth-workos/tests/workos-authenticator_test.ts
Check packages/auth-workos/tests/workos-node-compat_test.ts
Check packages/cron/tests/abort-cleanup_test.ts
Check packages/cron/tests/memory-adapter_test.ts
Check packages/cron/tests/retry-backoff_test.ts
Check packages/cron/tests/scheduler_test.ts
Check packages/cron/tests/types_test.ts
Check packages/database/tests/_fixtures/docs-examples_test.ts
Check packages/database/tests/adapter-contract_test.ts
Check packages/database/tests/migrate-artifacts_test.ts
Check packages/database/tests/migrate-retry_test.ts
Check packages/database/tests/zod-crud-barrel_test.ts
Check packages/kv/tests/_fixtures/docs-examples_test.ts
Check packages/kv/tests/auto-detect_test.ts
Check packages/kv/tests/bridge_test.ts
Check packages/kv/tests/keys_test.ts
Check packages/kv/tests/memory.adapter_test.ts
Check packages/kv/tests/redis.adapter_test.ts
Check packages/kv/tests/shared_test.ts
Check packages/prisma-adapter-mysql/tests/capabilities_test.ts
Check packages/prisma-adapter-mysql/tests/conversion_test.ts
Check packages/prisma-adapter-mysql/tests/errors_test.ts
Check packages/queue/tests/_fixtures/docs-examples_test.ts
Check packages/queue/tests/abort-cleanup_test.ts
Check packages/queue/tests/dead-letter-store_test.ts
Check packages/queue/tests/envelope_test.ts
Check packages/queue/tests/errors_test.ts
Check packages/queue/tests/fedify-adapter-dlq_test.ts
Check packages/queue/tests/kv-polling-dlq_test.ts
Check packages/queue/tests/memory-queue_test.ts
Check packages/queue/tests/options_test.ts
Check packages/queue/tests/postgres-adapter_test.ts
Check packages/queue/tests/provider-dead-letter-store_test.ts
Check packages/queue/tests/redis-adapter-dlq_test.ts
Check packages/queue/tests/typed-queue_test.ts
Check packages/queue/tests/validation_test.ts
Check packages/sdk/src/cache/cache-provider_test.ts
Check packages/sdk/tests/auto-update/release-client_test.ts
Check packages/sdk/tests/auto-update/start-auto-update_test.ts
Check packages/sdk/tests/cache/cache-query_test.ts
Check packages/sdk/tests/desktop/bind-channel_test.ts
Check packages/sdk/tests/desktop/desktop-rpc-client_test.ts
Check packages/sdk/tests/discovery/env-ordering_test.ts
Check packages/sdk/tests/integration/service-client-runtime_test.ts
Check packages/sdk/tests/integration/workers-trigger-rpc_test.ts
Check packages/sdk/tests/package-manifest_test.ts
Check packages/sdk/tests/query-client/kv-cache-persister_test.ts
Check packages/sdk/tests/query/query-factory_test.ts
Check packages/sdk/tests/readme-doctest_test.ts
Check packages/service/tests/_fixtures/readme-examples_test.ts
Check packages/service/tests/auth/authenticators_test.ts
Check packages/service/tests/auth/authorizer_test.ts
Check packages/service/tests/auth/builder-auth_test.ts
Check packages/service/tests/auth/define-service-auth_test.ts
Check packages/service/tests/auth/middleware_test.ts
Check packages/service/tests/database-connectivity_test.ts
Check packages/service/tests/define-service_test.ts
Check packages/service/tests/handlers_test.ts
Check packages/service/tests/health_test.ts
Check packages/service/tests/hono-tracing_test.ts
Check packages/service/tests/legacy-abort_test.ts
Check packages/service/tests/rpc-path_test.ts
Check packages/service/tests/runtime-host_test.ts
Check packages/service/tests/runtime_test.ts
Check packages/service/tests/service-builder_test.ts
Check packages/service/tests/shutdown-coordinator_test.ts
Check packages/service/tests/tls-listener_test.ts
Check packages/service/tests/type-assignability_test.ts
Check packages/ai/tests/agent_loop_test.ts
Check packages/ai/tests/anthropic_test.ts
Check packages/ai/tests/byok_test.ts
Check packages/ai/tests/generation_options_test.ts
Check packages/ai/tests/mcp_test.ts
Check packages/ai/tests/ollama_test.ts
Check packages/ai/tests/openai_compatible_test.ts
Check packages/ai/tests/openai_embeddings_test.ts
Check packages/ai/tests/openai_vision_test.ts
Check packages/ai/tests/openrouter_test.ts
Check packages/ai/tests/prompt_test.ts
Check packages/ai/tests/provider_isolation_test.ts
Check packages/ai/tests/provider_retry_test.ts
Check packages/ai/tests/registry_test.ts
Check packages/ai/tests/retriever_test.ts
Check packages/ai/tests/runtime_test.ts
Check packages/ai/tests/skills_test.ts
Check packages/ai/tests/tools_test.ts
Check packages/ai/tests/vector_memory_test.ts
Check packages/aspire/tests/_fixtures/readme-examples_test.ts
Check packages/aspire/tests/adapters/aspire-typescript-builder_test.ts
Check packages/aspire/tests/application/compose-apphost_test.ts
Check packages/aspire/tests/config_test.ts
Check packages/aspire/tests/helpers_test.ts
Check packages/aspire/tests/runtime/aspire-ns-plugin-contribution_test.ts
Check packages/aspire/tests/runtime/contribution-registry_test.ts
Check packages/aspire/tests/schema_test.ts
Check packages/aspire/tests/types_test.ts
Check packages/mcp/tests/canonical-identity_test.ts
Check packages/mcp/tests/command_adapters_test.ts
Check packages/mcp/tests/command_composition_test.ts
Check packages/mcp/tests/command_flows_test.ts
Check packages/mcp/tests/description-ladder_test.ts
Check packages/mcp/tests/docs-source-policy_test.ts
Check packages/mcp/tests/docs_test.ts
Check packages/mcp/tests/doctor-families_test.ts
Check packages/mcp/tests/doctor_test.ts
Check packages/mcp/tests/drift-evidence_test.ts
Check packages/mcp/tests/embedded-export-surface-corpus_test.ts
Check packages/mcp/tests/export-surface-flows_test.ts
Check packages/mcp/tests/export-surface-mirror-free_test.ts
Check packages/mcp/tests/guidance-contract_test.ts
Check packages/mcp/tests/guidance-evaluation_test.ts
Check packages/mcp/tests/guidance-retrieval_test.ts
Check packages/mcp/tests/openapi-read-tools_test.ts
Check packages/mcp/tests/operation-index_test.ts
Check packages/mcp/tests/registry_test.ts
Check packages/mcp/tests/release-embedded-docs-corpus_test.ts
Check packages/mcp/tests/schema-views_test.ts
Check packages/mcp/tests/service-endpoint-directory_test.ts
Check packages/mcp/tests/service-endpoint-sources_test.ts
Check packages/mcp/tests/stdio_test.ts
Check packages/mcp/tests/telemetry-aggregation_test.ts
Check packages/mcp/tests/telemetry-endpoint_test.ts
Check packages/mcp/tests/telemetry-flows_test.ts
Check packages/mcp/tests/telemetry-live-fixture_test.ts
Check packages/mcp/tests/truncation_test.ts
Check packages/bench/tests/bench-runner_test.ts
Check packages/bench/tests/deno-http_test.ts
Check packages/bench/tests/json-reporter_test.ts
Check packages/bench/tests/local-workspace_test.ts
Check packages/bench/tests/normalizer_test.ts
Check packages/bench/tests/scorer_test.ts
Check packages/bench/tests/task-catalog_test.ts
Check packages/cli/module_import_side_effect_test.ts
Check packages/cli/scaffolding_test.ts
Check packages/cli/src/kernel/adapters/aspire/apphost-doctor-inspector_test.ts
Check packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target_test.ts
Check packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target_test.ts
Check packages/cli/src/kernel/adapters/config/deploy-config-resolvers.test.ts
Check packages/cli/src/kernel/adapters/config/deploy-config-resolvers_test.ts
Check packages/cli/src/kernel/adapters/config/plugin-registry.test.ts
Check packages/cli/src/kernel/adapters/config/project-config-loader_test.ts
Check packages/cli/src/kernel/adapters/contracts/contract-source_test.ts
Check packages/cli/src/kernel/adapters/database/apphost-lifecycle-lock_test.ts
Check packages/cli/src/kernel/adapters/database/operation-runner-helpers_test.ts
Check packages/cli/src/kernel/adapters/database/operation-runner_test.ts
Check packages/cli/src/kernel/adapters/database/scaffolder_test.ts
Check packages/cli/src/kernel/adapters/database/workspace-mutator_remove_test.ts
Check packages/cli/src/kernel/adapters/database/workspace-resolver_test.ts
Check packages/cli/src/kernel/adapters/deno-deploy/deno-deploy-cli_test.ts
Check packages/cli/src/kernel/adapters/deploy/compile/compile-platform_test.ts
Check packages/cli/src/kernel/adapters/deploy/compile/compile_test.ts
Check packages/cli/src/kernel/adapters/deploy/runtime-detect_test.ts
Check packages/cli/src/kernel/adapters/health/fetch-health-probe_test.ts
Check packages/cli/src/kernel/adapters/linux/systemd/systemd-environment_test.ts
Check packages/cli/src/kernel/adapters/linux/systemd/systemd_test.ts
Check packages/cli/src/kernel/adapters/plugin/db-integration_test.ts
Check packages/cli/src/kernel/adapters/plugin/plugin-reference-reconciler_test.ts
Check packages/cli/src/kernel/adapters/plugin/scaffolder_test.ts
Check packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts
Check packages/cli/src/kernel/adapters/runtime/file-system/deno-file-system_test.ts
Check packages/cli/src/kernel/adapters/runtime/process/deno-process_test.ts
Check packages/cli/src/kernel/adapters/scaffold/tests/dry-run-fs_test.ts
Check packages/cli/src/kernel/adapters/scaffold/tests/fresh-adapter_test.ts
Check packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts
Check packages/cli/src/kernel/adapters/scaffold/tests/scaffolder_test.ts
Check packages/cli/src/kernel/adapters/scaffold/tests/template-adapter_test.ts
Check packages/cli/src/kernel/adapters/scaffold/tests/workspace-writer_test.ts
Check packages/cli/src/kernel/adapters/secrets/env-file-secrets-store_test.ts
Check packages/cli/src/kernel/adapters/service/client-scaffolder_test.ts
Check packages/cli/src/kernel/adapters/service/router-source_test.ts
Check packages/cli/src/kernel/adapters/service/scaffolder_test.ts
Check packages/cli/src/kernel/adapters/templates/template-asset_test.ts
Check packages/cli/src/kernel/adapters/windows/manifest/manifest-resolver_test.ts
Check packages/cli/src/kernel/application/registries/template-registry_test.ts
Check packages/cli/src/kernel/application/scaffold/orchestrate-init_test.ts
Check packages/cli/src/kernel/application/scaffold/plan-init_test.ts
Check packages/cli/src/kernel/application/scaffold/support/format-generated-files_test.ts
Check packages/cli/src/kernel/application/scaffold/writers/write-app-files_test.ts
Check packages/cli/src/kernel/application/ui/registry-deno-json_test.ts
Check packages/cli/src/kernel/application/ui/registry-lifecycle_test.ts
Check packages/cli/src/kernel/application/ui/registry-styles.test.ts
Check packages/cli/src/kernel/application/ui/web-scaffold_test.ts
Check packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog_test.ts
Check packages/cli/src/kernel/constants/version-drift_test.ts
Check packages/cli/src/kernel/domain/deploy/activation-convention_test.ts
Check packages/cli/src/kernel/domain/deploy/deno-deploy-target_test.ts
Check packages/cli/src/kernel/domain/deploy/deploy-target-port_test.ts
Check packages/cli/src/kernel/domain/deploy/health-gate_test.ts
Check packages/cli/src/kernel/domain/deploy/observability-convention_test.ts
Check packages/cli/src/kernel/domain/deploy/rollback-convention_test.ts
Check packages/cli/src/kernel/domain/deploy/secrets-convention_test.ts
Check packages/cli/src/kernel/domain/deploy/unstable-api-guard_test.ts
Check packages/cli/src/kernel/domain/scaffold/app-name_test.ts
Check packages/cli/src/kernel/domain/scaffold/default-port-allocation_test.ts
Check packages/cli/src/kernel/templates/app/generators-config_test.ts
Check packages/cli/src/kernel/templates/app/route-templates_test.ts
Check packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts
Check packages/cli/src/kernel/templates/aspire/generators_test.ts
Check packages/cli/src/kernel/templates/aspire/helpers/tests/database-permissions_test.ts
Check packages/cli/src/kernel/templates/aspire/helpers/tests/generate-db-cli-mode_test.ts
Check packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-infrastructure_test.ts
Check packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts
Check packages/cli/src/kernel/templates/aspire/helpers/tests/generators-config-infra_test.ts
Check packages/cli/src/kernel/templates/aspire/helpers/tests/generators-pipeline_test.ts
Check packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts
Check packages/cli/src/kernel/templates/aspire/helpers/tests/generators-tools-db-index_test.ts
Check packages/cli/src/kernel/templates/aspire/helpers/tests/register-http-endpoint_test.ts
Check packages/cli/src/kernel/templates/aspire/helpers/tests/service-environment-runtime_test.ts
Check packages/cli/src/kernel/templates/aspire/helpers/tests/service-environment_test.ts
Check packages/cli/src/kernel/templates/aspire/pristine-scaffold-ports_test.ts
Check packages/cli/src/kernel/templates/database/generators_test.ts
Check packages/cli/src/kernel/templates/plugins/generate-plugin-service_test.ts
Check packages/cli/src/kernel/templates/service/generators_test.ts
Check packages/cli/src/kernel/templates/workspace/generators_test.ts
Check packages/cli/src/kernel/templates/workspace/node-modules-verifier_test.ts
Check packages/cli/src/kernel/templates/workspace/quality-runner_test.ts
Check packages/cli/src/local/composition/local-contributor-command-tree_test.ts
Check packages/cli/src/local/features/plugins/install/install-local-plugin_test.ts
Check packages/cli/src/maintainer/adapters/official-plugin-source_test.ts
Check packages/cli/src/maintainer/adapters/packages-copier_test.ts
Check packages/cli/src/maintainer/features/init/init-command_test.ts
Check packages/cli/src/maintainer/features/root/maintainer-services_test.ts
Check packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-copy_test.ts
Check packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts
Check packages/cli/src/public/adapters/agent/deno-agent-docs-generator_test.ts
Check packages/cli/src/public/adapters/jsr-import-resolver_test.ts
Check packages/cli/src/public/adapters/os-service-factory_test.ts
Check packages/cli/src/public/adapters/service-activation-port_test.ts
Check packages/cli/src/public/adapters/systemd-os-service_test.ts
Check packages/cli/src/public/composition/run-public-cli_test.ts
Check packages/cli/src/public/domain/scaffold-plan_test.ts
Check packages/cli/src/public/features/agent/drift/record-drift-command_test.ts
Check packages/cli/src/public/features/agent/init/init-agent-command_test.ts
Check packages/cli/src/public/features/agent/init/init-agent_test.ts
Check packages/cli/src/public/features/agent/mcp/agent-mcp-command_test.ts
Check packages/cli/src/public/features/agent/mcp/cli-mcp-adapters_test.ts
Check packages/cli/src/public/features/agent/mcp/command-policy-parity_test.ts
Check packages/cli/src/public/features/config/override/manage-runtime-overrides_test.ts
Check packages/cli/src/public/features/config/project/list-appsettings-paths_test.ts
Check packages/cli/src/public/features/config/project/project-config-ops_test.ts
Check packages/cli/src/public/features/config/project/resolve-appsettings-path_test.ts
Check packages/cli/src/public/features/contracts/add-route/add-contract-route_test.ts
Check packages/cli/src/public/features/contracts/add/add-contract_test.ts
Check packages/cli/src/public/features/contracts/remove/remove-contract_test.ts
Check packages/cli/src/public/features/contracts/version-add/add-contract-version_test.ts
Check packages/cli/src/public/features/db/add/add-db_test.ts
Check packages/cli/src/public/features/db/operations/db-operation-command_test.ts
Check packages/cli/src/public/features/deploy/build/deploy_test.ts
Check packages/cli/src/public/features/deploy/build/prepare-deploy-build_test.ts
Check packages/cli/src/public/features/deploy/list/list-deploy-targets_test.ts
Check packages/cli/src/public/features/deploy/target/desktop/desktop-group_test.ts
Check packages/cli/src/public/features/deploy/target/desktop/package/package-desktop-command_test.ts
Check packages/cli/src/public/features/deploy/target/desktop/package/package-desktop_test.ts
Check packages/cli/src/public/features/deploy/target/desktop/package/plan-desktop-packages_test.ts
Check packages/cli/src/public/features/deploy/target/desktop/release/prepare-native-release_test.ts
Check packages/cli/src/public/features/deploy/target/desktop/release/prepare-release-command_test.ts
Check packages/cli/src/public/features/deploy/target/desktop/release/release-store_test.ts
Check packages/cli/src/public/features/deploy/target/desktop/release/server/release-handler_test.ts
Check packages/cli/src/public/features/deploy/target/desktop/release/server/serve-release-command_test.ts
Check packages/cli/src/public/features/deploy/target/desktop/release/sign-release_test.ts
Check packages/cli/src/public/features/deploy/target/target-deploy-command_test.ts
Check packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command_test.ts
Check packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator_test.ts
Check packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts
Check packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts
Check packages/cli/src/public/features/init/init-command_test.ts
Check packages/cli/src/public/features/marketplace/marketplace-group_test.ts
Check packages/cli/src/public/features/plugins/ai/ai-plugin-command_test.ts
Check packages/cli/src/public/features/plugins/auth/auth-plugin-command_test.ts
Check packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb_test.ts
Check packages/cli/src/public/features/plugins/doctor/doctor-plugin-command_test.ts
Check packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts
Check packages/cli/src/public/features/plugins/host/plugin-loader_test.ts
Check packages/cli/src/public/features/plugins/install/confirm-plugin-install_test.ts
Check packages/cli/src/public/features/plugins/install/install-plugin_test.ts
Check packages/cli/src/public/features/plugins/install/manifest-service-shape_test.ts
Check packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts
Check packages/cli/src/public/features/plugins/install/plugin-trust-tier_test.ts
Check packages/cli/src/public/features/plugins/list/list-plugins-command_test.ts
Check packages/cli/src/public/features/plugins/new/new-plugin_test.ts
Check packages/cli/src/public/features/plugins/remove/remove-plugin_test.ts
Check packages/cli/src/public/features/plugins/scaffold/scaffold-plugin_test.ts
Check packages/cli/src/public/features/root/command-registry_test.ts
Check packages/cli/src/public/features/root/public-command-tree_test.ts
Check packages/cli/src/public/features/services/add-handler/add-service-handler_test.ts
Check packages/cli/src/public/features/services/add/add-service_test.ts
Check packages/cli/src/public/features/services/configure/mutate-service-config_test.ts
Check packages/cli/src/public/features/services/remove/remove-service_test.ts
Check packages/cli/src/public/features/ui/add/add-ui-command_test.ts
Check packages/cli/src/public/features/ui/registry.test.ts
Check packages/cli/src/public/features/ui/ui-app-root-command_test.ts
Check packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator_test.ts
Check packages/cli/src/public/infra/jsr/verify-jsr-package-integrity_test.ts
Check packages/cli/src/public/infra/permissions/plugin-scaffold-permissions_test.ts
Check packages/cli/testing_test.ts
Check packages/cli/e2e/fixtures/desktop-native/tests/fixture-contract_test.ts
Check packages/cli/e2e/src/application/gates/quickstart/database-integrity-walk_test.ts
Check packages/cli/e2e/src/application/gates/scaffold/run-documented-stream-example_test.ts
Check packages/cli/e2e/src/application/gates/scaffold/select-flow-b-stream-change_test.ts
Check packages/cli/e2e/src/application/gates/scaffold/service-env/discover-service-subjects_test.ts
Check packages/cli/e2e/src/application/gates/scaffold/service-env/process-evidence_test.ts
Check packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-evidence_test.ts
Check packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-gates_test.ts
Check packages/cli/e2e/src/application/gates/scaffold/validate-aspire-task-traces_test.ts
Check packages/cli/e2e/src/application/gates/scaffold/validate-flow-b-traces_test.ts
Check packages/cli/e2e/src/application/gates/scaffold/verify-producer-reconnect_test.ts
Check packages/cli/e2e/tests/adapters/commands/docker-resource-cleaner_test.ts
Check packages/cli/e2e/tests/adapters/reporting/pretty-reporter_test.ts
Check packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts
Check packages/cli/e2e/tests/application/builders/runtime-gates_test.ts
Check packages/cli/e2e/tests/application/builders/suite-builder_test.ts
Check packages/cli/e2e/tests/application/builders/workspace-options_test.ts
Check packages/cli/e2e/tests/application/gates/aspire-dashboard-telemetry_test.ts
Check packages/cli/e2e/tests/application/gates/command-gate_test.ts
Check packages/cli/e2e/tests/application/gates/configure-published-workers-block_test.ts
Check packages/cli/e2e/tests/application/gates/generated-app-endpoint_test.ts
Check packages/cli/e2e/tests/application/gates/http-gate_test.ts
Check packages/cli/e2e/tests/application/gates/local-source-fixture_test.ts
Check packages/cli/e2e/tests/application/gates/probe-app-reference_test.ts
Check packages/cli/e2e/tests/application/gates/quickstart-aspire-walk_test.ts
Check packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts
Check packages/cli/e2e/tests/application/gates/scaffold/generated-app-identity-source-policy_test.ts
Check packages/cli/e2e/tests/application/gates/scaffold/plugin-contract-gates_test.ts
Check packages/cli/e2e/tests/application/gates/scaffold/ui-ai-gates_test.ts
Check packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts
Check packages/cli/e2e/tests/application/runner/gate-runner_test.ts
Check packages/cli/e2e/tests/application/runner/suite-lease_test.ts
Check packages/cli/e2e/tests/application/runner/suite-runner_test.ts
Check packages/cli/e2e/tests/application/verify-clean-clone-readme_test.ts
Check packages/cli/e2e/tests/presentation/cli-options_test.ts
Check packages/cli/e2e/tests/presentation/cli-program_test.ts
Check packages/cli/e2e/tests/presentation/init-json_test.ts
Check packages/cli/e2e/tests/presentation/quickstart-command-drift_test.ts
Check packages/cli/e2e/tests/presentation/quickstart-walk-suite_test.ts
Check packages/cli/e2e/tests/presentation/suite-registry_test.ts
Check packages/config/tests/_fixtures/readme-examples_test.ts
Check packages/config/tests/merge/merge_test.ts
Check packages/config/tests/schema/deploy_schema_test.ts
Check packages/config/tests/schema/netscript_config_test.ts
Check packages/config/tests/schema/plugins_test.ts
Check packages/config/tests/schema/service_schema_test.ts
Check packages/config/workspace.test.ts
Check packages/contracts/tests/contracts_test.ts
Check packages/contracts/tests/errors_test.ts
Check packages/contracts/tests/schema-types_test.ts
Check packages/plugin-ai-core/src/contracts/v1/base-error-adapter_test.ts
Check packages/plugin-ai-core/tests/contracts/ai-contract-soundness_test.ts
Check packages/plugin-auth-core/src/config/config_test.ts
Check packages/plugin-auth-core/src/contracts/v1/auth.contract_test.ts
Check packages/plugin-auth-core/src/contracts/v1/base-error-adapter_test.ts
Check packages/plugin-auth-core/src/domain/domain_test.ts
Check packages/plugin-auth-core/src/ports/ports_test.ts
Check packages/plugin-auth-core/src/presets/presets_test.ts
Check packages/plugin-auth-core/src/streams/streams_test.ts
Check packages/plugin-auth-core/src/telemetry/telemetry_test.ts
Check packages/plugin-auth-core/src/testing/testing_test.ts
Check packages/plugin-auth-core/tests/contracts/auth-contract-soundness_test.ts
Check packages/plugin-sagas-core/src/stores/kv-saga-store_test.ts
Check packages/plugin-sagas-core/src/stores/prisma-saga-store_integration_test.ts
Check packages/plugin-sagas-core/src/stores/prisma-saga-store_test.ts
Check packages/plugin-sagas-core/src/stores/saga-store-backend_test.ts
Check packages/plugin-sagas-core/tests/contracts/sagas-contract-soundness_test.ts
Check packages/plugin-sagas-core/tests/runtime/checkout-saga-contract_test.ts
Check packages/plugin-sagas-core/tests/runtime/create-saga-runtime_test.ts
Check packages/plugin-sagas-core/tests/runtime/saga-concurrency_test.ts
Check packages/plugin-sagas-core/tests/runtime/saga-engine_applied_keys_test.ts
Check packages/plugin-sagas-core/tests/runtime/saga-idempotency_test.ts
Check packages/plugin-sagas-core/tests/runtime/saga-runtime_applied_keys_test.ts
Check packages/plugin-sagas-core/tests/runtime/saga-scheduler_test.ts
Check packages/plugin-sagas-core/tests/runtime/saga-store_test.ts
Check packages/plugin-sagas-core/tests/runtime/start-sagas_test.ts
Check packages/plugin-sagas-core/tests/stores/kv-saga-runtime-stores_test.ts
Check packages/plugin-sagas-core/tests/stores/kv-saga-store_redis_test.ts
Check packages/plugin-sagas-core/tests/telemetry/instrumentation_test.ts
Check packages/plugin-sagas-core/tests/telemetry/otel-saga-telemetry_test.ts
Check packages/plugin-sagas-core/tests/telemetry/saga-engine-spans_test.ts
Check packages/plugin-sagas-core/tests/testing/testing-helpers_test.ts
Check packages/plugin-streams-core/tests/adapters/durable-stream-producer-transport_test.ts
Check packages/plugin-streams-core/tests/application/create-service-stream-producer_test.ts
Check packages/plugin-streams-core/tests/application/durable-stream-producer-contract_behavior_test.ts
Check packages/plugin-streams-core/tests/application/durable-stream-producer-reconnect_behavior_test.ts
Check packages/plugin-streams-core/tests/application/durable-stream-producer_test.ts
Check packages/plugin-streams-core/tests/application/stream-sse-v1_test.ts
Check packages/plugin-streams-core/tests/telemetry/durable-stream-producer-telemetry_test.ts
Check packages/plugin-streams-core/tests/telemetry/instrumentation_test.ts
Check packages/plugin-streams-core/tests/testing/memory-stream-producer_test.ts
Check packages/plugin-triggers-core/src/adapters/cron-trigger-scheduler-adapter_test.ts
Check packages/plugin-triggers-core/src/builders/trigger-definition-fields_test.ts
Check packages/plugin-triggers-core/src/runtime/compute-next-fire-times_test.ts
Check packages/plugin-triggers-core/src/runtime/create-event-subscription_test.ts
Check packages/plugin-triggers-core/src/runtime/create-manual-dispatcher_test.ts
Check packages/plugin-triggers-core/src/runtime/create-trigger-ingress_test.ts
Check packages/plugin-triggers-core/src/runtime/create-webhook-test-delivery_test.ts
Check packages/plugin-triggers-core/src/runtime/trigger-processor_test.ts
Check packages/plugin-triggers-core/src/stores/kv-trigger-defer-scheduler_test.ts
Check packages/plugin-triggers-core/src/stores/kv-trigger-enabled-state-store_test.ts
Check packages/plugin-triggers-core/src/stores/kv-trigger-runtime-stores_test.ts
Check packages/plugin-triggers-core/src/telemetry/instrumentation_test.ts
Check packages/plugin-triggers-core/src/testing/testing_test.ts
Check packages/plugin-triggers-core/tests/contracts/triggers-contract-soundness_test.ts
Check packages/plugin-workers-core/src/stores/kv-worker-idempotency-store_test.ts
Check packages/plugin-workers-core/tests/contracts/workers-contract-base-seam_test.ts
Check packages/plugin-workers-core/tests/contracts/workers-contract-soundness_test.ts
Check packages/plugin-workers-core/tests/executor/argv-builder_test.ts
Check packages/plugin-workers-core/tests/executor/deno-runtime-adapter_test.ts
Check packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts
Check packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts
Check packages/plugin-workers-core/tests/runtime/worker-idempotency_test.ts
Check packages/plugin-workers-core/tests/streams/workers-streams_test.ts
Check packages/plugin-workers-core/tests/testing/memory-worker_test.ts
Check packages/plugin/src/adapter/commands/install_test.ts
Check packages/plugin/src/adapter/factory_test.ts
Check packages/plugin/src/adapter/item/item-scaffolder_test.ts
Check packages/plugin/src/adapter/item/substitute_test.ts
Check packages/plugin/src/adapter/runner/plugin-cli-runner_test.ts
Check packages/plugin/src/adapter/scaffold-cli-runner_test.ts
Check packages/plugin/src/sdk/discovery/manifest-resolver_test.ts
Check packages/plugin/src/service/presentation/create-plugin-service-rawroute_test.ts
Check packages/plugin/tests/_fixtures/readme-examples_test.ts
Check packages/plugin/tests/adapters/memory-file-system_test.ts
Check packages/plugin/tests/application/plugin-loader_test.ts
Check packages/plugin/tests/application/plugin-registry_test.ts
Check packages/plugin/tests/cli/argv_test.ts
Check packages/plugin/tests/cli/base-meta-commands_test.ts
Check packages/plugin/tests/cli/generated-project-registry_test.ts
Check packages/plugin/tests/cli/plugin-cli_test.ts
Check packages/plugin/tests/contract-base/base-contract_test.ts
Check packages/plugin/tests/diagnostics/e2e-gate_test.ts
Check packages/plugin/tests/diagnostics/probes_test.ts
Check packages/plugin/tests/diagnostics/verify-plugin_test.ts
Check packages/plugin/tests/domain/core-types_test.ts
Check packages/plugin/tests/domain/errors_test.ts
Check packages/plugin/tests/protocol/plugin-manifest_test.ts
Check packages/plugin/tests/scaffold/scaffold-generators_test.ts
Check packages/plugin/tests/sdk/walker-ports_test.ts
Check packages/plugin/tests/sdk/watcher-cleanup_test.ts
Check packages/plugin/tests/service/create-plugin-service_test.ts
Check packages/plugin/tests/service/plugin-contract-binder_test.ts
Check packages/watchers/filters/dedup_test.ts
Check packages/watchers/filters/glob_test.ts
Check packages/watchers/filters/stability_test.ts
Check packages/watchers/tests/_fixtures/docs-examples_test.ts
Check packages/watchers/tests/file-watcher_test.ts
Check plugins/ai/src/adapter/resources/resources.test.ts
Check plugins/ai/src/cli/ai-commands.test.ts
Check plugins/ai/src/cli/ai-registry-compiler.test.ts
Check plugins/ai/tests/adapter/doctor_test.ts
Check plugins/ai/tests/adapter/no-samples-install_test.ts
Check plugins/ai/tests/manifest_test.ts
Check plugins/auth/src/adapter/resources/resources.test.ts
Check plugins/auth/tests/public/manifest_test.ts
Check plugins/auth/tests/scaffold/manifest_test.ts
Check plugins/auth/tests/services/auth-service_test.ts
Check plugins/auth/tests/services/auth-v1-context-types_test.ts
Check plugins/auth/tests/services/import-surface_test.ts
Check plugins/auth/tests/streams/streams_test.ts
Check plugins/sagas/services/src/database-client_test.ts
Check plugins/sagas/src/adapter/resources/resources.test.ts
Check plugins/sagas/src/runtime/create-durable-saga-runtime_test.ts
Check plugins/sagas/src/runtime/durable-saga-restart_test.ts
Check plugins/sagas/src/runtime/saga-instance-projection_redis_test.ts
Check plugins/sagas/src/runtime/saga-supervisor_test.ts
Check plugins/sagas/streams/producer_transition_test.ts
Check plugins/sagas/tests/adapter/plugin-doctor_test.ts
Check plugins/sagas/tests/aspire/sagas-contribution_test.ts
Check plugins/sagas/tests/cli/add-dry-run_test.ts
Check plugins/sagas/tests/cli/fluent-call-editor_test.ts
Check plugins/sagas/tests/cli/local-runtime-backend_test.ts
Check plugins/sagas/tests/cli/registry-generator-golden_test.ts
Check plugins/sagas/tests/cli/sagas-cli_test.ts
Check plugins/sagas/tests/e2e/sagas-gates_test.ts
Check plugins/sagas/tests/public/manifest_test.ts
Check plugins/sagas/tests/runtime/project-registry-module_test.ts
Check plugins/sagas/tests/runtime/saga-runner_test.ts
Check plugins/sagas/tests/runtime/storefront-checkout-flow_test.ts
Check plugins/sagas/tests/services/init_test.ts
Check plugins/sagas/tests/services/publish-http-boundary_test.ts
Check plugins/sagas/tests/services/publish-message_test.ts
Check plugins/sagas/tests/telemetry/otel-saga-tracer_test.ts
Check plugins/sagas/tests/telemetry/publish-trace-linkage_test.ts
Check plugins/streams/services/src/durability_test.ts
Check plugins/streams/services/src/main_test.ts
Check plugins/streams/services/src/proxy_test.ts
Check plugins/streams/services/src/sse-contract_conformance_test.ts
Check plugins/streams/src/adapter/resources/resources.test.ts
Check plugins/streams/tests/aspire/streams-contribution_test.ts
Check plugins/streams/tests/cli/add-dry-run_test.ts
Check plugins/streams/tests/cli/streams-cli_test.ts
Check plugins/streams/tests/docs/native-event-source-example_test.ts
Check plugins/streams/tests/e2e/producer-reconnect_test.ts
Check plugins/streams/tests/e2e/streams-gates_test.ts
Check plugins/streams/tests/public/manifest_test.ts
Check plugins/streams/tests/public/stream-api_test.ts
Check plugins/streams/tests/service/durable-stream-producer-idempotency_test.ts
Check plugins/streams/tests/service/proxy-headers_test.ts
Check plugins/triggers/services/src/main_test.ts
Check plugins/triggers/src/adapter/resources/resources.test.ts
Check plugins/triggers/src/runtime/project-trigger-registry_test.ts
Check plugins/triggers/src/runtime/trigger-runtime-parenting_test.ts
Check plugins/triggers/src/runtime/trigger-runtime-processor_test.ts
Check plugins/triggers/tests/aspire/aspire_test.ts
Check plugins/triggers/tests/cli/add-dry-run_test.ts
Check plugins/triggers/tests/cli/cli_test.ts
Check plugins/triggers/tests/cli/http-triggers-service_test.ts
Check plugins/triggers/tests/cli/local-runtime-backend_test.ts
Check plugins/triggers/tests/cli/trigger-registry-compiler-golden_test.ts
Check plugins/triggers/tests/e2e/e2e-gates_test.ts
Check plugins/triggers/tests/e2e/webhooks-health_test.ts
Check plugins/triggers/tests/e2e/webhooks-ingress_test.ts
Check plugins/triggers/tests/e2e/webhooks-security_test.ts
Check plugins/triggers/tests/public/manifest_test.ts
Check plugins/workers/jobs/job-tools_test.ts
Check plugins/workers/services/src/describe-route_test.ts
Check plugins/workers/services/src/generated-jobs_test.ts
Check plugins/workers/services/src/init_test.ts
Check plugins/workers/services/src/routers/health-soundness_test.ts
Check plugins/workers/services/src/trigger-path-id_test.ts
Check plugins/workers/src/adapter/resources/resources.test.ts
Check plugins/workers/tests/adapter/plugin-doctor_test.ts
Check plugins/workers/tests/aspire/workers-contribution_test.ts
Check plugins/workers/tests/cli/add-dry-run_test.ts
Check plugins/workers/tests/cli/local-runtime-backend_test.ts
Check plugins/workers/tests/cli/registry-compiler-golden_test.ts
Check plugins/workers/tests/cli/workers-cli_test.ts
Check plugins/workers/tests/e2e/workers-gates_test.ts
Check plugins/workers/tests/public/manifest_test.ts
Check plugins/workers/tests/runtime/generated-jobs_test.ts
Check plugins/workers/worker/job-dispatcher_test.ts
Check plugins/workers/worker/job-execution_test.ts
Check plugins/workers/worker/worker-options_test.ts
Check packages/fresh-ui/tests/_fixtures/docs-examples_test.ts
Check packages/fresh-ui/tests/ai/render-ui.test.tsx
Check packages/fresh-ui/tests/chat/parse-blocks.test.ts
Check packages/fresh-ui/tests/consumer-render.test.tsx
Check packages/fresh-ui/tests/data-grid.test.tsx
Check packages/fresh-ui/tests/desktop/desktop-chrome.test.ts
Check packages/fresh-ui/tests/primitives.test.tsx
Check packages/fresh-ui/tests/registry-doc-drift.test.ts
Check packages/fresh-ui/tests/registry/components/ui/avatar.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/chart-block.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/citation-chip.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/code-block.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/command-palette.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/data-table.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/desktop.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/donut.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/dropzone.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/foundation.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/message.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/model-selector.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/prompt-input.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/search.test.tsx
Check packages/fresh-ui/tests/registry/components/ui/tool-call-card.test.tsx
Check packages/fresh-ui/tests/registry/islands/desktop-only.test.tsx
Check packages/fresh-ui/tests/registry/islands/mcp-ui-widget.test.tsx
Check packages/fresh-ui/tests/registry/lib/toast.test.ts
Check packages/fresh-ui/tests/registry/markdown-pipeline.test.ts
Check packages/fresh-ui/tests/registry/markdown-renderer.test.ts
Check packages/fresh-ui/tests/registry/render-ui-generated.test.ts
Check packages/fresh-ui/tests/runtime/_internal/collection-navigation.test.ts
Check packages/fresh-ui/tests/runtime/accordion/accordion-render.test.tsx
Check packages/fresh-ui/tests/runtime/accordion/accordion.test.ts
Check packages/fresh-ui/tests/runtime/action-menu/action-menu.test.ts
Check packages/fresh-ui/tests/runtime/combobox/combobox.utils.test.ts
Check packages/fresh-ui/tests/runtime/dialog/dialog.test.ts
Check packages/fresh-ui/tests/runtime/drawer/drawer.test.ts
Check packages/fresh-ui/tests/runtime/popover/popover.test.ts
Check packages/fresh-ui/tests/runtime/tabs/tabs.utils.test.ts
Check packages/fresh-ui/tests/runtime/tooltip/tooltip.test.ts
Check packages/fresh/src/application/builders/define-page/tests/builder.test.tsx
Check packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx
Check packages/fresh/src/application/builders/define-page/tests/runtime.test.tsx
Check packages/fresh/src/application/builders/define-page/tests/search-params.test.tsx
Check packages/fresh/src/application/builders/define-page/tests/surface.test.ts
Check packages/fresh/src/application/builders/define-partial.test.tsx
Check packages/fresh/src/application/defer/DeferIsland.test.ts
Check packages/fresh/src/application/defer/Deferred.test.tsx
Check packages/fresh/src/application/form/components/form.test.tsx
Check packages/fresh/src/application/form/runtime/tests/collection.test.ts
Check packages/fresh/src/application/form/runtime/tests/intent.test.ts
Check packages/fresh/src/application/form/runtime/tests/reply.test.ts
Check packages/fresh/src/application/form/runtime/tests/runtime-state.test.ts
Check packages/fresh/src/application/form/schema-adapter/schema-adapter-standard.test.ts
Check packages/fresh/src/application/form/schema-adapter/schema-adapter.test.ts
Check packages/fresh/src/application/form/validation/csrf.test.ts
Check packages/fresh/src/application/form/validation/error-normalization.test.ts
Check packages/fresh/src/application/query/cache-invalidation/mod.test.ts
Check packages/fresh/src/application/query/hydration-script.test.tsx
Check packages/fresh/src/application/query/initial-data.test.tsx
Check packages/fresh/src/application/query/mutation-lifecycle.test.ts
Check packages/fresh/src/application/query/query-options.test.ts
Check packages/fresh/src/application/route/contract.test.ts
Check packages/fresh/src/application/route/manifest-page-module.test.ts
Check packages/fresh/src/application/route/manifest.test.ts
Check packages/fresh/src/application/vite/vite.test.ts
Check packages/fresh/src/diagnostics/error/classify_test.ts
Check packages/fresh/src/diagnostics/error/extract_test.ts
Check packages/fresh/src/internal/package-telemetry/telemetry_test.ts
Check packages/fresh/src/runtime/ai/create-chat-connection_integration_test.ts
Check packages/fresh/src/runtime/ai/create-chat-connection_test.ts
Check packages/fresh/src/runtime/ai/mcp-app-call-handler_test.ts
Check packages/fresh/src/runtime/ai/mcp-sandbox-handler_test.ts
Check packages/fresh/src/runtime/ai/sandbox_exports_test.ts
Check packages/fresh/src/runtime/ai/stream-proxy_test.ts
Check packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts
Check packages/fresh/src/runtime/server/define-fresh-app.test.ts
Check packages/fresh/src/runtime/server/query-cache-invalidation.test.ts
Check packages/fresh/src/runtime/server/sse_test.ts
Check packages/fresh/src/runtime/server/stream_test.ts
Check packages/fresh/src/runtime/streams/create-stream-db_test.ts
Check packages/fresh/src/runtime/streams/create-stream-event-source_test.ts
Check packages/fresh/tests/_fixtures/docs-examples_test.ts
Check packages/fresh/tests/package-manifest_test.ts
Check packages/logger/tests/_fixtures/docs-examples_test.ts
Check packages/logger/tests/config_test.ts
Check packages/logger/tests/creators_test.ts
Check packages/logger/tests/middleware_test.ts
Check packages/runtime-config/tests/accessors_test.ts
Check packages/runtime-config/tests/loader_test.ts
Check packages/runtime-config/tests/summary_test.ts
Check packages/telemetry/tests/_fixtures/readme-examples_test.ts
Check packages/telemetry/tests/adapters/otel_ai_telemetry_test.ts
Check packages/telemetry/tests/adapters/otel_provider_test.ts
Check packages/telemetry/tests/application/fan-in-links_test.ts
Check packages/telemetry/tests/attributes/helpers_test.ts
Check packages/telemetry/tests/config/config_test.ts
Check packages/telemetry/tests/config/enabled_matrix_test.ts
Check packages/telemetry/tests/context/job_test.ts
Check packages/telemetry/tests/context/w3c_test.ts
Check packages/telemetry/tests/core/tracer_test.ts
Check packages/telemetry/tests/hono/otel_middleware_test.ts
Check packages/telemetry/tests/layering_test.ts
Check packages/telemetry/tests/orpc/plugin_test.ts
Check packages/telemetry/tests/query/aspire_query_test.ts
Check packages/telemetry/tests/runtime/instrumentation-registry_test.ts
Check packages/telemetry/tests/runtime/provider-registration_test.ts
Check packages/telemetry/tests/testing/in-memory-span-recorder_test.ts
Listening on http://0.0.0.0:42957/ (http://localhost:42957/)
Listening on http://127.0.0.1:42597/
Listening on http://127.0.0.1:43183/
Listening on http://127.0.0.1:43901/
Listening on http://127.0.0.1:42651/
Listening on http://127.0.0.1:43419/
````

### Root lint

Command: `rtk proxy deno task lint`

Exit code: **0** · elapsed: 3.4s

````text
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-f-b-dryrun","exitCode":0},"selection":{"filesSelected":2010,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
Task lint deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
````

### Root format check

Command: `rtk proxy deno task fmt:check`

Exit code: **0** · elapsed: 1.8s

````text
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-f-b-dryrun","mode":"check","summary":{"filesSelected":2010,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
Task fmt:check deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)" --ignore-line-endings
````

### Release-tool scoped type check

Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts`

Exit code: **0** · elapsed: 0.1s

````text
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-f-b-dryrun"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":41,"batches":1,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
````

### Framework quality gate (required by MCP task edit)

Command: `rtk proxy deno task quality:gate`

Exit code: **0** · elapsed: 5.9s

````text
{"ok":true,"mode":"repository","scanned":["packages/cli/src","plugins"],"findings":[],"allowCount":7,"allowances":[{"file":"packages/cli/src/public/features/root/public-command-dependencies.ts","line":363,"reason":"service manifest loader resolves a runtime module whose structural service contract is wider than the public loader port"},{"file":"packages/cli/src/public/public-api.ts","line":135,"reason":"public facade bridges duplicated internal and exported plugin port identities pending package-boundary unification"},{"file":"packages/cli/src/public/public-api.ts","line":136,"reason":"public facade bridges duplicated internal and exported plugin port identities pending package-boundary unification"},{"file":"packages/cli/src/public/public-api.ts","line":158,"reason":"public facade bridges duplicated internal and exported plugin port identities pending package-boundary unification"},{"file":"packages/cli/src/public/public-api.ts","line":275,"reason":"public facade bridges duplicated internal and exported plugin port identities pending package-boundary unification"},{"file":"packages/cli/src/public/public-api.ts","line":276,"reason":"public facade bridges duplicated internal and exported plugin port identities pending package-boundary unification"},{"file":"plugins/workers/streams/producer.ts","line":52,"reason":"durable-stream mutation hook upstream type omits the worker execution extension fields"}]}
WARN DEPS-NPM-CATALOG packages/ai/deno.json:31 packages/ai uses npm:@tanstack/ai@^0.39.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/ai/deno.json:32 packages/ai uses npm:@tanstack/ai-anthropic@^0.15.13 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/ai/deno.json:33 packages/ai uses npm:@tanstack/ai-mcp@0.2.1 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/ai/deno.json:34 packages/ai uses npm:@tanstack/ai-openai@^0.15.10 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/bench/deno.json:15 packages/bench uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/cli/e2e/deno.json:14 packages/cli/e2e uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/cli/e2e/fixtures/desktop-native/src/router.ts:2 packages/cli uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/cli/e2e/fixtures/desktop-native/src/router.ts:2 packages/cli/e2e uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/cli/e2e/src/application/gates/scaffold/consume-flow-b-stream.ts:10 packages/cli uses npm:@opentelemetry/api@^1.9.0 outside package.json catalog: (catalog has ^1.9.1, inline use has ^1.9.0)
WARN DEPS-NPM-CATALOG packages/cli/e2e/src/application/gates/scaffold/consume-flow-b-stream.ts:10 packages/cli/e2e uses npm:@opentelemetry/api@^1.9.0 outside package.json catalog: (catalog has ^1.9.1, inline use has ^1.9.0)
WARN DEPS-NPM-CATALOG packages/cli/e2e/src/application/gates/scaffold/consume-flow-b-stream.ts:11 packages/cli uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/cli/e2e/src/application/gates/scaffold/consume-flow-b-stream.ts:11 packages/cli/e2e uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/cli/e2e/src/application/gates/scaffold/ui-ai-gates.ts:140 packages/cli uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.7.0)
WARN DEPS-NPM-CATALOG packages/cli/e2e/src/application/gates/scaffold/ui-ai-gates.ts:140 packages/cli/e2e uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.7.0)
WARN DEPS-NPM-CATALOG packages/cli/e2e/src/application/gates/scaffold/ui-ai-gates.ts:174 packages/cli uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.7.0)
WARN DEPS-NPM-CATALOG packages/cli/e2e/src/application/gates/scaffold/ui-ai-gates.ts:174 packages/cli/e2e uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.7.0)
WARN DEPS-NPM-CATALOG packages/contracts/deno.json:13 packages/contracts uses npm:@orpc/contract@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/fresh-ui/deno.json:19 packages/fresh-ui uses npm:preact@^10.29.2 outside package.json catalog: (catalog has ^10.29.2)
WARN DEPS-NPM-CATALOG packages/fresh-ui/scripts/build-tokens.ts:1 packages/fresh-ui uses npm:style-dictionary@5.4.4 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/fresh-ui/tests/registry/components/ui/desktop.test.tsx:2 packages/fresh-ui uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.7.0)
WARN DEPS-NPM-CATALOG packages/fresh-ui/tests/registry/islands/desktop-only.test.tsx:3 packages/fresh-ui uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.7.0)
WARN DEPS-NPM-CATALOG packages/fresh-ui/tests/runtime/accordion/accordion-render.test.tsx:2 packages/fresh-ui uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.7.0)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:39 packages/fresh uses npm:preact@^10.29.2 outside package.json catalog: (catalog has ^10.29.2)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:40 packages/fresh uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.7.0)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:42 packages/fresh uses npm:@durable-streams/state@^0.3.1 outside package.json catalog: (catalog has ^0.3.1)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:43 packages/fresh uses npm:@durable-streams/tanstack-ai-transport@^0.0.8 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:49 packages/fresh uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:50 packages/fresh uses npm:@preact/signals@2.9.2 outside package.json catalog: (catalog has 2.9.2)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:51 packages/fresh uses npm:@tanstack/ai@^0.39.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:52 packages/fresh uses npm:@tanstack/ai-preact@^0.10.1 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:53 packages/fresh uses npm:@tanstack/preact-query@^5.101.0 outside package.json catalog: (catalog has ^5.101.0)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:54 packages/fresh uses npm:@tanstack/query-core@^5.101.0 outside package.json catalog: (catalog has ^5.101.0)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:55 packages/fresh uses npm:@tanstack/react-db@^0.1.95 outside package.json catalog: (catalog has ^0.1.95)
WARN DEPS-NPM-CATALOG packages/fresh/deno.json:56 packages/fresh uses npm:vite@7.2.2 outside package.json catalog: (catalog has 7.2.2)
WARN DEPS-NPM-CATALOG packages/fresh/src/application/vite/vite.test.ts:367 packages/fresh uses npm:/preact@10.29.7/hooks outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/logger/deno.json:20 packages/logger uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/plugin-ai-core/deno.json:11 packages/plugin-ai-core uses npm:@orpc/contract@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/plugin-ai-core/deno.json:12 packages/plugin-ai-core uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/plugin-auth-core/deno.json:18 packages/plugin-auth-core uses npm:@orpc/contract@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/plugin-auth-core/deno.json:19 packages/plugin-auth-core uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/plugin-sagas-core/src/stores/prisma-saga-store_integration_test.ts:2 packages/plugin-sagas-core uses npm:@prisma/adapter-pg@7.8.0 outside package.json catalog: (catalog has ^7.8.0, inline use has 7.8.0)
WARN DEPS-NPM-CATALOG packages/plugin-workers-core/deno.json:34 packages/plugin-workers-core uses npm:@orpc/contract@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/plugin-workers-core/deno.json:35 packages/plugin-workers-core uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts:1 packages/plugin-workers-core uses npm:@opentelemetry/api@^1.9.1 outside package.json catalog: (catalog has ^1.9.1)
WARN DEPS-NPM-CATALOG packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts:2 packages/plugin-workers-core uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/plugin/deno.json:28 packages/plugin uses npm:@orpc/contract@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/plugin/deno.json:29 packages/plugin uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/queue/adapters/amqp.adapter.ts:10 packages/queue uses npm:amqplib@^0.10.3 outside package.json catalog: (catalog has ^2.0.1, inline use has ^0.10.3)
WARN DEPS-NPM-CATALOG packages/queue/adapters/amqp.adapter.ts:11 packages/queue uses npm:amqplib@^0.10.3 outside package.json catalog: (catalog has ^2.0.1, inline use has ^0.10.3)
WARN DEPS-NPM-CATALOG packages/queue/adapters/postgres.adapter.ts:9 packages/queue uses npm:pg@^8.21.0 outside package.json catalog: (catalog has ^8.21.0)
WARN DEPS-NPM-CATALOG packages/sdk/deno.json:31 packages/sdk uses npm:@orpc/client@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/sdk/deno.json:32 packages/sdk uses npm:@orpc/contract@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/sdk/deno.json:33 packages/sdk uses npm:@orpc/openapi@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/sdk/deno.json:34 packages/sdk uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/sdk/deno.json:35 packages/sdk uses npm:@orpc/tanstack-query@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/sdk/deno.json:36 packages/sdk uses npm:@orpc/zod@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/sdk/deno.json:37 packages/sdk uses npm:@tanstack/db@^0.6.8 outside package.json catalog: (catalog has ^0.6.8)
WARN DEPS-NPM-CATALOG packages/sdk/deno.json:38 packages/sdk uses npm:@tanstack/query-core@^5.101.0 outside package.json catalog: (catalog has ^5.101.0)
WARN DEPS-NPM-CATALOG packages/sdk/deno.json:39 packages/sdk uses npm:@tanstack/query-db-collection@^1.2.1 outside package.json catalog: (catalog has ^1.2.1)
WARN DEPS-NPM-CATALOG packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts:1 packages/sdk uses npm:@orpc/client@1.14.6 outside package.json catalog: (catalog has ^1.14.6, inline use has 1.14.6)
WARN DEPS-NPM-CATALOG packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts:2 packages/sdk uses npm:@orpc/tanstack-query@1.14.6 outside package.json catalog: (catalog has ^1.14.6, inline use has 1.14.6)
WARN DEPS-NPM-CATALOG packages/service/deno.json:22 packages/service uses npm:@orpc/server@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/service/deno.json:23 packages/service uses npm:@orpc/openapi@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/service/deno.json:24 packages/service uses npm:@orpc/client@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/service/deno.json:25 packages/service uses npm:@orpc/zod@^1.14.6 outside package.json catalog: (catalog has ^1.14.6)
WARN DEPS-NPM-CATALOG packages/service/tests/hono-tracing_test.ts:2 packages/service uses npm:@opentelemetry/api@^1.9.1 outside package.json catalog: (catalog has ^1.9.1)
WARN DEPS-NPM-CATALOG packages/service/tests/hono-tracing_test.ts:3 packages/service uses npm:@opentelemetry/core@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/service/tests/hono-tracing_test.ts:4 packages/service uses npm:@opentelemetry/context-async-hooks@^2.9.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/service/tests/hono-tracing_test.ts:5 packages/service uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/telemetry/deno.json:28 packages/telemetry uses npm:@opentelemetry/semantic-conventions@1.41.1 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/telemetry/tests/adapters/otel_ai_telemetry_test.ts:2 packages/telemetry uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/telemetry/tests/adapters/otel_ai_telemetry_test.ts:6 packages/telemetry uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/telemetry/tests/hono/otel_middleware_test.ts:4 packages/telemetry uses npm:@opentelemetry/core@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/telemetry/tests/hono/otel_middleware_test.ts:5 packages/telemetry uses npm:@opentelemetry/context-async-hooks@^2.9.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages/telemetry/tests/hono/otel_middleware_test.ts:6 packages/telemetry uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG plugins/workers/jobs/job-tools_test.ts:2 plugins/workers uses npm:@opentelemetry/api@^1.9.1 outside package.json catalog: (catalog has ^1.9.1)
WARN DEPS-NPM-CATALOG plugins/workers/jobs/job-tools_test.ts:3 plugins/workers uses npm:@opentelemetry/context-async-hooks@^2.9.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG plugins/workers/jobs/job-tools_test.ts:4 plugins/workers uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
zod-alignment PASS instances=zod@3.25.76,zod@4.4.3 residual-v3=@ag-ui/core@0.0.52,@olli/kvdex@3.6.7
# Doctrine readiness — plugin-auth-core
  FAIL=0 WARN=2 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  WARN A8/AP-1/F-1: file is 519 lines (cap 500) — split into smaller single-reason files (src/contracts/v1/auth.contract.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — auth-workos
  FAIL=0 WARN=1 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — auth-better-auth
  FAIL=0 WARN=1 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — auth-kv-oauth
  FAIL=0 WARN=1 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — auth
  FAIL=0 WARN=5 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  WARN F-16: directory has 13 immediate children; doctrine cap is 12
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (services/src/main.ts:54)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:23)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:18)
# Doctrine readiness — plugin
  FAIL=0 WARN=3 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  WARN F-16: directory has 17 immediate children; doctrine cap is 12 (src)
  WARN F-16: directory has 15 immediate children; doctrine cap is 12 (src/config/domain)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — workers
  FAIL=0 WARN=9 INFO=2
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  WARN F-16: directory has 19 immediate children; doctrine cap is 12
  WARN F-16: directory has 19 immediate children; doctrine cap is 12 (worker)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (test-api.ts)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (services/src/main.ts:45)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src/cli/official-sample-configuration.ts:409)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (jobs/health-check.ts:246)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:23)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:18)
# Doctrine readiness — sagas
  FAIL=0 WARN=8 INFO=2
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  WARN A8/AP-1/F-1: file is 374 lines (cap 300) — split into smaller single-reason files (services/src/routers/v1-types.ts)
  WARN F-16: directory has 15 immediate children; doctrine cap is 12
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (services/src/main.ts:46)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src/adapter/resources/saga/saga.stub.ts:60)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src/adapter/resources/saga/saga.stub.ts:95)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:23)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:18)
# Doctrine readiness — triggers
  FAIL=0 WARN=13 INFO=2
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  WARN F-16: directory has 18 immediate children; doctrine cap is 12
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src/adapter/resources/scheduled/scheduled.stub.ts:43)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src/adapter/resources/file-watch/file-watch.stub.ts:43)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src/adapter/resources/webhook/webhook.stub.ts:46)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src/adapter/resources/webhook/webhook.stub.ts:109)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (jobs/file-relay.ts:167)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (jobs/staged-cleanup.ts:72)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (jobs/file-import.ts:177)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (generic-webhook.ts:44)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (webhook-validate-data.ts:35)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:23)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:18)
# Doctrine readiness — streams
  FAIL=0 WARN=5 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src/adapter/resources/stream/stream.stub.ts:84)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src/adapter/resources/consumer/consumer.stub.ts:78)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:23)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:18)
# Doctrine readiness — plugin-sagas-core
  FAIL=0 WARN=2 INFO=2
  WARN A8/AP-1/F-1: file is 739 lines (cap 500) — split into smaller single-reason files (src/contracts/v1/sagas.contract.ts)
  WARN F-16: directory has 19 immediate children; doctrine cap is 12 (src)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
# Doctrine readiness — plugin-triggers-core
  FAIL=0 WARN=3 INFO=2
  WARN A8/AP-1/F-1: file is 722 lines (cap 500) — split into smaller single-reason files (src/contracts/v1/triggers.contract.ts)
  WARN F-16: directory has 13 immediate children; doctrine cap is 12 (src/ports)
  WARN F-16: directory has 15 immediate children; doctrine cap is 12 (src/runtime)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
# Doctrine readiness — plugin-workers-core
  FAIL=0 WARN=5 INFO=2
  WARN A8/AP-1/F-1: file is 305 lines (cap 300) — split into smaller single-reason files (src/domain/job-spec.ts)
  WARN A8/AP-1/F-1: file is 426 lines (cap 300) — split into smaller single-reason files (src/domain/task.ts)
  WARN A8/AP-1/F-1: file is 574 lines (cap 500) — split into smaller single-reason files (src/contracts/v1/workers.contract-definition.ts)
  WARN F-16: directory has 18 immediate children; doctrine cap is 12 (src)
  WARN F-16: directory has 15 immediate children; doctrine cap is 12 (src/executor/adapters)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
# Doctrine readiness — plugin-ai-core
  FAIL=0 WARN=1 INFO=0
  WARN A8/AP-1/F-1: file is 310 lines (cap 300) — split into smaller single-reason files (src/contracts/v1/ai.contract-schemas.ts)
# Doctrine readiness — ai
  FAIL=0 WARN=1 INFO=0
  WARN F-16: directory has 13 immediate children; doctrine cap is 12 (src/ports)
# Doctrine readiness — ai
  FAIL=0 WARN=5 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (cli.ts)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src/adapter/resources/chat-route/chat-route.stub.ts:41)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:40)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:25)
Task quality:gate deno task quality:scan && deno task arch:check
Task quality:scan deno run --allow-read .llm/tools/quality/scan-code-quality.ts
Task arch:check deno task deps:check && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/plugin-auth-core && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/auth-workos && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/auth-better-auth && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/auth-kv-oauth && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root plugins/auth && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/plugin && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root plugins/workers && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root plugins/sagas && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root plugins/triggers && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root plugins/streams && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/plugin-sagas-core && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/plugin-triggers-core && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/plugin-workers-core && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/plugin-ai-core && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/ai && deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root plugins/ai
Task deps:check deno run --allow-read .llm/tools/deps/scan-jsr-centralization.ts --fail-on-violation && deno run --allow-read .llm/tools/deps/audit-file-link.ts --fail-on-violation && deno run --allow-read .llm/tools/deps/scan-npm-catalog-compliance.ts && deno task deps:check:zod
Task deps:check:zod deno run --allow-read .llm/tools/deps/check-zod-alignment.ts
````

### Final clean-tree assertion

Command: `git status --porcelain`

Exit code: **0** · elapsed: 0.0s

````text
````
