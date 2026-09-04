Product owner correction to steer #6 — **the hard stop is lifted.**

Do **not** freeze backend work. Parallelise: fan out sub-agents and advance frontend and backend at
once. Steer #6's frontend list stays exactly as written and remains the highest priority, because it
is the part that does not exist — but it is a priority, not an exclusion.

**Both halves must be enterprise grade and NetScript-idiomatic.** The bar is the same on each side:
no hand-rolled solution where the framework ships a seam, no claim the diff cannot support, and
every reachable state designed.

The rule that governs both, restated because it has already produced four defects in this build:
**ask the MCP how NetScript expresses a thing before you write it by hand — even when you are
confident.** `find_guidance {"intent":"<the thing in plain words>"}`. Those four were the
`@database/zod` barrel you hand-mirrored, the authorizer you declared and never wired, the `/api/v1`
prefix the mount already adds, and the framework contract primitives you replaced with raw zod.
Every one was one call away.

Per-seam, the idiomatic surface you are accountable for:

- **Contract** — derived from `@database/zod`, `baseContract` error map, `@netscript/contracts/query`
  pagination helpers, no hardcoded prefix.
- **Service** — `defineService` with `db` passed and `auth: { authn, authz }` wired, `context.db`
  injection rather than a module singleton, typed `errors.*` instead of bare `Error`.
- **Domain** — one module per resource, transactional money writes, one money seam.
- **Durable** — sagas with `.correlate()` and terminal `sagaFail`, typed jobs, scheduled triggers,
  the HMAC verifier not `memory`, proof read back from the sagas instances API.
- **Streams** — producer plus the browser half via `@netscript/fresh/streams`, durable storage set.
- **Web** — `.withResource`/`.withLayer`, region triples, cache-only page loaders with authoritative
  partials, two-tier invalidation, typed path and search params, small islands fed by props,
  `.withForm()` with CSRF and submission id, `createQueryCollection` for optimistic UI.
- **Design** — token source rewritten in both files, your components registered in the gallery,
  overrides through `data-*`/`class`/per-surface CSS, never a fork or a parallel stylesheet.
- **Observability** — `createJobTools`, `withChildSpan`, `traceparent` through the saga, JSON logs.
- **Tests** — every mutating procedure, ≥15 negative-authorization, and the compensation.

I am running continuous MCP-backed seam audits against your tree and will send findings as they
land. Keep committing and pushing after each unit of work so the audits see real state.
