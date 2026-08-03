# Worked Example 1 — A hypothetical replay of the wave-four silent hang

> Draft — design document only. Rev 2 (S-23): **this walkthrough is hypothetical throughout.**
> What is measured (research.md §1): an agent's publish endpoint hung with no error, ~25 minutes
> of blind `curl` followed, and the agent wrote afterwards that the unread docs would have
> explained the RPC envelope. What is NOT in the evidence: the endpoint's actual response
> semantics, body, or causal chain — the 202/poll mechanism below is *one plausible mechanism
> consistent with the symptom*, invented for illustration, not recovered from incident
> artifacts. The example demonstrates what the tools would show for such a service; it is not
> evidence that the specific incident would have resolved in three calls. Service names and
> schemas are illustrative; every tool behavior shown is specified in
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

One call has already eliminated two expensive guesses: the port, and the existence/health of
the service (a `not_running` row here — 02's status mapping — would have ended that branch of
debugging in ten seconds).

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

For this hypothetical service, the output shows the class of fact the wave-four agent lacked:
the envelope, the async-semantics note (the response schema's own description says to poll
`publisher.status` — a client written to await a final result would wait on the wrong thing),
and a correct request template. The honest claim (S-23): the tools deliver the service's
declared contract in three bounded calls; whether that contract would have explained *the*
incident depends on what that service actually declared, which the evidence does not record.
The `curlExample` carries its `authNote` (01, S-24) — shape-ready, authorization not inferred.

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
