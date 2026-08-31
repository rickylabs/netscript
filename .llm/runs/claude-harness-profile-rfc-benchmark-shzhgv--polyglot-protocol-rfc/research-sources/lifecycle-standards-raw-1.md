# lifecycle-standards raw extracts — part 1 (systemd sd_notify, gRPC Health Checking)

Aggregator note: faithful extracts only. No analysis, no recommendations.

---

## Source 1 — systemd `sd_notify(3)` (readiness/lifecycle notification protocol)

- URL fetched: https://man7.org/linux/man-pages/man3/sd_notify.3.html
- Also attempted (HTTP 403, not used):
  https://www.freedesktop.org/software/systemd/man/latest/sd_notify.html
- Fetch date: 2026-08-20

### Function surface

```
int sd_notify(int unset_environment, const char *state);
int sd_notifyf(int unset_environment, const char *format, ...);
int sd_pid_notify(pid_t pid, int unset_environment, const char *state);
int sd_pid_notifyf(pid_t pid, int unset_environment, const char *format, ...);
int sd_pid_notify_with_fds(pid_t pid, int unset_environment, const char *state,
                           const int *fds, unsigned n_fds);
int sd_pid_notifyf_with_fds(pid_t pid, int unset_environment,
                            const int *fds, unsigned n_fds,
                            const char *format, ...);
int sd_notify_barrier(int unset_environment, uint64_t timeout_usec);
int sd_pid_notify_barrier(pid_t pid, int unset_environment, uint64_t timeout_usec);
```

- `sd_notify()` "may be called by a service to notify the service manager about
  state changes."
- If `unset_environment` is non-zero, `$NOTIFY_SOCKET` is unset from the
  process environment before the call returns.
- Variants: `sd_notifyf()` is the printf-style formatting variant;
  `sd_pid_notify*()` take an explicit originating PID; `*_with_fds()` variants
  attach a file-descriptor array; `*_barrier()` are the synchronization
  variants.

### Return-value semantics

- Positive return value on success (message was enqueued).
- **`0` is returned when `$NOTIFY_SOCKET` was not set** — i.e. the process is
  not running under a supervisor that requested notifications. Calls are a
  documented no-op in that case.
- Negative errno-style value on error.
- The return value indicates only that the message was enqueued properly, **not**
  that the service manager successfully processed it. (`sd_notify_barrier()`
  exists precisely to synchronize on processing.)

### Message format (the wire shape)

- The payload is "newline-separated variable assignments, similar in style to an
  environment block."
- A trailing newline is implied if omitted.
- The whole payload is transmitted as a **single datagram**.
- Sent to the socket named by `$NOTIFY_SOCKET`.
- The datagram is accompanied by `SCM_CREDENTIALS` carrying the sending
  process's credentials.
- Unknown/unrecognized assignments are safely ignored by the service manager
  (forward compatibility is explicit).
- Maximum file descriptors attachable to one message: 253 (AF_UNIX limit on
  Linux).
- File descriptors sent without `FDSTORE=1` are immediately closed on reception.

### `$NOTIFY_SOCKET` environment contract

- Set by the service manager for supervised processes; absent otherwise.
- If the first character is `/` — an `AF_UNIX` socket in the filesystem
  namespace, at that path.
- If the first character is `@` — an `AF_UNIX` socket in the Linux **abstract**
  namespace.
- If the value starts with `vsock:` — an `AF_VSOCK` address in the form
  `vsock:CID:PORT`.
- Socket type is `SOCK_DGRAM`.
- `sd_notify()` from a service also requires `NotifyAccess=` to be configured
  appropriately in the unit file (otherwise the manager discards the message).

### Well-known state assignment vocabulary

| Variable | Value format | Semantics (as documented) |
|---|---|---|
| `READY=1` | boolean, only `1` is defined | Service startup (or reload) has finished. `READY=0` is undefined. |
| `RELOADING=1` | boolean | Service has begun reloading its configuration. |
| `STOPPING=1` | boolean | Service has begun shutting down. |
| `MONOTONIC_USEC=…` | decimal µs | `CLOCK_MONOTONIC` timestamp of when the notification was generated. |
| `STATUS=…` | UTF-8 single-line string | Free-form human-readable description of current service state. |
| `NOTIFYACCESS=…` | string | Override the unit's `NotifyAccess=` setting at runtime. |
| `ERRNO=…` | decimal integer | errno-style error code, e.g. `ERRNO=2`. |
| `BUSERROR=…` | string | D-Bus error identifier, e.g. `org.freedesktop.DBus.Error.TimedOut`. |
| `VARLINKERROR=…` | string | Varlink error identifier. |
| `EXIT_STATUS=…` | integer | Exit status; informational, not consumed by systemd itself. |
| `MAINPID=…` | PID number | Inform the manager of a new main process ID. |
| `MAINPIDFDID=…` | integer | pidfd inode number of the new main process. |
| `MAINPIDFD=1` | boolean | Reference the new main process via an attached pidfd. |
| `WATCHDOG=1` | boolean | Keep-alive ping; requires `WatchdogSec=` to be enabled. |
| `WATCHDOG=trigger` | literal string | Immediately trigger the configured watchdog action. |
| `WATCHDOG_USEC=…` | decimal µs | Reset the watchdog timeout at runtime. |
| `EXTEND_TIMEOUT_USEC=…` | decimal µs | Extend the timeout for the current state (start/stop/reload). |
| `RESTART_RESET=1` | boolean | Reset the restart counter / `RestartSec=` backoff. |
| `FDSTORE=1` | boolean | Store the attached file descriptors in the manager's fd store. |
| `FDSTOREREMOVE=1` | boolean | Remove stored file descriptors; requires `FDNAME=`. |
| `FDNAME=…` | ASCII string | Name for stored file descriptors. Max 255 chars; no control characters and no `:`. |
| `FDPOLL=0` | boolean | Disable polling of submitted file descriptors. |
| `BARRIER=1` | boolean | Synchronization command. Must be sent **alone**, with no other assignments in the message, and requires exactly one attached file descriptor. |

