# V1–V7 runtime and lifecycle evidence

All paths below are rooted in the assigned worktree. Dashboard bearer tokens are omitted. The
generated project is disposable and ignored; no generator source was edited.

## Starts and readiness

| Action     | Exact command                                                                                                                   | Completion / exit                      | Observation                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start 1    | `ASPIRE_CLI_START_TIMEOUT=300 aspire start --isolated --non-interactive --nologo --format Json` from the generated project root | `2026-08-29T22:36:11.028Z`, 0, 38.62 s | Dashboard `https://localhost:42963`; AppHost PID 984155; CLI PID 984080; `sdkVersion` 13.5.3.                                                                     |
| Web wait   | `aspire wait aspire-13-5-postgres-web --timeout 60 --apphost <exact>`                                                           | `2026-08-29T22:37:26Z`, 17, 62.92 s    | Web remained unhealthy because the pristine scaffold had not generated `database/postgres/schema/.generated/zod/crud.ts`; the browser-log child was `NotStarted`. |
| Force stop | `aspire stop --force --apphost <exact> --non-interactive --nologo`                                                              | `2026-08-29T22:40:56.429Z`, 0, 4.42 s  | Persistent resources were explicitly cleaned; `aspire ps` and Docker were empty immediately afterward.                                                            |
| Start 2    | same isolated start command                                                                                                     | `2026-08-29T22:41:49.989Z`, 0, 24.80 s | Dashboard `https://localhost:42501`; AppHost PID 996807; CLI PID 996784; `sdkVersion` 13.5.3.                                                                     |

Raw output: `02-aspire-start-{1,2}.json`, `02-wait-web.raw.txt`,
`02-browser-child-console-logs.json`, `02-users-console-logs.json`, `02-web-console-logs.json`, and
`02-v7-aspire-stop-force.raw.txt`.

## Proxyless endpoint gates

The suite does not expose the three helpers as external-running-AppHost gate IDs, so the helpers
were invoked directly against the exact live AppHost, as allowed by V3.

| Helper                                      | Result                                                                                              | Evidence                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `generated-app-endpoint`                    | exit 0; live web candidates were `http://localhost:42479/` and `http://127.0.0.1:42479/` on start 1 | `02-generated-app-endpoint.raw.txt`       |
| `capture-db-endpoint-allocation` (`first`)  | exit 0                                                                                              | `02-capture-db-allocation-first.raw.txt`  |
| `capture-db-endpoint-allocation` (`second`) | exit 0                                                                                              | `02-capture-db-allocation-second.raw.txt` |
| `verify-live-db-endpoint`                   | exit 1: both isolated starts reused `postgres://localhost:14428`                                    | `02-verify-live-db-endpoint.raw.txt`      |

Manual `aspire describe --format Json` comparison on start 2 showed the executable web resource
published `http://localhost:42095` while its process `environment.PORT` was `42837`. Container
endpoints remained fixed internally: Postgres published host port 14428 to target 5432 and Redis
published host port 43715 to target 6379. `ASPIRE_PROXYLESS_ENDPOINT_PORT_RANGE` was unset
(`printenv` exit 1). Raw evidence is in `02-aspire-describe-2.json` and
`02-v3-proxyless-env.raw.txt`.

## Detached telemetry

| Command                                                                        | Completion / exit                  | Result                                                  |
| ------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------- |
| `aspire otel logs --format Json -n 10`                                         | `2026-08-29T22:40:08Z`, 12, 0.34 s | Detached discovery failed with `dashboard unavailable`. |
| `aspire otel logs --dashboard-url https://localhost:42963 --format Json -n 10` | `2026-08-29T22:40:09Z`, 0, 0.62 s  | Explicit URL succeeded and returned structured logs.    |

Raw output is `02-v4-otel-bare.raw.txt`, `02-v4-otel-explicit.json`, and
`02-v4-otel-explicit.time.txt`.

## Orphan cleanup

Before mutation, the exact AppHost path resolved to exactly one live entry: CLI PID 996784 and
AppHost PID 996807. `ps` confirmed PID 996784 was the detached Aspire launcher for that exact
AppHost. No `aspire agent mcp` process remained. At `2026-08-29T22:52:11+00:00`, only PID 996784
received `SIGTERM`.

| Command                                                    | Completion / exit                      | Result                                                                            |
| ---------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| `aspire ps --format Json --non-interactive --nologo`       | `2026-08-29T22:52:12+00:00`, 0, 385 ms | `[]`; orphan registration auto-cleaned immediately, not in the prior ~20 s range. |
| `aspire stop --apphost <exact> --non-interactive --nologo` | `2026-08-29T22:52:23+00:00`, 0, 374 ms | Correctly reported no currently running AppHost.                                  |

The non-force orphan path left one running persistent Postgres container. Its only mount source is
the exact generated project `.data/postgres` directory. It is intentionally deferred to the
repository ownership reporter and scoped teardown rather than being removed ad hoc. Evidence:
`02-v6-*`.
