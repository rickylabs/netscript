# Local gate command inventory

All TypeScript verdicts come from the structured wrappers. Source selections are
listed in gate-summary.json. Repeat --file for each path in sourceFiles.

- Check: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --ext ts,tsx --file <source>` (unstable-kv defaults on).
- Lint: `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --ext ts,tsx --config .llm/runs/orch-divybot-6543525844--2384/validation.deno.json --file <source>`.
- Format: `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --ext ts,tsx --config .llm/runs/orch-divybot-6543525844--2384/validation.deno.json --file <source>`.
- Tests: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all <test files>`.

Reporting set (28 passed):

```text
packages/cli/tests/browser-auth-reporting_test.ts
packages/cli/src/kernel/adapters/plugin/browser-auth-reconciler_test.ts
packages/cli/src/public/features/plugins/install/install-plugin-command_test.ts
```

Lifecycle set (67 passed):

```text
packages/cli/src/public/features/plugins/update/update-plugin-command_test.ts
packages/cli/src/public/features/plugins/remove/remove-plugin_test.ts
packages/cli/src/local/features/plugins/install/install-local-plugin_test.ts
packages/cli/src/public/features/services/add/add-service_test.ts
packages/cli/src/public/features/services/remove/remove-service_test.ts
packages/cli/src/public/features/plugins/install/install-plugin_test.ts
```

- Broader quality: `deno task quality:gate`.
- Documentation: `deno task doc:lint --root packages/cli --pretty`.
- JSR: `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/cli --text`.
- Review threads: `deno task check:review-threads -- --repo rickylabs/netscript --pr 2530 --pretty`.

No local scaffold.runtime execution. Required e2e-cli CI verdict is coordinator-owned.
