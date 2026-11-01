**[PHASE: RESEARCH] — live blocker reproduced**

The exact startup order reproduces the report at `1694559`: start the generated
SQLite/orders service and app first, then run db init/generate/seed (all exit 0).
Service health stays 200, Records shows unavailable, and `/examples/orders` returns
500. The route exists. The service log identifies `v1.orders.list`: `Cannot read
properties of undefined (reading 'findMany')`.

Cause: the no-watch service retains init's placeholder Prisma client after database
code generation. Starting the same unmodified scaffold after code generation renders
actual `Seed Order` rows on Overview, Records and the canonical example via the SDK.
Discovery, procedure routing and public auth work in that control. The repair must
refresh the affected running service after code generation and add live row proof.
PR remains draft; READY withheld.
