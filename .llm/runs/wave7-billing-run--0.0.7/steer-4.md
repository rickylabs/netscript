Product owner steer #4. A third MCP audit landed, on the data and contract layer. **Two blockers,
and one of them is the kind that survives review because the code claims a property it does not
have.** I verified every number below against your live tree just now.

## 1. BLOCKER — your access policy is declared on every procedure and enforced by nothing

`grep -rn "createContractAuthorizer|withAuthz|authorizer" services/` → **0**.

You declared `Roles.read/write/admin` with `authentication: 'required'` and
`roles: ['finance:admin']` on every procedure in `billing.contract.ts`. `defineService` in all three
services is called with **no `auth` option at all**. The MCP is explicit that this is opt-in:
*"Contract enforcement is opt-in… It activates only when an application passes a
`createContractAuthorizer(...)` result to `.withAuthz()`."*

So right now: `POST /api/v1/invoices/{id}/void` declares `finance:admin` and is **open to anyone who
can reach the port**. So are payments, usage ingestion and credit notes.

**This is the worst finding of the run, and not because of the hole.** The contract is the artifact
NetScript designates as the source of truth, and your OpenAPI document publishes those requirements
to every consumer. A reviewer reads the contract and concludes the money endpoints are guarded. They
are not. Every other finding is code that is worse than it should be; this is code that *lies*.

It also forges your audit trail. `context.principal` is always `undefined`, so all 10 sites that
write `actorId: context.principal?.subject ?? 'api'` take the fallback. **Every audit row records
`'api'` as the actor.** Once those rows exist in a real deployment, no later patch reconstructs who
voided which invoice.

You did the hard half — the metadata is on every procedure — and skipped the switch. The fix is one
file plus five lines:

```ts
// services/billing/src/auth.ts
export const authorizer = createContractAuthorizer(BillingContractV1);
// services/billing/src/main.ts
await defineService(router, { name: 'billing', …, auth: { authn: { authenticator }, authz: { authorizer } } });
```

`protect` defaults to `['/api']`, `allowAnonymous` to `['/health']`, `denyByDefault` is `true`. Then
delete every `?? 'api'` fallback and let `context.principal.subject` be required. Prove it the way
the MCP's own tutorial does: unauthenticated → **401**, wrong scope → **403**, correct scope →
**200**. That is also your ≥15 negative-authorization tests, which currently number zero.

## 2. BLOCKER — money mutations are not atomic, and idempotency turns a crash into silent loss

`grep -rn "withTransaction|\$transaction" services/` → **0**. Every multi-row money write is a bare
sequence of awaits. `@netscript/database` exports `withTransaction(client, fn, options)`.

`payInvoice` is the dangerous one. A crash between `payment.create` and `invoice.update` leaves a
**SUCCEEDED payment against an OPEN invoice** — and your idempotency key has already been claimed,
so the retry replays the stored success and the invoice is *never* marked paid. **The system keeps
the money and keeps billing.** That is exactly the "half-completed work is unacceptable" case this
whole product exists to solve, sitting in your own payment path.

Six sites need wrapping: `issueInvoice`, `voidInvoice`, `payInvoice`, `applyPlanChange`,
`creditNotes.create`, `customers.create`. The transaction must sit **inside** `withIdempotency`'s
operation callback, and `idempotency.ts` must take the `tx` client so the response row commits with
the payment. Use `{ isolationLevel: 'Serializable' }` for `applyPlanChange`.

This is blocked on one thing: you open the client from a module singleton in **40 places**
(`db.getClient()`), so there is nothing to inject a transaction into. Pass `db` to `defineService`
and use `context.db` — the MCP shows it directly. That also fixes `/health`, which currently reports
nothing about Postgres because the DB probe only wires when you pass `db`.

## 3. REGRESSION — you are removing framework primitives mid-edit

HEAD imported `paginationOffset`, `positiveInt`, `boundedString` from `@netscript/contracts`. Your
in-flight edit cut the import to `{ baseContract }` and replaced them with raw
`z.number().int().min(1).max(100)`. **Revert that.** Those are live exports, and
`@netscript/contracts/query` additionally ships `offsetPaginatedQuery`, `buildSearchCondition` and
`OffsetPaginationInputSchema` — you hand-rolled the `OR`/`contains`/`mode:'insensitive'` clause that
`buildSearchCondition` produces, and skip/take/count/hasMore three times.

Motion away from the framework is the opposite of what this build is measuring.

## 4. Errors: every client mistake is a 500

`grep -rn "errors\." services/` → **0**. You wrote seven bespoke `Error` subclasses and 33 throw
sites. `GET /invoices/{unknown}` returns **500**. Voiding a paid invoice returns **500**. A duplicate
idempotency key returns **500**. The MCP names this anti-pattern in its own tutorial and gives the
fix: `throw errors.NOT_FOUND({ message: … })` from the handler's `errors` object, which
`baseContract` already carries.

You also defined `BillingErrorEnvelopeSchemaV1` and never referenced it anywhere — a hand-rolled
parallel error vocabulary written and then not wired, while the real one shipped. Delete it.

## 5. The router does the work the domain layer exists for

`services/runs/` is clean. `services/billing/src/routers/v1.ts` is not, and its own header claims
*"Thin binding layer… All money semantics live in domain modules"* — while the same file sums the
credit ledger and formats money in `customers.get`, holds 16 of the 40 `db.getClient()` calls, and
copy-pastes the invoice-detail projection **four times**, 20 identical lines each. Five of nine
resources have no domain module at all.

Fix the header or fix the code. Do not leave a file describing itself as something it isn't.

## 6. Smaller, but fix while you are in there

- **Two money representations.** `Prisma.Decimal` for persistence, `BigInt` micros for arithmetic,
  converted by `.toString()` in ~30 unmarked places — and the two libraries round differently.
  `mappers.ts` claims *"No other module serializes money"*; the router does it twice. Give money one
  seam: `toDb` / `fromDb` in `lib/money.ts`, nothing else touching `Prisma.Decimal`. Note the MCP
  has **no** money opinion (`search_exports {"query":"money"}` → 0 results), so your string boundary
  is a legitimate choice — it just has to be single-seamed. Also: `services/runs/src/lib/money.ts`
  is a third copy of the rounding rules.
- **The generated client is imported by 4-level relative path in 10 sites**, several in files that
  already import `@ledgerline/db`. Use the alias.
- **The `prisma.config.ts` "headless-migrate workaround" is inert.** Neither `SHADOW_DATABASE_URL`
  nor `POSTGRES_SHADOW_URI` is set anywhere, so the spread evaluates to `{}` and the file is
  behaviourally identical to the scaffold — while the documented `netscript db init` / `db migrate`
  path plainly worked, and produced both your migrations. Either revert it or add a RECORD entry
  with the exact failing command and error. Do not leave 20 lines of dead config that the next
  reader will treat as load-bearing.

## Credit

No raw SQL anywhere in `services/`. `services/runs/` follows the documented service shape exactly.
Your idempotency module is genuinely Stripe-grade and correctly hand-rolled — the MCP confirms the
framework offers no general request-idempotency helper (all 86 hits are saga-scoped).

## Order

Auth enforcement (one file, five lines) → `context.db` injection → transactions on the six money
sites → revert the primitives regression → typed `errors.*` → domain modules for the five missing
resources. Then back to the saga and the web layer from steer #3.

`CONSTRUCTION-REFERENCE.md` is attached — how a real shipped NetScript dashboard is built, extracted
from eis-chat. Read it before you write the first product screen.
