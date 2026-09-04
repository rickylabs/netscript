Product owner steer. Your run stopped ~01:30 mid-task (type errors in generated models and a
`deps:verify` failure). Resume from there. Three things, in priority order.

## 1. DEFECT — you skipped the DB-derived contract approach, and your own comment claims otherwise

House rule 1 is "the database comes before the contract; generated DB-derived schemas feed the
contract. Do not hand-mirror a schema the framework already derives." Evidence from your tree:

- `prisma-zod-generator` **is** configured and **has** generated schemas into
  `database/postgres/schema/.generated/zod/` (Subscription, IdempotencyKey, CreditLedgerEntry, …).
- `contracts/versions/v1/billing.contract.ts` imports **zero** of them — `grep -c "generated/zod"`
  returns **0**.
- That file hand-writes **84** `z.enum(` / `z.object(` shapes instead.
- Nothing outside your own generation scripts consumes the generated output.

And the file's own header says *"the contract's Zod boundaries are derived from the database schemas
where a model crosses the boundary verbatim."* **That is a claim `git diff` falsifies** — precisely
the failure mode the brief told you to avoid.

Fix it: derive the contract's entity schemas from the generated Prisma-Zod models, narrowing with
`.pick(...).strict()` (or your equivalent) where the public surface is stricter than the table.
Hand-write only what genuinely does not exist in the database — request envelopes, computed
projections, money encodings. Then correct or delete any claim in a comment, README or record that
the diff does not support.

## 2. ALWAYS ask the MCP first — this is not optional

Before hand-rolling **anything**, and whenever you are unsure, query the NetScript MCP for the
idiomatic approach — even just to confirm. That includes: contract derivation from DB schemas, query
factories and cache invalidation, the managed form surface, saga compensation, durable streams,
resource/layer context, route groups, and the Fresh-UI registry and token seams. Use the Aspire MCP
for anything about the resource graph, health, telemetry or traces.

The single most repeated finding across every prior run in this series is agents rebuilding what the
framework already ships, because they never asked. You are already carrying one instance of it. In
your record, log the MCP lookups you make and what each changed — "I did not know it existed" is a
useful adoption finding; not asking is not.

## 3. The product definition is attached and its P0 items are non-negotiable

Your run-object thesis is **ratified** — I ran an independent market study and you landed on the
strongest finding in the category. PRODUCT-DEFINITION.md confirms it with primary sources and adds
what your thesis does not yet cover. The two I most expect you to under-build, because every prior
attempt did: **terminal compensation** (no build in this series has ever proved one reaching a
terminal state) and **never silently dropping a billable event** (quarantine with a reason code).

Note the explicit non-goals: no tax engine, no real processor, no ASC 606 allocation. A tenth entity
is worth less than a proved compensation.

Keep committing and pushing continuously.
