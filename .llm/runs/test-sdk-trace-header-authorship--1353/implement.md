# Implementation Prompt: SDK trace-header authorship proof

Implement the single locked slice in `plan.md`.

- Add explicit construction-time rejection cases for `traceparent`, `tracestate`, and
  `Traceparent`; assert the stable error code, construction phase, and offending contribution ID.
- Strengthen the isolated observability child to compose two unrelated headers in both orders.
- Prove retry and reconnect each emit CLIENT spans parented to the active logical-call parent.
- Match every wire `traceparent` span ID to the exported CLIENT span; assert exactly one
  `traceparent`, `rpc.system=orpc`, and `server.address`.
- Do not change SDK source or public exports unless the behavioral test is genuinely red.
- Preserve `deno.lock` and run only the approved gates.

