# S6 exact-order runtime reproduction

At 1694559 (no S6 product edits), fresh maintainer init shop with app shop-web,
sqlite, service orders and model Order. Native service process uses the exact
generated Aspire argv (permissions, node-modules-dir=none, no watch), the generated
absolute SQLite file URL, and native/VITE discovery names. No source patches.

Control: db init/generate/seed BEFORE service start produces HTTP200 on /health,
/records, / and /examples/orders; all three app routes contain actual Seed Order.

Reproduction: start service/app BEFORE db init/generate/seed. All database commands
exit0. Service /health remains200. /records returns200 with Records unavailable and
no seeded row. /examples/orders returns500 (the route source exists). Service log:
`Cannot read properties of undefined (reading 'findMany')` in generated Prisma
repository list at procedure v1.orders.list. Init's placeholder PrismaClient has no
model delegate but its queryRawUnsafe no-op makes health succeed. The no-watch
service retains that placeholder after code generation. This reproduces the
coordinator's behavior without blaming discovery, procedure path or auth.

Fix must address database-client lifecycle and prove the same start-before-generate
sequence. The page's safe unavailable state is correct for the failing backend.
Also remove the unconditional CRUD view claim when no service exists, and add
explicit seeded-row assertions to the actual runtime gate. No READY yet.
