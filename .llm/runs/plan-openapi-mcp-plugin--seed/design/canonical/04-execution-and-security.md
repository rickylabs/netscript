# Execution and Security (canonical design, rev 1)

> Draft — design document only. v1 ships **none of this section's tool**; it ships the design so
> that when the owner opts in (fork F2), implementation is a review of a written contract, not an
> improvisation. Writing it now is also the honest way to argue the risk (brief question 2).

## 1. The risk asymmetry, stated

Introspection reads a document the service already publishes on localhost — worst case, an agent
learns the shape of an API it could read in source anyway. Execution **mutates a live dev
database through the agent's hands**: a `POST /api/publisher/publish` invoked "to see what
happens" against the same DB the AppHost seeded, mid-run, on a machine that (today, literally)
is shared with a release orchestrator. The wave-four incident does not require execution to fix:
the 25 minutes were lost to not knowing the envelope, not to being unable to send requests —
`curl` sends requests fine once you know the shape, and `curlExample` (01) hands the agent that
shape. So v1 introspection captures most of the value at near-zero risk; execution is a genuine
second decision with real marginal danger. That is the security argument, written out.

## 2. `invoke_service_operation` (v2, gated)

Kind `mutate` — joining `execute_command`/`record_drift`, which already establishes the pattern:
mutate flows are policy-checked and receipt-writing.

Input:

```jsonc
{
  "type": "object",
  "properties": {
    "service":   { "type": "string" },
    "operation": { "type": "string" },          // id from list_service_operations
    "params":    { "type": "object" },          // path/query per the operation's request view
    "body":      { "type": "object" },
    "confirm":   { "type": "string" }           // required echo of the operation id for unsafe methods
  },
  "required": ["service", "operation"],
  "additionalProperties": false
}
```

Behavior: resolve via the endpoint directory (02) → validate `params`/`body` against the
projection's request view **before** sending (the projection doubles as the validator — no eval,
no generated code; contrast harsha's eval-of-generated-Zod, which we cite as the anti-pattern) →
send with bounded timeout and abort → return status, bounded response summary, and the response
schema view it matched. Every invocation writes a receipt (service, operation, method, status,
duration) via the same evidence machinery as `execute_command`.

## 3. Endpoint policy vocabulary

Mirrors `domain/command-policy.ts` in shape — a typed, injected policy object, deny-by-default:

```ts
export interface EndpointPolicy {
  readonly enabled: boolean;                       // master switch, default false
  readonly safeMethodsOnly: boolean;               // default true: GET/HEAD only
  readonly services: ReadonlyMap<string, ServiceEndpointPolicy>;  // absent service ⇒ deny
}
export interface ServiceEndpointPolicy {
  readonly allowUnsafe?: readonly string[];        // operation ids explicitly granted POST/PUT/…
  readonly deny?: readonly string[];               // wins over everything
}
```

- Off by default; enabling requires explicit config on the composition surface (`McpCliOptions`
  / `agent mcp` flag) — a human edit to the project, not an agent-reachable toggle. The MCP
  cannot grant itself execution (the #1078 lesson: one policy enforced at one choke point).
- `safeMethodsOnly` default means the first opt-in level is still read-shaped (GET with query
  params — the awslabs route-map insight that these are "tool-like" reads).
- Unsafe methods additionally require the `confirm` echo field — a deliberate two-key turn for
  the agent, cheap to satisfy consciously and hard to satisfy by pattern-matching accident.
- Deny rules are enforced in the *flow*, before transport, and are visible: a denied call
  returns the policy reason and the config path to change — teaching, not stonewalling.

## 4. Credentials and auth-protected endpoints

**The bridge never holds or forwards credentials.** No auth config on the MCP side, no
pass-through of agent-host env, no reuse of service-to-service tokens (which live inside the
AppHost graph, where this process is not). If an operation requires auth
(`define-service.ts:180-210` authz example), invocation returns the 401/403 with the schema view
and the statement that authenticated invocation is out of scope — the agent can still hand-build
an authenticated `curl` with the developer's explicit credentials, which keeps the human in
exactly the loop they are in today. Introspection of auth-guarded *specs* is [P3]'s subject
(01 failure envelopes). Revisiting credential support would be its own RFC with its own threat
model; this one names it out of scope rather than half-shipping it.

## 5. Threat model summary (introspection included)

| Threat | Posture |
| --- | --- |
| SSRF via crafted baseUrl/spec | loopback-only fetch adapter (02 §security); overrides are human config, size-capped, no redirects |
| Prompt-injection via spec contents (descriptions are attacker-influenceable if a service echoes user data into its contract — low but nonzero) | spec text is data: rendered into bounded result fields, never into tool *definitions* or instructions; house truncation applies |
| Agent mutating state through execution | §3 policy: default-off, safe-methods, per-operation allowlist, confirm echo, receipts |
| Credential leakage | none held (§4) |
| Stale/orphaned endpoint manifest directing traffic at a reused port | liveness = the spec fetch itself; pid/timestamp staleness flags (02); execution additionally re-fetches the spec and matches the operation before sending |
| Output flooding the context | central truncation (`mcp-server.ts:112`) + view-based schemas (03 §3) |

## 6. What the adversarial reviewer should attack here

Named openly: (a) is loopback-only actually enforceable across the URL-parse/DNS surface in
Deno's fetch, or does it need a socket-level check; (b) does `confirm` add real friction for a
frontier agent or only ceremony; (c) is the `params`-validation-before-send claim sound for
header parameters; (d) is denying auth entirely (rather than designing it) the right cut for a
tool meant to kill `curl`. These are the four places the generator is least certain.
