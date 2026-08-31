# Plan — #1349 [sdk-client S3] typed oRPC client-contribution seam

**PLAN-EVAL: REQUIRED** (`qwen/qwen3.8-flash · max`). This is RFC 0001 Stage 2 work with an
amendment that supersedes rows of its own issue body, a type-level algebra whose acceptance is
stated in terms of unrepresentability, and five open questions listed in `research.md`. It is
categorically unlike the mechanical leaves this lane has been shipping, and must not be dispatched
to an implementer on my judgement alone.

## Normative resolutions — the two issue-internal contradictions

The amendment banner "supersedes conflicting rows below". Both conflicts resolve **for the
amendment**; recording them as locked so no implementer follows the superseded prose:

- **LD-1.** `createHttpClientLink`, `ClientLinkPort`, and `ClientLinkCallOptions` stay **private**.
  "Target contract" §3 says to export them; the amendment and acceptance both forbid it. The
  `ports/mod.ts` doc-comment-vs-export contradiction is **not** closed by this leaf — leave it, and
  do not silently fix the doc comment either (that is unowned scope).
- **LD-2.** `port` and `timeout` are **kept and marked `@deprecated`**, not removed. "Target
  contract" §5 says remove; the amendment and acceptance say keep, and assign their disposition to
  **#1351**.

## Locked decisions (proposed — PLAN-EVAL to adjudicate)

- **LD-3.** Public surface is exactly: the contribution **descriptor** type, the **tuple** type
  algebra over it, and **defaulted** context generics —
  `ServiceClient<TContract, TContext = BaseServiceClientContext>` and
  `ServiceClientMethod<TInput, TOutput, TError, TContext = BaseServiceClientContext>`.
  `BaseServiceClientContext` is today's `ServiceClientContext` shape; `ServiceClientContext` survives
  as a `@deprecated` alias for one minor. Defaults must make every existing call site compile
  **unchanged** — that is a hard acceptance criterion, not a nicety.
- **LD-4.** The descriptor type makes the forbidden powers **unrepresentable**, not merely
  undocumented: it exposes only typed context projection, header key/value contribution, and declared
  response-cache behaviour. There is no field through which a contribution could supply or observe
  `fetch`, link plugins, interceptor arrays, retry, dedupe, tracing, or the resolved HTTP method.
- **LD-5 (resolves research Q2).** §4's "framework defaults become contributions" is satisfied
  through the **private v1 adapter**, not the public descriptor type. Retry, dedupe, and the CLIENT
  span compose via `src/internal/client-contributions/` using internal capabilities the public
  descriptor does not expose. This is the only reading consistent with LD-4; §4's "no private fast
  lane" is honoured in the sense that built-ins traverse the same *composition pipeline*, not that
  they are expressible as public descriptors.
- **LD-6 (resolves research Q3).** Ordering is **declaration order** in the tuple, with conflict
  detection over that order; no `after`/`before` dependency DSL in this leaf. "Invalid dependency
  ordering" is therefore an error raised when a contribution declares a dependency on a name that
  does not appear earlier in the tuple. The >16 cap is a construction-time check.
- **LD-7 (resolves research Q4).** Desktop incompatibility is a **declared boolean/enum on the
  descriptor**, checked at construction, consistent with the `environment` check in "Target
  contract" §7. Rejection is construction-time and names the offending descriptor.
- **LD-8 (resolves research Q5).** The tuple algebra must produce **explicitly annotated** public
  types compatible with `isolatedDeclarations`; inference-only helper types that cannot be emitted
  are not acceptable, since `publish:dry-run` is an acceptance gate.
- **LD-9.** Server-side handler/plugin forwarding and `ServiceHandlerPlugin` typing are **out of
  scope** unless the private adapter independently requires them. Default assumption: not required.
  Any perceived need is a rescope → stop and report, do not absorb.

## Proposed slicing

The acceptance is too broad for one dispatch. Proposed:

- **Slice 1 — types only.** Descriptor type, tuple algebra, defaulted context generics,
  `BaseServiceClientContext` + deprecated alias. No behaviour, no adapter. Type-assignability proofs
  including **negative** ones (a descriptor supplying `fetch` must not compile).
- **Slice 2 — private v1 adapter + composition.** `src/internal/client-contributions/`, built-ins
  routed through it, `with?:` accepted by `createServiceClient` with byte-identical behaviour when
  omitted.
- **Slice 3 — conflict taxonomy + cache modes + reconnect/desktop.** Duplicate names, header
  ownership collisions, unsupported contract versions, >16 cap, invalid ordering, desktop rejection —
  each with a deterministic error naming the conflicting descriptors, red-first negative tests, and
  the "removing a descriptor removes its effect" proof.

PLAN-EVAL should rule on whether this slicing is right, whether LD-5/LD-6/LD-7 are the correct
readings, and whether Slice 1's negative type proofs are sufficient to satisfy "unrepresentable".

## Ceiling (Slice 1 only, if the slicing is accepted)

- `packages/sdk/src/ports/service-client.ts`
- `packages/sdk/src/ports/mod.ts` (type exports only — **not** `ClientLinkPort`, per LD-1)
- `packages/sdk/tests/` — a new type-assignability test file
- No `packages/service/` file (LD-9). No `src/internal/` yet (Slice 2).

## Tier-A stop (Slice 1)

Scoped `check`/`lint`/`fmt` (`packages/sdk`); `packages/sdk` tests; `docs:exports-drift`;
`mcp-export-corpus`; `publish:dry-run` (isolated-declarations gate); `deno.lock` hash check.

**Known tooling gap (D-1):** `run-gate.ts`'s `check`/`lint`/`fmt-check` gates can return a
zero-byte-stdout `(cached, inputs unchanged)` receipt that certifies nothing. Check `stdout.bytes`;
re-run via direct `deno run` of the wrapper if the cache marker is present.

## Acceptance (Slice 1)

- [ ] Descriptor + tuple types published; forbidden powers unrepresentable, proven by negative
      type tests that fail to compile.
- [ ] Context generics default so every existing call site compiles unchanged.
- [ ] `ServiceClientContext` retained as a `@deprecated` alias.
- [ ] `port`/`timeout` still accepted, now `@deprecated` (LD-2).
- [ ] `createHttpClientLink`/`ClientLinkPort`/`ClientLinkCallOptions` still private (LD-1).
- [ ] `publish:dry-run` green with isolated declarations intact.
- [ ] `Refs #1349` — partial, no closing keyword; remaining slices stated in the PR body.
