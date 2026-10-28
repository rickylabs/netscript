# SAME-session integration full-native-composite part8
HEAD88ae6fcacd36573b2f2f6244f4bebc31e49fc5e5; ordered full-content fragment.


## FULL .llm/runs/fix-security-db--integration-20261028/evidence/arch-check.receipt.json
Raw SHA256:4d16a41b6236b2e8d63cd3d61156375fcdf32030ade1c3cf21e14a985bc3cd44; rawBytes:52180
{
  "outcome": "PASS",
  "startedAt": "2026-10-28T04:35:31.978Z",
  "finishedAt": "2026-10-28T04:35:54.387Z",
  "durationMs": 22409,
  "exitCode": 0,
  "stdout": {
    "bytes": 48308,
    "sha256": "050a24342656fc2b41ad63767aca7196364630438d04f63cb425506a706ba47f",
    "tail": "[Decoded string block1; full text follows]",
    "truncated": false
  },
  "stderr": {
    "bytes": 1744,
    "sha256": "bfc2aae5cb02740e4d95f807cb477d1b269c566ec4c2c077f28dbf913f8c0712",
    "tail": "[Decoded string block2; full text follows]",
    "truncated": false
  },
  "gateId": "arch-check",
  "gitHead": "c243d31535027addc034c99e170cb43d2faf475a",
  "args": [
    "task",
    "arch:check"
  ],
  "timeoutMs": 180000,
  "runner": "/root/service_qualification_sol",
  "capture": "Canonical runProcess with1MiB stream tail; full bytes/hash always retained; actual truncation flag authoritative"
}

