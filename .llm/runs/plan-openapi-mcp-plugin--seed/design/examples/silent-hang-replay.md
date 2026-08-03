# Worked Example 1 — Replaying the wave-four silent hang

> Draft — design document only. This replays the measured incident from #1117/#1064: an agent's
> publish endpoint hung with no error; ~25 minutes of blind `curl` followed. The replay shows the
> same situation with the v1 introspection tools in place. Service names and schemas are
> illustrative of a scaffolded app; every tool behavior shown is specified in
> `../canonical/01-tool-surface.md`–`03`.

## The situation

The agent has scaffolded an app with a `publisher` service, written a contract-backed publish
route, started the AppHost, and now its own frontend call to publish hangs. Wave four's actual
next move was `curl -X POST http://localhost:<guessed>/publish -d '{...}'` — wrong port shape,
wrong path prefix, wrong envelope, each discovered by another timeout.

## The replay, with the tools

**Step 1 — which services, which ports.** (The agent never sees an Aspire port; discovery is
02's manifest lane.)

```
> list_api_services {}
services:
  publisher     running     http://localhost:61432   spec: /api/openapi.json   7 operations
  workers-api   running     http://localhost:61433   spec: /api/openapi.json   5 operations
hint: Use list_service_operations {service} next.
```

One call has already eliminated the two most expensive guesses of the original incident: the
port, and the existence/health of the service (a `configured (not running)` row here would have
ended the debugging in ten seconds — the hang's root cause class).

**Step 2 — what the service actually exposes.**

```
> list_service_operations { service: "publisher" }
publisher — 7 operations (base http://localhost:61432)
  publisher.publish        POST /api/publisher/publish        Publish a document and enqueue distribution.
  publisher.status         GET  /api/publisher/status/{id}    Get distribution status for a publish job.
  publisher.channels.list  GET  /api/publisher/channels       List configured distribution channels.
  ...
```

The path prefix (`/api/...`, from the oRPC `servers: [{url:'/api'}]` default) and the exact
route are now facts, not guesses. Note the identity: `publisher.publish` is the dotted contract
path — the same name the agent sees in its own contract file — because oRPC defaults
`operationId` to it (verified, `openapi.BwdtJjDu.mjs:545`).

**Step 3 — the envelope the wave-four agent was guessing at.**

```
> get_operation_schema { service: "publisher", operation: "publisher.publish", view: "all" }
request (application/json):
  { document: { title: string — "Document title, 1–200 chars",
                body: string,
                channels: ("rss"|"email"|"webhook")[] — "Distribution channels" },
    idempotencyKey?: string — "Client-supplied dedupe key" }
response — Returns: 202
  { jobId: string — "Poll publisher.status with this id", acceptedAt: string (date-time) }
errors (common envelope):
  { defined: true, code: "VALIDATION" | "NOT_FOUND" | ..., status, message, data? }
curl -X POST http://localhost:61432/api/publisher/publish \
  -H 'content-type: application/json' \
  -d '{"document":{"title":"...","body":"...","channels":["rss"]}}'
```

This output is the quoted counterfactual made concrete: *"the free Scalar docs I never opened…
would have explained instantly"* — the RPC envelope, the 202-not-200 semantics (the response
says to poll `publisher.status`; a client awaiting a body "hangs" by design), and a paste-ready
correct request. The incident's 25 minutes reduce to three calls, ~40 lines of bounded output.

**Step 4 — where the agent goes next (activation surface E).** If the agent instead started
from symptoms — `get_recent_errors` or `doctor` — those outputs point at `get_operation_schema`
for the implicated service (05 §2E), so the entry point does not depend on the agent thinking of
OpenAPI at all.

## What this example is evidence for

- D2's meta-tool shape: three static tools covered the whole flow; no per-operation tool existed
  or was needed in context.
- D3's discovery: nothing above works without the manifest lane — step 1 is where the dynamic
  port dies as a failure class.
- D5's scope cut: at no point did the agent need MCP-side *execution* — the `curlExample`
  hand-off keeps the mutation in the agent's visible shell, where the human can see it.
- 05's activation claims: surfaces B (summaries naming the curl moment) and E (failure-path
  pointer) are the two plausible entry points in this transcript; both are testable at merge.
