# S6 runtime evidence

The coordinator sequence is reproduced on the previous head: start the generated
Aspire AppHost before db init/generate/seed. orders health returns200 while
Overview/Records show unavailable and /examples/orders returns500. The route
exists; the resident service retained the init-only placeholder Prisma client.

With S6, public db generate on that same AppHost refreshes only orders and waits
for health. No manual service restart or full AppHost restart. All three routes
return200 and render Seed Order. A separate fresh scaffold proves the new placeholder
returns /health503 and Aspire Unhealthy before generation, then Healthy after
generation. A subsequent exact scoped wait/describe confirms shop-web Healthy too.

Browser proof:20 route/theme/viewport cases, real SQLite seeded rows visible in
cells/fields,0 page errors. Overview,Records,detail have no overflow. Existing
contract example /examples/orders has mobile horizontal overflow from its deferred
JSON block; it renders the real row successfully. The static CRUD pattern links to
the actual generated service route. See s6-browser.json and screens/s6-live/.

The scaffold.runtime probe now requires rendered Seed User cells/fields on
Overview,Records,and /examples/users. Negative tests reject unavailable shells,
HTTP200 without seed data,and hydration-only data. The CI suite generates a client before starting Aspire, then runs public db generate
again after start. It exercises refresh and seeded-row checks; the true placeholder-
first startup sequence is covered by the focused isolated Aspire red/green proof.

Full command `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
was attempted again: exit1, preflight.aspire failed; cleanup cannot enumerate Docker
because no daemon is available. No suite AppHost was started. Full runtime remains
UNPROVEN. The focused isolated Aspire/SQLite proof above does not replace that gate.
