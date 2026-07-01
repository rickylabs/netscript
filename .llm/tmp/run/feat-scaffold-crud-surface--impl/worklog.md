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
