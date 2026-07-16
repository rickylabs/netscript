# Research — issue #792 workers sample queue trigger

## Re-baseline

- Carried-in source: issue #792, finding 9 from issue #781; the referenced parent run directory is not present on this branch.
- Re-derived against `origin/feat/beta10-integration` at `7d353be2` on 2026-07-16 after fetch/merge reported already up to date.
- GitHub API evidence: #792 requires the sample trigger to become opt-in or scaffold-provided, a worker-options-layer regression, and green `scaffold.runtime`; #781 is the beta.9 Aspire/runtime umbrella and must only be referenced.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `worker-options.ts` defines `ExportNotificationSchema` and `DEFAULT_QUEUE_TRIGGERS` for `export-notifications -> notify-export-complete`. | `plugins/workers/worker/worker-options.ts:216-245` |
| 2 | Every `Worker` prepends that sample trigger even when `WorkerOptions.queueTriggers` is omitted. | `plugins/workers/worker/worker.ts:106` |
| 3 | Scaffolded default workers use generated job definitions and the ordinary `jobs` queue; no scaffold source references the export-notification queue or job id. | `plugins/workers/bin/runtime.ts`; repository search for `export-notifications` and `notify-export-complete` |
| 4 | `WorkerOptions.queueTriggers` already provides the explicit opt-in seam; no new public option or scaffold contract is needed. | `plugins/workers/worker/worker-options.ts:142-143` |
| 5 | No worker-options-layer regression test currently exists. | `plugins/workers/worker/` listing and test search |

## jsr-audit surface scan

- Surface scanned: `plugins/workers/deno.json`, `worker/mod.ts`, and the `./worker` export.
- The planned change removes an unexported sample schema/default and adds no package export, dependency, permission, or slow-type-bearing public declaration.
- Existing scoped doc/publish metadata is unchanged; focused check plus the required package/plugin gates are sufficient for this behavioral slice.

## Open questions

- Resolved: the existing `queueTriggers` option is the opt-in contract.
- Resolved: no scaffold edit is needed because the removed listener is unrelated to the scaffolded health-check/job default; the full runtime smoke will prove no experience regression.
