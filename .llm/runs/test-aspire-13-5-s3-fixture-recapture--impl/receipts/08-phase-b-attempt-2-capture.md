# Phase-B attempt-2 capture receipt

- Lease granted: separately serialized attempt-2 host-runtime lease after attempt 1 reached terminal
  cleanup.
- Coordinator preflight: 2026-08-30T09:41:24Z.
- Local preflight head: `2b0d33bdf2234a26877a7a972cb13275f3811174`, equal to origin.
- Aspire CLI: 13.5.3.
- Runtime: Docker 28.5.2 at `netscript-dind` (`10.4.12.19`); inotify instances 1024.
- AppHost limit: one isolated AppHost, one start, no retry; no third attempt authorized.

## Authorized scratch-only correction — verbatim

> when you scaffold the scratch project under .llm/tmp/, omit the optional DataPath for every
> database and cache entry in the generated scratch appsettings.json (Databases[].DataPath and the
> cache DataPath), so the generated AppHost emits no withDataBindMount and the remote DinD needs no
> worktree bind mount (generator condition: generate-register-infrastructure.ts 'if
> (entry.DataPath)'). This is a scratch configuration choice you must record verbatim in the
> receipt — NO product config or code change, NO workaround in packages/, NO second thread.

The correction will be applied only to the ignored attempt-2 scratch `appsettings.json`. Product
configuration, generator source, package code, and the committed AppHost surface remain untouched.

## Preflight — verbatim

```text
[git-head]
2b0d33bdf2234a26877a7a972cb13275f3811174
[remote-head]
2b0d33bdf2234a26877a7a972cb13275f3811174 refs/heads/test/aspire-13-5-s3-fixture-recapture
[git-status]
## test/aspire-13-5-s3-fixture-recapture
[aspire-ps]
[]
[docker-ps-a]
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
[docker-volumes]
DRIVER    VOLUME NAME
[exact-processes]
[inotify]
1024
```

## Capture

BLOCKED. No telemetry envelopes were captured and no fixture was fabricated or copied forward.

The scratch AppHost was restored with SDK 13.5.3 and started exactly once. The registry identity was:

```text
appHostPath=/home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b-attempt-2/aspire/apphost.mts
appHostPid=383334
appHostStartedAt=26619412
dashboardUrl=<redacted-dashboard-url>
```

The scratch-only correction was effective: the regenerated `appsettings.json` and
`aspire/.helpers/register-infrastructure.mts` contained no `DataPath`, `withDataBindMount`,
`.data/postgres`, or `.data/redis` occurrence.

The single start succeeded, but its endpoint/proxy probe proved the remaining remote-DinD topology
incompatible with this capture. Aspire reported the PostgreSQL container endpoint as
`tcp://localhost:17858`; its AppHost health check failed against that same address with the exact
description and exception below:

```text
"description": "Failed to connect to 127.0.0.1:17858",
"exceptionMessage": "Npgsql.NpgsqlException (0x80004005): Failed to connect to 127.0.0.1:17858\n ---> System.Net.Sockets.SocketException (111): Connection refused"
```

The bounded `aspire wait` and independent endpoint evidence were:

```text
[aspire-wait-postgres]
Scanning for running AppHosts...
Waiting for resource 'postgres-5133183a' to be healthy...
❌ Timed out waiting for resource 'postgres-5133183a' to be healthy after 10s.

[docker-ps-a]
d967c60c86b9 postgres-5133183a Up 33 seconds 127.0.0.1:17858->5432/tcp
d72db6f7f6ee redis-wkwqntzx Up 34 seconds 127.0.0.1:32770->6379/tcp
a88f1077fc88 garnet-yjqyxttm Up 56 seconds 127.0.0.1:32769->6379/tcp
[local-endpoint-probe]
ConnectionRefused: Connection refused (os error 111)
```

The remote Docker daemon bound the published port to its own loopback while the AppHost and its
health checks ran in this different container. Database-dependent resources therefore remained
waiting. Per the attempt-2 lease, this topology-specific endpoint failure is terminal: no retry,
third attempt, Docker change, endpoint workaround, product change, health-job trigger, or dashboard
envelope request was performed.

## Teardown

The exact registered AppHost path was stopped successfully. The first leak check found only the
attempt's persistent PostgreSQL container; because the scratch correction intentionally removed
bind-mount path evidence, it was initially classified `unproven`. Its ID, creator identity, and
creation timestamp were observed directly during the single AppHost run and followed a zero-state
lease preflight, so that exact identity was registered. The second leak check classified only that
container as `owned`.

Teardown preview was non-mutating with no escalation. `--apply` removed only:

```text
d967c60c86b96a6a83c1eb455e0f436e06390e31725dddb11f8f916c2aaf1c8f
```

One anonymous Docker volume remained. Preflight had zero volumes, and its creation time
`2026-08-30T09:45:53Z` exactly matched the owned PostgreSQL container's creation second. That
positively proven attempt-owned volume
`c22037a09c17b1fbe5fb0c7611d9e2b3ba9a53928c5079211a88724f642d4cc0` was removed explicitly.
The attempt-2 scratch directory was then removed.

Final proof — verbatim:

```text
{
  "schemaVersion": 1,
  "generatedAt": "2026-08-30T09:47:52.840Z",
  "worktreeRoot": "/home/agent/projects/netscript/worktrees/007-aspire-s3",
  "probes": {
    "aspire": { "state": "ok" },
    "docker": { "state": "ok" }
  },
  "survivors": []
}
[scratch]
removed /home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b-attempt-2
[final-aspire-ps]
[]
[final-docker-ps-a]
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
[final-docker-volumes]
DRIVER    VOLUME NAME
```
