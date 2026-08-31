# Phase-B attempt-3 capture receipt

- Owner token: `s3-attempt-3`.
- Lease: separately serialized attempt-3 host-runtime lease; exactly one AppHost start, no retry.
- Head: `85bd496737586da125c17e908f5ec0c0ce2cb4ff`.
- Runtime: Aspire CLI 13.5.3; Docker 28.5.2 at `netscript-dind` (`10.4.12.22`).
- Supervisor relay: `relay-*` containers and `loopback-relay.ts` processes are foreign,
  supervisor-owned resources. They are excluded from owned cleanup and leak classification.

## Preflight — verbatim

```text
[owner-token]
s3-attempt-3
[head]
85bd496737586da125c17e908f5ec0c0ce2cb4ff
[aspire-doctor]
Summary: 5 passed, 3 warnings, 0 failed
[aspire-ps]
[]
[docker-ps-a]
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
[docker-volumes]
DRIVER    VOLUME NAME
```

## Capture

The ignored scratch retained the scaffold-default PostgreSQL and Redis `DataPath` entries. Its
Aspire train was set scratch-only to SDK/PostgreSQL/Redis 13.5.3 and Browsers
13.5.3-preview.1.26425.3. `deno install` at the project root created `node_modules/zod`; restore
then succeeded for the exact AppHost.

The single authorized start returned this identity:

```text
appHostPath=/home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b-attempt-3/aspire/apphost.mts
appHostPid=3144718
appHostStartedAt=29727710
sdkVersion=13.5.3
dashboardUrl=<redacted-dashboard-url>
```

Required waits and trigger — verbatim:

```text
Waiting for resource 'postgres-2226b6f5' to be healthy...
✅ Resource 'postgres-2226b6f5' is healthy. (0.0s)
Waiting for resource 'workers-zgcvykrn' to be healthy...
✅ Resource 'workers-zgcvykrn' is healthy. (0.0s)
POST http://127.0.0.1:53716/api/v1/workers/jobs/health-check/trigger
{"jobId":"health-check","triggered":true}
```

Raw envelope capture — responses were written byte-for-byte and never hand-edited:

```text
GET <redacted-dashboard-url>/api/telemetry/resources -> aspire-13.5.3-resources.json (560 bytes)
GET <redacted-dashboard-url>/api/telemetry/spans -> aspire-13.5.3-spans.json (18682 bytes)
resources: top-level array, length 4
spans: object keys data,totalCount,returnedCount; totalCount=29; returnedCount=29
resources sha256: 35e1335756dac4447b7cbe5209cea055a7d047de82aee106c38ee5e56f0f23ab
spans sha256: 84c08ade5dd2d129fec803d51ae9dd6bfe2dd2d643c6b422b11c57d42a4242e4
```

The minimal workers-only scaffold accepted the trigger and emitted its root/server/internal/
producer trace. Its worker executable subsequently reported the published workers runtime's missing
`streams` plugin, so the envelope truthfully contains no completed worker-consumer run. No scratch
topology mutation, second start, retry, copied data, or envelope edit was used to alter that result.
The 13.5.3 consumer case asserts those actual envelope semantics while the retained 13.4.6 case
continues to assert its completed consumer run.

### Gates

```text
scoped check: PASS — 404 files, 0 findings
unit tests: PASS — 427/427
compat parity + telemetry fixtures: PASS — 3/3, telemetry row required
quality:scan: PASS — 0 findings, 7 existing allowances
arch:check: PASS — exit 0, existing warnings only
check:mcp-export-corpus: PASS — 35 packages, 270 subpaths, 7623 symbols
scoped lint: PASS — 379 files, 0 findings (desktop-native nested workspace excluded)
scoped fmt: PASS — 386 files, 0 findings
raw excluded lint/fmt: PASS
```

## Foreign / supervisor-owned

The supervisor relay appeared only after the run-owned container ports existed:

```text
02f5374edc35 relay-s3-attempt-3-32778
caa432f3476b relay-s3-attempt-3-32777
dc1237e81b4f relay-s3-attempt-3-10538
```

These containers and the supervisor's `loopback-relay.ts` process were not stopped, removed,
registered as run-owned, or reported as leaks.

## Teardown

The exact AppHost path was stopped. Session Redis/Garnet containers exited without intervention. The
persistent `postgres-2226b6f5` survivor was created after the attempt start, carried the exact
scratch bind source, and was registered as owned. Teardown preview had no escalation; `--apply`
removed only container `5791cb98046b6e094fd3239fd9f36270086d92badd06f392f2a029c3491f7882`. Its
anonymous volume had already disappeared with session cleanup; final volume inventory was zero.

The PostgreSQL bind directory was UID-999-owned. With no host sudo, a named auto-removed cleanup
container mounted only the exact attempt-3 scratch path and deleted its contents; it left no Docker
resource. The empty scratch root was then removed.

Final proof — verbatim:

```text
agentic:leak-check survivors: []
[final-aspire-ps]
[]
[final-docker-ps-a]
02f5374edc35 relay-s3-attempt-3-32778 Up 5 minutes
caa432f3476b relay-s3-attempt-3-32777 Up 5 minutes
dc1237e81b4f relay-s3-attempt-3-10538 Up 5 minutes
[final-docker-volumes]
DRIVER    VOLUME NAME
[scratch]
removed /home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b-attempt-3
```
