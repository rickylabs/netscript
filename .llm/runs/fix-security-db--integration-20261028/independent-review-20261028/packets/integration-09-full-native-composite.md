# SAME-session integration full-native-composite part9
HEAD88ae6fcacd36573b2f2f6244f4bebc31e49fc5e5; ordered full-content fragment.

  FAIL=0 WARN=45 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  WARN A5/AP-5/F-4: class ScaffoldError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class ScaffoldDirExistsError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class ScaffoldValidationError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class ScaffoldTemplateError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class ScaffoldGitError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class ConfigNotFoundError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class ConfigInvalidError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class CompileError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class CompileTimeoutError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class ServyNotFoundError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class WindowsRequiredError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class AdminRequiredError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class ServiceExistsError sits 3+ levels deep in inheritance chain — prefer composition
  WARN A1/A2/A7: exports Result/Either/Option-style contract — keep it package-specific, documented, and inline unless multiple real consumers justify a shared contract (src\kernel\domain\core-types.ts)
  WARN A8/AP-1/F-1: file is 527 lines (cap 500) — split into smaller single-reason files (e2e\src\application\gates\scaffold\runtime\behavior-gates.ts)
  WARN A8/AP-1/F-1: file is 612 lines (cap 500) — split into smaller single-reason files (e2e\src\application\gates\scaffold\runtime\listener-unreachable-fixture.ts)
  WARN A8/AP-1/F-1: file is 1176 lines (cap 500) — split into smaller single-reason files (e2e\src\application\gates\scaffold\service-client-browser-probe.ts)
  WARN A8/AP-1/F-1: file is 612 lines (cap 500) — split into smaller single-reason files (e2e\src\application\gates\scaffold\verify-live-db-endpoint.ts)
  WARN A8/AP-1/F-1: file is 592 lines (cap 500) — split into smaller single-reason files (src\kernel\adapters\config\plugin-registry.ts)
  WARN A8/AP-1/F-1: file is 702 lines (cap 500) — split into smaller single-reason files (src\kernel\adapters\plugin\workspace-mutator.ts)
  WARN A8/AP-1/F-1: file is 603 lines (cap 500) — split into smaller single-reason files (src\kernel\templates\aspire\helpers\register\generate-register-infrastructure.ts)
  WARN A8/AP-1/F-1: file is 998 lines (cap 500) — split into smaller single-reason files (src\public\features\plugins\doctor\doctor-plugin-use-case.ts)
  WARN A8/AP-1/F-1: file is 713 lines (cap 500) — split into smaller single-reason files (src\public\features\plugins\install\install-plugin.ts)
  WARN A8/AP-1/F-1: file is 842 lines (cap 500) — split into smaller single-reason files (src\public\features\plugins\new\new-plugin-use-case.ts)
  WARN A8/AP-1/F-1: file is 553 lines (cap 500) — split into smaller single-reason files (src\public\features\root\public-command-dependencies.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (bin\netscript-dev.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (bin\netscript.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (e2e\src\application\gates\scaffold\database-gates.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (e2e\src\application\gates\scaffold\package-backed-plugin-doctor-fixture.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (e2e\src\application\gates\scaffold\probe-generated-guarded-plugin.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (e2e\src\application\gates\scaffold\runtime\behavior-scripts.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (e2e\src\application\gates\scaffold\runtime\evidence\resource-command.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (e2e\src\application\gates\scaffold\ui-ai-gates.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (e2e\src\application\gates\scaffold\verify-saga-publish-process.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (e2e\suites\quickstart\quickstart-walk-suite.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (e2e\suites\scaffold\true-userland-install-suite.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (src\kernel\adapters\config\plugin-manifest\configured-plugin-manifest-probe-child.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (src\kernel\assets\agent-tools.generated.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (src\kernel\assets\embedded.generated.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (src\kernel\templates\workspace\aspire-cli-task.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (src\kernel\templates\workspace\quality-runner.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (src\public\features\plugins\new\new-plugin-use-case.ts)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (e2e\src\application\gates\scaffold\prepare-flow-b-fixture.ts:240)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\kernel\adapters\database\scaffolder.ts:44)
# Doctrine readiness — config
  FAIL=0 WARN=1 INFO=1
  WARN A8/AP-1/F-1: file is 635 lines (cap 300) — split into smaller single-reason files (src\domain\config-section-types.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — contracts
  FAIL=0 WARN=2 INFO=1
  WARN A1/A2/A7: exports Result/Either/Option-style contract — keep it package-specific, documented, and inline unless multiple real consumers justify a shared contract (src\domain\result.ts)
  WARN A8/AP-1/F-1: file is 510 lines (cap 500) — split into smaller single-reason files (crud\create-crud-contract.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — cron
  FAIL=0 WARN=1 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — database
  FAIL=0 WARN=7 INFO=1
  WARN A8/AP-1/F-1: file is 537 lines (cap 500) — split into smaller single-reason files (adapters\mssql.adapter.ts)
  WARN A8/AP-1/F-1: file is 501 lines (cap 500) — split into smaller single-reason files (adapters\mysql.adapter.ts)
  WARN A8/AP-1/F-1: file is 642 lines (cap 500) — split into smaller single-reason files (extensions\sql-json.extension.ts)
  WARN A8/AP-1/F-1: file is 555 lines (cap 500) — split into smaller single-reason files (scripts\fix-zod-imports.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (scripts\generate-zod.ts)
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (scripts\migrate.ts)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (extensions\sql-json.extension.ts:641)
# Doctrine readiness — fresh
  FAIL=0 WARN=21 INFO=1
  WARN A8/AP-1/F-1: file is 494 lines (cap 300) — split into smaller single-reason files (src\application\builders\define-page\types.ts)
  WARN A8/AP-1/F-1: file is 363 lines (cap 300) — split into smaller single-reason files (src\application\form\_internal\prop-types.ts)
  WARN A8/AP-1/F-1: file is 604 lines (cap 500) — split into smaller single-reason files (src\application\route\manifest.ts)
  WARN A8/AP-1/F-1: file is 418 lines (cap 300) — split into smaller single-reason files (src\application\route\types.ts)
  WARN A8/AP-1/F-1: file is 657 lines (cap 500) — split into smaller single-reason files (src\runtime\ai\create-chat-connection.ts)
  WARN A8/AP-1/F-1: file is 501 lines (cap 500) — split into smaller single-reason files (src\runtime\navigation\coordinator.ts)
  WARN A8/AP-1/F-1: file is 790 lines (cap 500) — split into smaller single-reason files (tests\form-navigation_browser.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\db-collection-browser\main.ts:42)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\db-collection-browser\vite.config.ts:37)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\defer-client-navigation-browser\vite.config.ts:41)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\defer-island-client\main.ts:5)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\defer-island-client\vite.config.ts:17)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\form-navigation-browser\vite.config.ts:9)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\fresh-ui-modal-browser\main.ts:31)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\fresh-ui-modal-browser\vite.config.ts:24)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\partial-navigation-browser\vite.config.ts:9)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\query-hydration-age-browser\main.ts:20)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\query-hydration-age-browser\vite.config.ts:35)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\route-binding-browser\vite.config.ts:38)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\route-purity-browser\main.ts:84)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\route-purity-browser\vite.config.ts:37)
# Doctrine readiness — fresh-ui
  FAIL=0 WARN=2 INFO=1
  WARN A8/AP-1/F-1: file is 1512 lines (cap 500) — split into smaller single-reason files (registry.manifest.ts)
  WARN A8/AP-1/F-1: file is 669 lines (cap 500) — split into smaller single-reason files (src\chat\parse-blocks.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — kv
  FAIL=0 WARN=4 INFO=1
  WARN A8/AP-1/F-1: file is 625 lines (cap 500) — split into smaller single-reason files (adapters\deno-kv.adapter.ts)
  WARN A8/AP-1/F-1: file is 702 lines (cap 500) — split into smaller single-reason files (adapters\denokv-bridge.ts)
  WARN A8/AP-1/F-1: file is 636 lines (cap 500) — split into smaller single-reason files (adapters\memory.adapter.ts)
  WARN A8/AP-1/F-1: file is 929 lines (cap 500) — split into smaller single-reason files (adapters\redis.adapter.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — logger
  FAIL=0 WARN=1 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — mcp
  FAIL=0 WARN=4 INFO=1
  WARN A8/AP-1/F-1: file is 608 lines (cap 500) — split into smaller single-reason files (src\infrastructure\export-surfaces\export-surface-corpus.generated.ts)
  WARN A8/AP-1/F-1: file is 503 lines (cap 500) — split into smaller single-reason files (src\infrastructure\filesystem-docs-corpus.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\doctor\broken\netscript.config.ts:2)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (tests\fixtures\doctor\healthy\netscript.config.ts:4)
# Doctrine readiness — plugin
  FAIL=0 WARN=1 INFO=1
  WARN A5/AP-5/F-4: class PluginCompositionError sits 3+ levels deep in inheritance chain — prefer composition
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — plugin-ai-core
  FAIL=0 WARN=1 INFO=0
  WARN A8/AP-1/F-1: file is 310 lines (cap 300) — split into smaller single-reason files (src\contracts\v1\ai.contract-schemas.ts)
# Doctrine readiness — plugin-auth-core
  FAIL=0 WARN=0 INFO=1
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — plugin-sagas-core
  FAIL=0 WARN=3 INFO=2
  WARN A8/AP-1/F-1: file is 508 lines (cap 500) — split into smaller single-reason files (src\adapters\saga-bus-bridge.ts)
  WARN A8/AP-1/F-1: file is 741 lines (cap 500) — split into smaller single-reason files (src\contracts\v1\sagas.contract.ts)
  WARN A8/AP-1/F-1: file is 788 lines (cap 500) — split into smaller single-reason files (src\runtime\saga-engine.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
# Doctrine readiness — plugin-streams-core
  FAIL=0 WARN=1 INFO=1
  WARN A8/AP-1/F-1: file is 520 lines (cap 500) — split into smaller single-reason files (src\application\durable-stream-producer-supervisor.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — plugin-triggers-core
  FAIL=0 WARN=1 INFO=2
  WARN A8/AP-1/F-1: file is 722 lines (cap 500) — split into smaller single-reason files (src\contracts\v1\triggers.contract.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
# Doctrine readiness — plugin-workers-core
  FAIL=0 WARN=3 INFO=2
  WARN A8/AP-1/F-1: file is 611 lines (cap 500) — split into smaller single-reason files (src\contracts\v1\workers.contract-definition.ts)
  WARN A8/AP-1/F-1: file is 547 lines (cap 500) — split into smaller single-reason files (src\public\root.ts)
  WARN A8/AP-1/F-1: file is 319 lines (cap 300) — split into smaller single-reason files (src\runtime\runtime-types.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
# Doctrine readiness — prisma-adapter-mysql
  FAIL=0 WARN=2 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  WARN A8/AP-1/F-1: file is 816 lines (cap 500) — split into smaller single-reason files (src\adapter.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — queue
  FAIL=0 WARN=2 INFO=1
  WARN A8/AP-1/F-1: file is 812 lines (cap 500) — split into smaller single-reason files (adapters\kv-polling.adapter.ts)
  WARN A8/AP-1/F-1: file is 582 lines (cap 500) — split into smaller single-reason files (adapters\postgres.adapter.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — runtime-config
  FAIL=0 WARN=1 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — sdk
  FAIL=0 WARN=0 INFO=1
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — service
  FAIL=0 WARN=5 INFO=1
  WARN A5/AP-5/F-4: class Gq sits 3+ levels deep in inheritance chain — prefer composition
  WARN A5/AP-5/F-4: class dW sits 3+ levels deep in inheritance chain — prefer composition
  WARN A8/AP-1/F-1: file is 630 lines (cap 500) — split into smaller single-reason files (src\builder\service-builder-impl.ts)
  WARN A8/AP-1/F-1: file is 336 lines (cap 300) — split into smaller single-reason files (src\types.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (tests\_fixtures\legacy-abort-service.ts)
# Doctrine readiness — telemetry
  FAIL=0 WARN=3 INFO=1
  WARN A8/AP-1/F-1: file is 555 lines (cap 500) — split into smaller single-reason files (src\instrumentation\scheduler.ts)
  WARN A8/AP-1/F-1: file is 685 lines (cap 500) — split into smaller single-reason files (src\instrumentation\worker.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (src\adapters\otel\otel-sdk.ts)
# Doctrine readiness — watchers
  FAIL=0 WARN=1 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
# Doctrine readiness — ai
  FAIL=0 WARN=5 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (cli.ts)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:25)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:40)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\adapter\resources\chat-route\chat-route.stub.ts:41)
# Doctrine readiness — auth
  FAIL=0 WARN=3 INFO=1
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:18)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:23)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (services\src\main.ts:33)
# Doctrine readiness — sagas
  FAIL=0 WARN=7 INFO=2
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  WARN A8/AP-1/F-1: file is 374 lines (cap 300) — split into smaller single-reason files (services\src\routers\v1-types.ts)
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:18)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:23)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (services\src\main.ts:46)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\adapter\resources\saga\saga.stub.ts:60)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\adapter\resources\saga\saga.stub.ts:95)
# Doctrine readiness — streams
  FAIL=0 WARN=5 INFO=1
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:18)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:23)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\adapter\resources\consumer\consumer.stub.ts:78)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\adapter\resources\stream\stream.stub.ts:84)
# Doctrine readiness — triggers
  FAIL=0 WARN=12 INFO=2
  WARN A3: README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:18)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (generic-webhook.ts:40)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (jobs\file-import.ts:187)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (jobs\file-relay.ts:189)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (jobs\staged-cleanup.ts:78)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:23)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\adapter\resources\file-watch\file-watch.stub.ts:43)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\adapter\resources\scheduled\scheduled.stub.ts:43)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\adapter\resources\webhook\webhook.stub.ts:46)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\adapter\resources\webhook\webhook.stub.ts:109)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (webhook-validate-data.ts:35)
# Doctrine readiness — workers
  FAIL=0 WARN=8 INFO=2
  INFO A9: docs/architecture.md missing — required when public symbols > 25
  INFO A12: package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
  WARN A13: Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (test-api.ts)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (cli.ts:18)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (jobs\health-check.ts:286)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (scaffold.ts:23)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (services\src\main.ts:45)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\adapter\resources\job\job.stub.ts:33)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\adapter\resources\job\webhook-delivery.stub.ts:234)
  WARN F-5/F-6: `export default` — JSR penalises (no auto-doc); use named exports (src\cli\official-sample-configuration.ts:416)


### Decoded string block2; long lines partitioned without omitted characters
Task arch:check deno task deps:check && deno run --allow-read --allow-run .llm/tools/fitness/check-doctrine.ts --all-roots
