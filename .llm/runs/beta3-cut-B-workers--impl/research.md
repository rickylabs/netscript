# Research — beta3-cut-B-workers--impl

## Re-baseline

- Carried-in source: issue #376 prompt and coordinator briefing.
- Re-derived against `main` @ `eab02889` on 2026-07-05.
- What changed vs carried-in version:
  - No existing run directory or PR existed for `fix/workers-health-entrypoint-376`.
  - `packages/workers` does not exist in this branch; the affected published surface is `plugins/workers` plus `packages/plugin-workers-core`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `plugins/workers/services/src/init.ts` registers `workers-plugin-health-check` with `source: "plugin"` and `entrypoint: "./plugins/workers/jobs/health-check.ts"`. | `sed -n '1,120p' plugins/workers/services/src/init.ts` |
| 2 | `plugins/workers/worker/job-execution.ts` resolves `source: "plugin"` entrypoints against `NETSCRIPT_PROJECT_ROOT` or cwd, preserving URL/JSR specifiers only after path resolution. | `sed -n '1,130p' plugins/workers/worker/job-execution.ts` |
| 3 | `packages/plugin-workers-core/src/runtime/job-dispatcher.ts` dynamically imports `job.sourceUrl ?? job.entrypoint` when `fallbackToDynamicImport` is enabled. | `sed -n '1,120p' packages/plugin-workers-core/src/runtime/job-dispatcher.ts` |
| 4 | `plugins/workers/deno.json` publishes `jobs/**/*.ts`, so `jobs/health-check.ts` is available from the JSR package. | `sed -n '1,120p' plugins/workers/deno.json` |
| 5 | The scaffold runtime gate currently triggers the health job and lists executions, but does not require a completed execution for the built-in health-check job. | `sed -n '1,140p' packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `plugins/workers/deno.json` exports and publish include list.
- Slow-type / surface risks: no new exported symbol is planned. The existing publish include list already includes `jobs/**/*.ts`, which is necessary for the chosen JSR package module entrypoint.
- JSR landmine check: avoid top-level `import.meta.url` file conversion over remote URLs. The fix uses a literal `jsr:` specifier stored in job metadata and defers import to the runtime dispatcher.

## Open questions

- None blocking. The chosen fix must prove the dynamic dispatcher uses `sourceUrl` and the e2e gate waits for the built-in execution result.
