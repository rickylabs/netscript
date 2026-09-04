Product owner steer #5 — one defect, and the lesson behind it matters more than the fix.

## You hardcoded the REST prefix. The framework adds it for you.

`grep -c "path: '/api/v1"` → **23 in `billing.contract.ts`, 8 in `runs.contract.ts`**, e.g.

```ts
.route({ method: 'GET', path: '/api/v1/invoices' })
```

The MCP answers this on the first query. `find_guidance {"intent":"declare the route path and
version prefix for a service contract procedure without hardcoding /api/v1"}` → confidence **high**,
`pages/tutorials/workspace/05-route-authz`:

> "The route uses oRPC's `{workspace}` placeholder; **the default service REST mount adds `/api` at
> runtime.**"

and its canonical example carries no prefix at all:

```ts
.route({ method: 'GET', path: '/workspace/{workspace}/members' })
```

**Consequence:** the mount prepends `/api`, so your REST surface actually serves
`/api/api/v1/invoices`. Your generated OpenAPI and Scalar reference publish the doubled path, and the
typed client targets `<url>/api/rpc/v1/<service>` — so REST and RPC now disagree about where these
procedures live.

**Fix:** strip the `/api/v1` prefix from all 31 routes. Ask the MCP how the version segment is meant
to be expressed before you reintroduce one by hand — do not guess a second time. Then verify the
real served path against the running service rather than against your own source.

## The lesson — this is the third instance of the same failure

1. The `@database/zod` barrel shipped in the scaffold at commit 1, was aliased in `contracts/deno.json`
   from day one, and you hand-wrote ~80 schemas instead.
2. Your access policy was declared on every procedure while `createContractAuthorizer` — documented,
   one line — was never wired, leaving the money endpoints open.
3. Now the REST prefix, which the mount already adds.

Each one is the same shape: **the framework had already decided, and the decision was not asked
for.** That is precisely what this build is measuring, and it is the finding that would sink an
otherwise strong result.

So make it a hard rule for the rest of this build: **before you write any path, prefix, schema,
client, guard, or helper by hand, ask the MCP how NetScript expresses it — even when you are
confident.** `find_guidance {"intent":"<the thing in plain words>"}` costs one call. Log each lookup
and what it changed in your record; "I did not know it existed" is a useful adoption finding, and not
asking is not.

Everything in steer #4 still stands. Auth enforcement and transactions are landing — good. The saga
with terminal compensation remains the single most important open item.