### Decoded string block1; long lines partitioned without omitted characters
reference-lock PASS locks=3
WARN DEPS-NPM-CATALOG packages\ai\deno.json:31 packages\ai uses npm:@tanstack/ai@0.68.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\ai\deno.json:32 packages\ai uses npm:@tanstack/ai-anthropic@0.21.1 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\ai\deno.json:33 packages\ai uses npm:@tanstack/ai-mcp@0.8.3 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\ai\deno.json:34 packages\ai uses npm:@tanstack/ai-openai@0.29.1 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\bench\deno.json:15 packages\bench uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\cli\deno.json:39 packages\cli uses npm:jsonc-parser@^3.3.1 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\cli\e2e\deno.json:15 packages\cli\e2e uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\cli\e2e\fixtures\desktop-native\src\router.ts:2 packages\cli uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\cli\e2e\fixtures\desktop-native\src\router.ts:2 packages\cli\e2e uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\consume-flow-b-stream.ts:10 packages\cli uses npm:@opentelemetry/api@^1.9.0 outside package.json catalog: (catalog has ^1.9.1, inline use has ^1.9.0)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\consume-flow-b-stream.ts:10 packages\cli\e2e uses npm:@opentelemetry/api@^1.9.0 outside package.json catalog: (catalog has ^1.9.1, inline use has ^1.9.0)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\consume-flow-b-stream.ts:11 packages\cli uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\consume-flow-b-stream.ts:11 packages\cli\e2e uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\guarded-service-reference.ts:7 packages\cli uses npm:@durable-streams/client@0.2.7 outside package.json catalog: (catalog has 0.2.7)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\guarded-service-reference.ts:7 packages\cli\e2e uses npm:@durable-streams/client@0.2.7 outside package.json catalog: (catalog has 0.2.7)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\guarded-service-reference.ts:8 packages\cli uses npm:@durable-streams/state@0.3.2 outside package.json catalog: (catalog has 0.3.2)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\guarded-service-reference.ts:8 packages\cli\e2e uses npm:@durable-streams/state@0.3.2 outside package.json catalog: (catalog has 0.3.2)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\install-generated-probe_test.ts:69 packages\cli uses npm:@orpc/client@1.15.5 outside package.json catalog: (catalog has ^1.15.5, inline use has 1.15.5)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\install-generated-probe_test.ts:69 packages\cli\e2e uses npm:@orpc/client@1.15.5 outside package.json catalog: (catalog has ^1.15.5, inline use has 1.15.5)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\service-client-runtime-probe.ts:4 packages\cli uses npm:@tanstack/query-core@^5.104.1 outside package.json catalog: (catalog has ^5.104.1)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\service-client-runtime-probe.ts:4 packages\cli\e2e uses npm:@tanstack/query-core@^5.104.1 outside package.json catalog: (catalog has ^5.104.1)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\ui-ai-gates.ts:140 packages\cli uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.8.0, inline use has ^6.7.0)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\ui-ai-gates.ts:140 packages\cli\e2e uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.8.0, inline use has ^6.7.0)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\ui-ai-gates.ts:174 packages\cli uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.8.0, inline use has ^6.7.0)
WARN DEPS-NPM-CATALOG packages\cli\e2e\src\application\gates\scaffold\ui-ai-gates.ts:174 packages\cli\e2e uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.8.0, inline use has ^6.7.0)
WARN DEPS-NPM-CATALOG packages\cli\src\kernel\templates\aspire\helpers\tests\installation-provisioning_test.ts:4 packages\cli uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\cli\src\kernel\templates\database\postgres-normalizer_test.ts:116 packages\cli uses npm:@prisma/config@^7.10.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\contracts\deno.json:14 packages\contracts uses npm:@orpc/contract@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\fresh-ui\deno.json:19 packages\fresh-ui uses npm:preact@^10.29.2 outside package.json catalog: (catalog has ^10.29.2)
WARN DEPS-NPM-CATALOG packages\fresh-ui\scripts\build-tokens.ts:1 packages\fresh-ui uses npm:style-dictionary@5.4.4 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\fresh-ui\tests\registry\components\ui\desktop.test.tsx:2 packages\fresh-ui uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.8.0, inline use has ^6.7.0)
WARN DEPS-NPM-CATALOG packages\fresh-ui\tests\registry\islands\desktop-only.test.tsx:3 packages\fresh-ui uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.8.0, inline use has ^6.7.0)
WARN DEPS-NPM-CATALOG packages\fresh-ui\tests\runtime\accordion\accordion-render.test.tsx:2 packages\fresh-ui uses npm:preact-render-to-string@^6.7.0 outside package.json catalog: (catalog has ^6.8.0, inline use has ^6.7.0)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:44 packages\fresh uses npm:preact@^10.29.2 outside package.json catalog: (catalog has ^10.29.2)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:45 packages\fresh uses npm:preact-render-to-string@^6.8.0 outside package.json catalog: (catalog has ^6.8.0)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:47 packages\fresh uses npm:@durable-streams/state@0.3.2 outside package.json catalog: (catalog has 0.3.2)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:48 packages\fresh uses npm:@durable-streams/client@0.2.7 outside package.json catalog: (catalog has 0.2.7)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:49 packages\fresh uses npm:@durable-streams/tanstack-ai-transport@0.0.10 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:55 packages\fresh uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:56 packages\fresh uses npm:@preact/signals@2.11.3 outside package.json catalog: (catalog has 2.11.3)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:57 packages\fresh uses npm:@tanstack/ai@0.68.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:58 packages\fresh uses npm:@tanstack/ai-client@0.39.2 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:59 packages\fresh uses npm:@tanstack/ai-preact@0.20.3 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:60 packages\fresh uses npm:@tanstack/preact-query@^5.104.1 outside package.json catalog: (catalog has ^5.104.1)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:61 packages\fresh uses npm:@tanstack/query-core@^5.104.1 outside package.json catalog: (catalog has ^5.104.1)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:62 packages\fresh uses npm:@tanstack/react-db@0.5.8 outside package.json catalog: (catalog has 0.5.8)
WARN DEPS-NPM-CATALOG packages\fresh\deno.json:63 packages\fresh uses npm:vite@7.2.2 outside package.json catalog: (catalog has 7.2.2)
WARN DEPS-NPM-CATALOG packages\fresh\src\application\vite\vite.test.ts:418 packages\fresh uses npm:/preact@10.29.7/hooks outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\fresh\tests\_fixtures\stream-db-server.ts:2 packages\fresh uses npm:@durable-streams/server@0.3.9 outside package.json catalog: (catalog has 0.3.9)
WARN DEPS-NPM-CATALOG packages\logger\deno.json:20 packages\logger uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\plugin-ai-core\deno.json:11 packages\plugin-ai-core uses npm:@orpc/contract@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\plugin-ai-core\deno.json:12 packages\plugin-ai-core uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\plugin-auth-core\deno.json:21 packages\plugin-auth-core uses npm:@orpc/contract@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\plugin-auth-core\deno.json:22 packages\plugin-auth-core uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\plugin-sagas-core\src\stores\prisma-saga-store_integration_test.ts:2 packages\plugin-sagas-core uses npm:@prisma/adapter-pg@7.10.0 outside package.json catalog: (catalog has ^7.10.0, inline use has 7.10.0)
WARN DEPS-NPM-CATALOG packages\plugin-workers-core\deno.json:36 packages\plugin-workers-core uses npm:@orpc/contract@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\plugin-workers-core\deno.json:37 packages\plugin-workers-core uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\plugin-workers-core\tests\executor\multi-runtime-task-executor_test.ts:1 packages\plugin-workers-core uses npm:@opentelemetry/api@^1.9.1 outside package.json catalog: (catalog has ^1.9.1)
WARN DEPS-NPM-CATALOG packages\plugin-workers-core\tests\executor\multi-runtime-task-executor_test.ts:2 packages\plugin-workers-core uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\plugin-workers-core\tests\streams\workers-streams_test.ts:1 packages\plugin-workers-core uses npm:@opentelemetry/api@^1.9.1 outside package.json catalog: (catalog has ^1.9.1)
WARN DEPS-NPM-CATALOG packages\plugin-workers-core\tests\streams\workers-streams_test.ts:2 packages\plugin-workers-core uses npm:@opentelemetry/context-async-hooks@^2.9.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\plugin-workers-core\tests\streams\workers-streams_test.ts:3 packages\plugin-workers-core uses npm:@opentelemetry/core@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\plugin-workers-core\tests\streams\workers-streams_test.ts:4 packages\plugin-workers-core uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\plugin\deno.json:30 packages\plugin uses npm:@orpc/contract@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\plugin\deno.json:31 packages\plugin uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\queue\adapters\postgres.adapter.ts:9 packages\queue uses npm:pg@^8.23.1 outside package.json catalog: (catalog has ^8.23.1)
WARN DEPS-NPM-CATALOG packages\sdk\deno.json:36 packages\sdk uses npm:@orpc/client@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\sdk\deno.json:37 packages\sdk uses npm:@orpc/contract@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\sdk\deno.json:38 packages\sdk uses npm:@orpc/openapi@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\sdk\deno.json:39 packages\sdk uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\sdk\deno.json:40 packages\sdk uses npm:@orpc/tanstack-query@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\sdk\deno.json:41 packages\sdk uses npm:@orpc/zod@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\sdk\deno.json:42 packages\sdk uses npm:@tanstack/db@0.13.0 outside package.json catalog: (catalog has 0.13.0)
WARN DEPS-NPM-CATALOG packages\sdk\deno.json:43 packages\sdk uses npm:@tanstack/query-core@^5.104.1 outside package.json catalog: (catalog has ^5.104.1)
WARN DEPS-NPM-CATALOG packages\sdk\deno.json:44 packages\sdk uses npm:@tanstack/query-db-collection@1.4.3 outside package.json catalog: (catalog has 1.4.3)
WARN DEPS-NPM-CATALOG packages\sdk\deno.json:45 packages\sdk uses npm:@tanstack/react-db@0.5.8 outside package.json catalog: (catalog has 0.5.8)
WARN DEPS-NPM-CATALOG packages\sdk\deno.json:46 packages\sdk uses npm:react@^19.2.3 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\sdk\tests\cache\cache-telemetry_test.ts:15 packages\sdk uses npm:@opentelemetry/api@^1.9.1 outside package.json catalog: (catalog has ^1.9.1)
WARN DEPS-NPM-CATALOG packages\sdk\tests\cache\cache-telemetry_test.ts:16 packages\sdk uses npm:@opentelemetry/context-async-hooks@^2.9.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\sdk\tests\cache\cache-telemetry_test.ts:17 packages\sdk uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\sdk\tests\client-contribution-observability_test.ts:11 packages\sdk uses npm:@opentelemetry/api@^1.9.1 outside package.json catalog: (catalog has ^1.9.1)
WARN DEPS-NPM-CATALOG packages\sdk\tests\client-contribution-observability_test.ts:12 packages\sdk uses npm:@opentelemetry/context-async-hooks@^2.9.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\sdk\tests\client-contribution-observability_test.ts:13 packages\sdk uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\sdk\tests\client-contribution-observability_test.ts:18 packages\sdk uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\sdk\tests\query-client\service-query-utils-preact_test.ts:3 packages\sdk uses npm:zod@^4.6.5 outside package.json catalog: (catalog has ^4.6.5)
WARN DEPS-NPM-CATALOG packages\sdk\tests\type-fixtures\query-factories-optional-context_type.ts:2 packages\sdk uses npm:zod@^4.6.5 outside package.json catalog: (catalog has ^4.6.5)
WARN DEPS-NPM-CATALOG packages\sdk\tests\type-fixtures\query-factories-required-context_type.ts:2 packages\sdk uses npm:zod@^4.6.5 outside package.json catalog: (catalog has ^4.6.5)
WARN DEPS-NPM-CATALOG packages\sdk\tests\type-fixtures\service-query-utils-preact_type.ts:2 packages\sdk uses npm:zod@^4.6.5 outside package.json catalog: (catalog has ^4.6.5)
WARN DEPS-NPM-CATALOG packages\sdk\tests\type-fixtures\service-query-utils-preact_type.ts:4 packages\sdk uses npm:@tanstack/preact-query@^5.104.1 outside package.json catalog: (catalog has ^5.104.1)
WARN DEPS-NPM-CATALOG packages\sdk\tests\type-fixtures\service-query-utils-upstream_type.ts:1 packages\sdk uses npm:@orpc/client@1.15.5 outside package.json catalog: (catalog has ^1.15.5, inline use has 1.15.5)
WARN DEPS-NPM-CATALOG packages\sdk\tests\type-fixtures\service-query-utils-upstream_type.ts:2 packages\sdk uses npm:@orpc/tanstack-query@1.15.5 outside package.json catalog: (catalog has ^1.15.5, inline use has 1.15.5)
WARN DEPS-NPM-CATALOG packages\service\deno.json:28 packages\service uses npm:@orpc/server@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\service\deno.json:29 packages\service uses npm:@orpc/openapi@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\service\deno.json:30 packages\service uses npm:@orpc/contract@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\service\deno.json:31 packages\service uses npm:@orpc/client@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\service\deno.json:32 packages\service uses npm:@orpc/zod@^1.15.5 outside package.json catalog: (catalog has ^1.15.5)
WARN DEPS-NPM-CATALOG packages\service\deno.json:34 packages\service uses npm:rou3@^0.7.12 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\service\tests\hono-tracing_test.ts:2 packages\service uses npm:@opentelemetry/api@^1.9.1 outside package.json catalog: (catalog has ^1.9.1)
WARN DEPS-NPM-CATALOG packages\service\tests\hono-tracing_test.ts:3 packages\service uses npm:@opentelemetry/core@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\service\tests\hono-tracing_test.ts:4 packages\service uses npm:@opentelemetry/context-async-hooks@^2.9.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\service\tests\hono-tracing_test.ts:5 packages\service uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\telemetry\deno.json:29 packages\telemetry uses npm:@opentelemetry/semantic-conventions@1.43.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\telemetry\tests\adapters\otel_ai_telemetry_test.ts:2 packages\telemetry uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\telemetry\tests\adapters\otel_ai_telemetry_test.ts:6 packages\telemetry uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\telemetry\tests\commands\native-fixture.ts:2 packages\telemetry uses npm:@opentelemetry/context-async-hooks@^2.9.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\telemetry\tests\commands\native-fixture.ts:3 packages\telemetry uses npm:@opentelemetry/core@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\telemetry\tests\commands\native-fixture.ts:4 packages\telemetry uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\telemetry\tests\hono\otel_middleware_test.ts:4 packages\telemetry uses npm:@opentelemetry/core@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\telemetry\tests\hono\otel_middleware_test.ts:5 packages\telemetry uses npm:@opentelemetry/context-async-hooks@^2.9.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG packages\telemetry\tests\hono\otel_middleware_test.ts:6 packages\telemetry uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG plugins\auth\tests\services\better-auth-global-logout-http_test.ts:8 plugins\auth uses npm:better-auth@^1.7.7 outside package.json catalog: (catalog has ^1.7.7)
WARN DEPS-NPM-CATALOG plugins\auth\tests\services\better-auth-global-logout-http_test.ts:9 plugins\auth uses npm:better-auth@^1.7.7/adapters/memory outside package.json catalog: (catalog has ^1.7.7)
WARN DEPS-NPM-CATALOG plugins\auth\tests\services\unsupported-revocation-http_test.ts:4 plugins\auth uses npm:better-auth@^1.7.7 outside package.json catalog: (catalog has ^1.7.7)
WARN DEPS-NPM-CATALOG plugins\auth\tests\services\unsupported-revocation-http_test.ts:5 plugins\auth uses npm:better-auth@^1.7.7/adapters/memory outside package.json catalog: (catalog has ^1.7.7)
WARN DEPS-NPM-CATALOG plugins\workers\jobs\job-tools_test.ts:2 plugins\workers uses npm:@opentelemetry/api@^1.9.1 outside package.json catalog: (catalog has ^1.9.1)
WARN DEPS-NPM-CATALOG plugins\workers\jobs\job-tools_test.ts:3 plugins\workers uses npm:@opentelemetry/context-async-hooks@^2.9.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG plugins\workers\jobs\job-tools_test.ts:4 plugins\workers uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG plugins\workers\tests\runtime\concurrency-telemetry_test.ts:11 plugins\workers uses npm:@opentelemetry/api@^1.9.1 outside package.json catalog: (catalog has ^1.9.1)
WARN DEPS-NPM-CATALOG plugins\workers\tests\runtime\concurrency-telemetry_test.ts:12 plugins\workers uses npm:@opentelemetry/sdk-trace-base@^2.5.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG plugins\workers\worker\job-dispatcher_test.ts:35 plugins\workers uses npm:@opentelemetry/api@^1.9.1 outside package.json catalog: (catalog has ^1.9.1)
WARN DEPS-NPM-CATALOG plugins\workers\worker\job-dispatcher_test.ts:36 plugins\workers uses npm:@opentelemetry/context-async-hooks@^2.9.0 outside package.json catalog: (no root catalog entry exists)
WARN DEPS-NPM-CATALOG plugins\workers\worker\job-dispatcher_test.ts:37 plugins\workers uses npm:@opentelemetry/core@^2.5.0 outside package.json catalog: (no root catalog entry exists)
private-lock-workspace PASS locks=1
zod-alignment PASS instances=zod@3.25.76,zod@4.6.5 residual-v3=@olli/kvdex@3.6.7
db-alignment sdk-fresh identities=@tanstack/db@0.13.0_typescript@7.0.2
db-alignment fresh-only identities=@tanstack/db@0.13.0_typescript@7.0.2
db-alignment PASS
# Doctrine readiness — ai
  FAIL=0 WARN=0 INFO=0
# Doctrine readiness — aspire
  FAIL=0 WARN=1 INFO=1
  WARN A8/AP-1/F-1: file is 926 lines (cap 500) — split into smaller single-reason files (config.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — auth-better-auth
  FAIL=0 WARN=1 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — auth-kv-oauth
  FAIL=0 WARN=1 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — auth-workos
  FAIL=0 WARN=1 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — bench
  FAIL=0 WARN=2 INFO=1
  WARN A3: README has only 0 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (src\presentation\cli.ts)
# Doctrine readiness — cli
