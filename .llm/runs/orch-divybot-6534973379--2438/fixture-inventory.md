# Temporary config writer inventory

2026-10-30 search: all packages/plugins TypeScript writers mentioning Deno/config paths; focused inspection of subprocess-bearing cases. Prisma config writers do not create Deno import maps. Existing Flow-B warms with explicit --lock/--frozen; desktop copies its frozen reference lock. Generated E2E project lifecycle retains its existing install/probe locks.

| Writer | Disposition |
| --- | --- |
| `packages/cli/e2e/src/adapters/native-desktop/fixture-contract-driver.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/src/adapters/native-desktop/fixture-workspace.ts` | Existing frozen lock / installGeneratedProbe policy; retain |
| `packages/cli/e2e/src/application/gates/scaffold/garnet-coexistence-fixture.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/src/application/gates/scaffold/generated-guarded-service_test.ts` | Existing frozen lock / installGeneratedProbe policy; retain |
| `packages/cli/e2e/src/application/gates/scaffold/guarded-service-isolation_test.ts` | Existing frozen lock / installGeneratedProbe policy; retain |
| `packages/cli/e2e/src/application/gates/scaffold/install-generated-probe_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/src/application/gates/scaffold/local-source-fixture.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/src/application/gates/scaffold/locked-probes_test.ts` | Existing frozen lock / installGeneratedProbe policy; retain |
| `packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts` | Existing frozen lock / installGeneratedProbe policy; retain |
| `packages/cli/e2e/src/application/gates/scaffold/probe-auth-cookie-jar.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/src/application/gates/scaffold/probe-generated-guarded-plugin.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/src/application/gates/scaffold/probe-generated-guarded-service.ts` | Existing frozen lock / installGeneratedProbe policy; retain |
| `packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/credential-fault-fixture.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/dashboard-config_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/tests/application/gates/local-source-fixture_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/e2e/tests/application/gates/scaffold/ui-ai-gates_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/adapters/config/project-config-loader_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/adapters/runtime/file-system/deno-project-stage_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/adapters/service/scaffolder_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/application/resource-slice/render-resource-slice_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/application/resource-slice/selection/query-procedure_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/aspire-compat-health-checks_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/installation-provisioning_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/installation-secret-sdk-compile_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/run-tool-diagnostics-budget_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/run-tool-template_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/templates/database/postgres-normalizer_test.ts` | FIX: shared private committed lock; compile/run/generate frozen |
| `packages/cli/src/kernel/templates/workspace/aspire-cli-task_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/templates/workspace/dependency-closure-verifier_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/templates/workspace/node-modules-verifier_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/kernel/templates/workspace/quality-runner_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/local/features/plugins/install/install-local-plugin_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/maintainer/adapters/packages-copier_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-test-support.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/adapters/agent/deno-agent-docs-generator_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/agent/init/init-agent_test.ts` | Uses repository config/committed lock; retain |
| `packages/cli/src/public/features/generate/aspire/aspire-check-command_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/generate/aspire/aspire-lifecycle-check-command_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/generate/plugins/plugin-check-command_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/generate/routes/generate-routes-command_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/plugins/install/install-plugin-command_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/plugins/install/install-plugin_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/plugins/list/list-plugins-command_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/plugins/new/new-plugin_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/plugins/remove/remove-plugin_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/plugins/update/update-plugin-command_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/services/generate/generated-service-client_type_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/ui/remove/remove-ui-page-command_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/src/public/features/ui/ui-app-root-command_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/tests/authored-browser-topology_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/tests/fixtures/plugin-scaffolder/scaffold.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/tests/support/local-workspace-imports.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/cli/tests/support/local-workspace-imports_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/database/tests/commands-generated-transaction_test.ts` | FIX: shared private committed lock; compile/run/generate frozen |
| `packages/database/tests/commands-postgres_test.ts` | FIX: shared private committed lock; compile/run/generate frozen |
| `packages/database/tests/commands-relay-postgres_test.ts` | FIX: shared private committed lock; compile/run/generate frozen |
| `packages/fresh-ui/tests/registry/markdown-renderer.test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/fresh-ui/tests/token-build.test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/mcp/tests/docs_test.ts` | Uses repository config/committed lock; retain |
| `packages/mcp/tests/project-wiring-doctor-family_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/mcp/tests/stdio_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/plugin-auth-core/src/sdk/bearer-contribution_test.ts` | npm tarball consumer installation intentionally generates npm lock; no flattened workspace import map |
| `packages/plugin-sagas-core/src/stores/prisma-saga-store_integration_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/plugin-sagas-core/tests/fixtures/transition-store/provider-fixture.ts` | FIX: shared private committed lock; compile/run/generate frozen |
| `packages/plugin/src/adapter/scaffold-cli-runner_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/plugin/src/sdk/discovery/manifest-resolver_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `packages/sdk/tests/client-contribution-private-surface_test.ts` | npm tarball consumer installation intentionally generates npm lock; no flattened workspace import map |
| `packages/sdk/tests/readme-doctest_test.ts` | Uses repository config/committed lock; retain |
| `plugins/ai/src/adapter/resources/resources.test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `plugins/sagas/tests/cli/local-runtime-backend_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `plugins/streams/src/adapter/resources/resources.test.ts` | FIX: shared private committed lock; compile/run/generate frozen |
| `plugins/streams/tests/docs/native-event-source-example_test.ts` | FIX: shared private committed lock; compile/run/generate frozen |
| `plugins/triggers/src/adapter/resources/resources.test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `plugins/workers/src/adapter/resources/job/webhook-delivery.test.ts` | Uses repository config/committed lock; retain |
| `plugins/workers/src/adapter/resources/resources.test.ts` | Uses repository config/committed lock; retain |
| `plugins/workers/tests/cli/official-sample-publish_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `plugins/workers/tests/cli/registry-retry-policies_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
| `plugins/workers/tests/cli/runtime-registry-generator_test.ts` | Synthetic configuration, scaffold/CLI assertion, or generated-project lifecycle; no unlocked flattened consumer graph added by this fix |
