# Scaffold runtime artifact evidence — 2026-08-05

Canonical command:

```text
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Generated project:
`.llm/tmp/cli-e2e/plugin-smoke-20260805-002750`

## Produced contract boundary

The generated root manifest contains:

```json
"@database/zod": "./database/postgres/schema/.generated/zod/crud.ts"
```

The produced aggregate contains the three symbols consumed by the generated contract:

```ts
export { UserSchema } from './schemas/models/User.schema.ts';
export { UserInputSchema as UserCreateInput } from './schemas/variants/input/User.input.ts';
export { UserUpdateInputObjectZodSchema as UserUpdateInput } from './schemas/objects/UserUpdateInput.schema.ts';
```

The produced `contracts/versions/v1/users.contract.ts` imports exactly:

```ts
import { UserCreateInput, UserSchema, UserUpdateInput } from '@database/zod';
```

Artifact hashes:

| Artifact | SHA-256 |
| --- | --- |
| generated `deno.json` | `86fa1a1200e170c88edc41be33cd83c880872db00c5b9a5d01cd8b2f10290612` |
| generated `crud.ts` | `bf38319cd2b4b056b68e169d95093e9770375077aaa568627d5569d6202c0e6e` |
| generated users contract | `ec171b66ac7de6715af05c84ee5806f1093d3de5778c9d5946af210a5133ab13` |
| structured suite log | `e8a7e33a7e8cc1387114228a01fec531183ea19dbd5d7e6e330045442840807b` |

## Runtime and compiler evidence

Extracted structured gate records:

| Gate | Verdict | Artifact observation |
| --- | --- | --- |
| `database.init` | passed | Prisma migration `init` was created and applied to the run-owned Postgres database. |
| `database.generate` | passed | Prisma client and Zod schemas were generated; `crud.ts` above exists with all contract symbols. |
| `generated.deno-check` | passed | Generated packages/plugins/services/database compiled from the produced workspace. |
| `behavior.service-health` | passed | Aspire resolved the live `users` endpoint and `/health` returned the expected healthy database check. |
| `cleanup.aspire-stop` | passed | The exact generated AppHost stopped successfully. |
| suite summary | 71 passed, 0 failed, 0 skipped | Run-created containers were identified and removed by the suite cleanup. |

This is artifact evidence: the generated import map, aggregate barrel, rendered contract, structured
gate records, and live health response are inspected together. Exit zero alone is not used as the
acceptance claim.

## Full workspace check dependency

The pristine app-inclusive `deno task check` on baseline reaches the generated contract without Zod
errors, then fails only at the separately tracked #1287 `QueryClientPort`/`QueryClient` boundary in
the generated dashboard showcase. This slice neither casts around nor absorbs #1287. Accordingly,
#1290 acceptance box 1 remains unearned until #1287 lands and the complete command is rerun.