Notes reproduced from the page:

- "The notification messages sent by services are interpreted by the service
  manager."
- Unknown assignments are ignored, so new keys may be added without breaking
  older managers.

---

## Source 2 — gRPC Health Checking Protocol

- URL fetched: https://raw.githubusercontent.com/grpc/grpc/master/doc/health-checking.md
  (canonical page: https://github.com/grpc/grpc/blob/master/doc/health-checking.md)
- Fetch date: 2026-08-20
- Retrieved verbatim (77 lines); reproduced in full below.

### Verbatim document

> GRPC Health Checking Protocol
> ================================
>
> Health checks are used to probe whether the server is able to handle rpcs. The
> client-to-server health checking can happen from point to point or via some
> control system. A server may choose to reply “unhealthy” because it
> is not ready to take requests, it is shutting down or some other reason.
> The client can act accordingly if the response is not received within some time
> window or the response says unhealthy in it.
>
> A GRPC service is used as the health checking mechanism for both simple
> client-to-server scenario and other control systems such as load-balancing.
> Being a high level service provides some benefits. Firstly, since it is a GRPC
> service itself, doing a health check is in the same format as a normal rpc.
> Secondly, it has rich semantics such as per-service health status. Thirdly, as a
> GRPC service, it is able reuse all the existing billing, quota infrastructure,
> etc, and thus the server has full control over the access of the health checking
> service.
>
> ## Service Definition
>
> The server should export a service defined in the following proto:
>
> ```
> syntax = "proto3";
>
> package grpc.health.v1;
>
> message HealthCheckRequest {
>   string service = 1;
> }
>
> message HealthCheckResponse {
>   enum ServingStatus {
>     UNKNOWN = 0;
>     SERVING = 1;
>     NOT_SERVING = 2;
>     SERVICE_UNKNOWN = 3;  // Used only by the Watch method.
>   }
>   ServingStatus status = 1;
> }
>
> service Health {
>   rpc Check(HealthCheckRequest) returns (HealthCheckResponse);
>
>   rpc Watch(HealthCheckRequest) returns (stream HealthCheckResponse);
> }
> ```
>
> A client can query the server’s health status by calling the `Check` method, and
> a deadline should be set on the rpc. The client can optionally set the service
> name it wants to query for health status.
>
> The server should register all the services manually and set the individual
> status, including an empty service name and its status. For each request
> received, if the service name can be found in the registry, a response must be
> sent back with an `OK` status and the status field should be set to `SERVING` or
> `NOT_SERVING` accordingly. If the service name is not registered, the server
> returns a `NOT_FOUND` GRPC status.
>
> The server should use an empty string as the key for server's overall health
> status, so that a client not interested in a specific service can query the
> server's status with an empty request. The server can just do exact matching of
> the service name without support of any kind of wildcard matching. However, the
> service owner has the freedom to implement more complicated matching semantics
> that both the client and server agree upon.
>
> A client can declare the server as unhealthy if the rpc is not finished after
> some amount of time. The client should be able to handle the case where server
> does not have the Health service.
>
> A client can call the `Watch` method to perform a streaming health-check.
> The server will immediately send back a message indicating the current
> serving status. It will then subsequently send a new message whenever
> the service's serving status changes.

### Condensed inventory (for indexing only, no interpretation added)

- Package: `grpc.health.v1`.
- Messages: `HealthCheckRequest { string service = 1; }`,
  `HealthCheckResponse { ServingStatus status = 1; }`.
- State vocabulary (`ServingStatus`): `UNKNOWN=0`, `SERVING=1`,
  `NOT_SERVING=2`, `SERVICE_UNKNOWN=3` (Watch-only).
- Methods: `Check` (unary), `Watch` (server-streaming).
- gRPC status codes referenced: `OK` (registered service, status in payload),
  `NOT_FOUND` (service name not registered).
- Overall-server health key: the empty string `""`.
- Matching: exact service-name matching; wildcards optional/agreed out-of-band.
- Client obligations: set a deadline; treat timeout as unhealthy; tolerate
  servers that do not implement the Health service at all.
