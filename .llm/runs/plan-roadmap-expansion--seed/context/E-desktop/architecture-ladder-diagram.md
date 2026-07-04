# Architecture ladder — diagrams

## Option (a) — bundle + spawn all services inside the VFS (unproven, high risk)

```
+-------------------------------------------------------------+
|                    desktop binary (1 file)                  |
|  embedded VFS: dashboard UI + eischat + workers + ...        |
|                                                               |
|   [process: dashboard UI] --spawn-->  [process: eischat]     |
|          |                                   |                |
|          |                            opens tursodb file      |
|          |                            (data/channels/*.db)   |
|          `--spawn-->  [process: worker N]  ---X--> tries to  |
|                                                open same file |
|                                                => OS error 33 |
+-------------------------------------------------------------+
```

Blocking risks: (1) tursodb native driver behavior when loaded from self-extracting VFS — untested;
(2) even if (1) clears, multiple spawned processes still contend for one db file unless collapsed
into a single process (i.e., unless it becomes option (c)).

## Option (b) — dashboard-only desktop + external services (ADOPTED, shipped)

```
+---------------------------+        127.0.0.1 HTTP        +---------------------------+
|   desktop binary           |  <------------------------> |   eischat process          |
|   (deno desktop, 1 proc)   |                              |   (separately launched)   |
|   dashboard UI only         |                              |   owns tursodb file        |
+---------------------------+                              +---------------------------+
                                                                        |
                                                              +---------------------------+
                                                              |   worker/saga/trigger      |
                                                              |   processes (external)     |
                                                              +---------------------------+
```

Matches `deno desktop`'s documented single-process-per-binary model exactly: the desktop binary is
just another Aspire-registered app talking over loopback HTTP, no different from a browser tab
hitting the dashboard. Aspire service-discovery env-vars (`services__<name>__http__0`) wire it up;
no bound HTTP endpoint on the desktop app itself.

## Option (c) — in-process/embedded subset (plan-stage, not built)

```
+-----------------------------------------------------------------+
|                     desktop binary (1 process)                   |
|                                                                    |
|   [dashboard UI]  --ClientLinkPort (in-process)-->  [ServiceApp]  |
|                                                        (Hono      |
|                                                        .fetch())  |
|                                                           |        |
|                                                     owns tursodb   |
|                                                     file, syncs    |
|                                                     via Turso Sync |
|                                                     when online    |
+-----------------------------------------------------------------+
```

This is the only rung that collapses to a single OS process holding the db file, which is also the
only rung compatible with Turso Sync's "one local writer per device" model.

## The RFC 14 / `ServiceApp` mount seam (already shipped, server side)

```
createService(router, options)
        |
        |  .build()
        v
   ServiceApp  (a Hono instance; NOT listening)
        |                                  \
        | .fetch(request)                   \  serve() ->
        v                                     v
  [in-process caller,                   startServiceListener()
   e.g. desktop UI                       -> real Deno.serve()
   via a NEW ClientLinkPort]              listener (today's only
                                           path — used by every
                                           deployed service)
```

**What's missing (client side only):** a `ClientLinkPort` implementation
(e.g. `createInProcessClientLink(app: ServiceApp)`) that calls `app.fetch(request)` directly instead
of `globalThis.fetch(url)`. `createServiceClient()` would need a mode/transport switch to select it.
Everything left of that arrow already exists and ships today.
