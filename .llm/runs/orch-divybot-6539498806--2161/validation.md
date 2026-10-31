# Validation evidence

All results below are local and scoped to this change. Raw structured reports and durable receipts remain in the local project run store because they include operational paths. This file records their command identities, coverage and exit codes without those details.

| Gate | Evidence |
| --- | --- |
| Focused registry/selector/generator/doctor suite | run-deno-test.ts; 61 passed, 0 failed, 0 ignored; exit 0 |
| Plugin generated-surface CLI suite | run-deno-test.ts on plugin-check-command_test.ts; 29 passed, no failures/ignores; exit 0 |
| Installed startup reproduction | run-deno-test.ts in the actual installed fixture, using installed-startup-smoke_test.ts; 1 passed, no failures/ignores; exit 0 |
| Type check | run-deno-check.ts, unstable-kv included by wrapper; all 20 changed framework TS files including generated carrier; zero findings; exit 0 |
| Lint | run-deno-lint.ts, explicit style config preserving root rules; all 19 authored TS files; zero findings; exit 0 |
| Format | run-deno-fmt.ts, explicit style config; all 19 authored TS files; zero findings; exit 0 |
| Code quality and doctrine | run-gate.ts quality-gate; PASS, exit 0; inherited warnings only |
| MCP export carrier freshness | repository generator followed by run-gate.ts mcp-export-corpus; PASS, exit 0 |
| New selector API docs | run-gate.ts public-doc-lint on registry-source-selection.ts; PASS, exit 0 |
| Shared package JSR audit | native publish dry-run succeeds, existing sanctioned slow-type allowance; inherited metadata/doc findings described below |

The four plugin README sections and runnable startup specimen were also formatted through the scoped wrapper. No root-wide formatting, cache reload, lock deletion, dependency change, or local full scaffold.runtime suite was performed. deno.lock remains unchanged.

## Acceptance mapping

- Marked trigger and worker factories can coexist with valid definitions: installed integration tests import both generated registries successfully and keep marked factories (including throwing modules) out of generated imports.
- Installing both plugins into the real local-source project with existing factories, generating, and doctor all exit zero. Both production processor startup APIs reach ready with registryReady/dependencyReady true in the isolated startup proof. See installed-proof.md for the exact limits and recipe.
- Doctor names excluded modules on both healthy and stale registries; a byte snapshot verifies read-only behavior.
- Without the directive, generated registry loading fails with the exact invalid trigger/worker source path. Generation itself retains its existing static behavior; it does not import modules to validate their exports.
- Standalone compiler rewrites preserve the same exclusions and selected sources. AI tools/agents and otherwise eligible sagas use the same directive. Worker config referencing an excluded job remains an unmatched-path error in both writers.
- Every fixture keeps at least one valid definition; no empty-saga semantics are changed.

## Inherited broad audit findings

Full packages/plugin doc lint reports 18 private-type-ref findings, all in contract/service/auth sources byte-identical to baseline main. There are no missing symbol docs. The broad JSR audit reports existing missing @module tags in the untouched abstracts/config/testing entrypoints; the touched CLI entrypoint now has its module documentation. No new debt is accepted. These broad gates are reported with their actual failures rather than called clean. The independent slice reviewer confirmed they are outside this diff.

## External gate

The full scaffold.runtime CI verdict is required because this changes generated plugin output. The owner explicitly forbids running it locally and assigns e2e-cli-gate labeling to the coordinator. This local evidence does not certify that CI gate. Only the coordinator merges.
