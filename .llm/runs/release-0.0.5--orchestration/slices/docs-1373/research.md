# Research: #1373

- Live issue contains 12 acceptance boxes. The dispatch abbreviates eight; this closing PR must
  also remove unresolved aliases, add the focused CLI assertion, and land both negative guards.
- The publishable source sweep contains 208 `.md`/`.vto` pages after excluding `_site` and private
  underscore directories. `_site` is generated and `_plan` is historical planning, not published.
- Ten published pages name `lib/api-clients.ts`; no CLI generator writes that aggregate.
- `quickstart.vto` calls Fresh `client.ts` a contract-derived client, while the shipped template is
  only CSS imports.
- `ServiceClientScaffolder` already writes `apps/<app>/lib/<service>.ts`, but reuses a template whose
  exports are fixed as `exampleService*`.
- All default scaffold consumers import those fixed symbols, so the template and consumers must
  change together using the existing `serviceName | camelCase` substitution.
- `createQueryFactories` produces cache-aware query factories with positional
  `queryOptions(input, options?)`; `createServiceQueryUtils` is the thin oRPC/TanStack remap with
  `queryOptions({ input })` and no server KV tier.
- The generated SDK reference is already a published page containing the legacy symbol, making it
  the honest single allow-listed page; its description must carry the distinction.
- Existing `docs:accuracy` has no guards for the retired module path, aliases, CSS misdescription,
  or one-page legacy API rule.
- #1374 owns compiling docs code blocks and is explicitly not acceptance for this milestone.

