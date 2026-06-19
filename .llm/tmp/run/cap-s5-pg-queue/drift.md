# S5 PostgreSQL Queue Adapter Drift

| Severity | Finding | Disposition |
| --- | --- | --- |
| minor | Deno rewrote unrelated `deno.lock` workspace metadata into `packageJson.dependencies` blocks while resolving/checking the new `pg` import. The generated diff included unrelated entries such as `@prisma/client`, `amqplib`, `clsx`, and `tailwind-merge`. | Restored unrelated lock churn and kept only the `pg` specifier plus `packages/queue` dependency lines. Frozen mode still reports the repo-wide lock-format migration as out of date, but accepting that churn would violate the S5 lock constraint. |
