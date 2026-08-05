# Context pack — #1310

Branch `fix/db-resident-connection-1310`, baseline `ed5e80f8a`. Plan D1–D6 is locked. Replace the
second AppHost with an explicit-start executable in the resident graph, fail fast without the
resident host, retire operation-AppHost generation, and make quickstart prove unique PGDATA
ownership plus post-teardown integrity. Preserve the foreign `deno.lock` modification.
