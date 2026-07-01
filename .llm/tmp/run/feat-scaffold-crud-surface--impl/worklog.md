## Worklog

### C1 contracts v1 subpath export

| Gate | Command | Result |
| --- | --- | --- |
| focused | `deno test --allow-all packages/cli/src/kernel/adapters/service/scaffolder_test.ts` | pass: 7 passed, 0 failed |
| check | `deno task check` | pass: 1879 files, 16 batches, 0 failed batches |


### C2 parameterized domain model + MySQL scaffold import fix

MySQL failing probe before fix: `deno test --allow-all packages/cli/src/kernel/templates/database/generators_test.ts` failed because `@netscript/database/scripts` was `undefined` in JSR mode while generated database scripts import it.

| Gate | Command | Result |
| --- | --- | --- |
| focused | `deno test --allow-all packages/cli/src/public/features/init/init-command_test.ts packages/cli/src/maintainer/features/init/init-command_test.ts packages/cli/src/kernel/templates/database/generators_test.ts packages/cli/src/kernel/adapters/database/scaffolder_test.ts` | pass: 9 tests / 12 steps, 0 failed |
| check | `deno task check` | pass: 1879 files, 16 batches, 0 failed batches |

### C3 generated Zod CRUD aliases + selected-engine @database/zod wiring

U1 probe evidence:
- Initial postgres Product probe generated `ProductSchema`, `ProductInputSchema`, and `ProductUpdateInputObjectZodSchema`; `deno check` for `ProductCreateInput`/`ProductUpdateInput` from the generator index failed with TS2305.
- Resolution path: generated alias barrel fallback in `schema/.generated/zod/crud.ts`, owned by `@netscript/database/scripts`, because the existing generator config did not cheaply rename input/result variants to the exact CRUD contract names.
- Post-fix postgres probe: `@database/zod` import of `ProductSchema`, `ProductCreateInput`, `ProductUpdateInput` checked successfully from `contracts/`.
- Post-fix sqlite probe: same import check passed with `@database/zod` wired to `database/sqlite/schema/.generated/zod/crud.ts`.

| Gate | Command | Result |
| --- | --- | --- |
| focused | `deno test --allow-all packages/database/tests/zod-crud-barrel_test.ts packages/cli/src/kernel/templates/workspace/generators_test.ts packages/cli/src/kernel/adapters/service/scaffolder_test.ts packages/cli/src/kernel/adapters/database/scaffolder_test.ts` | pass: 24 tests, 0 failed |
| probe | postgres throwaway `db:generate` + `deno check` import from `@database/zod` | pass |
| probe | sqlite throwaway `db:generate` + `deno check` import from `@database/zod` | pass |
| check | `deno task check` | pass: 1880 files, 16 batches, 0 failed batches |
