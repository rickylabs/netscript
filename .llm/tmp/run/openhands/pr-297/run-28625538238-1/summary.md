# Run Summary — PR #297 Verification (docs/pr-c-workers-sdk)

## Summary

This run performed **read-only verification** of the documentation claims in PR #297 against the
actual source code on branch `docs/pr-c-workers-sdk`. No files were modified or committed in this
session — all changes on the branch were already committed in the single pre-existing commit
`38ea2710`.

The verification confirmed all five documentation claims match shipped reality, Gate 1 (docs-only
diff) and Gate 2 (Deno site build + link check + caveat check) all pass on Linux CI.

## Changes

**None in this run.** The branch already contains one commit (`38ea2710`) modifying two files:

- `docs/site/capabilities/background-jobs.md` (+49 / -7 lines: new "Trigger a job from a typed client"
  section, rewritten "Where jobs come from" callout)
- `docs/site/reference/workers/index.md` (minor additions to the reference route table)

## Validation

### Gate 1 — Docs-only diff: ✅ PASS

```
$ git diff origin/main...HEAD --name-only
docs/site/capabilities/background-jobs.md
docs/site/reference/workers/index.md
```

Only files under `docs/site/` were changed. No source churn, no lock files.

### Gate 2 — Site build and link checks: ✅ PASS

| Check | Exit code | Output |
|---|---|---|
| `deno task build` | 0 | 308 files generated in 6.41 s |
| `deno task check:links` | 0 | 18723 internal links across 131 pages — all resolve |
| `deno task check:caveats` | 0 | No issues on Linux CI |

### Claim verification (per request, with file:line evidence)

| Claim | Source evidence | Verdict |
|---|---|---|
| `triggerJob` route `POST /jobs/{id}/trigger` | `packages/plugin-workers-core/src/contracts/v1/workers.contract-definition.ts:441-442` | ✅ PASS |
| `triggerTask` route `POST /tasks/{id}/trigger` | same file `:476-477` | ✅ PASS |
| `triggerJobOutput` = `{ jobId, triggered }` | same file `:209-212` | ✅ PASS |
| `triggerTaskOutput` = `{ taskId, triggered }` | same file `:258-261` | ✅ PASS |
| `id` optional in schema, resolved from path | `workers.contract-schemas.ts:224` (JobTriggerInput), `:243` (TaskTriggerInput) | ✅ PASS |
| JobTriggerInput includes traceparent/tracestate | same file `:204-218` | ✅ PASS |
| TaskTriggerInput omits traceparent/tracestate | same file `:238-248` | ✅ PASS |
| Fail-loud on missing id (jobs) | `plugins/workers/services/src/routers/jobs.ts:87-100` → calls `validationFailed` | ✅ PASS |
| Fail-loud on missing id (tasks) | `plugins/workers/services/src/routers/tasks.ts:45-57` → calls `validationFailed` | ✅ PASS |
| `VALIDATION_ERROR` is 422 | `packages/contracts/src/domain/errors.ts:76-90` | ✅ PASS |
| `/api/rpc/*` is default typed-client mount | `packages/service/src/builder/service-rpc.ts:41,53-62` | ✅ PASS |
| `createServiceClient` exported from `@netscript/sdk/client` | `packages/sdk/deno.json:9` → `./client` subpath | ✅ PASS |
| `workersContract` re-exported from `plugins/workers/contracts/v1/mod.ts` | `:1-2` re-exports from `@netscript/plugin-workers-core/contracts/v1` | ✅ PASS |
| Registry compiler scans `workers/jobs/*.ts` | `plugins/workers/src/cli/registry-compiler.ts:15-20` (`files.listFiles('workers/jobs', ['.ts'])`) | ✅ PASS |
| Job id keyed by filename (`.ts` stripped) | same file `:74-77` (`toJobId`) | ✅ PASS |
| No `plugins/triggers/jobs` scan in registry-compiler | `grep -rn 'plugins/triggers/jobs'` → exit 1, no matches | ✅ PASS |
| Generated jobs loaded at API service startup | `plugins/workers/services/src/main.ts:51` (`registerGeneratedJobDefinitions`) | ✅ PASS |

### Code sample shape check

The `createServiceClient<typeof workersContract>({ contract, serviceName, routerName })` example in
`background-jobs.md` references:
- `@netscript/sdk/client` — resolves ✅ (deno.json `:9`)
- `@netscript/plugin-workers/contracts` — resolves ✅ (deno.json subpath export)
- `triggerJob({ id, payload, priority?, delay?, correlationId?, traceparent?, tracestate? })` →
  `{ jobId, triggered }` — shape matches source ✅

## Remaining risks

1. **No PR comment was posted.** The workflow is responsible for publishing comments via the
   `pr-comment` output mode; this run did not call any GitHub API. The verification report above is
   the durable deliverable for this run.
2. **`deno task check:caveats` returned exit 0 on this Linux CI run**, diverging from the expected
   exit-2 documented for the Windows path-separator bug. That is the *desired* Linux outcome but
   differs from the task's parenthetical guidance — no action required, just noted.
3. **`rtk` was not available** in this runner environment (command not found). All inspection was
   done with native `git --no-pager`, `grep`, and `sed`; outputs are equivalent.
4. The `createServiceClient` code sample in the docs uses positional options-object form
   `({ contract, serviceName, routerName })`. The `service-client.ts` export at
   `packages/sdk/src/client/service-client.ts:40` was not re-opened for shape inspection of its
   generic/argument signature — if the signature has changed since the prior session wrote the
   example, that sample shape was not re-verified here.
