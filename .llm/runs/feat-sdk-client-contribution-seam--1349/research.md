# Research — #1349 [sdk-client S3] typed oRPC client-contribution seam

## Verdict up front: this is critical/complex and needs PLAN-EVAL

Not a bounded mechanical slice like #1591/#1458/#1452-S1. It is **RFC 0001 Stage 2** governed, carries
a normative amendment that *supersedes conflicting rows of its own issue body*, and its acceptance
spans tuple algebra, defaulted generics composing to an intersection, disjoint header-key ownership,
dependency ordering, a >16-contribution cap, cache modes, reconnect preparation, desktop rejection,
and a deterministic conflict-error taxonomy. `PLAN-EVAL: REQUIRED` — routed to
`qwen/qwen3.8-flash · max` per the post-#1792 policy.

## Source claims verified against the live tree (`main` `65cd8a077`), not taken on trust

- `packages/sdk/src/ports/service-client.ts:203-222` — `CreateServiceClientOptions` is exactly the
  claimed **nine closed fields** (`contract`, `serviceName`, `routerName`, `protocol`, `apiPath`,
  `apiVersion`, `port`, `timeout`, `propagateTraceContext`). No `headers`/`fetch`/`interceptors`/
  `plugins`/`link`/context parameter. **Confirmed.**
- `packages/sdk/src/ports/mod.ts` — does **not** export `ClientLinkPort`/`ClientLinkCallOptions`,
  while the module's own doc comment advertises "the transport seam". **Contradiction confirmed.**
- `packages/sdk/src/internal/` — **does not exist yet**; the RFC's mandated
  `src/internal/client-contributions/` adapter home is new ground.

## Two direct internal contradictions in the issue — resolved by its own precedence clause

The amendment banner states it "supersedes conflicting rows below". Two rows conflict with it, and an
implementer reading top-to-bottom would implement the **wrong** thing in both cases:

| # | "Target contract" row says | Amendment + Acceptance say | Resolution |
| --- | --- | --- | --- |
| 1 | §3: "**The transport seam is exported.** `createHttpClientLink` from `@netscript/sdk/client`; `ClientLinkPort`/`ClientLinkCallOptions` from `@netscript/sdk/ports`" | "must **not** publicly export `createHttpClientLink`, `ClientLinkPort`, `ClientLinkCallOptions`, or any internal adapter port"; acceptance: "neither … is publicly exported" | **Do NOT export.** Amendment wins; the acceptance checklist already reflects it. The `ports/mod.ts` doc-vs-export contradiction is therefore **not** closed by this issue. |
| 2 | §5: "**Dead options die.** `port` and `timeout` are removed from `CreateServiceClientOptions` and `DefineServiceConfig`" | "must keep `port` and `timeout` accepted/deprecated rather than remove them"; acceptance: "`port` and `timeout` remain accepted and deprecated. Their migration/no-op disposition belongs to **#1351**" | **Keep both, mark deprecated.** Removing them is #1351's call, not this leaf's. |

Recording these because they are the two highest-probability implementer traps in the issue, and both
are silent — each produces working code that fails acceptance.

## What the amendment actually narrows the scope to

Public surface: contribution **descriptors** + **tuple algebra**, and **defaulted** client/query
context generics. Implementation: a **stable-v1 private adapter** under
`packages/sdk/src/internal/client-contributions/`.

Explicitly **out**, per the amendment and the Boundaries section: the auth contribution (**#1352**),
moving trace propagation onto the chain (**#1353**), `safe`/`isDefinedError`/`baseContract` repair
(**#1350**), HTTP-method inference and GET dedupe policy (**#1351**), the in-process link-mode adapter
(**#451**), and — per acceptance — server handler/plugin forwarding and handler option typing, "out of
this client-seam leaf unless independently required by the RFC's private adapter". That last clause is
a conditional the plan must pin down rather than leave to interpretation.

## Open questions the plan must answer, and PLAN-EVAL must adjudicate

1. **Contribution power boundary.** Acceptance says contributions may do exactly three things —
   typed context projection, disjoint header keys/values, declared response-cache behaviour — and may
   **not** supply or observe fetch, link plugins, interceptor arrays, retry, dedupe, tracing, or the
   resolved HTTP method. The descriptor type must make the forbidden set *unrepresentable*, not merely
   undocumented.
2. **"Framework defaults become contributions" (§4) vs. the power boundary.** §4 wants retry, dedupe,
   and the CLIENT span composed "through the same public path, so there is no private fast lane" — but
   acceptance forbids contributions from supplying retry/dedupe/tracing. These are reconcilable only
   if the built-ins run through the *private* v1 adapter rather than the public descriptor type. The
   plan must state which, explicitly.
3. **Cap and ordering semantics.** ">16 contributions" and "invalid dependency ordering" need a
   defined ordering model (declaration order? declared `after`/`before`? topological?) before anyone
   can implement deterministic conflict errors.
4. **Desktop rejection.** `@netscript/sdk/desktop` builds a MessagePort `RPCLink`; which descriptor
   property marks a contribution desktop-incompatible, and is rejection construction-time?
5. **Isolated declarations.** Acceptance requires `publish:dry-run` green "with isolated declarations
   intact" — a real constraint on how much inference the tuple algebra may rely on.

## Recommendation

Do **not** dispatch an implementer against the issue as written. Produce a bounded plan that (a)
records the two contradictions and their resolutions, (b) answers or explicitly defers each of the
five open questions above, and (c) slices the work — the descriptor/tuple types and the private v1
adapter are separable from the conflict-taxonomy and cache-mode surface. Send that plan to PLAN-EVAL
on `qwen/qwen3.8-flash · max` before any implementation dispatch.
