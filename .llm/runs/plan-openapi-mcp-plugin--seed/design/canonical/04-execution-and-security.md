# Execution and Security (canonical design, rev 2)

> Draft — design document only. Rev 2 integrates Sol stage-2 findings S-1, S-2, S-3, S-5, S-6
> (`../../adversarial-triage.md`). v1 ships **none of this section's tool**; it ships the design
> so that when the owner opts in (fork F2), implementation is a review of a written contract,
> not an improvisation. Writing it now is also the honest way to argue the risk (brief
> question 2).

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
    "operation": { "type": "string" },   // id from list_service_operations
    "params": {                          // location-aware (S-5): no cross-location collisions,
      "type": "object",                  // headers representable
      "properties": {
        "path":    { "type": "object" },
        "query":   { "type": "object" },
        "headers": { "type": "object" }
      },
      "additionalProperties": false
    },
    "body":      {},                     // any JSON type — arrays/scalars are valid bodies (S-5)
    "confirm":   { "type": "string" }    // deliberate-action echo for unsafe methods (see §3)
  },
  "required": ["service", "operation"],
  "additionalProperties": false
}
```

Behavior: **canonicalize first (S-2)** — resolve `operation` to exactly one spec operation
(exact dotted id, else exact `METHOD path`); any ambiguity (including case-variant ids) refuses
with the candidates listed; every subsequent predicate — method safety, allow, deny, confirm —
evaluates only the canonical dotted id. Then resolve via the endpoint directory (02, including
the identity cross-check) → **validate before send (S-5)**: this is real work, not a free
by-product — a bounded validator for the OpenAPI 3.1 keyword subset oRPC actually emits
(internal `$ref`s, `oneOf`/`anyOf`/type arrays from Zod unions/nullables, string
length/pattern/format, numeric bounds), applied location-aware so a required `X-Tenant` header
or a same-named path/query pair is checked correctly. The existing MCP schema evaluator
(`packages/mcp/src/domain/schema.ts:33-83`) handles none of that and is explicitly **not** the
validator; its proof corpus must include required headers, cross-location name collisions,
unions/refs, and non-object bodies. No eval, no generated code (contrast harsha's
eval-of-generated-Zod, cited as the anti-pattern). Then send with bounded timeout and abort →
return status, bounded response summary, and the response schema view it matched. Every
invocation writes a receipt (service, canonical operation id, method, status, duration) via the
same evidence machinery as `execute_command` — after output validation, per the S-15 receipt
rule (01).

## 3. Endpoint policy vocabulary

Mirrors `domain/command-policy.ts` in shape — a typed, injected policy object, deny-by-default:

```ts
export interface EndpointPolicy {
  readonly enabled: boolean;                       // master switch, default false
  readonly safeMethodsOnly: boolean;               // default true: GET/HEAD only
  readonly services: ReadonlyMap<string, ServiceEndpointPolicy>;  // absent service ⇒ deny
}
export interface ServiceEndpointPolicy {
  readonly allowUnsafe?: readonly string[];        // canonical dotted ids granted POST/PUT/… (S-2)
  readonly deny?: readonly string[];               // canonical dotted ids; wins over everything
}
```

This interface is the *decoded* form; its external carrier is exactly the
`.netscript/agent-mcp.json` file defined in the first bullet below (`services` as a JSON object
decoded into the map), and
the decoder is the fail-closed boundary — no cast from raw JSON to this type exists (S-1).

- **The carrier is exact and fail-closed (S-1).** The policy (and the S-25 introspection
  exclusions) live in one file: `<project-root>/.netscript/agent-mcp.json`, read at composition
  by the `agent mcp` command and runtime-validated against a strict schema. Absent file →
  built-in disabled default. Unreadable, malformed, empty-object, or partially-valid file →
  **disabled**, plus a surfaced warning in tool output naming the parse failure (fail-closed is
  visible, not silent). The rev-1 sketch showed enabling JSON with no parser or flag to consume
  it — a switch that could never become true; the required end-to-end fixtures are: a valid
  enable reaches the single choke point, and absent / malformed / `{}` / partial all produce
  the disabled decision. This is a human edit to the project, not an agent-reachable toggle;
  the MCP cannot grant itself execution (the #1078 lesson: one policy enforced at one choke
  point).
- `safeMethodsOnly` default means the first opt-in level is still read-shaped (GET with query
  params — the awslabs route-map insight that these are "tool-like" reads). The method predicate
  reads the **resolved spec operation's** method — the tool input has no method field to spoof
  (defended check A2).
- Grants, denies, and `confirm` all compare against the **canonical dotted id only** (S-2); an
  alias appearing in a policy list is reported as a configuration error at load, not silently
  unmatched. Deny-wins is tested with aliases of one operation on opposing lists.
- **`confirm` is friction, not a control (S-3).** The echo is synthesizable by the same agent
  from the same request; it forces a deliberate token, nothing more. No security property is
  credited to it — authorization rests entirely on the policy — and tooling must never
  auto-retry a refused call by supplying the echo (the refusal text says so).
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
| Prompt-injection via spec contents (descriptions are attacker-influenceable if a service echoes user data into its contract — low but nonzero) | **Honestly bounded, not claimed away (S-6):** result text reaches the model's context regardless of which MCP field carries it (`mcp-server.ts:112-116`), so field placement is not a control. What the server *can* guarantee and test: injected instructions in spec prose never alter server-side behavior (no auto-invocation, no confirm auto-supply, no policy effect), spec prose never enters tool definitions or `initialize` instructions, and truncation bounds volume. The residual model-side risk — an agent *choosing* to follow injected text it reads — is documented as residual, which is one more reason execution defaults off and `confirm` is never auto-retried (S-3) |
| Agent mutating state through execution | §3 policy: default-off, safe-methods, per-operation allowlist, confirm echo, receipts |
| Credential leakage | none held (§4) |
| Stale/orphaned endpoint manifest directing traffic at a reused port | liveness = the spec fetch itself; pid/timestamp staleness flags (02); execution additionally re-fetches the spec and matches the operation before sending |
| Output flooding the context | central truncation (`mcp-server.ts:112`) + view-based schemas (03 §3) |

## 6. The four named uncertainties — reviewed outcomes (rev 2)

Rev 1 named four places of least certainty and offered them to the adversarial pass; all four
produced findings, integrated as follows: (a) loopback enforceability → S-4: guarantee narrowed
to literal-loopback + resolve-then-pin, socket-depth kept as debt (02); (b) `confirm` →
S-3: demoted to friction, no security credit (§3); (c) header-parameter validation → S-5:
location-aware input shape + a real validator with a named proof corpus (§2); (d) the no-auth
cut → S-24: kept as the v2 scope, but output stops implying executability where auth may exist
(01). The remaining open risk the generator still flags for PLAN-EVAL: the S-5 validator's
keyword subset must be re-derived from the *actual* oRPC emission at implementation time —
[P2]'s artifact is the input to that derivation.
