# Drift

## Verification topology

The initial Deno KV scaffold setting used `Mode: Local`. That mode is explicitly in-process and
therefore cannot compose the separately hosted saga API and runner: publish returned 200 but the
runner saw no delivery. This was not a framework-code drift or accepted result. The scaffold was
regenerated with the supported `DenoKv / Container` topology, which injected one shared
`DENO_KV_URL` and passed the entire protocol.

## Environment recovery

Interrupted CLI DB sessions left slice-owned NuGet helpers holding Aspire restore locks. Their exact
PIDs and full command lines were validated against the two owned scaffold roots before termination;
the Aspire MCP process and foreign wave5 resources were untouched. A clean AppHost start then
completed. One intermediate persistent Postgres container lacked a host-port mapping; the captured
diagnostic is retained under `evidence/denokv/endpoint-churn-*`, and protocol evidence comes only
from the subsequent clean container with a populated `tcp://localhost:45033` endpoint.
