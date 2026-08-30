# Phase-B runtime probe receipt

- Date: 2026-08-30
- Aspire CLI: `13.5.3+b5f143315ffb6968ea939a9978797a5b20e4c688`
- Aspire SDK/hosting train: 13.5.3 (`Aspire.Hosting.Browsers` `13.5.3-preview.1.26425.3`)
- Lease: serialized S3 phase-B host-runtime lease; one isolated AppHost; no retry
- AppHost identity: registered exactly in `../run-resources.json`
- Dashboard URL/token: `[REDACTED]`; no token or dashboard coordinate is committed
- Outcome: capture blocked by remote-dind bind-mount topology; no envelope was captured, copied,
  fabricated, or edited

## Restore

```text
⚙️ Restoring SDK code...
✅ SDK code restored successfully for apphost.mts.
```

The restored NuGet assets identify `Aspire.Hosting`, `Aspire.Hosting.PostgreSQL`,
`Aspire.Hosting.Redis`, `Aspire.Hosting.CodeGeneration.TypeScript`, and `Aspire.TypeSystem` as
13.5.3, with Browsers on the locked 13.5.3 preview.

## Single isolated start

The first and only start exited 0 and reported the AppHost running in the background. Its dashboard
coordinate is intentionally redacted here:

```text
Starting Aspire AppHost in the background...

     AppHost:  apphost.mts

   Dashboard:  [REDACTED]

        Logs:  /home/agent/projects/netscript/.aspire/logs/cli_20260830T093407149_detach-child_e0f372f97f5748f6891c780df53c1c6a.log

         PID:  326833

✅ AppHost started successfully.
```

`aspire ps` then identified one running SDK 13.5.3 AppHost. The exact path/PID/start-time identity
was registered through `.llm/tools/agentic/teardown/run-resources.ts` before resource inspection.

## Failed resource state

`aspire describe` reported:

```text
aspire-s3-phase-b-db  PostgresDatabaseResource  FailedToStart
postgres              Container                 FailedToStart
redis                 Container                 FailedToStart
users                 Executable                Waiting
workers               Executable                Waiting
workers-api           Executable                Waiting
```

### PostgreSQL error — verbatim

```text
Getting logs...
[postgres] Error response from daemon: invalid mount config for type "bind": bind source path does not exist:
/home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b/.data/postgres
[postgres] Error response from daemon: invalid mount config for type "bind": bind source path does not exist:
/home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b/.data/postgres
[postgres] Error response from daemon: invalid mount config for type "bind": bind source path does not exist:
/home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b/.data/postgres
[postgres] [sys] Could not create the container: ContainerName = postgres-8635a3b7:
[sys] docker command 'InspectContainers' returned with non-zero exit code 1
[sys] object not found
[sys] container not found
[sys] Error response from daemon: No such container: postgres-8635a3b7
[sys] not all requested objects were returned
[sys] only 0 out of 1 containers were successfully inspected
[sys] docker command 'CreateContainer' returned with non-zero exit code 1
[sys] error
[sys] Error response from daemon: invalid mount config for type "bind": bind source path does not exist:
/home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b/.data/postgres
```

### Redis error — verbatim

```text
Getting logs...
[redis] Error response from daemon: invalid mount config for type "bind": bind source path does not exist:
/home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b/.data/redis
[redis] Error response from daemon: invalid mount config for type "bind": bind source path does not exist:
/home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b/.data/redis
[redis] Error response from daemon: invalid mount config for type "bind": bind source path does not exist:
/home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b/.data/redis
[redis] [sys] Could not create the container: ContainerName = redis-xhnbqzck:
[sys] docker command 'InspectContainers' returned with non-zero exit code 1
[sys] object not found
[sys] container not found
[sys] Error response from daemon: No such container: redis-xhnbqzck
[sys] not all requested objects were returned
[sys] only 0 out of 1 containers were successfully inspected
[sys] docker command 'CreateContainer' returned with non-zero exit code 1
[sys] error
[sys] Error response from daemon: invalid mount config for type "bind": bind source path does not exist:
/home/agent/projects/netscript/worktrees/007-aspire-s3/.llm/tmp/aspire-s3-phase-b/.data/redis
```

The Docker daemon runs on a different host and cannot see bind sources rooted in this worktree. Per
the supervisor stop rule, no workaround and no retry were attempted. Because the required
PostgreSQL/Redis resources failed, `workers-api` never became reachable; the `health-check` job and
dashboard telemetry endpoints were not triggered or captured.

## Exact AppHost stop

```text
Scanning for running AppHosts...
📦 Found running AppHost: .llm/tmp/aspire-s3-phase-b/aspire/apphost.mts
🛑 Sending stop signal to .llm/tmp/aspire-s3-phase-b/aspire/apphost.mts...
Stopping .llm/tmp/aspire-s3-phase-b/aspire/apphost.mts...

✅ .llm/tmp/aspire-s3-phase-b/aspire/apphost.mts stopped successfully.
```

## Leak check

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-08-30T09:35:54.342Z",
  "worktreeRoot": "/home/agent/projects/netscript/worktrees/007-aspire-s3",
  "probes": {
    "aspire": {
      "state": "ok"
    },
    "docker": {
      "state": "ok"
    }
  },
  "survivors": []
}
```

## Teardown preview

No `--apply` was run because the preview found nothing actionable:

```json
{
  "applied": false,
  "stoppedAppHosts": [],
  "removedContainers": [],
  "escalated": []
}
```

## Final inventories — verbatim

### `aspire ps --format Json --nologo --non-interactive`

```json
[]
```

### `docker ps -a`

```text
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```
