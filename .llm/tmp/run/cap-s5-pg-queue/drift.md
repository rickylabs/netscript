# S5 PostgreSQL Queue Adapter Drift

| Severity | Finding | Disposition |
| --- | --- | --- |
| minor | Deno rewrote unrelated `deno.lock` workspace metadata into `packageJson.dependencies` blocks while resolving/checking the new `pg` import. The generated diff included unrelated entries such as `@prisma/client`, `amqplib`, `clsx`, and `tailwind-merge`. | Restored unrelated lock churn and kept only the `pg` specifier plus `packages/queue` dependency lines. Frozen mode still reports the repo-wide lock-format migration as out of date, but accepting that churn would violate the S5 lock constraint. |
| follow-up | PGMQ (`https://github.com/pgmq/pgmq`) matches the PostgreSQL queue semantics NetScript wants: visibility timeout, delayed availability, and explicit delete/archive settlement. | Keep S5 self-contained because this slice is constrained to the already-catalogued `pg` dependency and cannot require extension or SQL-object installation. Consider adapting to PGMQ in a follow-up slice with explicit schema/extension provisioning, compatibility gates, and migration guidance. |
